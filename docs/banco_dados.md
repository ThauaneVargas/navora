# Banco de Dados — Arquitetura e Modelagem

> Gerado a partir do schema real: `backend-nest/prisma/schema.prisma` (16 models, PostgreSQL via Prisma). Para o pipeline de navegação/acesso que usa estas tabelas, ver `docs/ARCHITECTURE.md`. Para os endpoints que leem/escrevem cada tabela, ver `docs/API.md`.

## 1. Visão geral

- **SGBD:** PostgreSQL. **ORM:** Prisma Client.
- **Convenção:** nomes de modelo/campo em `camelCase` no código, mapeados para `snake_case` nas tabelas reais via `@map`/`@@map` (ex.: `patientCode` → coluna `patient_code`, model `PatientProfile` → tabela `patient_profiles`).
- **Migrations:** incrementais em `backend-nest/prisma/migrations/`, aplicadas com `prisma migrate deploy` (produção) / `prisma migrate dev` (local).
- **Seed:** `backend-nest/prisma/seed.ts`, idempotente via `upsert` — pode rodar várias vezes sem duplicar dados.
- Produção (Render) está com o schema **desatualizado** em relação à branch atual (faltam a tabela `notifications` e colunas `google_id`/`password_reset_token`/`password_reset_expires` em `users` — ver nota de versão no `CLAUDE.md`).

## 2. Diagrama Entidade-Relacionamento

```mermaid
erDiagram
  USER ||--o| PATIENT_PROFILE : "1:0..1"
  USER ||--o| STAFF_PROFILE : "1:0..1"
  USER ||--o{ NOTIFICATION : "1:N"
  USER ||--o{ CHECK_IN : "1:N (opcional)"

  STAFF_PROFILE }o--o| SECTOR : "trabalha em"

  HOSPITAL_AREA ||--o{ ENTRANCE : "1:N"
  HOSPITAL_AREA ||--o{ SECTOR : "1:N"
  HOSPITAL_AREA ||--o{ NAVIGATION_NODE : "1:N"
  HOSPITAL_AREA ||--o{ DESTINATION : "1:N"
  HOSPITAL_AREA ||--o{ ACCESS_RULE : "1:N"

  SECTOR ||--o{ NAVIGATION_NODE : "1:N"
  SECTOR ||--o{ DESTINATION : "1:N"
  SECTOR ||--o{ ACCESS_RULE : "1:N"
  SECTOR ||--o{ CHECK_IN : "1:N (opcional)"

  NAVIGATION_NODE ||--o{ ENTRANCE : "1:N"
  NAVIGATION_NODE ||--o{ DESTINATION : "1:N"
  NAVIGATION_NODE ||--o{ BEACON : "1:N"
  NAVIGATION_NODE ||--o{ ROUTE_EDGE : "origem (from)"
  NAVIGATION_NODE ||--o{ ROUTE_EDGE : "destino (to)"

  DESTINATION ||--o{ ACCESS_RULE : "1:N (opcional)"
  DESTINATION ||--o{ ACCESS_RULE : "fallback (opcional)"
  DESTINATION ||--o{ ACCESS_WINDOW : "fallback (opcional)"
  DESTINATION ||--o{ VISITOR_ACCESS_REQUEST : "1:N (opcional)"
  DESTINATION ||--o{ CHECK_IN : "1:N (opcional)"

  ACCESS_RULE ||--o{ ACCESS_WINDOW : "1:N"

  VISITOR_ACCESS_REQUEST ||--o{ CHECK_IN : "1:N (opcional)"

  USER {
    int id PK
    string email UK
    string passwordHash
    string googleId UK "opcional"
    string name
    string phone "opcional"
    UserRole role "PATIENT | RECEPTION | ADMIN"
    boolean active
    string passwordResetToken UK "opcional"
    datetime passwordResetExpires "opcional"
  }

  PATIENT_PROFILE {
    int id PK
    int userId FK "UK, 1:1 com User"
    string patientCode UK "opcional"
    datetime birthDate "opcional"
    json accessibility "default {}"
    string emergencyContact "opcional"
  }

  STAFF_PROFILE {
    int id PK
    int userId FK "UK, 1:1 com User"
    string jobTitle "opcional"
    int sectorId FK "opcional"
    boolean active
  }

  CALL_REQUEST {
    int id PK
    string userType "patient | visitor, sem FK"
    string userName
    string patientName
    CallType callType "HELP | SOS | LOST | ..."
    string location
    string sector
    string beaconCode "opcional"
    string emergencyContact "opcional"
    CallStatus status "PENDING default"
    Priority priority "MEDIUM default"
  }

  VISITOR_ACCESS_REQUEST {
    int id PK
    string visitorName
    string areaId
    int destinationId FK "opcional"
    VisitorAccessStatus status
    datetime authorizedAt "opcional"
    datetime expiresAt "opcional"
    datetime finishedAt "opcional"
  }

  BEACON {
    int id PK
    string code UK
    int navigationNodeId FK "opcional"
    int battery "default 100"
    datetime lastSignalAt
  }

  HOSPITAL_AREA {
    int id PK
    string code UK
    string name
  }

  ENTRANCE {
    int id PK
    string code UK
    int areaId FK
    int navigationNodeId FK "opcional"
  }

  SECTOR {
    int id PK
    string code UK
    int areaId FK "opcional"
  }

  NAVIGATION_NODE {
    int id PK
    string code UK
    NavigationNodeType type
    float x "opcional, abstrato"
    float y "opcional, abstrato"
    int areaId FK "opcional"
    int sectorId FK "opcional"
  }

  ROUTE_EDGE {
    int id PK
    int fromNodeId FK
    int toNodeId FK
    float distanceMeters
    boolean accessible
    RouteType routeType
    boolean wheelchairAccessible
    boolean stretcherAccessible
    boolean bidirectional
  }

  DESTINATION {
    int id PK
    string code UK
    string category
    string accessLevel "default public"
    int areaId FK "opcional"
    int sectorId FK "opcional"
    int navigationNodeId FK "opcional"
  }

  ACCESS_RULE {
    int id PK
    string code UK
    AccessSubject subject "PATIENT | VISITOR | EXTERNAL_PATIENT"
    AccessRuleScope scope
    AccessDecision decision "opcional"
    int fallbackDestinationId FK "opcional"
  }

  ACCESS_WINDOW {
    int id PK
    int ruleId FK
    string startTime
    string endTime
    AccessDecision insideDecision
    AccessDecision outsideDecision
  }

  CHECK_IN {
    int id PK
    string patientName
    CheckInStatus status
    int userId FK "opcional"
    int destinationId FK "opcional"
    int visitorAccessRequestId FK "opcional"
  }

  NOTIFICATION {
    int id PK
    int userId FK
    NotificationCategory category "NAVIGATION | ACCESS | HELP_SOS"
    boolean read
  }

  OPERATIONAL_MESSAGE {
    int id PK
    string recipient
    string content
    string priority
    string direction
  }
```

## 3. Domínios e decisões de modelagem

### 3.1 Identidade — `User`, `PatientProfile`, `StaffProfile`
- `User` concentra autenticação (e-mail, hash de senha, `googleId` opcional p/ login social, tokens de reset de senha) e é a única tabela com `role` (`PATIENT`/`RECEPTION`/`ADMIN`).
- `PatientProfile` e `StaffProfile` são **extensões 1:1 opcionais** de `User`, não um `role` por si — um `User` com `role = PATIENT` tem exatamente um `PatientProfile`; um `User` de recepção/admin não precisa de nenhum dos dois.
- `accessibility` em `PatientProfile` é `Json` livre (não uma tabela normalizada) porque o conjunto de flags é pequeno, muda com frequência e nunca é consultado por SQL — normalizar custaria mais do que ajuda.
- `StaffProfile` existe no schema mas **não tem tela no mobile** (confirma a regra de escopo: só Paciente e Visitante no app) — é suporte a dados pra quando/se o `web-admin` precisar listar equipe por setor.

### 3.2 Chamados — `CallRequest`
- **Decisão deliberada:** `CallRequest` não tem foreign key para `User`. Os dados de quem chamou (`userName`, `patientName`) são campos de texto soltos, duplicados no momento da criação.
- Motivo: SOS e "Preciso de ajuda" precisam funcionar mesmo pra quem está no fluxo de **acesso rápido sem conta** (`PatientQuickRegisterScreen`, `quick: true`) ou em modo offline (fallback de `navigationAdapter.js` gera um `CallRequest` local). Exigir FK pra `User` quebraria esse caso de uso central do app.
- Trade-off aceito: não há como consultar "todos os chamados deste paciente" por join; se isso vier a ser necessário, seria preciso adicionar um `userId` opcional sem remover os campos de texto (manter compatibilidade com chamados anônimos).

### 3.3 Grafo de navegação — `HospitalArea` → `Sector`/`Entrance`/`NavigationNode` → `RouteEdge`/`Destination`
- Modelo de grafo clássico: `NavigationNode` são os vértices (entradas, recepção, salas, corredores, elevadores, banheiros, saídas — `NavigationNodeType`); `RouteEdge` são as arestas, com peso (`distanceMeters`) e metadados de acessibilidade (`accessible`, `wheelchairAccessible`, `stretcherAccessible`, `routeType`).
- `RouteEdge.bidirectional` evita duplicar linha para corredores de dois sentidos; uma aresta unidirecional (`bidirectional: false`) só permite `from → to`.
- `@@unique([fromNodeId, toNodeId])` impede duas arestas diretas entre o mesmo par de nós no mesmo sentido.
- `x`/`y`/`z` em `NavigationNode` são coordenadas **abstratas** pro mapa esquemático (`MapScreen.js`), sem escala física validada — não confundir com coordenadas GPS reais (essas só existem em `ExternalRouteScreen.js`/`HowToGetScreen.js`, via `expo-location`, fora do banco).
- `Destination.accessLevel` (`public` por padrão) e as tabelas `AccessRule`/`AccessWindow` formam o motor de permissão: uma regra pode decidir `ALLOW`/`BLOCK`/`REQUIRE_AUTHORIZATION`/`REDIRECT_TO_RECEPTION` por área, setor, destino, categoria ou nível de acesso, com janelas de horário (`AccessWindow`) que podem inverter a decisão dentro/fora do horário.

### 3.4 Acesso de visitante — `VisitorAccessRequest`
- Guarda o pedido inteiro (quem, onde, destino pretendido, motivo, status) numa única tabela, sem normalizar em tabelas satélite — reflete que é um fluxo de vida curta (pedido → aprovação/negação → expiração/fim), não um cadastro permanente.
- `status` tem bem mais estados do que `CallRequest` (`PENDING, APPROVED, DENIED, CANCELED, EXPIRED, WAITING_AUTHORIZATION, AUTHORIZED, IN_ROUTE, ARRIVED, OFF_ROUTE, FINISHED`) porque acompanha o visitante do pedido até a saída do hospital, não só a triagem inicial.
- `destinationId` é opcional porque o pedido pode ser criado antes de um destino específico existir no grafo (ex.: "visitar paciente internado", sem destino de navegação formal ainda).

### 3.5 Beacon — `Beacon`
- Tabela deliberadamente simples (`code`, área, `navigationNodeId` opcional, `battery`, `lastSignalAt`) porque hoje é alimentada por simulação (`POST /beacons/detect` recebe um código arbitrário digitado/simulado, não um scan BLE real).
- `navigationNodeId` opcional existe porque um beacon pode ser cadastrado antes de ter um ponto de navegação associado (compatibilidade testada em `beacons.service.spec.ts`: "beacon conhecido sem node detecta").
- Preparada para o hardware real **Feasycom FSC-BP104D** (ver `docs/BLE_HARDWARE_VALIDATION.md`) — já existe uma linha de seed (`FSC-04-01`) vinculada à entrada Private, pronta pro dia em que o scanner real existir.

### 3.6 Notificações — `Notification`
- Única tabela com FK direta e obrigatória para `User` (sem suporte a notificação anônima — faz sentido, não existe "notificar alguém sem conta").
- `category` (`NAVIGATION`/`ACCESS`/`HELP_SOS`) é um enum fechado, não uma tabela de categorias — o conjunto é pequeno e estável.

## 4. Normalização e limitações conhecidas

- O schema está majoritariamente em 3FN, com duas fugas deliberadas (documentadas acima): `CallRequest` sem FK de usuário, e `accessibility` como `Json` em vez de tabela.
- `RouteEdge.distanceMeters` sem valor pode gerar "inconsistência controlada" (caso coberto no teste `edge sem distanceMeters e inconsistencia controlada`) — o sistema não trava, mas o resultado não é confiável; não há `NOT NULL` + `CHECK` no banco pra isso hoje.
- Seed atual (ver `docs/ARCHITECTURE.md`): 25 nós, 23 arestas (21 `CORRIDOR`, 2 `ELEVATOR`, nenhuma `RAMP`/`STAIRS`/`DOOR`/`TRANSFER` ainda), 21 destinos, 2 entradas, 6 beacons (5 simulados + `FSC-04-01`), 2 andares. `surgery-center` é isolado de propósito, pra representar destino restrito sem rota demonstrável.

# Casos de Teste — Navora

> Catálogo extraído dos testes que **já existem e já passam** no backend (`backend-nest/src/**/*.spec.ts`), mais os casos manuais cobrindo fluxos do mobile que ainda não têm automação. Última execução (20/10/2026): `npm test` → **15/15 suítes passando**; `npm run test:e2e` → **4/4 passando** (depois da correção do rate limit, ver §4).

## 1. Estratégia de teste

- **Unitário (`npm test`):** scripts `ts-node` com `node:assert`/`node:assert/strict`, não Jest. Cada arquivo monta um "harness" (repositório Prisma fake em memória) e roda um `run()` sequencial com várias asserções, terminando em `console.log('<módulo> tests passed')`. Trade-off aceito: sem reporter de falha granular por `it()`, mas zero dependência de framework de teste.
- **E2E (`npm run test:e2e`):** scripts separados que batem num backend real (precisa de Postgres rodando). Cobre `auth+roles+validation+dashboard`, `navigation`, `beacons`, `calls+visitor-access+check-ins+operational-messages+reports+patients`.
- **Mobile:** sem suíte automatizada hoje. Os casos abaixo (§3) foram validados manualmente, alguns com `curl` direto contra o backend local reproduzindo o payload exato que a tela monta (sessão de 16/10 e 20/10).

## 2. Casos de teste automatizados (unitários — já existem, já passam)

### 2.1 Autenticação (`auth/auth.service.spec.ts`, `auth/admin-authorization.spec.ts`)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-01 | Login válido | Retorna token (`login valido retorna token`) e papel do usuário (`login valido retorna role`) |
| CT-02 | Resposta de login | Nunca inclui `passwordHash` (`login nao serializa passwordHash`) |
| CT-03 | Token válido | `JwtAuthGuard` aceita e injeta o usuário autenticado (`JwtAuthGuard aceita token valido`, `JwtAuthGuard injeta usuario`) |
| CT-04 | `GET /auth/me` | Retorna o usuário autenticado sem `passwordHash` |
| CT-05 | Rota administrativa sem guard | Falha o teste se algum controller sensível não tiver `JwtAuthGuard`/`RolesGuard` (`endpoint administrativo exige JwtAuthGuard/RolesGuard`) |
| CT-06 | Rota pública | Confirma que rotas de health/login não exigem guard (`endpoint publico nao deve exigir guard`) |

### 2.2 Pacientes (`patients/patients.service.spec.ts`)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-07 | Cadastro completo | Cria `User` com `role = PATIENT` e `PatientProfile`; e-mail normalizado (minúsculo/trim); senha chega hasheada e nunca em texto puro |
| CT-08 | `accessibility` no cadastro | Ignora chaves não permitidas (`accessibility ignora campos nao permitidos`) |
| CT-09 | Login após cadastro | Funciona com a mesma senha enviada no cadastro |
| CT-10 | `GET /patients/me` | Retorna o profile completo, sem `passwordHash` |
| CT-11 | `PUT /patients/me` | Atualiza `User` (nome) e `PatientProfile`; **permite limpar** `birthDate` (enviar null) |
| CT-12 | `PUT /patients/me/accessibility` | Mescla com as preferências já salvas, não substitui o objeto inteiro |

> Esta é exatamente a rota (`PUT /patients/me`) usada pela correção de edição de perfil do item 15 do `CLAUDE.md` — CT-11/CT-12 já garantiam o contrato antes da tela mobile existir.

### 2.3 Beacons (`beacons/beacons.service.spec.ts`)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-13 | Beacon conhecido com nó de navegação | `detected: true`, retorna `navigation_node` e `origin_node_code` |
| CT-14 | Beacon conhecido sem nó de navegação | Ainda detecta; `origin_node_code` vem `null`; compatibilidade com campos antigos (`area`, `entrance`) preservada |
| CT-15 | Beacon desconhecido | `{ detected: false }` |
| CT-16 | Listagem (`GET /beacons`) | Inclui `origin_node_code` em cada item |

### 2.4 Navegação — acesso (`navigation/navigation-access.service.spec.ts`)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-17 | Janela de horário (`AccessWindow`) | Decisão correta dentro e fora da janela configurada (`Dentro da janela.`/`Fora da janela.`) |

### 2.5 Navegação — roteamento/Dijkstra (`navigation/navigation-routing.service.spec.ts`, 30+ asserções)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-18 | Rota simples | Uma única edge entre origem e destino é encontrada e soma `distanceMeters` corretamente |
| CT-19 | Múltiplos caminhos | Dijkstra escolhe o de menor custo (`Dijkstra escolhe menor caminho entre multiplas opcoes`) |
| CT-20 | Mesma origem e destino | Retorna rota trivial, sem erro |
| CT-21 | Sem rota possível | `route_found: false`, sem crash |
| CT-22 | Edge inacessível | Rota normal pode usá-la; rota **acessível** a ignora (`edge inacessivel e ignorada` / `rota normal pode usar edge inacessivel`) |
| CT-23 | Edge unidirecional | Permite `from → to`, bloqueia `to → from`; `bidirectional: true` permite os dois sentidos |
| CT-24 | `wheelchair: true` | Descarta edges com `wheelchairAccessible: false` |
| CT-25 | `needsStretcher: true` | Descarta edges com `stretcherAccessible: false` |
| CT-26 | `avoidStairs` true/false | `true` descarta `STAIRS`; `false` permite se os demais requisitos permitirem |
| CT-27 | Combinação de preferências | `wheelchair + avoidStairs` e `stretcher + wheelchair` aplicam regras cumulativas, não só a última |
| CT-28 | Preferências sem efeito topológico (ainda) | `preferElevator`, `voiceGuidance`, `largerText`, `highContrast` não alteram a rota calculada (contrato preservado, efeito pendente — ver `docs/requisitos.md` RF-40) |
| CT-29 | `PatientProfile` vs. preferência do cliente | Perfil salvo do paciente prevalece sobre o que o app mandar na requisição |
| CT-30 | `EXTERNAL_PATIENT`/`VISITOR` | Usam acessibilidade **temporária** (da requisição), não um perfil salvo |
| CT-31 | Decisão `BLOCK` | Não executa Dijkstra |
| CT-32 | Decisão `REQUIRE_AUTHORIZATION` | Não calcula rota normal sem autorização válida |
| CT-33 | Decisão `REDIRECT_TO_RECEPTION`/`REDIRECT` | Calcula rota para o destino efetivo (fallback), respeitando acessibilidade nesse destino |
| CT-34 | Nó isolado (`surgery-center`) | Não causa crash ao tentar rotear até ele sem conexão |
| CT-35 | Serialização | `routeType` default serializa como `CORRIDOR`; `wheelchairAccessible`/`stretcherAccessible` default `true`; campo legado `accessible` continua presente |
| CT-36 | Edge sem `distanceMeters` | Tratado como inconsistência controlada, não derruba o cálculo |

### 2.6 Navegação — instruções (`navigation/navigation-instructions.service.spec.ts`)

| ID | Caso | Resultado esperado |
|---|---|---|
| CT-37 | Prioridade de texto da instrução | Texto explícito da edge > texto do nó > fallback neutro |
| CT-38 | Mudança de andar | Gera tipo de instrução específico (ex.: "Use o elevador e suba até...") |
| CT-39 | Rota de um único nó | Gera apenas a instrução de chegada |
| CT-40 | Último passo | Sempre é o destino final, tipo `ARRIVAL` |

### 2.7 Demais módulos (passam, cobertura básica confirmada)

| Módulo | Arquivo | O que cobre |
|---|---|---|
| Chamados | `calls/calls.service.spec.ts` | Criação de `CallRequest` com dados de paciente/área |
| Acesso de visitante | `visitor-access/visitor-access.service.spec.ts` | Ciclo de pedido (criação, autorização, negação, liberação de rota) |
| Check-ins | `check-ins/check-ins.service.spec.ts` | Criação e consulta de check-in |
| Dashboard | `dashboard/dashboard.service.spec.ts` | Resumo agregado |
| Mensagens operacionais | `operational-messages/operational-messages.service.spec.ts` | Criação e leitura |
| Relatórios | `reports/reports.service.spec.ts` | Geração de relatório admin |
| Notificações (serviço) | `notifications/notifications.service.spec.ts` | Isolamento por usuário (`findAll isolates notifications per user`, `other user sees only their own`), categorias, `createdAt` em ISO |
| Notificações (controller) | `notifications/notifications.controller.spec.ts` | Contrato HTTP do controller |

> **Achado e corrigido nesta sessão (20/10):** `notifications.service.spec.ts` e `notifications.controller.spec.ts` existiam mas **não estavam no script `test`** do `package.json` — rodavam isolados, fora do `npm test` padrão. Adicionados ao script; `npm test` agora roda **15/15** suítes (eram 13).
>
> **Achado e corrigido nesta sessão (20/10):** `npm run lint` **nunca funcionou** — o projeto tem `eslint`/`@typescript-eslint` instalados desde sempre, mas nenhum arquivo de configuração (nem o formato antigo `.eslintrc`, nem o `eslint.config.js` que o ESLint 9+ exige). Criado `backend-nest/eslint.config.js` (flat config, TS + regras recomendadas, `no-explicit-any` como aviso por ser comum em DTO/teste). Resultado: **0 erros, 161 avisos** (todos `any` em arquivos de teste). Dois erros reais encontrados no caminho foram corrigidos: tipo `Function` (inseguro) trocado por um alias `AnyFunction` em `admin-authorization.spec.ts` — teste reexecutado e continua passando.

## 3. Casos de teste manuais — mobile (sem automação ainda)

Validados via `curl` reproduzindo o payload exato que a tela monta (contra backend local, nunca produção), nas sessões de 16/10 e 20/10.

| ID | Fluxo | Pré-condição | Passos | Resultado esperado | Validado |
|---|---|---|---|---|---|
| CTM-01 | Cadastro completo | Nenhuma | `POST /patients/register` com nome/e-mail/senha/CPF/nascimento/acessibilidade/contato de emergência | `201`, token retornado, `GET /patients/me` reflete os dados | ✅ 20/10 |
| CTM-02 | Editar perfil (telefone) | Conta criada (CTM-01) | `PUT /patients/me` reenviando todos os campos, telefone alterado | `200`; telefone muda; **acessibilidade salva não é zerada** | ✅ 20/10 |
| CTM-03 | Bug antigo confirmado | Conta criada (CTM-01) | Chamar `POST /patients/register` de novo com o mesmo e-mail (comportamento do `ProfileScreen` antes da correção) | `409 Conflict "E-mail ja cadastrado"` — confirma que o bug era real antes da correção do item 15 | ✅ 20/10 |
| CTM-04 | Beacon simulado reconhecido | Seed rodado | `POST /beacons/detect` com `beaconCode: "FSC-04-01"` | `detected: true`, área `private`, nó `private-entry` | ✅ 20/10 |
| CTM-05 | "Primeiro acesso" preenche cadastro | App aberto, sem conta | `PatientAccessChoiceScreen` → "Primeiro acesso" → nome/telefone/nascimento → "Continuar" | Abre `PatientRegisterScreen` com os 3 campos já preenchidos, pedindo só e-mail/senha | `PENDENTE` — validado por leitura de código, não em dispositivo físico |
| CTM-06 | Editar perfil pela tela | Conta logada | `ProfileScreen` → "Dados pessoais" ou "Contato de emergência" ou lápis | Abre `PatientRegisterScreen` em modo edição, sem campos de e-mail/senha, pré-preenchido | `PENDENTE` — validado por leitura de código, não em dispositivo físico |
| CTM-07 | SOS com confirmação | App aberto | `HelpScreen` → SOS → confirmar no alerta | `POST /calls/sos` disparado só após confirmar; chamado aparece no `web-admin` com contato de emergência | ✅ (sessão de 26/09, ponta a ponta) |
| CTM-08 | App funciona sem beacon físico | Nenhum hardware BLE conectado | Usar o app normalmente (login, navegar, SOS) | Nenhuma tela trava esperando Bluetooth | ✅ (regra de escopo, violação seria bug crítico) |
| CTM-10 | SOS novo aparece no painel sem recarregar | `web-admin` aberto e logado como recepção, aba visível | Disparar SOS pelo celular e **não** tocar no painel | Chamado aparece na lista em até ~15 s (atualização automática). Antes de 20/10 só aparecia depois de recarregar a página | `PENDENTE` — implementado e compilado, não exercitado num navegador |
| CTM-11 | Botão "Atualizar dados" busca de verdade | Painel logado | Dashboard admin ou Mapa de calor → "Atualizar dados" | Lista/contadores refletem o backend; toast "Dados atualizados" só se todas as buscas derem certo; horário do mapa de calor muda. Antes: só mostrava o toast, sem buscar nada | `PENDENTE` — idem |
| CTM-09 | Fallback offline | Backend inacessível | Pedir rota com a API fora do ar | `navigationAdapter.js` responde com rota simulada, sem tela em branco/erro fatal | `PENDENTE` — não reexecutado nesta sessão |

## 4. E2E e achados de lint (20/10)

- **E2E estava quebrado e ninguém sabia.** `auth-dashboard.e2e.spec.ts` faz 6 `POST /auth/login` seguidos, mas a rota tem `@Throttle({ limit: 5, ttl: 60000 })` (proteção contra força bruta, adicionada depois do teste). A 6ª chamada tomava `429` em vez do `400` esperado. Correção no **teste**, não na proteção: `app.module.ts` passou a registrar o guard global com `useExisting` (padrão da doc do NestJS — comportamento de produção idêntico), e o e2e usa `overrideProvider(ThrottlerGuard)` pra desligar o limite só ali. Verificado à parte que, sem o override, 5 logins errados dão `401` e o 6º dá `429` — a proteção continua ativa.
- **Bug real achado pelo lint no web-admin:** botão "Gerar relatório" do dashboard admin (`AdminDashboard` em `web-admin/src/App.jsx`) usava uma variável `report` que não existia naquele componente — clicar lançava `ReferenceError` e o modal não abria. Corrigido reaproveitando `app.generateReport('diario')` (mesmo fluxo da página de Relatórios: API, fallback local, aviso de acesso negado).
- **`mobile/src/screens/MapScreen.js` não era lido pelo ESLint:** dois `->` crus em texto JSX (`{origem} -> {destino}`) são JSX inválido. O Babel do Metro tolera, então o app funcionava, mas o arquivo de mapa (1384 linhas) ficava sem nenhuma checagem. Trocado por `{'->'}` (mesmo texto na tela).
- Lint agora roda nos 3 projetos: backend `0 erros / 161 avisos`, mobile `0 erros / 74 avisos`, web-admin `0 erros / 63 avisos`. Avisos são majoritariamente `any` (backend), regras do React Compiler (projeto não usa o compiler — idioma `useRef(new Animated.Value()).current` do RN cai aqui) e variáveis não usadas.

## 5. Lacunas que continuam

- CTM-05 e CTM-06 (os dois fluxos corrigidos no item 15 do `CLAUDE.md`) foram validados pela lógica do código e por teste de API equivalente (CTM-01/CTM-02), mas **não num celular físico renderizando a tela real**. Recomendado antes de considerar o item 15 definitivamente encerrado.

## 6. Como rodar

```bash
cd backend-nest
npm test          # unitário, nao precisa de banco
npm run test:e2e  # precisa de Postgres local rodando (container navora-postgres)
npm run lint

cd ../mobile && npm run lint
cd ../web-admin && npm run lint
```

# Requisitos — Navora

> Este documento descreve o que o Navora **realmente faz hoje**, extraído do código (telas em `mobile/src/screens`, rotas em `backend-nest/src/*/*.controller.ts`, regras em `CLAUDE.md`). Não é uma lista de intenções — cada requisito tem uma referência de onde ele está implementado. Requisitos sem referência de código são marcados como `PENDENTE`.

## 1. Visão do produto

App de navegação indoor/outdoor para dois hospitais (HMC Private e HMC Marco Capute/SUS), com dois perfis de usuário: **Paciente** e **Visitante**. Objetivo: reduzir a ansiedade de quem chega a um hospital sem saber se locomover, usando orientação por mapa, assistente por palavra-chave e canais diretos de ajuda/SOS. Um painel web (`web-admin`) dá à recepção/administração visibilidade sobre chamados e pedidos de acesso.

## 2. Perfis e restrições de escopo

| Regra | Descrição |
|---|---|
| Perfis | Somente **Paciente** e **Visitante** no mobile. Não há perfil de funcionário/médico no app (existe `StaffProfile` no banco, mas sem tela mobile — é suporte a dados do `web-admin`). |
| Fora de escopo | QR Code, agendamento de consulta, chamada de paciente por nome/senha (sistema de triagem). |
| BLE opcional | O app funciona 100% sem beacon físico. Nenhuma tela trava esperando Bluetooth. |
| Fallback offline | `navigationAdapter.js` simula respostas de navegação quando a API está fora do ar — nunca deve ser removido. |
| Áreas separadas | Private e SUS têm dados, entradas e regras de acesso próprios — nunca assumir que uma funciona como a outra. |

## 3. Requisitos Funcionais

### 3.1 Autenticação e cadastro

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-01 | Login com e-mail/senha | Paciente | Implementado | `LoginScreen.js` → `POST /auth/login` |
| RF-02 | Login com Google | Paciente | Implementado | `POST /auth/google`, `googleId` em `User` |
| RF-03 | Recuperação de senha por e-mail | Paciente | Implementado | `ForgotPasswordScreen.js`/`ResetPasswordScreen.js` → `POST /auth/forgot-password`, `POST /auth/reset-password` |
| RF-04 | Cadastro completo (nome, nascimento, CPF, telefone, e-mail, senha, contato de emergência, 9 opções de acessibilidade, observações importantes) | Paciente | Implementado (observações e 3 opções de acessibilidade passaram a ser salvas em 21/10) | `PatientRegisterScreen.js` → `POST /patients/register` |
| RF-05 | Entrada rápida sem criar conta (nome/telefone/nascimento, estado local) | Paciente | Implementado | `PatientQuickRegisterScreen.js` (`quick: true`) |
| RF-06 | "Primeiro acesso" cria conta real (prefill de nome/telefone/nascimento → cadastro completo) | Paciente | Implementado (16/10) | `PatientQuickRegisterScreen.js` (`quick: false`) → `PatientRegisterScreen.js` com `routeParams.initialValues` |
| RF-07 | Editar dados pessoais e contato de emergência sem recriar a conta | Paciente | Implementado (16/10) | `ProfileScreen.js` → `PatientRegisterScreen.js` (`mode: 'edit'`) → `PUT /patients/me` |
| RF-08 | Identificação de visitante (nome, telefone, nascimento, paciente visitado, acompanhantes) | Visitante | Implementado | `VisitorEntryScreen.js` |

### 3.2 Navegação

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-09 | Escolher área de atendimento (Private/SUS) | Ambos | Implementado | `CareAreaChoiceScreen.js` |
| RF-10 | Buscar destino por nome/categoria | Ambos | Implementado | `SearchScreen.js` → `GET /navigation/destinations` |
| RF-11 | Verificar se o destino é acessível antes de rotear (regra de acesso, autorização de visitante, janela de horário) | Ambos | Implementado | `POST /navigation/access-check` |
| RF-12 | Calcular rota (menor caminho) respeitando preferências de acessibilidade (cadeira de rodas, maca, evitar escada, elevador) | Ambos | Implementado | `POST /navigation/route-preview`, Dijkstra em `navigation-routing.service.ts` |
| RF-13 | Exibir rota em mapa esquemático interno, com zoom/pan e seletor de andar | Ambos | Implementado | `MapScreen.js`, `DynamicRouteMap` |
| RF-14 | Mostrar instruções passo a passo da rota | Ambos | Implementado | `navigation-instructions.service.ts` |
| RF-15 | Redirecionar para recepção quando o destino exige autorização ou está fora de regra | Ambos | Implementado | decisão `REDIRECT_TO_RECEPTION`/`REQUIRE_AUTHORIZATION` |
| RF-16 | Simular localização interna por código de beacon (sem hardware real ainda) | Ambos | Implementado (simulado) | `hospitalDetectionService.js`, `POST /beacons/detect` |
| RF-17 | Traçar rota externa até o hospital (Google Maps/Waze/Apple Maps) a partir da localização real do usuário | Ambos | Implementado | `ExternalRouteScreen.js`, `expo-location` |
| RF-18 | Histórico de rotas percorridas | Ambos | Implementado (UI) | `RouteHistoryScreen.js` |

### 3.3 Ajuda, SOS e suporte

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-19 | Abrir menu de ajuda com opções (Preciso de ajuda, SOS, Estou perdido, Acessibilidade, Falar com a recepção) | Ambos | Implementado | `HelpScreen.js` |
| RF-20 | Acionar SOS com confirmação explícita antes de enviar | Ambos | Implementado | `confirmSos()` em `HelpScreen.js`, `POST /calls/sos` |
| RF-21 | Pedido de ajuda geral, sem SOS | Ambos | Implementado | `POST /calls/help` |
| RF-22 | "Estou perdido" → acesso rápido a suporte humano | Ambos | Implementado | `LostScreen.js` → `HelpScreen.js` |
| RF-23 | Pedir correção de localização na recepção durante a chegada | Ambos | Implementado | `ArrivalPreparationScreen.js` → `useReception()` |
| RF-24 | Todo chamado (SOS/ajuda) leva o contato de emergência do paciente, quando cadastrado | Paciente | Implementado | `emergencyContact` em `CreateCallDto`/`CallRequest` |
| RF-25 | Assistente por palavra-chave (sem IA generativa): emergência sempre com prioridade, destinos buscados nos dados reais do app, recusa de pergunta de saúde e de assunto fora do app | Ambos | Implementado (reescrito 20/10) | `navoraAssistant.js` + `navoraAssistant.test.mjs` |
| RF-25a | Entrada por voz no assistente | Ambos | `PENDENTE` — o botão hoje avisa que não há reconhecimento de voz (antes simulava uma transcrição fixa) |

### 3.4 Acesso de visitante

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-26 | Solicitar acesso a um destino restrito, com motivo e destino pretendido | Visitante | Implementado | `POST /visitor-access` |
| RF-27 | Consultar status do próprio pedido (pendente/aprovado/negado/em rota/finalizado) | Visitante | Implementado | `VisitorAccessStatusScreen.js`, `GET /visitor-access/:requestId` |
| RF-28 | Aprovar, autorizar, negar ou mudar status de um pedido | Recepção/Admin | Implementado | `PATCH /visitor-access/:requestId/*` |

### 3.5 Perfil e acessibilidade

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-29 | Configurar preferências de acessibilidade (cadeira de rodas, maca, evitar escada, preferir elevador, orientação por voz) | Paciente | Implementado | `PatientAccessibilitySetupScreen.js`, `PUT /patients/me/accessibility` |
| RF-30 | Trocar foto de perfil | Ambos | Implementado | `ProfileScreen.js` (modal com `ScrollView`, `maxHeight` dinâmico) |
| RF-31 | Receber e consultar notificações (navegação, acesso, ajuda/SOS) | Ambos | Implementado | `NotificationsScreen.js`, `GET /notifications/me` |
| RF-32 | Autenticação biométrica como atalho de login | Paciente | Implementado | mencionado no histórico de commits (`login biometrico`) |

### 3.6 Painel operacional (web-admin)

| ID | Requisito | Perfil | Status | Referência |
|---|---|---|---|---|
| RF-33 | Login de recepção/admin | Recepção/Admin | Implementado | `web-admin/src/App.jsx`, contas demo `admin@navora.com`/`recepcao@navora.com` |
| RF-34 | Listar e gerenciar chamados (aceitar, despachar equipe, encerrar) com contato de emergência visível | Recepção/Admin | Implementado | `CallCard` → `updateCallStatus`/`assignTeam`/`closeCall` |
| RF-35 | Ver resumo do dashboard (indicadores operacionais) | Recepção/Admin | Implementado | `GET /dashboard/summary` |
| RF-36 | Gerar relatório administrativo | Admin | Implementado | `POST /reports/admin` |
| RF-37 | Registrar check-in presencial de paciente/visitante | Recepção/Admin | Implementado | `POST /check-ins` |
| RF-38 | Enviar/ler mensagens operacionais internas | Recepção/Admin | Implementado | `operational-messages` |

### 3.7 Pendências conhecidas

| ID | Requisito | Status |
|---|---|---|
| RF-39 | Campo de endereço com máscara de CEP no cadastro | `PENDENTE` — não existe campo de endereço na base hoje |
| RF-40 | Seletor de andar refletindo dados reais de `HospitalArea`/`Sector` (hoje é lista fixa no front) | `PENDENTE` |
| RF-41 | Scanner BLE real (hardware Feasycom FSC-BP104D comprado, chega 17–25/11) | `PENDENTE` — ver `docs/BLE_HARDWARE_VALIDATION.md` |

## 4. Requisitos Não Funcionais

| ID | Requisito | Critério | Referência |
|---|---|---|---|
| RNF-01 | Disponibilidade sem rede/API fora | App não pode travar nem exibir tela em branco | `navigationAdapter.js` (fallback simulado em toda chamada de navegação) |
| RNF-02 | Tolerância a cold start do backend gratuito (Render dorme após 15 min) | Timeout de requisição ≥ tempo de boot observado (~53 s) | `REQUEST_TIMEOUT_MS = 60000` em `mobile/src/services/api.js` |
| RNF-03 | Senhas nunca em texto puro | Hash bcrypt, nunca serializado nas respostas | `patients.service.spec.ts` ("senha fica hasheada", "cadastro nao serializa passwordHash") |
| RNF-04 | Autorização por papel (role) nas rotas administrativas | `JwtAuthGuard` + `RolesGuard` em toda rota `ADMIN`/`RECEPTION` | `admin-authorization.spec.ts` |
| RNF-05 | Proteção básica contra abuso/DoS simples | Rate limiting | `@nestjs/throttler` (produção ainda não tem — ver Nota de versão no `CLAUDE.md`) |
| RNF-06 | Cabeçalhos HTTP seguros | `helmet` habilitado | `backend-nest/src/main.ts` |
| RNF-07 | Acessibilidade de uso (público pode ter mobilidade reduzida/ansiedade) | Botões grandes, ícones simples, pouco texto por tela | identidade visual, `CLAUDE.md` |
| RNF-08 | Validação de entrada rigorosa no backend | `ValidationPipe` com `whitelist` + `forbidNonWhitelisted` | `main.ts` (ambiente local) |
| RNF-09 | Dados sensíveis nunca vazam em log/commit | Sem segredos em texto no repositório | revisão manual a cada commit |
| RNF-10 | App deve abrir e funcionar tanto via Expo Go quanto via build standalone (APK) | Testado em apresentação de 26/09 | ver histórico de sessão |

## 5. Rastreabilidade — requisito × teste automatizado

Ver `docs/casos_de_teste.md` para a tabela completa de onde cada requisito funcional tem cobertura automatizada (unitária/e2e) e onde só existe validação manual.

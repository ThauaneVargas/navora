# Navora — Contexto para Claude Code

## Ordem de prioridade (siga nesta sequência)
1. **Safe area (bug 2)** — afeta praticamente toda tela do app. Estrutural, antes de qualquer coisa.
2. **Telas mortas / fluxos sem ação (bugs 9-12)** — ajuda, recepção, SOS, suporte humano.
3. **Seletor de andar** — depende do grafo de navegação ter dados por andar.
4. **Geolocalização real (bug 1)** — importante, mas só afeta navegação externa.
5. **React child (bug 3) e sobreposição/zoom no mapa (bugs 7, 8)** — pontuais.
6. **Estética da ArrivalDetectedScreen (bug 5)** — só depois de tudo funcional.
7. **Máscaras e validação de formulários (bug 13)** — melhoria de UX nos cadastros.

## Projeto
App de navegação hospitalar (Navora / sistema HMC). Monorepo: `mobile/` (Expo RN, sem React Navigation — state machine em `App.js`), `backend-nest/` (NestJS + Prisma + PostgreSQL), `web-admin/` (React + Vite).

## Regras de escopo (não violar)
- Só 2 perfis no mobile: Paciente e Visitante. Sem funcionário/médico.
- Sem QR Code, sem agendamento, sem chamada de paciente.
- BLE (beacons MBM04) deve continuar OPCIONAL — app tem que funcionar 100% sem beacon físico.
- Não remover fallback offline (`navigationAdapter.js`) — ele simula rota quando API está fora.
- Private e SUS têm estruturas separadas, não assumir que uma funciona igual na outra.
- Antes de mudar algo, entender a estrutura atual e reutilizar o que já existe (não duplicar arquivos/componentes).

## Bugs e features — status atual

**1. Geolocalização real (HowToGetScreen) — RESOLVIDO**
- `HowToGetScreen.js` usa `expo-location`, pede permissão foreground, pega posição real e passa como `origin` para Google Maps/Waze/Apple Maps com fallback claro.

**2. Safe area no Android — RESOLVIDO (estrutural + gaps fechados)**
- `Screen.js`: `SafeAreaView` da `react-native-safe-area-context` com edges dinâmicos (`withBottomTabs` remove `'bottom'` das edges pra evitar duplo inset — BottomTabs já gerencia o próprio inset).
- `BottomTabs.js`: paddingBottom mínimo de 21px no Android quando `insets.bottom` retorna 0 (comum em builds de dev).
- **Gap fechado nesta sessão:** 5 telas (ProfileScreen, HelpScreen, PatientHomeScreen, HomeScreen, AssistantScreen) renderizavam `<BottomTabs>` mas não passavam `withBottomTabs` pro `Screen` — causava a tab bar flutuar acima da borda real da tela. Padronizado nas 9 telas que usam BottomTabs.
- **Gap fechado nesta sessão:** `LoginScreen.js` importava `SafeAreaView` do `react-native` puro (não da safe-area-context) — no Android isso é um no-op, sem nenhum tratamento de inset. É a primeira tela que o usuário vê. Corrigido pro import certo.
- **Gap fechado nesta sessão:** modal "Foto do perfil" (`ProfileScreen.js`) agora tem `maxHeight` dinâmico (`min(560, altura da janela * 0.85)`) + `ScrollView` interno, pra não estourar em telas pequenas.
- `ExternalRouteScreen.js`: já usava o import certo (corrigido em sessão anterior).
- `app.json` já tem `edgeToEdge: true` para Android.
- Nota: revisão anterior mencionava `Header.js` com `marginTop: -8` — não existe mais no código atual, não é necessário mexer.

**3. "Objects are not valid as a React child" — RESOLVIDO**
- `PatientHomeScreen.js`: `requestedDestination` pode ser objeto (da API). Corrigido com coerção `(typeof rd === 'string' ? rd : rd?.name)` nos dois lugares onde era renderizado/passado como string.
- Raiz: `visitorAccessRequest.requestedDestination` pode vir como objeto `{name, id, ...}` da API.

**4. "Pedir correção na recepção" — RESOLVIDO (nota antiga estava errada)**
- O botão existe e funciona: `ArrivalPreparationScreen.js`, linha do `SecondaryButton title="Pedir correção na recepção"`, chama `useReception()` — marca a origem como `'reception-pending'` via `onAreaDetected` e navega pra `Search` já com a busca "Recepção" preenchida. A tela é alcançada de fato (importada em `App.js` e referenciada por outras telas do fluxo de chegada). A nota anterior ("não encontrado no código") estava errada — não precisa confirmar nada com o usuário, o fluxo já é real.

**5. ArrivalDetectedScreen.js visual — RESOLVIDO (era tela morta, não era bug visual) (16/10)**
- Investigando pra melhorar o visual, achei que `ArrivalDetectedScreen.js` já tinha sido redesenhado faz tempo (commit `6959e6c`, "ArrivalDetected redesign") — animação de entrada, anel de ícone com pulso, card com sombra, tudo no padrão bordô/branco do app. O visual nunca foi o problema.
- **O problema real: ninguém navega pra essa tela.** Busca em todo `mobile/` (fora build antigo) não encontrou nenhum `navigate('ArrivalDetected', ...)` em lugar nenhum além do próprio arquivo. O fluxo real de chegada é `ArrivalPreparationScreen` → `Search`, direto — ele lê o mesmo estado (`hospitalDetection`, de `hospitalDetectionService`, que esse sim é usado de verdade por `handleAreaDetected`/`handleLoginSuccess`/etc. em `App.js`) só que sem passar por nenhuma tela dedicada de "chegada confirmada".
- **Achado por tabela:** `ArrivalConfirmedScreen.js` estava na mesma situação — só se chamava recursivamente (correção de entrada), nunca tinha um ponto de entrada externo real.
- **Decisão do usuário (16/10): apagar as duas.** Removidos `mobile/src/screens/ArrivalDetectedScreen.js` e `ArrivalConfirmedScreen.js`, e os imports/registros (`ArrivalDetected`/`ArrivalConfirmed`) em `App.js`. `ArrivalPreparationScreen.js` continua sendo a única tela real desse passo, inalterada. Verificado: `App.js` continua passando no parse do Babel depois da remoção, e não sobrou nenhuma referência aos dois componentes em lugar nenhum do código.

**6. Login falhando — RESOLVIDO**
- Timeout de 20s via AbortController em `api.js`, mensagens específicas por tipo de erro.
- IP local do `.env` mobile corrigido para o IP Wi-Fi atual da máquina de desenvolvimento (o IP muda quando a rede muda — conferir com `ipconfig`/`ifconfig` sempre que o login parar de funcionar no celular físico).
- Banco de produção (Render) estava **completamente vazio** (0 usuários) — `render.yaml`/deploy nunca rodava o seed, só as migrations. Populado manualmente via seed rodado contra a `DATABASE_URL` de produção. Ver nota de versão sobre o backend de produção estar desatualizado em relação a esta branch.

**7. Sobreposição de elementos na tela de mapa — RESOLVIDO**
- Badge "Terreo" (`floorPill`) agora só aparece no modo estático (não no DynamicRouteMap que tem seu próprio header).
- Controles de zoom movidos de `top: 56` para `bottom: 12` — sem sobreposição com título/tabs do DynamicRouteMap.

**8. Zoom do mapa não funciona — RESOLVIDO**
- `DynamicRouteMap` agora recebe `zoom`, `pan` e `panHandlers` como props.
- O canvas (`Animated.View`) aplica `transform: [translateX, translateY, scale]` — zoom e pan funcionam em ambos os modos (estático e dinâmico).

**9. Falta seletor de andar — RESOLVIDO (básico)**
- Constante `HOSPITAL_FLOORS` com 4 andares (Térreo, 2º, 3º, 4º).
- `floorPill` virou `Pressable` que abre Alert com as 4 opções de andar.
- Estado `staticFloor` atualiza o badge ao selecionar.
- DynamicRouteMap já tinha tabs de andar quando `floors.length > 1` (não alterado).
- Ainda não reflete andares reais cadastrados por `HospitalArea`/`Sector` no backend (é uma lista fixa no front) — melhoria futura se o grafo de navegação ganhar dados reais por andar.

**10. Fluxo de "Preciso de ajuda" incompleto — RESOLVIDO (parcial)**
- HelpScreen já tinha o menu com opções ("Preciso de ajuda", "SOS", "Estou perdido", "Acessibilidade", "Falar com a recepção").
- Corrigido: "Falar com a recepção" usava `kind: 'help'` igual ao "Preciso de ajuda" → ambos mostravam spinner ao mesmo tempo. Separado para `kind: 'reception'`.
- Spinner agora só aparece no botão certo. Timeout de 20s garante que não trava infinitamente.

**11. Botão de SOS sem confirmação — RESOLVIDO**
- `confirmSos()` já existia em HelpScreen.js com Alert.alert "Acionar SOS?" + botões Cancelar/Acionar.

**12. "Suporte humano" não leva a lugar nenhum — RESOLVIDO**
- "Suporte humano" é o subtitle do botão "Chamar ajuda" em LostScreen.js, que navega para `'Help'` screen.
- O fluxo funciona: LostScreen → Help (HelpScreen). Não havia tela faltando.

**13. Validação e máscaras de campos de formulário — RESOLVIDO (principais telas)**
- Criado `mobile/src/utils/masks.js`: `maskBirthDate`, `maskCPF`, `maskPhone`, `maskCEP`, `sanitizeName`, `isValidCPF` (dígito verificador real), `isValidEmail`, `isValidBirthDate`, `passwordStrength`.
- Aplicado em: `PatientRegisterScreen.js` (cadastro completo — inclui confirmar senha + força + mostrar/ocultar, todos os campos com máscara/validação e erro inline), `PatientQuickRegisterScreen.js`, `VisitorEntryScreen.js` (nome do visitante, telefone, nascimento, nome do paciente visitado, nome de acompanhantes), `PatientIdentificationScreen.js`, `ResetPasswordScreen.js` (confirmação de senha em tempo real).
- **Bug de crash encontrado e corrigido de brinde:** `PatientIdentificationScreen.js` usava `<Pressable>` no JSX sem importar de `react-native` — quebrava a tela inteira com `ReferenceError`.
- Pendente (não coberto ainda): CEP (não há campo de endereço na base atual), e telas secundárias que não usam `TextInput` diretamente para esses campos.
- `ResetPasswordScreen.js` não usa `Screen.js`/`SafeAreaView` nenhum — fora do escopo desta rodada (tela de fluxo secundário), mas é um gap de bug 2 a considerar depois.

**14. Decisões de escopo confirmadas (19/09)**
- **Contato de emergência → recepção: RESOLVIDO (ponta a ponta).** Adicionado `emergencyContact` em `PatientProfile` e `CallRequest` (migration `20260919220157_add_emergency_contact`, aplicada no banco local). `RegisterPatientDto`/`UpdatePatientDto`/`CreateCallDto` e `patients.service.ts`/`calls.service.ts`/`api-mappers.ts` atualizados — o dado é persistido no cadastro (`PatientRegisterScreen.js`) e viaja em cada chamado de SOS/ajuda (`HelpScreen.js` envia `emergency_contact`).
- **Correção de um engano anterior (21/09):** `ReceptionPage.jsx` e `AdminPage.jsx` (pasta `pages/`) são arquivos **antigos e não usados** — não são importados por nada. O painel real é `web-admin/src/App.jsx` (é o que `index.html` carrega direto via `<script src="/src/App.jsx">`), que **já busca dados reais da API** (`loadCalls`, `loadVisitorAccessRequests`, `loadDashboardSummary`, etc.) e já tem os botões de ação funcionando de verdade (`CallCard` → `app.updateCallStatus`/`app.assignTeam`/`app.closeCall`, todos chamando `adminApi`). O que realmente faltava era só `mapCallFromApi()` não extrair `emergency_contact` da resposta — corrigido, e adicionado no card (`CallCard`, ambas as variações) com estilo próprio (`.call-emergency-contact`). Testado ponta a ponta: chamado criado no mobile aparece na API real consultada pelo painel.
- Login no web-admin (`admin@navora.com`/`recepcao@navora.com`, senha `navora-demo-123`) e o restante do fluxo (visitantes, check-ins, beacons, setores) parecem seguir o mesmo padrão real (não confirmado campo a campo, mas a arquitetura em `App.jsx` é consistente).
- **Mapa interativo na Home: confirmado que não será feito.** Nenhuma ação necessária.
- **Assistente IA: já está exatamente como decidido.** `mobile/src/services/navoraAssistant.js` já é 100% determinístico por palavra-chave (`hasAny`/`normalize`), zero chamada de API externa/LLM, cobre todas as intenções listadas na decisão (SOS/emergência, setores, perdido, ajuda, acessibilidade, banheiro, como chegar). UI já mostra "Não usa IA generativa neste app". Nada a mudar.

**15. Cadastro de paciente/visitante — RESOLVIDO (16/10)**
- `LoginScreen.js` → "Cadastre-se" → `onCreateAccount` → navega pra `PatientRegister` → `PatientRegisterScreen.js`: continua funcionando igual (chama `navoraApi.registerPatient`, trata sucesso/erro, navega). Esse é o cadastro completo (com senha), inalterado.
- **"Primeiro acesso" agora cria conta real.** `PatientAccessChoiceScreen.js` → "Primeiro acesso / Criar minha conta" → `PatientQuickRegisterScreen.js` (modo `!quick`) continua coletando nome/telefone/nascimento, mas agora, ao continuar, navega pra `PatientRegister` passando esses dados em `routeParams.initialValues` em vez de fingir uma conta local. `PatientRegisterScreen` pré-preenche o formulário completo com isso — o usuário só completa e-mail/senha e cai no `registerPatient` de verdade. O caminho "Acesso rápido" (`quick: true`, sem conta, vindo de outro botão) continua exatamente como estava — ele nunca prometeu criar conta.
- **Edição de perfil agora usa PATCH, não criação.** `PatientRegisterScreen.js` ganhou `routeParams.mode === 'edit'`: esconde e-mail/senha/confirmar senha (tela de edição nunca troca credencial — isso já tem fluxo próprio em "Segurança da conta"), pré-preenche nome/telefone/CPF/nascimento/contato de emergência/acessibilidade a partir do perfil atual, e no salvar chama `navoraApi.updateMyPatientProfile` (`PUT /patients/me`, já existia e funcionava) em vez de `registerPatient`. Os 3 pontos de `ProfileScreen.js` que abriam `PatientRegister` ("Dados pessoais", "Contato de emergência" e o lápis de editar) agora passam `{ mode: 'edit', initialValues: buildEditInitialValues(userProfile) }`. Resolve o bug real: antes, editar caía sempre no `registerPatient` e falhava com e-mail duplicado ou arriscava duplicata.
- Importante: pré-preencher a acessibilidade salva no modo de edição era necessário pra não perder os dados — sem isso, salvar qualquer campo zeraria a acessibilidade já cadastrada (o PATCH sempre reenvia o objeto de acessibilidade inteiro).
- Fora do escopo desta correção: o toggle binário "Precisa de acessibilidade?" e o checkbox "Já sou paciente" do `PatientQuickRegisterScreen` não têm campo correspondente no backend hoje (nunca tiveram) — continuam só de interface no caminho "Primeiro acesso"; quem quiser detalhar acessibilidade agora faz isso na grade completa (9 opções) que já existe dentro do `PatientRegisterScreen`.

**16. Google Maps API — RESOLVIDO (config + mapa real implementado)**
- Chave 1 (Maps SDK Android/iOS, restrita ao pacote `com.navora.app`) adicionada em `mobile/app.json`: `android.config.googleMaps.apiKey` e `ios.config.googleMapsApiKey`.
- **Nota corrigida (16/10):** esta entrada dizia "nenhum componente usa react-native-maps ainda" — isso ficou desatualizado a partir do commit `a084bff` ("substitui mapa estático por Google Maps real"). Hoje `ExternalRouteScreen.js` (tela "Como chegar ao hospital") já importa e usa `MapView`/`Marker`/`PROVIDER_GOOGLE` de `react-native-maps` de verdade, com localização real do usuário. O mapa esquemático/custom (`MapScreen.js`) continua existindo em paralelo pra navegação interna (corredores/setores do hospital) — são dois mapas com propósitos diferentes, não um substituindo o outro.
- Directions API e Chave 2 seguem fora de uso (decisão do usuário).

**17. Beacon físico real comprado (16/10) — PREPARADO (aguardando configuração física)**
- Hardware definido: **Feasycom FSC-BP104D** (BLE 5.1, chipset DA14531), substitui o candidato genérico "Minew MBM02" citado antes em `docs/BLE_HARDWARE_VALIDATION.md`. Documento reescrito com specs reais (TX power -19,5 a +2,5 dBm, intervalo 100-10000ms, app de configuração FeasyBeacon) e passo a passo pra configurar a primeira unidade.
- Convenção definida: Major=4/Minor=1 pra esta unidade, código `FSC-04-01` (padrão `FSC-<major>-<minor>`, consistente com a família `MBM04-*` já usada nos beacons simulados).
- Já preparado no código, sem nenhum risco e sem ligar nada na UI: `backend-nest/prisma/seed.ts` tem o beacon `FSC-04-01` vinculado ao nó de navegação da entrada Private; `mobile/src/data/routes.js` tem `'FSC-04-01'` na lista de `beaconCodes` da entrada `PRIVATE_BACK`. `POST /beacons/detect` já reconhece esse código assim que o seed rodar (rota já existente, nada novo).
- **Não instalado ainda:** nenhuma biblioteca BLE nativa (`react-native-ble-plx`), nenhum scanner real. Isso é a fase 2, documentada no mesmo arquivo, e exige development build novo (mesmo processo já feito pro Poco X7 Pro) — não é "trabalho rápido", é sessão própria.
- Pendente do usuário: abrir o app FeasyBeacon na unidade física, configurar Major/Minor/TX power/intervalo conforme o documento, e mandar a config final (print da tela) pra fase 2 começar com certeza do protocolo real.

## Nota de versão
- Projeto está no **Expo SDK 57**.
- Backend local: IP Wi-Fi da máquina de dev + porta 8000 (NestJS + PostgreSQL via Docker) — conferir `mobile/.env` bate com o IP atual.
- Backend produção: `https://navora-backend-kpio.onrender.com` (Render.com — dorme após 15min, primeiro request pode levar 30-50s).
- **Produção está com o backend desatualizado em relação a esta branch** (`finalizacao-sem-ble`): faltam lá a tabela `notifications`, colunas `google_id`/`password_reset_token`/`password_reset_expires` em `users`, e o rate-limiting (`@nestjs/throttler`) + `helmet`. Antes de fazer merge pra `main`, avaliar esse gap com calma (não é automático — decisão do usuário).

## Identidade visual
Fundo branco ou branco-gelo, detalhes em bordô (#980027), aparência limpa e premium, bastante espaço em branco, ícones simples, textos objetivos, botões grandes (público pode ter mobilidade reduzida/ansiedade).

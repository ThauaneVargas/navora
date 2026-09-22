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

**4. "Pedir correção na recepção" — PENDENTE**
- Botão mencionado mas não encontrado no código. Confirmar com usuário em qual tela deveria aparecer.

**5. ArrivalDetectedScreen.js visual — baixa prioridade**
- Visualmente fraco comparado a outras telas. Reforçar hierarquia visual seguindo padrão do app (fundo branco/gelo, bordô).

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

**15. Cadastro de paciente/visitante — investigado, não confirmado como "morto"**
- `LoginScreen.js` → "Cadastre-se" → `onCreateAccount` → navega pra `PatientRegister` → `PatientRegisterScreen.js`: **conferido, funciona** (chama `navoraApi.registerPatient`, trata sucesso/erro, navega). Esse é o cadastro completo (com senha).
- **Achado real:** existe um SEGUNDO fluxo paralelo — `PatientAccessChoiceScreen.js` → "Primeiro acesso / Criar minha conta" → navega pra `PatientQuickRegister`, que é a versão RÁPIDA (`PatientQuickRegisterScreen.js`, só nome/telefone/nascimento) e **não cria conta real nenhuma** (não chama a API, é só estado local com `hasAccount: false`). Quem passa por esse caminho esperando "criar uma conta" não sai com login/senha — pode ser isso que pareceu "não funciona".
- **Achado separado (bug real):** em `ProfileScreen.js`, o tile "Contato de emergência" e "Dados pessoais" navegam pra `PatientRegister` pra "editar" — mas essa tela sempre chama `registerPatient` (criar), nunca `PATCH /patients/me` (que já existe e funciona em `patients.service.ts`). Editar dados de um paciente já cadastrado por esse caminho provavelmente falha (e-mail já existe) ou cria duplicata. Não corrigido ainda — precisa de uma tela/modo de edição de verdade usando `navoraApi` de update.
- **Pendente confirmar com o usuário:** qual exatamente foi o caminho testado (LoginScreen→Cadastre-se, ou Home→Sou paciente→PatientAccessChoice→Primeiro acesso) pra saber se o problema é os dois achados acima ou algo ainda não encontrado.

**16. Google Maps API — RESOLVIDO (config adicionada)**
- Chave 1 (Maps SDK Android/iOS, restrita ao pacote `com.navora.app`) adicionada em `mobile/app.json`: `android.config.googleMaps.apiKey` e `ios.config.googleMapsApiKey`.
- Só a config — nenhum componente de mapa usa `react-native-maps` ainda (o mapa atual continua o esquemático/custom em `MapScreen.js`). A chave fica pronta pra quando o mapa real for implementado.
- Directions API e Chave 2 seguem fora de uso (decisão do usuário).

## Nota de versão
- Projeto está no **Expo SDK 57**.
- Backend local: IP Wi-Fi da máquina de dev + porta 8000 (NestJS + PostgreSQL via Docker) — conferir `mobile/.env` bate com o IP atual.
- Backend produção: `https://navora-backend-kpio.onrender.com` (Render.com — dorme após 15min, primeiro request pode levar 30-50s).
- **Produção está com o backend desatualizado em relação a esta branch** (`finalizacao-sem-ble`): faltam lá a tabela `notifications`, colunas `google_id`/`password_reset_token`/`password_reset_expires` em `users`, e o rate-limiting (`@nestjs/throttler`) + `helmet`. Antes de fazer merge pra `main`, avaliar esse gap com calma (não é automático — decisão do usuário).

## Identidade visual
Fundo branco ou branco-gelo, detalhes em bordô (#980027), aparência limpa e premium, bastante espaço em branco, ícones simples, textos objetivos, botões grandes (público pode ter mobilidade reduzida/ansiedade).

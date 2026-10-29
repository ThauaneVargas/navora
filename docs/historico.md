# Navora — histórico de bugs, features e decisões

Conteúdo que ficava no `CLAUDE.md` até 28/10/2026 (movido pra cá pra deixar o `CLAUDE.md` curto). Registro detalhado de cada item: o que era, como foi resolvido, decisões da usuária. O `CLAUDE.md` só guarda o resumo e as regras.

## Bugs e features — status atual

**1. Geolocalização real — RESOLVIDO**
- A tela real de "Como chegar" é `ExternalRouteScreen.js` (mapa Google + localização real via `expo-location`). A antiga `HowToGetScreen.js` não era aberta por nenhuma tela e foi removida em 21/10.

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
- ~~`ResetPasswordScreen.js` sem safe area~~ **Resolvido (21/10):** ela e a `ForgotPasswordScreen.js` (mesmo problema) usam agora `components/CenteredFormScreen.js`, que envolve o `Screen.js`.

**14. Decisões de escopo confirmadas (19/09)**
- **Contato de emergência → recepção: RESOLVIDO (ponta a ponta).** Adicionado `emergencyContact` em `PatientProfile` e `CallRequest` (migration `20260919220157_add_emergency_contact`, aplicada no banco local). `RegisterPatientDto`/`UpdatePatientDto`/`CreateCallDto` e `patients.service.ts`/`calls.service.ts`/`api-mappers.ts` atualizados — o dado é persistido no cadastro (`PatientRegisterScreen.js`) e viaja em cada chamado de SOS/ajuda (`HelpScreen.js` envia `emergency_contact`).
- **Correção de um engano anterior (21/09):** `ReceptionPage.jsx` e `AdminPage.jsx` (pasta `pages/`) são arquivos **antigos e não usados** — não são importados por nada. O painel real é `web-admin/src/App.jsx` (é o que `index.html` carrega direto via `<script src="/src/App.jsx">`), que **já busca dados reais da API** (`loadCalls`, `loadVisitorAccessRequests`, `loadDashboardSummary`, etc.) e já tem os botões de ação funcionando de verdade (`CallCard` → `app.updateCallStatus`/`app.assignTeam`/`app.closeCall`, todos chamando `adminApi`). O que realmente faltava era só `mapCallFromApi()` não extrair `emergency_contact` da resposta — corrigido, e adicionado no card (`CallCard`, ambas as variações) com estilo próprio (`.call-emergency-contact`). Testado ponta a ponta: chamado criado no mobile aparece na API real consultada pelo painel.
- **Atualização automática do painel (20/10):** até então o `web-admin` buscava chamados só no login — **um SOS novo do celular só aparecia depois de recarregar a página.** Agora `refreshOperationalData` roda a cada 15 s (`OPERATIONAL_REFRESH_MS`) enquanto logado e com a aba visível, em modo silencioso (falha de rede não vira aviso, mantém os dados na tela; 401 ainda desloga). Os dois botões "Atualizar dados" (dashboard e mapa de calor) eram de fachada — só mostravam o toast — e agora buscam de verdade. Ainda não testado clicando num navegador (ver CTM-10/CTM-11 em `docs/casos_de_teste.md`).
- Login no web-admin (`admin@navora.com`/`recepcao@navora.com`, senha `navora-demo-123` **só no banco local**; em produção as senhas foram trocadas em 23/10) e o restante do fluxo (visitantes, check-ins, beacons, setores) parecem seguir o mesmo padrão real (não confirmado campo a campo, mas a arquitetura em `App.jsx` é consistente).
- **Mapa interativo na Home: confirmado que não será feito.** Nenhuma ação necessária.
- **Assistente: continua 100% determinístico (sem LLM, sem custo), mas foi reescrito em 20/10** porque tinha bugs de segurança: checava "banheiro" antes de "emergência" ("passando mal no banheiro" virava rota pro banheiro; "socorro"/"dor no peito" nem eram emergência); `includes()` casava pedaço de palavra ("sala" → "ala" bloqueava visitante na sala de espera, "boa noite" → modo noturno); "estou perdido" inventava "Recepção Principal, Corredor A"; oferecia Colonoscopia/Endoscopia, que não existem nos dados; mandava `{ area }` pra busca, que ignora esse parâmetro. Agora: emergência sempre primeiro (com "ligue 192" se fora do hospital), palavra inteira, destinos buscados nos dados reais (API ou `data/routes.js`) respeitando unidade e regra de visitante, recusa explícita de pergunta de saúde (remédio/sintoma → equipe) e de assunto fora do app. Testes em `mobile/src/services/navoraAssistant.test.mjs` (`npm test` no mobile, 13 casos — cada bug acima virou um teste).
- **Microfone do assistente era falso:** gravava o áudio e respondia sempre "Me leve até Tomografia". O app não tem reconhecimento de voz (`expo-speech` só fala). Agora o botão avisa que a voz ainda não está disponível; "Ouvir" (ler a resposta em voz alta) continua funcionando. `expo-audio` ficou sem uso — remover do `package.json`/`app.json` no próximo build de APK.
- **Decisão do usuário (20/10): assistente fica GRÁTIS — sem LLM.** IA paga (híbrida) só se surgir motivo concreto (banca exigir IA, ou muita frase legítima caindo em "fora do escopo"). Pra cobrir mais jeitos de falar, adicionar a frase em `REAL_PHRASES_PATIENT_PRIVATE` no teste e o sinônimo em `navoraAssistant.js` — 37 frases reais cobertas em 20/10 (eram 23 antes do ajuste: "banheiro urgente" virava SOS, "marcar consulta" dizia que a consulta "ficava em outra unidade", UTI/estacionamento/letra maior não eram entendidos). Agendamento e horários: o assistente diz que o app não faz/não tem e manda pra recepção (regra de escopo, não inventar dado).
- **Voz:** fazer junto com o build do BLE (fase 2) — os dois exigem APK novo; aproveitar pra remover `expo-audio`. Reconhecimento de voz do próprio aparelho, sem custo. No Expo Go continua só digitação.

**15. Cadastro de paciente/visitante — RESOLVIDO (16/10)**
- `LoginScreen.js` → "Cadastre-se" → `onCreateAccount` → navega pra `PatientRegister` → `PatientRegisterScreen.js`: continua funcionando igual (chama `navoraApi.registerPatient`, trata sucesso/erro, navega). Esse é o cadastro completo (com senha), inalterado.
- **"Primeiro acesso" agora cria conta real.** `PatientAccessChoiceScreen.js` → "Primeiro acesso / Criar minha conta" → `PatientQuickRegisterScreen.js` (modo `!quick`) continua coletando nome/telefone/nascimento, mas agora, ao continuar, navega pra `PatientRegister` passando esses dados em `routeParams.initialValues` em vez de fingir uma conta local. `PatientRegisterScreen` pré-preenche o formulário completo com isso — o usuário só completa e-mail/senha e cai no `registerPatient` de verdade. O caminho "Acesso rápido" (`quick: true`, sem conta, vindo de outro botão) continua exatamente como estava — ele nunca prometeu criar conta.
- **Edição de perfil agora usa PATCH, não criação.** `PatientRegisterScreen.js` ganhou `routeParams.mode === 'edit'`: esconde e-mail/senha/confirmar senha (tela de edição nunca troca credencial — isso já tem fluxo próprio em "Segurança da conta"), pré-preenche nome/telefone/CPF/nascimento/contato de emergência/acessibilidade a partir do perfil atual, e no salvar chama `navoraApi.updateMyPatientProfile` (`PUT /patients/me`, já existia e funcionava) em vez de `registerPatient`. Os 3 pontos de `ProfileScreen.js` que abriam `PatientRegister` ("Dados pessoais", "Contato de emergência" e o lápis de editar) agora passam `{ mode: 'edit', initialValues: buildEditInitialValues(userProfile) }`. Resolve o bug real: antes, editar caía sempre no `registerPatient` e falhava com e-mail duplicado ou arriscava duplicata.
- Importante: pré-preencher a acessibilidade salva no modo de edição era necessário pra não perder os dados — sem isso, salvar qualquer campo zeraria a acessibilidade já cadastrada (o PATCH sempre reenvia o objeto de acessibilidade inteiro).
- Fora do escopo desta correção: o toggle binário "Precisa de acessibilidade?" e o checkbox "Já sou paciente" do `PatientQuickRegisterScreen` não têm campo correspondente no backend hoje (nunca tiveram) — continuam só de interface no caminho "Primeiro acesso"; quem quiser detalhar acessibilidade agora faz isso na grade completa (9 opções) que já existe dentro do `PatientRegisterScreen`.
- **Cadastro perdia dados — RESOLVIDO (21/10):** "Observações importantes" (alergias etc.) era digitado e nunca salvo; e 3 das 9 opções de acessibilidade ("Precisa de acompanhante", "Deficiência visual", "Deficiência auditiva") eram marcadas e descartadas. Agora: coluna `notes` em `PatientProfile` (migration `20261021003326_add_patient_notes`, só `ADD COLUMN`), `notes` nos DTOs de cadastro/edição (máx. 1000), chaves `needsCompanion`/`visualImpairment`/`hearingImpairment` aceitas pelo backend (não mudam a rota — verificado que `route-preview` continua achando rota com elas). App envia e pré-preenche na edição. **Produção não tem a coluna** (roda `main`): enquanto não fizer merge, a produção descarta `notes` em silêncio (`forbidNonWhitelisted: false` lá); ao fazer merge, o `prisma migrate deploy` do start aplica sozinho.
- **Card "Lanchonete" (Home do visitante) levava a busca vazia** — não existe no mapa. Trocado por "Sala de espera" (existe nas duas unidades, liberada pra visitante).

**16. Google Maps API — RESOLVIDO (config + mapa real implementado)**
- Chave 1 (Maps SDK Android/iOS, restrita ao pacote `com.navora.app`) adicionada em `mobile/app.json`: `android.config.googleMaps.apiKey` e `ios.config.googleMapsApiKey`.
- **Nota corrigida (16/10):** esta entrada dizia "nenhum componente usa react-native-maps ainda" — isso ficou desatualizado a partir do commit `a084bff` ("substitui mapa estático por Google Maps real"). Hoje `ExternalRouteScreen.js` (tela "Como chegar ao hospital") já importa e usa `MapView`/`Marker`/`PROVIDER_GOOGLE` de `react-native-maps` de verdade, com localização real do usuário. O mapa esquemático/custom (`MapScreen.js`) continua existindo em paralelo pra navegação interna (corredores/setores do hospital) — são dois mapas com propósitos diferentes, não um substituindo o outro.
- Directions API e Chave 2 seguem fora de uso (decisão do usuário).

**17. Beacons físicos (Feasycom FSC-BP104D) — IMPLEMENTADO na branch `feat/beacons-ble` (21/10), falta testar no aparelho**
- 4 aparelhos configurados pelo usuário (UUID `7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17`, major 1=Private/2=SUS, minor 10=entrada/20=ponto interno, 500 ms, 0 dBm). Tudo em `docs/beacons-configuracao.md`. **Códigos renomeados em 22/10 (pedido do usuário): `FSC-01/02/10/11`** (eram `MBM04-01/02/10/11`); o corredor simulado virou `SIM-20`. Migration `20261022233000_rename_beacon_codes_fsc` renomeia nos bancos existentes e grava a identidade iBeacon dos 4 (produção funciona após o merge sem rodar seed). O código legado `backend/` (Python, não usado) não foi mexido.
- Backend: colunas `hardware_model`/`ibeacon_uuid`/`ibeacon_major`/`ibeacon_minor`/`measured_power` (nulo até calibrar) + índice único do trio; `POST /beacons/detect` aceita `uuid`+`major`+`minor` (UUID sem caixa, com/sem hífen) além do `beaconCode`, e devolve `beacon_code`.
- Mobile: `react-native-ble-manager` 12.6.0 (TurboModule; o `ble-plx` não tem suporte declarado pra Nova Arquitetura/RN 0.86). `src/services/ibeacon.js` (parser + regra de troca estável, testado), `BleIndoorLocationProvider` em `indoorLocationService.js`, atrás de `EXPO_PUBLIC_BLE_ENABLED`. **Só Android** — o iOS não entrega iBeacon pelo Bluetooth comum (precisaria de CoreLocation). Com a API fora do ar, resolve o beacon pela tabela local.
- `ArrivalPreparationScreen` ganhou **escolha manual da entrada** (antes só havia "rota até a recepção") — é o caminho sempre disponível quando o BLE não funciona.
- Tela `BeaconDiagnostics` só com `__DEV__` (menu → "Diagnóstico de beacons"): major, minor, MAC, RSSI médio/mediana, local, beacon atual.
- Build: `expo-dev-client` + `eas.json` (perfil `development`, APK). No APK de desenvolvimento o JS vem do Metro do PC — a flag BLE vale pelo `.env` local, não pelo `eas.json`.
- **Teste em casa (22/10): OK** — APK release com o JS embutido (`./gradlew assembleRelease`, sem depender do Metro; a tela de diagnóstico aparece com `EXPO_PUBLIC_BEACON_DIAGNOSTICS="true"`). Ouviu os 4, escolheu o mais próximo e trocou ao andar. API do APK = produção; enquanto produção não reconhecer uuid, `detectBeacon` usa a tabela local.
- **Pendente:** testar a tela "Localização inicial" (CTM-13/14); calibrar no hospital (`measuredPower` + limites de troca em `BEACON_STABILITY`); conferir se o "ponto interno" está mesmo ligado ao nó da recepção no seed; decidir push/merge da branch.

**18. Limpeza de código morto (21/10)**
- Varredura de imports a partir da entrada de cada projeto + checagem por nome. Removidos 16 arquivos que nada usava: mobile `HomeScreen.js` (923 linhas — a rota "Home" abre `PatientHomeScreen`), `PlaceholderScreen.js`, `HowToGetScreen.js`, `components/ActionCard|InfoCard|NavoraButton|ProfileAvatar.js`, `data/rooms.js`, `services/arrivalLocationService.js`; web-admin `pages/AdminPage.jsx`, `pages/ReceptionPage.jsx`, `components/ReportModal|Sidebar|StatCard.jsx` (o painel real usa `components/dashboard/` e `components/layout/`); e dentro do `web-admin/src/App.jsx` os componentes mortos `Stat`, `Table`, `renderCell`, `StatusBadge`, `matchesFloor`.
- Dependências sem uso removidas: `expo-audio` (microfone falso), `expo-auth-session` + `expo-web-browser` (login Google nunca ligado). Valem pro próximo APK; Expo Go não muda.
- Lint: `web-admin` ganhou `eslint-plugin-react` (`react/jsx-uses-vars`) — antes o contorno `varsIgnorePattern` escondia import de componente sem uso. Zero `no-unused-vars` nos dois projetos. Avisos restantes são regras do React Compiler (projeto não usa) e `react-refresh`.
- **Login com Google/Apple: os dois botões só mostram "Em breve"** — o backend tem `POST /auth/google`, mas o app nunca chama. Decisão do usuário: ligar de verdade (precisa Client IDs do Google) ou tirar os botões.
- CSS possivelmente órfão em `web-admin/src/styles.css` (`.status-badge`, `.table*`, `.stat-card`) não foi mexido — conferir visualmente antes de apagar.

**19. Segurança e LGPD (22/10) — FEITO no código, falta produção.** Tudo em `docs/lgpd.md` (inventário de dados, o que foi feito, pendências e decisões).
- Corrigido: login Google sem checar `aud` (agora exige `GOOGLE_CLIENT_IDS`, senão desligado); `GET /visitor-access/:id` público com id sequencial (agora exige `X-Visitor-Token` devolvido no criar, ou JWT de equipe; app guarda em `accessToken`); código de troca de senha em texto e no log de produção (agora hash, log só fora de produção); seed recusa banco não local sem `SEED_DEMO_PASSWORD`.
- LGPD: aceite obrigatório no cadastro (backend `400` sem `acceptedPrivacyPolicy`; grava data/versão), política única em `mobile/src/data/privacyPolicy.js` (a tela Privacidade antiga afirmava coisas falsas), "Excluir minha conta" (`DELETE /patients/me` com senha), aviso pro visitante.
- **Decisão do usuário (22/10): planos pagos/hospedagem ficam pra depois** — antes, pesquisar custo (beacons, servidor, banco) e modelo de cobrança. Servidor hoje nos EUA (Render Oregon) = transferência internacional, já informada na política.
- Pendente em produção (após merge): trocar senhas das contas demo, tirar `0.0.0.0/0` do banco, trocar `JWT_SECRET`.

**20. Modo noturno, teclado e idiomas (24/10)**
- Modo noturno: 14 telas usavam a paleta fixa do tema claro (StyleSheet no nível do módulo importando `colors`, paleta própria tipo `COLORS`, ou hex escrito direto). Agora `createStyles(colors)` + hook `useThemeStyles()` por arquivo. Ao criar tela nova: **nunca** importar `colors` de `theme/colors` pra estilo — usar `appColors` do `useApp()`. O modo noturno e o idioma agora ficam salvos no celular (`AppContext`, SecureStore).
- Teclado: com `edgeToEdge` o Android não encolhe a janela; `components/KeyboardAwareScrollView.js` (sem lib nativa — a `react-native-keyboard-controller` traz reanimated/worklets que conflita com o Expo 57) mede o teclado e rola até o campo em foco. Já está dentro do `Screen`; não usar `KeyboardAvoidingView` em tela nova.
- Idiomas pt/en/es (decisão do usuário: por etapas): `src/i18n` + `t()` do `useApp()`; teste garante mesmas chaves nos 3. Seletor em Configurações e no topo do login. **Concluído (26/10):** todas as telas em uso, inclusive cadastro, visitante, política de privacidade, mapa/rota e chegada. Ao criar texto novo: chave nos 3 arquivos (o teste quebra se faltar). Continua em português de propósito: motivo de chamado enviado à recepção, nomes de destinos, instruções/motivos vindos da API e notificações do servidor; constantes de módulo guardam o valor em português como id e mostram `t(...)`.
  - **Assistente — adiado (decisão da usuária, 26/10: não se sabe se a IA continua).** A tela está traduzida (títulos, atalhos, aviso "só entende português" em en/es), mas as respostas e o reconhecimento de frases do `navoraAssistant.js` são só em português — "help"/"emergency" em inglês **não** viram emergência. Retomar só se o assistente for mantido.
  - Não traduzidas por não serem abertas por nenhuma tela: `ProfileChoice`, `AreaEntry`, `HelpChoice`, `PatientIdentification`, `Mode3D` (candidatas a remoção); `BeaconDiagnostics` é só de desenvolvimento.

**21. Redesign da Home "versão 6" (24/10)** — Home, `AppHeader`, `BottomTabs` e barra de rota ativa. Sem mexer em backend/navegação/SOS/IA.
- Regra de cor: bordô sólido (`appColors.primaryStrong` — #7A1021 no claro, #B3203A no escuro pra texto branco ter contraste) **só** no card Ajuda/SOS, seta da busca e botão "Continuar". O resto: tile `iconBg` + ícone bordô, sem degradê/sombra pesada. Tokens novos em `theme/colors.js`: `primaryStrong`, `accentBorder`, `tabInactive`.
- `react-native-svg` 15.15.4 (aprovado pela usuária; versão do Expo 57, sem peer conflitante). Ícones próprios em `components/NavIcons.js` (menu, sino, 5 abas).
- `components/ActiveRouteBar.js`: barra "Rota em andamento" dentro do `BottomTabs` (aparece em toda tela com abas; `hideRouteBar` no Mapa/3D/Modo espera). Lê `liveRoute` do `AppContext` — é o `activeRoute` REAL do `App.js` passado ao `AppProvider`; o `activeRoute` do contexto é exemplo ("Tomografia") usado só como reserva pelas telas de mapa. Distância/tempo padrão do adapter ('80 m'/'2 min') vêm marcados `distanceIsFallback`/`timeIsFallback` e a barra esconde. `useRouteBarSpace()` soma o espaço da barra no fim da rolagem (Screen, Home, Ajuda, Perfil, Assistente).
- Home: saiu o bloco "Sua jornada" (localização "aproximada" mostrada como dado + próxima rota vazia). Cartões de status do visitante mantidos sem mudança.

**22. Publicação nas lojas — análise de 27/10 (nada feito ainda, só levantado)**
Plano da usuária: piloto pago no hospital (HMC), Android **e** iOS, pacientes baixam pela loja via QR code.
- Bloqueadores: (1) Render free dorme 30–50 s e o app desiste em 20 s → primeiro login falha (revisor da Apple reprova) + banco free expira 19/11 → precisa Render Starter e banco pago; (2) "Esqueci minha senha" não envia e-mail em produção → ligar envio ou esconder; (3) botões Google/Apple "Em breve" → tirar; (4) `eas.json` só tem `development` → criar perfil `production` (AAB Android, iOS, versão automática); (5) textos de permissão iOS faltando: localização (`expo-location`), câmera/galeria (`expo-image-picker`, foto do perfil), Face ID (`expo-local-authentication`); (6) política de privacidade em URL pública + página web de exclusão de conta (exigência do Google); (7) autorização escrita do hospital para usar nome "HMC Private"/"Hospital Marco Capute" e a foto; (8) contas Google Play (US$ 25, conta pessoal = 12 testadores por 14 dias em teste fechado) e Apple (US$ 99/ano); (9) conta de teste + vídeo da rota para os revisores.
- Ajustes: `ios.supportsTablet` → `false`; declarar `usesNonExemptEncryption: false`; adicionar o SHA-1 da assinatura da Play na restrição da chave do Google Maps; esconder o botão de microfone ("ainda não disponível"); texto do Bluetooth no iOS promete localização automática que só existe no Android; build de produção com API de produção, `EXPO_PUBLIC_BLE_ENABLED=true`, diagnóstico desligado.
- Formulários das lojas: declarar alergias (`notes`) e acessibilidade/deficiência como **dados de saúde/sensíveis**; categoria Medicina.
- Já OK: exclusão de conta no app, aceite da política, app funciona sem beacon (escolha manual — essencial no iPhone), i18n pt/en/es.

**23. Segurança — análise de 27/10 (nada feito ainda, só levantado)**
- Já OK no código: `helmet`, CORS por lista, `ValidationPipe` estrito, bcrypt, throttler global (200/min) + limites menores em `/auth`, token de troca de senha com 32 bytes e hash, guards por perfil, token do painel em `sessionStorage`, token do app no SecureStore.
- **Achar/corrigir:** `main.ts` não tem `trust proxy`. Atrás do proxy do Render todas as requisições podem chegar com o mesmo IP → o limite de 5 logins/min valeria para o hospital inteiro. Conferir em produção e adicionar `app.set('trust proxy', 1)` (Express).
- **Trote/fraude:** `POST /calls`, `/calls/help`, `/calls/sos` e `POST /visitor-access` são públicos (necessário pro "Acesso rápido"), só com o limite global → alguém pode inundar o painel com SOS falso. Limite próprio bem menor nessas rotas e marcar no painel os chamados sem conta.
- **Perda de dados:** banco free não tem backup e expira → banco pago com backup/restauração; monitor externo testando login (a produção já ficou 10 dias fora sem ninguém ver); `/health` não consulta o banco.
- **Invasão de contas de serviço:** 2FA em GitHub, Render, banco, Google Cloud, Play Console e Apple; trocar `JWT_SECRET` e senha do banco (vazaram em conversa); contas individuais da equipe (sem senha compartilhada), desativar quem sair.
- Ainda pendentes do `docs/lgpd.md`: registro de auditoria, plano de resposta a incidente.

**24. Abertura com pino percorrendo o caminho (28/10) — branch `feat/splash-pino` (a partir da `chore/expo-sdk-58`), falta testar no celular**
- `SplashScreen.js`: saiu a barrinha de progresso; o pino sai do começo do caminho, sobe pelas curvas crescendo de 40% até o tamanho do pino original do desenho, com pulso no chão ao chegar e esmaecimento para a cor de fundo do tema (`appColors.background`) antes do Login/Home. O trecho já percorrido fica bordô forte e o que falta fica a 20%. Texto "Carregando..." mantido.
- Imagens novas geradas a partir de `camimho2.png`: `splash_fundo.jpg` (sem pino e sem caminho) e `splash_caminho.png` (só o caminho, com transparência). O recorte do trecho percorrido é uma máscara do `react-native-svg` com a linha central medida no desenho (tela de referência 390×844, esticada como o fundo). `camimho2.png` não é mais importado (ficou no repositório, fora do bundle).
- Termina pelo carregamento real: `App.js` passa `ready={navigationLoaded && sessionChecked}` (`sessionChecked` novo, marcado no fim do `restoreSession`). Mínimo 1,5 s, máximo 4 s (o Render pode levar 30–50 s para acordar — não esperar por ele).
- "Reduzir movimento" do celular (`AccessibilityInfo.isReduceMotionEnabled`): pino já aparece no fim, sem percorrer nem pulsar.
- Protótipo aprovado pela usuária no canvas de design "Navora — Home atual".

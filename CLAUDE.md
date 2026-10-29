# Navora — Contexto para Claude Code

App de navegação hospitalar (Navora / sistema HMC). Monorepo: `mobile/` (Expo SDK 58, RN 0.88, React 19.3 — sem React Navigation, state machine em `App.js`), `backend-nest/` (NestJS + Prisma + PostgreSQL), `web-admin/` (React + Vite; o painel real é `src/App.jsx`).

Histórico detalhado de cada bug/feature/decisão (itens 1–24): `docs/historico.md`. Consultar antes de mexer em algo já resolvido.

## Prioridades (28/10)
0. **Branch `fix/seguranca-entrega` (29/10, item 25 do histórico):** corrige painel web em branco, pedido de visitante que nunca chegava, SOS falso offline e furos de acesso; traz desativação de funcionário, recuperação de senha por e-mail (SMTP) e selo "Sem conta" nos chamados. Precisa entrar antes de qualquer deploy (+ APK novo). Configurar SMTP no Render para o "Esqueci minha senha" funcionar.
1. **Produção:** falta trocar a senha do banco e o `JWT_SECRET` (`docs/lgpd.md` §3). Push pra `main` = deploy de produção — só a usuária faz (`git push origin <branch>:main`).
2. **Banco de produção free expira 19/11/2026** — procedimento em `docs/arquitetura.md` §7 (skill `/recriar-banco`). Plano pago adiado até pesquisar custos.
3. **Beacons:** calibrar no hospital (`measuredPower`, `BEACON_STABILITY`), testar "Localização inicial" (CTM-13/14). Voz (reconhecimento do aparelho) pode entrar no mesmo APK.
4. **Testes no celular físico:** "Primeiro acesso", editar perfil, SOS no painel em ~15 s (CTM-05/06/10/11 em `docs/casos_de_teste.md`).
5. **App Store (iOS)** — código pronto em 28/10: botões Google/Apple "Em breve" removidos (Apple reprova botão falso e exigiria "Entrar com Apple"), textos de permissão em pt no `app.json` (Face ID, câmera, fotos, localização; sem microfone), `supportsTablet: false`, `ITSAppUsesNonExemptEncryption: false`, perfil `production` no `eas.json` (API de produção embutida), política pública em `web-admin/public/privacidade.html` (gerada do `privacyPolicy.js` por `npm run privacidade`). **Falta (usuária):** conta Apple Developer — app de saúde exige conta de **organização** (hospital, com D-U-N-S; regra 5.1.1(ix)) ou ficar só no TestFlight; plano pago no Render (servidor dormindo/banco expirando reprova na revisão); conta demo pro revisor; trocar `JWT_SECRET`/senha do banco; testar num iPhone (nunca testado). BLE já fica desligado no iOS (`ios_unsupported`).
6. Sem pressa: seletor de andar com dados reais; dividir telas gigantes (`VisitorEntryScreen`, `PatientHomeScreen`, `App.js`) quando precisar mexer.

## Regras de escopo (não violar)
- Só 2 perfis no mobile: Paciente e Visitante. Sem funcionário/médico.
- Sem QR Code, sem agendamento, sem chamada de paciente.
- BLE (beacons Feasycom FSC-BP104D, códigos `FSC-01/02/10/11`) é OPCIONAL — app funciona 100% sem beacon. Só Android.
- Não remover o fallback offline (`navigationAdapter.js`).
- Private e SUS têm estruturas separadas — não assumir que uma funciona igual à outra.
- Antes de mudar algo, entender a estrutura atual e reutilizar o que existe (não duplicar arquivos/componentes).
- Assistente é determinístico, sem LLM (decisão da usuária). Frases novas: teste em `navoraAssistant.test.mjs` + sinônimo em `navoraAssistant.js`.

## Regras de código (mobile)
- **Tema:** nunca importar `colors` de `theme/colors` pra estilo. Usar `appColors` do `useApp()` com `createStyles(colors)` + `useThemeStyles()` no arquivo (ver `CareAreaChoiceScreen.js`).
- **Texto:** todo texto visível via `t()` do `useApp()`, com a chave em `src/i18n/pt.js`, `en.js` e `es.js` (o teste quebra se faltar). Ficam em português: motivo de chamado, nomes de destinos, textos vindos da API.
- **Tela:** usar `Screen` (já tem safe area + `KeyboardAwareScrollView`); com abas, passar `withBottomTabs`. Nunca `KeyboardAvoidingView`, nem `SafeAreaView` do `react-native`.
- **Cor (público idoso, minimalista):** bordô sólido (`appColors.primaryStrong`) só no card Ajuda/SOS, seta da busca e botão "Continuar"/"Iniciar rota". Cabeçalho, rodapé e faixas de status/gestos em rosado suave (`bar`); fundo branco-gelo `#FAF7F8`; cards brancos. Testados em 28/10 e reprovados: rodapé bordô sólido (forte demais) e fundo cinza `#F3F2F4` (cinza demais). Resto: tile `iconBg` + ícone bordô.
- **Cabeçalho:** botões ☰/🔔/voltar sempre com `HeaderIconButton` (tile branco + ícone bordô sobre o `bar`). Não criar botão de cabeçalho próprio na tela. Telas internas passam `onBack` ao `Header` → "← Voltar" visível no iOS e no Android (iPhone não tem voltar do sistema). As 5 abas usam `tabRoot` (sem voltar).
- **Teclado:** tudo que precisa ficar acima do teclado usa `useKeyboardHeight()` (já soma a barra de navegação do Android edge-to-edge); formulários usam o `Screen` (rola até o campo). Testar toda tela com campo com o teclado aberto.
- **Senha:** regra única de senha forte (8+, letra, número, símbolo, sem espaço) em `utils/masks.js` (`passwordRules`) + `components/PasswordRules.js`, e no backend `common/strong-password.ts`. Mudou um, muda o outro.
- `requestedDestination` pode vir como objeto da API — coagir `(typeof rd === 'string' ? rd : rd?.name)`.

## Comandos
- Mobile: `npm test` (assistente, iBeacon, i18n), `npm run lint`.
- Backend: `npm test`, `npm run test:e2e`, `npm run lint`. Local na porta 8000, Postgres via Docker.
- Web-admin: `npm run lint`.
- APK: skill `/build-apk`. Projeto em `C:\dev\navora` desde 28/10/2026 (saiu do OneDrive: caminho longo quebrava o build do RN 0.88).

## Ambientes
- Local: `mobile/.env` aponta pro IP Wi-Fi da máquina (muda com a rede — conferir com `ipconfig`). Contas demo `navora-demo-123` só valem no banco local.
- Produção: `https://navora-backend-kpio.onrender.com` (Render Oregon, serviço `srv-dah043rl550s73d10v8g`, banco `navora-db-2` / `dpg-dbburtjncjis73fdjpig-a`). Dorme após 15 min (1º request 30–50 s). Pra ver se está viva, testar **login** (skill `/checar-producao`), não `/health`. Senhas de produção ficam com a usuária. Banco fechado pra internet.

## Identidade visual
Fundo branco ou branco-gelo, detalhes em bordô (#980027), aparência limpa e premium, bastante espaço em branco, ícones simples, textos objetivos, botões grandes (público pode ter mobilidade reduzida/ansiedade). Tokens e regras completos no Design System: https://claude.ai/artifact/JJF9fBQvzWDyYwrQppEANj (ler o `project/README.md` dele antes de desenhar tela/mockup; fonte da verdade continua sendo `mobile/src/theme/`).

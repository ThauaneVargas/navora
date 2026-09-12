# Navora — Contexto para Claude Code

## Projeto
App de navegação hospitalar (Navora / sistema HMC). Monorepo: `mobile/` (Expo RN, sem React Navigation — state machine em `App.js`), `backend-nest/` (NestJS + Prisma + PostgreSQL), `web-admin/` (React + Vite).

## Regras de escopo (não violar)
- Só 2 perfis no mobile: Paciente e Visitante. Sem funcionário/médico.
- Sem QR Code, sem agendamento, sem chamada de paciente.
- BLE (beacons MBM04) deve continuar OPCIONAL — app tem que funcionar 100% sem beacon físico.
- Não remover fallback offline (`navigationAdapter.js`) — ele simula rota quando API está fora.
- Private e SUS têm estruturas separadas, não assumir que uma funciona igual na outra.
- Antes de mudar algo, entender a estrutura atual e reutilizar o que já existe (não duplicar arquivos/componentes).

## Bugs já diagnosticados

**1. Geolocalização real (HowToGetScreen) — RESOLVIDO**
- `HowToGetScreen.js` usa `expo-location`, pede permissão foreground, pega posição real e passa como `origin` para Google Maps/Waze/Apple Maps com fallback claro.

**2. Safe area no Android — RESOLVIDO**
- `Screen.js` scroll mode: adicionado `top` e `bottom` aos edges do SafeAreaView.
- `ExternalRouteScreen.js`: trocado `SafeAreaView` do react-native pelo da `react-native-safe-area-context`.
- `app.json` já tinha `edgeToEdge: true` para Android.

**3. "Objects are not valid as a React child" — RESOLVIDO**
- `PatientHomeScreen.js`: `requestedDestination` pode ser objeto (da API). Corrigido com coerção `(typeof rd === 'string' ? rd : rd?.name)` nos dois lugares onde era renderizado/passado como string.
- Raiz: `visitorAccessRequest.requestedDestination` pode vir como objeto `{name, id, ...}` da API.

**4. "Pedir correção na recepção" — PENDENTE**
- Botão mencionado mas não encontrado no código. Confirmar com usuário em qual tela deveria aparecer.

**5. ArrivalDetectedScreen.js visual — baixa prioridade**
- Visualmente fraco comparado a outras telas. Reforçar hierarquia visual seguindo padrão do app (fundo branco/gelo, bordô).

**6. Login falhando silenciosamente — RESOLVIDO**
- Adicionado timeout de 20s via AbortController na função `request()` de `api.js`.
- Erros de timeout agora mostram mensagem específica ("Servidor inicializando").
- Erros 5xx têm mensagem própria.
- `.env` já tinha URL correta do Render.com (`https://navora-backend-kpio.onrender.com`).

## Nota de versão
- Projeto está no **Expo SDK 57**.
- Backend em produção: Render.com (pode demorar ~30s para acordar no plano gratuito).

## Identidade visual
Fundo branco ou branco-gelo, detalhes em bordô (#980027), aparência limpa e premium, bastante espaço em branco, ícones simples, textos objetivos, botões grandes (público pode ter mobilidade reduzida/ansiedade).

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

## Bugs e features — status atual

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
- Mensagens específicas para timeout, rede, 401/403, 5xx.
- `.env` mobile aponta para IP local: `http://192.168.29.66:8000`.

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

**10. Fluxo de "Preciso de ajuda" incompleto — RESOLVIDO (parcial)**
- HelpScreen já tinha o menu com opções ("Preciso de ajuda", "SOS", "Estou perdido", "Acessibilidade", "Falar com a recepção").
- Corrigido: "Falar com a recepção" usava `kind: 'help'` igual ao "Preciso de ajuda" → ambos mostravam spinner ao mesmo tempo. Separado para `kind: 'reception'`.
- Spinner agora só aparece no botão certo. Timeout de 20s garante que não trava infinitamente.

**11. Botão de SOS sem confirmação — RESOLVIDO**
- `confirmSos()` já existia em HelpScreen.js com Alert.alert "Acionar SOS?" + botões Cancelar/Acionar.

**12. "Suporte humano" não leva a lugar nenhum — RESOLVIDO**
- "Suporte humano" é o subtitle do botão "Chamar ajuda" em LostScreen.js, que navega para `'Help'` screen.
- O fluxo funciona: LostScreen → Help (HelpScreen). Não havia tela faltando.

## Nota de versão
- Projeto está no **Expo SDK 57**.
- Backend local: `http://192.168.29.66:8000` (NestJS + PostgreSQL via Docker).
- Backend produção: `https://navora-backend-kpio.onrender.com` (Render.com — dorme após 15min).

## Identidade visual
Fundo branco ou branco-gelo, detalhes em bordô (#980027), aparência limpa e premium, bastante espaço em branco, ícones simples, textos objetivos, botões grandes (público pode ter mobilidade reduzida/ansiedade).

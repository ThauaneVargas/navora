# Validação BLE Real — Feasycom FSC-BP104D

Hardware comprado (16/10): **Feasycom FSC-BP104D**, BLE 5.1. Substitui o candidato genérico "Minew MBM02" mencionado em versões anteriores deste documento — a arquitetura do Navora não depende de marca/modelo (ver "Provider BLE Real" abaixo), então a troca de candidato não exige mudança de design.

**Ainda não instalar `react-native-ble-plx` nem nenhuma biblioteca BLE nativa.** Esta fase é só preparação de dados/documentação. Instalar a biblioteca exige um novo development build (prebuild + `expo run:android`), que é a próxima sessão, não esta.

## Specs confirmadas do FSC-BP104D (datasheet Feasycom)
- Chipset: Dialog **DA14531**.
- Protocolos simultâneos: iBeacon, Eddystone (UID/URL/TLM), AltBeacon — até 10 slots de advertising.
- TX power: **-19,5 dBm a +2,5 dBm**, padrão de fábrica 0 dBm, configurável.
- Intervalo de advertising: **100 ms a 10000 ms**, padrão de fábrica 1300 ms, configurável.
- Alcance: até 400 m em campo aberto a 2,5 dBm (em corredor de hospital, com paredes e gente, espere bem menos — é por isso que a fase de medição de RSSI abaixo continua necessária).
- Bateria: 2x AAA substituível, até 10 anos na configuração padrão. IP67.
- App de configuração: **FeasyBeacon** (grátis, iOS/Android) — é por ele que se lê/altera UUID, Major, Minor, TX power e intervalo.

## Passo a passo com a unidade física em mãos
1. Baixar o app **FeasyBeacon** (iOS/Android) e ligar o beacon (ele já vem advertising de fábrica).
2. Abrir o app, deixar escanear e tocar na unidade encontrada pra conectar.
3. Anotar o que o app mostra de fábrica: UUID, Major, Minor, TX power, intervalo.
4. Configurar esta primeira unidade assim (convenção combinada com o código abaixo):
   - Formato: manter **iBeacon**.
   - **Major = 4** (referência à família "04" já usada nos códigos de demonstração `MBM04-*`), **Minor = 1** (primeira unidade física; a próxima unidade compoda usa Minor = 2, e assim por diante).
   - TX power: reduzir pra algo entre **-12 dBm e -6 dBm** — dentro de hospital, TX alto (0 dBm/+2,5 dBm) estoura o alcance e mistura leitura de corredores vizinhos.
   - Intervalo de advertising: **300 ms a 500 ms** — mais responsivo que o padrão de 1300 ms pra detecção de chegada, sem gastar bateria de forma relevante (a unidade ainda dura anos).
5. Salvar a configuração no app e testar: o FeasyBeacon mostra RSSI em tempo real na tela de conexão, dá pra validar que ele está respondendo antes de sair medindo distância.
6. Não mexer em todos os beacons de uma vez — validar esta primeira unidade (fixada na entrada Private, ver `FSC-04-01` abaixo) antes de configurar as próximas.
7. Depois de configurar, me avisar com uma foto da tela do app (UUID completo, Major, Minor, TX power e intervalo finais) — é o que falta pra eu fechar a extração do `beaconCode` no código de scanning real (fase 2).

## Já preparado no código (sem risco, nada ligado na UI)
- **Backend:** `backend-nest/prisma/seed.ts` tem um registro `Beacon` com `code: 'FSC-04-01'`, vinculado ao nó de navegação da entrada Private (o mesmo ponto do `MBM04-01` simulado). `POST /beacons/detect` já reconhece esse código assim que o seed rodar — a rota já existe e já funciona, não precisa de código novo pra isso.
- **Mobile:** `mobile/src/data/routes.js` tem `'FSC-04-01'` na lista de `beaconCodes` da entrada `PRIVATE_BACK`, ao lado do código simulado `MBM04-01`. Isso significa que, se algo no app chamar `getEntranceByBeaconCode('FSC-04-01')`, a entrada certa já é resolvida.
- Nada disso muda o comportamento do app hoje: nenhum scanner real existe ainda, então esse código fica inerte até a fase 2 (abaixo). O app continua funcionando 100% sem beacon físico, como a regra de escopo exige.

## Fase 2 — scanning real (próxima sessão, precisa de dev build)
Isso ainda **não** foi feito. Quando formos fazer:
1. Instalar `react-native-ble-plx` (única biblioteca JS que suporta BLE nativo real — Expo Go não escaneia BLE de verdade, só funciona em development build).
2. Gerar um novo development build (`npx expo prebuild` + `npx expo run:android`) — o mesmo processo já feito uma vez pro Poco X7 Pro.
3. Escrever um provider real (`FeasycomBleProvider` ou nome equivalente) implementando a mesma interface que já existe em `indoorLocationService.js`: `start`, `stop`, `subscribe`, `getStatus`, emitindo o mesmo evento normalizado (`source`, `identifier`, `uuid`, `major`, `minor`, `manufacturerData`, `rssi`, `txPower`, `detectedAt`).
4. Decidir ali, com o Major/Minor reais em mãos, como montar o `beaconCode` que vai pro `POST /beacons/detect` (provavelmente `` `FSC-${major}-${minor}` ``, pra bater com o `FSC-04-01` já semeado).
5. Não trocar o Dijkstra nem a lógica de rota por causa da biblioteca BLE — o provider só alimenta eventos, a navegação continua igual.

## Android / iOS (permissões — avaliar só na fase 2, não agora)
- Android 12+: `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`.
- Android ≤ 11: permissões de Bluetooth legadas + localização, dependendo da versão/biblioteca.
- iOS: `NSBluetoothAlwaysUsageDescription`, validar foreground primeiro — background scanning fica fora da primeira validação.
Não travar política definitiva antes de testar em aparelho real.

## Plano de medição de RSSI (fase 2, com o beacon já configurado)
Medir RSSI em 1 m, 2 m, 3 m, 5 m, nos cenários: corredor, parede, esquina, porta, com gente circulando. Coletar várias amostras e avaliar mediana, média, variância, estabilidade e troca entre beacons — só depois disso definir:
- Diferença mínima de RSSI pra trocar de beacon (hysteresis).
- Número de amostras pra considerar uma leitura estável.
- Tempo mínimo entre trocas.

Nada disso deve ser decidido antes de ter dados reais do FSC-BP104D — os números do datasheet (TX power, intervalo) são ponto de partida, não valor final.

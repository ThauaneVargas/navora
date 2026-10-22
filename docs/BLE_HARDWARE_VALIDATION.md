# Validação BLE Real — Feasycom FSC-BP104D

Hardware: **Feasycom FSC-BP104D**, BLE 5.1 (4 aparelhos configurados em 21/10/2026). A arquitetura do Navora não depende de marca/modelo: o provider BLE só entrega um evento normalizado (ver "Provider BLE" abaixo).

**Configuração real dos aparelhos (UUID, major, minor, MAC, local): `docs/beacons-configuracao.md`.** Este documento cobre specs, permissões e o plano de calibração.

## Specs do FSC-BP104D (datasheet Feasycom)
- Chipset: Dialog **DA14531**.
- Protocolos simultâneos: iBeacon, Eddystone (UID/URL/TLM), AltBeacon — até 10 slots de advertising. No Navora só o slot iBeacon fica ativo.
- TX power: **-19,5 dBm a +2,5 dBm** (configurado em 0 dBm).
- Intervalo de advertising: **100 ms a 10000 ms** (configurado em 500 ms).
- Alcance: até 400 m em campo aberto a 2,5 dBm — dentro do hospital, com paredes e gente, bem menos.
- Bateria: 2x AAA substituível. IP67.
- App de configuração: **FeasyBeacon** (iOS/Android).

> Se a entrada e o "ponto interno" de uma mesma unidade se confundirem na prática (os dois com sinal forte ao mesmo tempo), o primeiro ajuste é **baixar o TX power** (ex.: -8 dBm) no FeasyBeacon, antes de mexer nos limites de troca do app.

## Provider BLE
O provider real implementa a mesma interface do simulado em `mobile/src/services/indoorLocationService.js` (`start`, `stop`, `subscribe`, `getStatus`) e emite o mesmo evento normalizado (`source`, `identifier`, `uuid`, `major`, `minor`, `manufacturerData`, `rssi`, `txPower`, `detectedAt`). A navegação (Dijkstra, instruções) não muda por causa da biblioteca BLE.

O BLE é **opcional**: sem a flag `EXPO_PUBLIC_BLE_ENABLED`, no Expo Go, com Bluetooth desligado, permissão negada ou nenhum beacon por perto, o app segue com a escolha manual da entrada.

## Permissões
- Android 12+ (API 31+): `BLUETOOTH_SCAN` + `ACCESS_FINE_LOCATION`. O `BLUETOOTH_SCAN` **não** pode ter `neverForLocation` — com essa flag o Android filtra os pacotes de beacon.
- Android 11 ou menor: `ACCESS_FINE_LOCATION`.
- iOS: `NSBluetoothAlwaysUsageDescription`.
- Leitura só com o app aberto. Sem localização em segundo plano.

## Plano de medição de RSSI (no hospital)
Medir RSSI em 1 m, 2 m, 3 m e 5 m, nos cenários: corredor, parede, esquina, porta, com gente circulando. Coletar várias amostras e avaliar mediana, média, variância e estabilidade — e a troca entre "entrada" e "ponto interno" da mesma unidade. Com esses dados:
- gravar `measuredPower` (RSSI a 1 m medido no local) de cada beacon;
- ajustar os limites de troca de beacon do app (diferença mínima de RSSI, número de leituras seguidas, tempo mínimo entre trocas). Os valores iniciais do app são um ponto de partida, não valor final.

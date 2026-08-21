# Validacao Futura MBM02 / BLE Real

Este documento prepara a validacao futura. Nao instalar biblioteca BLE nesta fase.

## Hardware Candidato

O candidato atual e Minew MBM02. A arquitetura do Navora nao deve ficar acoplada a marca/modelo; o provider BLE futuro deve depender de evento normalizado.

## Primeiro Beacon

Quando o hardware chegar:

1. Instalar app oficial/configurador quando necessario.
2. Ligar/configurar uma unidade.
3. Descobrir protocolo de advertising.
4. Registrar UUID/major/minor ou manufacturer data real.
5. Confirmar advertising interval.
6. Confirmar TX power.
7. Nao alterar todos os beacons de uma vez.

Comecar com uma unidade.

## Development Build

Projeto atual:

- Expo SDK 54.
- React Native 0.81.5.

BLE nativo provavelmente exigira development build/prebuild. Nao executar agora.

## Biblioteca Candidata

`react-native-ble-plx` e candidata, nao dependencia instalada.

Pontos:

- Requer codigo nativo.
- Nao funciona como scanner real no Expo Go.
- Compatibilidade precisa ser verificada novamente no momento da instalacao.

## Android

Checklist futuro:

- Android 12+: avaliar `BLUETOOTH_SCAN` e `BLUETOOTH_CONNECT`.
- Android <= 11: avaliar permissoes Bluetooth legadas e localizacao conforme versao/biblioteca.

Nao hardcodar politica definitiva antes de teste em aparelho real.

## iOS

- Configurar `NSBluetoothAlwaysUsageDescription`.
- Validar foreground primeiro.
- Background scanning fica fora da primeira validacao.

## Provider BLE Real

O provider BLE real deve implementar a mesma interface do provider atual:

- `start`
- `stop`
- `subscribe`
- `getStatus`

Ele deve emitir o mesmo evento normalizado:

- `source`
- `identifier`
- `uuid`
- `major`
- `minor`
- `manufacturerData`
- `rssi`
- `txPower`
- `detectedAt`

Nao alterar Dijkstra por causa da biblioteca BLE.

## Plano RSSI

Medir em:

- 1 m
- 2 m
- 3 m
- 5 m

Cenarios:

- Corredor.
- Parede.
- Esquina.
- Porta.
- Pessoas circulando.

Coletar varias amostras e avaliar mediana, media, variancia, estabilidade e troca entre beacons.

## Hysteresis

Thresholds so devem ser definidos apos dados reais. Nao definir agora:

- Diferenca minima de RSSI.
- Numero definitivo de samples.
- Tempo de troca.

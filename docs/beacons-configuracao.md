# Beacons físicos — configuração

Hardware: **Feasycom FSC-BP104D** (BLE 5.1). Configurados em 21/10/2026 pelo app FeasyBeacon.

Códigos internos do Navora: `FSC-01`, `FSC-02`, `FSC-10` e `FSC-11` (até 22/10/2026 eram `MBM04-01/02/10/11`; a migration `20261022233000_rename_beacon_codes_fsc` troca nos bancos que já existiam). O corredor só simulado, sem aparelho, virou `SIM-20`. O modelo do aparelho fica no campo `hardwareModel` da tabela `beacons`.

## Configuração comum aos 4 aparelhos

| Parâmetro | Valor |
|---|---|
| Protocolo | iBeacon (só o slot iBeacon ativo; Eddystone/AltBeacon desligados) |
| UUID | `7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17` (o mesmo nos 4 — é o "UUID do Navora") |
| Intervalo de advertising | 500 ms |
| TX power | 0 dBm |
| `measuredPower` (RSSI a 1 m) | **nulo** até a calibração no hospital. Não usar o "RSSI at 1m" de fábrica. |

## Aparelhos

| Código no Navora | Local | Major | Minor | MAC | Nó de navegação ligado no seed |
|---|---|---|---|---|---|
| `FSC-01` | Entrada principal – HMC Private | 1 | 10 | `DC:0D:30:80:C7:4C` | `private-entry` |
| `FSC-02` | Ponto interno – HMC Private | 1 | 20 | final `C7:4E` | `private-reception` |
| `FSC-10` | Entrada principal – SUS | 2 | 10 | final `C7:D6` | `sus-entry` |
| `FSC-11` | Ponto interno – SUS | 2 | 20 | final `C7:3A` | `sus-reception` |

Convenção: **major = unidade** (1 = HMC Private, 2 = SUS) e **minor = posição** (10 = entrada, 20 = ponto interno). Um próximo aparelho na mesma unidade segue a sequência (ex.: major 1, minor 30).

O `SIM-20` (corredor compartilhado) continua só simulado — não há aparelho físico para ele.

> **Conferir no local:** o "ponto interno" de cada unidade está ligado, no seed, ao nó de navegação da **recepção**. Se o aparelho for instalado em outro ponto, o nó (`navigationNodeId`) precisa ser trocado no seed.

## Onde essa configuração aparece no código

- Banco: colunas `hardware_model`, `ibeacon_uuid`, `ibeacon_major`, `ibeacon_minor`, `measured_power` em `beacons` (migration `add_beacon_ble_identity`). O trio UUID + major + minor é único.
- Seed: `backend-nest/prisma/seed.ts` (tabela `physicalBeacons`).
- API: `POST /beacons/detect` aceita `uuid` + `major` + `minor` (ver `docs/API.md`).
- App: só lê pacotes com o UUID acima (`mobile/src/services/ibeacon.js`).

## Calibração (fazer no hospital, não em casa)

1. Abrir a tela de diagnóstico de beacons (só aparece na versão de desenvolvimento).
2. Para cada aparelho, ficar a 1 m dele, parado, por ~30 s, e anotar o RSSI médio que a tela mostra.
3. Gravar esse valor em `measuredPower` do beacon correspondente.
4. Repetir a 3 m e 5 m e no "ponto interno" com gente circulando, para ajustar a troca entre beacons (ver `docs/BLE_HARDWARE_VALIDATION.md`, "Plano RSSI").

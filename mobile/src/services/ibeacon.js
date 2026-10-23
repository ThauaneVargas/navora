/**
 * Regras puras de iBeacon do Navora (sem React Native — testável no Node,
 * ver ibeacon.test.mjs): leitura do pacote, filtro pelo UUID do Navora, tabela
 * dos beacons instalados e escolha do beacon "estável".
 *
 * Configuração real dos aparelhos: docs/beacons-configuracao.md. Se mudar lá
 * (ou no seed do backend), atualizar NAVORA_BEACONS aqui também.
 */

export const NAVORA_IBEACON_UUID = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17';

// Usada no app para: nome do local na tela de diagnóstico e detecção quando a
// API está fora do ar (o backend continua sendo a fonte principal).
export const NAVORA_BEACONS = [
  { code: 'FSC-01', major: 1, minor: 10, label: 'Entrada principal – HMC Private', area: 'private', originNodeCode: 'private-entry' },
  { code: 'FSC-02', major: 1, minor: 20, label: 'Ponto interno – HMC Private', area: 'private', originNodeCode: 'private-reception' },
  { code: 'FSC-10', major: 2, minor: 10, label: 'Entrada principal – SUS', area: 'sus', originNodeCode: 'sus-entry' },
  { code: 'FSC-11', major: 2, minor: 20, label: 'Ponto interno – SUS', area: 'sus', originNodeCode: 'sus-reception' },
];

export const findNavoraBeacon = (major, minor) =>
  NAVORA_BEACONS.find((beacon) => beacon.major === major && beacon.minor === minor) || null;

export const beaconKey = (major, minor) => `${major}:${minor}`;

const APPLE_COMPANY_ID = [0x4c, 0x00]; // 0x004C, little-endian no pacote
const IBEACON_TYPE = 0x02;
const IBEACON_LENGTH = 0x15; // 21 bytes: UUID(16) + major(2) + minor(2) + txPower(1)

// Mesma regra do backend: minúsculas, com hífens; null se não for UUID.
export function normalizeUuid(value) {
  const hex = String(value ?? '').trim().replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) return null;
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

const toHex = (byte) => byte.toString(16).padStart(2, '0');

/**
 * Lê o conteúdo do manufacturer data da Apple. Aceita com ou sem o ID da
 * empresa na frente (o Android entrega sem; dados "crus" vêm com).
 * @param {number[]} bytes
 * @returns {{uuid: string, major: number, minor: number, txPower: number} | null}
 */
export function parseIBeacon(bytes) {
  if (!Array.isArray(bytes)) return null;
  let data = bytes;
  if (data[0] === APPLE_COMPANY_ID[0] && data[1] === APPLE_COMPANY_ID[1]) {
    data = data.slice(2);
  }
  if (data.length < 23 || data[0] !== IBEACON_TYPE || data[1] !== IBEACON_LENGTH) return null;

  const uuid = normalizeUuid(data.slice(2, 18).map(toHex).join(''));
  const major = (data[18] << 8) | data[19];
  const minor = (data[20] << 8) | data[21];
  const txPower = data[22] > 127 ? data[22] - 256 : data[22]; // byte com sinal
  return uuid ? { uuid, major, minor, txPower } : null;
}

/**
 * Extrai o iBeacon do objeto `advertising` do react-native-ble-manager
 * (manufacturerData indexado pelo ID da empresa, ex. "004c").
 */
export function extractIBeacon(advertising) {
  if (!advertising) return null;
  const byCompany = advertising.manufacturerData || {};
  const appleKey = Object.keys(byCompany).find((key) => parseInt(key, 16) === 0x004c);
  const candidates = [byCompany[appleKey]?.bytes, advertising.manufacturerRawData?.bytes];
  for (const bytes of candidates) {
    const parsed = parseIBeacon(bytes);
    if (parsed) return parsed;
  }
  return null;
}

/**
 * Quando trocar de beacon. Valores INICIAIS — calibrar no hospital (ver
 * docs/BLE_HARDWARE_VALIDATION.md, "Plano de medição de RSSI").
 */
export const BEACON_STABILITY = {
  minSamples: 3, // leituras na janela antes de confiar no beacon
  staleAfterMs: 6000, // sem ouvir o beacon por esse tempo: ele saiu de alcance
  switchMarginDb: 6, // o novo precisa estar pelo menos esse tanto mais forte
  switchConfirmations: 3, // ...em avaliações seguidas (o app avalia 1x por segundo)
};

/**
 * Escolhe o beacon "atual" sem ficar pulando entre entrada e ponto interno.
 *
 * @param {Array<{key: string, medianRssi: number|null, count: number, lastSeenAt: number}>} beacons
 * @param {{currentKey: string|null, challengerKey: string|null, challengerWins: number}} state
 * @param {number} now - ms
 * @returns {{currentKey, challengerKey, challengerWins, changed: boolean}}
 */
export function selectStableBeacon(beacons, state, now, config = BEACON_STABILITY) {
  const previous = { currentKey: null, challengerKey: null, challengerWins: 0, ...state };
  const usable = beacons.filter(
    (beacon) =>
      Number.isFinite(beacon.medianRssi) &&
      beacon.count >= config.minSamples &&
      now - beacon.lastSeenAt <= config.staleAfterMs
  );
  const best = usable.reduce((top, beacon) => (!top || beacon.medianRssi > top.medianRssi ? beacon : top), null);
  const current = usable.find((beacon) => beacon.key === previous.currentKey) || null;
  const settle = (currentKey) => ({
    currentKey,
    challengerKey: null,
    challengerWins: 0,
    changed: currentKey !== previous.currentKey,
  });

  // Nada por perto, ou o beacon atual sumiu: assume o melhor que houver (ou nenhum).
  if (!current) return settle(best ? best.key : null);

  if (!best || best.key === current.key || best.medianRssi < current.medianRssi + config.switchMarginDb) {
    return settle(current.key);
  }

  const wins = previous.challengerKey === best.key ? previous.challengerWins + 1 : 1;
  if (wins >= config.switchConfirmations) return settle(best.key);
  return { currentKey: current.key, challengerKey: best.key, challengerWins: wins, changed: false };
}

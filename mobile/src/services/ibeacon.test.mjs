// Testes das regras de iBeacon (`npm test` dentro de mobile/).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  BEACON_STABILITY,
  NAVORA_IBEACON_UUID,
  extractIBeacon,
  findNavoraBeacon,
  normalizeUuid,
  parseIBeacon,
  selectStableBeacon,
} from './ibeacon.js';

// Monta o conteúdo do manufacturer data da Apple: 0x02 0x15 + UUID + major + minor + txPower.
function ibeaconBytes({ uuid = NAVORA_IBEACON_UUID, major = 1, minor = 10, txPower = -59, withCompanyId = false } = {}) {
  const uuidBytes = uuid.replace(/-/g, '').match(/../g).map((hex) => parseInt(hex, 16));
  const body = [0x02, 0x15, ...uuidBytes, major >> 8, major & 0xff, minor >> 8, minor & 0xff, txPower & 0xff];
  return withCompanyId ? [0x4c, 0x00, ...body] : body;
}

test('lê o pacote iBeacon com e sem o ID da Apple na frente', () => {
  const expected = { uuid: NAVORA_IBEACON_UUID, major: 1, minor: 10, txPower: -59 };
  assert.deepEqual(parseIBeacon(ibeaconBytes()), expected);
  assert.deepEqual(parseIBeacon(ibeaconBytes({ withCompanyId: true })), expected);
});

test('major/minor de 2 bytes e txPower com sinal', () => {
  const parsed = parseIBeacon(ibeaconBytes({ major: 513, minor: 65535, txPower: 4 }));
  assert.equal(parsed.major, 513);
  assert.equal(parsed.minor, 65535);
  assert.equal(parsed.txPower, 4);
});

test('pacote que não é iBeacon é ignorado', () => {
  assert.equal(parseIBeacon(ibeaconBytes().slice(0, 20)), null, 'curto demais');
  assert.equal(parseIBeacon([0x03, 0x15, ...ibeaconBytes().slice(2)]), null, 'tipo errado');
  assert.equal(parseIBeacon(undefined), null);
});

test('extrai do formato do react-native-ble-manager (chave "004c", qualquer caixa)', () => {
  assert.equal(extractIBeacon({ manufacturerData: { '004c': { bytes: ibeaconBytes({ minor: 20 }) } } }).minor, 20);
  assert.equal(extractIBeacon({ manufacturerData: { '004C': { bytes: ibeaconBytes({ minor: 20 }) } } }).minor, 20);
  assert.equal(extractIBeacon({ manufacturerRawData: { bytes: ibeaconBytes({ withCompanyId: true }) } }).minor, 10);
  assert.equal(extractIBeacon({ manufacturerData: { '0006': { bytes: [1, 2, 3] } } }), null, 'outro fabricante');
});

test('UUID comparado sem caixa e com ou sem hífens', () => {
  assert.equal(normalizeUuid(NAVORA_IBEACON_UUID.replace(/-/g, '').toUpperCase()), NAVORA_IBEACON_UUID);
  assert.equal(normalizeUuid('nao-e-uuid'), null);
});

test('tabela local bate com a configuração dos 4 aparelhos', () => {
  assert.equal(findNavoraBeacon(1, 10).code, 'FSC-01');
  assert.equal(findNavoraBeacon(1, 20).code, 'FSC-02');
  assert.equal(findNavoraBeacon(2, 10).code, 'FSC-10');
  assert.equal(findNavoraBeacon(2, 20).code, 'FSC-11');
  assert.equal(findNavoraBeacon(9, 9), null);
});

// --- troca estável de beacon ---------------------------------------------------
const NOW = 100_000;
const seen = (key, medianRssi, { count = 5, ago = 0 } = {}) => ({ key, medianRssi, count, lastSeenAt: NOW - ago });
const empty = { currentKey: null, challengerKey: null, challengerWins: 0 };

test('sem beacon por perto, não escolhe nenhum', () => {
  assert.equal(selectStableBeacon([], empty, NOW).currentKey, null);
});

test('não confia em beacon com poucas leituras', () => {
  const result = selectStableBeacon([seen('1:10', -60, { count: BEACON_STABILITY.minSamples - 1 })], empty, NOW);
  assert.equal(result.currentKey, null);
});

test('primeiro beacon confiável vira o atual', () => {
  const result = selectStableBeacon([seen('1:10', -70), seen('1:20', -80)], empty, NOW);
  assert.equal(result.currentKey, '1:10');
  assert.equal(result.changed, true);
});

test('não troca por diferença pequena de sinal (evita pular entre entrada e ponto interno)', () => {
  const state = { ...empty, currentKey: '1:10' };
  const result = selectStableBeacon([seen('1:10', -70), seen('1:20', -66)], state, NOW);
  assert.equal(result.currentKey, '1:10');
  assert.equal(result.changed, false);
});

test('troca só depois de várias avaliações seguidas com o outro claramente mais forte', () => {
  const beacons = [seen('1:10', -75), seen('1:20', -62)];
  let state = { ...empty, currentKey: '1:10' };
  for (let i = 1; i < BEACON_STABILITY.switchConfirmations; i += 1) {
    state = selectStableBeacon(beacons, state, NOW);
    assert.equal(state.currentKey, '1:10', `ainda não troca na avaliação ${i}`);
  }
  state = selectStableBeacon(beacons, state, NOW);
  assert.equal(state.currentKey, '1:20');
  assert.equal(state.changed, true);
});

test('se o desafiante perde a vantagem no meio, a contagem recomeça', () => {
  let state = { ...empty, currentKey: '1:10' };
  state = selectStableBeacon([seen('1:10', -75), seen('1:20', -62)], state, NOW);
  state = selectStableBeacon([seen('1:10', -70), seen('1:20', -68)], state, NOW); // vantagem sumiu
  state = selectStableBeacon([seen('1:10', -75), seen('1:20', -62)], state, NOW);
  assert.equal(state.currentKey, '1:10');
  assert.equal(state.challengerWins, 1);
});

test('se o beacon atual some (fora de alcance), assume o melhor na hora', () => {
  const state = { ...empty, currentKey: '1:10' };
  const result = selectStableBeacon(
    [seen('1:10', -60, { ago: BEACON_STABILITY.staleAfterMs + 1 }), seen('2:10', -80)],
    state,
    NOW
  );
  assert.equal(result.currentKey, '2:10');
});

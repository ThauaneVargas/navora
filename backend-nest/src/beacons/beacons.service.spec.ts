import { strict as assert } from 'node:assert';
import { BeaconsService } from './beacons.service';

const navigationNode = {
  id: 10,
  code: 'private-entry',
  label: 'Entrada Private',
  floor: 'Piso Terreo',
};

const NAVORA_UUID = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17';

const beacons = [
  beacon('MBM04-01', navigationNode, { ibeaconUuid: NAVORA_UUID, ibeaconMajor: 1, ibeaconMinor: 10 }),
  beacon('MBM04-99', null),
];

function beacon(code: string, node: any, ble: any = {}) {
  return {
    id: code === 'MBM04-01' ? 1 : 99,
    code,
    hardwareModel: ble.ibeaconUuid ? 'Feasycom FSC-BP104D' : null,
    ibeaconUuid: ble.ibeaconUuid ?? null,
    ibeaconMajor: ble.ibeaconMajor ?? null,
    ibeaconMinor: ble.ibeaconMinor ?? null,
    measuredPower: null,
    name: code,
    area: 'private',
    areaName: 'HMC Private',
    location: 'Entrada pelos fundos',
    battery: 90,
    sector: 'Entrada Private',
    status: 'Online',
    navigationNodeId: node?.id ?? null,
    navigationNode: node,
    lastSignalAt: new Date('2026-01-05T12:00:00.000Z'),
  };
}

function makeService() {
  const prisma = {
    beacon: {
      findMany: async () => beacons,
      findUnique: async ({ where }: any) => {
        const ble = where.ibeaconUuid_ibeaconMajor_ibeaconMinor;
        if (ble) {
          return beacons.find((item) =>
            item.ibeaconUuid === ble.ibeaconUuid
            && item.ibeaconMajor === ble.ibeaconMajor
            && item.ibeaconMinor === ble.ibeaconMinor) ?? null;
        }
        return beacons.find((item) => item.code === where.code) ?? null;
      },
      update: async ({ where, data }: any) => ({
        ...beacons.find((item) => item.code === where.code),
        ...data,
      }),
    },
  };

  return new BeaconsService(prisma as any);
}

async function run() {
  const service = makeService();
  const known = await service.detect({ beaconCode: 'MBM04-01' });
  assert.equal(known.detected, true, 'beacon conhecido detecta');
  assert.equal(known.area, 'private', 'campo antigo area preservado');
  assert.equal(known.entrance, 'Entrada pelos fundos', 'campo antigo entrance preservado');
  assert.equal(known.origin_node_code, 'private-entry', 'beacon com node retorna origin_node_code');
  assert.equal(known.navigation_node?.code, 'private-entry', 'beacon com node retorna navigation_node');

  const withoutNode = await service.detect({ beacon_code: 'MBM04-99' });
  assert.equal(withoutNode.detected, true, 'beacon conhecido sem node detecta');
  assert.equal(withoutNode.origin_node_code, null, 'beacon conhecido sem node retorna origin null');
  assert.equal(withoutNode.navigation_node, null, 'beacon conhecido sem node preserva compatibilidade');

  const unknown = await service.detect({ beaconCode: 'UNKNOWN' });
  assert.deepEqual(unknown, { detected: false }, 'beacon desconhecido');

  // Identificação pelo pacote iBeacon (uuid + major + minor).
  const byIbeacon = await service.detect({ uuid: NAVORA_UUID, major: 1, minor: 10, rssi: -62 });
  assert.equal(byIbeacon.detected, true, 'uuid+major+minor detecta');
  assert.equal(byIbeacon.beacon_code, 'MBM04-01', 'deteccao por iBeacon devolve o codigo interno');
  assert.equal(byIbeacon.origin_node_code, 'private-entry', 'deteccao por iBeacon devolve origin_node_code');

  const upperNoHyphens = await service.detect({ uuid: NAVORA_UUID.replace(/-/g, '').toUpperCase(), major: 1, minor: 10 });
  assert.equal(upperNoHyphens.beacon_code, 'MBM04-01', 'uuid em maiusculas e sem hifens tambem detecta');

  assert.deepEqual(await service.detect({ uuid: NAVORA_UUID, major: 1, minor: 99 }), { detected: false }, 'minor desconhecido');
  assert.deepEqual(await service.detect({ uuid: 'nao-e-uuid', major: 1, minor: 10 }), { detected: false }, 'uuid invalido');
  assert.deepEqual(await service.detect({ uuid: NAVORA_UUID, major: 1 }), { detected: false }, 'trio incompleto (sem minor)');

  const codeWins = await service.detect({ beaconCode: 'MBM04-99', uuid: NAVORA_UUID, major: 1, minor: 10 });
  assert.equal(codeWins.beacon_code, 'MBM04-99', 'se vierem os dois, o codigo interno tem prioridade');

  const listed = await service.list();
  assert.equal(listed[0].origin_node_code, 'private-entry', 'listagem inclui origin_node_code');
  assert.equal(listed[0].last_signal_at, '2026-01-05T12:00:00.000Z');

  console.log('beacons service tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

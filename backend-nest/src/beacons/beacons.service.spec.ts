import { strict as assert } from 'node:assert';
import { BeaconsService } from './beacons.service';

const navigationNode = {
  id: 10,
  code: 'private-entry',
  label: 'Entrada Private',
  floor: 'Piso Terreo',
};

const beacons = [
  beacon('MBM04-01', navigationNode),
  beacon('MBM04-99', null),
];

function beacon(code: string, node: any) {
  return {
    id: code === 'MBM04-01' ? 1 : 99,
    code,
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
      findUnique: async ({ where }: any) => beacons.find((item) => item.code === where.code) ?? null,
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

  const listed = await service.list();
  assert.equal(listed[0].origin_node_code, 'private-entry', 'listagem inclui origin_node_code');
  assert.equal(listed[0].last_signal_at, '2026-01-05T12:00:00.000Z');

  console.log('beacons service tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

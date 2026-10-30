import * as assert from 'node:assert/strict';
import { ServiceUnavailableException } from '@nestjs/common';
import { HealthController } from './health.controller';

async function run() {
  const up = new HealthController({ $queryRaw: async () => [{ '?column?': 1 }] } as any);
  assert.deepEqual(await up.health(), { status: 'ok', service: 'Navora Backend NestJS', database: 'ok' });

  // Banco fora: o monitor precisa receber erro (503), nao "ok".
  const down = new HealthController({
    $queryRaw: async () => {
      throw new Error("P1001: Can't reach database server");
    },
  } as any);
  await assert.rejects(() => down.health(), ServiceUnavailableException, 'banco fora -> 503');

  console.log('health tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

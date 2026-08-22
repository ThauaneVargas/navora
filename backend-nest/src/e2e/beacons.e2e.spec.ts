import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as assert from 'node:assert/strict';
import request = require('supertest');
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

async function login(
  httpServer: any,
  email: string,
  password = 'navora-demo-123',
) {
  const response = await request(httpServer)
    .post('/auth/login')
    .send({
      email,
      password,
    });

  assert.equal(response.status, 201);
  assert.ok(response.body.access_token);

  return response.body.access_token as string;
}

async function run() {
  const moduleRef = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication();

  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: false,
    }),
  );

  await app.init();

  const httpServer = app.getHttpServer();
  const prisma = app.get(PrismaService);
  let originalLastSignalAt: Date | undefined;

  try {
    const originalBeacon = await prisma.beacon.findUnique({
      where: { code: 'MBM04-01' },
      select: { lastSignalAt: true },
    });

    assert.ok(
      originalBeacon,
      'MBM04-01 deve existir no seed',
    );

    originalLastSignalAt = originalBeacon.lastSignalAt;

    //
    // TOKENS DOS PERFIS
    //
    const adminToken = await login(
      httpServer,
      'admin@navora.com',
    );

    const receptionToken = await login(
      httpServer,
      'recepcao@navora.com',
    );

    const patientToken = await login(
      httpServer,
      'paciente@navora.com',
    );

    //
    // 1. LISTAGEM SEM TOKEN DEVE SER BLOQUEADA
    //
    const listWithoutToken = await request(httpServer)
      .get('/beacons');

    assert.equal(listWithoutToken.status, 401);

    //
    // 2. PATIENT NÃO PODE LISTAR BEACONS
    //
    const patientList = await request(httpServer)
      .get('/beacons')
      .set(
        'Authorization',
        `Bearer ${patientToken}`,
      );

    assert.equal(patientList.status, 403);

    //
    // 3. RECEPTION PODE LISTAR BEACONS
    //
    const receptionList = await request(httpServer)
      .get('/beacons')
      .set(
        'Authorization',
        `Bearer ${receptionToken}`,
      );

    assert.equal(receptionList.status, 200);
    assert.ok(Array.isArray(receptionList.body));
    assert.ok(receptionList.body.length > 0);

    //
    // 4. ADMIN PODE LISTAR BEACONS
    //
    const adminList = await request(httpServer)
      .get('/beacons')
      .set(
        'Authorization',
        `Bearer ${adminToken}`,
      );

    assert.equal(adminList.status, 200);
    assert.ok(Array.isArray(adminList.body));
    assert.ok(adminList.body.length > 0);

    //
    // 5. BEACON MBM04-01 DEVE EXISTIR
    //
    const knownBeacon = adminList.body.find(
      (beacon: any) =>
        beacon.code === 'MBM04-01',
    );

    assert.ok(
      knownBeacon,
      'MBM04-01 deve existir no seed',
    );

    assert.equal(
      knownBeacon.origin_node_code,
      'private-entry',
    );

    //
    // 6. DETECÇÃO É PÚBLICA
    // FORMATO camelCase
    //
    const detectCamelCase = await request(httpServer)
      .post('/beacons/detect')
      .send({
        beaconCode: 'MBM04-01',
      });

    assert.equal(detectCamelCase.status, 201);
    assert.equal(
      detectCamelCase.body.detected,
      true,
    );

    assert.equal(
      detectCamelCase.body.area,
      'private',
    );

    assert.equal(
      detectCamelCase.body.entrance,
      'Entrada pelos fundos',
    );

    assert.equal(
      detectCamelCase.body.origin_node_code,
      'private-entry',
    );

    assert.ok(
      detectCamelCase.body.navigation_node,
    );

    assert.equal(
      detectCamelCase.body.navigation_node.code,
      'private-entry',
    );

    //
    // 7. FORMATO snake_case TAMBÉM DEVE FUNCIONAR
    //
    const detectSnakeCase = await request(httpServer)
      .post('/beacons/detect')
      .send({
        beacon_code: 'MBM04-01',
      });

    assert.equal(detectSnakeCase.status, 201);
    assert.equal(
      detectSnakeCase.body.detected,
      true,
    );

    assert.equal(
      detectSnakeCase.body.origin_node_code,
      'private-entry',
    );

    //
    // 8. BEACON DESCONHECIDO NÃO DEVE CAUSAR ERRO
    //
    const unknownBeacon = await request(httpServer)
      .post('/beacons/detect')
      .send({
        beaconCode: 'UNKNOWN-BEACON',
      });

    assert.equal(unknownBeacon.status, 201);

    assert.deepEqual(
      unknownBeacon.body,
      {
        detected: false,
      },
    );

    //
    // 9. PAYLOAD VAZIO É TRATADO COM SEGURANÇA
    //
    const emptyDetection = await request(httpServer)
      .post('/beacons/detect')
      .send({});

    assert.equal(emptyDetection.status, 201);

    assert.deepEqual(
      emptyDetection.body,
      {
        detected: false,
      },
    );

    //
    // 10. beaconCode COM TIPO INVÁLIDO
    //
    const invalidCamelCaseType = await request(
      httpServer,
    )
      .post('/beacons/detect')
      .send({
        beaconCode: 12345,
      });

    assert.equal(
      invalidCamelCaseType.status,
      400,
    );

    //
    // 11. beacon_code COM TIPO INVÁLIDO
    //
    const invalidSnakeCaseType = await request(
      httpServer,
    )
      .post('/beacons/detect')
      .send({
        beacon_code: 12345,
      });

    assert.equal(
      invalidSnakeCaseType.status,
      400,
    );

    //
    // 12. TOKEN INVÁLIDO NA LISTAGEM
    //
    const listWithInvalidToken = await request(
      httpServer,
    )
      .get('/beacons')
      .set(
        'Authorization',
        'Bearer token-invalido',
      );

    assert.equal(
      listWithInvalidToken.status,
      401,
    );

    //
    // 13. DETECÇÃO PÚBLICA NÃO EXIGE JWT
    //
    const publicDetection = await request(httpServer)
      .post('/beacons/detect')
      .send({
        beaconCode: 'MBM04-01',
      });

    assert.equal(publicDetection.status, 201);
    assert.equal(
      publicDetection.body.detected,
      true,
    );

    console.log(
      'beacons + indoor detection E2E tests passed',
    );
  } finally {
    try {
      if (originalLastSignalAt !== undefined) {
        await prisma.beacon.update({
          where: { code: 'MBM04-01' },
          data: { lastSignalAt: originalLastSignalAt },
        });
      }
    } finally {
      await app.close();
    }
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

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
  // A detecção grava lastSignalAt: guarda o valor original dos beacons tocados
  // pelo teste e restaura no finally.
  const touchedCodes = ['FSC-01', 'FSC-02', 'FSC-10'];
  const originalLastSignalAt = new Map<string, Date>();

  try {
    for (const code of touchedCodes) {
      const original = await prisma.beacon.findFirst({ where: { code, hospital: { code: 'hmc' } }, select: { lastSignalAt: true } });
      assert.ok(original, `${code} deve existir no seed`);
      originalLastSignalAt.set(code, original.lastSignalAt);
    }

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
    // 5. BEACON FSC-01 DEVE EXISTIR
    //
    const knownBeacon = adminList.body.find(
      (beacon: any) =>
        beacon.code === 'FSC-01',
    );

    assert.ok(
      knownBeacon,
      'FSC-01 deve existir no seed',
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
        beaconCode: 'FSC-01',
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
        beacon_code: 'FSC-01',
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
        beaconCode: 'FSC-01',
      });

    assert.equal(publicDetection.status, 201);
    assert.equal(
      publicDetection.body.detected,
      true,
    );

    //
    // 14. DETECÇÃO POR iBeacon (uuid + major + minor), como o celular lê
    //     — configuração real em docs/beacons-configuracao.md
    //
    const NAVORA_UUID = '7f3c2a91-5b4e-4d8a-9c61-2e8b0d5f4a17';

    const ibeaconSus = await request(httpServer)
      .post('/beacons/detect')
      .send({ uuid: NAVORA_UUID, major: 2, minor: 10, rssi: -71 });

    assert.equal(ibeaconSus.status, 201);
    assert.equal(ibeaconSus.body.detected, true);
    assert.equal(ibeaconSus.body.beacon_code, 'FSC-10');
    assert.equal(ibeaconSus.body.area, 'sus');
    assert.equal(ibeaconSus.body.origin_node_code, 'sus-entry');

    //
    // 15. UUID EM MAIÚSCULAS E SEM HÍFENS TAMBÉM IDENTIFICA
    //
    const ibeaconUpper = await request(httpServer)
      .post('/beacons/detect')
      .send({ uuid: NAVORA_UUID.replace(/-/g, '').toUpperCase(), major: 1, minor: 20 });

    assert.equal(ibeaconUpper.status, 201);
    assert.equal(ibeaconUpper.body.beacon_code, 'FSC-02');

    //
    // 16. TRIO DESCONHECIDO NÃO É ERRO
    //
    const ibeaconUnknown = await request(httpServer)
      .post('/beacons/detect')
      .send({ uuid: NAVORA_UUID, major: 9, minor: 99 });

    assert.equal(ibeaconUnknown.status, 201);
    assert.deepEqual(ibeaconUnknown.body, { detected: false });

    //
    // 17. VALORES FORA DO PADRÃO iBeacon SÃO RECUSADOS
    //
    const majorOutOfRange = await request(httpServer)
      .post('/beacons/detect')
      .send({ uuid: NAVORA_UUID, major: 70000, minor: 10 });

    assert.equal(majorOutOfRange.status, 400);

    const minorAsText = await request(httpServer)
      .post('/beacons/detect')
      .send({ uuid: NAVORA_UUID, major: 1, minor: 'dez' });

    assert.equal(minorAsText.status, 400);

    //
    // 18. LISTAGEM EXPÕE A IDENTIDADE iBeacon (measured_power nulo até calibrar)
    //
    const listedPhysical = adminList.body.find((beacon: any) => beacon.code === 'FSC-01');
    assert.equal(listedPhysical.hardware_model, 'Feasycom FSC-BP104D');
    assert.equal(listedPhysical.ibeacon_major, 1);
    assert.equal(listedPhysical.ibeacon_minor, 10);
    assert.equal(listedPhysical.measured_power, null);

    console.log(
      'beacons + indoor detection E2E tests passed',
    );
  } finally {
    try {
      for (const [code, lastSignalAt] of originalLastSignalAt) {
        await prisma.beacon.updateMany({ where: { code, hospital: { code: 'hmc' } }, data: { lastSignalAt } });
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

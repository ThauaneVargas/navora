import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { ThrottlerGuard } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as assert from 'node:assert/strict';
import { setTimeout as sleep } from 'node:timers/promises';
import request = require('supertest');
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

// Separacao por hospital de ponta a ponta (HTTP + banco de verdade): a equipe
// de um 2o hospital nao ve nem altera nada do HMC, mesmo mandando o header
// X-Hospital do HMC; e o que o paciente faz no 2o hospital so aparece la.
// O 2o hospital e a equipe dele ficam no banco local (funcionario nao pode ser
// excluido — trigger); o teste reaproveita nas proximas execucoes.
const H2 = { code: 'e2e-h2', name: 'Hospital E2E 2' };
const PASSWORD = 'navora-demo-123';

async function login(httpServer: any, email: string) {
  const response = await request(httpServer).post('/auth/login').send({ email, password: PASSWORD });
  assert.equal(response.status, 201, `login ${email}`);
  return response.body.access_token as string;
}

async function run() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] })
    .overrideProvider(ThrottlerGuard)
    .useValue({ canActivate: () => true })
    .compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  await app.init();
  const httpServer = app.getHttpServer();
  const prisma = app.get(PrismaService);
  const createdCallIds: number[] = [];

  try {
    const hospital2 = await prisma.hospital.upsert({ where: { code: H2.code }, update: { active: true }, create: H2 });
    const passwordHash = await bcrypt.hash(PASSWORD, 10);
    for (const [email, role] of [['admin@e2e-h2.test', UserRole.ADMIN], ['recepcao@e2e-h2.test', UserRole.RECEPTION]] as const) {
      await prisma.user.upsert({
        where: { email },
        update: { hospitalId: hospital2.id, active: true, passwordHash, role },
        create: { email, name: `E2E ${role}`, passwordHash, role, hospitalId: hospital2.id, active: true },
      });
    }

    const hmcReception = await login(httpServer, 'recepcao@navora.com');
    const hmcAdmin = await login(httpServer, 'admin@navora.com');
    const h2Reception = await login(httpServer, 'recepcao@e2e-h2.test');
    const h2Admin = await login(httpServer, 'admin@e2e-h2.test');
    const patient = await login(httpServer, 'paciente@navora.com');

    const me = await request(httpServer).get('/auth/me').set('Authorization', `Bearer ${h2Reception}`);
    assert.equal(me.body.hospital?.code, H2.code, '/auth/me mostra o hospital da equipe');

    // SOS do paciente no HMC (sem header = hospital padrao).
    const hmcSos = await request(httpServer).post('/calls/sos').set('Authorization', `Bearer ${patient}`).send({ patient_name: 'E2E H1', location: 'Recepcao' });
    assert.equal(hmcSos.status, 201);
    createdCallIds.push(hmcSos.body.id);

    // O mesmo paciente usando o app no hospital 2.
    const h2Sos = await request(httpServer)
      .post('/calls/sos')
      .set('Authorization', `Bearer ${patient}`)
      .set('X-Hospital', H2.code)
      .send({ patient_name: 'E2E H2', location: 'Recepcao H2' });
    assert.equal(h2Sos.status, 201);
    createdCallIds.push(h2Sos.body.id);

    const unknownHospital = await request(httpServer).post('/calls/sos').set('Authorization', `Bearer ${patient}`).set('X-Hospital', 'nao-existe').send({ patient_name: 'x' });
    assert.equal(unknownHospital.status, 404, 'hospital desconhecido no header: 404');

    const hmcCalls = await request(httpServer).get('/calls').set('Authorization', `Bearer ${hmcReception}`);
    const hmcIds = hmcCalls.body.map((call: any) => call.id);
    assert.ok(hmcIds.includes(hmcSos.body.id), 'HMC ve o SOS feito no HMC');
    assert.ok(!hmcIds.includes(h2Sos.body.id), 'HMC NAO ve o SOS feito no hospital 2');

    const h2Calls = await request(httpServer).get('/calls').set('Authorization', `Bearer ${h2Reception}`);
    assert.deepEqual(
      h2Calls.body.map((call: any) => call.id).filter((id: number) => createdCallIds.includes(id)),
      [h2Sos.body.id],
      'hospital 2 ve so o proprio SOS',
    );

    // Trocar o header nao abre o outro hospital para a equipe.
    const sneaky = await request(httpServer).get('/calls').set('Authorization', `Bearer ${h2Reception}`).set('X-Hospital', 'hmc');
    assert.ok(!sneaky.body.some((call: any) => call.id === hmcSos.body.id), 'header X-Hospital nao muda o hospital da equipe');

    const crossPatch = await request(httpServer)
      .patch(`/calls/${hmcSos.body.id}/status`)
      .set('Authorization', `Bearer ${h2Reception}`)
      .send({ status: 'ACCEPTED' });
    assert.equal(crossPatch.status, 404, 'hospital 2 nao altera chamado do HMC');

    // Painel, mapa, beacons, equipe e relatorio: cada um so do proprio hospital.
    const h2Beacons = await request(httpServer).get('/beacons').set('Authorization', `Bearer ${h2Admin}`);
    assert.equal(h2Beacons.status, 200);
    assert.equal(h2Beacons.body.length, 0, 'hospital 2 (sem beacons) nao ve os beacons do HMC');
    const h2Destinations = await request(httpServer).get('/navigation/destinations').set('Authorization', `Bearer ${h2Reception}`);
    assert.equal(h2Destinations.body.data?.length ?? h2Destinations.body.length, 0, 'mapa do HMC nao aparece para o hospital 2');
    const h2Staff = await request(httpServer).get('/staff').set('Authorization', `Bearer ${h2Admin}`);
    assert.ok(h2Staff.body.every((member: any) => member.email.endsWith('@e2e-h2.test')), 'admin do hospital 2 so ve a propria equipe');
    const hmcStaff = await request(httpServer).get('/staff').set('Authorization', `Bearer ${hmcAdmin}`);
    const h2ReceptionId = (await prisma.user.findUniqueOrThrow({ where: { email: 'recepcao@e2e-h2.test' } })).id;
    assert.ok(!hmcStaff.body.some((member: any) => member.id === h2ReceptionId), 'admin do HMC nao ve a equipe do hospital 2');
    const crossDeactivate = await request(httpServer).patch(`/staff/${h2ReceptionId}/deactivate`).set('Authorization', `Bearer ${hmcAdmin}`).send({});
    assert.equal(crossDeactivate.status, 404, 'admin do HMC nao desativa funcionario do hospital 2');
    const summary = await request(httpServer).get('/dashboard/summary').set('Authorization', `Bearer ${h2Reception}`);
    assert.equal(summary.body.beaconsTotal, 0);

    // Beacon do HMC lido no hospital 2: nao reconhece.
    const detectH2 = await request(httpServer).post('/beacons/detect').set('X-Hospital', H2.code).send({ beaconCode: 'FSC-01' });
    assert.equal(detectH2.body.detected, false, 'beacon do HMC nao vale no hospital 2');

    // Auditoria: a acao da recepcao do HMC ficou registrada (sem dado pessoal).
    const accepted = await request(httpServer)
      .patch(`/calls/${hmcSos.body.id}/status`)
      .set('Authorization', `Bearer ${hmcReception}`)
      .send({ status: 'ACCEPTED' });
    assert.equal(accepted.status, 200);
    await sleep(300);
    const log = await prisma.auditLog.findFirst({
      where: { action: 'calls.updateStatus', entityId: String(hmcSos.body.id) },
      orderBy: { id: 'desc' },
    });
    assert.ok(log, 'alteracao do chamado entrou na auditoria');
    assert.deepEqual(log.details, { status: 'ACCEPTED' });
    const failedCross = await prisma.auditLog.count({ where: { action: 'calls.updateStatus', actorId: h2ReceptionId, entityId: String(hmcSos.body.id) } });
    assert.equal(failedCross, 0, 'tentativa recusada (404) nao vira registro de acao feita');

    // Exportar meus dados (LGPD) traz o SOS dos dois hospitais da propria pessoa.
    const exported = await request(httpServer).get('/patients/me/export').set('Authorization', `Bearer ${patient}`);
    assert.equal(exported.status, 200);
    const hospitalsInExport = exported.body.help_requests.map((call: any) => call.hospital);
    assert.ok(hospitalsInExport.includes(H2.name) && hospitalsInExport.includes('Hospital Marco Capute'));
    assert.equal(exported.body.account.email, 'paciente@navora.com');
    assert.equal(JSON.stringify(exported.body).includes('passwordHash'), false, 'export nunca leva a senha');

    console.log('hospital isolation E2E tests passed');
  } finally {
    await prisma.callRequest.deleteMany({ where: { id: { in: createdCallIds } } });
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

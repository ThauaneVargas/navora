import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as assert from 'node:assert/strict';
import request = require('supertest');
import { AppModule } from '../app.module';

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

  try {
    //
    // 1. ADMIN
    //
    const adminLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'admin@navora.com',
        password: 'navora-demo-123',
      });

    assert.equal(adminLogin.status, 201);
    assert.ok(adminLogin.body.access_token);
    assert.equal(adminLogin.body.user.email, 'admin@navora.com');
    assert.equal(adminLogin.body.user.role, 'ADMIN');
    assert.equal(adminLogin.body.user.active, true);

    // Segurança: nunca retornar hash da senha
    assert.equal(adminLogin.body.user.passwordHash, undefined);

    const adminToken = adminLogin.body.access_token;

    const adminMe = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminMe.status, 200);
    assert.equal(adminMe.body.email, 'admin@navora.com');
    assert.equal(adminMe.body.role, 'ADMIN');
    assert.equal(adminMe.body.passwordHash, undefined);

    const adminDashboard = await request(httpServer)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminDashboard.status, 200);
    assert.ok(adminDashboard.body);

    //
    // 2. RECEPTION
    //
    const receptionLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'recepcao@navora.com',
        password: 'navora-demo-123',
      });

    assert.equal(receptionLogin.status, 201);
    assert.ok(receptionLogin.body.access_token);
    assert.equal(receptionLogin.body.user.email, 'recepcao@navora.com');
    assert.equal(receptionLogin.body.user.role, 'RECEPTION');
    assert.equal(receptionLogin.body.user.passwordHash, undefined);

    const receptionToken = receptionLogin.body.access_token;

    const receptionMe = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${receptionToken}`);

    assert.equal(receptionMe.status, 200);
    assert.equal(receptionMe.body.role, 'RECEPTION');

    const receptionDashboard = await request(httpServer)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${receptionToken}`);

    assert.equal(receptionDashboard.status, 200);

    //
    // 3. PATIENT
    //
    const patientLogin = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'paciente@navora.com',
        password: 'navora-demo-123',
      });

    assert.equal(patientLogin.status, 201);
    assert.ok(patientLogin.body.access_token);
    assert.equal(patientLogin.body.user.email, 'paciente@navora.com');
    assert.equal(patientLogin.body.user.role, 'PATIENT');
    assert.equal(patientLogin.body.user.passwordHash, undefined);

    const patientToken = patientLogin.body.access_token;

    const patientMe = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', `Bearer ${patientToken}`);

    assert.equal(patientMe.status, 200);
    assert.equal(patientMe.body.role, 'PATIENT');

    // PATIENT não pode acessar dashboard administrativo
    const patientDashboard = await request(httpServer)
      .get('/dashboard/summary')
      .set('Authorization', `Bearer ${patientToken}`);

    assert.equal(patientDashboard.status, 403);

    //
    // 4. LOGIN INVÁLIDO
    //
    const invalidPassword = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'admin@navora.com',
        password: 'senha-incorreta',
      });

    assert.equal(invalidPassword.status, 401);

    //
    // 5. VALIDAÇÃO DO PAYLOAD
    //
    const invalidEmail = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'email-invalido',
        password: 'qualquer-senha',
      });

    assert.equal(invalidEmail.status, 400);

    const missingPassword = await request(httpServer)
      .post('/auth/login')
      .send({
        email: 'admin@navora.com',
      });

    assert.equal(missingPassword.status, 400);

    //
    // 6. ROTAS SEM AUTENTICAÇÃO
    //
    const meWithoutToken = await request(httpServer)
      .get('/auth/me');

    assert.equal(meWithoutToken.status, 401);

    const dashboardWithoutToken = await request(httpServer)
      .get('/dashboard/summary');

    assert.equal(dashboardWithoutToken.status, 401);

    //
    // 7. TOKEN INVÁLIDO
    //
    const meWithInvalidToken = await request(httpServer)
      .get('/auth/me')
      .set('Authorization', 'Bearer token-invalido');

    assert.equal(meWithInvalidToken.status, 401);

    const dashboardWithInvalidToken = await request(httpServer)
      .get('/dashboard/summary')
      .set('Authorization', 'Bearer token-invalido');

    assert.equal(dashboardWithInvalidToken.status, 401);

    console.log('auth + roles + validation + dashboard E2E tests passed');
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as assert from 'node:assert/strict';
import request = require('supertest');
import { AppModule } from '../app.module';
import { PrismaService } from '../database/prisma.service';

async function login(httpServer: any, email: string) {
  const response = await request(httpServer)
    .post('/auth/login')
    .send({ email, password: 'navora-demo-123' });
  assert.equal(response.status, 201);
  assert.ok(response.body.access_token);
  return response.body.access_token as string;
}

function assertSafePatient(patient: any) {
  assert.ok(patient);
  assert.equal(patient.user.passwordHash, undefined);
  assert.equal(patient.user.email, 'paciente@navora.com');
}

async function run() {
  const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
  const app = moduleRef.createNestApplication();
  app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true, forbidNonWhitelisted: false }));
  await app.init();
  const httpServer = app.getHttpServer();
  const prisma = app.get(PrismaService);
  const createdCallIds: number[] = [];
  const createdVisitorIds: number[] = [];
  const createdCheckInIds: number[] = [];
  const createdMessageIds: number[] = [];
  let registeredPatientEmail: string | undefined;
  let demoPatientProfileId: number | undefined;
  let originalDemoAccessibility: any;
  let originalDemoUpdatedAt: Date | undefined;

  try {
    const adminToken = await login(httpServer, 'admin@navora.com');
    const receptionToken = await login(httpServer, 'recepcao@navora.com');
    const patientToken = await login(httpServer, 'paciente@navora.com');

    const callsWithoutToken = await request(httpServer).get('/calls');
    assert.equal(callsWithoutToken.status, 401);
    const callsWithInvalidToken = await request(httpServer).get('/calls').set('Authorization', 'Bearer token-invalido');
    assert.equal(callsWithInvalidToken.status, 401);
    const patientCalls = await request(httpServer).get('/calls').set('Authorization', `Bearer ${patientToken}`);
    assert.equal(patientCalls.status, 403);
    const help = await request(httpServer).post('/calls/help').send({ patient_name: 'E2E Help', location: 'E2E location' });
    assert.equal(help.status, 201);
    assert.equal(help.body.call_type, 'HELP');
    assert.equal(help.body.status, 'PENDING');
    createdCallIds.push(help.body.id);
    const sos = await request(httpServer).post('/calls/sos').send({ patient_name: 'E2E SOS', reason: 'E2E emergency' });
    assert.equal(sos.status, 201);
    assert.equal(sos.body.call_type, 'SOS');
    assert.equal(sos.body.priority, 'CRITICAL');
    createdCallIds.push(sos.body.id);
    const invalidCall = await request(httpServer).post('/calls').send({ call_type: 'INVALID_TYPE' });
    assert.equal(invalidCall.status, 400);
    const callsList = await request(httpServer).get('/calls').set('Authorization', `Bearer ${receptionToken}`);
    assert.equal(callsList.status, 200);
    assert.ok(Array.isArray(callsList.body));
    assert.equal(callsList.body[0].passwordHash, undefined);
    const callStatus = await request(httpServer).patch(`/calls/${help.body.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'ACCEPTED' });
    assert.equal(callStatus.status, 200);
    assert.equal(callStatus.body.status, 'ACCEPTED');
    const missingCall = await request(httpServer).patch('/calls/999999999/status').set('Authorization', `Bearer ${adminToken}`).send({ status: 'CLOSED' });
    assert.equal(missingCall.status, 404);

    const visitorListWithoutToken = await request(httpServer).get('/visitor-access');
    assert.equal(visitorListWithoutToken.status, 401);
    const visitorListForPatient = await request(httpServer).get('/visitor-access').set('Authorization', `Bearer ${patientToken}`);
    assert.equal(visitorListForPatient.status, 403);
    const invalidVisitor = await request(httpServer).post('/visitor-access').send({});
    assert.equal(invalidVisitor.status, 400);
    const visitor = await request(httpServer).post('/visitor-access').send({ visitor_name: 'E2E Visitor Approve', requested_destination: 'private-visita' });
    assert.equal(visitor.status, 201);
    assert.equal(visitor.body.status, 'PENDING');
    assert.equal(visitor.body.denied_reason, null);
    createdVisitorIds.push(visitor.body.id);
    const visitorDetail = await request(httpServer).get(`/visitor-access/${visitor.body.id}`);
    assert.equal(visitorDetail.status, 200);
    assert.equal(visitorDetail.body.id, visitor.body.id);
    const approvedVisitor = await request(httpServer).patch(`/visitor-access/${visitor.body.id}/authorize`).set('Authorization', `Bearer ${receptionToken}`).send({ permissionMinutes: 15 });
    assert.equal(approvedVisitor.status, 200);
    assert.equal(approvedVisitor.body.status, 'APPROVED');
    assert.equal(approvedVisitor.body.permission_minutes, 15);
    const visitorInRoute = await request(httpServer).patch(`/visitor-access/${visitor.body.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_ROUTE' });
    assert.equal(visitorInRoute.status, 200);
    const invalidVisitorTransition = await request(httpServer).patch(`/visitor-access/${visitor.body.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'PENDING' });
    assert.equal(invalidVisitorTransition.status, 400);
    const deniedVisitor = await request(httpServer).post('/visitor-access').send({ visitor_name: 'E2E Visitor Deny', requested_destination: 'private-visita' });
    assert.equal(deniedVisitor.status, 201);
    createdVisitorIds.push(deniedVisitor.body.id);
    const denied = await request(httpServer).patch(`/visitor-access/${deniedVisitor.body.id}/deny`).set('Authorization', `Bearer ${adminToken}`).send({ denial_reason: 'E2E denied' });
    assert.equal(denied.status, 200);
    assert.equal(denied.body.status, 'DENIED');
    assert.equal(denied.body.denial_reason, 'E2E denied');
    const missingVisitor = await request(httpServer).get('/visitor-access/999999999');
    assert.equal(missingVisitor.status, 404);

    const checkInsWithoutToken = await request(httpServer).get('/check-ins');
    assert.equal(checkInsWithoutToken.status, 401);
    const checkInsForPatient = await request(httpServer).get('/check-ins').set('Authorization', `Bearer ${patientToken}`);
    assert.equal(checkInsForPatient.status, 403);
    const destinations = await request(httpServer).get('/navigation/destinations');
    assert.equal(destinations.status, 200);
    const destination = destinations.body.find((item: any) => item.code === 'private-tomografia');
    assert.ok(destination);
    const invalidCheckIn = await request(httpServer).post('/check-ins').set('Authorization', `Bearer ${receptionToken}`).send({ patient: 'E2E only' });
    assert.equal(invalidCheckIn.status, 400);
    const checkIn = await request(httpServer).post('/check-ins').set('Authorization', `Bearer ${receptionToken}`).send({ patient_name: 'E2E Check-in', destination_id: destination.id, destination_label: destination.name });
    assert.equal(checkIn.status, 201);
    assert.equal(checkIn.body.patient_name, 'E2E Check-in');
    assert.equal(checkIn.body.status, 'WAITING');
    createdCheckInIds.push(checkIn.body.id);
    const checkInDetail = await request(httpServer).get(`/check-ins/${checkIn.body.id}`).set('Authorization', `Bearer ${adminToken}`);
    assert.equal(checkInDetail.status, 200);
    const inRoute = await request(httpServer).patch(`/check-ins/${checkIn.body.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'IN_ROUTE' });
    assert.equal(inRoute.status, 200);
    const invalidCheckInTransition = await request(httpServer).patch(`/check-ins/${checkIn.body.id}/status`).set('Authorization', `Bearer ${adminToken}`).send({ status: 'WAITING' });
    assert.equal(invalidCheckInTransition.status, 400);
    const missingCheckIn = await request(httpServer).get('/check-ins/999999999').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(missingCheckIn.status, 404);

    const messagesWithoutToken = await request(httpServer).get('/operational-messages');
    assert.equal(messagesWithoutToken.status, 401);
    const messagesForPatient = await request(httpServer).get('/operational-messages').set('Authorization', `Bearer ${patientToken}`);
    assert.equal(messagesForPatient.status, 403);
    const invalidMessage = await request(httpServer).post('/operational-messages').set('Authorization', `Bearer ${receptionToken}`).send({ priority: 'Alta' });
    assert.equal(invalidMessage.status, 400);
    const message = await request(httpServer).post('/operational-messages').set('Authorization', `Bearer ${adminToken}`).send({ recipient: 'E2E reception', content: 'E2E operational message' });
    assert.equal(message.status, 201);
    assert.equal(message.body.content, 'E2E operational message');
    assert.equal(message.body.read_at, null);
    createdMessageIds.push(message.body.id);
    const markedRead = await request(httpServer).patch(`/operational-messages/${message.body.id}/read`).set('Authorization', `Bearer ${receptionToken}`);
    assert.equal(markedRead.status, 200);
    assert.ok(markedRead.body.read_at);
    const missingMessage = await request(httpServer).patch('/operational-messages/999999999/read').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(missingMessage.status, 404);

    const reportWithoutToken = await request(httpServer).post('/reports/admin').send({});
    assert.equal(reportWithoutToken.status, 401);
    const patientReport = await request(httpServer).post('/reports/admin').set('Authorization', `Bearer ${patientToken}`).send({});
    assert.equal(patientReport.status, 403);
    const invalidReport = await request(httpServer).post('/reports/admin').set('Authorization', `Bearer ${adminToken}`).send({ from: 'not-a-date' });
    assert.equal(invalidReport.status, 400);
    const report = await request(httpServer).post('/reports/admin').set('Authorization', `Bearer ${receptionToken}`).send({ period: 'e2e' });
    assert.equal(report.status, 201);
    assert.equal(report.body.source, 'api');
    assert.equal(report.body.period, 'e2e');
    for (const field of ['callsTotal', 'sosCalls', 'visitorPending', 'checkInsTotal', 'beaconsTotal', 'destinationsTotal']) {
      assert.equal(typeof report.body[field], 'number');
    }

    const patientMe = await request(httpServer).get('/patients/me').set('Authorization', `Bearer ${patientToken}`);
    assert.equal(patientMe.status, 200);
    assertSafePatient(patientMe.body);
    const adminPatientMe = await request(httpServer).get('/patients/me').set('Authorization', `Bearer ${adminToken}`);
    assert.equal(adminPatientMe.status, 403);
    const invalidRegistration = await request(httpServer).post('/patients/register').send({ email: 'invalid' });
    assert.equal(invalidRegistration.status, 400);
    registeredPatientEmail = `e2e.patient.${Date.now()}@example.com`;
    const registration = await request(httpServer).post('/patients/register').send({ email: registeredPatientEmail, password: 'e2e-password-123', name: 'E2E Patient', patientCode: `E2E-${Date.now()}` });
    assert.equal(registration.status, 201);
    assert.ok(registration.body.access_token);
    assert.equal(registration.body.patient.user.passwordHash, undefined);
    const demoPatientProfile = await prisma.patientProfile.findFirst({
      where: { user: { email: 'paciente@navora.com' } },
      select: { id: true, accessibility: true, updatedAt: true },
    });
    assert.ok(demoPatientProfile);
    demoPatientProfileId = demoPatientProfile.id;
    originalDemoAccessibility = JSON.parse(JSON.stringify(demoPatientProfile.accessibility));
    originalDemoUpdatedAt = demoPatientProfile.updatedAt;
    const updatedAccessibility = await request(httpServer).put('/patients/me/accessibility').set('Authorization', `Bearer ${patientToken}`).send({ largerText: true });
    assert.equal(updatedAccessibility.status, 200);
    assert.equal(updatedAccessibility.body.accessibility.largerText, true);
    const restoredPatient = await request(httpServer).put('/patients/me').set('Authorization', `Bearer ${patientToken}`).send({ accessibility: patientMe.body.accessibility });
    assert.equal(restoredPatient.status, 200);
    assertSafePatient(restoredPatient.body);

    console.log('calls + visitor access + check-ins + operational messages + reports + patients E2E tests passed');
  } finally {
    if (demoPatientProfileId !== undefined && originalDemoAccessibility !== undefined) {
      await prisma.patientProfile.update({
        where: { id: demoPatientProfileId },
        data: { accessibility: originalDemoAccessibility, updatedAt: originalDemoUpdatedAt },
      });
    }
    if (createdCheckInIds.length) await prisma.checkIn.deleteMany({ where: { id: { in: createdCheckInIds } } });
    if (createdVisitorIds.length) await prisma.visitorAccessRequest.deleteMany({ where: { id: { in: createdVisitorIds } } });
    if (createdCallIds.length) await prisma.callRequest.deleteMany({ where: { id: { in: createdCallIds } } });
    if (createdMessageIds.length) await prisma.operationalMessage.deleteMany({ where: { id: { in: createdMessageIds } } });
    if (registeredPatientEmail) {
      const user = await prisma.user.findUnique({ where: { email: registeredPatientEmail }, select: { id: true } });
      if (user) {
        await prisma.patientProfile.deleteMany({ where: { userId: user.id } });
        await prisma.user.delete({ where: { id: user.id } });
      }
    }
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

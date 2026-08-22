import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import * as assert from 'node:assert/strict';
import request = require('supertest');
import { AppModule } from '../app.module';

async function login(
  httpServer: any,
  email: string,
  password = 'navora-demo-123',
) {
  const response = await request(httpServer)
    .post('/auth/login')
    .send({ email, password });

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

  try {
    //
    // TOKENS DOS PERFIS
    //
    const adminToken = await login(httpServer, 'admin@navora.com');
    const receptionToken = await login(httpServer, 'recepcao@navora.com');
    const patientToken = await login(httpServer, 'paciente@navora.com');

    //
    // 1. BOOTSTRAP PÚBLICO
    //
    const bootstrapResponse = await request(httpServer)
      .get('/navigation/bootstrap');

    assert.equal(bootstrapResponse.status, 200);
    assert.ok(bootstrapResponse.body);

    //
    // 2. ÁREAS PÚBLICAS
    //
    const areasResponse = await request(httpServer)
      .get('/navigation/areas');

    assert.equal(areasResponse.status, 200);
    assert.ok(Array.isArray(areasResponse.body));
    assert.ok(areasResponse.body.length > 0);

    //
    // 3. DESTINOS PÚBLICOS
    //
    const destinationsResponse = await request(httpServer)
      .get('/navigation/destinations');

    assert.equal(destinationsResponse.status, 200);
    assert.ok(Array.isArray(destinationsResponse.body));
    assert.ok(destinationsResponse.body.length > 0);

    const privateReception = destinationsResponse.body.find(
      (destination: any) => destination.code === 'private-reception',
    );

    assert.ok(
      privateReception,
      'Destino private-reception deve existir no seed',
    );

    assert.ok(privateReception.id);

    //
    // 4. DETALHE DE DESTINO
    //
    const destinationResponse = await request(httpServer)
      .get(`/navigation/destinations/${privateReception.id}`);

    assert.equal(destinationResponse.status, 200);
    assert.equal(destinationResponse.body.code, 'private-reception');

    //
    // 5. ID INVÁLIDO DE DESTINO
    //
    const invalidDestinationIdResponse = await request(httpServer)
      .get('/navigation/destinations/abc');

    assert.equal(invalidDestinationIdResponse.status, 400);

    //
    // 6. MAPA SEM TOKEN
    //
    const mapWithoutToken = await request(httpServer)
      .get('/navigation/map');

    assert.equal(mapWithoutToken.status, 401);

    //
    // 7. PATIENT NÃO PODE ACESSAR MAPA ADMINISTRATIVO
    //
    const patientMap = await request(httpServer)
      .get('/navigation/map')
      .set('Authorization', `Bearer ${patientToken}`);

    assert.equal(patientMap.status, 403);

    //
    // 8. RECEPTION PODE ACESSAR MAPA
    //
    const receptionMap = await request(httpServer)
      .get('/navigation/map')
      .set('Authorization', `Bearer ${receptionToken}`);

    assert.equal(receptionMap.status, 200);
    assert.ok(Array.isArray(receptionMap.body.nodes));
    assert.ok(Array.isArray(receptionMap.body.edges));
    assert.ok(receptionMap.body.nodes.length > 0);
    assert.ok(receptionMap.body.edges.length > 0);

    //
    // 9. ADMIN PODE ACESSAR MAPA
    //
    const adminMap = await request(httpServer)
      .get('/navigation/map')
      .set('Authorization', `Bearer ${adminToken}`);

    assert.equal(adminMap.status, 200);
    assert.ok(Array.isArray(adminMap.body.nodes));
    assert.ok(Array.isArray(adminMap.body.edges));

    //
    // 10. ACCESS-CHECK PÚBLICO
    //
    const accessCheckResponse = await request(httpServer)
      .post('/navigation/access-check')
      .send({
        destination_code: 'private-reception',
        subject: 'PATIENT',
      });

    assert.equal(accessCheckResponse.status, 201);
    assert.ok(accessCheckResponse.body);
    assert.equal(typeof accessCheckResponse.body.allowed, 'boolean');
    assert.ok(accessCheckResponse.body.decision);

    //
    // 11. ACCESS-CHECK COM DESTINATION_ID
    //
    const accessCheckByIdResponse = await request(httpServer)
      .post('/navigation/access-check')
      .send({
        destination_id: privateReception.id,
        subject: 'PATIENT',
      });

    assert.equal(accessCheckByIdResponse.status, 201);
    assert.equal(
      typeof accessCheckByIdResponse.body.allowed,
      'boolean',
    );

    //
    // 12. ACCESS-CHECK COM SUBJECT INVÁLIDO
    //
    const invalidAccessSubject = await request(httpServer)
      .post('/navigation/access-check')
      .send({
        destination_code: 'private-reception',
        subject: 'INVALID_ROLE',
      });

    assert.equal(invalidAccessSubject.status, 400);

    //
    // 13. ROUTE-PREVIEW PÚBLICO
    //
    const publicRoutePreview = await request(httpServer)
      .post('/navigation/route-preview')
      .send({
        origin_node_code: 'private-entry',
        destination_code: 'private-reception',
        subject: 'PATIENT',
      });

    assert.equal(publicRoutePreview.status, 201);
    assert.equal(publicRoutePreview.body.route_found, true);
    assert.ok(Array.isArray(publicRoutePreview.body.nodes));
    assert.ok(Array.isArray(publicRoutePreview.body.edges));
    assert.ok(publicRoutePreview.body.nodes.length >= 1);

    //
    // 14. ROUTE-PREVIEW AUTENTICADO COMO PATIENT
    //
    const patientRoutePreview = await request(httpServer)
      .post('/navigation/route-preview')
      .set('Authorization', `Bearer ${patientToken}`)
      .send({
        origin_node_code: 'private-entry',
        destination_code: 'private-reception',
        subject: 'PATIENT',
      });

    assert.equal(patientRoutePreview.status, 201);
    assert.equal(patientRoutePreview.body.route_found, true);

    //
    // 15. ROUTE-PREVIEW COM ACESSIBILIDADE TEMPORÁRIA
    //
    const accessibleRoutePreview = await request(httpServer)
      .post('/navigation/route-preview')
      .send({
        origin_node_code: 'private-entry',
        destination_code: 'private-reception',
        subject: 'EXTERNAL_PATIENT',
        accessibility: {
          mobility: true,
          wheelchair: true,
          avoidStairs: true,
        },
      });

    assert.equal(accessibleRoutePreview.status, 201);
    assert.equal(accessibleRoutePreview.body.route_found, true);

    if (accessibleRoutePreview.body.accessibility) {
      assert.equal(
        accessibleRoutePreview.body.accessibility.source,
        'request',
      );
    }

    //
    // 16. ROUTE-PREVIEW SEM ORIGEM
    //
    const routeWithoutOrigin = await request(httpServer)
      .post('/navigation/route-preview')
      .send({
        destination_code: 'private-reception',
        subject: 'PATIENT',
      });

    assert.equal(routeWithoutOrigin.status, 400);

    //
    // 17. ROUTE-PREVIEW SEM DESTINO
    //
    const routeWithoutDestination = await request(httpServer)
      .post('/navigation/route-preview')
      .send({
        origin_node_code: 'private-entry',
        subject: 'PATIENT',
      });

    assert.equal(routeWithoutDestination.status, 400);

    //
    // 18. ROUTE-PREVIEW COM SUBJECT INVÁLIDO
    //
    const routeWithInvalidSubject = await request(httpServer)
      .post('/navigation/route-preview')
      .send({
        origin_node_code: 'private-entry',
        destination_code: 'private-reception',
        subject: 'INVALID_ROLE',
      });

    assert.equal(routeWithInvalidSubject.status, 400);

    //
    // 19. TOKEN INVÁLIDO NO MAPA
    //
    const mapWithInvalidToken = await request(httpServer)
      .get('/navigation/map')
      .set('Authorization', 'Bearer token-invalido');

    assert.equal(mapWithInvalidToken.status, 401);

    console.log('navigation E2E tests passed');
  } finally {
    await app.close();
  }
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});
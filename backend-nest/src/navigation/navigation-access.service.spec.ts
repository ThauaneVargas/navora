import { strict as assert } from 'node:assert';
import {
  AccessDecision,
  AccessRuleScope,
  AccessSubject,
  VisitorAccessStatus,
} from '@prisma/client';
import { NavigationAccessService } from './navigation-access.service';

const areaPrivate = { id: 1, code: 'private', name: 'HMC Private' };
const areaSus = { id: 2, code: 'sus', name: 'Hospital Marco Capute' };
const sectorPrivate = { id: 1, code: 'private-imaging', name: 'Setor de Imagem Private' };
const sectorShared = { id: 2, code: 'shared-exit', name: 'Saida / Emergencia' };

const destinations = [
  destination(1, 'private-reception', 'Recepcao Private', 'public', 'Servicos', areaPrivate, sectorPrivate),
  destination(2, 'public-dest', 'Destino Publico', 'public', 'Servicos', areaPrivate, sectorPrivate),
  destination(3, 'visitor-allowed-dest', 'Banheiro Private', 'visitor_allowed', 'Servicos', areaPrivate, sectorPrivate),
  destination(4, 'visitor-auth-dest', 'Visita / Internacao Private', 'visitor_authorization', 'Visita', areaPrivate, sectorPrivate),
  destination(5, 'restricted-dest', 'Centro Cirurgico', 'restricted', 'Restrito', areaPrivate, sectorPrivate),
  destination(6, 'exam-private', 'Tomografia', 'patient', 'Exames', areaPrivate, sectorPrivate),
  destination(7, 'sus-reception', 'Recepcao Hospital Marco Capute', 'public', 'Servicos', areaSus, sectorPrivate),
  destination(8, 'specific-dest', 'Destino Especifico', 'public', 'Servicos', areaPrivate, sectorShared),
];

function destination(id: number, code: string, name: string, accessLevel: string, category: string, area: any, sector: any) {
  return {
    id,
    code,
    name,
    accessLevel,
    category,
    areaId: area.id,
    sectorId: sector.id,
    navigationNodeId: id,
    area,
    sector,
    navigationNode: { id, code: `${code}-node` },
  };
}

function rule(overrides: Record<string, any>) {
  return {
    id: Math.floor(Math.random() * 100000),
    code: overrides.code,
    name: overrides.name ?? overrides.code,
    enabled: true,
    subject: overrides.subject,
    scope: overrides.scope,
    priority: overrides.priority ?? 100,
    areaId: overrides.areaId,
    sectorId: overrides.sectorId,
    destinationId: overrides.destinationId,
    category: overrides.category,
    accessLevel: overrides.accessLevel,
    decision: overrides.decision,
    message: overrides.message,
    fallbackDestinationId: overrides.fallbackDestinationId,
    windows: overrides.windows ?? [],
    fallbackDestination: null,
  };
}

function windowRule(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    startTime: '07:00',
    endTime: '17:00',
    timezone: 'America/Sao_Paulo',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    insideDecision: AccessDecision.ALLOW,
    outsideDecision: AccessDecision.REDIRECT_TO_RECEPTION,
    insideMessage: 'Dentro da janela.',
    outsideMessage: 'Fora da janela.',
    fallbackDestinationId: 1,
    fallbackDestination: null,
    ...overrides,
  };
}

function makeService(rules: any[], visitorRequest?: any, now = new Date('2026-01-05T12:00:00.000Z')) {
  const prisma = {
    destination: {
      findFirst: async ({ where }: any) => {
        if (where.id !== undefined) return destinations.find((item) => item.id === where.id) ?? null;
        if (where.code !== undefined) return destinations.find((item) => item.code === where.code) ?? null;
        return null;
      },
    },
    accessRule: {
      findMany: async ({ where }: any) => rules.filter((item) => item.enabled === where.enabled && item.subject === where.subject),
    },
    visitorAccessRequest: {
      findUnique: async ({ where }: any) => (visitorRequest?.id === where.id ? visitorRequest : null),
    },
  };
  const service = new NavigationAccessService(prisma as any);
  service.setClockForTesting({ now: () => now });
  return service;
}

async function run() {
  await assertDecision('PUBLIC', makeService([
    rule({ code: 'public-visitor', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'public', decision: AccessDecision.ALLOW }),
  ]), { destination_id: 2, subject: AccessSubject.VISITOR }, AccessDecision.ALLOW);

  await assertDecision('RESTRICTED', makeService([
    rule({ code: 'restricted-visitor', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'restricted', priority: 500, decision: AccessDecision.BLOCK }),
  ]), { destination_id: 5, subject: AccessSubject.VISITOR }, AccessDecision.BLOCK);

  await assertDecision('VISITOR_ALLOWED', makeService([
    rule({ code: 'visitor-allowed', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'visitor_allowed', decision: AccessDecision.ALLOW }),
  ]), { destination_id: 3, subject: AccessSubject.VISITOR }, AccessDecision.ALLOW);

  await assertDecision('VISITOR_AUTHORIZATION sem autorizacao', makeService([
    rule({ code: 'visitor-auth', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'visitor_authorization', decision: AccessDecision.REQUIRE_AUTHORIZATION }),
  ]), { destination_id: 4, subject: AccessSubject.VISITOR }, AccessDecision.REQUIRE_AUTHORIZATION);

  await assertDecision('APPROVED valida', makeService([
    rule({ code: 'visitor-auth', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'visitor_authorization', decision: AccessDecision.REQUIRE_AUTHORIZATION }),
  ], visitor(VisitorAccessStatus.APPROVED, { destinationId: 4, expiresAt: new Date('2026-01-05T13:00:00.000Z') })), { destination_id: 4, subject: AccessSubject.VISITOR, visitor_access_request_id: 99 }, AccessDecision.ALLOW);

  await assertDecision('autorizacao expirada', makeService([
    rule({ code: 'visitor-auth', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'visitor_authorization', decision: AccessDecision.REQUIRE_AUTHORIZATION }),
  ], visitor(VisitorAccessStatus.APPROVED, { destinationId: 4, expiresAt: new Date('2026-01-05T11:00:00.000Z') })), { destination_id: 4, subject: AccessSubject.VISITOR, visitor_access_request_id: 99 }, AccessDecision.REQUIRE_AUTHORIZATION);

  for (const status of [VisitorAccessStatus.DENIED, VisitorAccessStatus.FINISHED, VisitorAccessStatus.EXPIRED, VisitorAccessStatus.CANCELED]) {
    await assertDecision(status, makeService([
      rule({ code: 'visitor-auth', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'visitor_authorization', decision: AccessDecision.REQUIRE_AUTHORIZATION }),
    ], visitor(status, { destinationId: 4 })), { destination_id: 4, subject: AccessSubject.VISITOR, visitor_access_request_id: 99 }, AccessDecision.REQUIRE_AUTHORIZATION);
  }

  await assertDecision('exame externo dentro de 07:00-17:00 America/Sao_Paulo', makeService([
    rule({ code: 'external-exam', subject: AccessSubject.EXTERNAL_PATIENT, scope: AccessRuleScope.CATEGORY, areaId: 1, category: 'Exames', priority: 300, windows: [windowRule()] }),
  ], undefined, new Date('2026-01-05T12:00:00.000Z')), { destination_id: 6, subject: AccessSubject.EXTERNAL_PATIENT }, AccessDecision.ALLOW);

  await assertDecision('exame externo fora de 07:00-17:00 America/Sao_Paulo', makeService([
    rule({ code: 'external-exam', subject: AccessSubject.EXTERNAL_PATIENT, scope: AccessRuleScope.CATEGORY, areaId: 1, category: 'Exames', priority: 300, windows: [windowRule()] }),
  ], undefined, new Date('2026-01-05T21:00:00.000Z')), { destination_id: 6, subject: AccessSubject.EXTERNAL_PATIENT }, AccessDecision.REDIRECT_TO_RECEPTION);

  await assertDecision('prioridade', makeService([
    rule({ code: 'allow-specific', subject: AccessSubject.VISITOR, scope: AccessRuleScope.DESTINATION, destinationId: 5, priority: 100, decision: AccessDecision.ALLOW }),
    rule({ code: 'block-high', subject: AccessSubject.VISITOR, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'restricted', priority: 500, decision: AccessDecision.BLOCK }),
  ], visitor(VisitorAccessStatus.APPROVED, { destinationId: 5, expiresAt: null })), { destination_id: 5, subject: AccessSubject.VISITOR, visitor_access_request_id: 99 }, AccessDecision.BLOCK);

  await assertDecision('especificidade', makeService([
    rule({ code: 'block-category', subject: AccessSubject.PATIENT, scope: AccessRuleScope.CATEGORY, category: 'Servicos', priority: 200, decision: AccessDecision.BLOCK }),
    rule({ code: 'allow-destination', subject: AccessSubject.PATIENT, scope: AccessRuleScope.DESTINATION, destinationId: 8, priority: 200, decision: AccessDecision.ALLOW }),
  ]), { destination_id: 8, subject: AccessSubject.PATIENT }, AccessDecision.ALLOW);

  await assertDecision('destination_code', makeService([
    rule({ code: 'public-patient', subject: AccessSubject.PATIENT, scope: AccessRuleScope.ACCESS_LEVEL, accessLevel: 'public', decision: AccessDecision.ALLOW }),
  ]), { destination_code: 'public-dest', subject: AccessSubject.PATIENT }, AccessDecision.ALLOW);

  console.log('navigation access tests passed');
}

function visitor(status: VisitorAccessStatus, overrides: Record<string, any> = {}) {
  return {
    id: 99,
    status,
    destinationId: null,
    requestedDestination: 'Visita / Internacao Private',
    authorizedAt: new Date('2026-01-05T11:30:00.000Z'),
    expiresAt: null,
    finishedAt: null,
    ...overrides,
  };
}

async function assertDecision(label: string, service: NavigationAccessService, payload: any, expected: AccessDecision) {
  const result = await service.checkAccess(payload);
  assert.equal(result.decision, expected, label);
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

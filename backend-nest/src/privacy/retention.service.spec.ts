import { strict as assert } from 'node:assert';
import { ANONYMIZED, RetentionService } from './retention.service';

const DAY = 24 * 60 * 60 * 1000;
const now = new Date('2026-11-07T12:00:00.000Z');
const daysAgo = (days: number) => new Date(now.getTime() - days * DAY);

function makePrisma() {
  const db = {
    visitors: [
      { id: 1, createdAt: daysAgo(40), visitorName: 'Maria' },
      { id: 2, createdAt: daysAgo(5), visitorName: 'Joao' },
    ],
    calls: [
      { id: 1, createdAt: daysAgo(200), patientName: 'Ana', userName: 'Ana', callerPhone: '81999', emergencyContact: '81888', needs: ['wheelchair'], userId: 7, location: 'Recepcao' },
      { id: 2, createdAt: daysAgo(10), patientName: 'Bia', userName: 'Bia', callerPhone: '81777', emergencyContact: null, needs: [], userId: 8, location: 'Corredor' },
    ],
    checkIns: [
      { id: 1, createdAt: daysAgo(200), patientName: 'Caio', document: '123', observations: 'obs', userId: 7, visitorAccessRequestId: null },
      { id: 2, createdAt: daysAgo(1), patientName: 'Duda', document: '456', observations: null, userId: null, visitorAccessRequestId: 1 },
    ],
    notifications: [
      { id: 1, createdAt: daysAgo(100) },
      { id: 2, createdAt: daysAgo(3) },
    ],
    audit: [
      { id: 1, createdAt: daysAgo(2000) },
      { id: 2, createdAt: daysAgo(30) },
    ],
  };
  const older = (where: any) => (item: any) => item.createdAt < where.createdAt.lt;

  const prisma = {
    db,
    visitorAccessRequest: {
      deleteMany: async ({ where }: any) => {
        const before = db.visitors.length;
        db.visitors = db.visitors.filter((item) => !older(where)(item));
        return { count: before - db.visitors.length };
      },
    },
    checkIn: {
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        db.checkIns = db.checkIns.map((item) => {
          const matches = where.visitorAccessRequest
            ? db.visitors.some((visitor) => visitor.id === item.visitorAccessRequestId && older(where.visitorAccessRequest)(visitor))
            : older(where)(item) && item.patientName !== where.patientName.not;
          if (!matches) return item;
          count += 1;
          return { ...item, ...data };
        });
        return { count };
      },
    },
    callRequest: {
      updateMany: async ({ where, data }: any) => {
        let count = 0;
        db.calls = db.calls.map((item) => {
          if (!older(where)(item) || item.patientName === where.patientName.not) return item;
          count += 1;
          return { ...item, ...data };
        });
        return { count };
      },
    },
    notification: {
      deleteMany: async ({ where }: any) => {
        const before = db.notifications.length;
        db.notifications = db.notifications.filter((item) => !older(where)(item));
        return { count: before - db.notifications.length };
      },
    },
    auditLog: {
      deleteMany: async ({ where }: any) => {
        const before = db.audit.length;
        db.audit = db.audit.filter((item) => !older(where)(item));
        return { count: before - db.audit.length };
      },
    },
  };
  return prisma;
}

const config = (values: Record<string, string> = {}) => ({ get: (key: string) => values[key] });

async function run() {
  const prisma = makePrisma();
  const service = new RetentionService(prisma as any, config() as any);
  const result = await service.purge(now);

  assert.deepEqual(result, {
    visitorRequestsDeleted: 1,
    callsAnonymized: 1,
    checkInsAnonymized: 1,
    notificationsDeleted: 1,
    auditLogsDeleted: 1,
  });
  assert.deepEqual(prisma.db.visitors.map((item) => item.id), [2], 'pedido de visita com mais de 30 dias e apagado');
  assert.equal(prisma.db.checkIns[1].visitorAccessRequestId, null, 'check-in perde so o vinculo com a visita apagada');

  const oldCall = prisma.db.calls[0];
  assert.equal(oldCall.patientName, ANONYMIZED, 'chamado antigo fica sem nome');
  assert.equal(oldCall.callerPhone, null, 'sem telefone');
  assert.equal(oldCall.emergencyContact, null, 'sem contato de emergencia');
  assert.deepEqual(oldCall.needs, [], 'sem necessidades (dado de saude)');
  assert.equal(oldCall.userId, null, 'sem vinculo com a conta');
  assert.equal(oldCall.location, 'Recepcao', 'o registro (local, tipo, data) continua para estatistica');
  assert.equal(prisma.db.calls[1].patientName, 'Bia', 'chamado recente fica intacto');

  assert.equal(prisma.db.checkIns[0].patientName, ANONYMIZED);
  assert.equal(prisma.db.checkIns[0].document, null, 'documento do check-in antigo apagado');
  assert.equal(prisma.db.checkIns[1].document, '456', 'check-in recente intacto');

  const again = await service.purge(now);
  assert.equal(again.callsAnonymized + again.checkInsAnonymized, 0, 'rodar de novo nao reprocessa o que ja foi anonimizado');

  // Prazo configuravel; 0 desliga aquele item.
  const custom = makePrisma();
  const customResult = await new RetentionService(custom as any, config({ RETENTION_VISITOR_DAYS: '0', RETENTION_CALL_DAYS: '5' }) as any).purge(now);
  assert.equal(customResult.visitorRequestsDeleted, 0, 'RETENTION_VISITOR_DAYS=0 desliga');
  assert.equal(customResult.callsAnonymized, 2, 'RETENTION_CALL_DAYS=5 pega os dois chamados');

  // Ligado so em producao (ou com RETENTION_ENABLED=true).
  const previousEnv = process.env.NODE_ENV;
  process.env.NODE_ENV = 'development';
  assert.equal(new RetentionService(prisma as any, config() as any).isEnabled(), false, 'desligado fora de producao');
  assert.equal(new RetentionService(prisma as any, config({ RETENTION_ENABLED: 'true' }) as any).isEnabled(), true);
  process.env.NODE_ENV = 'production';
  assert.equal(new RetentionService(prisma as any, config() as any).isEnabled(), true, 'ligado em producao');
  assert.equal(new RetentionService(prisma as any, config({ RETENTION_ENABLED: 'false' }) as any).isEnabled(), false);
  process.env.NODE_ENV = previousEnv;

  console.log('retention tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

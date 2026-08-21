import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { CallStatus, CallType, CheckInStatus, VisitorAccessStatus } from '@prisma/client';
import { ReportsService } from './reports.service';

function matchesWhere(item: Record<string, any>, where?: Record<string, any>) {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    const value = item[key];
    if (key === 'createdAt' && expected && typeof expected === 'object') {
      if (expected.gte && value < expected.gte) return false;
      if (expected.lte && value > expected.lte) return false;
      return true;
    }
    return value === expected;
  });
}

function model(items: Record<string, any>[]) {
  return {
    count: async ({ where }: { where?: Record<string, any> } = {}) =>
      items.filter((item) => matchesWhere(item, where)).length,
  };
}

async function run() {
  const oldDate = new Date('2026-08-01T12:00:00.000Z');
  const newDate = new Date('2026-08-17T12:00:00.000Z');
  const service = new ReportsService({
    callRequest: model([
      { createdAt: oldDate, callType: CallType.HELP, status: CallStatus.CLOSED },
      { createdAt: newDate, callType: CallType.SOS, status: CallStatus.PENDING },
    ]),
    visitorAccessRequest: model([
      { createdAt: newDate, status: VisitorAccessStatus.PENDING },
      { createdAt: newDate, status: VisitorAccessStatus.APPROVED },
    ]),
    checkIn: model([
      { createdAt: newDate, status: CheckInStatus.WAITING },
      { createdAt: oldDate, status: CheckInStatus.FINISHED },
    ]),
    beacon: model([{ status: 'Online' }, { status: 'Offline' }]),
    sector: model([{ id: 1 }]),
    destination: model([{ id: 1 }, { id: 2 }]),
  } as any);

  const full = await service.adminReport({ period: 'diario' });
  assert.equal(full.source, 'api');
  assert.equal(full.callsTotal, 2);
  assert.equal(full.helpCalls, 1);
  assert.equal(full.sosCalls, 1);
  assert.equal(full.visitorPending, 1);
  assert.equal(full.checkInsTotal, 2);
  assert.equal(full.beaconsOffline, 1);

  const ranged = await service.adminReport({ from: '2026-08-17T00:00:00.000Z', to: '2026-08-18T00:00:00.000Z' });
  assert.equal(ranged.callsTotal, 1);
  assert.equal(ranged.helpCalls, 0);
  assert.equal(ranged.checkInsTotal, 1);

  await assert.rejects(() => service.adminReport({ from: 'data-invalida' }), BadRequestException);
  await assert.rejects(
    () => service.adminReport({ from: '2026-08-18T00:00:00.000Z', to: '2026-08-17T00:00:00.000Z' }),
    BadRequestException,
  );

  console.log('reports service tests passed');
}

run();

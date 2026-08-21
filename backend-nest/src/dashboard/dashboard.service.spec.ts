import * as assert from 'node:assert/strict';
import { CallStatus, CallType, UserRole, VisitorAccessStatus } from '@prisma/client';
import { DashboardService } from './dashboard.service';

function matchesWhere(item: Record<string, any>, where?: Record<string, any>) {
  if (!where) return true;
  return Object.entries(where).every(([key, expected]) => {
    const value = item[key];
    if (expected && typeof expected === 'object' && !Array.isArray(expected)) {
      if ('not' in expected) return value !== expected.not;
      if ('notIn' in expected) return !expected.notIn.includes(value);
      if ('in' in expected) return expected.in.includes(value);
    }
    return value === expected;
  });
}

function groupBy(items: Record<string, any>[], key: string) {
  const counts = new Map<string, number>();
  for (const item of items) {
    counts.set(item[key], (counts.get(item[key]) || 0) + 1);
  }
  return [...counts.entries()].map(([value, count]) => ({ [key]: value, _count: { _all: count } }));
}

function prismaFor(data: {
  calls?: Record<string, any>[];
  visitors?: Record<string, any>[];
  beacons?: Record<string, any>[];
  sectors?: Record<string, any>[];
  destinations?: Record<string, any>[];
  users?: Record<string, any>[];
}) {
  const model = (items: Record<string, any>[]) => ({
    count: ({ where }: { where?: Record<string, any> } = {}) => items.filter((item) => matchesWhere(item, where)).length,
    groupBy: ({ by }: { by: string[] }) => groupBy(items, by[0]),
  });

  return {
    callRequest: model(data.calls || []),
    visitorAccessRequest: model(data.visitors || []),
    beacon: model(data.beacons || []),
    sector: model(data.sectors || []),
    destination: model(data.destinations || []),
    user: model(data.users || []),
  };
}

async function run() {
  const empty = await new DashboardService(prismaFor({}) as any).summary();
  assert.equal(empty.source, 'api');
  assert.equal(empty.totalCalls, 0);
  assert.equal(empty.openCalls, 0);
  assert.equal(empty.pendingVisitorRequests, 0);
  assert.equal(empty.beaconsTotal, 0);
  assert.deepEqual(empty.callStatusCounts, {});

  const summary = await new DashboardService(
    prismaFor({
      calls: [
        { status: CallStatus.PENDING, callType: CallType.HELP },
        { status: CallStatus.IN_PROGRESS, callType: CallType.SOS },
        { status: CallStatus.CLOSED, callType: CallType.SOS },
        { status: CallStatus.CANCELED, callType: CallType.HELP },
      ],
      visitors: [
        { status: VisitorAccessStatus.PENDING },
        { status: VisitorAccessStatus.APPROVED },
        { status: VisitorAccessStatus.DENIED },
      ],
      beacons: [{ status: 'Online' }, { status: 'Offline' }],
      sectors: [{ id: 1 }, { id: 2 }],
      destinations: [{ id: 1 }, { id: 2 }, { id: 3 }],
      users: [{ role: UserRole.PATIENT }, { role: UserRole.ADMIN }, { role: UserRole.RECEPTION }],
    }) as any,
  ).summary();

  assert.equal(summary.totalCalls, 4);
  assert.equal(summary.openCalls, 2);
  assert.equal(summary.activeSOS, 1);
  assert.equal(summary.activeHelp, 1);
  assert.equal(summary.closedCalls, 1);
  assert.equal(summary.pendingVisitorRequests, 1);
  assert.equal(summary.approvedVisitors, 1);
  assert.equal(summary.deniedVisitors, 1);
  assert.equal(summary.beaconsOnline, 1);
  assert.equal(summary.beaconsOffline, 1);
  assert.equal(summary.sectorsTotal, 2);
  assert.equal(summary.destinationsTotal, 3);
  assert.equal(summary.patientUsers, 1);
  assert.equal(summary.staffUsers, 2);
  assert.equal(summary.callStatusCounts[CallStatus.PENDING], 1);
  assert.equal(summary.callTypeCounts[CallType.SOS], 2);
  assert.equal(summary.visitorStatusCounts[VisitorAccessStatus.DENIED], 1);

  console.log('dashboard summary tests passed');
}

run();

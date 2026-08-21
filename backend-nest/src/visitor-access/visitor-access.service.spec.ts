import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { VisitorAccessStatus } from '@prisma/client';
import { VisitorAccessService } from './visitor-access.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const requests: any[] = [];

  return {
    requests,
    destination: {
      findFirst: async () => ({ id: 10 }),
    },
    visitorAccessRequest: {
      findMany: async ({ where }: { where?: { status?: VisitorAccessStatus } } = {}) =>
        requests.filter((request) => !where?.status || request.status === where.status),
      findUnique: async ({ where }: { where: { id: number } }) =>
        requests.find((request) => request.id === where.id) || null,
      create: async ({ data }: { data: Record<string, any> }) => {
        const request = {
          id: requests.length + 1,
          permissionMinutes: null,
          authorizedRoute: null,
          deniedReason: null,
          allowedRoute: null,
          allowedTime: null,
          releaseType: null,
          denialReason: null,
          authorizedAt: null,
          expiresAt: null,
          finishedAt: null,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        requests.push(request);
        return request;
      },
      update: async ({ where, data }: { where: { id: number }; data: Record<string, any> }) => {
        const index = requests.findIndex((request) => request.id === where.id);
        requests[index] = { ...requests[index], ...data, updatedAt: now };
        return requests[index];
      },
    },
  };
}

async function run() {
  const prisma = makePrisma();
  const service = new VisitorAccessService(prisma as any);

  const created = await service.create({
    visitor_name: 'Visitante Teste',
    area: 'private',
    area_name: 'HMC Private',
    entrance: 'Entrada pelos fundos',
    area_id: 'private',
    entry: 'Entrada Private',
    current_location: 'Entrada',
    requested_destination: 'private-imaging',
    reason: 'Visita',
    accessibility: 'Nao',
    status: VisitorAccessStatus.PENDING,
  });
  assert.equal(created.status, VisitorAccessStatus.PENDING);
  assert.equal(created.destination_id, 10);

  const pending = await service.list(VisitorAccessStatus.PENDING);
  assert.equal(pending.length, 1);

  const approved = await service.approve(created.id, {
    release_type: 'Liberar rota ate o destino',
    release_time: '30 minutos',
  });
  assert.equal(approved.status, VisitorAccessStatus.APPROVED);
  assert.equal(approved.permission_minutes, 30);

  const tracked = await service.get(created.id);
  assert.equal(tracked.status, VisitorAccessStatus.APPROVED);

  const inRoute = await service.updateStatus(created.id, VisitorAccessStatus.IN_ROUTE);
  assert.equal(inRoute.status, VisitorAccessStatus.IN_ROUTE);

  const finished = await service.updateStatus(created.id, VisitorAccessStatus.FINISHED);
  assert.equal(finished.status, VisitorAccessStatus.FINISHED);
  assert.ok(finished.finished_at);

  await assert.rejects(() => service.updateStatus(created.id, VisitorAccessStatus.PENDING), BadRequestException);
  await assert.rejects(() => service.get(999), NotFoundException);

  const denied = await service.create({
    visitor_name: 'Visitante Negado',
    requested_destination: 'private-imaging',
  } as any);
  const deniedResult = await service.deny(denied.id, {
    denial_reason: 'Destino restrito',
    deniedReason: 'Destino restrito',
  });
  assert.equal(deniedResult.status, VisitorAccessStatus.DENIED);
  assert.equal(deniedResult.denied_reason, 'Destino restrito');

  console.log('visitor access service tests passed');
}

run();

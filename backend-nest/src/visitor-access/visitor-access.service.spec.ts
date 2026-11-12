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
      findMany: async ({ where }: { where?: { hospitalId?: number; status?: VisitorAccessStatus } } = {}) =>
        requests
          .filter((request) => request.hospitalId === where?.hospitalId)
          .filter((request) => !where?.status || request.status === where.status),
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
  }, undefined, 1);
  assert.equal(created.status, VisitorAccessStatus.PENDING);
  assert.equal(created.destination_id, 10);

  // O visitante nao pode criar o proprio pedido ja aprovado.
  const selfApproved = await service.create({
    visitor_name: 'Invasor',
    area_id: 'private',
    requested_destination: 'Visita / Internacao Private',
    status: VisitorAccessStatus.APPROVED,
  } as any, undefined, 1);
  assert.equal(selfApproved.status, VisitorAccessStatus.PENDING, 'pedido sempre nasce pendente');
  prisma.requests.splice(prisma.requests.findIndex((r: any) => r.id === selfApproved.id), 1);

  const pending = await service.list(1, VisitorAccessStatus.PENDING);
  assert.equal(pending.length, 1);

  const approved = await service.approve(
    1,
    created.id,
    {
      release_type: 'Liberar rota ate o destino',
      release_time: '30 minutos',
    },
    { id: 2, name: 'Recepcao', email: 'recepcao@navora.com', phone: null, role: 'RECEPTION' as any, hospitalId: 1, active: true },
  );
  assert.equal(approved.status, VisitorAccessStatus.APPROVED);
  assert.equal(approved.decided_by_id, 2, 'registra qual funcionario autorizou');
  assert.ok(approved.decided_at);
  assert.equal(approved.permission_minutes, 30);

  assert.match(created.access_token, /^[0-9a-f]{48}$/, 'criar devolve o codigo secreto do visitante');
  await assert.rejects(() => service.get(created.id), NotFoundException, 'sem o codigo nao le o pedido');
  await assert.rejects(() => service.get(created.id, { visitorToken: 'b'.repeat(48) }), NotFoundException, 'codigo errado nao le o pedido');
  const tracked = await service.get(created.id, { visitorToken: created.access_token });
  assert.equal(tracked.status, VisitorAccessStatus.APPROVED);

  const inRoute = await service.updateStatus(1, created.id, VisitorAccessStatus.IN_ROUTE);
  assert.equal(inRoute.status, VisitorAccessStatus.IN_ROUTE);

  const finished = await service.updateStatus(1, created.id, VisitorAccessStatus.FINISHED);
  assert.equal(finished.status, VisitorAccessStatus.FINISHED);
  assert.ok(finished.finished_at);

  await assert.rejects(() => service.updateStatus(1, created.id, VisitorAccessStatus.PENDING), BadRequestException);
  await assert.rejects(() => service.get(999), NotFoundException);

  const denied = await service.create({
    visitor_name: 'Visitante Negado',
    requested_destination: 'private-imaging',
  } as any, undefined, 1);
  const deniedResult = await service.deny(1, denied.id, {
    denial_reason: 'Destino restrito',
    deniedReason: 'Destino restrito',
  });
  assert.equal(deniedResult.status, VisitorAccessStatus.DENIED);
  assert.equal(deniedResult.denied_reason, 'Destino restrito');

  // Separacao por hospital: a recepcao do hospital 2 nao ve, nao le e nao decide
  // pedido do hospital 1 (mesmo 404 de "nao existe").
  const reception = (hospitalId: number) =>
    ({ id: 2, name: 'Recepcao', email: 'r@x', phone: null, role: 'RECEPTION' as any, hospitalId, active: true });
  assert.equal(prisma.requests[0].hospitalId, 1, 'pedido guarda o hospital');
  assert.equal((await service.list(2)).length, 0, 'outro hospital nao lista o pedido');
  assert.equal((await service.get(created.id, { user: reception(1) })).id, created.id, 'recepcao do hospital le o pedido');
  await assert.rejects(() => service.get(created.id, { user: reception(2) }), NotFoundException, 'recepcao de outro hospital nao le');
  const otherPending = await service.create({ visitor_name: 'Outro', requested_destination: 'private-imaging' } as any, undefined, 1);
  await assert.rejects(() => service.approve(2, otherPending.id, {} as any, reception(2)), NotFoundException, 'nao aprova de outro hospital');
  await assert.rejects(() => service.deny(2, otherPending.id, {} as any, reception(2)), NotFoundException, 'nao nega de outro hospital');
  await assert.rejects(
    () => service.updateStatus(2, otherPending.id, VisitorAccessStatus.CANCELED),
    NotFoundException,
    'nao muda status de outro hospital',
  );

  console.log('visitor access service tests passed');
}

run();

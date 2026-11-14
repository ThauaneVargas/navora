import 'reflect-metadata';
import * as assert from 'node:assert/strict';
import { BadRequestException, ConflictException, ExecutionContext, ForbiddenException, HttpException, NotFoundException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole, UserStatusAction } from '@prisma/client';
import { RolesGuard } from '../auth/roles.guard';
import { StaffController } from './staff.controller';
import { StaffService } from './staff.service';

const now = new Date('2026-10-10T12:00:00.000Z');

function makePrisma() {
  const users: any[] = [
    { id: 1, hospitalId: 1, name: 'Admin Principal', email: 'admin@navora.com', phone: null, role: UserRole.ADMIN, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    { id: 2, hospitalId: 1, name: 'Recepcao Turno A', email: 'recepcao@navora.com', phone: null, role: UserRole.RECEPTION, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    { id: 3, hospitalId: 1, name: 'Paciente', email: 'paciente@navora.com', phone: null, role: UserRole.PATIENT, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    // Equipe de outro hospital (2): o admin do hospital 1 nao enxerga nem altera.
    { id: 4, hospitalId: 2, name: 'Admin H2', email: 'admin@h2.com', phone: null, role: UserRole.ADMIN, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    { id: 5, hospitalId: 2, name: 'Recepcao H2', email: 'recepcao@h2.com', phone: null, role: UserRole.RECEPTION, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
  ];
  const auditLogs: any[] = [
    { id: 1, hospitalId: 1, actorId: 2, action: 'calls.updateStatus', entity: 'calls', entityId: '9', details: { status: 'ACCEPTED' }, createdAt: now },
    { id: 2, hospitalId: 2, actorId: 5, action: 'calls.updateStatus', entity: 'calls', entityId: '3', details: {}, createdAt: now },
  ];
  const statusChanges: any[] = [];
  const visitorRequests: any[] = [
    { id: 7, visitorName: 'Maria', requestedDestination: 'UTI', areaName: 'HMC Private', status: 'DENIED', decidedById: 2, decidedAt: now, deniedReason: 'Fora do horario' },
  ];

  const withRelations = (user: any) => ({
    ...user,
    staffProfile: null,
    deactivatedBy: user.deactivatedById ? { id: user.deactivatedById, name: users.find((u) => u.id === user.deactivatedById).name } : null,
  });

  const userApi = {
    findMany: async ({ where }: any) =>
      users.filter((u) => u.hospitalId === where.hospitalId && where.role.in.includes(u.role)).map(withRelations),
    findUnique: async ({ where }: any) => {
      const user = users.find((u) => u.id === where.id);
      return user ? withRelations(user) : null;
    },
    count: async ({ where }: any) =>
      users.filter((u) => u.hospitalId === where.hospitalId && u.role === where.role && u.active === where.active).length,
    update: async ({ where, data }: any) => {
      const index = users.findIndex((u) => u.id === where.id);
      users[index] = { ...users[index], ...data };
      return withRelations(users[index]);
    },
    delete: async () => {
      throw new Error('StaffService nunca deve excluir usuarios');
    },
  };
  const statusChangeApi = {
    create: async ({ data }: any) => {
      const change = { id: statusChanges.length + 1, createdAt: now, ...data };
      statusChanges.push(change);
      return change;
    },
    findMany: async ({ where }: any) =>
      statusChanges
        .filter((c) => c.userId === where.userId)
        .map((c) => ({ ...c, performedBy: { id: c.performedById, name: users.find((u) => u.id === c.performedById).name } })),
  };

  const prisma: any = {
    users,
    statusChanges,
    user: userApi,
    userStatusChange: statusChangeApi,
    visitorAccessRequest: {
      findMany: async ({ where }: any) => visitorRequests.filter((r) => r.decidedById === where.decidedById),
    },
    auditLog: {
      findMany: async ({ where }: any) => auditLogs.filter((l) => l.actorId === where.actorId && l.hospitalId === where.hospitalId),
    },
    $transaction: async (fn: (tx: any) => Promise<any>) => fn({ user: userApi, userStatusChange: statusChangeApi }),
  };
  return prisma;
}

const admin = { id: 1, name: 'Admin Principal', email: 'admin@navora.com', phone: null, role: UserRole.ADMIN, hospitalId: 1, active: true };

async function run() {
  const prisma = makePrisma();
  const service = new StaffService(prisma);

  const staff = await service.list(1);
  assert.equal(staff.length, 2, 'lista apenas funcionarios do proprio hospital, sem pacientes');

  // Separacao por hospital: funcionario de outro hospital "nao existe" aqui.
  await assert.rejects(() => service.deactivate(1, 5, admin), NotFoundException, 'nao desativa equipe de outro hospital');
  await assert.rejects(() => service.audit(1, 5), NotFoundException, 'nao ve historico de outro hospital');
  assert.equal((await service.list(2)).length, 2, 'o outro hospital ve so a propria equipe');

  await assert.rejects(() => service.deactivate(1, 3, admin), NotFoundException, 'pacientes nao sao geridos aqui');
  await assert.rejects(() => service.deactivate(1, 1, admin), BadRequestException, 'nao pode se autodesativar');

  const deactivated = await service.deactivate(1, 2, admin, { reason: 'Desligamento' });
  assert.equal(deactivated.active, false);
  assert.equal(deactivated.deactivated_by?.id, 1);
  assert.ok(deactivated.deactivated_at);
  assert.equal(prisma.users.length, 5, 'nenhum usuario foi removido');
  assert.equal(prisma.statusChanges[0].action, UserStatusAction.DEACTIVATED);
  assert.equal(prisma.statusChanges[0].reason, 'Desligamento');

  await assert.rejects(() => service.deactivate(1, 2, admin), ConflictException);

  const audit = await service.audit(1, 2);
  assert.equal(audit.visitor_decisions.length, 1, 'historico de decisoes preservado apos desativar');
  assert.equal(audit.status_changes[0].performed_by.name, 'Admin Principal');
  assert.deepEqual(audit.actions.map((a: any) => a.action), ['calls.updateStatus'], 'acoes registradas na auditoria');

  const reactivated = await service.reactivate(1, 2, admin);
  assert.equal(reactivated.active, true);
  assert.equal(reactivated.deactivated_at, null);
  assert.equal(prisma.statusChanges.length, 2);
  await assert.rejects(() => service.reactivate(1, 2, admin), ConflictException);

  // Ultimo administrador ativo nao pode ser desativado (evita travar o painel).
  const otherAdmin = { ...admin, id: 99 };
  await assert.rejects(() => service.deactivate(1, 1, otherAdmin), BadRequestException);

  // Endpoints: somente ADMIN, e DELETE sempre recusado.
  const guards = (Reflect.getMetadata('__guards__', StaffController) || []).map((g: { name: string }) => g.name);
  assert.ok(guards.includes('JwtAuthGuard') && guards.includes('RolesGuard'));
  const rolesGuard = new RolesGuard(new Reflector());
  const ctx = (role: UserRole) =>
    ({
      getHandler: () => StaffController.prototype.deactivate,
      getClass: () => StaffController,
      switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
    }) as unknown as ExecutionContext;
  assert.equal(rolesGuard.canActivate(ctx(UserRole.ADMIN)), true);
  assert.throws(() => rolesGuard.canActivate(ctx(UserRole.RECEPTION)), ForbiddenException);
  assert.throws(() => rolesGuard.canActivate(ctx(UserRole.PATIENT)), ForbiddenException);

  const controller = new StaffController(service);
  assert.throws(() => controller.remove(), (error: unknown) => error instanceof HttpException && error.getStatus() === 405);

  console.log('staff soft-delete tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

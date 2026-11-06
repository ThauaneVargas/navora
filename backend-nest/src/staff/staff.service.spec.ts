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
    { id: 1, name: 'Admin Principal', email: 'admin@navora.com', phone: null, role: UserRole.ADMIN, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    { id: 2, name: 'Recepcao Turno A', email: 'recepcao@navora.com', phone: null, role: UserRole.RECEPTION, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
    { id: 3, name: 'Paciente', email: 'paciente@navora.com', phone: null, role: UserRole.PATIENT, active: true, deactivatedAt: null, deactivatedById: null, createdAt: now },
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
    findMany: async ({ where }: any) => users.filter((u) => where.role.in.includes(u.role)).map(withRelations),
    findUnique: async ({ where }: any) => {
      const user = users.find((u) => u.id === where.id);
      return user ? withRelations(user) : null;
    },
    count: async ({ where }: any) => users.filter((u) => u.role === where.role && u.active === where.active).length,
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
    $transaction: async (fn: (tx: any) => Promise<any>) => fn({ user: userApi, userStatusChange: statusChangeApi }),
  };
  return prisma;
}

const admin = { id: 1, name: 'Admin Principal', email: 'admin@navora.com', phone: null, role: UserRole.ADMIN, active: true };

async function run() {
  const prisma = makePrisma();
  const service = new StaffService(prisma);

  const staff = await service.list();
  assert.equal(staff.length, 2, 'lista apenas funcionarios, sem pacientes');

  await assert.rejects(() => service.deactivate(3, admin), NotFoundException, 'pacientes nao sao geridos aqui');
  await assert.rejects(() => service.deactivate(1, admin), BadRequestException, 'nao pode se autodesativar');

  const deactivated = await service.deactivate(2, admin, { reason: 'Desligamento' });
  assert.equal(deactivated.active, false);
  assert.equal(deactivated.deactivated_by?.id, 1);
  assert.ok(deactivated.deactivated_at);
  assert.equal(prisma.users.length, 3, 'nenhum usuario foi removido');
  assert.equal(prisma.statusChanges[0].action, UserStatusAction.DEACTIVATED);
  assert.equal(prisma.statusChanges[0].reason, 'Desligamento');

  await assert.rejects(() => service.deactivate(2, admin), ConflictException);

  const audit = await service.audit(2);
  assert.equal(audit.visitor_decisions.length, 1, 'historico de decisoes preservado apos desativar');
  assert.equal(audit.status_changes[0].performed_by.name, 'Admin Principal');

  const reactivated = await service.reactivate(2, admin);
  assert.equal(reactivated.active, true);
  assert.equal(reactivated.deactivated_at, null);
  assert.equal(prisma.statusChanges.length, 2);
  await assert.rejects(() => service.reactivate(2, admin), ConflictException);

  // Ultimo administrador ativo nao pode ser desativado (evita travar o painel).
  const otherAdmin = { ...admin, id: 99 };
  await assert.rejects(() => service.deactivate(1, otherAdmin), BadRequestException);

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

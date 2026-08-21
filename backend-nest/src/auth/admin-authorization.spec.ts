import 'reflect-metadata';
import * as assert from 'node:assert/strict';
import { ExecutionContext, UnauthorizedException, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '@prisma/client';
import { BeaconsController } from '../beacons/beacons.controller';
import { CallsController } from '../calls/calls.controller';
import { DashboardController } from '../dashboard/dashboard.controller';
import { NavigationController } from '../navigation/navigation.controller';
import { SectorsController } from '../navigation/sectors.controller';
import { VisitorAccessController } from '../visitor-access/visitor-access.controller';
import { JwtAuthGuard } from './jwt-auth.guard';
import { RolesGuard } from './roles.guard';

const GUARDS_METADATA = '__guards__';

function contextFor(handler: Function, user?: { role?: UserRole }, authorization?: string): ExecutionContext {
  return {
    getHandler: () => handler,
    getClass: () => class TestController {},
    switchToHttp: () => ({
      getRequest: () => ({
        headers: { authorization },
        user,
      }),
    }),
  } as unknown as ExecutionContext;
}

function guardNames(handler: Function) {
  return (Reflect.getMetadata(GUARDS_METADATA, handler) || []).map((guard: Function) => guard.name);
}

function assertAdminEndpoint(handler: Function) {
  const guards = guardNames(handler);
  assert.ok(guards.includes('JwtAuthGuard'), 'endpoint administrativo exige JwtAuthGuard');
  assert.ok(guards.includes('RolesGuard'), 'endpoint administrativo exige RolesGuard');
}

function assertPublicEndpoint(handler: Function) {
  assert.equal(Reflect.getMetadata(GUARDS_METADATA, handler), undefined, 'endpoint publico nao deve exigir guard');
}

async function run() {
  assertAdminEndpoint(CallsController.prototype.list);
  assertAdminEndpoint(CallsController.prototype.updateStatus);
  assertPublicEndpoint(CallsController.prototype.create);
  assertPublicEndpoint(CallsController.prototype.createHelp);
  assertPublicEndpoint(CallsController.prototype.createSos);

  assertAdminEndpoint(VisitorAccessController.prototype.list);
  assertAdminEndpoint(VisitorAccessController.prototype.approve);
  assertAdminEndpoint(VisitorAccessController.prototype.authorize);
  assertAdminEndpoint(VisitorAccessController.prototype.deny);
  assertAdminEndpoint(VisitorAccessController.prototype.updateStatus);
  assertPublicEndpoint(VisitorAccessController.prototype.create);
  assertPublicEndpoint(VisitorAccessController.prototype.get);

  assertAdminEndpoint(DashboardController.prototype.summary);
  assertAdminEndpoint(BeaconsController.prototype.list);
  assertPublicEndpoint(BeaconsController.prototype.detect);
  assertAdminEndpoint(SectorsController.prototype.sectors);
  assertAdminEndpoint(NavigationController.prototype.map);
  assertPublicEndpoint(NavigationController.prototype.bootstrap);
  assertPublicEndpoint(NavigationController.prototype.areas);
  assertPublicEndpoint(NavigationController.prototype.destinations);
  assertPublicEndpoint(NavigationController.prototype.destination);
  assertPublicEndpoint(NavigationController.prototype.accessCheck);

  const rolesGuard = new RolesGuard(new Reflector());
  assert.equal(rolesGuard.canActivate(contextFor(CallsController.prototype.list, { role: UserRole.ADMIN })), true);
  assert.equal(rolesGuard.canActivate(contextFor(CallsController.prototype.list, { role: UserRole.RECEPTION })), true);
  assert.throws(
    () => rolesGuard.canActivate(contextFor(CallsController.prototype.list, { role: UserRole.PATIENT })),
    ForbiddenException,
  );

  const jwtGuard = new JwtAuthGuard({
    validateToken: async (token: string) => {
      if (token !== 'valid') throw new UnauthorizedException('Credenciais invalidas');
      return {
        id: 1,
        name: 'Admin',
        email: 'admin@navora.com',
        phone: null,
        role: UserRole.ADMIN,
        active: true,
      };
    },
  } as any);

  assert.equal(await jwtGuard.canActivate(contextFor(CallsController.prototype.list, undefined, 'Bearer valid')), true);
  await assert.rejects(() => jwtGuard.canActivate(contextFor(CallsController.prototype.list)), UnauthorizedException);

  console.log('admin authorization tests passed');
}

run();

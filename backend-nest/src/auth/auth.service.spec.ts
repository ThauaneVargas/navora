import { strict as assert } from 'node:assert';
import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';

const jwtSecret = 'test-secret-with-enough-length-for-auth-spec';

function user(overrides: Record<string, any> = {}) {
  return {
    id: overrides.id ?? 1,
    email: overrides.email ?? 'admin@navora.com',
    passwordHash: overrides.passwordHash,
    name: overrides.name ?? 'Admin Navora',
    phone: overrides.phone ?? null,
    role: overrides.role ?? UserRole.ADMIN,
    active: overrides.active ?? true,
    createdAt: new Date('2026-01-01T00:00:00.000Z'),
    updatedAt: new Date('2026-01-01T00:00:00.000Z'),
  };
}

function makeService(users: any[]) {
  const prisma = {
    user: {
      findUnique: async ({ where }: any) => {
        if (where.email) return users.find((item) => item.email === where.email) ?? null;
        if (where.id) return users.find((item) => item.id === where.id) ?? null;
        return null;
      },
    },
  };
  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return jwtSecret;
      if (key === 'JWT_EXPIRES_IN') return '1h';
      return undefined;
    },
  };

  return new AuthService(prisma as any, new JwtService(), config as ConfigService);
}

function makeContext(authorization?: string) {
  const request: { headers: { authorization?: string }; user?: any } = { headers: { authorization } };
  return {
    request,
    context: {
      switchToHttp: () => ({
        getRequest: () => request,
      }),
    } as any,
  };
}

async function expectUnauthorized(label: string, action: () => Promise<unknown>) {
  try {
    await action();
    assert.fail(`${label}: deveria negar acesso`);
  } catch (error) {
    assert.ok(error instanceof UnauthorizedException, label);
  }
}

async function run() {
  const passwordHash = await bcrypt.hash('senha-correta', 10);
  const activeAdmin = user({ passwordHash });
  const inactiveReception = user({
    id: 2,
    email: 'recepcao@navora.com',
    role: UserRole.RECEPTION,
    active: false,
    passwordHash,
  });
  const service = makeService([activeAdmin, inactiveReception]);

  const login = await service.login({ email: 'ADMIN@navora.com', password: 'senha-correta' });
  assert.ok(login.access_token, 'login valido retorna token');
  assert.equal(login.user.role, UserRole.ADMIN, 'login valido retorna role');
  assert.equal(Object.prototype.hasOwnProperty.call(login.user, 'passwordHash'), false, 'login nao serializa passwordHash');

  await expectUnauthorized('senha invalida', () => service.login({ email: activeAdmin.email, password: 'errada' }));
  await expectUnauthorized('usuario inexistente', () => service.login({ email: 'ninguem@navora.com', password: 'senha-correta' }));
  await expectUnauthorized('usuario inativo', () => service.login({ email: inactiveReception.email, password: 'senha-correta' }));

  const validated = await service.validateToken(login.access_token);
  assert.equal(validated.id, activeAdmin.id, 'token valido autentica usuario');
  assert.equal(Object.prototype.hasOwnProperty.call(validated, 'passwordHash'), false, 'token valido nao serializa passwordHash');
  await expectUnauthorized('token invalido', () => service.validateToken('token-invalido'));

  const controller = new AuthController(service);
  const me = await controller.me(validated);
  assert.equal(me.email, activeAdmin.email, '/auth/me retorna usuario autenticado');
  assert.equal(Object.prototype.hasOwnProperty.call(me, 'passwordHash'), false, '/auth/me nao serializa passwordHash');

  const guard = new JwtAuthGuard(service);
  const validContext = makeContext(`Bearer ${login.access_token}`);
  assert.equal(await guard.canActivate(validContext.context), true, 'JwtAuthGuard aceita token valido');
  assert.equal(validContext.request.user?.email, activeAdmin.email, 'JwtAuthGuard injeta usuario');

  await expectUnauthorized('JwtAuthGuard rejeita token invalido', () =>
    guard.canActivate(makeContext('Bearer invalido').context),
  );

  for (const role of [UserRole.PATIENT, UserRole.RECEPTION, UserRole.ADMIN]) {
    const roleUser = user({
      id: role === UserRole.PATIENT ? 10 : role === UserRole.RECEPTION ? 11 : 12,
      email: `${role.toLowerCase()}@navora.com`,
      role,
      passwordHash,
    });
    const roleService = makeService([roleUser]);
    const result = await roleService.login({ email: roleUser.email, password: 'senha-correta' });
    const tokenUser = await roleService.validateToken(result.access_token);
    assert.equal(tokenUser.role, role, `role ${role} preservada no token`);
  }

  console.log('auth tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

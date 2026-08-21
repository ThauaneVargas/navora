import { strict as assert } from 'node:assert';
import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PatientsService } from './patients.service';

const jwtSecret = 'patient-spec-secret-with-enough-length';

function makeHarness() {
  const users: any[] = [];
  const patientProfiles: any[] = [];
  let nextUserId = 1;
  let nextProfileId = 1;

  const userApi = {
    findUnique: async ({ where }: any) => {
      if (where.email) return users.find((user) => user.email === where.email) ?? null;
      if (where.id) return users.find((user) => user.id === where.id) ?? null;
      return null;
    },
    create: async ({ data }: any) => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const user = { id: nextUserId++, createdAt: now, updatedAt: now, ...data };
      users.push(user);
      return user;
    },
    update: async ({ where, data }: any) => {
      const user = users.find((item) => item.id === where.id);
      Object.assign(user, data, { updatedAt: new Date('2026-01-01T01:00:00.000Z') });
      return user;
    },
  };

  const profileApi = {
    findUnique: async ({ where, include }: any) => {
      const profile = patientProfiles.find((item) => item.userId === where.userId);
      if (!profile) return null;
      return include?.user ? { ...profile, user: users.find((user) => user.id === profile.userId) } : profile;
    },
    create: async ({ data, include }: any) => {
      const now = new Date('2026-01-01T00:00:00.000Z');
      const profile = {
        id: nextProfileId++,
        patientCode: null,
        birthDate: null,
        accessibility: {},
        createdAt: now,
        updatedAt: now,
        ...data,
      };
      patientProfiles.push(profile);
      return include?.user ? { ...profile, user: users.find((user) => user.id === profile.userId) } : profile;
    },
    update: async ({ where, data, include }: any) => {
      const profile = patientProfiles.find((item) => item.userId === where.userId);
      Object.assign(profile, data, { updatedAt: new Date('2026-01-01T01:00:00.000Z') });
      return include?.user ? { ...profile, user: users.find((user) => user.id === profile.userId) } : profile;
    },
  };

  const prisma = {
    user: userApi,
    patientProfile: profileApi,
    $transaction: (callback: any) => callback({ user: userApi, patientProfile: profileApi }),
  };
  const config = {
    get: (key: string) => {
      if (key === 'JWT_SECRET') return jwtSecret;
      if (key === 'JWT_EXPIRES_IN') return '1h';
      return undefined;
    },
  };
  const authService = new AuthService(prisma as any, new JwtService(), config as ConfigService);
  const patientsService = new PatientsService(prisma as any, authService);

  return { users, patientProfiles, authService, patientsService };
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

async function expectError(label: string, expected: any, action: () => Promise<unknown>) {
  try {
    await action();
    assert.fail(`${label}: deveria falhar`);
  } catch (error) {
    assert.ok(error instanceof expected, label);
  }
}

async function run() {
  const { users, patientProfiles, authService, patientsService } = makeHarness();

  const registered = await patientsService.register({
    email: 'Paciente@Navora.com',
    password: 'senha123',
    name: 'Paciente Demo',
    phone: '21999999999',
    patientCode: 'PAT-100',
    birthDate: '1990-01-10',
    accessibility: {
      wheelchair: true,
      avoidStairs: true,
      highContrast: true,
      diagnosis: true,
    } as any,
  });

  assert.ok(registered.access_token, 'cadastro retorna token');
  assert.equal(registered.patient.user.role, UserRole.PATIENT, 'cadastro cria usuario PATIENT');
  assert.equal(registered.patient.user.email, 'paciente@navora.com', 'email normalizado');
  assert.equal(Object.prototype.hasOwnProperty.call(registered.patient.user, 'passwordHash'), false, 'cadastro nao serializa passwordHash');
  assert.equal(users.length, 1, 'cadastro cria User');
  assert.equal(patientProfiles.length, 1, 'cadastro cria PatientProfile');
  assert.equal(await bcrypt.compare('senha123', users[0].passwordHash), true, 'senha fica hasheada');
  assert.equal(users[0].passwordHash === 'senha123', false, 'senha original nao e persistida');
  assert.deepEqual(registered.patient.accessibility, { wheelchair: true, avoidStairs: true, highContrast: true }, 'accessibility ignora campos nao permitidos');

  await expectError('email duplicado', Error, () =>
    patientsService.register({
      email: 'paciente@navora.com',
      password: 'outrasenha',
      name: 'Outro Paciente',
    }),
  );

  const login = await authService.login({ email: 'paciente@navora.com', password: 'senha123' });
  assert.ok(login.access_token, 'login apos cadastro funciona');

  const tokenUser = await authService.validateToken(login.access_token);
  const me = await patientsService.me(tokenUser);
  assert.equal(me.patientCode, 'PAT-100', 'GET /patients/me retorna profile');
  assert.equal(Object.prototype.hasOwnProperty.call(me.user, 'passwordHash'), false, 'GET /patients/me nao serializa passwordHash');

  const updated = await patientsService.updateMe(tokenUser, {
    name: 'Paciente Atualizado',
    phone: '21888888888',
    birthDate: null,
    accessibility: { preferElevator: true, needsStretcher: false },
  });
  assert.equal(updated.user.name, 'Paciente Atualizado', 'PUT /patients/me atualiza User');
  assert.equal(updated.birthDate, null, 'PUT /patients/me permite limpar birthDate');
  assert.deepEqual(updated.accessibility, { preferElevator: true, needsStretcher: false }, 'PUT /patients/me atualiza accessibility');

  const accessibility = await patientsService.updateAccessibility(tokenUser, {
    wheelchair: true,
    largerText: true,
  });
  assert.deepEqual(accessibility.accessibility, {
    preferElevator: true,
    needsStretcher: false,
    wheelchair: true,
    largerText: true,
  }, 'PUT /patients/me/accessibility mescla preferencias');

  const guard = new JwtAuthGuard(authService);
  await expectError('acesso sem JWT', UnauthorizedException, () => guard.canActivate(makeContext().context));

  await expectError('role incorreta', ForbiddenException, () =>
    patientsService.me({ ...tokenUser, role: UserRole.ADMIN }),
  );

  console.log('patient tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

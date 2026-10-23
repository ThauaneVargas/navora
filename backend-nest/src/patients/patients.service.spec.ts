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
    delete: async ({ where }: any) => {
      const index = users.findIndex((item) => item.id === where.id);
      return users.splice(index, 1)[0];
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

  const deletedNotificationsFor: number[] = [];
  const profileDeleteMany = async ({ where }: any) => {
    const before = patientProfiles.length;
    for (let i = patientProfiles.length - 1; i >= 0; i -= 1) {
      if (patientProfiles[i].userId === where.userId) patientProfiles.splice(i, 1);
    }
    return { count: before - patientProfiles.length };
  };
  const prisma = {
    user: userApi,
    patientProfile: { ...profileApi, deleteMany: profileDeleteMany },
    notification: {
      deleteMany: async ({ where }: any) => {
        deletedNotificationsFor.push(where.userId);
        return { count: 0 };
      },
    },
    checkIn: { updateMany: async () => ({ count: 0 }) },
    $transaction: (arg: any) =>
      Array.isArray(arg) ? Promise.all(arg) : arg({ user: userApi, patientProfile: profileApi }),
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

  return { users, patientProfiles, deletedNotificationsFor, authService, patientsService };
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
  const { users, patientProfiles, deletedNotificationsFor, authService, patientsService } = makeHarness();

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
      visualImpairment: true,
      diagnosis: true,
    } as any,
    notes: '  Alergia a dipirona  ',
    acceptedPrivacyPolicy: true,
    privacyPolicyVersion: '2026-10-22',
  });

  assert.ok(registered.access_token, 'cadastro retorna token');
  assert.equal(registered.patient.user.role, UserRole.PATIENT, 'cadastro cria usuario PATIENT');
  assert.equal(registered.patient.user.email, 'paciente@navora.com', 'email normalizado');
  assert.equal(Object.prototype.hasOwnProperty.call(registered.patient.user, 'passwordHash'), false, 'cadastro nao serializa passwordHash');
  assert.equal(users.length, 1, 'cadastro cria User');
  assert.equal(patientProfiles.length, 1, 'cadastro cria PatientProfile');
  assert.equal(await bcrypt.compare('senha123', users[0].passwordHash), true, 'senha fica hasheada');
  assert.equal(users[0].passwordHash === 'senha123', false, 'senha original nao e persistida');
  assert.deepEqual(
    registered.patient.accessibility,
    { wheelchair: true, avoidStairs: true, highContrast: true, visualImpairment: true },
    'accessibility ignora campos nao permitidos (e guarda deficiencia visual)',
  );
  assert.equal(registered.patient.notes, 'Alergia a dipirona', 'cadastro guarda observacoes (sem espacos nas pontas)');
  assert.ok(registered.patient.privacyConsentAt, 'cadastro registra quando o consentimento LGPD foi dado');
  assert.equal(registered.patient.privacyPolicyVersion, '2026-10-22', 'cadastro registra a versao da politica aceita');

  await expectError('email duplicado', Error, () =>
    patientsService.register({
      email: 'paciente@navora.com',
      password: 'outrasenha',
      name: 'Outro Paciente',
      acceptedPrivacyPolicy: true,
      privacyPolicyVersion: '2026-10-22',
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
  assert.equal(updated.notes, 'Alergia a dipirona', 'PUT /patients/me sem notes mantem as observacoes');

  const notesCleared = await patientsService.updateMe(tokenUser, { notes: '   ' });
  assert.equal(notesCleared.notes, null, 'PUT /patients/me com notes vazio limpa as observacoes');

  const accessibility = await patientsService.updateAccessibility(tokenUser, {
    wheelchair: true,
    largerText: true,
    needsCompanion: true,
    hearingImpairment: true,
  });
  assert.deepEqual(accessibility.accessibility, {
    preferElevator: true,
    needsStretcher: false,
    wheelchair: true,
    largerText: true,
    needsCompanion: true,
    hearingImpairment: true,
  }, 'PUT /patients/me/accessibility mescla preferencias (incluindo acompanhante e deficiencia auditiva)');

  const guard = new JwtAuthGuard(authService);
  await expectError('acesso sem JWT', UnauthorizedException, () => guard.canActivate(makeContext().context));

  await expectError('role incorreta', ForbiddenException, () =>
    patientsService.me({ ...tokenUser, role: UserRole.ADMIN }),
  );

  await expectError('excluir conta com senha errada', UnauthorizedException, () =>
    patientsService.deleteMe(tokenUser, 'senha-errada'),
  );
  assert.equal(users.length, 1, 'senha errada nao apaga nada');

  const deleted = await patientsService.deleteMe(tokenUser, 'senha123');
  assert.equal(deleted.deleted, true, 'DELETE /patients/me confirma exclusao');
  assert.equal(users.length, 0, 'exclusao apaga o User');
  assert.equal(patientProfiles.length, 0, 'exclusao apaga o PatientProfile (saude, observacoes, contato)');
  assert.deepEqual(deletedNotificationsFor, [tokenUser.id], 'exclusao apaga as notificacoes do paciente');
  await expectError('login depois de excluir', UnauthorizedException, () =>
    authService.login({ email: 'paciente@navora.com', password: 'senha123' }),
  );

  console.log('patient tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

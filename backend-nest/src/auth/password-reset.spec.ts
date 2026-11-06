import * as assert from 'node:assert/strict';
import { BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from './auth.service';

const STRONG = 'Nova@senha1';

function makeUsers() {
  return [
    {
      id: 7,
      email: 'paciente@navora.com',
      name: 'Paciente',
      phone: null,
      role: UserRole.PATIENT,
      active: true,
      passwordHash: '',
      passwordResetToken: null as string | null,
      passwordResetExpires: null as Date | null,
      passwordResetAttempts: 0,
      passwordChangedAt: null as Date | null,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ];
}

function makeService(users: any[], mailConfigured: boolean) {
  const sent: { to: string; text: string }[] = [];
  const prisma = {
    user: {
      findUnique: async ({ where }: any) =>
        users.find((u) => (where.email ? u.email === where.email : u.id === where.id)) ?? null,
      update: async ({ where, data }: any) => {
        const user = users.find((u) => u.id === where.id);
        Object.assign(user, data);
        return user;
      },
    },
  };
  const mail = {
    isConfigured: () => mailConfigured,
    send: async (to: string, _subject: string, text: string) => {
      sent.push({ to, text });
      return true;
    },
  };
  const config = { get: () => undefined } as unknown as ConfigService;
  return { service: new AuthService(prisma as any, new JwtService(), config, mail as any), sent };
}

async function expectInvalid(label: string, action: () => Promise<unknown>) {
  await assert.rejects(action, BadRequestException, label);
}

async function run() {
  const previousEnv = process.env.NODE_ENV;

  // Producao sem e-mail configurado: avisa, nao gera codigo nem finge envio.
  process.env.NODE_ENV = 'production';
  {
    const users = makeUsers();
    const { service, sent } = makeService(users, false);
    const result = await service.forgotPassword({ email: 'paciente@navora.com' });
    assert.equal(result.delivery, 'unavailable');
    assert.equal(users[0].passwordResetToken, null);
    assert.equal(sent.length, 0);
  }

  // Com e-mail: manda codigo de 6 digitos; resposta igual para e-mail inexistente.
  {
    const users = makeUsers();
    const { service, sent } = makeService(users, true);
    const unknown = await service.forgotPassword({ email: 'ninguem@navora.com' });
    assert.deepEqual(unknown, { ok: true, delivery: 'email' }, 'nao revela se o e-mail existe');
    assert.equal(sent.length, 0);

    const result = await service.forgotPassword({ email: 'Paciente@Navora.com' });
    assert.equal(result.delivery, 'email');
    assert.equal(sent.length, 1);
    const code = sent[0].text.match(/\b(\d{6})\b/)?.[1];
    assert.ok(code, 'e-mail traz codigo de 6 digitos');
    assert.notEqual(users[0].passwordResetToken, code, 'banco guarda so o hash');

    await expectInvalid('codigo sem e-mail', () => service.resetPassword({ token: code!, newPassword: STRONG }));
    await expectInvalid('codigo errado', () => service.resetPassword({ email: 'paciente@navora.com', token: '000000' === code ? '111111' : '000000', newPassword: STRONG }));
    assert.equal(users[0].passwordResetAttempts, 1);

    await service.resetPassword({ email: 'paciente@navora.com', token: code!, newPassword: STRONG });
    assert.ok(await bcrypt.compare(STRONG, users[0].passwordHash), 'senha trocada');
    assert.equal(users[0].passwordResetToken, null, 'codigo usado e descartado');
    assert.ok(users[0].passwordChangedAt, 'marca a troca para derrubar sessoes antigas');
    await expectInvalid('codigo nao vale duas vezes', () => service.resetPassword({ email: 'paciente@navora.com', token: code!, newPassword: STRONG }));
  }

  // 5 tentativas erradas descartam o codigo (sem forca bruta nos 6 digitos).
  {
    const users = makeUsers();
    const { service, sent } = makeService(users, true);
    await service.forgotPassword({ email: 'paciente@navora.com' });
    const code = sent[0].text.match(/\b(\d{6})\b/)![1];
    const wrong = code === '999999' ? '999998' : '999999';
    for (let i = 0; i < 5; i += 1) {
      await expectInvalid(`tentativa errada ${i + 1}`, () => service.resetPassword({ email: 'paciente@navora.com', token: wrong, newPassword: STRONG }));
    }
    await expectInvalid('codigo certo depois de 5 erros', () => service.resetPassword({ email: 'paciente@navora.com', token: code, newPassword: STRONG }));
  }

  // Codigo vencido.
  {
    const users = makeUsers();
    const { service, sent } = makeService(users, true);
    await service.forgotPassword({ email: 'paciente@navora.com' });
    const code = sent[0].text.match(/\b(\d{6})\b/)![1];
    users[0].passwordResetExpires = new Date(Date.now() - 1000);
    await expectInvalid('codigo vencido', () => service.resetPassword({ email: 'paciente@navora.com', token: code, newPassword: STRONG }));
  }

  process.env.NODE_ENV = previousEnv;
  console.log('password reset tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

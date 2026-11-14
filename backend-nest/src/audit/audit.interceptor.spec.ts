import { strict as assert } from 'node:assert';
import { setImmediate } from 'node:timers';
import { UserRole } from '@prisma/client';
import { lastValueFrom, of } from 'rxjs';
import { AuditInterceptor } from './audit.interceptor';

class CallsController {
  updateStatus() {}
  list() {}
}
class CheckInsController {
  get() {}
}
class AuthController {
  login() {}
}

function makeInterceptor() {
  const logs: any[] = [];
  const prisma = { auditLog: { create: async ({ data }: any) => logs.push(data) } };
  return { interceptor: new AuditInterceptor(prisma as any), logs };
}

function context(controller: any, handler: string, request: any) {
  return {
    getType: () => 'http',
    getClass: () => controller,
    getHandler: () => controller.prototype[handler],
    switchToHttp: () => ({ getRequest: () => request }),
  } as any;
}

const reception = { id: 5, name: 'R', email: 'r@x', phone: null, role: UserRole.RECEPTION, hospitalId: 1, active: true };
const patient = { ...reception, id: 9, role: UserRole.PATIENT, hospitalId: null };

async function call(interceptor: AuditInterceptor, ctx: any, response: unknown = { ok: true }) {
  await lastValueFrom(interceptor.intercept(ctx, { handle: () => of(response) }));
  await new Promise((resolve) => setImmediate(resolve));
}

async function run() {
  const { interceptor, logs } = makeInterceptor();

  // Alteracao feita pela equipe: grava acao, registro e so campos de controle.
  await call(
    interceptor,
    context(CallsController, 'updateStatus', {
      method: 'PATCH',
      ip: '10.0.0.1',
      params: { callId: '42' },
      body: { status: 'ACCEPTED', patient_name: 'Maria', caller_phone: '81999' },
      user: reception,
    }),
  );
  assert.equal(logs.length, 1);
  assert.deepEqual(
    { hospitalId: logs[0].hospitalId, actorId: logs[0].actorId, action: logs[0].action, entity: logs[0].entity, entityId: logs[0].entityId },
    { hospitalId: 1, actorId: 5, action: 'calls.updateStatus', entity: 'calls', entityId: '42' },
  );
  assert.deepEqual(logs[0].details, { status: 'ACCEPTED' }, 'nome e telefone NAO vao para a auditoria');
  assert.equal(logs[0].ip, '10.0.0.1');

  // Abrir um registro especifico conta como "viu".
  await call(interceptor, context(CheckInsController, 'get', { method: 'GET', params: { checkInId: '7' }, user: reception }));
  assert.equal(logs[1].action, 'checkins.get.view');

  // Lista consultada a cada 2 s pelo painel: nao grava (seria ruido).
  await call(interceptor, context(CallsController, 'list', { method: 'GET', params: {}, user: reception }));
  assert.equal(logs.length, 2, 'listas nao entram na auditoria');

  // Paciente nao e auditado aqui (nao e acao de equipe).
  await call(interceptor, context(CallsController, 'updateStatus', { method: 'PATCH', params: { callId: '1' }, user: patient }));
  assert.equal(logs.length, 2, 'acao de paciente nao entra');

  // Login da equipe entra (o usuario vem na resposta).
  await call(interceptor, context(AuthController, 'login', { method: 'POST', params: {}, body: { email: 'r@x', password: 'segredo' } }), {
    access_token: 't',
    user: reception,
  });
  assert.equal(logs[2].action, 'auth.login');
  assert.deepEqual(logs[2].details, {}, 'senha e e-mail nunca vao para a auditoria');

  // Falha ao gravar a auditoria nao derruba a acao.
  const failing = new AuditInterceptor({ auditLog: { create: async () => Promise.reject(new Error('banco fora')) } } as any);
  await call(failing, context(CallsController, 'updateStatus', { method: 'PATCH', params: { callId: '1' }, user: reception }));

  console.log('audit interceptor tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

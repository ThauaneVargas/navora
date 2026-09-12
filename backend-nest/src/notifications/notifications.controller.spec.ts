import * as assert from 'node:assert/strict';
import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';
import { NotificationsController } from './notifications.controller';

const user: AuthenticatedUser = { id: 10, name: 'Paciente', email: 'p@test.com', phone: null, role: UserRole.PATIENT, active: true };

function makeService(overrides: Partial<Record<string, (...args: any[]) => any>> = {}) {
  return {
    findAll: async (u: any) => [{ id: 1, title: 'Teste', category: 'Navegacao', read: false }],
    markAllRead: async (u: any) => ({ ok: true }),
    markRead: async (u: any, id: number) => ({ ok: true }),
    remove: async (u: any, id: number) => ({ ok: true }),
    ...overrides,
  };
}

async function run() {
  // ── GET /notifications/me ─────────────────────────────────────────────────
  {
    const svc = makeService();
    const ctrl = new NotificationsController(svc as any);

    const result = await ctrl.findAll(user);
    assert.equal(result.length, 1);
    assert.equal(result[0].title, 'Teste');
  }

  // ── PUT /notifications/me/read-all ────────────────────────────────────────
  {
    const svc = makeService();
    const ctrl = new NotificationsController(svc as any);

    const result = await ctrl.markAllRead(user);
    assert.deepEqual(result, { ok: true });
  }

  // ── PUT /notifications/:id/read ───────────────────────────────────────────
  {
    const svc = makeService();
    const ctrl = new NotificationsController(svc as any);

    const result = await ctrl.markRead(user, 5);
    assert.deepEqual(result, { ok: true });
  }

  // ── DELETE /notifications/:id ─────────────────────────────────────────────
  {
    const svc = makeService();
    const ctrl = new NotificationsController(svc as any);

    const result = await ctrl.remove(user, 5);
    assert.deepEqual(result, { ok: true });
  }

  // ── delegates to service with correct args ────────────────────────────────
  {
    const calls: any[] = [];
    const svc = makeService({
      findAll: async (u: any) => { calls.push(['findAll', u.id]); return []; },
      markRead: async (u: any, id: number) => { calls.push(['markRead', u.id, id]); return { ok: true }; },
      remove: async (u: any, id: number) => { calls.push(['remove', u.id, id]); return { ok: true }; },
    });
    const ctrl = new NotificationsController(svc as any);

    await ctrl.findAll(user);
    await ctrl.markRead(user, 42);
    await ctrl.remove(user, 99);

    assert.deepEqual(calls[0], ['findAll', 10]);
    assert.deepEqual(calls[1], ['markRead', 10, 42]);
    assert.deepEqual(calls[2], ['remove', 10, 99]);
  }

  console.log('notifications controller tests passed');
}

run();

import * as assert from 'node:assert/strict';
import { NotFoundException } from '@nestjs/common';
import { NotificationCategory } from '@prisma/client';
import { NotificationsService } from './notifications.service';
import { NotificationCategoryDto } from './dto/create-notification.dto';

const NOW = new Date('2026-09-12T10:00:00.000Z');

function makeNotification(overrides: Record<string, any> = {}) {
  return {
    id: 1,
    userId: 10,
    category: NotificationCategory.NAVIGATION,
    icon: 'navigation',
    title: 'Rota iniciada',
    description: 'Sua rota para Tomografia foi iniciada.',
    read: false,
    createdAt: NOW,
    ...overrides,
  };
}

function makePrisma(seed: any[] = []) {
  const records: any[] = [...seed];
  let nextId = records.length + 1;

  return {
    notification: {
      findMany: async ({ where, orderBy, take }: any) => {
        let result = records.filter((n) => n.userId === where.userId);
        if (orderBy?.createdAt === 'desc') result = [...result].reverse();
        return take ? result.slice(0, take) : result;
      },
      findFirst: async ({ where }: any) =>
        records.find((n) => n.id === where.id && n.userId === where.userId) ?? null,
      update: async ({ where, data }: any) => {
        const i = records.findIndex((n) => n.id === where.id);
        records[i] = { ...records[i], ...data };
        return records[i];
      },
      updateMany: async ({ where, data }: any) => {
        records
          .filter((n) => n.userId === where.userId && n.read === where.read)
          .forEach((n) => Object.assign(n, data));
        return { count: records.length };
      },
      delete: async ({ where }: any) => {
        const i = records.findIndex((n) => n.id === where.id);
        const deleted = records[i];
        records.splice(i, 1);
        return deleted;
      },
      create: async ({ data }: any) => {
        const n = { id: nextId++, read: false, createdAt: NOW, ...data };
        records.push(n);
        return n;
      },
    },
  };
}

import { UserRole } from '@prisma/client';
import type { AuthenticatedUser } from '../auth/auth.types';

const user: AuthenticatedUser = { id: 10, name: 'Paciente', email: 'p@test.com', phone: null, role: UserRole.PATIENT, active: true };
const otherUser: AuthenticatedUser = { id: 99, name: 'Outro', email: 'o@test.com', phone: null, role: UserRole.PATIENT, active: true };

async function run() {
  // ── findAll ──────────────────────────────────────────────────────────────
  {
    const prisma = makePrisma([
      makeNotification({ id: 1, userId: 10 }),
      makeNotification({ id: 2, userId: 10, category: NotificationCategory.ACCESS }),
      makeNotification({ id: 3, userId: 99 }),
    ]);
    const svc = new NotificationsService(prisma as any);

    const result = await svc.findAll(user);
    assert.equal(result.length, 2, 'findAll returns only own notifications');
    const cats = result.map((n) => n.category);
    assert.ok(cats.includes('Navegacao'), 'includes Navegacao category');
    assert.ok(cats.includes('Acesso'), 'includes Acesso category');
    assert.ok(typeof result[0].createdAt === 'string', 'createdAt is ISO string');

    const other = await svc.findAll(otherUser);
    assert.equal(other.length, 1, 'findAll isolates notifications per user');
    assert.ok(other.every((n: any) => n.id === 3), 'other user sees only their own');
  }

  // ── markRead ─────────────────────────────────────────────────────────────
  {
    const n = makeNotification({ id: 5, userId: 10, read: false });
    const prisma = makePrisma([n]);
    const svc = new NotificationsService(prisma as any);

    const ok = await svc.markRead(user, 5);
    assert.deepEqual(ok, { ok: true });

    // ownership check: another user cannot mark it read
    await assert.rejects(() => svc.markRead(otherUser, 5), NotFoundException);

    // non-existent id
    await assert.rejects(() => svc.markRead(user, 999), NotFoundException);
  }

  // ── markAllRead ───────────────────────────────────────────────────────────
  {
    const prisma = makePrisma([
      makeNotification({ id: 1, userId: 10, read: false }),
      makeNotification({ id: 2, userId: 10, read: false }),
    ]);
    const svc = new NotificationsService(prisma as any);

    const ok = await svc.markAllRead(user);
    assert.deepEqual(ok, { ok: true });
  }

  // ── remove ────────────────────────────────────────────────────────────────
  {
    const prisma = makePrisma([makeNotification({ id: 7, userId: 10 })]);
    const svc = new NotificationsService(prisma as any);

    const ok = await svc.remove(user, 7);
    assert.deepEqual(ok, { ok: true });

    // already deleted / wrong user
    await assert.rejects(() => svc.remove(user, 7), NotFoundException);
    await assert.rejects(() => svc.remove(otherUser, 7), NotFoundException);
  }

  // ── create ────────────────────────────────────────────────────────────────
  {
    const prisma = makePrisma();
    const svc = new NotificationsService(prisma as any);

    const n = await svc.create(10, {
      category: NotificationCategoryDto.HELP_SOS,
      icon: 'alarm-light-outline',
      title: 'SOS ativado',
      description: 'Sua solicitação de socorro foi registrada.',
    });
    assert.equal(n.category, 'Ajuda-SOS');
    assert.equal(n.title, 'SOS ativado');
    assert.equal(n.read, false);
    assert.ok(n.id > 0);
  }

  // ── toResponse category mapping ───────────────────────────────────────────
  {
    const prisma = makePrisma([
      makeNotification({ id: 1, userId: 10, category: NotificationCategory.NAVIGATION }),
      makeNotification({ id: 2, userId: 10, category: NotificationCategory.ACCESS }),
      makeNotification({ id: 3, userId: 10, category: NotificationCategory.HELP_SOS }),
    ]);
    const svc = new NotificationsService(prisma as any);
    const list = await svc.findAll(user);

    const cats = list.map((n) => n.category);
    assert.ok(cats.includes('Navegacao'));
    assert.ok(cats.includes('Acesso'));
    assert.ok(cats.includes('Ajuda-SOS'));
  }

  console.log('notifications service tests passed');
}

run();

import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { OperationalMessagesService } from './operational-messages.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const messages: any[] = [];

  return {
    operationalMessage: {
      findMany: async () => [...messages].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      findUnique: async ({ where }: { where: { id: number } }) =>
        messages.find((message) => message.id === where.id) || null,
      create: async ({ data }: { data: Record<string, any> }) => {
        const message = {
          id: messages.length + 1,
          readAt: null,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        messages.push(message);
        return message;
      },
      update: async ({ where, data }: { where: { id: number }; data: Record<string, any> }) => {
        const index = messages.findIndex((message) => message.id === where.id);
        messages[index] = { ...messages[index], ...data, updatedAt: now };
        return messages[index];
      },
    },
  };
}

async function run() {
  const service = new OperationalMessagesService(makePrisma() as any);

  const created = await service.create({
    to: 'Recepcao',
    message: 'Aviso operacional',
    priority: 'Alta',
  });
  assert.equal(created.to, 'Recepcao');
  assert.equal(created.message, 'Aviso operacional');
  assert.equal(created.priority, 'Alta');
  assert.equal(created.direction, 'Enviada');

  const listed = await service.list();
  assert.equal(listed.length, 1);

  const read = await service.markRead(created.id);
  assert.ok(read.read_at);

  await assert.rejects(() => service.create({ to: '', message: '' }), BadRequestException);
  await assert.rejects(() => service.markRead(999), NotFoundException);

  console.log('operational messages service tests passed');
}

run();

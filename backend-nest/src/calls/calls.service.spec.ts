import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType, Priority } from '@prisma/client';
import { CreateCallDto } from './dto/create-call.dto';
import { CallsService } from './calls.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const calls: any[] = [];

  return {
    calls,
    callRequest: {
      findMany: async () => [...calls].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      findUnique: async ({ where }: { where: { id: number } }) => calls.find((call) => call.id === where.id) || null,
      create: async ({ data }: { data: Record<string, any> }) => {
        const call = {
          id: calls.length + 1,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        calls.push(call);
        return call;
      },
      update: async ({ where, data }: { where: { id: number }; data: Record<string, any> }) => {
        const index = calls.findIndex((call) => call.id === where.id);
        calls[index] = { ...calls[index], ...data, updatedAt: now };
        return calls[index];
      },
    },
  };
}

async function run() {
  const prisma = makePrisma();
  const service = new CallsService(prisma as any);
  const basePayload: CreateCallDto = {
    user_type: 'patient',
    user_name: 'Paciente',
    area: 'private',
    area_name: 'HMC Private',
    patient_name: 'Paciente',
    call_type: CallType.HELP,
    location: 'Recepcao',
    sector: 'Entrada Principal',
    priority: Priority.MEDIUM,
  };

  const help = await service.createHelp({ ...basePayload, user_name: 'Paciente Help' });
  assert.equal(help.call_type, CallType.HELP);
  assert.equal(help.priority, Priority.MEDIUM);
  assert.equal(help.status, CallStatus.PENDING);

  const sos = await service.createSos({ ...basePayload, user_name: 'Paciente SOS', location: 'Corredor' });
  assert.equal(sos.call_type, CallType.SOS);
  assert.equal(sos.priority, Priority.CRITICAL);

  const listed = await service.list();
  assert.equal(listed.length, 2);

  const accepted = await service.updateStatus(1, CallStatus.ACCEPTED);
  assert.equal(accepted.status, CallStatus.ACCEPTED);

  const closed = await service.updateStatus(1, CallStatus.CLOSED);
  assert.equal(closed.status, CallStatus.CLOSED);

  await assert.rejects(() => service.updateStatus(1, CallStatus.PENDING), BadRequestException);
  await assert.rejects(() => service.updateStatus(999, CallStatus.ACCEPTED), NotFoundException);

  console.log('calls service tests passed');
}

run();

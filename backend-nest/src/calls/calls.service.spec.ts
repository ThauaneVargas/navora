import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType, Priority, UserRole } from '@prisma/client';
import { CreateCallDto } from './dto/create-call.dto';
import { CallsService } from './calls.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const calls: any[] = [];

  return {
    calls,
    callRequest: {
      findMany: async ({ where }: any = {}) =>
        [...calls]
          .filter((call) => call.hospitalId === where?.hospitalId)
          .filter((call) => !where?.updatedAt?.gt || call.updatedAt > where.updatedAt.gt)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
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
        const patch = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));
        calls[index] = { ...calls[index], ...patch, updatedAt: new Date() };
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

  const user = { id: 7, name: 'Maria Conta', email: 'maria@navora.test', phone: '(81) 97777-1111', role: UserRole.PATIENT, hospitalId: null, active: true };

  const help = await service.createHelp({ ...basePayload, user_name: 'Paciente Help' }, user, 1);
  assert.equal(help.call_type, CallType.HELP);
  assert.equal(help.priority, Priority.MEDIUM);
  assert.equal(help.status, CallStatus.PENDING);

  const sos = await service.createSos({ ...basePayload, user_name: 'Paciente SOS', location: 'Corredor' }, user, 1);
  assert.equal(prisma.calls[1].userId, 7, 'chamado fica ligado a conta');
  assert.equal(sos.caller_phone, '(81) 97777-1111', 'sem telefone no corpo, usa o da conta');
  assert.equal(sos.call_type, CallType.SOS);
  assert.equal(sos.priority, Priority.CRITICAL);

  const listed = await service.list(1);
  assert.equal(listed.length, 2);

  // SOS mais completo: telefone, necessidades e codigo secreto para acompanhar.
  const full = await service.createSos({
    ...basePayload,
    user_name: 'Paciente Cadeirante',
    caller_phone: ' (81) 98888-0000 ',
    needs: ['wheelchair', 'wheelchair', 'hearing'],
  }, user, 1);
  assert.equal(full.caller_phone, '(81) 98888-0000');
  assert.deepEqual(full.needs, ['wheelchair', 'hearing'], 'sem repeticao');
  assert.ok(full.access_token, 'devolve codigo secreto so na criacao');
  assert.notEqual(prisma.calls[2].accessTokenHash, full.access_token, 'banco guarda so o hash');

  await assert.rejects(() => service.status(full.id, 'chute'), NotFoundException, 'codigo errado');
  await assert.rejects(() => service.status(full.id, undefined), NotFoundException, 'sem codigo');
  const own = await service.status(full.id, full.access_token);
  assert.equal(own.status, CallStatus.PENDING);
  assert.equal(Object.prototype.hasOwnProperty.call(own, 'patient_name'), false, 'status nao expoe dados pessoais');
  assert.equal(Object.prototype.hasOwnProperty.call(own, 'problems'), false, 'nao existe mais "o que esta acontecendo"');

  const since = new Date(Date.now() - 1);
  await service.updateStatus(1, full.id, CallStatus.ACCEPTED);
  const changed = await service.list(1, since);
  assert.deepEqual(changed.map((call) => call.id), [full.id], 'busca incremental traz so o alterado');
  assert.equal((await service.status(full.id, full.access_token)).status, CallStatus.ACCEPTED, 'celular ve "recebido"');
  await service.updateStatus(1, full.id, CallStatus.CLOSED);

  const accepted = await service.updateStatus(1, 1, CallStatus.ACCEPTED);
  assert.equal(accepted.status, CallStatus.ACCEPTED);

  const closed = await service.updateStatus(1, 1, CallStatus.CLOSED);
  assert.equal(closed.status, CallStatus.CLOSED);

  await assert.rejects(() => service.updateStatus(1, 1, CallStatus.PENDING), BadRequestException);
  await assert.rejects(() => service.updateStatus(1, 999, CallStatus.ACCEPTED), NotFoundException);

  // Separacao por hospital: chamado do hospital 1 nao aparece nem muda pelo 2.
  assert.equal(prisma.calls[0].hospitalId, 1, 'chamado guarda o hospital');
  assert.equal((await service.list(2)).length, 0, 'outro hospital nao ve os chamados');
  await assert.rejects(
    () => service.updateStatus(2, full.id, CallStatus.CANCELED),
    NotFoundException,
    'outro hospital nao altera o chamado (mesmo 404 de inexistente)',
  );
  const otherHospital = await service.createSos({ ...basePayload, user_name: 'Paciente H2' }, user, 2);
  assert.deepEqual((await service.list(2)).map((call) => call.id), [otherHospital.id], 'cada hospital ve so o seu');

  console.log('calls service tests passed');
}

run();

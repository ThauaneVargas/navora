import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckInStatus } from '@prisma/client';
import { CheckInsService } from './check-ins.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const checkIns: any[] = [];

  return {
    checkIn: {
      findMany: async ({ where }: any = {}) =>
        checkIns.filter((checkIn) => checkIn.hospitalId === where?.hospitalId).sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
      findUnique: async ({ where }: { where: { id: number } }) =>
        checkIns.find((checkIn) => checkIn.id === where.id) || null,
      create: async ({ data }: { data: Record<string, any> }) => {
        const checkIn = {
          id: checkIns.length + 1,
          status: CheckInStatus.WAITING,
          userId: null,
          destinationId: null,
          sectorId: null,
          visitorAccessRequestId: null,
          createdAt: now,
          updatedAt: now,
          ...data,
        };
        checkIns.push(checkIn);
        return checkIn;
      },
      update: async ({ where, data }: { where: { id: number }; data: Record<string, any> }) => {
        const index = checkIns.findIndex((checkIn) => checkIn.id === where.id);
        checkIns[index] = { ...checkIns[index], ...data, updatedAt: now };
        return checkIns[index];
      },
    },
    // Destino 10 e do hospital 1; destino 20 e do hospital 2.
    destination: {
      findUnique: async ({ where }: any) => ({ 10: { hospitalId: 1 }, 20: { hospitalId: 2 } } as any)[where.id] ?? null,
    },
    sector: { findUnique: async () => null },
    visitorAccessRequest: { findUnique: async () => null },
  };
}

async function run() {
  const service = new CheckInsService(makePrisma() as any);

  const created = await service.create(1, {
    patient: 'Paciente Check',
    document: '123',
    destination: 'Tomografia',
    accessibility: 'Nao',
  });
  assert.equal(created.patient_name, 'Paciente Check');
  assert.equal(created.destination_label, 'Tomografia');
  assert.equal(created.status, CheckInStatus.WAITING);

  const listed = await service.list(1);
  assert.equal(listed.length, 1);

  const inRoute = await service.updateStatus(1, created.id, CheckInStatus.IN_ROUTE);
  assert.equal(inRoute.status, CheckInStatus.IN_ROUTE);

  const finished = await service.updateStatus(1, created.id, CheckInStatus.FINISHED);
  assert.equal(finished.status, CheckInStatus.FINISHED);

  await assert.rejects(() => service.updateStatus(1, created.id, CheckInStatus.WAITING), BadRequestException);
  await assert.rejects(() => service.get(1, 999), NotFoundException);
  await assert.rejects(() => service.create(1, { patient: '', destination: '' }), BadRequestException);

  // Separacao por hospital.
  assert.equal((await service.list(2)).length, 0, 'outro hospital nao ve o check-in');
  await assert.rejects(() => service.get(2, created.id), NotFoundException, 'outro hospital nao abre o check-in');
  await assert.rejects(() => service.updateStatus(2, created.id, CheckInStatus.CANCELED), NotFoundException);
  const withOwnDestination = await service.create(1, { patient: 'P', destination: 'Tomo', destination_id: 10 });
  assert.equal(withOwnDestination.destination_id, 10, 'destino do proprio hospital e aceito');
  await assert.rejects(
    () => service.create(1, { patient: 'P', destination: 'Tomo', destination_id: 20 }),
    BadRequestException,
    'destino de outro hospital e recusado',
  );
  await assert.rejects(
    () => service.create(1, { patient: 'P', destination: 'Tomo', sector_id: 5 }),
    BadRequestException,
    'setor inexistente e recusado',
  );

  console.log('check-ins service tests passed');
}

run();

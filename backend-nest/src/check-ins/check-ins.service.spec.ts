import * as assert from 'node:assert/strict';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { CheckInStatus } from '@prisma/client';
import { CheckInsService } from './check-ins.service';

function makePrisma() {
  const now = new Date('2026-08-17T12:00:00.000Z');
  const checkIns: any[] = [];

  return {
    checkIn: {
      findMany: async () => [...checkIns].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()),
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
  };
}

async function run() {
  const service = new CheckInsService(makePrisma() as any);

  const created = await service.create({
    patient: 'Paciente Check',
    document: '123',
    destination: 'Tomografia',
    accessibility: 'Nao',
  });
  assert.equal(created.patient_name, 'Paciente Check');
  assert.equal(created.destination_label, 'Tomografia');
  assert.equal(created.status, CheckInStatus.WAITING);

  const listed = await service.list();
  assert.equal(listed.length, 1);

  const inRoute = await service.updateStatus(created.id, CheckInStatus.IN_ROUTE);
  assert.equal(inRoute.status, CheckInStatus.IN_ROUTE);

  const finished = await service.updateStatus(created.id, CheckInStatus.FINISHED);
  assert.equal(finished.status, CheckInStatus.FINISHED);

  await assert.rejects(() => service.updateStatus(created.id, CheckInStatus.WAITING), BadRequestException);
  await assert.rejects(() => service.get(999), NotFoundException);
  await assert.rejects(() => service.create({ patient: '', destination: '' }), BadRequestException);

  console.log('check-ins service tests passed');
}

run();

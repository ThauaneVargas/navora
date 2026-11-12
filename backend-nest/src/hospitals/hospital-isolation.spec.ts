import { strict as assert } from 'node:assert';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { resolveHospitalId } from './hospital-id.decorator';
import { HospitalMiddleware } from './hospital.middleware';
import { HospitalsService } from './hospitals.service';

const hospitals = [
  { id: 1, code: 'hmc', name: 'Hospital Marco Capute', active: true },
  { id: 2, code: 'hsl', name: 'Hospital Sao Lucas', active: true },
  { id: 3, code: 'fechado', name: 'Contrato encerrado', active: false },
];

function makeService(defaultCode?: string) {
  let lookups = 0;
  const prisma = {
    hospital: {
      findUnique: async ({ where }: any) => {
        lookups += 1;
        return hospitals.find((item) => item.code === where.code || item.id === where.id) ?? null;
      },
    },
  };
  const config = { get: (key: string) => (key === 'DEFAULT_HOSPITAL_CODE' ? defaultCode : undefined) };
  const service = new HospitalsService(prisma as any, config as any);
  return { service, lookups: () => lookups };
}

async function resolveHeader(service: HospitalsService, header?: string | string[]) {
  const request: any = { headers: header === undefined ? {} : { 'x-hospital': header } };
  let calledNext = false;
  await new HospitalMiddleware(service).use(request, {}, () => {
    calledNext = true;
  });
  assert.equal(calledNext, true, 'middleware nunca barra a requisicao');
  return request;
}

const staff = (hospitalId: number | null, role: UserRole = UserRole.RECEPTION) => ({
  id: 5,
  name: 'Equipe',
  email: 'e@x',
  phone: null,
  role,
  hospitalId,
  active: true,
});

async function run() {
  const { service, lookups } = makeService();

  // Header -> hospital. Sem header (APK antigo): hospital padrao (hmc).
  assert.equal((await resolveHeader(service, 'hsl')).hospital?.id, 2, 'header escolhe o hospital');
  assert.equal((await resolveHeader(service, ' HSL ')).hospital?.id, 2, 'aceita maiusculas e espacos');
  assert.equal((await resolveHeader(service)).hospital?.id, 1, 'sem header cai no padrao');
  assert.equal((await resolveHeader(service, 'inexistente')).hospital, null, 'codigo desconhecido');
  assert.equal((await resolveHeader(service, 'fechado')).hospital, null, 'hospital desligado nao resolve');
  assert.equal((await resolveHeader(service, "hmc'; drop table--")).hospital, null, 'codigo invalido nem consulta o banco');
  assert.equal((await resolveHeader(makeService('hsl').service)).hospital?.id, 2, 'padrao configuravel (DEFAULT_HOSPITAL_CODE)');

  const before = lookups();
  await resolveHeader(service, 'hsl');
  assert.equal(lookups(), before, 'cache evita ir ao banco em toda requisicao');

  // Regra central: equipe SEMPRE no proprio hospital, mesmo mandando outro header.
  const header2 = (await resolveHeader(service, 'hsl')).hospital;
  assert.equal(resolveHospitalId({ user: staff(1), hospital: header2 }), 1, 'recepcao do hospital 1 com header do 2 continua no 1');
  assert.equal(resolveHospitalId({ user: staff(1, UserRole.ADMIN), hospital: header2 }), 1, 'admin tambem');
  assert.throws(() => resolveHospitalId({ user: staff(null), hospital: header2 }), ForbiddenException, 'equipe sem hospital nao herda o header');

  // Paciente/visitante: usa o hospital onde esta (header), qualquer um.
  const patient = { ...staff(1, UserRole.PATIENT) };
  assert.equal(resolveHospitalId({ user: patient, hospital: header2 }), 2, 'paciente cadastrado no 1 usando o app no hospital 2');
  assert.equal(resolveHospitalId({ hospital: header2 }), 2, 'sem login: hospital do header');
  assert.throws(() => resolveHospitalId({ hospital: null }), NotFoundException, 'hospital desconhecido: 404');

  console.log('hospital isolation tests passed');
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

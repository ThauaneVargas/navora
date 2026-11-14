import { createParamDecorator, ExecutionContext, ForbiddenException, NotFoundException } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { HospitalRequest } from './hospital-request';

// Hospital da requisicao, a regra que separa um hospital do outro:
// - Equipe (RECEPTION/ADMIN): SEMPRE o hospital da propria conta. O header
//   X-Hospital e ignorado, entao trocar o header nao abre outro hospital.
// - Paciente/visitante/anonimo: o hospital do header X-Hospital (o app
//   instalado manda o do hospital onde a pessoa esta; sem header, o padrao).
export function resolveHospitalId(request: HospitalRequest): number {
  const user = request.user;
  if (user && user.role !== UserRole.PATIENT) {
    if (!user.hospitalId) throw new ForbiddenException('Conta sem hospital vinculado');
    return user.hospitalId;
  }
  if (request.hospital?.id) return request.hospital.id;
  throw new NotFoundException('Hospital nao encontrado');
}

export const HospitalId = createParamDecorator((_data: unknown, context: ExecutionContext): number =>
  resolveHospitalId(context.switchToHttp().getRequest<HospitalRequest>()),
);

// Para rota que funciona sem hospital (ex.: cadastro de paciente, que so
// guarda onde a pessoa se cadastrou): null em vez de erro.
export const OptionalHospitalId = createParamDecorator((_data: unknown, context: ExecutionContext): number | null => {
  try {
    return resolveHospitalId(context.switchToHttp().getRequest<HospitalRequest>());
  } catch {
    return null;
  }
});

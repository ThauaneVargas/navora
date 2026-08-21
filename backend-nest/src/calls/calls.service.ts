import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType, Priority } from '@prisma/client';
import { mapCallToApi } from '../common/api-mappers';
import { PrismaService } from '../database/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const calls = await this.prisma.callRequest.findMany({ orderBy: { createdAt: 'desc' } });
    return calls.map(mapCallToApi);
  }

  async create(payload: CreateCallDto, forcedType?: CallType, forcedPriority?: Priority) {
    const callType = this.normalizeType(forcedType ?? payload.call_type ?? CallType.HELP);
    const priority = forcedPriority ?? payload.priority ?? Priority.MEDIUM;
    const userName = payload.user_name || payload.patient_name || 'Paciente Navora';
    const reason = payload.reason || payload.message || callType;
    const call = await this.prisma.callRequest.create({
      data: {
        userType: payload.user_type ?? 'patient',
        userName,
        area: payload.area ?? 'private',
        areaName: payload.area_name ?? 'HMC Private',
        patientName: userName,
        callType,
        reason,
        location: payload.location ?? 'Recepcao',
        sector: payload.sector ?? 'Entrada Principal',
        beaconCode: payload.beacon_code ?? null,
        message: payload.message ?? reason,
        status: CallStatus.PENDING,
        priority,
      },
    });
    return mapCallToApi(call);
  }

  createHelp(payload: CreateCallDto) {
    return this.create(payload, CallType.HELP, Priority.MEDIUM);
  }

  createSos(payload: CreateCallDto) {
    return this.create(payload, CallType.SOS, Priority.CRITICAL);
  }

  async updateStatus(callId: number, status: CallStatus) {
    const call = await this.prisma.callRequest.findUnique({ where: { id: callId } });
    if (!call) {
      throw new NotFoundException('Chamado nao encontrado');
    }
    this.ensureValidTransition(call.status, status);

    const updated = await this.prisma.callRequest.update({
      where: { id: callId },
      data: { status },
    });
    return { id: updated.id, status: updated.status, message: 'Status atualizado com sucesso' };
  }

  private ensureValidTransition(current: CallStatus, next: CallStatus) {
    if (current === next) return;

    const transitions: Record<CallStatus, CallStatus[]> = {
      [CallStatus.PENDING]: [
        CallStatus.ACCEPTED,
        CallStatus.TEAM_DISPATCHED,
        CallStatus.IN_PROGRESS,
        CallStatus.CLOSED,
        CallStatus.CANCELED,
      ],
      [CallStatus.ACCEPTED]: [
        CallStatus.TEAM_DISPATCHED,
        CallStatus.IN_PROGRESS,
        CallStatus.CLOSED,
        CallStatus.CANCELED,
      ],
      [CallStatus.TEAM_DISPATCHED]: [CallStatus.IN_PROGRESS, CallStatus.CLOSED, CallStatus.CANCELED],
      [CallStatus.IN_PROGRESS]: [CallStatus.CLOSED, CallStatus.CANCELED],
      [CallStatus.CLOSED]: [],
      [CallStatus.CANCELED]: [],
    };

    if (!transitions[current].includes(next)) {
      throw new BadRequestException(`Transicao de status invalida: ${current} -> ${next}`);
    }
  }

  private normalizeType(callType: CallType) {
    if (callType === CallType.HELP_REQUEST) return CallType.HELP;
    if (callType === CallType.LOST_USER) return CallType.LOST;
    return callType;
  }
}

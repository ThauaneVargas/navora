import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CallStatus, CallType, Priority } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { randomBytes } from 'crypto';
import { mapCallToApi } from '../common/api-mappers';
import { hashSecretToken, secretTokenMatches } from '../common/secret-token';
import { PrismaService } from '../database/prisma.service';
import { CreateCallDto } from './dto/create-call.dto';

@Injectable()
export class CallsService {
  constructor(private readonly prisma: PrismaService) {}

  // `updatedSince`: so os chamados criados/alterados depois dessa data (o painel
  // consulta a cada poucos segundos para o SOS aparecer quase na hora).
  async list(updatedSince?: Date) {
    const calls = await this.prisma.callRequest.findMany({
      where: updatedSince ? { updatedAt: { gt: updatedSince } } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return calls.map(mapCallToApi);
  }

  async create(payload: CreateCallDto, user: AuthenticatedUser, forcedType?: CallType, forcedPriority?: Priority) {
    const callType = this.normalizeType(forcedType ?? payload.call_type ?? CallType.HELP);
    const priority = forcedPriority ?? payload.priority ?? Priority.MEDIUM;
    const userName = payload.user_name || payload.patient_name || user.name || 'Paciente Navora';
    const reason = payload.reason || payload.message || callType;
    // Codigo secreto para o celular acompanhar o andamento. Sai so na
    // resposta; o banco guarda o hash.
    const accessToken = randomBytes(24).toString('hex');
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
        emergencyContact: payload.emergency_contact ?? null,
        status: CallStatus.PENDING,
        priority,
        userId: user.id,
        callerPhone: payload.caller_phone?.trim() || user.phone || null,
        needs: [...new Set(payload.needs ?? [])],
        accessTokenHash: hashSecretToken(accessToken),
      },
    });
    return { ...mapCallToApi(call), access_token: accessToken };
  }

  // Andamento para o celular de quem pediu: so o necessario, sem dados pessoais.
  async status(callId: number, accessToken?: string) {
    return this.publicStatus(await this.findOwnCall(callId, accessToken));
  }

  private async findOwnCall(callId: number, accessToken?: string) {
    const call = await this.prisma.callRequest.findUnique({ where: { id: callId } });
    // Mesmo erro para "nao existe" e "codigo errado": nao revela quais ids existem.
    if (!call || !secretTokenMatches(call.accessTokenHash, accessToken)) {
      throw new NotFoundException('Chamado nao encontrado');
    }
    return call;
  }

  private publicStatus(call: { id: number; status: CallStatus; callType: CallType; updatedAt: Date }) {
    return {
      id: call.id,
      status: call.status,
      call_type: call.callType,
      updated_at: call.updatedAt.toISOString(),
    };
  }

  createHelp(payload: CreateCallDto, user: AuthenticatedUser) {
    return this.create(payload, user, CallType.HELP, Priority.MEDIUM);
  }

  createSos(payload: CreateCallDto, user: AuthenticatedUser) {
    return this.create(payload, user, CallType.SOS, Priority.CRITICAL);
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

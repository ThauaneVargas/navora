import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CheckIn, CheckInStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const checkIns = await this.prisma.checkIn.findMany({ orderBy: { createdAt: 'desc' } });
    return checkIns.map(this.toApi);
  }

  async get(checkInId: number) {
    return this.toApi(await this.find(checkInId));
  }

  async create(payload: CreateCheckInDto) {
    const patientName = payload.patient_name || payload.patient;
    const destinationLabel = payload.destination_label || payload.destination;

    if (!patientName?.trim() || !destinationLabel?.trim()) {
      throw new BadRequestException('Nome do paciente e destino sao obrigatorios');
    }

    const checkIn = await this.prisma.checkIn.create({
      data: {
        patientName: patientName.trim(),
        document: payload.document?.trim() || null,
        destinationLabel: destinationLabel.trim(),
        accessibility: payload.accessibility?.trim() || 'Nao',
        observations: payload.observations?.trim() || null,
        userId: payload.user_id,
        destinationId: payload.destination_id,
        sectorId: payload.sector_id,
        visitorAccessRequestId: payload.visitor_access_request_id,
      },
    });
    return this.toApi(checkIn);
  }

  async updateStatus(checkInId: number, status: CheckInStatus) {
    const checkIn = await this.find(checkInId);
    this.ensureValidTransition(checkIn.status, status);

    const updated = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: { status },
    });
    return this.toApi(updated);
  }

  private async find(checkInId: number) {
    const checkIn = await this.prisma.checkIn.findUnique({ where: { id: checkInId } });
    if (!checkIn) {
      throw new NotFoundException('Check-in nao encontrado');
    }
    return checkIn;
  }

  private ensureValidTransition(current: CheckInStatus, next: CheckInStatus) {
    if (current === next) return;

    const transitions: Record<CheckInStatus, CheckInStatus[]> = {
      [CheckInStatus.WAITING]: [
        CheckInStatus.IN_ROUTE,
        CheckInStatus.IN_SERVICE,
        CheckInStatus.FINISHED,
        CheckInStatus.CANCELED,
      ],
      [CheckInStatus.IN_ROUTE]: [CheckInStatus.IN_SERVICE, CheckInStatus.FINISHED, CheckInStatus.CANCELED],
      [CheckInStatus.IN_SERVICE]: [CheckInStatus.FINISHED, CheckInStatus.CANCELED],
      [CheckInStatus.FINISHED]: [],
      [CheckInStatus.CANCELED]: [],
    };

    if (!transitions[current].includes(next)) {
      throw new BadRequestException(`Transicao de check-in invalida: ${current} -> ${next}`);
    }
  }

  private toApi(checkIn: CheckIn) {
    return {
      id: checkIn.id,
      patient_name: checkIn.patientName,
      document: checkIn.document,
      destination_label: checkIn.destinationLabel,
      accessibility: checkIn.accessibility,
      observations: checkIn.observations,
      status: checkIn.status,
      user_id: checkIn.userId,
      destination_id: checkIn.destinationId,
      sector_id: checkIn.sectorId,
      visitor_access_request_id: checkIn.visitorAccessRequestId,
      created_at: checkIn.createdAt.toISOString(),
      updated_at: checkIn.updatedAt.toISOString(),
    };
  }
}

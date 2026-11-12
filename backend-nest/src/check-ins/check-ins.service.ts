import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { CheckIn, CheckInStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';

@Injectable()
export class CheckInsService {
  constructor(private readonly prisma: PrismaService) {}

  async list(hospitalId: number) {
    const checkIns = await this.prisma.checkIn.findMany({ where: { hospitalId }, orderBy: { createdAt: 'desc' } });
    return checkIns.map(this.toApi);
  }

  async get(hospitalId: number, checkInId: number) {
    return this.toApi(await this.find(hospitalId, checkInId));
  }

  async create(hospitalId: number, payload: CreateCheckInDto) {
    const patientName = payload.patient_name || payload.patient;
    const destinationLabel = payload.destination_label || payload.destination;

    if (!patientName?.trim() || !destinationLabel?.trim()) {
      throw new BadRequestException('Nome do paciente e destino sao obrigatorios');
    }
    await this.ensureSameHospital(hospitalId, payload);

    const checkIn = await this.prisma.checkIn.create({
      data: {
        hospitalId,
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

  async updateStatus(hospitalId: number, checkInId: number, status: CheckInStatus) {
    const checkIn = await this.find(hospitalId, checkInId);
    this.ensureValidTransition(checkIn.status, status);

    const updated = await this.prisma.checkIn.update({
      where: { id: checkInId },
      data: { status },
    });
    return this.toApi(updated);
  }

  private async find(hospitalId: number, checkInId: number) {
    const checkIn = await this.prisma.checkIn.findUnique({ where: { id: checkInId } });
    // De outro hospital: mesmo 404 de "nao existe".
    if (!checkIn || checkIn.hospitalId !== hospitalId) {
      throw new NotFoundException('Check-in nao encontrado');
    }
    return checkIn;
  }

  // Destino, setor e pedido de visita informados pelo painel precisam ser do
  // mesmo hospital: senao bastaria mandar o id de outro hospital no corpo.
  private async ensureSameHospital(hospitalId: number, payload: CreateCheckInDto) {
    const checks: Array<Promise<{ hospitalId: number } | null>> = [];
    if (payload.destination_id) {
      checks.push(this.prisma.destination.findUnique({ where: { id: payload.destination_id }, select: { hospitalId: true } }));
    }
    if (payload.sector_id) {
      checks.push(this.prisma.sector.findUnique({ where: { id: payload.sector_id }, select: { hospitalId: true } }));
    }
    if (payload.visitor_access_request_id) {
      checks.push(
        this.prisma.visitorAccessRequest.findUnique({
          where: { id: payload.visitor_access_request_id },
          select: { hospitalId: true },
        }),
      );
    }
    const found = await Promise.all(checks);
    if (found.some((record) => !record || record.hospitalId !== hospitalId)) {
      throw new BadRequestException('Destino, setor ou visita nao pertence a este hospital');
    }
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

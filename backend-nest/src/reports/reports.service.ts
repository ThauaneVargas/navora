import { BadRequestException, Injectable } from '@nestjs/common';
import { CallStatus, CallType, CheckInStatus, VisitorAccessStatus } from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AdminReportDto } from './dto/admin-report.dto';

@Injectable()
export class ReportsService {
  constructor(private readonly prisma: PrismaService) {}

  async adminReport(hospitalId: number, payload: AdminReportDto = {}) {
    const range = this.dateRange(payload);
    const h = { hospitalId };
    const createdAt = range ? { hospitalId, createdAt: range } : h;

    const [
      callsTotal,
      sosCalls,
      helpCalls,
      callsPending,
      callsClosed,
      visitorPending,
      visitorApproved,
      visitorDenied,
      checkInsTotal,
      checkInsWaiting,
      checkInsFinished,
      beaconsTotal,
      beaconsOnline,
      sectorsTotal,
      destinationsTotal,
    ] = await Promise.all([
      this.prisma.callRequest.count({ where: createdAt }),
      this.prisma.callRequest.count({ where: { ...createdAt, callType: CallType.SOS } }),
      this.prisma.callRequest.count({ where: { ...createdAt, callType: CallType.HELP } }),
      this.prisma.callRequest.count({ where: { ...createdAt, status: CallStatus.PENDING } }),
      this.prisma.callRequest.count({ where: { ...createdAt, status: CallStatus.CLOSED } }),
      this.prisma.visitorAccessRequest.count({ where: { ...createdAt, status: VisitorAccessStatus.PENDING } }),
      this.prisma.visitorAccessRequest.count({ where: { ...createdAt, status: VisitorAccessStatus.APPROVED } }),
      this.prisma.visitorAccessRequest.count({ where: { ...createdAt, status: VisitorAccessStatus.DENIED } }),
      this.prisma.checkIn.count({ where: createdAt }),
      this.prisma.checkIn.count({ where: { ...createdAt, status: CheckInStatus.WAITING } }),
      this.prisma.checkIn.count({ where: { ...createdAt, status: CheckInStatus.FINISHED } }),
      this.prisma.beacon.count({ where: h }),
      this.prisma.beacon.count({ where: { ...h, status: 'Online' } }),
      this.prisma.sector.count({ where: h }),
      this.prisma.destination.count({ where: h }),
    ]);

    return {
      source: 'api',
      period: payload.period || 'custom',
      from: range?.gte?.toISOString() ?? null,
      to: range?.lte?.toISOString() ?? null,
      callsTotal,
      sosCalls,
      helpCalls,
      callsPending,
      callsClosed,
      visitorPending,
      visitorApproved,
      visitorDenied,
      checkInsTotal,
      checkInsWaiting,
      checkInsFinished,
      beaconsTotal,
      beaconsOnline,
      beaconsOffline: Math.max(beaconsTotal - beaconsOnline, 0),
      sectorsTotal,
      destinationsTotal,
    };
  }

  private dateRange(payload: AdminReportDto) {
    const range: { gte?: Date; lte?: Date } = {};
    if (payload.from) range.gte = this.parseDate(payload.from, 'from');
    if (payload.to) range.lte = this.parseDate(payload.to, 'to');
    if (range.gte && range.lte && range.gte.getTime() > range.lte.getTime()) {
      throw new BadRequestException('Intervalo de relatorio invalido');
    }
    return range.gte || range.lte ? range : null;
  }

  private parseDate(value: string, field: string) {
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) {
      throw new BadRequestException(`Data invalida em ${field}`);
    }
    return date;
  }
}

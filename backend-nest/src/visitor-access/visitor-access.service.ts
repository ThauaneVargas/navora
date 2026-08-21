import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { VisitorAccessRequest, VisitorAccessStatus } from '@prisma/client';
import { mapVisitorAccessToApi } from '../common/api-mappers';
import { PrismaService } from '../database/prisma.service';
import { AuthorizeVisitorAccessDto } from './dto/authorize-visitor-access.dto';
import { CreateVisitorAccessDto } from './dto/create-visitor-access.dto';
import { DenyVisitorAccessDto } from './dto/deny-visitor-access.dto';

@Injectable()
export class VisitorAccessService {
  constructor(private readonly prisma: PrismaService) {}

  async list(status?: VisitorAccessStatus) {
    const normalized = status ? this.normalizeStatus(status) : undefined;
    const requests = await this.prisma.visitorAccessRequest.findMany({
      where: normalized ? { status: normalized } : undefined,
      orderBy: { createdAt: 'desc' },
    });
    return requests.map(mapVisitorAccessToApi);
  }

  async get(requestId: number) {
    return mapVisitorAccessToApi(await this.find(requestId));
  }

  async create(payload: CreateVisitorAccessDto) {
    const area = this.normalizeArea(payload);
    const entrance = payload.entrance || payload.entry || this.defaultEntrance(area.areaId);
    const entry = payload.entry || entrance;
    const destination = await this.findDestination(payload.requested_destination);
    const request = await this.prisma.visitorAccessRequest.create({
      data: {
        visitorName: payload.visitor_name ?? 'Visitante Navora',
        areaId: area.areaId,
        area: area.areaName,
        areaName: area.areaName,
        entrance,
        entry,
        currentLocation: payload.current_location ?? 'Entrada',
        currentBeacon: payload.current_beacon || payload.beacon || null,
        requestedDestination: payload.requested_destination,
        reason: payload.reason ?? 'Visita',
        accessibility: payload.accessibility ?? 'Nao',
        status: this.normalizeStatus(payload.status ?? VisitorAccessStatus.PENDING),
        beacon: payload.beacon || payload.current_beacon || null,
        destinationId: destination?.id,
      },
    });
    return mapVisitorAccessToApi(request);
  }

  async approve(requestId: number, payload: AuthorizeVisitorAccessDto) {
    const request = await this.find(requestId);
    const minutes = this.resolvePermissionMinutes(payload);
    const route = payload.authorizedRoute ?? payload.authorized_route ?? payload.allowed_route ?? this.defaultRoute(request);
    const authorizedAt = new Date();
    const updated = await this.prisma.visitorAccessRequest.update({
      where: { id: requestId },
      data: {
        status: VisitorAccessStatus.APPROVED,
        permissionMinutes: minutes,
        authorizedAt,
        expiresAt: minutes === null ? null : new Date(authorizedAt.getTime() + minutes * 60_000),
        finishedAt: null,
        authorizedRoute: route,
        allowedRoute: route,
        allowedTime: this.formatAllowedTime(minutes, payload.release_time),
        releaseType: payload.release_type,
        deniedReason: null,
        denialReason: null,
      },
    });
    return mapVisitorAccessToApi(updated);
  }

  async deny(requestId: number, payload: DenyVisitorAccessDto) {
    await this.find(requestId);
    const reason = payload.deniedReason || payload.denial_reason;
    const updated = await this.prisma.visitorAccessRequest.update({
      where: { id: requestId },
      data: {
        status: VisitorAccessStatus.DENIED,
        deniedReason: reason,
        denialReason: reason,
        authorizedRoute: null,
        allowedRoute: null,
        allowedTime: null,
        permissionMinutes: null,
        releaseType: null,
      },
    });
    return mapVisitorAccessToApi(updated);
  }

  async updateStatus(requestId: number, status: VisitorAccessStatus) {
    const request = await this.find(requestId);
    const normalizedStatus = this.normalizeStatus(status);
    this.ensureValidTransition(request.status, normalizedStatus);
    const updated = await this.prisma.visitorAccessRequest.update({
      where: { id: requestId },
      data: {
        status: normalizedStatus,
        finishedAt: normalizedStatus === VisitorAccessStatus.FINISHED ? new Date() : undefined,
        expiresAt: normalizedStatus === VisitorAccessStatus.EXPIRED ? new Date() : undefined,
      },
    });
    return mapVisitorAccessToApi(updated);
  }

  private ensureValidTransition(current: VisitorAccessStatus, next: VisitorAccessStatus) {
    if (current === next) return;

    const transitions: Record<VisitorAccessStatus, VisitorAccessStatus[]> = {
      [VisitorAccessStatus.PENDING]: [
        VisitorAccessStatus.APPROVED,
        VisitorAccessStatus.DENIED,
        VisitorAccessStatus.CANCELED,
        VisitorAccessStatus.EXPIRED,
      ],
      [VisitorAccessStatus.WAITING_AUTHORIZATION]: [
        VisitorAccessStatus.APPROVED,
        VisitorAccessStatus.DENIED,
        VisitorAccessStatus.CANCELED,
        VisitorAccessStatus.EXPIRED,
      ],
      [VisitorAccessStatus.APPROVED]: [
        VisitorAccessStatus.IN_ROUTE,
        VisitorAccessStatus.ARRIVED,
        VisitorAccessStatus.OFF_ROUTE,
        VisitorAccessStatus.FINISHED,
        VisitorAccessStatus.CANCELED,
        VisitorAccessStatus.EXPIRED,
      ],
      [VisitorAccessStatus.AUTHORIZED]: [
        VisitorAccessStatus.IN_ROUTE,
        VisitorAccessStatus.ARRIVED,
        VisitorAccessStatus.OFF_ROUTE,
        VisitorAccessStatus.FINISHED,
        VisitorAccessStatus.CANCELED,
        VisitorAccessStatus.EXPIRED,
      ],
      [VisitorAccessStatus.IN_ROUTE]: [
        VisitorAccessStatus.ARRIVED,
        VisitorAccessStatus.OFF_ROUTE,
        VisitorAccessStatus.FINISHED,
        VisitorAccessStatus.CANCELED,
        VisitorAccessStatus.EXPIRED,
      ],
      [VisitorAccessStatus.ARRIVED]: [VisitorAccessStatus.FINISHED],
      [VisitorAccessStatus.OFF_ROUTE]: [
        VisitorAccessStatus.IN_ROUTE,
        VisitorAccessStatus.FINISHED,
        VisitorAccessStatus.CANCELED,
      ],
      [VisitorAccessStatus.DENIED]: [],
      [VisitorAccessStatus.CANCELED]: [],
      [VisitorAccessStatus.EXPIRED]: [],
      [VisitorAccessStatus.FINISHED]: [],
    };

    if (!transitions[current].includes(next)) {
      throw new BadRequestException(`Transicao de visitor-access invalida: ${current} -> ${next}`);
    }
  }

  private async find(requestId: number) {
    const request = await this.prisma.visitorAccessRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      throw new NotFoundException('Solicitacao de visitante nao encontrada');
    }
    return request;
  }

  private defaultRoute(request: VisitorAccessRequest) {
    const reception = request.areaId === 'private' ? 'Recepcao Private' : 'Recepcao Hospital Marco Capute';
    return `${reception} -> rota autorizada -> ${request.requestedDestination}`;
  }

  private normalizeStatus(status: VisitorAccessStatus) {
    if (status === VisitorAccessStatus.WAITING_AUTHORIZATION) return VisitorAccessStatus.PENDING;
    if (status === VisitorAccessStatus.AUTHORIZED) return VisitorAccessStatus.APPROVED;
    return status;
  }

  private normalizeArea(payload: CreateVisitorAccessDto) {
    const knownAreaIds = ['private', 'sus', 'shared'];
    const legacyArea = payload.area && knownAreaIds.includes(payload.area) ? payload.area : undefined;
    const areaId = payload.area_id || legacyArea || 'private';
    const legacyAreaName = payload.area && !knownAreaIds.includes(payload.area) ? payload.area : undefined;
    const areaName = payload.area_name || legacyAreaName || this.defaultAreaName(areaId);

    return { areaId, areaName };
  }

  private defaultAreaName(areaId: string) {
    if (areaId === 'sus') return 'Hospital Marco Capute';
    if (areaId === 'shared') return 'Compartilhado';
    return 'HMC Private';
  }

  private defaultEntrance(areaId: string) {
    return areaId === 'sus' ? 'Entrada pela frente' : 'Entrada pelos fundos';
  }

  private findDestination(requestedDestination: string) {
    return this.prisma.destination.findFirst({
      where: {
        OR: [{ code: requestedDestination }, { name: requestedDestination }],
      },
      select: { id: true },
    });
  }

  private resolvePermissionMinutes(payload: AuthorizeVisitorAccessDto) {
    if (payload.permissionMinutes !== undefined) return payload.permissionMinutes;
    if (payload.permission_minutes !== undefined) return payload.permission_minutes;

    const releaseTime = payload.release_time?.toLowerCase().trim();
    if (!releaseTime) return 30;
    if (releaseTime.includes('hora')) return (Number.parseInt(releaseTime, 10) || 1) * 60;
    if (releaseTime.includes('finalizar')) return null;

    return Number.parseInt(releaseTime, 10) || 30;
  }

  private formatAllowedTime(minutes: number | null, releaseTime?: string) {
    if (minutes === null) return releaseTime || 'Ate finalizar visita';
    if (minutes === 60 && releaseTime?.toLowerCase().includes('hora')) return releaseTime;
    return `${minutes} minutos`;
  }
}

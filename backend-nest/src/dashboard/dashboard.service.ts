import { Injectable } from '@nestjs/common';
import { CallStatus, CallType, UserRole, VisitorAccessStatus } from '@prisma/client';
import { beaconHealth } from '../common/beacon-health';
import { PrismaService } from '../database/prisma.service';

type CountGroup<K extends string> = Record<K, string> & { _count: { _all: number } };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  // Tudo contado so dentro do hospital da equipe.
  async summary(hospitalId: number) {
    const h = { hospitalId };
    const [
      totalCalls,
      openCalls,
      activeSOS,
      activeHelp,
      pendingVisitorRequests,
      approvedVisitors,
      deniedVisitors,
      closedCalls,
      beacons,
      sectorsTotal,
      destinationsTotal,
      patientUsers,
      staffUsers,
      callStatusGroups,
      callTypeGroups,
      visitorStatusGroups,
    ] = await Promise.all([
      this.prisma.callRequest.count({ where: h }),
      this.prisma.callRequest.count({ where: { ...h, status: { notIn: [CallStatus.CLOSED, CallStatus.CANCELED] } } }),
      this.prisma.callRequest.count({
        where: { ...h, callType: CallType.SOS, status: { not: CallStatus.CLOSED } },
      }),
      this.prisma.callRequest.count({
        where: { ...h, callType: CallType.HELP, status: { notIn: [CallStatus.CLOSED, CallStatus.CANCELED] } },
      }),
      this.prisma.visitorAccessRequest.count({ where: { ...h, status: VisitorAccessStatus.PENDING } }),
      this.prisma.visitorAccessRequest.count({ where: { ...h, status: VisitorAccessStatus.APPROVED } }),
      this.prisma.visitorAccessRequest.count({ where: { ...h, status: VisitorAccessStatus.DENIED } }),
      this.prisma.callRequest.count({ where: { ...h, status: CallStatus.CLOSED } }),
      this.prisma.beacon.findMany({
        where: h,
        select: { status: true, battery: true, lastSignalAt: true, hardwareModel: true, ibeaconUuid: true },
      }),
      this.prisma.sector.count({ where: h }),
      this.prisma.destination.count({ where: h }),
      // Paciente: os que se cadastraram neste hospital (a conta vale em todos).
      this.prisma.user.count({ where: { ...h, role: UserRole.PATIENT } }),
      this.prisma.user.count({ where: { ...h, role: { in: [UserRole.ADMIN, UserRole.RECEPTION] } } }),
      this.prisma.callRequest.groupBy({ by: ['status'], where: h, _count: { _all: true } }),
      this.prisma.callRequest.groupBy({ by: ['callType'], where: h, _count: { _all: true } }),
      this.prisma.visitorAccessRequest.groupBy({ by: ['status'], where: h, _count: { _all: true } }),
    ]);

    const now = new Date();
    const beaconStatuses = beacons.map((beacon) => beaconHealth(beacon, now).status);
    const beaconsTotal = beaconStatuses.length;
    const beaconsOnline = beaconStatuses.filter((status) => status === 'Online').length;
    const beaconStatusCounts = beaconStatuses.reduce<Record<string, number>>((counts, status) => {
      counts[status] = (counts[status] || 0) + 1;
      return counts;
    }, {});

    return {
      source: 'api',
      totalCalls,
      openCalls,
      activeSOS,
      activeHelp,
      pendingVisitorRequests,
      approvedVisitors,
      deniedVisitors,
      closedCalls,
      beaconsOnline,
      beaconsTotal,
      beaconsOffline: Math.max(beaconsTotal - beaconsOnline, 0),
      sectorsTotal,
      destinationsTotal,
      patientUsers,
      staffUsers,
      callStatusCounts: this.toCountMap(callStatusGroups, 'status'),
      callTypeCounts: this.toCountMap(callTypeGroups, 'callType'),
      visitorStatusCounts: this.toCountMap(visitorStatusGroups, 'status'),
      beaconStatusCounts,
      simulated: {
        peopleInHospital: true,
        flow: true,
        waitingTime: true,
      },
      privateUsers: patientUsers,
      susUsers: 0,
    };
  }

  private toCountMap<K extends string>(groups: CountGroup<K>[], key: K) {
    return Object.fromEntries(groups.map((group) => [String(group[key]), group._count._all]));
  }
}

import { Injectable } from '@nestjs/common';
import { CallStatus, CallType, UserRole, VisitorAccessStatus } from '@prisma/client';
import { beaconHealth } from '../common/beacon-health';
import { PrismaService } from '../database/prisma.service';

type CountGroup<K extends string> = Record<K, string> & { _count: { _all: number } };

@Injectable()
export class DashboardService {
  constructor(private readonly prisma: PrismaService) {}

  async summary() {
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
      this.prisma.callRequest.count(),
      this.prisma.callRequest.count({ where: { status: { notIn: [CallStatus.CLOSED, CallStatus.CANCELED] } } }),
      this.prisma.callRequest.count({
        where: { callType: CallType.SOS, status: { not: CallStatus.CLOSED } },
      }),
      this.prisma.callRequest.count({
        where: { callType: CallType.HELP, status: { notIn: [CallStatus.CLOSED, CallStatus.CANCELED] } },
      }),
      this.prisma.visitorAccessRequest.count({ where: { status: VisitorAccessStatus.PENDING } }),
      this.prisma.visitorAccessRequest.count({ where: { status: VisitorAccessStatus.APPROVED } }),
      this.prisma.visitorAccessRequest.count({ where: { status: VisitorAccessStatus.DENIED } }),
      this.prisma.callRequest.count({ where: { status: CallStatus.CLOSED } }),
      this.prisma.beacon.findMany({
        select: { status: true, battery: true, lastSignalAt: true, hardwareModel: true, ibeaconUuid: true },
      }),
      this.prisma.sector.count(),
      this.prisma.destination.count(),
      this.prisma.user.count({ where: { role: UserRole.PATIENT } }),
      this.prisma.user.count({ where: { role: { in: [UserRole.ADMIN, UserRole.RECEPTION] } } }),
      this.prisma.callRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.callRequest.groupBy({ by: ['callType'], _count: { _all: true } }),
      this.prisma.visitorAccessRequest.groupBy({ by: ['status'], _count: { _all: true } }),
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

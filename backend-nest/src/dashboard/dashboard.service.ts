import { Injectable } from '@nestjs/common';
import { CallStatus, CallType, UserRole, VisitorAccessStatus } from '@prisma/client';
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
      beaconsOnline,
      beaconsTotal,
      sectorsTotal,
      destinationsTotal,
      patientUsers,
      staffUsers,
      callStatusGroups,
      callTypeGroups,
      visitorStatusGroups,
      beaconStatusGroups,
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
      this.prisma.beacon.count({ where: { status: 'Online' } }),
      this.prisma.beacon.count(),
      this.prisma.sector.count(),
      this.prisma.destination.count(),
      this.prisma.user.count({ where: { role: UserRole.PATIENT } }),
      this.prisma.user.count({ where: { role: { in: [UserRole.ADMIN, UserRole.RECEPTION] } } }),
      this.prisma.callRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.callRequest.groupBy({ by: ['callType'], _count: { _all: true } }),
      this.prisma.visitorAccessRequest.groupBy({ by: ['status'], _count: { _all: true } }),
      this.prisma.beacon.groupBy({ by: ['status'], _count: { _all: true } }),
    ]);

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
      beaconStatusCounts: this.toCountMap(beaconStatusGroups, 'status'),
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

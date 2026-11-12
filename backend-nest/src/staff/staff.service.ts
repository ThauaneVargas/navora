import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UserRole, UserStatusAction } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { ChangeStaffStatusDto } from './dto/change-staff-status.dto';

/**
 * Regra de seguranca do Web Admin:
 * funcionarios (RECEPTION/ADMIN) nunca sao excluidos, apenas desativados.
 * A desativacao bloqueia o login e invalida tokens ja emitidos (o JwtAuthGuard
 * confere `active` a cada requisicao), mas preserva todo o historico do que o
 * funcionario fez no sistema. O banco reforca a regra com um trigger.
 */
export const STAFF_ROLES: UserRole[] = [UserRole.RECEPTION, UserRole.ADMIN];

const staffSelect = {
  id: true,
  name: true,
  email: true,
  phone: true,
  role: true,
  active: true,
  deactivatedAt: true,
  createdAt: true,
  staffProfile: { select: { jobTitle: true, sector: { select: { name: true } } } },
  deactivatedBy: { select: { id: true, name: true } },
} as const;

type StaffRecord = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  deactivatedAt: Date | null;
  createdAt: Date;
  staffProfile?: { jobTitle: string | null; sector?: { name: string } | null } | null;
  deactivatedBy?: { id: number; name: string } | null;
};

@Injectable()
export class StaffService {
  constructor(private readonly prisma: PrismaService) {}

  // So a equipe do mesmo hospital do admin.
  async list(hospitalId: number) {
    const users = await this.prisma.user.findMany({
      where: { hospitalId, role: { in: STAFF_ROLES } },
      select: staffSelect,
      orderBy: [{ active: 'desc' }, { name: 'asc' }],
    });
    return users.map((user: StaffRecord) => this.toApi(user));
  }

  async audit(hospitalId: number, userId: number) {
    const staff = await this.findStaff(hospitalId, userId);
    const [statusChanges, visitorDecisions, actions] = await Promise.all([
      this.prisma.userStatusChange.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        include: { performedBy: { select: { id: true, name: true } } },
      }),
      this.prisma.visitorAccessRequest.findMany({
        where: { decidedById: userId },
        orderBy: { decidedAt: 'desc' },
        take: 100,
        select: {
          id: true,
          visitorName: true,
          requestedDestination: true,
          areaName: true,
          status: true,
          decidedAt: true,
          deniedReason: true,
        },
      }),
      // Registro geral do que o funcionario fez no painel (audit_logs).
      this.prisma.auditLog.findMany({
        where: { actorId: userId, hospitalId },
        orderBy: { createdAt: 'desc' },
        take: 100,
      }),
    ]);

    return {
      staff: this.toApi(staff),
      status_changes: statusChanges.map((change) => ({
        id: change.id,
        action: change.action,
        reason: change.reason,
        performed_by: change.performedBy,
        created_at: change.createdAt.toISOString(),
      })),
      visitor_decisions: visitorDecisions.map((decision) => ({
        id: decision.id,
        visitor_name: decision.visitorName,
        requested_destination: decision.requestedDestination,
        area_name: decision.areaName,
        status: decision.status,
        denied_reason: decision.deniedReason,
        decided_at: decision.decidedAt?.toISOString() ?? null,
      })),
      actions: actions.map((entry) => ({
        id: entry.id,
        action: entry.action,
        entity: entry.entity,
        entity_id: entry.entityId,
        details: entry.details,
        created_at: entry.createdAt.toISOString(),
      })),
    };
  }

  async deactivate(hospitalId: number, userId: number, actor: AuthenticatedUser, payload: ChangeStaffStatusDto = {}) {
    const staff = await this.findStaff(hospitalId, userId);

    if (staff.id === actor.id) {
      throw new BadRequestException('Voce nao pode desativar o seu proprio acesso');
    }
    if (!staff.active) {
      throw new ConflictException('Este funcionario ja esta desativado');
    }
    if (staff.role === UserRole.ADMIN) {
      // "Ultimo admin" e por hospital: cada hospital precisa de pelo menos um.
      const activeAdmins = await this.prisma.user.count({ where: { hospitalId, role: UserRole.ADMIN, active: true } });
      if (activeAdmins <= 1) {
        throw new BadRequestException('Nao e possivel desativar o ultimo administrador ativo');
      }
    }

    return this.changeStatus(staff.id, actor.id, UserStatusAction.DEACTIVATED, payload.reason);
  }

  async reactivate(hospitalId: number, userId: number, actor: AuthenticatedUser, payload: ChangeStaffStatusDto = {}) {
    const staff = await this.findStaff(hospitalId, userId);

    if (staff.active) {
      throw new ConflictException('Este funcionario ja esta ativo');
    }

    return this.changeStatus(staff.id, actor.id, UserStatusAction.REACTIVATED, payload.reason);
  }

  private async changeStatus(userId: number, actorId: number, action: UserStatusAction, reason?: string) {
    const deactivating = action === UserStatusAction.DEACTIVATED;
    const updated = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.update({
        where: { id: userId },
        data: {
          active: !deactivating,
          deactivatedAt: deactivating ? new Date() : null,
          deactivatedById: deactivating ? actorId : null,
        },
        select: staffSelect,
      });
      await tx.userStatusChange.create({
        data: { userId, action, performedById: actorId, reason: reason?.trim() || null },
      });
      return user;
    });
    return this.toApi(updated as StaffRecord);
  }

  // Funcionario de outro hospital: mesmo 404 de "nao existe".
  private async findStaff(hospitalId: number, userId: number): Promise<StaffRecord> {
    const user = await this.prisma.user.findUnique({ where: { id: userId }, select: { ...staffSelect, hospitalId: true } });
    if (!user || !STAFF_ROLES.includes(user.role) || user.hospitalId !== hospitalId) {
      throw new NotFoundException('Funcionario nao encontrado');
    }
    return user as StaffRecord;
  }

  private toApi(user: StaffRecord) {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      job_title: user.staffProfile?.jobTitle ?? null,
      sector_name: user.staffProfile?.sector?.name ?? null,
      deactivated_at: user.deactivatedAt?.toISOString() ?? null,
      deactivated_by: user.deactivatedBy ?? null,
      created_at: user.createdAt.toISOString(),
    };
  }
}

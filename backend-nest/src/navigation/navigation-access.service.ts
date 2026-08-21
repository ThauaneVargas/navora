import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import {
  AccessDecision,
  AccessRuleScope,
  AccessSubject,
  VisitorAccessStatus,
} from '@prisma/client';
import { PrismaService } from '../database/prisma.service';
import { AccessCheckDto } from './dto/access-check.dto';

type Clock = { now(): Date };
type RuleEvaluation = {
  decision: AccessDecision;
  reason: string;
  redirectDestinationId?: number | null;
  timezone: string;
};

const systemClock: Clock = { now: () => new Date() };

const scopeRank: Record<AccessRuleScope, number> = {
  DESTINATION: 6,
  SECTOR: 5,
  CATEGORY: 4,
  ACCESS_LEVEL: 3,
  AREA: 2,
  GLOBAL: 1,
};

const decisionRank: Record<AccessDecision, number> = {
  BLOCK: 4,
  REQUIRE_AUTHORIZATION: 3,
  REDIRECT_TO_RECEPTION: 2,
  ALLOW: 1,
};

@Injectable()
export class NavigationAccessService {
  private clock: Clock = systemClock;

  constructor(private readonly prisma: PrismaService) {}

  setClockForTesting(clock: Clock) {
    this.clock = clock;
  }

  async checkAccess(payload: AccessCheckDto) {
    if (!payload.destination_id && !payload.destination_code) {
      throw new BadRequestException('Informe destination_id ou destination_code');
    }

    const destination = await this.prisma.destination.findFirst({
      where: payload.destination_id
        ? { id: payload.destination_id }
        : { code: payload.destination_code },
      include: { area: true, sector: true, navigationNode: true },
    });

    if (!destination) {
      throw new NotFoundException('Destino nao encontrado');
    }

    const evaluatedAt = this.clock.now();
    const rules = await this.prisma.accessRule.findMany({
      where: { enabled: true, subject: payload.subject },
      include: {
        windows: { include: { fallbackDestination: true }, orderBy: { id: 'asc' } },
        fallbackDestination: true,
      },
    });

    const matchedRules = rules
      .filter((rule) => this.matchesRule(rule, destination))
      .sort((left, right) => this.compareRules(left, right));
    const matchedRule = matchedRules[0];
    const baseEvaluation = matchedRule
      ? this.evaluateRule(matchedRule, evaluatedAt)
      : this.defaultDecision(destination.accessLevel, payload.subject);
    const visitorAuthorization =
      payload.subject === AccessSubject.VISITOR
        ? await this.evaluateVisitorAuthorization(payload.visitor_access_request_id, destination.id, destination.name, evaluatedAt)
        : undefined;

    let decision = baseEvaluation.decision;
    let reason = baseEvaluation.reason;

    if (
      decision === AccessDecision.REQUIRE_AUTHORIZATION &&
      visitorAuthorization?.valid
    ) {
      decision = AccessDecision.ALLOW;
      reason = 'Acesso liberado por autorizacao valida da recepcao.';
    }

    const redirectDestination = await this.resolveRedirectDestination(
      decision,
      baseEvaluation.redirectDestinationId,
      destination.area?.code,
      payload.current_area_code,
    );

    return {
      allowed: decision === AccessDecision.ALLOW,
      decision,
      reason,
      requires_authorization: decision === AccessDecision.REQUIRE_AUTHORIZATION,
      evaluated_at: evaluatedAt.toISOString(),
      timezone: baseEvaluation.timezone ?? 'America/Sao_Paulo',
      destination: {
        id: destination.id,
        code: destination.code,
        name: destination.name,
        access_level: destination.accessLevel,
        category: destination.category,
        area: destination.area
          ? { id: destination.area.id, code: destination.area.code, name: destination.area.name }
          : null,
        sector: destination.sector
          ? { id: destination.sector.id, code: destination.sector.code, name: destination.sector.name }
          : null,
      },
      matched_rule: matchedRule
        ? { code: matchedRule.code, scope: matchedRule.scope, priority: matchedRule.priority }
        : null,
      redirect_destination: redirectDestination,
      visitor_authorization: visitorAuthorization,
    };
  }

  private matchesRule(rule: any, destination: any) {
    switch (rule.scope) {
      case AccessRuleScope.GLOBAL:
        return true;
      case AccessRuleScope.AREA:
        return rule.areaId === destination.areaId;
      case AccessRuleScope.SECTOR:
        // Destination.area is the access/elegibility area. Sector is a physical/operational grouping.
        // Shared sectors such as shared-exit may legitimately contain destinations from multiple areas.
        return rule.sectorId === destination.sectorId;
      case AccessRuleScope.DESTINATION:
        return rule.destinationId === destination.id;
      case AccessRuleScope.CATEGORY:
        return rule.category === destination.category && (!rule.areaId || rule.areaId === destination.areaId);
      case AccessRuleScope.ACCESS_LEVEL:
        return rule.accessLevel === destination.accessLevel;
      default:
        return false;
    }
  }

  private compareRules(left: any, right: any) {
    if (left.priority !== right.priority) return right.priority - left.priority;
    const leftScope = left.scope as AccessRuleScope;
    const rightScope = right.scope as AccessRuleScope;
    if (scopeRank[leftScope] !== scopeRank[rightScope]) return scopeRank[rightScope] - scopeRank[leftScope];
    const leftDecision = this.previewDecision(left);
    const rightDecision = this.previewDecision(right);
    return decisionRank[rightDecision] - decisionRank[leftDecision];
  }

  private previewDecision(rule: any): AccessDecision {
    return rule.windows?.[0]?.insideDecision ?? rule.decision ?? AccessDecision.BLOCK;
  }

  private evaluateRule(rule: any, evaluatedAt: Date): RuleEvaluation {
    if (!rule.windows?.length) {
      return {
        decision: rule.decision ?? AccessDecision.BLOCK,
        reason: rule.message ?? this.defaultReason(rule.decision ?? AccessDecision.BLOCK),
        redirectDestinationId: rule.fallbackDestinationId,
        timezone: 'America/Sao_Paulo',
      };
    }

    const window = rule.windows[0];
    const inside = this.isInsideWindow(evaluatedAt, window);
    const decision = inside ? window.insideDecision : window.outsideDecision;

    return {
      decision,
      reason:
        (inside ? window.insideMessage : window.outsideMessage) ??
        rule.message ??
        this.defaultReason(decision),
      redirectDestinationId: window.fallbackDestinationId ?? rule.fallbackDestinationId,
      timezone: window.timezone,
    };
  }

  private isInsideWindow(date: Date, window: any) {
    const local = this.localDateParts(date, window.timezone);
    if (!window.daysOfWeek.includes(local.dayOfWeek)) return false;

    const current = local.hour * 60 + local.minute;
    const start = this.toMinutes(window.startTime);
    const end = this.toMinutes(window.endTime);

    if (start <= end) {
      return current >= start && current <= end;
    }

    return current >= start || current <= end;
  }

  private localDateParts(date: Date, timezone: string) {
    const parts = new Intl.DateTimeFormat('en-US', {
      timeZone: timezone,
      weekday: 'short',
      hour: '2-digit',
      minute: '2-digit',
      hourCycle: 'h23',
    }).formatToParts(date);
    const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '0';
    const dayOfWeek = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].indexOf(part('weekday'));

    return {
      dayOfWeek,
      hour: Number(part('hour')),
      minute: Number(part('minute')),
    };
  }

  private toMinutes(time: string) {
    const [hour = '0', minute = '0'] = time.split(':');
    return Number(hour) * 60 + Number(minute);
  }

  private async evaluateVisitorAuthorization(requestId: number | undefined, destinationId: number, destinationName: string, now: Date) {
    if (!requestId) {
      return { status: null, valid: false, reason: 'Nenhuma autorizacao informada.' };
    }

    const request = await this.prisma.visitorAccessRequest.findUnique({ where: { id: requestId } });
    if (!request) {
      return { status: null, valid: false, reason: 'Autorizacao de visitante nao encontrada.' };
    }

    const inactiveStatuses: VisitorAccessStatus[] = [
      VisitorAccessStatus.DENIED,
      VisitorAccessStatus.EXPIRED,
      VisitorAccessStatus.FINISHED,
      VisitorAccessStatus.CANCELED,
    ];
    if (inactiveStatuses.includes(request.status)) {
      return { status: request.status, valid: false, reason: 'Autorizacao sem validade para navegacao.' };
    }

    if (request.status === VisitorAccessStatus.PENDING || request.status === VisitorAccessStatus.WAITING_AUTHORIZATION) {
      return { status: request.status, valid: false, reason: 'Autorizacao aguardando decisao da recepcao.' };
    }

    const destinationMatches = request.destinationId
      ? request.destinationId === destinationId
      : request.requestedDestination === destinationName;
    const notFinished = !request.finishedAt;
    const notExpired = !request.expiresAt || request.expiresAt >= now;
    const valid = request.status === VisitorAccessStatus.APPROVED && destinationMatches && notFinished && notExpired;

    return {
      id: request.id,
      status: request.status,
      valid,
      authorized_at: request.authorizedAt?.toISOString() ?? null,
      expires_at: request.expiresAt?.toISOString() ?? null,
      finished_at: request.finishedAt?.toISOString() ?? null,
      reason: valid
        ? 'Autorizacao valida para este destino.'
        : 'Autorizacao nao libera este destino ou esta expirada.',
    };
  }

  private async resolveRedirectDestination(
    decision: AccessDecision,
    configuredDestinationId?: number | null,
    destinationAreaCode?: string,
    currentAreaCode?: string,
  ) {
    if (decision !== AccessDecision.REDIRECT_TO_RECEPTION) return null;

    const fallbackCode = configuredDestinationId
      ? undefined
      : this.receptionCode(currentAreaCode || destinationAreaCode);
    const destination = await this.prisma.destination.findFirst({
      where: configuredDestinationId ? { id: configuredDestinationId } : { code: fallbackCode },
    });

    if (!destination) return null;

    return {
      id: destination.id,
      code: destination.code,
      name: destination.name,
      access_level: destination.accessLevel,
    };
  }

  private receptionCode(areaCode?: string) {
    if (areaCode === 'sus') return 'sus-reception';
    if (areaCode === 'private') return 'private-reception';
    return 'shared-lost';
  }

  private defaultDecision(accessLevel: string, subject: AccessSubject): RuleEvaluation {
    if (accessLevel === 'restricted') {
      return { decision: AccessDecision.BLOCK, reason: this.defaultReason(AccessDecision.BLOCK), timezone: 'America/Sao_Paulo' };
    }
    if (subject === AccessSubject.VISITOR && accessLevel === 'visitor_authorization') {
      return {
        decision: AccessDecision.REQUIRE_AUTHORIZATION,
        reason: this.defaultReason(AccessDecision.REQUIRE_AUTHORIZATION),
        timezone: 'America/Sao_Paulo',
      };
    }
    return { decision: AccessDecision.ALLOW, reason: this.defaultReason(AccessDecision.ALLOW), timezone: 'America/Sao_Paulo' };
  }

  private defaultReason(decision: AccessDecision) {
    if (decision === AccessDecision.BLOCK) return 'Acesso bloqueado para este destino.';
    if (decision === AccessDecision.REQUIRE_AUTHORIZATION) return 'Este destino precisa de autorizacao.';
    if (decision === AccessDecision.REDIRECT_TO_RECEPTION) return 'Procure a recepcao para orientacao.';
    return 'Acesso permitido.';
  }
}

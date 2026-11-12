import { Injectable, Logger, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { clearInterval, setInterval, setTimeout } from 'node:timers';
import { PrismaService } from '../database/prisma.service';

export const ANONYMIZED = 'Anonimizado';

const DAY_MS = 24 * 60 * 60 * 1000;
const RUN_EVERY_MS = 12 * 60 * 60 * 1000;

// Prazos padrao (dias). Cada um muda por variavel de ambiente; 0 desliga.
// Sugestao inicial — o prazo real e decisao do hospital (controlador).
const DEFAULT_DAYS = {
  visitor: 30, // RETENTION_VISITOR_DAYS: pedido de visita e apagado
  call: 180, // RETENTION_CALL_DAYS: chamado/SOS fica, sem dado pessoal
  checkIn: 180, // RETENTION_CHECKIN_DAYS: check-in fica, sem dado pessoal
  notification: 90, // RETENTION_NOTIFICATION_DAYS: notificacao e apagada
  audit: 1825, // RETENTION_AUDIT_DAYS: auditoria da equipe (5 anos)
};

export type RetentionResult = {
  visitorRequestsDeleted: number;
  callsAnonymized: number;
  checkInsAnonymized: number;
  notificationsDeleted: number;
  auditLogsDeleted: number;
};

/**
 * Prazo de guarda (LGPD art. 15 e 16): dado pessoal nao fica para sempre.
 * - Pedido de visita: apagado (nome, acompanhantes e destino de terceiro).
 * - Chamado e check-in: o registro fica para estatistica do hospital, mas
 *   nome, telefone, contato de emergencia, necessidades, documento e o
 *   vinculo com a conta sao apagados.
 * Roda ao subir o servidor e a cada 12 h (o Render gratuito dorme; qualquer
 * acesso acorda e dispara a limpeza).
 */
@Injectable()
export class RetentionService implements OnModuleDestroy {
  private readonly logger = new Logger(RetentionService.name);
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // Ligado em producao; fora dela so com RETENTION_ENABLED=true (nao apagar
  // dado do banco local de desenvolvimento/testes sem querer).
  isEnabled() {
    const flag = this.config.get<string>('RETENTION_ENABLED');
    if (flag === 'false') return false;
    if (flag === 'true') return true;
    return process.env.NODE_ENV === 'production';
  }

  start() {
    if (!this.isEnabled() || this.timer) return;
    const run = () =>
      this.purge().catch((error: unknown) => this.logger.error(`retention_failed ${String(error)}`));
    setTimeout(run, 60_000).unref();
    this.timer = setInterval(run, RUN_EVERY_MS);
    this.timer.unref();
  }

  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }

  async purge(now = new Date()): Promise<RetentionResult> {
    const result: RetentionResult = {
      visitorRequestsDeleted: 0,
      callsAnonymized: 0,
      checkInsAnonymized: 0,
      notificationsDeleted: 0,
      auditLogsDeleted: 0,
    };

    const visitorCutoff = this.cutoff('RETENTION_VISITOR_DAYS', DEFAULT_DAYS.visitor, now);
    if (visitorCutoff) {
      const old = { createdAt: { lt: visitorCutoff } };
      // Check-in que apontava para a visita perde so o vinculo.
      await this.prisma.checkIn.updateMany({
        where: { visitorAccessRequest: old },
        data: { visitorAccessRequestId: null },
      });
      result.visitorRequestsDeleted = (await this.prisma.visitorAccessRequest.deleteMany({ where: old })).count;
    }

    const callCutoff = this.cutoff('RETENTION_CALL_DAYS', DEFAULT_DAYS.call, now);
    if (callCutoff) {
      result.callsAnonymized = (
        await this.prisma.callRequest.updateMany({
          where: { createdAt: { lt: callCutoff }, patientName: { not: ANONYMIZED } },
          data: {
            userName: ANONYMIZED,
            patientName: ANONYMIZED,
            callerPhone: null,
            emergencyContact: null,
            message: null,
            reason: null,
            needs: [],
            userId: null,
            accessTokenHash: null,
          },
        })
      ).count;
    }

    const checkInCutoff = this.cutoff('RETENTION_CHECKIN_DAYS', DEFAULT_DAYS.checkIn, now);
    if (checkInCutoff) {
      result.checkInsAnonymized = (
        await this.prisma.checkIn.updateMany({
          where: { createdAt: { lt: checkInCutoff }, patientName: { not: ANONYMIZED } },
          data: { patientName: ANONYMIZED, document: null, observations: null, userId: null },
        })
      ).count;
    }

    const notificationCutoff = this.cutoff('RETENTION_NOTIFICATION_DAYS', DEFAULT_DAYS.notification, now);
    if (notificationCutoff) {
      result.notificationsDeleted = (
        await this.prisma.notification.deleteMany({ where: { createdAt: { lt: notificationCutoff } } })
      ).count;
    }

    const auditCutoff = this.cutoff('RETENTION_AUDIT_DAYS', DEFAULT_DAYS.audit, now);
    if (auditCutoff) {
      result.auditLogsDeleted = (await this.prisma.auditLog.deleteMany({ where: { createdAt: { lt: auditCutoff } } })).count;
    }

    if (Object.values(result).some((count) => count > 0)) {
      this.logger.log(`retention_done ${JSON.stringify(result)}`);
    }
    return result;
  }

  private cutoff(envName: string, fallbackDays: number, now: Date): Date | null {
    const raw = this.config.get<string>(envName);
    const parsed = raw === undefined || raw === '' ? fallbackDays : Number(raw);
    const days = Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
    return days ? new Date(now.getTime() - days * DAY_MS) : null;
  }
}

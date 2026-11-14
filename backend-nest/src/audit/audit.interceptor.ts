import { CallHandler, ExecutionContext, Injectable, Logger, NestInterceptor } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { Observable, tap } from 'rxjs';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';

type AuditRequest = {
  method?: string;
  ip?: string;
  params?: Record<string, string>;
  body?: Record<string, unknown>;
  user?: AuthenticatedUser;
};

// Campos do corpo que podem ir para a auditoria: so controle, nunca nome,
// telefone, documento, motivo escrito a mao ou senha.
const SAFE_BODY_FIELDS = ['status', 'role', 'release_type', 'release_time', 'permission_minutes', 'permissionMinutes', 'priority', 'period', 'from', 'to'];

const MUTATIONS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);

/**
 * Registro automatico do que a equipe (recepcao/admin) faz no painel — LGPD
 * art. 37. Grava: toda alteracao (POST/PUT/PATCH/DELETE), toda abertura de um
 * registro especifico (GET com id na URL) e o login da equipe. Nao grava as
 * listas que o painel consulta a cada poucos segundos (viraria ruido).
 * Falha ao gravar a auditoria nunca derruba a acao (ex.: SOS sendo atendido).
 */
@Injectable()
export class AuditInterceptor implements NestInterceptor {
  private readonly logger = new Logger(AuditInterceptor.name);

  constructor(private readonly prisma: PrismaService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    if (context.getType() !== 'http') return next.handle();
    const request = context.switchToHttp().getRequest<AuditRequest>();
    const method = (request.method || 'GET').toUpperCase();
    const entity = context.getClass().name.replace(/Controller$/, '').toLowerCase();
    const action = `${entity}.${context.getHandler().name}`;
    const params = request.params || {};
    const recordId = Object.values(params).find((value) => /^\d+$/.test(String(value)));
    const isMutation = MUTATIONS.has(method);
    const isRecordView = method === 'GET' && Boolean(recordId);

    return next.handle().pipe(
      tap((response) => {
        const actor = this.staffActor(request.user) ?? (action === 'auth.login' ? this.staffActor(this.responseUser(response)) : null);
        if (!actor || !(isMutation || isRecordView)) return;

        const createdId = response && typeof response === 'object' && 'id' in response ? String((response as { id: unknown }).id) : undefined;
        void this.prisma.auditLog
          .create({
            data: {
              hospitalId: actor.hospitalId,
              actorId: actor.id,
              action: isRecordView ? `${action}.view` : action,
              entity,
              entityId: recordId ?? createdId ?? null,
              details: this.safeDetails(request.body),
              ip: request.ip ?? null,
            },
          })
          .catch((error: unknown) => this.logger.warn(`audit_log_failed action=${action} ${String(error)}`));
      }),
    );
  }

  private staffActor(user?: Partial<AuthenticatedUser> | null): { id: number; hospitalId: number } | null {
    if (!user?.id || !user.role || user.role === UserRole.PATIENT || !user.hospitalId) return null;
    return { id: user.id, hospitalId: user.hospitalId };
  }

  private responseUser(response: unknown): Partial<AuthenticatedUser> | null {
    if (!response || typeof response !== 'object' || !('user' in response)) return null;
    return (response as { user?: Partial<AuthenticatedUser> }).user ?? null;
  }

  private safeDetails(body?: Record<string, unknown>) {
    if (!body || typeof body !== 'object') return {};
    const details: Record<string, string | number | boolean> = {};
    for (const field of SAFE_BODY_FIELDS) {
      const value = body[field];
      if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') {
        details[field] = typeof value === 'string' ? value.slice(0, 60) : value;
      }
    }
    return details;
  }
}

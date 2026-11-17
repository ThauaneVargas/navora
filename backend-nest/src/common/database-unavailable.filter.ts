import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';

// Banco fora do ar / lento (Neon acordando, queda de rede entre Render e Neon,
// pool de conexões esgotado): antes virava "500 Internal server error", e o app
// não tinha como saber que era passageiro. Agora responde 503 com uma mensagem
// clara — o celular trata como "servidor indisponível" (fallback offline,
// "tente de novo", ligar para a recepção no SOS).
//
// Códigos do Prisma: P1001 (não alcança o servidor), P1002 (timeout ao
// conectar), P1008 (operação expirou), P1017 (servidor fechou a conexão),
// P2024 (sem conexão livre no pool).
export const DATABASE_UNAVAILABLE_CODES = new Set(['P1001', 'P1002', 'P1008', 'P1017', 'P2024']);

// Identifica pelo nome da classe (o Prisma define `name`), sem depender do
// cliente gerado — o mesmo resultado de `instanceof Prisma.*`.
function prismaErrorName(error: unknown): string {
  const name = (error as { name?: unknown })?.name;
  return typeof name === 'string' ? name : '';
}

export function isDatabaseUnavailable(error: unknown): boolean {
  const name = prismaErrorName(error);
  if (name === 'PrismaClientInitializationError' || name === 'PrismaClientRustPanicError') return true;
  const code = (error as { code?: unknown })?.code;
  if (name === 'PrismaClientKnownRequestError') {
    return typeof code === 'string' && DATABASE_UNAVAILABLE_CODES.has(code);
  }
  // Prisma às vezes embrulha a falha de rede como erro "desconhecido".
  const message = (error as Error)?.message ?? '';
  return name === 'PrismaClientUnknownRequestError' && /can't reach database|connection (closed|refused|reset|terminated)/i.test(message);
}

export const DATABASE_UNAVAILABLE_BODY = {
  statusCode: HttpStatus.SERVICE_UNAVAILABLE,
  error: 'database_unavailable',
  message: 'Serviço temporariamente indisponível. Tente de novo em instantes.',
};

@Catch()
export class DatabaseUnavailableFilter extends BaseExceptionFilter {
  private readonly logger = new Logger('DatabaseUnavailable');

  catch(exception: unknown, host: ArgumentsHost) {
    if (!isDatabaseUnavailable(exception)) {
      super.catch(exception, host);
      return;
    }

    // Só o código/tipo no log — nunca a consulta nem dados da requisição.
    const code = (exception as { code?: string })?.code ?? (exception as Error)?.name ?? 'desconhecido';
    this.logger.error(`Banco indisponível (${code})`);

    const response = host.switchToHttp().getResponse();
    response.status(HttpStatus.SERVICE_UNAVAILABLE).set('Retry-After', '5').json(DATABASE_UNAVAILABLE_BODY);
  }
}

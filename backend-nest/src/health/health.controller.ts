import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { PrismaService } from '../database/prisma.service';

// Banco que nao responde em 5 s conta como fora (o monitor nao pode ficar pendurado).
const DATABASE_TIMEOUT_MS = 5000;

@Controller()
export class HealthController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  root() {
    return { status: 'online', service: 'Navora API' };
  }

  // Usado pelo monitor externo (UptimeRobot/Better Stack). Antes respondia "ok"
  // mesmo com o banco fora — em 10/10 a producao ficou 10 dias sem banco e
  // ninguem viu. Agora consulta o banco: fora do ar -> 503.
  @Get('health')
  @SkipThrottle()
  async health() {
    let timer: NodeJS.Timeout | undefined;
    try {
      await Promise.race([
        this.prisma.$queryRaw`SELECT 1`,
        new Promise((_, reject) => {
          timer = setTimeout(() => reject(new Error('timeout')), DATABASE_TIMEOUT_MS);
        }),
      ]);
    } catch {
      throw new ServiceUnavailableException({ status: 'error', service: 'Navora Backend NestJS', database: 'down' });
    } finally {
      clearTimeout(timer);
    }
    return { status: 'ok', service: 'Navora Backend NestJS', database: 'ok' };
  }
}

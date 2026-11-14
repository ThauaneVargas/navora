import { Injectable, NestMiddleware } from '@nestjs/common';
import { HospitalsService } from './hospitals.service';
import { HospitalRequest } from './hospital-request';

// Le o header X-Hospital (app do paciente/visitante) e guarda o hospital na
// requisicao. Nunca barra aqui: rota que nao depende de hospital (health,
// login, perfil) segue normal; quem precisa usa @HospitalId(), que recusa
// codigo desconhecido. Equipe do painel ignora o header — vale o hospital
// da conta (ver hospital-id.decorator.ts).
@Injectable()
export class HospitalMiddleware implements NestMiddleware {
  constructor(private readonly hospitals: HospitalsService) {}

  async use(req: HospitalRequest, _res: unknown, next: (error?: unknown) => void) {
    try {
      const code = this.hospitals.normalizeCode(req.headers?.['x-hospital']);
      req.hospital = code ? await this.hospitals.findActiveByCode(code) : null;
    } catch {
      // Banco fora: a rota decide (o /health, por exemplo, reporta o erro).
      req.hospital = null;
    }
    next();
  }
}

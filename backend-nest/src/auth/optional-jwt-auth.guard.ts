import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

type AuthenticatedRequest = {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class OptionalJwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) return true;

    // Token vencido ou de sessao derrubada nao pode bloquear rota publica
    // (ex.: SOS, rota de navegacao): segue como anonimo.
    try {
      request.user = await this.authService.validateToken(token);
    } catch {
      request.user = undefined;
    }
    return true;
  }

  private extractToken(request: AuthenticatedRequest) {
    const authorization = Array.isArray(request.headers.authorization)
      ? request.headers.authorization[0]
      : request.headers.authorization;
    const [type, token] = String(authorization || '').split(' ');
    return type === 'Bearer' ? token : undefined;
  }
}

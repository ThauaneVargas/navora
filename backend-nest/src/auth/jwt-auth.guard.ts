import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthenticatedUser } from './auth.types';

type AuthenticatedRequest = {
  headers: {
    authorization?: string | string[];
  };
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();
    const token = this.extractToken(request);

    if (!token) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    request.user = await this.authService.validateToken(token);
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

import { BadRequestException, ConflictException, Injectable, InternalServerErrorException, Optional, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import * as crypto from 'crypto';
import { MailService } from '../common/mail.service';
import { PrismaService } from '../database/prisma.service';
import { JwtPayload, SafeUser } from './auth.types';
import { ForgotPasswordDto } from './dto/forgot-password.dto';
import { GoogleLoginDto } from './dto/google-login.dto';
import { LoginDto } from './dto/login.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';
import { ResetPasswordDto } from './dto/reset-password.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    @Optional() private readonly mail?: MailService,
  ) {}

  async login(payload: LoginDto) {
    const user = await this.prisma.user.findUnique({
      where: { email: payload.email.trim().toLowerCase() },
    });

    if (!user) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    const validPassword = await bcrypt.compare(payload.password, user.passwordHash);
    if (!validPassword || !user.active) {
      throw new UnauthorizedException('Credenciais invalidas');
    }

    return {
      access_token: await this.signUser(user),
      user: this.toSafeUser(user),
    };
  }

  async validateToken(token: string) {
    const secret = this.jwtSecret();

    try {
      const payload = await this.jwtService.verifyAsync<JwtPayload>(token, { secret });
      const user = await this.prisma.user.findUnique({ where: { id: payload.sub } });

      if (!user?.active || user.email !== payload.email || user.role !== payload.role) {
        throw new UnauthorizedException('Credenciais invalidas');
      }

      // Senha trocada depois que o token foi emitido: sessao antiga cai.
      if (user.passwordChangedAt && (payload.iat ?? 0) < Math.floor(user.passwordChangedAt.getTime() / 1000)) {
        throw new UnauthorizedException('Credenciais invalidas');
      }

      return this.toSafeUser(user);
    } catch (error) {
      if (error instanceof UnauthorizedException) throw error;
      throw new UnauthorizedException('Credenciais invalidas');
    }
  }

  async me(user: SafeUser) {
    return user;
  }

  async registerStaff(payload: RegisterStaffDto) {
    const existing = await this.prisma.user.findUnique({
      where: { email: payload.email.trim().toLowerCase() },
    });

    if (existing) {
      throw new ConflictException('Ja existe um usuario com este e-mail');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const user = await this.prisma.user.create({
      data: {
        name: payload.name.trim(),
        email: payload.email.trim().toLowerCase(),
        passwordHash,
        role: payload.role as any,
        active: true,
      },
    });

    return this.toSafeUser(user);
  }

  async issueAccessToken(user: Pick<User, 'id' | 'email' | 'role'>) {
    return this.signUser(user);
  }

  // Codigo de 6 digitos (facil de digitar no celular), valido por 15 min,
  // descartado na 5a tentativa errada. Resposta igual exista ou nao a conta
  // (nao revela quais e-mails estao cadastrados). `delivery` so depende da
  // configuracao do servidor: "unavailable" = sem e-mail configurado -> o app
  // avisa em vez de mandar a pessoa esperar um e-mail que nao vem.
  async forgotPassword(dto: ForgotPasswordDto): Promise<{ ok: boolean; delivery: 'email' | 'log' | 'unavailable' }> {
    const production = process.env.NODE_ENV === 'production';
    const mailReady = Boolean(this.mail?.isConfigured());
    const delivery = mailReady ? 'email' : production ? 'unavailable' : 'log';
    if (delivery === 'unavailable') return { ok: true, delivery };

    const user = await this.prisma.user.findUnique({
      where: { email: dto.email.trim().toLowerCase() },
    });
    if (!user || !user.active) return { ok: true, delivery };

    const code = String(crypto.randomInt(0, 1_000_000)).padStart(6, '0');
    const expires = new Date(Date.now() + RESET_CODE_TTL_MS);

    await this.prisma.user.update({
      where: { id: user.id },
      // So o hash (ligado ao id, pra dois codigos iguais nao colidirem).
      data: { passwordResetToken: hashResetCode(user.id, code), passwordResetExpires: expires, passwordResetAttempts: 0 },
    });

    if (delivery === 'email') {
      await this.mail?.send(
        user.email,
        'Navora — código para criar uma nova senha',
        `Seu código de recuperação do Navora é ${code}. Ele vale por 15 minutos. Se não foi você que pediu, ignore este e-mail.`,
        `<p>Seu código de recuperação do <b>Navora</b> é:</p><p style="font-size:28px;letter-spacing:6px;font-weight:bold">${code}</p><p>Ele vale por 15 minutos. Se não foi você que pediu, ignore este e-mail.</p>`,
      );
    } else {
      // Desenvolvimento sem SMTP: o codigo aparece so no log local.
      console.log(`[ForgotPassword] Codigo para ${user.email}: ${code} (expira em ${expires.toISOString()})`);
    }

    return { ok: true, delivery };
  }

  async resetPassword(dto: ResetPasswordDto): Promise<{ ok: boolean }> {
    const invalid = () => new BadRequestException('Codigo invalido ou expirado');
    const now = new Date();

    if (!dto.email) {
      throw invalid();
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email.trim().toLowerCase() } });
    if (!user || !user.active || !user.passwordResetToken || !user.passwordResetExpires || user.passwordResetExpires <= now) {
      throw invalid();
    }

    if (hashResetCode(user.id, dto.token.trim()) !== user.passwordResetToken) {
      const attempts = (user.passwordResetAttempts ?? 0) + 1;
      await this.prisma.user.update({
        where: { id: user.id },
        data:
          attempts >= RESET_CODE_MAX_ATTEMPTS
            ? { passwordResetToken: null, passwordResetExpires: null, passwordResetAttempts: 0 }
            : { passwordResetAttempts: attempts },
      });
      throw invalid();
    }

    const passwordHash = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        passwordResetToken: null,
        passwordResetExpires: null,
        passwordResetAttempts: 0,
        passwordChangedAt: new Date(),
      },
    });

    return { ok: true };
  }

  async loginWithGoogle(dto: GoogleLoginDto) {
    // Só aceita token emitido PARA o Navora (campo aud). Sem essa checagem,
    // qualquer outro app em que a pessoa entrou com Google poderia reaproveitar
    // o token dela aqui. Sem GOOGLE_CLIENT_IDS configurado, o login Google fica
    // desligado (o app ainda não usa).
    const allowedClientIds = (this.configService.get<string>('GOOGLE_CLIENT_IDS') ?? '')
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
    if (allowedClientIds.length === 0) {
      throw new UnauthorizedException('Login com Google nao esta habilitado');
    }

    const GOOGLE_TOKEN_INFO_URL = `https://www.googleapis.com/oauth2/v3/tokeninfo?id_token=${encodeURIComponent(dto.idToken)}`;

    let googlePayload: { sub: string; email: string; name: string; email_verified: string; aud: string };

    try {
      const res = await fetch(GOOGLE_TOKEN_INFO_URL);
      if (!res.ok) throw new UnauthorizedException('Token Google inválido');
      googlePayload = await res.json() as any;
    } catch {
      throw new UnauthorizedException('Não foi possível verificar o token Google');
    }

    if (!allowedClientIds.includes(googlePayload.aud)) {
      throw new UnauthorizedException('Token Google nao foi emitido para o Navora');
    }

    if (googlePayload.email_verified !== 'true') {
      throw new UnauthorizedException('E-mail Google não verificado');
    }

    const email = googlePayload.email.toLowerCase();

    let user = await this.prisma.user.findUnique({ where: { email } });

    if (user) {
      // Link google ID if not yet linked
      if (!user.googleId) {
        user = await this.prisma.user.update({
          where: { id: user.id },
          data: { googleId: googlePayload.sub },
        });
      }
      if (!user.active) throw new UnauthorizedException('Conta desativada');
      if (user.role !== UserRole.PATIENT) throw new UnauthorizedException('Este aplicativo é exclusivo para pacientes');
    } else {
      // Auto-register new patient via Google
      user = await this.prisma.user.create({
        data: {
          email,
          name: googlePayload.name || email.split('@')[0],
          passwordHash: await bcrypt.hash(crypto.randomBytes(20).toString('hex'), 10),
          googleId: googlePayload.sub,
          role: UserRole.PATIENT,
          active: true,
        },
      });

      await this.prisma.patientProfile.create({
        data: { userId: user.id },
      });
    }

    return {
      access_token: await this.signUser(user),
      user: this.toSafeUser(user),
    };
  }

  toSafeUser(user: User): SafeUser {
    return {
      id: user.id,
      name: user.name,
      email: user.email,
      phone: user.phone,
      role: user.role,
      active: user.active,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  private async signUser(user: Pick<User, 'id' | 'email' | 'role'>) {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.jwtSecret(),
      expiresIn: (this.configService.get<string>('JWT_EXPIRES_IN') || '8h') as any,
    });
  }

  private jwtSecret() {
    const secret = this.configService.get<string>('JWT_SECRET');
    if (!secret) {
      throw new InternalServerErrorException('JWT_SECRET nao configurado');
    }

    return secret;
  }
}

export const authRoles = UserRole;

const RESET_CODE_TTL_MS = 15 * 60 * 1000;
const RESET_CODE_MAX_ATTEMPTS = 5;

function hashResetCode(userId: number, code: string) {
  return crypto.createHash('sha256').update(`${userId}:${code}`).digest('hex');
}

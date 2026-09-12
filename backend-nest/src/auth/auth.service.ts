import { ConflictException, Injectable, InternalServerErrorException, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { User, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../database/prisma.service';
import { JwtPayload, SafeUser } from './auth.types';
import { LoginDto } from './dto/login.dto';
import { RegisterStaffDto } from './dto/register-staff.dto';

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
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

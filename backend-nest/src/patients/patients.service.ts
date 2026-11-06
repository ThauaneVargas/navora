import { ConflictException, ForbiddenException, Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Prisma, UserRole } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { AuthService } from '../auth/auth.service';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdateAccessibilityDto } from './dto/update-accessibility.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';

const allowedAccessibilityKeys = [
  'wheelchair',
  'avoidStairs',
  'preferElevator',
  'voiceGuidance',
  'largerText',
  'highContrast',
  'needsStretcher',
  'mobilityDifficulty',
  // As 3 abaixo não mudam a rota; existem para a equipe saber como ajudar.
  'needsCompanion',
  'visualImpairment',
  'hearingImpairment',
] as const;

type PatientWithUser = Prisma.PatientProfileGetPayload<{ include: { user: true } }>;
type AccessibilityKey = (typeof allowedAccessibilityKeys)[number];
type AccessibilitySource =
  | UpdateAccessibilityDto
  | Partial<Record<AccessibilityKey, unknown>>
  | Prisma.JsonValue;

@Injectable()
export class PatientsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(payload: RegisterPatientDto) {
    const email = payload.email.trim().toLowerCase();
    const existingUser = await this.prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      throw new ConflictException('E-mail ja cadastrado');
    }

    const passwordHash = await bcrypt.hash(payload.password, 10);
    const patient = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email,
          passwordHash,
          name: payload.name.trim(),
          phone: payload.phone.trim(),
          role: UserRole.PATIENT,
          active: true,
        },
      });

      return tx.patientProfile.create({
        data: {
          userId: user.id,
          accessibility: this.cleanAccessibility(payload.accessibility),
          emergencyContact: payload.emergencyContact?.trim() || null,
          privacyConsentAt: new Date(),
          privacyPolicyVersion: payload.privacyPolicyVersion,
        },
        include: { user: true },
      });
    });

    return {
      access_token: await this.authService.issueAccessToken(patient.user),
      patient: this.toPatientResponse(patient),
    };
  }

  async me(user: AuthenticatedUser) {
    this.ensurePatient(user);
    const patient = await this.findPatientProfile(user.id);
    return this.toPatientResponse(patient);
  }

  async updateMe(user: AuthenticatedUser, payload: UpdatePatientDto) {
    this.ensurePatient(user);
    await this.findPatientProfile(user.id);

    const patient = await this.prisma.$transaction(async (tx) => {
      if (payload.name !== undefined || payload.phone !== undefined) {
        await tx.user.update({
          where: { id: user.id },
          data: {
            ...(payload.name !== undefined ? { name: payload.name.trim() } : {}),
            ...(payload.phone !== undefined ? { phone: payload.phone.trim() } : {}),
          },
        });
      }

      return tx.patientProfile.update({
        where: { userId: user.id },
        data: {
          ...(payload.accessibility !== undefined
            ? { accessibility: this.cleanAccessibility(payload.accessibility) }
            : {}),
          ...(payload.emergencyContact !== undefined
            ? { emergencyContact: payload.emergencyContact.trim() || null }
            : {}),
        },
        include: { user: true },
      });
    });

    return this.toPatientResponse(patient);
  }

  async updateAccessibility(user: AuthenticatedUser, payload: UpdateAccessibilityDto) {
    this.ensurePatient(user);
    const current = await this.findPatientProfile(user.id);
    const accessibility = {
      ...this.cleanAccessibility(current.accessibility),
      ...this.cleanAccessibility(payload),
    };

    const patient = await this.prisma.patientProfile.update({
      where: { userId: user.id },
      data: { accessibility },
      include: { user: true },
    });

    return this.toPatientResponse(patient);
  }

  // LGPD (art. 18, VI): o paciente apaga a própria conta. Some o cadastro
  // (nome, e-mail, telefone, acessibilidade, contato de emergência) e as
  // notificações. Chamados de SOS/ajuda já atendidos ficam
  // no histórico do hospital (registro de atendimento), sem ligação com a conta.
  async deleteMe(user: AuthenticatedUser, password: string) {
    this.ensurePatient(user);
    const account = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!account || !(await bcrypt.compare(password, account.passwordHash))) {
      throw new UnauthorizedException('Senha incorreta');
    }

    await this.prisma.$transaction([
      this.prisma.notification.deleteMany({ where: { userId: user.id } }),
      this.prisma.checkIn.updateMany({ where: { userId: user.id }, data: { userId: null } }),
      this.prisma.patientProfile.deleteMany({ where: { userId: user.id } }),
      this.prisma.user.delete({ where: { id: user.id } }),
    ]);

    return { deleted: true };
  }

  private async findPatientProfile(userId: number) {
    const patient = await this.prisma.patientProfile.findUnique({
      where: { userId },
      include: { user: true },
    });

    if (!patient) {
      throw new NotFoundException('Perfil de paciente nao encontrado');
    }

    return patient;
  }

  private ensurePatient(user: AuthenticatedUser) {
    if (user.role !== UserRole.PATIENT) {
      throw new ForbiddenException('Acesso exclusivo para paciente');
    }
  }

  private cleanAccessibility(value?: AccessibilitySource | null): Record<string, boolean> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) {
      return {};
    }

    const accessibility: Record<string, boolean> = {};
    for (const key of allowedAccessibilityKeys) {
      const preference = value[key];
      if (typeof preference === 'boolean') {
        accessibility[key] = preference;
      }
    }

    return accessibility;
  }

  private toPatientResponse(patient: PatientWithUser) {
    return {
      id: patient.id,
      accessibility: patient.accessibility,
      emergencyContact: patient.emergencyContact,
      privacyConsentAt: patient.privacyConsentAt?.toISOString() ?? null,
      privacyPolicyVersion: patient.privacyPolicyVersion,
      user: this.authService.toSafeUser(patient.user),
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}

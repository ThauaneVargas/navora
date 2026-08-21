import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
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
          phone: payload.phone,
          role: UserRole.PATIENT,
          active: true,
        },
      });

      return tx.patientProfile.create({
        data: {
          userId: user.id,
          patientCode: payload.patientCode,
          birthDate: payload.birthDate ? new Date(payload.birthDate) : undefined,
          accessibility: this.cleanAccessibility(payload.accessibility),
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
            ...(payload.phone !== undefined ? { phone: payload.phone } : {}),
          },
        });
      }

      return tx.patientProfile.update({
        where: { userId: user.id },
        data: {
          ...(payload.patientCode !== undefined ? { patientCode: payload.patientCode || null } : {}),
          ...(payload.birthDate !== undefined
            ? { birthDate: payload.birthDate ? new Date(payload.birthDate) : null }
            : {}),
          ...(payload.accessibility !== undefined
            ? { accessibility: this.cleanAccessibility(payload.accessibility) }
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
      patientCode: patient.patientCode,
      birthDate: patient.birthDate?.toISOString() ?? null,
      accessibility: patient.accessibility,
      user: this.authService.toSafeUser(patient.user),
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
    };
  }
}

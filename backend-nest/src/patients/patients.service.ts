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

  // hospitalId: onde a pessoa se cadastrou (so estatistica do painel). A conta
  // vale em qualquer hospital que use o Navora.
  async register(payload: RegisterPatientDto, hospitalId: number | null = null) {
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
          hospitalId,
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

  async exportMe(user: AuthenticatedUser) {
    this.ensurePatient(user);
    const patient = await this.findPatientProfile(user.id);
    const [calls, checkIns, notifications] = await Promise.all([
      this.prisma.callRequest.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { hospital: { select: { name: true } } },
      }),
      this.prisma.checkIn.findMany({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
        include: { hospital: { select: { name: true } } },
      }),
      this.prisma.notification.findMany({ where: { userId: user.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    return {
      exported_at: new Date().toISOString(),
      about:
        'Dados que o Navora guarda sobre voce. Historico de rotas, favoritos e foto de perfil ficam so no seu celular e nao aparecem aqui. Pedidos de visita nao ficam ligados a conta.',
      account: {
        name: patient.user.name,
        email: patient.user.email,
        phone: patient.user.phone,
        created_at: patient.user.createdAt.toISOString(),
      },
      profile: {
        accessibility: patient.accessibility,
        emergency_contact: patient.emergencyContact,
        privacy_consent_at: patient.privacyConsentAt?.toISOString() ?? null,
        privacy_policy_version: patient.privacyPolicyVersion,
      },
      help_requests: calls.map((call) => ({
        hospital: call.hospital?.name ?? null,
        type: call.callType,
        status: call.status,
        location: call.location,
        sector: call.sector,
        phone: call.callerPhone,
        emergency_contact: call.emergencyContact,
        needs: call.needs,
        created_at: call.createdAt.toISOString(),
      })),
      check_ins: checkIns.map((checkIn) => ({
        hospital: checkIn.hospital?.name ?? null,
        name: checkIn.patientName,
        document: checkIn.document,
        destination: checkIn.destinationLabel,
        status: checkIn.status,
        created_at: checkIn.createdAt.toISOString(),
      })),
      notifications: notifications.map((notification) => ({
        title: notification.title,
        description: notification.description,
        read: notification.read,
        created_at: notification.createdAt.toISOString(),
      })),
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

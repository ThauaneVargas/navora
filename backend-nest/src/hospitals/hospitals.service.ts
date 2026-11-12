import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../database/prisma.service';

export type HospitalRef = { id: number; code: string; name: string };

const CACHE_TTL_MS = 60_000;
// Codigo vindo do header: so letras minusculas, numeros e hifen.
const CODE_PATTERN = /^[a-z0-9-]{1,40}$/;

@Injectable()
export class HospitalsService {
  private readonly cache = new Map<string, { value: HospitalRef | null; expiresAt: number }>();

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
  ) {}

  // APK antigo nao manda o header: cai no hospital padrao (hoje o HMC).
  defaultCode() {
    return (this.config.get<string>('DEFAULT_HOSPITAL_CODE') || 'hmc').trim().toLowerCase();
  }

  normalizeCode(raw: unknown): string | null {
    const value = Array.isArray(raw) ? raw[0] : raw;
    if (value === undefined || value === null || value === '') return this.defaultCode();
    const code = String(value).trim().toLowerCase();
    return CODE_PATTERN.test(code) ? code : null;
  }

  // Hospital ativo com esse codigo, ou null. Cache curto: o header vem em toda
  // requisicao do app e a lista de hospitais quase nunca muda.
  async findActiveByCode(code: string): Promise<HospitalRef | null> {
    const cached = this.cache.get(code);
    if (cached && cached.expiresAt > Date.now()) return cached.value;

    const hospital = await this.prisma.hospital.findUnique({
      where: { code },
      select: { id: true, code: true, name: true, active: true },
    });
    const value = hospital?.active ? { id: hospital.id, code: hospital.code, name: hospital.name } : null;
    this.cache.set(code, { value, expiresAt: Date.now() + CACHE_TTL_MS });
    return value;
  }

  async findById(id: number): Promise<HospitalRef | null> {
    const hospital = await this.prisma.hospital.findUnique({
      where: { id },
      select: { id: true, code: true, name: true },
    });
    return hospital ?? null;
  }
}

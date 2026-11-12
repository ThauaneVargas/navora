import { UserRole } from '@prisma/client';

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  // Equipe: hospital onde trabalha (o unico que enxerga). Paciente: onde se
  // cadastrou (so estatistica). Vem do banco a cada requisicao, nao do token.
  hospitalId: number | null;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AuthenticatedUser = SafeUser;

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
  // Preenchido pelo jsonwebtoken (segundos desde 1970).
  iat?: number;
};

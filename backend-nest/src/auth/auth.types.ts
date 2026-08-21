import { UserRole } from '@prisma/client';

export type SafeUser = {
  id: number;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  active: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type AuthenticatedUser = SafeUser;

export type JwtPayload = {
  sub: number;
  email: string;
  role: UserRole;
};

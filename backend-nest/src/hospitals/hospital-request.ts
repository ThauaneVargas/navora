import { AuthenticatedUser } from '../auth/auth.types';
import { HospitalRef } from './hospitals.service';

export type HospitalRequest = {
  headers?: Record<string, string | string[] | undefined>;
  user?: AuthenticatedUser;
  // Resolvido pelo HospitalMiddleware a partir do header X-Hospital.
  hospital?: HospitalRef | null;
};

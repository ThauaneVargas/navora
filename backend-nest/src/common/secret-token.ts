import { Buffer } from 'buffer';
import { createHash, timingSafeEqual } from 'crypto';

// Codigo secreto (pedido de visitante, chamado de SOS): o banco guarda so o hash SHA-256.
export function hashSecretToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function secretTokenMatches(storedHash: string | null | undefined, token?: string | null) {
  if (!storedHash || !token) return false;
  const given = Buffer.from(hashSecretToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return given.length === stored.length && timingSafeEqual(given, stored);
}

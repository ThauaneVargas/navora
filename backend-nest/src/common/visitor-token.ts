import { Buffer } from 'buffer';
import { createHash, timingSafeEqual } from 'crypto';

// Codigo secreto do pedido de visitante: o banco guarda so o hash SHA-256.
export function hashVisitorToken(token: string) {
  return createHash('sha256').update(token).digest('hex');
}

export function visitorTokenMatches(storedHash: string | null | undefined, token?: string | null) {
  if (!storedHash || !token) return false;
  const given = Buffer.from(hashVisitorToken(token), 'hex');
  const stored = Buffer.from(storedHash, 'hex');
  return given.length === stored.length && timingSafeEqual(given, stored);
}

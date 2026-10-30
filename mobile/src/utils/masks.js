/**
 * Máscaras e validações reutilizáveis para campos de formulário
 * (cadastro de paciente/visitante, edição de perfil).
 */

// CPF e data de nascimento saíram do app (LGPD, 29/10) — junto com as máscaras.

export function maskPhone(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);

  if (digits.length <= 10) {
    let out = '';
    if (digits.length > 0) out = `(${digits.slice(0, 2)}`;
    if (digits.length >= 3) out += `) ${digits.slice(2, 6)}`;
    if (digits.length >= 7) out += `-${digits.slice(6, 10)}`;
    return out;
  }

  return `(${digits.slice(0, 2)}) ${digits.slice(2, 7)}-${digits.slice(7, 11)}`;
}

export function maskCEP(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);

  let out = digits.slice(0, 5);
  if (digits.length > 5) out += `-${digits.slice(5, 8)}`;
  return out;
}

export function sanitizeName(value) {
  return String(value || '').replace(/[0-9]/g, '');
}

export function isValidEmail(value) {
  const trimmed = String(value || '').trim();
  if (!trimmed) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
}

// Telefone BR com DDD: 10 dígitos (fixo) ou 11 (celular, começa com 9).
export function isValidPhone(value) {
  const digits = String(value || '').replace(/\D/g, '');
  if (digits.length === 10) return true;
  return digits.length === 11 && digits[2] === '9';
}

// Senha forte — a MESMA regra do servidor (backend-nest/src/common/strong-password.ts):
// 8+ caracteres, com letra, número e símbolo, sem espaço. Cada item vira uma
// linha da lista na tela (components/PasswordRules.js), marcada quando cumprida.
export function passwordRules(value) {
  const str = String(value || '');
  return [
    { key: 'length', ok: str.length >= 8 },
    { key: 'letter', ok: /[A-Za-z]/.test(str) },
    { key: 'number', ok: /\d/.test(str) },
    { key: 'symbol', ok: /[^A-Za-z0-9\s]/.test(str) },
    { key: 'noSpace', ok: str.length > 0 && !/\s/.test(str) },
  ];
}

export const isStrongPassword = (value) =>
  String(value || '').length <= 72 && passwordRules(value).every((rule) => rule.ok);

// Máscara do campo de senha: espaço nem entra.
export const stripSpaces = (value) => String(value || '').replace(/\s/g, '');

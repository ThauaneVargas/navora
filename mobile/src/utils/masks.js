/**
 * Máscaras e validações reutilizáveis para campos de formulário
 * (cadastro de paciente/visitante, edição de perfil).
 */

export function maskBirthDate(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 8);
  const day = digits.slice(0, 2);
  const month = digits.slice(2, 4);
  const year = digits.slice(4, 8);

  let out = day;
  if (month) out += `/${month}`;
  if (year) out += `/${year}`;
  return out;
}

export function maskCPF(value) {
  const digits = String(value || '').replace(/\D/g, '').slice(0, 11);

  let out = digits.slice(0, 3);
  if (digits.length > 3) out += `.${digits.slice(3, 6)}`;
  if (digits.length > 6) out += `.${digits.slice(6, 9)}`;
  if (digits.length > 9) out += `-${digits.slice(9, 11)}`;
  return out;
}

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

export function isValidCPF(value) {
  const cpf = String(value || '').replace(/\D/g, '');
  if (cpf.length !== 11) return false;
  if (/^(\d)\1{10}$/.test(cpf)) return false;

  const calcDigit = (base) => {
    let sum = 0;
    let weight = base.length + 1;
    for (let i = 0; i < base.length; i += 1) {
      sum += parseInt(base[i], 10) * weight;
      weight -= 1;
    }
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };

  const digit1 = calcDigit(cpf.slice(0, 9));
  const digit2 = calcDigit(cpf.slice(0, 9) + digit1);

  return digit1 === parseInt(cpf[9], 10) && digit2 === parseInt(cpf[10], 10);
}

export function isValidBirthDate(value) {
  const match = String(value || '').match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!match) return false;

  const day = parseInt(match[1], 10);
  const month = parseInt(match[2], 10);
  const year = parseInt(match[3], 10);
  const currentYear = new Date().getFullYear();

  if (month < 1 || month > 12) return false;
  if (year < 1900 || year > currentYear) return false;

  const daysInMonth = new Date(year, month, 0).getDate();
  if (day < 1 || day > daysInMonth) return false;

  const date = new Date(year, month - 1, day);
  if (date.getTime() > Date.now()) return false;

  return true;
}

export function passwordStrength(value) {
  const str = String(value || '');
  let score = 0;

  if (str.length >= 8) score += 1;
  if (/[a-z]/.test(str) && /[A-Z]/.test(str)) score += 1;
  if (/\d/.test(str)) score += 1;
  if (/[^A-Za-z0-9]/.test(str)) score += 1;

  if (!str) return { score: 0, label: '' };
  if (score <= 1) return { score, label: 'Fraca' };
  if (score === 2) return { score, label: 'Média' };
  if (score === 3) return { score, label: 'Boa' };
  return { score, label: 'Forte' };
}

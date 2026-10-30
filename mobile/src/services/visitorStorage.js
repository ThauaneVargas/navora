import * as SecureStore from 'expo-secure-store';

// Visita em andamento (pedido + código secreto) guardada SÓ neste celular
// (SecureStore, o mesmo cofre do token), pra quem fechar o app voltar direto
// pra ela. Some quando a visita termina, expira, é negada ou a pessoa sai.
// Desde 29/10 o visitante entra com conta: nome e telefone vêm dela.

// Antigo "Lembrar meus dados" (nome, telefone, nascimento): não existe mais;
// a chave só é lida pra ser apagada dos celulares que ainda a têm.
const REMEMBERED_KEY = 'navora.visitor.remembered';
const ACTIVE_VISIT_KEY = 'navora.visitor.activeVisit';

// Mesmo critério do visitorAccessMonitor: depois disso a visita acabou.
const TERMINAL_STATUSES = new Set(['DENIED', 'CANCELED', 'REVOKED', 'EXPIRED', 'FINISHED']);
// Pedido que nunca foi respondido não fica preso no celular pra sempre.
const MAX_PENDING_AGE_MS = 24 * 60 * 60 * 1000;

let memory = { [REMEMBERED_KEY]: null, [ACTIVE_VISIT_KEY]: null };

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function writeJson(key, value) {
  memory[key] = value;
  try {
    if (!(await available())) return;
    if (value == null) await SecureStore.deleteItemAsync(key);
    else await SecureStore.setItemAsync(key, JSON.stringify(value));
  } catch {
    // Sem cofre (ex.: web): fica só na memória desta sessão.
  }
}

async function readJson(key) {
  try {
    if (!(await available())) return memory[key];
    const raw = await SecureStore.getItemAsync(key);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return memory[key];
  }
}

export const clearLegacyRememberedVisitor = () => writeJson(REMEMBERED_KEY, null);

export function isVisitFinished(request) {
  if (!request) return true;
  if (TERMINAL_STATUSES.has(request.status)) return true;
  const expiresAt = request.expiresAt || request.validUntil;
  if (expiresAt && Date.parse(expiresAt) < Date.now()) return true;
  const createdAt = Date.parse(request.createdAt || '');
  if (!expiresAt && createdAt && Date.now() - createdAt > MAX_PENDING_AGE_MS) return true;
  return false;
}

export async function saveActiveVisit(visitor, request) {
  if (!visitor || !request?.id || isVisitFinished(request)) {
    await writeJson(ACTIVE_VISIT_KEY, null);
    return;
  }
  await writeJson(ACTIVE_VISIT_KEY, { visitor, request, savedAt: new Date().toISOString() });
}

export async function loadActiveVisit() {
  const saved = await readJson(ACTIVE_VISIT_KEY);
  if (!saved?.visitor || !saved?.request || isVisitFinished(saved.request)) {
    if (saved) await writeJson(ACTIVE_VISIT_KEY, null);
    return null;
  }
  return saved;
}

export const clearActiveVisit = () => writeJson(ACTIVE_VISIT_KEY, null);

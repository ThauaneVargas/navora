import * as SecureStore from 'expo-secure-store';

// Chamado em andamento (SOS ou pedido de ajuda): id + código secreto que o
// servidor devolve ao criar. Fica SÓ neste celular, para a tela de Ajuda
// mostrar o andamento ("Recebido", "Equipe a caminho") mesmo depois de
// trocar de tela ou fechar o app. Some quando o chamado é encerrado,
// cancelado ou fica velho.

const ACTIVE_CALL_KEY = 'navora.activeCall';
const TERMINAL_STATUSES = new Set(['CLOSED', 'CANCELED']);
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

let memory = null;

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

async function write(value) {
  memory = value;
  try {
    if (!(await available())) return;
    if (value == null) await SecureStore.deleteItemAsync(ACTIVE_CALL_KEY);
    else await SecureStore.setItemAsync(ACTIVE_CALL_KEY, JSON.stringify(value));
  } catch {
    // Sem cofre (ex.: web): fica só na memória desta sessão.
  }
}

export async function saveActiveCall(call) {
  if (!call?.id || !call?.token) return;
  await write({ ...call, savedAt: Date.now() });
}

export async function updateActiveCall(changes) {
  const current = await getActiveCall();
  if (!current) return null;
  const next = { ...current, ...changes };
  if (TERMINAL_STATUSES.has(next.status)) {
    // Mantém na memória para a tela mostrar "Encerrado" uma última vez.
    await write(null);
    memory = next;
    return next;
  }
  await write(next);
  return next;
}

export async function getActiveCall() {
  let value = memory;
  if (!value) {
    try {
      if (await available()) {
        const raw = await SecureStore.getItemAsync(ACTIVE_CALL_KEY);
        value = raw ? JSON.parse(raw) : null;
      }
    } catch {
      value = null;
    }
  }
  if (value && Date.now() - (value.savedAt || 0) > MAX_AGE_MS) {
    await write(null);
    return null;
  }
  memory = value;
  return value;
}

export async function clearActiveCall() {
  await write(null);
}

export function isTerminalCallStatus(status) {
  return TERMINAL_STATUSES.has(status);
}

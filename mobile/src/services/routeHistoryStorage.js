import * as SecureStore from 'expo-secure-store';

// Histórico de rotas: só neste celular (SecureStore), nunca no servidor.
// O destino pode revelar algo de saúde (ex.: oncologia), por isso o "Sair"
// apaga tudo. Guardamos pouco e curto — o SecureStore avisa acima de ~2 KB.

const KEY = 'navora.routeHistory';
const MAX_ITEMS = 12;
// Mesma rota iniciada de novo em pouco tempo (recalcular, voltar) não duplica.
const SAME_ROUTE_WINDOW_MS = 30 * 60 * 1000;

let memory = [];
const listeners = new Set();

async function available() {
  try {
    return await SecureStore.isAvailableAsync();
  } catch {
    return false;
  }
}

export async function loadRouteHistory() {
  try {
    if (!(await available())) return memory;
    const raw = await SecureStore.getItemAsync(KEY);
    memory = raw ? JSON.parse(raw) : [];
  } catch {
    // Valor corrompido: começa de novo em vez de quebrar a tela.
  }
  return memory;
}

async function persist(items) {
  memory = items;
  listeners.forEach((listener) => listener(items));
  try {
    if (!(await available())) return;
    if (items.length) await SecureStore.setItemAsync(KEY, JSON.stringify(items));
    else await SecureStore.deleteItemAsync(KEY);
  } catch {
    // Sem cofre: fica só na memória desta sessão.
  }
}

// route: o activeRoute do App.js (destination + requestedDestination).
export async function recordRoute(route) {
  const target = route?.requestedDestination || route?.effectiveDestination || {};
  const name = target.name || route?.destination;
  if (!name) return;

  const key = String(target.id || target.code || name);
  const arrived = route?.status === 'arrived';
  const now = Date.now();
  const items = await loadRouteHistory();
  const last = items[0];

  if (last && last.k === key && now - Date.parse(last.t) < SAME_ROUTE_WINDOW_MS) {
    if (arrived && !last.a) await persist([{ ...last, a: true }, ...items.slice(1)]);
    return;
  }

  const entry = {
    k: key,
    n: String(name).slice(0, 60),
    c: target.category || null,
    f: target.floor || null,
    i: target.icon || null,
    t: new Date(now).toISOString(),
    a: arrived,
  };
  await persist([entry, ...items].slice(0, MAX_ITEMS));
}

export const clearRouteHistory = () => persist([]);

export function subscribeRouteHistory(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

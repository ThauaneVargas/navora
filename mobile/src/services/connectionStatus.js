import { useSyncExternalStore } from 'react';

// Estado da conexão com o servidor, atualizado pelo api.js a cada resposta:
// offline = a última tentativa não chegou ao servidor. syncedAt = quando o
// mapa salvo no celular (offlineDatabase) foi baixado. O Header mostra um
// aviso discreto enquanto offline.

let state = { offline: false, syncedAt: null };
const listeners = new Set();

export const getConnectionStatus = () => state;

export function setConnectionStatus(patch) {
  const next = { ...state, ...patch };
  if (next.offline === state.offline && next.syncedAt === state.syncedAt) return;
  state = next;
  listeners.forEach((listener) => listener(state));
}

const subscribe = (listener) => {
  listeners.add(listener);
  return () => listeners.delete(listener);
};

export function useConnectionStatus() {
  return useSyncExternalStore(subscribe, getConnectionStatus, getConnectionStatus);
}

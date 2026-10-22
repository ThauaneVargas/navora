// UUID de iBeacon na forma em que fica no banco: 32 hex minúsculos com hífens
// 8-4-4-4-12. Aceita maiúsculas/minúsculas e com ou sem hífens (cada app de
// scanner mostra de um jeito). Devolve null se não for um UUID válido.
export function normalizeIbeaconUuid(value?: string | null): string | null {
  const hex = String(value ?? '').trim().replace(/-/g, '').toLowerCase();
  if (!/^[0-9a-f]{32}$/.test(hex)) {
    return null;
  }
  return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
}

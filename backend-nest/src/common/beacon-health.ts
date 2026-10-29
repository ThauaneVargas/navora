// Situacao de um beacon calculada a partir do ultimo sinal REAL recebido.
//
// Os beacons Feasycom so transmitem (iBeacon): nao avisam o servidor que estao
// ligados e nao informam bateria. O unico sinal de vida e um celular com BLE
// ativo enxergar o aparelho e chamar POST /beacons/detect com uuid/major/minor
// — isso atualiza last_signal_at. Por isso:
// - "Online": algum celular viu o beacon nas ultimas 24 h;
// - "Sem sinal": ninguem viu nesse periodo (pilha, aparelho removido ou so
//   nao passou ninguem com o app) — vale conferir no local;
// - "Simulado": beacon de teste, sem aparelho fisico;
// - bateria: null para aparelho fisico (o iBeacon nao transmite esse dado).
export const BEACON_SIGNAL_WINDOW_MS = 24 * 60 * 60 * 1000;

type BeaconLike = {
  status: string;
  battery: number;
  lastSignalAt: Date;
  hardwareModel?: string | null;
  ibeaconUuid?: string | null;
};

export function isPhysicalBeacon(beacon: BeaconLike) {
  return Boolean(beacon.ibeaconUuid || beacon.hardwareModel);
}

export function beaconHealth(beacon: BeaconLike, now: Date = new Date()) {
  if (!isPhysicalBeacon(beacon)) {
    return { status: 'Simulado', battery: null as number | null, online: false };
  }
  const online = now.getTime() - beacon.lastSignalAt.getTime() <= BEACON_SIGNAL_WINDOW_MS;
  return { status: online ? 'Online' : 'Sem sinal', battery: null as number | null, online };
}

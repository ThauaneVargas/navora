const INDOOR_LOG_PREFIX = '[Navora indoor]';
const DEFAULT_RSSI_WINDOW_SIZE = 5;

const nowIso = () => new Date().toISOString();

const isDevelopment = () => {
  if (typeof __DEV__ !== 'undefined') return Boolean(__DEV__);
  return process.env.NODE_ENV !== 'production';
};

export function indoorLog(event, details = {}) {
  if (!isDevelopment()) return;
  const safeDetails = Object.fromEntries(
    Object.entries(details).filter(([key]) => !['token', 'password', 'patient', 'patientName', 'user'].includes(key))
  );
  console.log(INDOOR_LOG_PREFIX, event, safeDetails);
}

export function normalizeIndoorLocationEvent(event = {}) {
  return {
    source: event.source || 'simulated',
    identifier: event.identifier || event.beaconCode || event.beacon_code || event.code || null,
    uuid: event.uuid || null,
    major: event.major ?? null,
    minor: event.minor ?? null,
    manufacturerData: event.manufacturerData || null,
    rssi: Number.isFinite(Number(event.rssi)) ? Number(event.rssi) : null,
    txPower: Number.isFinite(Number(event.txPower)) ? Number(event.txPower) : null,
    detectedAt: event.detectedAt || nowIso(),
  };
}

export class SimulatedIndoorLocationProvider {
  constructor() {
    this.listeners = new Set();
    this.running = false;
    this.lastEvent = null;
  }

  start() {
    this.running = true;
    indoorLog('scanner_started', { source: 'simulated' });
    return this.getStatus();
  }

  stop() {
    this.running = false;
    indoorLog('scanner_stopped', { source: 'simulated' });
    return this.getStatus();
  }

  subscribe(listener) {
    if (typeof listener !== 'function') return () => {};
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  getStatus() {
    return {
      source: 'simulated',
      state: this.running ? 'running' : 'stopped',
      supported: true,
      lastEvent: this.lastEvent,
    };
  }

  async emitSimulatedDetection(event = {}) {
    const detection = normalizeIndoorLocationEvent({
      source: 'simulated',
      ...event,
    });
    this.lastEvent = detection;
    indoorLog('simulated_detection_emitted', {
      identifier: detection.identifier,
      rssi: detection.rssi,
      detectedAt: detection.detectedAt,
    });

    const results = [];
    for (const listener of this.listeners) {
      results.push(await listener(detection));
    }
    return results;
  }
}

export class UnsupportedIndoorLocationProvider {
  subscribe() {
    return () => {};
  }

  start() {
    return this.getStatus();
  }

  stop() {
    return this.getStatus();
  }

  getStatus() {
    return {
      source: 'ble',
      state: 'unsupported',
      supported: false,
      reason: 'BLE real ainda nao foi configurado para este ambiente.',
    };
  }
}

export function createRssiSample(sample = {}) {
  return {
    beaconIdentifier: sample.beaconIdentifier || sample.identifier || null,
    rssi: Number.isFinite(Number(sample.rssi)) ? Number(sample.rssi) : null,
    txPower: Number.isFinite(Number(sample.txPower)) ? Number(sample.txPower) : null,
    timestamp: sample.timestamp || nowIso(),
  };
}

export function appendRssiSample(window = [], sample = {}, options = {}) {
  const maxSize = Number.isInteger(options.maxSize) && options.maxSize > 0
    ? options.maxSize
    : DEFAULT_RSSI_WINDOW_SIZE;
  return [...window, createRssiSample(sample)].slice(-maxSize);
}

export function summarizeRssiWindow(window = []) {
  const values = window
    .map((sample) => sample.rssi)
    .filter((rssi) => Number.isFinite(rssi))
    .sort((left, right) => left - right);

  if (!values.length) {
    return { count: 0, medianRssi: null, averageRssi: null };
  }

  const middle = Math.floor(values.length / 2);
  const medianRssi = values.length % 2
    ? values[middle]
    : (values[middle - 1] + values[middle]) / 2;
  const averageRssi = values.reduce((sum, rssi) => sum + rssi, 0) / values.length;

  return {
    count: values.length,
    medianRssi,
    averageRssi,
  };
}

const simulatedProvider = new SimulatedIndoorLocationProvider();
const unsupportedBleProvider = new UnsupportedIndoorLocationProvider();

export const indoorLocationService = {
  provider: simulatedProvider,
  realBleProvider: unsupportedBleProvider,
  start: () => simulatedProvider.start(),
  stop: () => simulatedProvider.stop(),
  subscribe: (listener) => simulatedProvider.subscribe(listener),
  getStatus: () => simulatedProvider.getStatus(),
  emitSimulatedDetection: (event) => simulatedProvider.emitSimulatedDetection(event),
  normalizeIndoorLocationEvent,
};

export default indoorLocationService;

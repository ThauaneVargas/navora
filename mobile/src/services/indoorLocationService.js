import { PermissionsAndroid, Platform } from 'react-native';
import Constants from 'expo-constants';
import {
  NAVORA_IBEACON_UUID,
  beaconKey,
  extractIBeacon,
  findNavoraBeacon,
  selectStableBeacon,
} from './ibeacon';

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

// --- BLE real (Feasycom FSC-BP104D, pacotes iBeacon) -------------------------
//
// OPCIONAL por regra do projeto. Só liga com EXPO_PUBLIC_BLE_ENABLED=true, e
// mesmo assim qualquer impedimento (Expo Go, iPhone, Bluetooth desligado,
// permissão negada, nenhum beacon por perto) só deixa o provider parado com uma
// mensagem — o app segue com a escolha manual da entrada.
//
// iPhone: o iOS não entrega pacotes iBeacon pelo Bluetooth comum (só pelo
// CoreLocation), então este provider é só Android por enquanto.

export const isBleFeatureEnabled = () => process.env.EXPO_PUBLIC_BLE_ENABLED === 'true';

const BLE_EVALUATE_EVERY_MS = 1000;
const BLE_FORGET_AFTER_MS = 30000; // tira da lista beacon não ouvido há 30 s
const BLE_SCAN_MODE_BALANCED = 1; // BleScanMode.Balanced do react-native-ble-manager

// Estados em que o provider não vai ler beacon (o app usa a escolha manual).
export const BLE_BLOCKED_STATES = ['disabled', 'expo_go', 'ios_unsupported', 'unsupported', 'permission_denied', 'bluetooth_off', 'error'];

const BLE_MESSAGES = {
  disabled: 'A localização automática por Bluetooth está desligada nesta versão do app. Escolha sua entrada na tela.',
  expo_go: 'A localização automática não funciona no Expo Go. Escolha sua entrada na tela.',
  ios_unsupported: 'No iPhone, a localização automática ainda não está disponível. Escolha sua entrada na tela.',
  unsupported: 'Este aparelho não tem o Bluetooth necessário. Escolha sua entrada na tela.',
  permission_denied: 'Sem a permissão de dispositivos próximos e localização, não consigo reconhecer os pontos do hospital. Você pode permitir nas configurações do celular ou escolher sua entrada na tela.',
  bluetooth_off: 'O Bluetooth está desligado. Ligue o Bluetooth para o app reconhecer onde você está, ou escolha sua entrada na tela.',
  error: 'Não consegui usar o Bluetooth agora. Escolha sua entrada na tela.',
  scanning: 'Procurando os pontos de referência do hospital...',
  paused: 'Leitura pausada enquanto o app está em segundo plano.',
  stopped: 'Localização automática parada.',
};

function blockedEnvironment() {
  if (!isBleFeatureEnabled()) return 'disabled';
  if (Platform.OS === 'ios') return 'ios_unsupported';
  if (Platform.OS !== 'android') return 'unsupported';
  if (Constants.executionEnvironment === 'storeClient') return 'expo_go';
  return null;
}

// Android 12+ (API 31): BLUETOOTH_SCAN + localização precisa. Antes: só localização.
// Nada de localização em segundo plano: a leitura é só com o app aberto.
async function requestBlePermissions() {
  const { BLUETOOTH_SCAN, ACCESS_FINE_LOCATION } = PermissionsAndroid.PERMISSIONS;
  const needed = Platform.Version >= 31 ? [BLUETOOTH_SCAN, ACCESS_FINE_LOCATION] : [ACCESS_FINE_LOCATION];
  const result = await PermissionsAndroid.requestMultiple(needed);
  return needed.every((permission) => result[permission] === PermissionsAndroid.RESULTS.GRANTED);
}

// Carregado só quando o BLE vai ser usado: no Expo Go o módulo nativo não existe.
const loadBleManager = () => require('react-native-ble-manager').default;

export class BleIndoorLocationProvider {
  constructor() {
    this.listeners = new Set();
    this.state = 'stopped';
    this.wanted = false; // alguém pediu a leitura (volta sozinha quando o app reabre)
    this.starting = null;
    this.manager = null;
    this.managerStarted = false;
    this.bluetoothStateSubscription = null; // vive enquanto o app estiver aberto
    this.discoverSubscription = null; // vive só durante a leitura
    this.evaluateTimer = null;
    this.readings = new Map(); // "major:minor" -> { uuid, major, minor, txPower, samples, lastSeenAt }
    this.selection = { currentKey: null, challengerKey: null, challengerWins: 0 };
    this.lastEvent = null;
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
      source: 'ble',
      state: this.state,
      supported: !['disabled', 'expo_go', 'ios_unsupported', 'unsupported'].includes(this.state),
      message: BLE_MESSAGES[this.state] || '',
      currentBeaconKey: this.selection.currentKey,
      lastEvent: this.lastEvent,
    };
  }

  // Lista para a tela de diagnóstico: um item por beacon do Navora ouvido.
  getDetectedBeacons(now = Date.now()) {
    return [...this.readings.entries()]
      .map(([key, reading]) => ({
        key,
        major: reading.major,
        minor: reading.minor,
        txPower: reading.txPower,
        deviceId: reading.deviceId,
        ...summarizeRssiWindow(reading.samples),
        lastSeenAt: reading.lastSeenAt,
        secondsAgo: Math.round((now - reading.lastSeenAt) / 1000),
        beacon: findNavoraBeacon(reading.major, reading.minor),
        isCurrent: key === this.selection.currentKey,
      }))
      .sort((left, right) => (right.medianRssi ?? -999) - (left.medianRssi ?? -999));
  }

  start() {
    this.wanted = true;
    return this.resume();
  }

  stop() {
    this.wanted = false;
    this.halt('stopped');
    return this.getStatus();
  }

  // Chamado quando o app vai pra segundo plano: para a leitura, mas lembra que era pra ler.
  pause() {
    if (this.state === 'scanning') this.halt('paused');
    return this.getStatus();
  }

  // Chamado quando o app volta: retoma só se alguém tinha pedido a leitura.
  async resume() {
    if (!this.wanted || this.state === 'scanning') return this.getStatus();
    if (!this.starting) {
      this.starting = this.beginScan().finally(() => {
        this.starting = null;
      });
    }
    await this.starting;
    return this.getStatus();
  }

  async beginScan() {
    const blocked = blockedEnvironment();
    if (blocked) return this.setState(blocked);

    try {
      if (!(await requestBlePermissions())) return this.setState('permission_denied');

      this.manager = this.manager || loadBleManager();
      if (!this.managerStarted) {
        await this.manager.start({ showAlert: false });
        this.managerStarted = true;
        // Se a pessoa ligar/desligar o Bluetooth com o app aberto, acompanha.
        this.bluetoothStateSubscription = this.manager.onDidUpdateState(({ state }) => this.handleBluetoothState(state));
      }

      if ((await this.manager.checkState()) !== 'on') return this.setState('bluetooth_off');

      this.discoverSubscription = this.manager.onDiscoverPeripheral((peripheral) => this.handlePeripheral(peripheral));
      await this.manager.scan({ seconds: 0, allowDuplicates: true, scanMode: BLE_SCAN_MODE_BALANCED });
      this.evaluateTimer = setInterval(() => this.evaluate(), BLE_EVALUATE_EVERY_MS);
      this.setState('scanning');
    } catch (error) {
      indoorLog('ble_error', { message: error?.message || String(error) });
      this.halt('error');
    }
    return this.getStatus();
  }

  handleBluetoothState(bluetoothState) {
    if (bluetoothState === 'on' && this.state === 'bluetooth_off') this.resume();
    if (bluetoothState === 'off' && this.state === 'scanning') this.halt('bluetooth_off');
  }

  halt(nextState) {
    clearInterval(this.evaluateTimer);
    this.evaluateTimer = null;
    this.discoverSubscription?.remove?.();
    this.discoverSubscription = null;
    if (this.state === 'scanning') this.manager?.stopScan?.().catch(() => {});
    this.readings.clear();
    this.selection = { currentKey: null, challengerKey: null, challengerWins: 0 };
    this.setState(nextState);
  }

  setState(nextState) {
    if (this.state !== nextState) indoorLog('ble_state', { from: this.state, to: nextState });
    this.state = nextState;
    return this.getStatus();
  }

  handlePeripheral(peripheral) {
    const ibeacon = extractIBeacon(peripheral?.advertising);
    if (!ibeacon || ibeacon.uuid !== NAVORA_IBEACON_UUID) return; // só beacons do Navora

    const key = beaconKey(ibeacon.major, ibeacon.minor);
    const reading = this.readings.get(key) || { ...ibeacon, samples: [] };
    reading.txPower = ibeacon.txPower;
    reading.deviceId = peripheral.id; // no Android é o MAC — confere o aparelho físico
    reading.samples = appendRssiSample(reading.samples, { beaconIdentifier: key, rssi: peripheral.rssi, txPower: ibeacon.txPower });
    reading.lastSeenAt = Date.now();
    this.readings.set(key, reading);
  }

  // 1x por segundo: decide o beacon atual com a regra de estabilidade e só
  // avisa o app quando ele muda de verdade.
  evaluate(now = Date.now()) {
    for (const [key, reading] of this.readings) {
      if (now - reading.lastSeenAt > BLE_FORGET_AFTER_MS) this.readings.delete(key);
    }

    const summaries = this.getDetectedBeacons(now).map(({ key, medianRssi, count, lastSeenAt }) => ({ key, medianRssi, count, lastSeenAt }));
    const { changed, ...selection } = selectStableBeacon(summaries, this.selection, now);
    this.selection = selection;
    if (!changed || !selection.currentKey) return;

    const reading = this.readings.get(selection.currentKey);
    const summary = summaries.find((item) => item.key === selection.currentKey);
    const event = normalizeIndoorLocationEvent({
      source: 'ble',
      identifier: `ibeacon:${selection.currentKey}`,
      uuid: reading.uuid,
      major: reading.major,
      minor: reading.minor,
      rssi: summary.medianRssi,
      txPower: reading.txPower,
    });
    this.lastEvent = event;
    indoorLog('ble_beacon_changed', { identifier: event.identifier, rssi: event.rssi });
    for (const listener of this.listeners) {
      Promise.resolve()
        .then(() => listener(event))
        .catch((error) => indoorLog('ble_listener_error', { message: error?.message }));
    }
  }
}

const simulatedProvider = new SimulatedIndoorLocationProvider();
const bleProvider = new BleIndoorLocationProvider();

// Com a flag ligada, o provider ativo é o BLE real; sem ela, o simulado (dev).
const activeProvider = () => (isBleFeatureEnabled() ? bleProvider : simulatedProvider);

export const indoorLocationService = {
  provider: simulatedProvider,
  realBleProvider: bleProvider,
  isRealBleEnabled: isBleFeatureEnabled,
  start: () => activeProvider().start(),
  stop: () => activeProvider().stop(),
  pause: () => (isBleFeatureEnabled() ? bleProvider.pause() : simulatedProvider.getStatus()),
  resume: () => (isBleFeatureEnabled() ? bleProvider.resume() : simulatedProvider.getStatus()),
  subscribe: (listener) => activeProvider().subscribe(listener),
  getStatus: () => activeProvider().getStatus(),
  getDetectedBeacons: () => bleProvider.getDetectedBeacons(),
  emitSimulatedDetection: (event) => simulatedProvider.emitSimulatedDetection(event),
  normalizeIndoorLocationEvent,
};

export default indoorLocationService;

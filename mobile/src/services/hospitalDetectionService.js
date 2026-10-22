import {
  getAreaById,
  getEntranceByAreaId,
  getEntranceByBeaconCode,
  getHospitalEnvironment,
} from '../data/routes';

const listeners = new Set();

let currentState = {
  arrivalStatus: 'OUTSIDE',
  status: 'outside',
  activeHospital: null,
  detectedEntrance: null,
  source: 'development_fallback',
  confidence: 'low',
};

const emit = () => {
  listeners.forEach((listener) => listener(currentState));
};

export const hospitalDetectionService = {
  getSnapshot() {
    return currentState;
  },

  subscribe(listener) {
    listeners.add(listener);
    listener(currentState);
    return () => listeners.delete(listener);
  },

  startDetecting() {
    currentState = {
      ...currentState,
      arrivalStatus: currentState.arrivalStatus || 'OUTSIDE',
      status: 'detecting',
      source: 'simulated',
      confidence: 'low',
    };
    emit();
    return currentState;
  },

  markNearby(areaId = 'private') {
    const area = getAreaById(areaId === 'unknown' ? 'private' : areaId);
    currentState = {
      arrivalStatus: 'NEAR_HOSPITAL',
      status: 'nearby',
      activeHospital: getHospitalEnvironment(area.id),
      detectedEntrance: null,
      source: 'simulated_geofence',
      confidence: 'medium',
    };
    emit();
    return currentState;
  },

  confirmArrival(areaId = 'private', detection = {}) {
    const area = getAreaById(areaId === 'unknown' ? 'private' : areaId);
    const detectedEntrance =
      detection.detectedEntrance ||
      getEntranceByBeaconCode(detection.beacon_code || detection.beaconCode) ||
      getEntranceByAreaId(area.id);
    const hasBeacon = Boolean(detection.beacon_code || detection.beaconCode);
    const fromRealBle = detection.indoor_event?.source === 'ble';
    currentState = {
      arrivalStatus: 'INDOOR',
      status: 'confirmed',
      activeHospital: getHospitalEnvironment(area.id, { ...detection, detectedEntrance }),
      detectedEntrance,
      source: fromRealBle ? 'ble_beacon' : hasBeacon ? 'simulated_beacon' : 'manual_fallback',
      confidence: fromRealBle ? 'high' : hasBeacon ? 'simulated_high' : 'fallback',
    };
    emit();
    return currentState;
  },

  reset() {
    currentState = {
      arrivalStatus: 'OUTSIDE',
      status: 'outside',
      activeHospital: null,
      detectedEntrance: null,
      source: 'development_fallback',
      confidence: 'low',
    };
    emit();
    return currentState;
  },
};

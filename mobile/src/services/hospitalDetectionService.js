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
    currentState = {
      arrivalStatus: 'INDOOR',
      status: 'confirmed',
      activeHospital: getHospitalEnvironment(area.id, { ...detection, detectedEntrance }),
      detectedEntrance,
      source: detection.beacon_code || detection.beaconCode ? 'simulated_beacon' : 'manual_fallback',
      confidence: detection.beacon_code || detection.beaconCode ? 'simulated_high' : 'fallback',
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

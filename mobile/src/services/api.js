import {
  fallbackAccessCheck,
  fallbackRoutePreview,
  fallbackNavigationBootstrap,
  normalizeApiEnvelope,
  normalizeAreas,
  normalizeDestinations,
  normalizeNavigationBootstrap,
  normalizeRoutePreview,
} from './navigationAdapter';
import { getAuthToken } from './authToken';

const configuredApiUrl = process.env.EXPO_PUBLIC_NAVORA_API_URL;
const API_BASE_URL = (configuredApiUrl || 'http://localhost:8000').replace(/\/$/, '');

if (!configuredApiUrl) {
  console.warn(
    'EXPO_PUBLIC_NAVORA_API_URL nao configurada. Usando http://localhost:8000 apenas para desenvolvimento local/emulador.'
  );
}

const fallbackCall = (payload = {}) => ({
  id: `LOCAL-${Date.now()}`,
  status: 'PENDING',
  created_at: new Date().toISOString(),
  demoMode: true,
  ...payload,
});

const fallbackVisitorAccess = (payload = {}) => ({
  id: `LOCAL-VIS-${Date.now()}`,
  visitor_name: payload.visitor_name || 'Visitante Navora',
  area_id: payload.area_id || payload.area || 'private',
  area: payload.area_name || payload.area || 'HMC Private',
  area_name: payload.area_name || 'HMC Private',
  entrance: payload.entrance || 'Entrada pelos fundos',
  entry: payload.entry || payload.entrance || 'Entrada pelos fundos',
  requested_destination: payload.requested_destination || 'Recepcao',
  reason: payload.reason || 'Visita',
  accessibility: payload.accessibility || 'Nao',
  current_location: payload.current_location || 'Entrada',
  current_beacon: payload.current_beacon || 'MBM04-01',
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  demoMode: true,
});

export class NavoraApiError extends Error {
  constructor(message, { status, network = false, payload } = {}) {
    super(message);
    this.name = 'NavoraApiError';
    this.status = status;
    this.network = network;
    this.payload = payload;
  }
}

export const isAuthError = (error) => error?.status === 401 || error?.status === 403;
export const isNetworkError = (error) => Boolean(error?.network);

async function parseResponse(response) {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (error) {
    return text;
  }
}

async function request(path, options = {}, fallback) {
  const { authenticated = false, headers, ...fetchOptions } = options;
  try {
    const token = authenticated ? await getAuthToken() : null;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      ...fetchOptions,
    });
    const data = await parseResponse(response);

    if (!response.ok) {
      throw new NavoraApiError(`Erro na API Navora: ${response.status}`, {
        status: response.status,
        payload: data,
      });
    }

    return data;
  } catch (error) {
    const apiError =
      error instanceof NavoraApiError
        ? error
        : new NavoraApiError(error?.message || 'API indisponivel', { network: true });
    if (apiError.network) {
      if (typeof fallback === 'function') return fallback(apiError);
      if (fallback !== undefined) return fallback;
    }
    throw apiError;
  }
}

async function navigationRequest(path, options = {}, fallbackData, normalizer = (value) => value) {
  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...(options.headers || {}),
      },
      ...options,
    });

    if (!response.ok) {
      throw new Error(`Erro na API Navora: ${response.status}`);
    }

    return normalizeApiEnvelope(normalizer(await response.json()), 'api');
  } catch (error) {
    const data = typeof fallbackData === 'function' ? fallbackData(error) : fallbackData;
    return normalizeApiEnvelope(normalizer(data), 'fallback');
  }
}

export const navoraApi = {
  healthCheck: () => request('/health', {}, { status: 'offline', service: 'Navora Backend', demoMode: true }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }, { access_token: 'demo', user: { role: 'PATIENT' }, demoMode: true }),
  getAuthMe: () => request('/auth/me', { authenticated: true }),
  registerPatient: (payload) => request('/patients/register', { method: 'POST', body: JSON.stringify(payload) }, { message: 'Paciente registrado localmente', patient: payload, demoMode: true }),
  getMyPatientProfile: () => request('/patients/me', { authenticated: true }, { name: 'Paciente Navora', demoMode: true }),
  updateMyPatientProfile: (payload) => request('/patients/me', { method: 'PUT', authenticated: true, body: JSON.stringify(payload) }),
  updateAccessibility: (payload) =>
    request('/patients/me/accessibility', { method: 'PUT', authenticated: true, body: JSON.stringify(payload) }, { accessibility: payload, demoMode: true }),
  createCall: (payload) =>
    request('/calls', { method: 'POST', body: JSON.stringify(payload) }, () => fallbackCall(payload)),
  createHelpRequest: (payload) =>
    request('/calls/help', { method: 'POST', body: JSON.stringify(payload) }, () => fallbackCall(payload)),
  createSos: (payload) =>
    request('/calls/sos', { method: 'POST', body: JSON.stringify(payload) }, () => fallbackCall(payload)),
  getCalls: () => request('/calls', {}, []),
  createVisitorAccessRequest: (payload) =>
    request('/visitor-access', { method: 'POST', body: JSON.stringify(payload) }, () => fallbackVisitorAccess(payload)),
  getVisitorAccessRequest: (id) =>
    request(`/visitor-access/${id}`, {}, () => fallbackVisitorAccess({ id })),
  getVisitorAccessRequests: () => request('/visitor-access', {}, []),
  detectBeacon: (beaconCode) =>
    request(
      '/beacons/detect',
      { method: 'POST', body: JSON.stringify({ beaconCode }) },
      {
        detected: false,
        api_offline: true,
        demoMode: true,
      }
    ),
  getNotifications: () => request('/notifications', {}, []),
  getRoutes: () => request('/routes', {}, []),
  getNavigationBootstrap: () =>
    navigationRequest('/navigation/bootstrap', {}, fallbackNavigationBootstrap, normalizeNavigationBootstrap),
  getNavigationAreas: () =>
    navigationRequest('/navigation/areas', {}, fallbackNavigationBootstrap.areas, normalizeAreas),
  getNavigationDestinations: (filters = {}) => {
    const query = new URLSearchParams(filters).toString();
    return navigationRequest(
      `/navigation/destinations${query ? `?${query}` : ''}`,
      {},
      fallbackNavigationBootstrap.destinations,
      normalizeDestinations
    );
  },
  getNavigationDestination: (id) =>
    navigationRequest(`/navigation/destinations/${id}`, {}, null),
  checkNavigationAccess: (payload, fallbackDestination) =>
    navigationRequest(
      '/navigation/access-check',
      { method: 'POST', body: JSON.stringify(payload) },
      () => fallbackAccessCheck(payload, fallbackDestination)
    ),
  getRoutePreview: async (payload, fallbackDestination) => {
    try {
      const data = await request('/navigation/route-preview', {
        method: 'POST',
        authenticated: payload?.subject === 'PATIENT',
        body: JSON.stringify(payload),
      });
      return normalizeApiEnvelope(normalizeRoutePreview(data, 'api', fallbackDestination), 'api');
    } catch (error) {
      if (isNetworkError(error)) {
        return normalizeApiEnvelope(
          normalizeRoutePreview(fallbackRoutePreview(payload, fallbackDestination), 'fallback', fallbackDestination),
          'fallback'
        );
      }
      throw error;
    }
  },
};

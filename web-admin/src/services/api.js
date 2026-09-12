import { clearAdminSession, getAdminToken } from './adminToken.js';

const configuredApiUrl = import.meta.env.VITE_NAVORA_API_URL;
const API_BASE_URL = (configuredApiUrl || 'http://localhost:8000').replace(/\/$/, '');

if (!configuredApiUrl) {
  console.info('VITE_NAVORA_API_URL nao configurada. Usando http://localhost:8000 para desenvolvimento local.');
}

export class AdminApiError extends Error {
  constructor(message, { status, network = false, payload } = {}) {
    super(message);
    this.name = 'AdminApiError';
    this.status = status;
    this.network = network;
    this.payload = payload;
  }
}

export const isAuthError = (error) => error?.status === 401 || error?.status === 403;
export const isUnauthorizedError = (error) => error?.status === 401;
export const isForbiddenError = (error) => error?.status === 403;
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
    const token = authenticated ? getAdminToken() : null;
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
      if (authenticated && response.status === 401) {
        clearAdminSession();
      }

      throw new AdminApiError(`Erro na API Navora: ${response.status}`, {
        status: response.status,
        payload: data,
      });
    }

    return data;
  } catch (error) {
    const apiError =
      error instanceof AdminApiError
        ? error
        : new AdminApiError(error?.message || 'API indisponivel', { network: true });
    if (apiError.network) {
      if (typeof fallback === 'function') return fallback(apiError);
      if (fallback !== undefined) return fallback;
    }
    throw apiError;
  }
}

async function requestFromApi(path, options = {}) {
  return {
    data: await request(path, options),
    source: 'api',
  };
}

const fallbackSummary = {
  source: 'fallback',
  totalCalls: 5,
  openCalls: 4,
  activeSOS: 1,
  activeHelp: 2,
  pendingVisitorRequests: 1,
  approvedVisitors: 1,
  deniedVisitors: 0,
  closedCalls: 1,
  patientUsers: 3,
  staffUsers: 2,
  privateUsers: 3,
  susUsers: 0,
  beaconsOnline: 5,
  beaconsTotal: 5,
  beaconsOffline: 0,
  sectorsTotal: 7,
  destinationsTotal: 0,
  callStatusCounts: {},
  callTypeCounts: {},
  visitorStatusCounts: {},
  beaconStatusCounts: {},
  simulated: {
    peopleInHospital: true,
    flow: true,
    waitingTime: true,
  },
  demoMode: true,
};

export const adminApi = {
  healthCheck: () => request('/health', {}, { status: 'offline', demoMode: true }),
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getAuthMe: () => request('/auth/me', { authenticated: true }),
  getCalls: () => request('/calls', { authenticated: true }, []),
  updateCallStatus: (id, status) =>
    request(`/calls/${id}/status`, { method: 'PATCH', authenticated: true, body: JSON.stringify({ status }) }, { id, status, demoMode: true }),
  getVisitorAccessRequests: (status) =>
    request(status ? `/visitor-access?status=${encodeURIComponent(status)}` : '/visitor-access', { authenticated: true }, []),
  approveVisitorAccess: (id, data) =>
    request(`/visitor-access/${id}/approve`, { method: 'PATCH', authenticated: true, body: JSON.stringify(data) }, { id, ...data, status: 'APPROVED', demoMode: true }),
  authorizeVisitorAccess: (id, payload) =>
    request(`/visitor-access/${id}/approve`, { method: 'PATCH', authenticated: true, body: JSON.stringify(payload) }, { id, ...payload, status: 'APPROVED', demoMode: true }),
  denyVisitorAccess: (id, deniedReason) =>
    request(`/visitor-access/${id}/deny`, { method: 'PATCH', authenticated: true, body: JSON.stringify(typeof deniedReason === 'string' ? { deniedReason } : deniedReason) }, { id, status: 'DENIED', deniedReason, demoMode: true }),
  updateVisitorAccessStatus: (id, status) =>
    request(`/visitor-access/${id}/status`, { method: 'PATCH', authenticated: true, body: JSON.stringify({ status }) }, { id, status, demoMode: true }),
  getDashboardSummary: () => request('/dashboard/summary', { authenticated: true }, fallbackSummary),
  getCheckIns: () => request('/check-ins', { authenticated: true }),
  createCheckIn: (payload) => request('/check-ins', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  updateCheckInStatus: (id, status) =>
    request(`/check-ins/${id}/status`, { method: 'PATCH', authenticated: true, body: JSON.stringify({ status }) }),
  getOperationalMessages: () => request('/operational-messages', { authenticated: true }),
  createOperationalMessage: (payload) =>
    request('/operational-messages', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  markOperationalMessageRead: (id) =>
    request(`/operational-messages/${id}/read`, { method: 'PATCH', authenticated: true }),
  getBeacons: () => requestFromApi('/beacons', { authenticated: true }),
  getSectors: () => requestFromApi('/sectors', { authenticated: true }),
  getNavigationBootstrap: () => requestFromApi('/navigation/bootstrap', { authenticated: true }),
  getNavigationAreas: () => requestFromApi('/navigation/areas', { authenticated: true }),
  getNavigationDestinations: () => requestFromApi('/navigation/destinations', { authenticated: true }),
  getNavigationMap: () => requestFromApi('/navigation/map', { authenticated: true }),
  generateAdminReport: (payload = {}) =>
    request('/reports/admin', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }, { demoMode: true }),
  createStaff: (payload) =>
    request('/auth/register-staff', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
};

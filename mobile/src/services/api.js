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
import { findNavoraBeacon } from './ibeacon';
import {
  loadNavigationSnapshot,
  loadRoutePreview,
  saveNavigationSnapshot,
  saveRoutePreview,
} from './offlineDatabase';
import { setConnectionStatus } from './connectionStatus';

// Com mapa já salvo no celular, não espera a API mais que isso para abrir:
// sinal fraco no hospital (subsolo, elevador) deixava o app parado no splash.
// A resposta que chegar depois atualiza o mapa em segundo plano (onUpdate).
const BOOTSTRAP_WAIT_WITH_CACHE_MS = 6000;

async function fetchNavigationBootstrap() {
  const response = await fetch(`${API_BASE_URL}/navigation/bootstrap`, {
    headers: { 'Content-Type': 'application/json', ...HOSPITAL_HEADERS },
  });
  setConnectionStatus({ offline: false });
  if (!response.ok) throw new Error(`Erro na API Navora: ${response.status}`);
  const raw = await response.json();
  await saveNavigationSnapshot(HOSPITAL_CODE, raw);
  setConnectionStatus({ syncedAt: new Date().toISOString() });
  return normalizeApiEnvelope(normalizeNavigationBootstrap(raw), 'api');
}

const configuredApiUrl = process.env.EXPO_PUBLIC_NAVORA_API_URL;
const API_BASE_URL = (configuredApiUrl || 'http://localhost:8000').replace(/\/$/, '');

// Hospital em que o app esta (cada hospital cliente do Navora tem um codigo).
// Vai em toda requisicao no header X-Hospital: o backend so mostra o mapa, os
// beacons e recebe SOS/visita deste hospital. Sem a variavel, "hmc".
export const HOSPITAL_CODE = (process.env.EXPO_PUBLIC_HOSPITAL_CODE || 'hmc').trim().toLowerCase();
const HOSPITAL_HEADERS = { 'X-Hospital': HOSPITAL_CODE };

if (!configuredApiUrl) {
  console.warn(
    'EXPO_PUBLIC_NAVORA_API_URL nao configurada. Usando http://localhost:8000 apenas para desenvolvimento local/emulador.'
  );
}

const fallbackVisitorAccess = (payload = {}) => ({
  id: `LOCAL-VIS-${Date.now()}`,
  visitor_name: payload.visitor_name || 'Visitante Navora',
  area_id: payload.area_id || payload.area || 'private',
  area: payload.area_name || payload.area || 'Hospital ativo',
  area_name: payload.area_name || 'Hospital ativo',
  entrance: payload.entrance || 'Entrada pelos fundos',
  entry: payload.entry || payload.entrance || 'Entrada pelos fundos',
  requested_destination: payload.requested_destination || 'Recepcao',
  reason: payload.reason || 'Visita',
  accessibility: payload.accessibility || 'Nao',
  current_location: payload.current_location || 'Entrada',
  current_beacon: payload.current_beacon || 'FSC-01',
  status: 'PENDING',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  demoMode: true,
});

function beaconDetectionPayload(beacon) {
  if (typeof beacon === 'string') return { beaconCode: beacon };
  if (beacon?.uuid && Number.isInteger(beacon.major) && Number.isInteger(beacon.minor)) {
    return {
      uuid: beacon.uuid,
      major: beacon.major,
      minor: beacon.minor,
      // A mediana pode vir quebrada (ex.: -64.5) e o backend só aceita inteiro.
      ...(Number.isFinite(beacon.rssi) ? { rssi: Math.round(beacon.rssi) } : {}),
    };
  }
  return { beaconCode: beacon?.identifier || beacon?.beaconCode || null };
}

// API fora do ar: resolve pela tabela local dos beacons do Navora (ibeacon.js),
// pra a localização automática não depender do backend estar acordado.
function offlineBeaconDetection(payload) {
  const known = Number.isInteger(payload.major) ? findNavoraBeacon(payload.major, payload.minor) : null;
  if (!known) {
    return { detected: false, api_offline: true, demoMode: true };
  }
  return {
    detected: true,
    api_offline: true,
    beacon_code: known.code,
    area: known.area,
    entrance: known.area === 'private' ? 'Entrada pelos fundos' : 'Entrada pela frente',
    navigation_node: null,
    origin_node_code: known.originNodeCode,
  };
}

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
  } catch {
    return text;
  }
}

const REQUEST_TIMEOUT_MS = 60000;

async function request(path, options = {}, fallback) {
  const { authenticated = false, headers, ...fetchOptions } = options;
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Falha ao ler o token guardado nunca pode impedir o envio (ex.: SOS).
    const token = authenticated ? await getAuthToken().catch(() => null) : null;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...HOSPITAL_HEADERS,
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
        ...(headers || {}),
      },
      signal: controller.signal,
      ...fetchOptions,
    });
    clearTimeout(timeoutId);
    // Qualquer resposta (até erro 4xx) quer dizer que o servidor foi alcançado.
    setConnectionStatus({ offline: false });
    const data = await parseResponse(response);

    if (!response.ok) {
      throw new NavoraApiError(`Erro na API Navora: ${response.status}`, {
        status: response.status,
        payload: data,
      });
    }

    return data;
  } catch (error) {
    clearTimeout(timeoutId);
    const isTimeout = error?.name === 'AbortError';
    const apiError =
      error instanceof NavoraApiError
        ? error
        : new NavoraApiError(
            isTimeout ? 'Tempo limite da requisicao esgotado' : (error?.message || 'API indisponivel'),
            { network: true, timeout: isTimeout }
          );
    if (apiError.network) {
      setConnectionStatus({ offline: true });
      if (typeof fallback === 'function') return fallback(apiError);
      if (fallback !== undefined) return fallback;
    }
    throw apiError;
  }
}

async function navigationRequest(path, options = {}, fallbackData, normalizer = (value) => value) {
  try {
    const { headers, ...fetchOptions } = options;
    const response = await fetch(`${API_BASE_URL}${path}`, {
      headers: {
        'Content-Type': 'application/json',
        ...HOSPITAL_HEADERS,
        ...(headers || {}),
      },
      ...fetchOptions,
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
  login: (payload) => request('/auth/login', { method: 'POST', body: JSON.stringify(payload) }),
  getAuthMe: () => request('/auth/me', { authenticated: true }),
  registerPatient: (payload) => request('/patients/register', { method: 'POST', body: JSON.stringify(payload) }),
  getMyPatientProfile: () => request('/patients/me', { authenticated: true }),
  updateMyPatientProfile: (payload) => request('/patients/me', { method: 'PUT', authenticated: true, body: JSON.stringify(payload) }),
  // LGPD (portabilidade): tudo o que o servidor guarda da pessoa, em JSON.
  exportMyData: () => request('/patients/me/export', { authenticated: true }),
  // LGPD: exclui a conta do paciente (pede a senha de novo).
  deleteMyAccount: (password) =>
    request('/patients/me', { method: 'DELETE', authenticated: true, body: JSON.stringify({ password }) }),
  updateAccessibility: (payload) =>
    request('/patients/me/accessibility', { method: 'PUT', authenticated: true, body: JSON.stringify(payload) }, { accessibility: payload, demoMode: true }),
  // SOS, ajuda e pedido de visitante NAO tem modo offline: se nao chegou ao
  // servidor, a recepcao nao sabe — a tela tem que dizer que falhou, nunca
  // mostrar "enviado" com um protocolo local.
  // Exigem login desde 29/10: sem token (ou vencido) o backend responde 401 e
  // a tela leva a pessoa ao Login (sem esconder a ligacao para a recepcao).
  createCall: (payload) =>
    request('/calls', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  createHelpRequest: (payload) =>
    request('/calls/help', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  createSos: (payload) =>
    request('/calls/sos', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  // Andamento do proprio chamado (codigo secreto devolvido ao criar).
  getCallStatus: (id, token) =>
    request(`/calls/${id}/status`, { headers: { 'X-Call-Token': token } }),
  getCalls: () => request('/calls', {}, []),
  // Modo visita exige login (mesma conta do paciente).
  createVisitorAccessRequest: (payload) =>
    request('/visitor-access', { method: 'POST', authenticated: true, body: JSON.stringify(payload) }),
  // accessToken: código secreto que o backend devolve ao criar o pedido; sem
  // ele o backend não mostra o pedido (os ids são sequenciais).
  getVisitorAccessRequest: (id, accessToken) =>
    request(
      `/visitor-access/${id}`,
      { headers: accessToken ? { 'X-Visitor-Token': accessToken } : {} },
      () => fallbackVisitorAccess({ id })
    ),
  getVisitorAccessRequests: () => request('/visitor-access', {}, []),
  // Aceita o código interno ("FSC-01") ou o evento do scanner BLE (uuid/major/minor).
  detectBeacon: async (beacon) => {
    const payload = beaconDetectionPayload(beacon);
    const detection = await request(
      '/beacons/detect',
      { method: 'POST', body: JSON.stringify(payload) },
      () => offlineBeaconDetection(payload)
    );
    // Backend sem a busca por uuid/major/minor (ex.: produção antes do merge)
    // responde detected:false — se o beacon é do Navora, vale a tabela local.
    if (!detection?.detected) {
      const local = offlineBeaconDetection(payload);
      if (local.detected) return local;
    }
    return detection;
  },
  getNotifications: () => request('/notifications/me', { authenticated: true }, []),
  markNotificationRead: (id) => request(`/notifications/${id}/read`, { method: 'PUT', authenticated: true }),
  markAllNotificationsRead: () => request('/notifications/me/read-all', { method: 'PUT', authenticated: true }),
  deleteNotification: (id) => request(`/notifications/${id}`, { method: 'DELETE', authenticated: true }),
  // Sem modo offline: sem conexao, a tela avisa (antes dizia "verifique seu e-mail").
  forgotPassword: (email) => request('/auth/forgot-password', { method: 'POST', body: JSON.stringify({ email }) }),
  // O codigo de 6 digitos so vale junto com o e-mail da conta.
  resetPassword: (email, token, newPassword) =>
    request('/auth/reset-password', { method: 'POST', body: JSON.stringify({ email, token, newPassword }) }),
  loginWithGoogle: (idToken) => request('/auth/google', { method: 'POST', body: JSON.stringify({ idToken }) }, null),
  getRoutes: () => request('/routes', {}, []),
  // Com internet: usa a API e guarda o mapa no banco local (offlineDatabase).
  // Sem internet: lê do banco local; nunca baixou -> dados fixos (fallback).
  // Dado do banco local volta com source 'api' (é a resposta da API, só que
  // salva) e offline: true, pra as telas usarem os destinos reais.
  // onUpdate(result): chamado se a API responder depois de o app já ter
  // aberto com o mapa salvo.
  getNavigationBootstrap: async ({ onUpdate } = {}) => {
    const saved = await loadNavigationSnapshot(HOSPITAL_CODE);
    if (saved?.syncedAt) setConnectionStatus({ syncedAt: saved.syncedAt });
    const fromApi = fetchNavigationBootstrap();

    if (!saved) {
      try {
        return await fromApi;
      } catch {
        setConnectionStatus({ offline: true });
        return normalizeApiEnvelope(normalizeNavigationBootstrap(fallbackNavigationBootstrap), 'fallback');
      }
    }

    const TIMED_OUT = Symbol('timeout');
    const first = await Promise.race([
      fromApi.catch(() => null),
      new Promise((resolve) => setTimeout(() => resolve(TIMED_OUT), BOOTSTRAP_WAIT_WITH_CACHE_MS)),
    ]);
    if (first && first !== TIMED_OUT) return first;

    setConnectionStatus({ offline: true });
    if (first === TIMED_OUT) {
      fromApi.then((result) => onUpdate?.(result)).catch(() => {});
    }
    return {
      ...normalizeApiEnvelope(normalizeNavigationBootstrap(saved), 'api'),
      offline: true,
      syncedAt: saved.syncedAt,
    };
  },
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
      saveRoutePreview(HOSPITAL_CODE, payload, data);
      return normalizeApiEnvelope(normalizeRoutePreview(data, 'api', fallbackDestination), 'api');
    } catch (error) {
      if (isNetworkError(error)) {
        // Mesma rota já calculada com internet: usa a salva no banco local.
        const saved = await loadRoutePreview(HOSPITAL_CODE, payload);
        if (saved) {
          return normalizeApiEnvelope(
            {
              ...normalizeRoutePreview(saved.preview, 'api', fallbackDestination),
              offlineCache: true,
              savedAt: saved.savedAt,
            },
            'api'
          );
        }
        return normalizeApiEnvelope(
          normalizeRoutePreview(fallbackRoutePreview(payload, fallbackDestination), 'fallback', fallbackDestination),
          'fallback'
        );
      }
      throw error;
    }
  },
};

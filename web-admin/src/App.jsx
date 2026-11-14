import { useEffect, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import {
  Activity,
  BarChart3,
  Building2,
  Camera,
  ChevronRight,
  CheckCircle2,
  ClipboardCheck,
  Clock3,
  Download,
  Gauge,
  HeartPulse,
  HelpCircle,
  Map as MapIcon,
  MessageSquare,
  MoreVertical,
  Plus,
  RadioTower,
  RefreshCw,
  Search,
  Settings,
  ShieldCheck,
  UserCheck,
  Users,
} from 'lucide-react';
import {
  initialBeacons,
  initialCalls,
  initialCheckins,
  initialMessages,
  initialVisitors,
  initialSectors,
  initialSettings,
  initialStaffAccounts,
  initialUsers,
} from './data/mockData.js';
import LoginPage from './pages/Login.jsx';
import DashboardHeatmap from './components/dashboard/DashboardHeatmap.jsx';
import DashboardRecentAlerts from './components/dashboard/RecentAlerts.jsx';
import DashboardStatCard from './components/dashboard/StatCard.jsx';
import AppSidebar from './components/layout/AppSidebar.jsx';
import AppTopbar from './components/layout/AppTopbar.jsx';
import LayoutOperatorAvatar from './components/layout/OperatorAvatar.jsx';
import { adminApi } from './services/api.js';
import {
  fallbackAreasFromSectors,
  mergeSectorOperationalFallback,
  normalizeAreaFromApi,
  normalizeBeaconFromApi,
  normalizeDestinationFromApi,
  normalizeNavigationMapFromApi,
  normalizeSectorFromApi,
} from './services/navigationAdapter.js';
import { isForbiddenError, isNetworkError, isUnauthorizedError } from './services/api.js';
import { clearAdminSession, getAdminToken, getAdminUser, storeAdminSession } from './services/adminToken.js';
import './styles.css';

const adminNav = [
  ['admin-dashboard', 'Dashboard', Gauge],
  ['admin-heatmap', 'Heatmap', MapIcon],
  ['admin-alerts', 'Alertas SOS', HeartPulse],
  ['admin-users', 'Usuarios', Users],
  ['admin-beacons', 'Beacons', RadioTower],
  ['admin-reports', 'Relatorios', BarChart3],
  ['admin-settings', 'Configurações', Settings],
];

const receptionNav = [
  ['reception-dashboard', 'Painel', Gauge],
  ['reception-visitors', 'Visitantes', UserCheck],
  ['reception-access', 'Autorizacoes', ShieldCheck],
  ['reception-checkin', 'Check-ins', ClipboardCheck],
  ['reception-calls', 'Chamados', HelpCircle],
  ['reception-messages', 'Mensagens', MessageSquare],
  ['reception-settings', 'Configurações', Settings],
];

const pageLabels = Object.fromEntries([...adminNav, ...receptionNav].map(([id, label]) => [id, label]));
const pagePaths = {
  'admin-dashboard': '/admin/dashboard',
  'admin-heatmap': '/admin/heatmap',
  'admin-alerts': '/admin/alertas',
  'admin-users': '/admin/usuarios',
  'admin-beacons': '/admin/beacons',
  'admin-reports': '/admin/relatorios',
  'admin-settings': '/admin/configuracoes',
  'reception-dashboard': '/recepcao/painel',
  'reception-visitors': '/recepcao/visitantes',
  'reception-access': '/recepcao/autorizacoes',
  'reception-checkin': '/recepcao/check-ins',
  'reception-calls': '/recepcao/chamados',
  'reception-messages': '/recepcao/mensagens',
  'reception-settings': '/recepcao/configuracoes',
};
const pathPages = Object.fromEntries(Object.entries(pagePaths).map(([page, path]) => [path, page]));

// Intervalo da atualização automática do painel (chamados/SOS, visitantes, resumo).
const OPERATIONAL_REFRESH_MS = 15000;
// SOS precisa aparecer quase na hora: busca so os chamados novos/alterados.
const CALLS_FAST_REFRESH_MS = 2500;
const SOS_SOUND_KEY = 'navora.admin.sos_sound';

// Codigos do app -> texto do painel (backend-nest/src/calls/call-codes.ts).
const callNeedLabels = {
  wheelchair: 'Cadeira de rodas',
  stretcher: 'Maca',
  mobility: 'Dificuldade de locomoção',
  visual: 'Deficiência visual',
  hearing: 'Deficiência auditiva',
  companion: 'Precisa de acompanhante',
};

// Alerta sonoro do SOS sem arquivo de audio: tres bipes com Web Audio. O
// navegador so libera som depois de um clique na pagina; o login ja conta.
let sosAudioContext = null;
function unlockSosAudio() {
  try {
    const AudioCtx = window.AudioContext || window.webkitAudioContext;
    if (!AudioCtx) return;
    if (!sosAudioContext) sosAudioContext = new AudioCtx();
    if (sosAudioContext.state === 'suspended') sosAudioContext.resume();
  } catch {
    // sem audio: o alerta visual continua
  }
}
function playSosSound() {
  try {
    unlockSosAudio();
    if (!sosAudioContext) return;
    const start = sosAudioContext.currentTime;
    [0, 0.35, 0.7].forEach((offset) => {
      const osc = sosAudioContext.createOscillator();
      const gain = sosAudioContext.createGain();
      osc.type = 'square';
      osc.frequency.value = 880;
      gain.gain.setValueAtTime(0.0001, start + offset);
      gain.gain.exponentialRampToValueAtTime(0.25, start + offset + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.0001, start + offset + 0.25);
      osc.connect(gain).connect(sosAudioContext.destination);
      osc.start(start + offset);
      osc.stop(start + offset + 0.27);
    });
  } catch {
    // sem audio: o alerta visual continua
  }
}
function readSosSoundPref() {
  try {
    return window.localStorage.getItem(SOS_SOUND_KEY) !== 'off';
  } catch {
    return true;
  }
}
function saveSosSoundPref(enabled) {
  try {
    window.localStorage.setItem(SOS_SOUND_KEY, enabled ? 'on' : 'off');
  } catch {
    // preferencia so desta sessao
  }
}
const profileOverrideKey = 'navora.admin.profile_overrides';

const statusOrder = {
  Aceito: 'Aceito',
  'Equipe acionada': 'Equipe acionada',
  'Em atendimento': 'Em atendimento',
  Encerrado: 'Encerrado',
};

const callApiTypeToLabel = {
  HELP: 'Pedido de Ajuda',
  HELP_REQUEST: 'Pedido de Ajuda',
  SOS: 'SOS Emergencia',
  DOCTOR: 'Solicitar Medico',
  LOST: 'Estou Perdido',
  MOBILITY_HELP: 'Ajuda de Locomocao',
  LOST_USER: 'Estou Perdido',
};

const callApiStatusToLabel = {
  PENDING: 'Pendente',
  ACCEPTED: 'Aceito',
  TEAM_DISPATCHED: 'Equipe acionada',
  IN_PROGRESS: 'Em atendimento',
  CLOSED: 'Encerrado',
  CANCELED: 'Cancelado',
};

const roleMap = {
  ADMIN: 'admin',
  RECEPTION: 'reception',
};

const roleLabelMap = {
  admin: 'Administrador',
  reception: 'Recepção',
};

function mapUserToStaffAccount(user) {
  const role = roleMap[user?.role];
  return {
    id: `API-${user?.id}`,
    name: user?.name || 'Funcionário Navora',
    email: user?.email,
    phone: user?.phone,
    role,
    roleLabel: roleLabelMap[role] || user?.role,
    sector: role === 'admin' ? 'Gestão' : 'Recepção',
    status: user?.active === false ? 'Inativo' : 'Ativo',
    createdAt: user?.createdAt || '',
    lastLogin: 'Agora',
    authSource: 'api',
  };
}

function formatStaffDate(value) {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? String(value) : date.toLocaleDateString('pt-BR');
}

function mapStaffFromApi(staff) {
  const role = roleMap[staff?.role];
  const active = staff?.active !== false;
  return {
    id: `API-${staff?.id}`,
    apiId: staff?.id,
    name: staff?.name || 'Funcionario Navora',
    email: staff?.email,
    phone: staff?.phone,
    role,
    roleLabel: roleLabelMap[role] || staff?.role,
    sector: staff?.sector_name || staff?.job_title || (role === 'admin' ? 'Gestao' : 'Recepcao'),
    status: active ? 'Ativo' : 'Desativado',
    createdAt: formatStaffDate(staff?.created_at),
    deactivatedAt: formatStaffDate(staff?.deactivated_at),
    deactivatedBy: staff?.deactivated_by?.name || '',
    authSource: 'api',
  };
}

const callLabelToApiStatus = Object.fromEntries(
  Object.entries(callApiStatusToLabel).map(([key, value]) => [value, key])
);

const callApiPriorityToLabel = {
  LOW: 'Baixa',
  MEDIUM: 'Media',
  HIGH: 'Alta',
  CRITICAL: 'Critica',
};

function mapCallFromApi(call) {
  const created = call.created_at ? new Date(call.created_at) : null;
  return {
    id: call.id,
    patient: call.user_name || call.patient_name,
    type: callApiTypeToLabel[call.call_type] || call.call_type,
    reason: call.reason || call.message || callApiTypeToLabel[call.call_type] || 'Chamado Navora',
    location: `${call.area_name || ''} ${call.location || ''}`.trim() || call.location,
    beacon: call.beacon_code || call.sector,
    priority: callApiPriorityToLabel[call.priority] || call.priority,
    status: callApiStatusToLabel[call.status] || call.status,
    emergencyContact: call.emergency_contact || '',
    callerPhone: call.caller_phone || '',
    needs: (call.needs || []).map((code) => callNeedLabels[code] || code),
    callType: call.call_type,
    apiStatus: call.status,
    updatedAtRaw: call.updated_at || call.created_at || null,
    // Desde 29/10 todo chamado exige login. false = chamado antigo, de antes
    // da regra (ou conta excluida depois). undefined = backend antigo.
    registeredPatient: call.registered_patient,
    createdAt: created
      ? created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Agora',
    assignedTo: 'Não atribuído',
    history: ['Chamado recebido pela API'],
  };
}

const visitorApiStatusToLabel = {
  PENDING: 'Aguardando autorizacao',
  APPROVED: 'Autorizado',
  DENIED: 'Acesso negado',
  CANCELED: 'Cancelado',
  EXPIRED: 'Expirado',
  WAITING_AUTHORIZATION: 'Aguardando autorizacao',
  AUTHORIZED: 'Autorizado',
  IN_ROUTE: 'Em rota',
  ARRIVED: 'Chegou ao destino',
  OFF_ROUTE: 'Fora da rota',
  FINISHED: 'Finalizado',
};

const visitorLabelToApiStatus = Object.fromEntries(
  Object.entries(visitorApiStatusToLabel).map(([key, value]) => [value, key])
);
visitorLabelToApiStatus.Finalizado = 'FINISHED';

const checkInApiStatusToLabel = {
  WAITING: 'Aguardando',
  IN_ROUTE: 'Em rota',
  IN_SERVICE: 'Em atendimento',
  FINISHED: 'Finalizado',
  CANCELED: 'Cancelado',
};

const checkInLabelToApiStatus = Object.fromEntries(
  Object.entries(checkInApiStatusToLabel).map(([key, value]) => [value, key])
);

function mapCheckInFromApi(checkIn) {
  const created = checkIn.created_at ? new Date(checkIn.created_at) : null;
  return {
    id: checkIn.id,
    patient: checkIn.patient_name,
    document: checkIn.document || '',
    destination: checkIn.destination_label,
    status: checkInApiStatusToLabel[checkIn.status] || checkIn.status,
    time: created ? created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora',
    accessibility: checkIn.accessibility || 'Nao',
    observations: checkIn.observations || '',
  };
}

function mapMessageFromApi(message) {
  const created = message.created_at ? new Date(message.created_at) : null;
  return {
    id: message.id,
    to: message.to || message.recipient,
    message: message.message || message.content,
    priority: message.priority || 'Media',
    direction: message.direction || 'Enviada',
    time: created ? created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : 'Agora',
    readAt: message.read_at,
  };
}

function mapVisitorAccessFromApi(request) {
  const created = request.created_at ? new Date(request.created_at) : null;
  return {
    id: request.id,
    name: request.visitor_name,
    profile: 'Visitante',
    area: request.area_name || request.area,
    areaId: request.area_id || request.area,
    entry: request.entrance || request.entry,
    currentLocation: request.current_location,
    beacon: request.current_beacon || request.beacon || 'Não informado',
    requestedDestination: request.requested_destination,
    reason: request.reason,
    accessibility: request.accessibility,
    status: visitorApiStatusToLabel[request.status] || request.status,
    onlineTime: created ? `${Math.max(1, Math.round((Date.now() - created.getTime()) / 60000))} min` : 'Agora',
    allowedRoute: request.authorized_route || request.allowed_route || '',
    allowedTime: request.permission_minutes ? `${request.permission_minutes} minutos` : request.allowed_time || '',
    releaseType: request.release_type,
    denialReason: request.denial_reason,
    groupTotal: request.group_total ?? 1,
    companions: (Array.isArray(request.companions) ? request.companions : [])
      .map((companion) => `${companion?.name || 'Sem nome'}${companion?.type === 'child' ? ' (criança)' : companion?.type === 'elderly' ? ' (idoso)' : ''}`)
      .join(', ') || 'Nenhum',
    visitCode: request.visit_code || '',
    assistanceRequest: request.assistance_request || 'Não solicitado',
  };
}

function parseReleaseMinutes(releaseTime) {
  const normalized = String(releaseTime || '').toLowerCase();
  if (normalized.includes('finalizar')) return null;
  if (normalized.includes('hora')) return (Number.parseInt(normalized, 10) || 1) * 60;
  return Number.parseInt(normalized, 10) || 30;
}

function comparableLocation(value) {
  return String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+(private|sus|hospital marco capute)$/i, '');
}

function matchesSector(value, sector) {
  const target = comparableLocation(value);
  return Boolean(
    target &&
      (target === comparableLocation(sector.code) ||
        target === comparableLocation(sector.name) ||
        target === comparableLocation(sector.areaName))
  );
}

const heatmapFloorOptions = [
  { key: 'terreo', label: 'Terreo', title: 'Terreo', backend: 'Piso Terreo' },
  { key: 'andar1', label: '1o andar', title: '1o Andar', backend: '1o Andar' },
  { key: 'andar2', label: '2o andar', title: '2o Andar', backend: '2o Andar' },
  { key: 'terraco', label: 'Terraco', title: 'Terraco / Heliponto', backend: 'Terraco / Heliponto', special: true },
];

function normalizeHeatmapFloor(value) {
  const normalized = comparableLocation(value)
    .replace(/piso /g, '')
    .replace(/andar/g, '')
    .trim();
  if (!normalized) return '';
  if (normalized.includes('terraco') || normalized.includes('heliponto')) return 'terraco';
  if (normalized.includes('2o') || normalized.includes('2 ') || normalized === '2' || normalized.includes('segundo')) return 'andar2';
  if (normalized.includes('1o') || normalized.includes('1 ') || normalized === '1' || normalized.includes('primeiro')) return 'andar1';
  if (normalized.includes('terreo')) return 'terreo';
  return normalized;
}

function getHeatmapFloorOption(key) {
  return heatmapFloorOptions.find((option) => option.key === key) || heatmapFloorOptions[0];
}

function sectorBelongsToFloor(sector, floorKey) {
  return normalizeHeatmapFloor(sector.floor) === floorKey;
}

function nodeBelongsToFloor(node, floorKey) {
  return normalizeHeatmapFloor(node.floor) === floorKey;
}

function beaconBelongsToFloor(beacon, floorKey, floorSectors) {
  const directFloor = normalizeHeatmapFloor(beacon.floor || beacon.navigationNode?.floor || beacon.node?.floor);
  if (directFloor) return directFloor === floorKey;
  return floorSectors.some((sector) => matchesSector(beacon.sector || beacon.name, sector));
}

function getProfileOverrideKey(account) {
  return account?.email || account?.id || 'current';
}

function readProfileOverrides() {
  try {
    return JSON.parse(window.sessionStorage.getItem(profileOverrideKey) || '{}');
  } catch {
    window.sessionStorage.removeItem(profileOverrideKey);
    return {};
  }
}

function mergeProfileOverride(account) {
  const overrides = readProfileOverrides();
  return { ...account, ...(overrides[getProfileOverrideKey(account)] || {}) };
}

function saveProfileOverride(account, changes) {
  const key = getProfileOverrideKey(account);
  const overrides = readProfileOverrides();
  const current = overrides[key] || {};
  window.sessionStorage.setItem(profileOverrideKey, JSON.stringify({ ...overrides, [key]: { ...current, ...changes } }));
}

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
  const [authRestoring, setAuthRestoring] = useState(true);
  const [users, setUsers] = useState(initialUsers);
  const [staffAccounts, setStaffAccounts] = useState(initialStaffAccounts);
  const [staffSource, setStaffSource] = useState('fallback');
  const [calls, setCalls] = useState(initialCalls);
  const [beacons, setBeacons] = useState(initialBeacons);
  const [beaconsSource, setBeaconsSource] = useState('fallback');
  const [checkins, setCheckins] = useState(initialCheckins);
  const [sectors, setSectors] = useState(initialSectors);
  const [sectorsSource, setSectorsSource] = useState('fallback');
  const [navigationSource, setNavigationSource] = useState('fallback');
  const [navigationAreas, setNavigationAreas] = useState([]);
  const [navigationDestinations, setNavigationDestinations] = useState([]);
  const [navigationMap, setNavigationMap] = useState({ nodes: [], edges: [] });
  const [messages, setMessages] = useState(initialMessages);
  const [visitors, setVisitors] = useState(initialVisitors);
  const [settings, setSettings] = useState(initialSettings);
  const [dashboardSummary, setDashboardSummary] = useState(null);
  const [lastRefreshedAt, setLastRefreshedAt] = useState(null);
  // SOS em tempo quase real: ids ja vistos, ultima alteracao conhecida e o alerta na tela.
  const knownCallIdsRef = useRef(null);
  const lastCallSyncRef = useRef(null);
  const [sosAlert, setSosAlert] = useState(null);
  const [sosSoundEnabled, setSosSoundEnabled] = useState(readSosSoundPref);
  const [toast, setToast] = useState(null);
  const [modal, setModal] = useState(null);
  const [filters, setFilters] = useState({});

  const showToast = (message, type = 'success') => {
    setToast({ message, type, id: Date.now() });
    window.setTimeout(() => setToast(null), 3000);
  };

  const openModal = (title, content, footer = null) => setModal({ title, content, footer });
  const closeModal = () => setModal(null);
  const defaultPageForRole = (role) => (role === 'admin' ? 'admin-dashboard' : 'reception-dashboard');
  const canRoleOpenPage = (role, page) => (role === 'admin' ? page?.startsWith('admin-') : page?.startsWith('reception-'));
  const pageFromCurrentPath = (role) => {
    const page = pathPages[window.location.pathname];
    return canRoleOpenPage(role, page) ? page : defaultPageForRole(role);
  };
  const navigatePage = (page, replace = false) => {
    if (!page) return;
    setCurrentPage(page);
    window.history[replace ? 'replaceState' : 'pushState']({}, '', pagePaths[page] || pagePaths[defaultPageForRole(currentRole)]);
  };

  const enterAdminPanel = (account, replace = false) => {
    setCurrentUser(mergeProfileOverride(account));
    setCurrentRole(account.role);
    const nextPage = pageFromCurrentPath(account.role);
    setCurrentPage(nextPage);
    window.history[replace ? 'replaceState' : 'pushState']({}, '', pagePaths[nextPage]);
  };

  const leaveAdminPanel = () => {
    clearAdminSession();
    setCurrentRole(null);
    setCurrentPage(null);
    setCurrentUser(null);
    window.history.replaceState({}, '', '/login');
  };

  const handleAuthFailure = (error, forbiddenMessage = 'Acesso negado para este perfil.') => {
    if (isUnauthorizedError(error)) {
      leaveAdminPanel();
      showToast('Sessão inválida ou expirada.', 'danger');
      return true;
    }

    if (isForbiddenError(error)) {
      showToast(forbiddenMessage, 'danger');
      return true;
    }

    return false;
  };

  // Atualização automática (silent): sessão expirada ainda desloga, mas falha de
  // rede/permissão não vira aviso a cada ciclo e os dados atuais ficam na tela —
  // o backend free do Render dorme e acorda, isso é esperado.
  const handleSilentRefreshFailure = (error) => {
    if (isUnauthorizedError(error)) handleAuthFailure(error);
    return false;
  };

  const loadVisitorAccessRequests = async ({ silent = false } = {}) => {
    try {
      const requests = await adminApi.getVisitorAccessRequests();
      setVisitors(requests.map(mapVisitorAccessFromApi));
      return true;
    } catch (error) {
      if (silent) return handleSilentRefreshFailure(error);
      if (handleAuthFailure(error)) return false;
      showToast('API indisponível, mantendo dados simulados de visitantes', 'warning');
      return false;
    }
  };

  const loadCalls = async ({ silent = false } = {}) => {
    try {
      const requests = await adminApi.getCalls();
      const mapped = requests.map(mapCallFromApi);
      setCalls(mapped);
      rememberCalls(mapped);
      return true;
    } catch (error) {
      if (silent) return handleSilentRefreshFailure(error);
      if (handleAuthFailure(error)) return false;
      showToast('API indisponível, mantendo chamados simulados', 'warning');
      return false;
    }
  };

  const loadDashboardSummary = async ({ silent = false } = {}) => {
    try {
      const summary = await adminApi.getDashboardSummary();
      setDashboardSummary(summary);
      return true;
    } catch (error) {
      if (silent) return handleSilentRefreshFailure(error);
      if (handleAuthFailure(error)) return false;
      setDashboardSummary(null);
      showToast('API indisponível, mantendo resumo local', 'warning');
      return false;
    }
  };

  const loadCheckIns = async () => {
    try {
      const apiCheckIns = await adminApi.getCheckIns();
      setCheckins(Array.isArray(apiCheckIns) ? apiCheckIns.map(mapCheckInFromApi) : []);
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado aos check-ins')) {
        setCheckins([]);
        return;
      }
      setCheckins(initialCheckins);
      showToast('API indisponível, usando check-ins simulados', 'warning');
    }
  };

  const loadMessages = async () => {
    try {
      const apiMessages = await adminApi.getOperationalMessages();
      setMessages(Array.isArray(apiMessages) ? apiMessages.map(mapMessageFromApi) : []);
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado as mensagens')) {
        setMessages([]);
        return;
      }
      setMessages(initialMessages);
      showToast('API indisponível, usando mensagens simuladas', 'warning');
    }
  };

  const loadSectors = async ({ silent = false } = {}) => {
    try {
      const { data: apiSectors, source } = await adminApi.getSectors();
      if (!Array.isArray(apiSectors)) throw new Error('Formato invalido de setores');

      const structuralSectors = apiSectors.map(normalizeSectorFromApi);
      setSectors(mergeSectorOperationalFallback(structuralSectors, initialSectors));
      setSectorsSource(source);
      return true;
    } catch (error) {
      if (silent) return handleSilentRefreshFailure(error);
      if (handleAuthFailure(error)) return false;
      setSectors(initialSectors);
      setSectorsSource('fallback');
      showToast('API indisponível, usando setores simulados', 'warning');
      return false;
    }
  };

  const loadBeacons = async ({ silent = false } = {}) => {
    try {
      const { data: apiBeacons, source } = await adminApi.getBeacons();
      if (!Array.isArray(apiBeacons)) throw new Error('Formato invalido de beacons');

      setBeacons(apiBeacons.map(normalizeBeaconFromApi));
      setBeaconsSource(source);
      return true;
    } catch (error) {
      if (silent) return handleSilentRefreshFailure(error);
      if (handleAuthFailure(error)) return false;
      setBeacons(initialBeacons);
      setBeaconsSource('fallback');
      showToast('API indisponível, usando beacons simulados', 'warning');
      return false;
    }
  };

  const loadStaff = async () => {
    try {
      const { data: apiStaff, source } = await adminApi.getStaff();
      if (!Array.isArray(apiStaff)) throw new Error('Formato invalido de funcionarios');
      setStaffAccounts(apiStaff.map(mapStaffFromApi));
      setStaffSource(source);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setStaffAccounts(initialStaffAccounts);
      setStaffSource('fallback');
    }
  };

  const loadNavigationData = async () => {
    try {
      const { data: bootstrap } = await adminApi.getNavigationBootstrap();
      const [areasResult, destinationsResult, mapResult] = await Promise.all([
        Array.isArray(bootstrap?.areas) ? { data: bootstrap.areas, source: 'api' } : adminApi.getNavigationAreas(),
        Array.isArray(bootstrap?.destinations) ? { data: bootstrap.destinations, source: 'api' } : adminApi.getNavigationDestinations(),
        adminApi.getNavigationMap(),
      ]);

      if (!Array.isArray(areasResult.data)) throw new Error('Formato invalido de areas');
      if (!Array.isArray(destinationsResult.data)) throw new Error('Formato invalido de destinos');

      setNavigationAreas(areasResult.data.map(normalizeAreaFromApi));
      setNavigationDestinations(destinationsResult.data.map(normalizeDestinationFromApi));
      setNavigationMap(normalizeNavigationMapFromApi(mapResult.data));
      setNavigationSource('api');
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setNavigationAreas(fallbackAreasFromSectors(initialSectors));
      setNavigationDestinations([]);
      setNavigationMap({ nodes: [], edges: [] });
      setNavigationSource('fallback');
    }
  };

  // Dados que mudam durante o plantão (chamados/SOS, visitantes, resumo, setores, beacons).
  // silent: atualização automática, sem avisos. announce: mostra "Dados atualizados"
  // (só no clique em "Atualizar dados" — no login e no timer, não).
  const refreshOperationalData = async ({ silent = false, announce = !silent } = {}) => {
    const results = await Promise.all([
      loadCalls({ silent }),
      loadVisitorAccessRequests({ silent }),
      loadDashboardSummary({ silent }),
      loadSectors({ silent }),
      loadBeacons({ silent }),
    ]);
    const allLoaded = results.every(Boolean);
    if (allLoaded) setLastRefreshedAt(new Date());
    if (announce && allLoaded) showToast('Dados atualizados');
    return allLoaded;
  };

  useEffect(() => {
    if (currentRole) {
      refreshOperationalData({ announce: false });
      loadCheckIns();
      loadMessages();
      loadNavigationData();
      if (currentRole === 'admin') loadStaff();
    }
  }, [currentRole]);

  // Guarda o que ja foi visto. Na primeira carga nao alerta (sao chamados antigos).
  const rememberCalls = (mapped) => {
    if (!knownCallIdsRef.current) knownCallIdsRef.current = new Set();
    mapped.forEach((call) => {
      knownCallIdsRef.current.add(call.id);
      if (call.updatedAtRaw && (!lastCallSyncRef.current || call.updatedAtRaw > lastCallSyncRef.current)) {
        lastCallSyncRef.current = call.updatedAtRaw;
      }
    });
  };

  // Busca rapida: so chamados novos/alterados. Chamado novo de SOS toca o alerta.
  const syncNewCalls = async () => {
    if (!knownCallIdsRef.current || !lastCallSyncRef.current) return;
    try {
      const changed = (await adminApi.getCalls(lastCallSyncRef.current)).map(mapCallFromApi);
      if (!changed.length) return;
      const fresh = changed.filter((call) => !knownCallIdsRef.current.has(call.id));
      setCalls((items) => {
        const byId = new Map(items.map((item) => [item.id, item]));
        changed.forEach((call) => byId.set(call.id, { ...byId.get(call.id), ...call, history: byId.get(call.id)?.history || call.history }));
        return [...byId.values()].sort((a, b) => String(b.updatedAtRaw).localeCompare(String(a.updatedAtRaw)));
      });
      rememberCalls(changed);
      const newSos = fresh.find((call) => call.callType === 'SOS');
      if (newSos) {
        setSosAlert(newSos);
        if (sosSoundEnabled) playSosSound();
      } else if (fresh.length) {
        showToast(`Novo chamado: ${fresh[0].type} - ${fresh[0].patient}`, 'warning');
      }
      // Mudancas no chamado (ex.: status) atualizam o alerta aberto.
      setSosAlert((current) => (current ? changed.find((call) => call.id === current.id) || current : current));
    } catch (error) {
      if (isUnauthorizedError(error)) handleAuthFailure(error);
    }
  };

  useEffect(() => {
    if (!currentRole) return undefined;
    const unlock = () => unlockSosAudio();
    window.addEventListener('pointerdown', unlock);
    const timer = window.setInterval(syncNewCalls, CALLS_FAST_REFRESH_MS);
    return () => {
      window.clearInterval(timer);
      window.removeEventListener('pointerdown', unlock);
    };
    // syncNewCalls le refs e setters; o som segue a preferencia atual.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole, sosSoundEnabled]);

  // Titulo da aba pisca enquanto houver SOS sem resposta (aba em segundo plano).
  useEffect(() => {
    const base = 'Navora Web Admin';
    if (!sosAlert) {
      document.title = base;
      return undefined;
    }
    let on = false;
    const timer = window.setInterval(() => {
      on = !on;
      document.title = on ? '🔴 SOS — Navora' : base;
    }, 1000);
    return () => {
      window.clearInterval(timer);
      document.title = base;
    };
  }, [sosAlert]);

  const toggleSosSound = () => {
    setSosSoundEnabled((current) => {
      const next = !current;
      saveSosSoundPref(next);
      if (next) playSosSound();
      return next;
    });
  };

  const openSosAlert = () => {
    setSosAlert(null);
    navigatePage(currentRole === 'admin' ? 'admin-alerts' : 'reception-calls');
  };

  // Sem isto, um SOS criado no celular só aparecia no painel depois de recarregar a
  // página — a lista de chamados só era buscada no login. Pula quando a aba está
  // em segundo plano pra não gastar requisição à toa.
  useEffect(() => {
    if (!currentRole) return undefined;
    const timer = window.setInterval(() => {
      if (document.hidden) return;
      refreshOperationalData({ silent: true });
    }, OPERATIONAL_REFRESH_MS);
    return () => window.clearInterval(timer);
    // refreshOperationalData só usa setters e o adminApi — não fica com estado velho.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentRole]);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      if (!getAdminToken()) {
        setAuthRestoring(false);
        return;
      }

      try {
        const storedUser = getAdminUser();
        if (storedUser && active) {
          const storedAccount = mapUserToStaffAccount(storedUser);
          if (storedAccount.role && ['admin', 'reception'].includes(storedAccount.role)) {
            setCurrentUser(storedAccount);
          }
        }

        const user = await adminApi.getAuthMe();
        const account = mapUserToStaffAccount(user);
        if (!account.role || !['admin', 'reception'].includes(account.role)) {
          clearAdminSession();
          return;
        }
        if (!active) return;
        storeAdminSession({ accessToken: getAdminToken(), user });
        enterAdminPanel(account, true);
      } catch (error) {
        if (isUnauthorizedError(error)) {
          clearAdminSession();
          if (active) {
            setCurrentRole(null);
            setCurrentPage(null);
            setCurrentUser(null);
            window.history.replaceState({}, '', '/login');
            showToast('Sessão inválida ou expirada.', 'danger');
          }
        } else if (isForbiddenError(error)) {
          if (active) showToast('Acesso negado para este perfil.', 'danger');
        }
      } finally {
        if (active) setAuthRestoring(false);
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    const handlePopState = () => {
      if (!currentRole) return;
      setCurrentPage(pageFromCurrentPath(currentRole));
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [currentRole]);

  const login = async ({ email, password, role }) => {
    try {
      clearAdminSession();
      const auth = await adminApi.login({ email, password });
      if (!auth?.access_token || !auth?.user) {
        showToast('Resposta de autenticação inválida.', 'danger');
        return;
      }

      const account = mapUserToStaffAccount(auth?.user);

      if (!account.role || !['admin', 'reception'].includes(account.role)) {
        clearAdminSession();
        showToast('Este perfil não possui acesso ao painel administrativo.', 'danger');
        return;
      }

      if (role && account.role !== role) {
        clearAdminSession();
        showToast('Perfil selecionado não corresponde ao usuário autenticado', 'danger');
        return;
      }

      storeAdminSession({ accessToken: auth.access_token, user: auth.user });
      const authUser = await adminApi.getAuthMe();
      const confirmedAccount = mapUserToStaffAccount(authUser);

      if (!confirmedAccount.role || !['admin', 'reception'].includes(confirmedAccount.role)) {
        clearAdminSession();
        showToast('Este perfil não possui acesso ao painel administrativo.', 'danger');
        return;
      }

      if (role && confirmedAccount.role !== role) {
        clearAdminSession();
        showToast('Perfil selecionado não corresponde ao usuário autenticado', 'danger');
        return;
      }

      storeAdminSession({ accessToken: auth.access_token, user: authUser });
      enterAdminPanel(confirmedAccount);
      showToast(`Bem-vindo(a), ${confirmedAccount.name}`, 'info');
    } catch (error) {
      if (isNetworkError(error)) {
        showToast('Não foi possível conectar ao backend de autenticação.', 'danger');
        return;
      }
      if (isUnauthorizedError(error)) {
        clearAdminSession();
        showToast('Credenciais inválidas ou sessão expirada.', 'danger');
        return;
      }
      if (isForbiddenError(error)) {
        showToast('Acesso negado para este perfil.', 'danger');
        return;
      }
      showToast('Não foi possível autenticar agora', 'danger');
    }
  };

  const logout = () => {
    leaveAdminPanel();
    showToast('Sessão encerrada', 'info');
  };

  const createStaffAccount = async (data) => {
    const role = (data.role || 'reception').toUpperCase();
    try {
      const created = await adminApi.createStaff({
        name: data.name.trim(),
        email: data.email.trim(),
        password: data.password,
        role,
      });
      const account = mapStaffFromApi({ ...created, created_at: created.createdAt });
      setStaffAccounts((items) => [account, ...items.filter((item) => item.authSource === 'api')]);
      setUsers((items) => [
        { id: created.id, name: created.name, role: account.roleLabel, status: 'Ativo', location: data.sector || 'Recepção', lastSeen: 'Nunca', accessibility: 'Nao' },
        ...items,
      ]);
      showToast('Funcionário cadastrado com acesso ao sistema');
      closeModal();
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para cadastrar funcionário')) return;
      if (error?.status === 409) {
        showToast('Já existe uma conta com este e-mail', 'warning');
        return;
      }
      if (error?.status === 400) {
        showToast('Confira os dados: a senha precisa de 8+ caracteres, com letra, número e símbolo, sem espaço', 'warning');
        return;
      }
      showToast('Não foi possível cadastrar o funcionário agora', 'danger');
    }
  };

  // Regra de seguranca: funcionarios nunca sao excluidos, apenas desativados.
  // A desativacao bloqueia o acesso ao painel e preserva o historico de acoes.
  const applyStaffStatusLocally = (account, deactivate) => {
    setStaffAccounts((items) =>
      items.map((item) =>
        item.id === account.id
          ? {
              ...item,
              status: deactivate ? 'Desativado' : 'Ativo',
              deactivatedAt: deactivate ? new Date().toLocaleDateString('pt-BR') : '',
              deactivatedBy: deactivate ? currentUser?.name || '' : '',
            }
          : item
      )
    );
  };

  const changeStaffStatus = async (account, deactivate, reason) => {
    if (!account.apiId) {
      applyStaffStatusLocally(account, deactivate);
      closeModal();
      showToast(deactivate ? 'Perfil local desativado (modo demonstracao)' : 'Perfil local reativado (modo demonstracao)', 'warning');
      return;
    }

    try {
      const updated = deactivate
        ? await adminApi.deactivateStaff(account.apiId, reason)
        : await adminApi.reactivateStaff(account.apiId, reason);
      setStaffAccounts((items) => items.map((item) => (item.id === account.id ? mapStaffFromApi(updated) : item)));
      closeModal();
      showToast(deactivate ? `Acesso de ${account.name} desativado. Historico preservado.` : `Acesso de ${account.name} reativado.`);
    } catch (error) {
      if (handleAuthFailure(error, 'Somente administradores podem alterar acessos da equipe')) return;
      if (isNetworkError(error)) {
        showToast('API indisponivel. Nenhuma alteracao foi feita.', 'danger');
        return;
      }
      const message = error?.payload?.message;
      showToast(typeof message === 'string' ? message : 'Nao foi possivel alterar o acesso.', 'danger');
    }
  };

  const openStaffStatusChange = (account) => {
    const deactivate = account.status === 'Ativo';
    openModal(
      deactivate ? 'Desativar acesso' : 'Reativar acesso',
      <StaffStatusForm account={account} deactivate={deactivate} onSubmit={(reason) => changeStaffStatus(account, deactivate, reason)} />
    );
  };

  const openStaffAudit = (account) => {
    openModal(`Historico de ${account.name}`, <StaffAuditView account={account} />);
  };

  const applyCallStatus = (id, status, extra = {}) => {
    setCalls((items) =>
      items.map((call) =>
        call.id === id
          ? { ...call, ...extra, status, history: [...call.history, `${status} em ${new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`] }
          : call
      )
    );
  };

  const updateCallStatus = async (id, status) => {
    try {
      const updated = await adminApi.updateCallStatus(id, callLabelToApiStatus[status] || status);
      applyCallStatus(id, callApiStatusToLabel[updated.status] || status);
      showToast(updated?.demoMode ? `Chamado atualizado localmente para ${status}` : `Chamado atualizado para ${status}`, updated?.demoMode ? 'warning' : 'success');
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para atualizar chamado')) return;
      showToast('Chamado não atualizado. Dados locais mantidos.', 'danger');
      return;
    }
    loadCalls();
    loadDashboardSummary();
  };

  const assignTeam = async (id) => {
    try {
      const updated = await adminApi.updateCallStatus(id, 'TEAM_DISPATCHED');
      applyCallStatus(id, callApiStatusToLabel[updated.status] || 'Equipe acionada', { assignedTo: 'Equipe Navora' });
      showToast(updated?.demoMode ? 'Equipe acionada localmente' : 'Equipe acionada', updated?.demoMode ? 'warning' : 'success');
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para acionar equipe')) return;
      showToast('Equipe não acionada. Dados locais mantidos.', 'danger');
      return;
    }
    loadCalls();
    loadDashboardSummary();
  };

  const closeCall = (id) => updateCallStatus(id, 'Encerrado');

  const createCheckin = async (data) => {
    try {
      const created = await adminApi.createCheckIn({
        patient: data.patient,
        document: data.document,
        destination: data.destination,
        accessibility: data.accessibility,
        observations: data.observations,
      });
      setCheckins((items) => [mapCheckInFromApi(created), ...items]);
      showToast('Check-in criado');
      closeModal();
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para criar check-in')) return;
      showToast('Check-in não criado. API indisponível ou dados recusados.', 'danger');
    }
  };

  const updateCheckinStatus = async (id, status) => {
    try {
      const updated = await adminApi.updateCheckInStatus(id, checkInLabelToApiStatus[status] || status);
      setCheckins((items) => items.map((item) => (item.id === id ? mapCheckInFromApi(updated) : item)));
      showToast(`Check-in atualizado para ${status}`);
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para atualizar check-in')) return;
      showToast('Check-in não atualizado. Dados locais mantidos.', 'danger');
    }
  };

  const updateBeacon = (id, changes) => {
    setBeacons((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const createMessage = async (data) => {
    try {
      const created = await adminApi.createOperationalMessage(data);
      setMessages((items) => [mapMessageFromApi(created), ...items]);
      showToast('Mensagem enviada');
      closeModal();
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para enviar mensagem')) return;
      showToast('Mensagem não enviada. API indisponível ou dados recusados.', 'danger');
    }
  };

  const saveSettings = (data) => {
    setSettings((current) => ({ ...current, ...data }));
    showToast('Configurações salvas');
  };

  const updateCurrentUserProfile = (changes) => {
    setCurrentUser((current) => {
      const next = { ...current, ...changes };
      saveProfileOverride(current, changes);
      return next;
    });
    showToast('Perfil do operador atualizado');
    closeModal();
  };

  const updateVisitor = (id, changes, toastMessage = 'Visitante atualizado') => {
    setVisitors((items) => items.map((visitor) => (visitor.id === id ? { ...visitor, ...changes } : visitor)));
    showToast(toastMessage);
  };

  const updateVisitorAccessStatus = async (visitor, status, changes = {}, toastMessage = 'Visitante atualizado') => {
    try {
      const updated = await adminApi.updateVisitorAccessStatus(visitor.id, visitorLabelToApiStatus[status] || status);
      updateVisitor(visitor.id, { ...(updated.visitor_name ? mapVisitorAccessFromApi(updated) : { status }), ...changes }, toastMessage);
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para atualizar visitante')) return;
      showToast('Visitante não atualizado. Dados locais mantidos.', 'danger');
      return;
    }
    loadVisitorAccessRequests();
    loadDashboardSummary();
  };

  const authorizeVisitor = async (visitor, data) => {
    const allowedRoute =
      visitor.areaId === 'private'
        ? `Recepção Private -> rota autorizada -> ${visitor.requestedDestination}`
        : `Recepção Hospital Marco Capute -> rota autorizada -> ${visitor.requestedDestination}`;

    if (data.releaseType === 'Negar acesso') {
      denyVisitor(visitor, 'Negado na autorizacao');
      return;
    }

    try {
      const permissionMinutes = parseReleaseMinutes(data.releaseTime);
      const updated = await adminApi.authorizeVisitorAccess(visitor.id, {
        release_type: data.releaseType,
        release_time: data.releaseTime,
        permissionMinutes,
        permission_minutes: permissionMinutes,
        authorizedRoute: allowedRoute,
        authorized_route: allowedRoute,
        allowed_route: allowedRoute,
      });
      updateVisitor(
        visitor.id,
        updated.visitor_name ? mapVisitorAccessFromApi(updated) : { status: 'Autorizado', allowedRoute, allowedTime: data.releaseTime, releaseType: data.releaseType },
        'Acesso autorizado'
      );
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para autorizar visitante')) return;
      showToast('Acesso não autorizado. Dados locais mantidos.', 'danger');
      return;
    }
    closeModal();
    loadVisitorAccessRequests();
    loadDashboardSummary();
  };

  const denyVisitor = async (visitor, reason) => {
    try {
      const updated = await adminApi.denyVisitorAccess(visitor.id, reason);
      updateVisitor(
        visitor.id,
        updated.visitor_name ? mapVisitorAccessFromApi(updated) : { status: 'Acesso negado', denialReason: reason },
        'Acesso negado'
      );
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para negar visitante')) return;
      showToast('Negativa não registrada. Dados locais mantidos.', 'danger');
      return;
    }
    closeModal();
    loadVisitorAccessRequests();
    loadDashboardSummary();
  };

  const generateLocalReport = (period = 'diario') => {
    const activeRoutes = users.filter((user) => user.status === 'Em rota').length + checkins.filter((item) => item.status === 'Em rota').length;
    const sos = calls.filter((call) => call.type === 'SOS Emergencia').length;
    const help = calls.filter((call) => call.type.includes('Ajuda')).length;
    const doctor = calls.filter((call) => call.type === 'Solicitar Medico').length;
    const busiestSector = [...sectors].sort((a, b) => b.peopleCount - a.peopleCount)[0];
    const lowBeacon = beacons.find((beacon) => Number.isFinite(beacon.battery) && beacon.battery < 30);
    return {
      period,
      monitoredPeople: users.length,
      activeRoutes,
      sos,
      help,
      doctor,
      averageResponse: '4 min',
      busiestSector: busiestSector?.name || 'Recepção',
      lowBeacon: lowBeacon?.id || 'Nenhum',
      closed: calls.filter((call) => call.status === 'Encerrado').length,
      pending: calls.filter((call) => call.status === 'Pendente').length,
      recommendations: ['Reforçar equipe no Setor de Imagem', 'Substituir beacon com bateria baixa', 'Manter prioridade para SOS e solicitações médicas'],
    };
  };

  const generateReport = async (period = 'diario') => {
    try {
      const report = await adminApi.generateAdminReport({ period });
      if (report?.demoMode) return generateLocalReport(period);
      return report;
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para gerar relatório')) {
        return {
          period,
          source: 'auth-error',
          status: 'Não autorizado',
        };
      }
      showToast('API indisponível, gerando relatório local', 'warning');
      return generateLocalReport(period);
    }
  };

  const exportToCSV = (filename, rows) => {
    const safeRows = rows.length ? rows : [{ mensagem: 'Sem dados' }];
    const headers = Object.keys(safeRows[0]);
    const csv = [headers.join(','), ...safeRows.map((row) => headers.map((key) => `"${String(row[key] ?? '').replaceAll('"', '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
    showToast('CSV exportado');
  };

  const app = {
    users, staffAccounts, currentUser, calls, beacons, beaconsSource, checkins, sectors, sectorsSource,
    navigationSource, navigationAreas, navigationDestinations, navigationMap,
    messages, visitors, settings, filters, dashboardSummary, lastRefreshedAt, refreshOperationalData,
    setCurrentPage: navigatePage, setFilters, showToast, openModal, closeModal,
    updateCallStatus, assignTeam, closeCall, createCheckin, updateCheckinStatus,
    updateBeacon, createMessage, saveSettings, generateReport, exportToCSV,
    setSectors, setMessages, setCalls, setUsers, setVisitors, updateVisitor, updateVisitorAccessStatus, authorizeVisitor, denyVisitor,
    createStaffAccount, openStaffStatusChange, openStaffAudit, staffSource, updateCurrentUserProfile,
  };

  if (authRestoring) return <LoginPage onLogin={login} toast={toast} />;
  if (!currentRole) return <LoginPage onLogin={login} toast={toast} />;

  return (
    <main className="admin-shell">
      <AppSidebar
        role={currentRole}
        currentUser={currentUser}
        currentPage={currentPage}
        navItems={currentRole === 'admin' ? adminNav : receptionNav}
        onNavigate={navigatePage}
        onLogout={logout}
        onEditProfile={() => openProfileEditor(app)}
      />
      <section className="workspace">
        <AppTopbar
          role={currentRole}
          currentUser={currentUser}
          currentPageLabel={pageLabels[currentPage] || currentPage}
          notificationCount={calls.filter((call) => call.status !== 'Encerrado').length + messages.length}
          onEditProfile={() => openProfileEditor(app)}
        />
        {sosAlert ? (
          <div className="sos-banner" role="alert">
            <div className="sos-banner-copy">
              <b>SOS — {sosAlert.patient}</b>
              <span>{sosAlert.location}{sosAlert.beacon ? ` - ${sosAlert.beacon}` : ''}</span>
              {sosAlert.needs?.length ? <span>Precisa: {sosAlert.needs.join(', ')}</span> : null}
            </div>
            <div className="sos-banner-actions">
              <button type="button" className="sos-banner-open" onClick={openSosAlert}>Ver chamado</button>
              <button type="button" className="sos-banner-dismiss" onClick={() => setSosAlert(null)}>Dispensar</button>
            </div>
          </div>
        ) : null}
        <div className="sos-sound-row">
          <button type="button" className="sos-sound-toggle" onClick={toggleSosSound} aria-pressed={sosSoundEnabled}>
            {sosSoundEnabled ? 'Som do SOS: ligado' : 'Som do SOS: desligado'}
          </button>
        </div>
        <PageRouter role={currentRole} page={currentPage} app={app} />
      </section>
      <Toast toast={toast} />
      <Modal modal={modal} onClose={closeModal} />
    </main>
  );
}

function PageRouter({ role, page, app }) {
  const pages = {
    'admin-dashboard': <AdminDashboard app={app} />,
    'admin-heatmap': <AdminHeatmap app={app} />,
    'admin-alerts': <CallsPage app={app} admin />,
    'admin-users': <UsersPage app={app} />,
    'admin-beacons': <BeaconsPage app={app} />,
    'admin-reports': <ReportsPage app={app} />,
    'admin-settings': <SettingsPage app={app} admin />,
    'reception-dashboard': <ReceptionDashboard app={app} />,
    'reception-visitors': <VisitorsAccessPage app={app} />,
    'reception-calls': <CallsPage app={app} />,
    'reception-checkin': <CheckinPage app={app} />,
    'reception-access': <VisitorsAccessPage app={app} accessOnly />,
    'reception-sectors': <SectorsPage app={app} />,
    'reception-messages': <MessagesPage app={app} />,
    'reception-settings': <SettingsPage app={app} />,
  };
  return pages[page] || pages[role === 'admin' ? 'admin-dashboard' : 'reception-dashboard'];
}

function AdminDashboard({ app }) {
  const summary = app.dashboardSummary;
  const people = summary ? summary.patientUsers : app.users.filter((user) => user.role === 'Paciente').length;
  const online = summary ? summary.beaconsOnline : app.beacons.filter((beacon) => beacon.status === 'Online').length;
  const pendingVisitors = summary ? summary.pendingVisitorRequests : app.visitors.filter((visitor) => visitor.status === 'Aguardando autorizacao').length;
  const openCalls = summary ? summary.openCalls : app.calls.filter((call) => call.status !== 'Encerrado').length;
  const activeHelp = summary ? summary.activeHelp : app.calls.filter((call) => call.type !== 'SOS Emergencia' && call.status !== 'Encerrado').length;
  const approvedVisitors = summary ? summary.approvedVisitors : app.visitors.filter((visitor) => visitor.status === 'Autorizado').length;
  const sectorsTotal = summary ? summary.sectorsTotal : app.sectors.length;
  const destinationsTotal = summary ? summary.destinationsTotal : app.navigationDestinations.length;
  const alerts = app.calls.filter((call) => ['Critica', 'Alta'].includes(call.priority) && call.status !== 'Encerrado');
  const dashboardFloorKey = normalizeHeatmapFloor(app.filters.floor) || 'terreo';
  const dashboardFloor = getHeatmapFloorOption(dashboardFloorKey);
  const heatmapSectors = app.sectors.filter((sector) => sectorBelongsToFloor(sector, dashboardFloorKey) && (app.filters.sector === 'Todos' || matchesSector(app.filters.sector, sector)));
  const heatmapNodes = (app.navigationMap?.nodes || []).filter((node) => nodeBelongsToFloor(node, dashboardFloorKey));

  // Mesmo fluxo da ReportsPage: app.generateReport já cai pro relatório local se
  // a API estiver fora e já avisa em caso de acesso negado.
  const openDailyReport = async () => {
    const report = await app.generateReport('diario');
    if (report?.source === 'auth-error') return;
    app.openModal('Relatorio operacional', <ReportView report={report} />, <ReportFooter app={app} report={report} />);
  };

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <DashboardStatCard icon={Users} title={summary?.source === 'api' ? 'Pacientes cadastrados' : 'Pacientes demo'} value={people} tone="good" detail={summary?.source === 'api' ? 'Fonte API' : 'Fonte fallback'} onClick={() => app.setCurrentPage('admin-users')} />
        <DashboardStatCard icon={UserCheck} title="Visitantes aguardando" value={pendingVisitors} tone="warning" detail="Autorizacao pendente" onClick={() => app.setCurrentPage('reception-access')} />
        <DashboardStatCard icon={RadioTower} title="Beacons online" value={summary ? `${online}/${summary.beaconsTotal}` : online} tone="good" detail={app.beaconsSource === 'api' ? 'Fonte API' : 'Fonte fallback'} onClick={() => app.setCurrentPage('admin-beacons')} />
        <DashboardStatCard icon={HeartPulse} title="Chamados abertos" value={openCalls} tone="purple" detail="Ativos agora" onClick={() => app.setCurrentPage('admin-alerts')} />
        <DashboardStatCard icon={HelpCircle} title="Help ativos" value={activeHelp} tone="blue" detail="Aguardando resposta" onClick={() => app.setCurrentPage('admin-alerts')} />
        <DashboardStatCard icon={Building2} title="Setores cadastrados" value={sectorsTotal} tone="violet" detail="Total de setores" onClick={() => app.setCurrentPage('admin-heatmap')} />
        <DashboardStatCard icon={MapIcon} title="Destinos cadastrados" value={destinationsTotal} tone="teal" detail="Pontos de interesse" onClick={() => app.setCurrentPage('admin-heatmap')} />
        <DashboardStatCard icon={CheckCircle2} title="Visitantes aprovados" value={approvedVisitors} tone="lime" detail="Hoje" onClick={() => app.setCurrentPage('reception-access')} />
      </section>
      <section className="two-col">
        <Panel title="Mapa de calor" meta="Fonte operacional Navora">
          <Toolbar className="heatmap-dashboard-toolbar">
            <select value={dashboardFloorKey} onChange={(event) => app.setFilters({ ...app.filters, floor: event.target.value })}>
              {heatmapFloorOptions.map((option) => <option key={option.key} value={option.key}>{option.label}</option>)}
            </select>
            <select value={app.filters.sector || 'Todos'} onChange={(event) => app.setFilters({ ...app.filters, sector: event.target.value })}>
              <option value="Todos">Todos os setores</option>
              {app.sectors.map((sector) => <option key={sector.id} value={sector.name}>{sector.name}</option>)}
            </select>
            <button onClick={() => app.refreshOperationalData()}>Atualizar dados</button>
            <button onClick={openDailyReport}>Gerar relatorio</button>
          </Toolbar>
          <DashboardHeatmap sectors={heatmapSectors} nodes={heatmapNodes} floor={dashboardFloor} onSelect={(sector) => openSector(app, sector)} />
        </Panel>
        <Panel title="Alertas recentes" action={<button onClick={() => app.setCurrentPage('admin-alerts')}>Ver todos</button>}>
          <DashboardRecentAlerts visitors={app.visitors} calls={alerts} />
        </Panel>
      </section>
    </div>
  );
}

function AdminHeatmap({ app }) {
  const initialSector = app.sectors.find((sector) => matchesSector(app.filters.sector, sector));
  const [floorKey, setFloorKey] = useState(normalizeHeatmapFloor(app.filters.floor) || normalizeHeatmapFloor(initialSector?.floor) || 'terreo');
  const [sectorKey, setSectorKey] = useState(app.filters.sector || 'Todos');
  const activeFloor = getHeatmapFloorOption(floorKey);
  const floorSectors = app.sectors.filter((sector) => sectorBelongsToFloor(sector, floorKey));
  const visible = floorSectors.filter((sector) => sectorKey === 'Todos' || matchesSector(sectorKey, sector));
  const floorNodes = (app.navigationMap?.nodes || []).filter((node) => nodeBelongsToFloor(node, floorKey));
  const floorBeacons = app.beacons.filter((beacon) => beaconBelongsToFloor(beacon, floorKey, floorSectors));
  const onlineFloorBeacons = floorBeacons.filter((beacon) => comparableLocation(beacon.status) === 'online').length;
  const highFlowSectors = visible.filter((sector) => ['critical', 'high'].includes(getHeatLevel(sector.peopleCount))).length;
  const monitoredPeople = visible.reduce((total, sector) => total + sector.peopleCount, 0);
  const flowSummary = ['critical', 'high', 'medium', 'low', 'very-low'].map((level) => ({
    level,
    label: heatLevelLabel(level),
    total: visible.filter((sector) => getHeatLevel(sector.peopleCount) === level).length,
  }));
  return (
    <div className="heatmap-page">
      <header className="heatmap-page-head">
        <h2>Heatmap</h2>
        <p>Visualizacao do fluxo de pessoas por setor</p>
      </header>
      <div className="heatmap-filterbar">
        <div className="floor-tabs" role="tablist" aria-label="Selecionar andar">
          {heatmapFloorOptions.map((option) => (
            <button
              key={option.key}
              type="button"
              className={floorKey === option.key ? 'active' : ''}
              onClick={() => { setFloorKey(option.key); setSectorKey('Todos'); }}
              aria-pressed={floorKey === option.key}
            >
              <span>{option.label}</span>
              {option.special ? <small>Heliponto</small> : null}
            </button>
          ))}
        </div>
        <select value={sectorKey} onChange={(e) => setSectorKey(e.target.value)}>
          <option value="Todos">Todos os setores</option>
          {floorSectors.map((s) => <option key={s.id} value={s.code || s.name}>{s.name}</option>)}
        </select>
        <button className="heatmap-refresh" onClick={() => app.refreshOperationalData()}>
          <RefreshCw size={16} />Atualizar dados
        </button>
        <button className="heatmap-export" onClick={() => app.exportToCSV('heatmap-setores.csv', visible)}>
          <Download size={16} />Exportar relatorio
        </button>
      </div>
      <section className="floor-overview" aria-label="Informacoes do andar">
        <article><MapIcon size={16} /><span>Andar</span><b>{activeFloor.title}</b></article>
        <article><Users size={16} /><span>Pessoas</span><b>{monitoredPeople}</b></article>
        <article><Building2 size={16} /><span>Setores</span><b>{floorSectors.length}</b></article>
        <article><RadioTower size={16} /><span>Beacons online</span><b>{onlineFloorBeacons}</b></article>
        <article><Activity size={16} /><span>Fluxo alto</span><b>{highFlowSectors}</b></article>
      </section>
      <div className="heatmap-layout heatmap-screen-layout">
        <Heatmap sectors={visible} nodes={floorNodes} floor={activeFloor} beacons={floorBeacons} onSelect={(sector) => openSector(app, sector)} large lastUpdated={app.lastRefreshedAt} />
        <aside className="rank-panel" aria-label="Setores monitorados">
          <div className="rank-panel-head">
            <h3>Setores monitorados</h3>
            <small>{visible.length} areas acompanhadas</small>
          </div>
          <div className="rank-list">
          {visible.sort((a, b) => b.peopleCount - a.peopleCount).map((sector) => (
            <button key={sector.id} className={getHeatLevel(sector.peopleCount)} onClick={() => openSector(app, sector)}>
              <span className="rank-icon"><Building2 size={18} /></span>
              <span className="rank-copy">
                <b>{sector.name}</b>
                <span>{sector.peopleCount} pessoas</span>
                <small><em>{heatLevelLabel(getHeatLevel(sector.peopleCount))}</em>{sector.waitingTime}</small>
              </span>
              <ChevronRight size={16} />
            </button>
          ))}
          </div>
          <button className="rank-all" onClick={() => app.showToast('Todos os setores ja estao visiveis')}>Ver todos os setores <ChevronRight size={15} /></button>
        </aside>
      </div>
      <section className="flow-summary" aria-label="Resumo do fluxo">
        <h3>Resumo do fluxo</h3>
        <div>
          {flowSummary.map((item) => (
            <article className={item.level} key={item.level}>
              <span className="summary-icon"><Building2 size={17} /></span>
              <p>{item.label}</p>
              <strong>{item.total}</strong>
              <small>{item.total === 1 ? 'area' : 'areas'}</small>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

function CallsPage({ app, admin = false }) {
  const [filter, setFilter] = useState(app.filters.calls || 'Todos');
  const [query, setQuery] = useState('');
  const visible = app.calls.filter((call) => {
    const blob = `${call.patient} ${call.location} ${call.type}`.toLowerCase();
    const matchesQuery = blob.includes(query.toLowerCase());
    const matchesFilter =
      filter === 'Todos' ||
      (filter === 'SOS' && call.type === 'SOS Emergencia') ||
      (filter === 'Ajuda' && call.type.includes('Ajuda')) ||
      (filter === 'Pedido de Ajuda' && call.type === 'Pedido de Ajuda') ||
      (filter === 'Medico' && call.type === 'Solicitar Medico') ||
      (filter === 'Solicitar Medico' && call.type === 'Solicitar Medico') ||
      (filter === 'Perdido' && call.type === 'Estou Perdido') ||
      (filter === 'Estou Perdido' && call.type === 'Estou Perdido') ||
      (filter === 'Locomocao' && call.type === 'Ajuda de Locomocao') ||
      (filter === 'Alta prioridade' && ['Alta', 'Critica'].includes(call.priority)) ||
      (filter === 'Pendentes' && call.status === 'Pendente') ||
      (filter === 'Em atendimento' && call.status === 'Em atendimento') ||
      (filter === 'Encerrados' && call.status === 'Encerrado');
    return matchesQuery && matchesFilter;
  });
  const filterList = admin ? ['Todos', 'SOS', 'Pedido de Ajuda', 'Solicitar Medico', 'Estou Perdido', 'Alta prioridade', 'Pendentes', 'Encerrados'] : ['Todos', 'Ajuda', 'Medico', 'SOS', 'Perdido', 'Locomocao', 'Pendentes', 'Em atendimento', 'Encerrados'];
  if (!admin) {
    return (
      <div className="page-view premium-page reception-calls-page">
        <PageHeading title="Chamados e SOS" subtitle="Acompanhe pedidos de ajuda, emergências e solicitações operacionais." />
        <section className="kpi-grid">
          <KpiCard icon={HeartPulse} tone="danger" label="SOS ativos" value={app.calls.filter((call) => call.type === 'SOS Emergencia' && call.status !== 'Encerrado').length} helper="Prioridade critica" />
          <KpiCard icon={HelpCircle} tone="warning" label="Pedidos de ajuda" value={app.calls.filter((call) => call.type !== 'SOS Emergencia' && call.status !== 'Encerrado').length} helper="Não encerrados" />
          <KpiCard icon={Clock3} tone="info" label="Em atendimento" value={app.calls.filter((call) => call.status === 'Em atendimento').length} helper="Equipe acompanhando" />
          <KpiCard icon={CheckCircle2} tone="success" label="Encerrados" value={app.calls.filter((call) => call.status === 'Encerrado').length} helper="Histórico operacional" />
        </section>
        <div className="page-toolbar">
          <div className="page-search"><Search size={16} /><input placeholder="Buscar paciente, setor ou tipo" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
          <button className="btn btn-secondary" onClick={() => app.exportToCSV('chamados.csv', visible)}><Download size={16} />Exportar CSV</button>
        </div>
        <FilterChips items={filterList} active={filter} onChange={setFilter} />
        <SectionCard title="Chamados recebidos" subtitle="Acoes semanticas por status e prioridade.">
          <div className="card-list alerts-list">
            {visible.map((call) => <CallCard key={call.id} call={call} app={app} reception />)}
            {!visible.length ? <EmptyState title="Nenhum chamado encontrado" text="Novos chamados e SOS aparecerao aqui." /> : null}
          </div>
        </SectionCard>
      </div>
    );
  }
  return (
    <section className={`panel wide ${admin ? 'alerts-page' : 'calls-page'}`}>
      <div className="panel-title">
        <div>
          <h2>{admin ? 'Alertas e SOS' : 'Chamados da recepção'}</h2>
        </div>
      </div>
      <Toolbar>
        {admin ? (
          <div className="alerts-search">
            <Search size={17} aria-hidden="true" />
            <input aria-label="Buscar paciente, setor ou tipo" placeholder="Buscar paciente, setor ou tipo" value={query} onChange={(e) => setQuery(e.target.value)} />
          </div>
        ) : (
          <input placeholder="Buscar paciente, setor ou tipo" value={query} onChange={(e) => setQuery(e.target.value)} />
        )}
        <button className={admin ? 'alerts-export' : undefined} onClick={() => app.exportToCSV('chamados.csv', visible)}>
          {admin ? <Download size={16} aria-hidden="true" /> : null}Exportar CSV
        </button>
      </Toolbar>
      <div className="alerts-filters">
        <Pills items={filterList} active={filter} onChange={setFilter} />
      </div>
      <div className="card-list alerts-list">
        {visible.map((call) => <CallCard key={call.id} call={call} app={app} reception={!admin} adminView={admin} />)}
      </div>
    </section>
  );
}

function UsersPage({ app }) {
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const activeStaff = app.staffAccounts.filter((account) => account.status === 'Ativo').length;
  const receptionStaff = app.staffAccounts.filter((account) => account.role === 'reception').length;
  const staffQuery = app.staffAccounts.filter((account) => {
    const matchesQuery = `${account.name} ${account.email} ${account.roleLabel} ${account.sector}`.toLowerCase().includes(query.toLowerCase());
    const matchesFilter =
      filter === 'Todos' ||
      (filter === 'Administrador' && account.role === 'admin') ||
      (filter === 'Recepção' && account.role === 'reception');
    return matchesQuery && matchesFilter;
  });
  const visible = app.users.filter((user) => {
    const okFilter =
      filter === 'Todos' ||
      (filter === 'Administrador' && user.role === 'Administrador') ||
      (filter === 'Recepção' && user.role === 'Recepção') ||
      (filter === 'Pacientes' && user.role === 'Paciente') ||
      (filter === 'Visitantes' && user.role === 'Visitante');
    return okFilter && `${user.name} ${user.role} ${user.location} ${user.accessibility}`.toLowerCase().includes(query.toLowerCase());
  });
  return (
    <div className="page-view premium-page">
      <PageHeading title="Usuarios" subtitle="Gestao de perfis administrativos e pacientes monitorados" />
      <section className="kpi-grid">
        <KpiCard icon={Users} tone="violet" label="Acessos internos" value={app.staffAccounts.length} helper="Perfis internos cadastrados" />
        <KpiCard icon={CheckCircle2} tone="success" label="Ativos agora" value={activeStaff} helper="Podem entrar no sistema" />
        <KpiCard icon={UserCheck} tone="warning" label="Acesso recepção" value={receptionStaff} helper="Perfis de recepção" />
        <KpiCard icon={Activity} tone="info" label="Pacientes monitorados" value={app.users.length} helper="Usuarios na plataforma" />
      </section>

      <div className="page-toolbar">
        <div className="page-search"><Search size={16} /><input placeholder="Buscar por nome, e-mail ou setor" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={() => openStaffAccount(app)}><Plus size={16} />Cadastrar funcionário</button>
        <button className="btn btn-secondary" onClick={() => app.exportToCSV('usuarios.csv', [...staffQuery, ...visible])}><Download size={16} />Exportar</button>
      </div>

      <FilterChips items={['Todos', 'Administrador', 'Recepção', 'Pacientes']} active={filter} onChange={setFilter} />

      <SectionCard title="Acessos administrativos" subtitle="Controle de acessos da equipe interna ao sistema.">
        <p className="form-note staff-rule-note">
          <ShieldCheck size={15} />
          Por seguranca, funcionarios nao podem ser excluidos. Ao desativar, a pessoa perde o acesso ao painel na hora, mas o historico do que ela autorizou ou negou continua registrado.
          {app.staffSource !== 'api' ? ' Exibindo perfis de demonstracao.' : ''}
        </p>
        <PremiumTable
          rows={staffQuery}
          columns={[
            { key: 'name', label: 'Nome', render: (account) => <UserCell name={account.name} sub={account.email} /> },
            { key: 'email', label: 'E-mail', render: (account) => account.email },
            { key: 'roleLabel', label: 'Perfil', render: (account) => <RoleBadge value={account.roleLabel} /> },
            { key: 'sector', label: 'Setor', render: (account) => account.sector },
            { key: 'status', label: 'Status', render: (account) => <NvBadge value={account.status} /> },
            { key: 'registro', label: 'Registro', render: (account) => (
              account.status === 'Ativo'
                ? (account.lastLogin ? `Ultimo acesso: ${account.lastLogin}` : `Desde ${account.createdAt || '-'}`)
                : `Desativado${account.deactivatedAt ? ` em ${account.deactivatedAt}` : ''}${account.deactivatedBy ? ` por ${account.deactivatedBy}` : ''}`
            ) },
            { key: 'actions', label: 'Acoes', render: (account) => {
              const isSelf = Boolean(app.currentUser?.email) && app.currentUser.email === account.email;
              return (
                <RowActions>
                  <button className="btn btn-secondary" onClick={() => app.openStaffAudit(account)}>Historico</button>
                  <ActionMenu>
                    <button
                      className={account.status === 'Ativo' ? 'menu-danger' : ''}
                      disabled={isSelf}
                      title={isSelf ? 'Voce nao pode desativar o seu proprio acesso' : undefined}
                      onClick={() => app.openStaffStatusChange(account)}
                    >
                      {account.status === 'Ativo' ? 'Desativar acesso' : 'Reativar acesso'}
                    </button>
                    <button onClick={() => app.openModal('Dados de acesso', <Details data={account} />)}>Ver dados</button>
                  </ActionMenu>
                </RowActions>
              );
            } },
          ]}
        />
      </SectionCard>

      <SectionCard title="Pacientes monitorados" subtitle="Acompanhe pacientes em rota ou aguardando atendimento.">
        <PremiumTable
          rows={visible}
          columns={[
            { key: 'name', label: 'Nome', render: (user) => <UserCell name={user.name} sub={user.role} /> },
            { key: 'role', label: 'Perfil', render: (user) => <RoleBadge value={user.role} /> },
            { key: 'status', label: 'Status', render: (user) => <NvBadge value={user.status} /> },
            { key: 'location', label: 'Localização', render: (user) => user.location },
            { key: 'accessibility', label: 'Acessibilidade', render: (user) => <AccessibilityNote value={user.accessibility} /> },
            { key: 'lastSeen', label: 'Última atualização', render: (user) => user.lastSeen },
            { key: 'actions', label: 'Acoes', render: (user) => (
              <RowActions>
                <button className="btn btn-secondary" onClick={() => app.openModal('Perfil do usuario', <UserProfile user={user} />)}>Ver perfil</button>
                <button className="btn btn-info" onClick={() => { app.setCurrentPage('admin-heatmap'); app.setFilters({ sector: user.location }); }}>Localização</button>
                <ActionMenu>
                  <button onClick={() => openMessage(app, user.name)}>Enviar notificação</button>
                  <button className="menu-danger" onClick={() => { app.setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: item.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado' } : item)); app.showToast('Status do usuario atualizado'); }}>{user.status === 'Bloqueado' ? 'Desbloquear' : 'Bloquear'}</button>
                </ActionMenu>
              </RowActions>
            ) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function BeaconsPage({ app }) {
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const visible = app.beacons.filter((beacon) => {
    const matchesFilter = filter === 'Todos' || beacon.status === filter;
    const matchesQuery = `${beacon.id} ${beacon.name} ${beacon.sector} ${beacon.area}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  const rows = visible.map((beacon) => ({
    ...beacon,
    node: beacon.originNodeCode || beacon.navigationNode?.code || 'Não informado',
    lastSignal: beacon.lastSignal || 'Sem sinal',
  }));
  return (
    <div className="page-view premium-page">
      <PageHeading title="Beacons" subtitle="Monitoramento dos dispositivos de localização indoor" />
      <section className="kpi-grid">
        <KpiCard icon={RadioTower} tone="info" label="Beacons físicos" value={app.beacons.filter((b) => b.physical).length} helper="Aparelhos instalados" />
        <KpiCard icon={CheckCircle2} tone="success" label="Online" value={app.beacons.filter((b) => b.status === 'Online').length} helper="Vistos por um celular nas últimas 24 h" />
        <KpiCard icon={ShieldCheck} tone="danger" label="Sem sinal" value={app.beacons.filter((b) => b.status === 'Sem sinal').length} helper="Conferir no local (pilha ou posição)" />
        <KpiCard icon={Clock3} tone="warning" label="Simulados" value={app.beacons.filter((b) => b.status === 'Simulado').length} helper="Só para teste, sem aparelho" />
      </section>
      <p className="form-note beacon-health-note">
        Os beacons só transmitem; não avisam o servidor nem informam bateria. Um beacon aparece como Online quando o celular de algum paciente ou visitante, com o Bluetooth ligado, o detecta. Sem sinal há mais de 24 h, vale conferir no local.
      </p>
      <div className="page-toolbar">
        <div className="page-search"><Search size={16} /><input placeholder="Buscar por codigo, nome ou setor" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="btn btn-secondary" onClick={() => app.exportToCSV('beacons.csv', rows)}><Download size={16} />Exportar</button>
      </div>
      <FilterChips items={['Todos', 'Online', 'Sem sinal', 'Simulado']} active={filter} onChange={setFilter} />
      <SectionCard title="Dispositivos monitorados" subtitle="Status operacional dos beacons no ambiente.">
        <PremiumTable
          rows={rows}
          columns={[
            { key: 'id', label: 'Codigo', render: (beacon) => beacon.id },
            { key: 'name', label: 'Nome', render: (beacon) => beacon.name },
            { key: 'sector', label: 'Setor', render: (beacon) => beacon.sector },
            { key: 'area', label: 'Area', render: (beacon) => beacon.area },
            { key: 'status', label: 'Status', render: (beacon) => <NvBadge value={beacon.status} /> },
            { key: 'battery', label: 'Bateria', render: (beacon) => <BatteryMeter value={beacon.battery} /> },
            { key: 'lastSignal', label: 'Ultimo sinal', render: (beacon) => beacon.lastSignal },
            { key: 'node', label: 'No', render: (beacon) => beacon.node },
            { key: 'actions', label: 'Acoes', render: (beacon) => (
              <RowActions>
                <button className="btn btn-secondary" onClick={() => app.openModal('Detalhes do beacon', <Details data={beacon} />)}>Ver detalhes</button>
                <button className="btn btn-info" onClick={() => { app.setFilters({ sector: beacon.sector }); app.setCurrentPage('admin-heatmap'); }}>Localizar</button>
              </RowActions>
            ) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function ReportsPage({ app }) {
  const [report, setReport] = useState({ period: 'diario', source: 'fallback', status: 'Aguardando geracao' });
  const [loading, setLoading] = useState(false);
  const [period, setPeriod] = useState('diario');
  const make = async (period) => {
    setLoading(true);
    const next = await app.generateReport(period);
    setReport(next);
    setLoading(false);
    if (next?.source === 'auth-error') return;
    app.showToast(`Relatorio ${period} gerado`);
  };
  const generated = report.status !== 'Aguardando geracao';
  const localSource = report.source === 'fallback' ? 'Dados locais' : report.source === 'api' ? 'Fonte API' : report.source;
  return (
    <div className="page-view premium-page">
      <PageHeading title="Relatórios" subtitle="Gere, visualize e exporte informações operacionais do Navora." />
      <section className="kpi-grid">
        <KpiCard icon={HeartPulse} tone="danger" label="SOS" value={app.calls.filter((c) => c.type === 'SOS Emergencia').length} helper="Chamados de emergencia" />
        <KpiCard icon={HelpCircle} tone="warning" label="Help" value={app.calls.filter((c) => c.type !== 'SOS Emergencia').length} helper="Pedidos de ajuda" />
        <KpiCard icon={UserCheck} tone="info" label="Visitantes" value={app.visitors.length} helper="Solicitações registradas" />
        <KpiCard icon={ClipboardCheck} tone="success" label="Check-ins" value={app.checkins.length} helper="Atendimentos criados" />
      </section>
      <section className="section-card">
        <div className="report-toolbar page-toolbar">
          <label className="form-label">Periodo
            <select className="page-select" value={period} onChange={(event) => setPeriod(event.target.value)}>
              <option value="diario">Diario</option>
              <option value="semanal">Semanal</option>
              <option value="mensal">Mensal</option>
            </select>
          </label>
          <button className="btn btn-primary" onClick={() => make(period)} disabled={loading}>{loading ? 'Gerando...' : 'Gerar relatorio'}</button>
          {generated ? <button className="btn btn-secondary" onClick={() => app.openModal('Relatorio', <ReportView report={report} />, <ReportFooter app={app} report={report} />)}>Visualizar</button> : null}
          {generated ? <button className="btn btn-secondary" onClick={() => app.exportToCSV(`relatorio-${report.period}.csv`, [report])}><Download size={16} />Exportar CSV</button> : null}
        </div>
        {generated ? (
          <div className="report-result">
            <div>
              <h3 className="section-title">Relatorio {report.period}</h3>
              <p className="section-subtitle">Fonte: <span className="badge badge-neutral">{localSource}</span></p>
            </div>
            <ReportView report={{ ...report, source: localSource }} />
          </div>
        ) : (
          <div className="empty-state premium-empty">
            <BarChart3 size={34} />
            <div><strong>Nenhum relatorio gerado</strong><span>Selecione o periodo e gere um relatorio para visualizar os resultados.</span></div>
            <button className="btn btn-primary" onClick={() => make(period)} disabled={loading}>{loading ? 'Gerando...' : 'Gerar relatorio'}</button>
          </div>
        )}
      </section>
    </div>
  );
}

function SettingsPage({ app, admin = false }) {
  const [form, setForm] = useState(app.settings);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const textFields = admin
    ? [['hospitalName', 'Nome do hospital'], ['hospitalAddress', 'Endereco do hospital'], ['waitLimit', 'Tempo limite de espera']]
    : [['receptionName', 'Nome da recepção'], ['waitLimit', 'Tempo máximo de espera']];
  const toggles = admin
    ? [['sosNotifications', 'Notificações de SOS'], ['heatmap', 'Heatmap operacional'], ['beaconMonitoring', 'Monitoramento de beacons'], ['maintenanceMode', 'Modo manutenção']]
    : [['soundAlerts', 'Alertas sonoros'], ['prioritizeSos', 'Priorizar SOS'], ['prioritizeDoctor', 'Priorizar medico'], ['showClosed', 'Exibir encerrados']];
  return (
    <div className="page-view premium-page">
      <PageHeading
        title={admin ? 'Configurações' : 'Configurações da recepção'}
        subtitle={admin ? 'Gerencie preferências administrativas e operacionais.' : 'Ajuste preferências operacionais da recepção.'}
      />
      <div className="settings-grid premium-settings-grid">
        <section className="settings-group">
          <div><h3 className="section-title">{admin ? 'Instituição' : 'Recepção'}</h3><p className="section-subtitle">Dados operacionais exibidos no painel.</p></div>
          {textFields.map(([key, label]) => <label className="form-label settings-row" key={key}>{label}<input className="form-control" value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}
        </section>
        <section className="settings-group">
          <div><h3 className="section-title">Operação e notificações</h3><p className="section-subtitle">Preferências de alertas e monitoramento.</p></div>
          {toggles.map(([key, label]) => (
            <label className={`toggle settings-toggle ${key === 'maintenanceMode' ? 'warning' : ''}`} key={key}><input type="checkbox" checked={!!form[key]} onChange={(e) => update(key, e.target.checked)} /><span>{label}</span></label>
          ))}
        </section>
      </div>
      <button className="btn btn-primary settings-save" onClick={() => app.saveSettings(form)}>Salvar configurações</button>
    </div>
  );
}

function PageHeading({ title, subtitle }) {
  return <header className="page-heading"><h1>{title}</h1><p>{subtitle}</p></header>;
}

function SectionCard({ title, subtitle, children }) {
  return (
    <section className="section-card">
      <div className="section-card-head">
        <div><h2 className="section-title">{title}</h2>{subtitle ? <p className="section-subtitle">{subtitle}</p> : null}</div>
      </div>
      {children}
    </section>
  );
}

function KpiCard({ icon: Icon, tone = 'info', label, value, helper }) {
  return (
    <article className={`kpi-card ${tone}`}>
      <span className="kpi-card__icon"><Icon size={19} /></span>
      <span className="kpi-card__label">{label}</span>
      <strong className="kpi-card__value">{value}</strong>
      <small className="kpi-card__helper">{helper}</small>
    </article>
  );
}

function FilterChips({ items, active, onChange }) {
  return <div className="filter-row">{items.map((item) => <button key={item} className={`filter-chip ${active === item ? 'active' : ''}`} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function PremiumTable({ rows, columns }) {
  return (
    <div className="table-card">
      <div className="table-scroll">
        <table className="nv-table">
          <thead><tr>{columns.map((column) => <th key={column.key}>{column.label}</th>)}</tr></thead>
          <tbody>
            {rows.map((row) => <tr key={row.id}>{columns.map((column) => <td key={column.key}>{column.render(row)}</td>)}</tr>)}
          </tbody>
        </table>
        {!rows.length ? <div className="empty-state compact"><strong>Nenhum registro encontrado</strong><span>Ajuste a busca ou os filtros para ampliar os resultados.</span></div> : null}
      </div>
    </div>
  );
}

function initialsFromName(name) {
  return String(name || 'N')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase();
}

function UserCell({ name, sub }) {
  return <span className="user-cell"><span className="avatar-initials">{initialsFromName(name)}</span><span><strong>{name}</strong><small>{sub}</small></span></span>;
}

function RoleBadge({ value }) {
  const normalized = comparableLocation(value);
  const tone = normalized.includes('admin') ? 'violet' : normalized.includes('recepc') ? 'info' : normalized.includes('paciente') ? 'info' : 'neutral';
  return <span className={`badge badge-${tone}`}>{value || 'Não informado'}</span>;
}

function NvBadge({ value }) {
  const label = String(value || 'Não informado');
  const normalized = comparableLocation(label);
  const tone =
    normalized.includes('bloqueado') || normalized.includes('offline') || normalized.includes('negado') || normalized.includes('desativado') || normalized.includes('inativo')
      ? 'danger'
      : normalized.includes('aguardando') || normalized.includes('aten') || normalized.includes('manuten') || normalized.includes('bateria') || normalized.includes('sem sinal')
        ? 'warning'
        : normalized.includes('em rota')
          ? 'info'
          : normalized.includes('ativo') || normalized.includes('online') || normalized.includes('autorizado') || normalized.includes('finalizado') || normalized.includes('encerrado')
            ? 'success'
            : 'neutral';
  return <span className={`badge badge-${tone}`}>{label}</span>;
}

function AccessibilityNote({ value }) {
  const label = String(value || 'Nao');
  const needsCare = comparableLocation(label) !== 'nao';
  return <span className={`accessibility-note ${needsCare ? 'care' : ''}`}>{needsCare ? <Activity size={14} /> : null}{label}</span>;
}

function RowActions({ children }) {
  return <div className="table-actions">{children}</div>;
}

function ActionMenu({ children }) {
  return (
    <details className="action-menu">
      <summary aria-label="Mais acoes"><MoreVertical size={16} /></summary>
      <div>{children}</div>
    </details>
  );
}

function BatteryMeter({ value }) {
  if (value === null || value === undefined) return <span className="battery-meter-unknown">Não informado</span>;
  const safeValue = Number.isFinite(Number(value)) ? Number(value) : 0;
  const tone = safeValue < 15 ? 'danger' : safeValue < 30 ? 'warning' : 'success';
  return <span className="battery-meter"><span><i className={tone} style={{ width: `${Math.max(0, Math.min(100, safeValue))}%` }} /></span><b>{safeValue}%</b></span>;
}

function ReceptionDashboard({ app }) {
  const summary = app.dashboardSummary;
  const waiting = app.checkins.filter((item) => item.status === 'Aguardando').length;
  const sos = summary ? summary.activeSOS : app.calls.filter((call) => call.type === 'SOS Emergencia' && call.status !== 'Encerrado').length;
  const awaitingVisitors = summary ? summary.pendingVisitorRequests : app.visitors.filter((visitor) => visitor.status === 'Aguardando autorizacao').length;
  const openCalls = summary ? summary.openCalls : app.calls.filter((call) => call.status !== 'Encerrado').length;
  const waitingCheckins = app.checkins.filter((item) => item.status === 'Aguardando').slice(0, 4);
  const pendingVisitors = app.visitors.filter((visitor) => visitor.status === 'Aguardando autorizacao').slice(0, 4);
  return (
    <div className="page-view premium-page reception-dashboard">
      <PageHeading title="Painel da Recepção" subtitle="Acompanhe pacientes, visitantes e solicitações em tempo real." />
      <section className="kpi-grid">
        <KpiCard icon={ClipboardCheck} tone="info" label="Check-ins aguardando" value={waiting} helper="Fila inicial" />
        <KpiCard icon={UserCheck} tone="warning" label="Visitantes pendentes" value={awaitingVisitors} helper="Aguardando autorização" />
        <KpiCard icon={HelpCircle} tone="info" label="Chamados ativos" value={openCalls} helper="Não encerrados" />
        <KpiCard icon={HeartPulse} tone="danger" label="SOS ativos" value={sos} helper="Prioridade crítica" />
      </section>
      <section className="two-col">
        <SectionCard title="Pacientes aguardando" subtitle="Check-ins pendentes e primeiros atendimentos.">
          <PremiumTable
            rows={waitingCheckins}
            columns={[
              { key: 'patient', label: 'Paciente', render: (item) => <UserCell name={item.patient} sub={item.document} /> },
              { key: 'destination', label: 'Destino', render: (item) => item.destination },
              { key: 'status', label: 'Status', render: (item) => <NvBadge value={item.status} /> },
              { key: 'time', label: 'Tempo', render: (item) => item.time },
              { key: 'accessibility', label: 'Acessibilidade', render: (item) => <AccessibilityNote value={item.accessibility} /> },
              { key: 'actions', label: 'Acoes', render: (item) => (
                <RowActions>
                  <button className="btn btn-primary" onClick={() => app.updateCheckinStatus(item.id, 'Em rota')}>Iniciar rota</button>
                  <button className="btn btn-secondary" onClick={() => app.openModal('Detalhes do check-in', <Details data={item} />)}>Ver detalhes</button>
                </RowActions>
              ) },
            ]}
          />
        </SectionCard>
        <SectionCard title="Solicitações de visitantes" subtitle="Visitantes aguardando decisão da recepção.">
          <PremiumTable
            rows={pendingVisitors}
            columns={[
              { key: 'name', label: 'Visitante', render: (visitor) => <UserCell name={visitor.name} sub={visitor.profile} /> },
              { key: 'requestedDestination', label: 'Destino', render: (visitor) => visitor.requestedDestination },
              { key: 'status', label: 'Status', render: (visitor) => <NvBadge value={visitor.status} /> },
              { key: 'onlineTime', label: 'Tempo', render: (visitor) => visitor.onlineTime },
              { key: 'actions', label: 'Acoes', render: (visitor) => (
                <RowActions>
                  <button className="btn btn-secondary" onClick={() => app.openModal('Detalhes do visitante', <Details data={visitor} />)}>Ver detalhes</button>
                  <button className="btn btn-success" onClick={() => openAuthorizeVisitor(app, visitor)}>Autorizar</button>
                  <button className="btn btn-danger" onClick={() => openDenyVisitor(app, visitor)}>Negar</button>
                </RowActions>
              ) },
            ]}
          />
        </SectionCard>
      </section>
    </div>
  );
}

function VisitorsAccessPage({ app, accessOnly = false }) {
  const [filter, setFilter] = useState(accessOnly ? 'Aguardando autorizacao' : 'Todos');
  const visible = app.visitors.filter((visitor) => filter === 'Todos' || visitor.status === filter);
  const statuses = ['Todos', 'Online', 'Aguardando autorizacao', 'Autorizado', 'Em rota', 'Chegou ao destino', 'Fora da rota', 'Acesso negado', 'Finalizado', 'Offline'];

  return (
    <div className="page-view premium-page reception-visitors-page">
      <PageHeading
        title={accessOnly ? 'Autorizações' : 'Visitantes'}
        subtitle={accessOnly ? 'Analise solicitações de acesso e libere rotas autorizadas.' : 'Acompanhe visitantes, status de rota e permissões ativas.'}
      />
      <section className="kpi-grid">
        <KpiCard icon={Building2} tone="info" label="Private" value={app.visitors.filter((v) => v.areaId === 'private').length} helper="Visitantes registrados" />
        <KpiCard icon={ShieldCheck} tone="success" label="Autorizados" value={app.visitors.filter((v) => v.status === 'Autorizado').length} helper="Permissao ativa" />
        <KpiCard icon={Clock3} tone="warning" label="Pendentes" value={app.visitors.filter((v) => v.status === 'Aguardando autorizacao').length} helper="Aguardando decisao" />
        <KpiCard icon={HeartPulse} tone="danger" label="Fora da rota" value={app.visitors.filter((v) => v.status === 'Fora da rota').length} helper="Requer atenção" />
      </section>
      <FilterChips items={statuses} active={filter} onChange={setFilter} />
      <SectionCard title={accessOnly ? 'Solicitações de acesso' : 'Visitantes monitorados'} subtitle="Dados reais ou fallback operacional já existente no projeto.">
        <PremiumTable
          rows={visible}
          columns={[
            { key: 'name', label: 'Visitante', render: (visitor) => <UserCell name={visitor.name} sub={`${visitor.profile} - ${visitor.area}`} /> },
            { key: 'entry', label: 'Entrada', render: (visitor) => visitor.entry },
            { key: 'currentLocation', label: 'Local atual', render: (visitor) => visitor.currentLocation },
            { key: 'requestedDestination', label: 'Destino', render: (visitor) => visitor.requestedDestination },
            { key: 'status', label: 'Status', render: (visitor) => <NvBadge value={visitor.status} /> },
            { key: 'onlineTime', label: 'Tempo', render: (visitor) => visitor.onlineTime },
            { key: 'actions', label: 'Acoes', render: (visitor) => (
              <RowActions>
                <button className="btn btn-secondary" onClick={() => app.openModal('Detalhes do visitante', <Details data={visitor} />)}>Ver detalhes</button>
                <button className="btn btn-success" onClick={() => openAuthorizeVisitor(app, visitor)}>Autorizar</button>
                <button className="btn btn-danger" onClick={() => openDenyVisitor(app, visitor)}>Negar</button>
                <ActionMenu>
                  <button onClick={() => app.updateVisitorAccessStatus(visitor, 'Em rota', { requestedDestination: visitor.areaId === 'private' ? 'Recepção Private' : 'Recepção Hospital Marco Capute' }, 'Visitante orientado até a recepção')}>Levar até recepção</button>
                  <button onClick={() => openMessage(app, visitor.name)}>Enviar mensagem</button>
                  <button className="menu-danger" onClick={() => app.updateVisitorAccessStatus(visitor, 'Finalizado', {}, 'Permissao encerrada')}>Encerrar permissao</button>
                </ActionMenu>
              </RowActions>
            ) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function CheckinPage({ app }) {
  const [filter, setFilter] = useState(app.filters.checkin || 'Todos');
  const [query, setQuery] = useState('');
  const visible = app.checkins.filter((item) => (filter === 'Todos' || item.status === filter) && `${item.patient} ${item.document}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <div className="page-view premium-page reception-checkin-page">
      <PageHeading title="Check-ins" subtitle="Registre entradas e acompanhe o fluxo inicial de atendimento." />
      <div className="page-toolbar">
        <div className="page-search"><Search size={16} /><input placeholder="Buscar por nome ou documento" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={() => openCheckin(app)}><Plus size={16} />Novo check-in</button>
        <button className="btn btn-secondary" onClick={() => app.exportToCSV('checkins.csv', visible)}><Download size={16} />Exportar CSV</button>
      </div>
      <FilterChips items={['Todos', 'Aguardando', 'Em rota', 'Em atendimento', 'Finalizado']} active={filter} onChange={setFilter} />
      <SectionCard title="Atendimentos registrados" subtitle="Lista de check-ins com status operacional.">
        <PremiumTable
          rows={visible}
          columns={[
            { key: 'patient', label: 'Paciente', render: (item) => <UserCell name={item.patient} sub={item.document} /> },
            { key: 'destination', label: 'Destino', render: (item) => item.destination },
            { key: 'status', label: 'Status', render: (item) => <NvBadge value={item.status} /> },
            { key: 'time', label: 'Tempo', render: (item) => item.time },
            { key: 'accessibility', label: 'Acessibilidade', render: (item) => <AccessibilityNote value={item.accessibility} /> },
            { key: 'actions', label: 'Acoes', render: (item) => (
              <RowActions>
                <button className="btn btn-primary" onClick={() => app.updateCheckinStatus(item.id, 'Em rota')}>Iniciar rota</button>
                <button className="btn btn-info" onClick={() => app.updateCheckinStatus(item.id, 'Em atendimento')}>Em atendimento</button>
                <button className="btn btn-success" onClick={() => app.updateCheckinStatus(item.id, 'Finalizado')}>Finalizar</button>
                <ActionMenu>
                  <button onClick={() => app.openModal('Detalhes do check-in', <Details data={item} />)}>Ver detalhes</button>
                </ActionMenu>
              </RowActions>
            ) },
          ]}
        />
      </SectionCard>
    </div>
  );
}

function SectorsPage({ app }) {
  return (
    <Panel title="Setores" wide>
      <div className="sector-grid">
        {app.sectors.map((sector) => (
          <article className="sector-card" key={sector.id}>
            <h3>{sector.name}</h3><p>{sector.floor}</p><strong>{sector.peopleCount} pessoas</strong><span>{sector.waitingTime} espera - {sector.flow}</span><em>{sector.status}</em>
            <div>
              <button onClick={() => openSector(app, sector)}>Ver mapa</button>
              <button onClick={() => { app.createMessage({ to: sector.name, message: `Aviso enviado para ${sector.name}`, priority: 'Media' }); }}>Enviar aviso</button>
              <button onClick={() => { app.setSectors((items) => items.map((s) => s.id === sector.id ? { ...s, status: 'Lotado', flow: 'Alto' } : s)); app.showToast('Setor marcado como lotado', 'warning'); }}>Marcar lotado</button>
              <button onClick={() => app.showToast('Rota alternativa recomendada')}>Rota alternativa</button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function MessagesPage({ app }) {
  const selected = app.messages[0];
  return (
    <div className="page-view premium-page reception-messages-page">
      <PageHeading title="Mensagens" subtitle="Comunicação operacional da recepção com pacientes e setores." />
      <div className="page-toolbar">
        <button className="btn btn-primary" onClick={() => openMessage(app)}><Plus size={16} />Criar mensagem</button>
      </div>
      <section className="messages-shell">
        <SectionCard title="Conversas" subtitle="Mensagens registradas">
          <div className="message-list">
            {app.messages.map((msg) => (
              <button className="message-list-item" key={msg.id} onClick={() => app.openModal('Mensagem', <Details data={msg} />)}>
                <span className="avatar-initials">{initialsFromName(msg.to)}</span>
                <span><b>{msg.to}</b><small>{msg.direction} - {msg.time}</small></span>
                <NvBadge value={msg.priority} />
              </button>
            ))}
            {!app.messages.length ? <EmptyState title="Nenhuma mensagem" text="Novas mensagens operacionais aparecerao aqui." /> : null}
          </div>
        </SectionCard>
        <SectionCard title="Previa" subtitle="Mensagem selecionada mais recente">
          {selected ? (
            <article className="message-preview">
              <header><UserCell name={selected.to} sub={`${selected.direction} - ${selected.time}`} /><NvBadge value={selected.priority} /></header>
              <p>{selected.message}</p>
            </article>
          ) : (
            <EmptyState title="Sem mensagem selecionada" text="Selecione uma conversa para ver os detalhes." />
          )}
        </SectionCard>
      </section>
    </div>
  );
}

function EmptyState({ title = 'Nenhum registro encontrado', text }) {
  return <div className="empty-state"><Search size={20} /><strong>{title}</strong>{text ? <span>{text}</span> : null}</div>;
}

function Panel({ title, children, wide = false, meta = null, action = null }) {
  return (
    <section className={`panel ${wide ? 'wide' : ''}`}>
      <div className="panel-title">
        <div>
          <h2>{title}</h2>
          {meta ? <small>{meta}</small> : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  );
}

function Toolbar({ children, className = '' }) { return <div className={`toolbar ${className}`.trim()}>{children}</div>; }

function Pills({ items, active, onChange }) {
  return <div className="pills">{items.map((item) => <button key={item} className={active === item ? 'active' : ''} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function Heatmap({ sectors, nodes = [], floor = heatmapFloorOptions[0], beacons = [], onSelect, large = false, lastUpdated = null }) {
  const sectorNodes = (sector) => {
    const embeddedNodes = (sector.navigationNodes || []).filter((node) => Number.isFinite(Number(node.x)) && Number.isFinite(Number(node.y)));
    const mapNodes = nodes.filter((node) => {
      const nodeSector = node.sector || {};
      return (
        Number.isFinite(Number(node.x)) &&
        Number.isFinite(Number(node.y)) &&
        (nodeSector.id === sector.id || nodeSector.code === sector.code || matchesSector(nodeSector.name || nodeSector.code, sector))
      );
    });
    return [...embeddedNodes, ...mapNodes].filter((node, index, all) => {
      const key = node.id || node.code || `${node.x}-${node.y}-${index}`;
      return all.findIndex((candidate) => (candidate.id || candidate.code || `${candidate.x}-${candidate.y}-${index}`) === key) === index;
    });
  };
  const blockPositionFromNodes = (sector, sectorNodeList) => {
    if (!sectorNodeList.length) return null;
    const xs = sectorNodeList.map((node) => Number(node.x));
    const ys = sectorNodeList.map((node) => Number(node.y));
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const centerX = (minX + maxX) / 2;
    const centerY = (minY + maxY) / 2;
    const w = Math.max(12, Math.min(26, maxX - minX + 12));
    const h = Math.max(12, Math.min(22, maxY - minY + 12));
    return {
      x: Math.max(3, Math.min(95 - w, centerX - w / 2)),
      y: Math.max(5, Math.min(94 - h, centerY - h / 2)),
      w,
      h,
    };
  };
  const mappedSectors = sectors
    .map((sector) => ({ sector, nodes: sectorNodes(sector) }))
    .map((item) => ({ ...item, position: blockPositionFromNodes(item.sector, item.nodes) }))
    .filter((item) => item.position);
  const monitoredPeople = sectors.reduce((total, sector) => total + sector.peopleCount, 0);
  const onlineBeacons = beacons.filter((beacon) => comparableLocation(beacon.status) === 'online').length;
  const highFlow = sectors.filter((sector) => ['critical', 'high'].includes(getHeatLevel(sector.peopleCount))).length;
  const hasMappedFloor = sectors.length > 0 && mappedSectors.length > 0;
  const hasVerticalConnector = sectors.some((sector) => {
    const name = comparableLocation(sector.name);
    return name.includes('elevador') || name.includes('escada');
  });
  const updatedLabel = lastUpdated
    ? lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null;

  return (
    <div className={`heatmap heatmap-dedicated ${large ? 'large' : ''}`}>
      <header className="heatmap-head">
        <div>
          <b>Fluxo de pessoas</b>
          <small className="heatmap-floor-name">{floor.title}</small>
          <div className="heatmap-legend">
            <span><i className="critical" />Muito alto</span>
            <span><i className="high" />Alto</span>
            <span><i className="medium" />Medio</span>
            <span><i className="low" />Baixo</span>
            <span><i className="very-low" />Muito baixo</span>
          </div>
        </div>
        {updatedLabel ? (
          <div className="heatmap-update" aria-live="polite">
            <span><Clock3 size={14} />Atualizado as {updatedLabel}</span>
            <small>Auto a cada {OPERATIONAL_REFRESH_MS / 1000}s</small>
          </div>
        ) : null}
      </header>
      <div className={`hospital-map schematic-map ${hasMappedFloor ? '' : 'unmapped'}`}>
        {hasMappedFloor ? (
          <>
            <div className="map-corridor corridor-main" />
            <div className="map-corridor corridor-cross-a" />
            <div className="map-corridor corridor-cross-b" />
            {mappedSectors.map(({ sector, position }) => {
              const level = getHeatLevel(sector.peopleCount);
              return (
                <button
                  key={sector.id}
                  className={`map-sector-block ${level}`}
                  style={{
                    '--x': `${position.x}%`,
                    '--y': `${position.y}%`,
                    '--w': `${position.w}%`,
                    '--h': `${position.h}%`,
                    '--heat-size': `${Math.max(70, Math.min(142, 56 + sector.peopleCount * 0.9))}px`,
                  }}
                  onClick={() => onSelect(sector)}
                  aria-label={`${sector.name}, ${sector.peopleCount} pessoas, fluxo ${sector.flow}`}
                >
                  <span className="sector-glow" />
                  <span className="sector-copy">
                    <b>{sector.name}</b>
                    <small>{sector.peopleCount} pessoas</small>
                  </span>
                </button>
              );
            })}
            {hasVerticalConnector ? (
              <div className="vertical-connector">
                <Building2 size={16} />
                <span>Conexao vertical</span>
                <small>Dados estruturais disponiveis neste andar</small>
              </div>
            ) : null}
          </>
        ) : (
          <div className="floor-empty-state">
            <span>{floor.special ? <Activity size={24} /> : <MapIcon size={24} />}</span>
            <h3>{floor.special ? 'Mapeamento do Terraço / Heliponto ainda não configurado.' : 'Mapeamento deste andar ainda não disponível.'}</h3>
            <p>Os setores e pontos de navegação serão exibidos após a configuração estrutural.</p>
          </div>
        )}
      </div>
      <footer className="heatmap-foot">
        <span><Users size={15} />{monitoredPeople} pessoas monitoradas</span>
        <span><Building2 size={15} />{sectors.length} setores</span>
        <span><RadioTower size={15} />{onlineBeacons} beacons online</span>
        <span><Activity size={15} />{highFlow} com fluxo alto</span>
      </footer>
    </div>
  );
}

function getHeatLevel(count) {
  if (count <= 5) return 'very-low';
  if (count >= 75) return 'critical';
  if (count >= 45) return 'high';
  if (count >= 18) return 'medium';
  return 'low';
}

function heatLevelLabel(level) {
  return {
    critical: 'Muito alto',
    high: 'Alto',
    medium: 'Medio',
    low: 'Baixo',
    'very-low': 'Muito baixo',
  }[level] || 'Baixo';
}

function getCallTypeMeta(call) {
  const type = comparableLocation(call.type);
  const priority = comparableLocation(call.priority);
  if (type.includes('sos') || priority.includes('critica')) return { tone: 'critical', Icon: HeartPulse };
  if (type.includes('ajuda')) return { tone: 'help', Icon: HelpCircle };
  if (type.includes('medico')) return { tone: 'medical', Icon: Activity };
  if (type.includes('perdido') || type.includes('locomocao')) return { tone: 'info', Icon: MapIcon };
  return { tone: 'neutral', Icon: MessageSquare };
}

function getPriorityBadgeTone(priority) {
  const normalized = comparableLocation(priority);
  if (normalized.includes('critica')) return 'critical';
  if (normalized.includes('alta')) return 'high';
  if (normalized.includes('media')) return 'medium';
  if (normalized.includes('baixa')) return 'low';
  return 'neutral';
}

function getStatusBadgeTone(status) {
  const normalized = comparableLocation(status);
  if (normalized.includes('encerrado') || normalized.includes('cancelado')) return 'closed';
  if (normalized.includes('atendimento')) return 'attending';
  if (normalized.includes('aceito') || normalized.includes('acionada')) return 'accepted';
  if (normalized.includes('pendente') || normalized.includes('aguardando')) return 'pending';
  return 'neutral';
}

function CallCard({ call, app, reception = false, adminView = false }) {
  const critical = call.priority === 'Critica' || call.type === 'SOS Emergencia';
  if (!adminView) {
    const typeMeta = getCallTypeMeta(call);
    const TypeIcon = typeMeta.Icon;
    const closed = call.status === 'Encerrado';
    const cardTone = closed ? 'closed' : typeMeta.tone;
    return (
      <article className={`call-card ${cardTone} ${critical ? 'critical' : ''}`}>
        <header className="call-card-head">
          <div className="call-title-row">
            <span className="call-type-icon" aria-hidden="true"><TypeIcon size={19} /></span>
            <div>
              <b>{call.type}</b>
              <h3>{call.patient}</h3>
            </div>
          </div>
          {call.createdAt ? <span className="call-time"><Clock3 size={14} aria-hidden="true" />{call.createdAt}</span> : null}
        </header>

        <p>{call.reason}</p>
        <span className="call-location"><MapIcon size={14} aria-hidden="true" />{call.location} - {call.beacon}</span>
        {call.emergencyContact ? (
          <span className="call-emergency-contact"><HeartPulse size={14} aria-hidden="true" />Contato de emergência: {call.emergencyContact}</span>
        ) : null}
        {call.needs?.length ? <span className="call-extra"><b>Precisa:</b> {call.needs.join(', ')}</span> : null}
        {call.callerPhone ? <span className="call-extra"><b>Telefone:</b> {call.callerPhone}</span> : null}

        <div className="badges call-badges">
          <em className={`call-badge ${getPriorityBadgeTone(call.priority)}`}>{call.priority}</em>
          <em className={`call-badge ${getStatusBadgeTone(call.status)}`}>{call.status}</em>
          {call.registeredPatient === false ? <em className="call-badge unregistered" title="Chamado antigo, enviado sem conta (antes do login obrigatório). Confirme no local.">Sem conta</em> : null}
        </div>

        <div className="actions call-actions">
          <button className="action-neutral" onClick={() => app.openModal('Detalhes do chamado', <CallDetails call={call} />)}><Search size={15} aria-hidden="true" />Ver detalhes</button>
          <button className="action-success" onClick={() => app.updateCallStatus(call.id, statusOrder.Aceito)}><CheckCircle2 size={15} aria-hidden="true" />Aceitar</button>
          <button className="action-primary" onClick={() => app.assignTeam(call.id)}><Users size={15} aria-hidden="true" />Acionar equipe</button>
          <button className="action-warning" onClick={() => app.updateCallStatus(call.id, statusOrder['Em atendimento'])}><Clock3 size={15} aria-hidden="true" />Em atendimento</button>
          <button className="action-danger" onClick={() => app.closeCall(call.id)}><HeartPulse size={15} aria-hidden="true" />Encerrar</button>
          {reception ? (
            <ActionMenu>
              <button onClick={() => openDoctor(app, call)}>Solicitar medico</button>
            </ActionMenu>
          ) : null}
        </div>
      </article>
    );
  }

  const typeMeta = getCallTypeMeta(call);
  const TypeIcon = typeMeta.Icon;
  const closed = call.status === 'Encerrado';
  const cardTone = closed ? 'closed' : typeMeta.tone;
  return (
    <article className={`call-card ${cardTone} ${critical ? 'critical' : ''}`}>
      <header className="call-card-head">
        <div className="call-title-row">
          <span className="call-type-icon" aria-hidden="true"><TypeIcon size={19} /></span>
          <div>
            <b>{call.type}</b>
            <h3>{call.patient}</h3>
          </div>
        </div>
        {call.createdAt ? <span className="call-time"><Clock3 size={14} aria-hidden="true" />{call.createdAt}</span> : null}
      </header>

      <p>{call.reason}</p>
      <span className="call-location"><MapIcon size={14} aria-hidden="true" />{call.location} - {call.beacon}</span>
      {call.emergencyContact ? (
        <span className="call-emergency-contact"><HeartPulse size={14} aria-hidden="true" />Contato de emergência: {call.emergencyContact}</span>
      ) : null}
      {call.needs?.length ? <span className="call-extra"><b>Precisa:</b> {call.needs.join(', ')}</span> : null}
      {call.callerPhone ? <span className="call-extra"><b>Telefone:</b> {call.callerPhone}</span> : null}

      <div className="badges call-badges">
        <em className={`call-badge ${getPriorityBadgeTone(call.priority)}`}>{call.priority}</em>
        <em className={`call-badge ${getStatusBadgeTone(call.status)}`}>{call.status}</em>
        {call.registeredPatient === false ? <em className="call-badge unregistered" title="Chamado antigo, enviado sem conta (antes do login obrigatório). Confirme no local.">Sem conta</em> : null}
      </div>

      <div className="actions call-actions">
        <button className="action-neutral" onClick={() => app.openModal('Detalhes do chamado', <CallDetails call={call} />)}><Search size={15} aria-hidden="true" />Ver detalhes</button>
        <button className="action-success" onClick={() => app.updateCallStatus(call.id, statusOrder.Aceito)}><CheckCircle2 size={15} aria-hidden="true" />Aceitar</button>
        <button className="action-primary" onClick={() => app.assignTeam(call.id)}><Users size={15} aria-hidden="true" />Acionar equipe</button>
        <button className="action-warning" onClick={() => app.updateCallStatus(call.id, statusOrder['Em atendimento'])}><Clock3 size={15} aria-hidden="true" />Em atendimento</button>
        <button className="action-danger" onClick={() => app.closeCall(call.id)}><HeartPulse size={15} aria-hidden="true" />Encerrar</button>
      </div>
    </article>
  );
}

function openProfileEditor(app) {
  app.openModal('Meu perfil', <ProfileForm user={app.currentUser} onSubmit={app.updateCurrentUserProfile} />);
}

function ProfileForm({ user, onSubmit }) {
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    phone: user?.phone || '',
    sector: user?.sector || '',
    roleLabel: user?.roleLabel || '',
    avatarDataUrl: user?.avatarDataUrl || '',
  });
  const [error, setError] = useState('');
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const pickPhoto = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setError('Selecione uma imagem valida.');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      setError('Use uma imagem de ate 2 MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      update('avatarDataUrl', String(reader.result || ''));
      setError('');
    };
    reader.readAsDataURL(file);
  };

  return (
    <form
      className="modal-form profile-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <div className="profile-photo-editor">
        <LayoutOperatorAvatar user={form} size="lg" />
        <label className="photo-upload">
          <Camera size={16} />
          Alterar foto
          <input type="file" accept="image/*" onChange={pickPhoto} />
        </label>
        {form.avatarDataUrl ? <button type="button" onClick={() => update('avatarDataUrl', '')}>Remover foto</button> : null}
      </div>
      {error ? <p className="form-error">{error}</p> : null}
      <label>Nome exibido<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label>E-mail<input disabled value={form.email} /></label>
      <label>Telefone<input value={form.phone} onChange={(event) => update('phone', event.target.value)} /></label>
      <label>Cargo<input value={form.roleLabel} onChange={(event) => update('roleLabel', event.target.value)} /></label>
      <label>Setor<input value={form.sector} onChange={(event) => update('sector', event.target.value)} /></label>
      <p className="form-note">Alterações visuais ficam salvas nesta sessão do painel. O e-mail e a permissão continuam vindo da autenticação real.</p>
      <button className="primary">Salvar perfil</button>
    </form>
  );
}

function CallDetails({ call }) {
  return <Details data={{ ...call, historico: call.history.join(' | ') }} />;
}

function Details({ data }) {
  return <div className="details">{Object.entries(data).map(([key, value]) => <p key={key}><b>{key}</b><span>{Array.isArray(value) ? value.join(', ') : String(value)}</span></p>)}</div>;
}

function UserProfile({ user }) {
  return <div><Details data={user} /><h3>Histórico de rota</h3><ul><li>Recepção para Tomografia</li><li>Tomografia para Laboratório</li><li>Preferência: rota acessível</li></ul></div>;
}

function ReportView({ report }) {
  return <div className="report-view">{Object.entries(report).map(([key, value]) => <article key={key}><span>{key}</span><b>{Array.isArray(value) ? value.join(' | ') : value}</b></article>)}</div>;
}

function ReportFooter({ app, report }) {
  return <button onClick={() => app.exportToCSV(`relatorio-${report.period}.csv`, [report])}>Baixar CSV</button>;
}

function openSector(app, sector) {
  const beacons = app.beacons.filter((beacon) => matchesSector(beacon.sector, sector) || matchesSector(beacon.location, sector));
  const alerts = app.calls.filter((call) => matchesSector(call.location, sector) && call.status !== 'Encerrado');
  app.openModal('Detalhes do setor', <Details data={{ ...sector, beaconsAtivos: beacons.length, alertas: alerts.length }} />);
}

function openMessage(app, to = 'Pacientes') {
  const form = { to, message: '', priority: 'Media' };
  app.openModal('Enviar mensagem', <Form fields={[['to', 'Destinatario'], ['message', 'Mensagem'], ['priority', 'Prioridade']]} data={form} onSubmit={(data) => app.createMessage(data)} />);
}

function openDoctor(app, call) {
  app.openModal('Solicitar medico', <Form fields={[['reason', 'Motivo']]} data={{ reason: call.reason }} onSubmit={(data) => {
    app.setCalls((items) => [{ ...call, id: `CH-${Date.now()}`, type: 'Solicitar Medico', reason: data.reason, priority: 'Alta', status: 'Pendente', history: ['Solicitação médica criada'] }, ...items]);
    app.showToast('Solicitação médica criada');
    app.closeModal();
  }} />);
}

function openCheckin(app) {
  app.openModal('Novo check-in', <Form fields={[['patient', 'Nome paciente'], ['document', 'Documento'], ['destination', 'Destino'], ['accessibility', 'Precisa acessibilidade?'], ['observations', 'Observações']]} data={{ patient: '', document: '', destination: 'Tomografia', accessibility: 'Nao', observations: '' }} onSubmit={app.createCheckin} />);
}

function openAuthorizeVisitor(app, visitor) {
  app.openModal(
    'Autorizar acesso do visitante',
    <VisitorAuthorizationForm visitor={visitor} onSubmit={(data) => app.authorizeVisitor(visitor, data)} />,
    <button onClick={app.closeModal}>Cancelar</button>
  );
}

function openDenyVisitor(app, visitor) {
  app.openModal(
    'Negar acesso',
    <VisitorDenyForm visitor={visitor} onSubmit={(reason) => app.denyVisitor(visitor, reason)} />,
    <button onClick={app.closeModal}>Cancelar</button>
  );
}

function openStaffAccount(app) {
  app.openModal('Cadastrar funcionário', <StaffAccountForm onSubmit={app.createStaffAccount} />);
}

// Senha forte: mesma regra do backend (backend-nest/src/common/strong-password.ts).
const STAFF_PASSWORD_RULE = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[^A-Za-z0-9\s])\S{8,72}$/;

function StaffAccountForm({ onSubmit }) {
  const [form, setForm] = useState({ name: '', email: '', role: 'reception', password: '' });
  const [sending, setSending] = useState(false);
  const passwordOk = STAFF_PASSWORD_RULE.test(form.password);

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="modal-form"
      onSubmit={async (event) => {
        event.preventDefault();
        if (!passwordOk || sending) return;
        setSending(true);
        try {
          await onSubmit(form);
        } finally {
          setSending(false);
        }
      }}
    >
      <label>Nome do funcionário<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label>E-mail de login<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
      <label>Tipo de acesso
        <select value={form.role} onChange={(event) => update('role', event.target.value)}>
          <option value="reception">Recepção</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <label>Senha inicial
        <input required type="password" autoComplete="new-password" value={form.password} onChange={(event) => update('password', event.target.value)} />
      </label>
      <p className={passwordOk || !form.password ? 'form-note' : 'form-error'}>
        Mínimo de 8 caracteres, com letra, número e símbolo, sem espaço. Entregue a senha à pessoa pessoalmente. Cada funcionário tem a própria conta; para tirar o acesso, desative (não é possível excluir).
      </p>
      <button className="primary" disabled={!passwordOk || sending}>{sending ? 'Cadastrando...' : 'Cadastrar funcionário'}</button>
    </form>
  );
}

function VisitorAuthorizationForm({ visitor, onSubmit }) {
  const [form, setForm] = useState({
    releaseType: 'Liberar rota ate o destino',
    releaseTime: '30 minutos',
  });
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  const routePreview =
    visitor.areaId === 'private'
      ? 'Recepção Private -> rota autorizada -> destino Private'
      : 'Recepção Hospital Marco Capute -> rota autorizada -> destino SUS';

  return (
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSubmit(form); }}>
      <Details data={{
        visitante: visitor.name,
        area: visitor.area,
        entrada: visitor.entry,
        localAtual: visitor.currentLocation,
        destinoSolicitado: visitor.requestedDestination,
        motivo: visitor.reason,
      }} />
      <label>Tipo de liberacao
        <select value={form.releaseType} onChange={(event) => update('releaseType', event.target.value)}>
          <option>Liberar rota ate o destino</option>
          <option>Liberar somente até a recepção</option>
          <option>Liberar com acompanhante</option>
          <option>Negar acesso</option>
        </select>
      </label>
      <label>Tempo de liberacao
        <select value={form.releaseTime} onChange={(event) => update('releaseTime', event.target.value)}>
          <option>15 minutos</option>
          <option>30 minutos</option>
          <option>1 hora</option>
          <option>Ate finalizar visita</option>
        </select>
      </label>
      <div className="route-preview"><b>Rota permitida</b><span>{routePreview}</span></div>
      <button className="primary">Confirmar autorizacao</button>
    </form>
  );
}

function StaffStatusForm({ account, deactivate, onSubmit }) {
  const [reason, setReason] = useState('');
  const [sending, setSending] = useState(false);
  const submit = async (event) => {
    event.preventDefault();
    if (sending) return;
    setSending(true);
    try {
      await onSubmit(reason.trim());
    } finally {
      setSending(false);
    }
  };
  return (
    <form className="modal-form" onSubmit={submit}>
      <Details data={{ funcionario: account.name, email: account.email, perfil: account.roleLabel }} />
      <p className="form-note">
        {deactivate
          ? 'A pessoa nao conseguira mais entrar no painel e sessoes abertas serao encerradas. Os registros do que ela fez (autorizacoes, recusas e alteracoes) continuam salvos. Funcionarios nunca sao excluidos.'
          : 'A pessoa volta a ter acesso ao painel com o mesmo perfil de antes.'}
      </p>
      <label>Motivo (opcional)
        <textarea
          rows={3}
          maxLength={300}
          value={reason}
          placeholder={deactivate ? 'Ex.: desligamento, troca de setor, ferias' : 'Ex.: retorno ao setor'}
          onChange={(event) => setReason(event.target.value)}
        />
      </label>
      <button className={`primary ${deactivate ? 'danger' : ''}`} disabled={sending}>
        {sending ? 'Salvando...' : deactivate ? 'Confirmar desativacao' : 'Confirmar reativacao'}
      </button>
    </form>
  );
}

const visitorDecisionLabels = {
  APPROVED: 'Autorizado',
  DENIED: 'Negado',
  IN_ROUTE: 'Autorizado',
  ARRIVED: 'Autorizado',
  OFF_ROUTE: 'Autorizado',
  FINISHED: 'Autorizado',
  EXPIRED: 'Autorizado',
  CANCELED: 'Cancelado',
};

function StaffAuditView({ account }) {
  const [state, setState] = useState({ loading: Boolean(account.apiId), data: null, error: '' });

  useEffect(() => {
    if (!account.apiId) return undefined;
    let active = true;
    adminApi
      .getStaffAudit(account.apiId)
      .then((data) => active && setState({ loading: false, data, error: '' }))
      .catch((error) => active && setState({
        loading: false,
        data: null,
        error: isNetworkError(error) ? 'API indisponivel. Tente novamente em instantes.' : 'Nao foi possivel carregar o historico.',
      }));
    return () => {
      active = false;
    };
  }, [account.apiId]);

  if (!account.apiId) {
    return <p className="form-note">O historico fica disponivel quando o painel esta conectado a API. Este e um perfil de demonstracao.</p>;
  }
  if (state.loading) return <p className="form-note">Carregando historico...</p>;
  if (state.error) return <p className="form-error">{state.error}</p>;

  const changes = state.data?.status_changes || [];
  const decisions = state.data?.visitor_decisions || [];
  const actions = state.data?.actions || [];
  const when = (value) => (value ? new Date(value).toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' }) : '-');

  return (
    <div className="staff-audit">
      <Details data={{ funcionario: account.name, situacao: account.status, perfil: account.roleLabel }} />
      <h3>Alteracoes de acesso</h3>
      {changes.length ? (
        <ul className="staff-audit-list">
          {changes.map((change) => (
            <li key={change.id}>
              <b>{change.action === 'DEACTIVATED' ? 'Desativado' : 'Reativado'}</b>
              <span>{when(change.created_at)} por {change.performed_by?.name || '-'}</span>
              {change.reason ? <small>Motivo: {change.reason}</small> : null}
            </li>
          ))}
        </ul>
      ) : <p className="form-note">Nenhuma alteracao de acesso registrada.</p>}
      <h3>Decisoes sobre visitantes</h3>
      {decisions.length ? (
        <ul className="staff-audit-list">
          {decisions.map((decision) => (
            <li key={decision.id}>
              <b>{visitorDecisionLabels[decision.status] || decision.status}: {decision.visitor_name}</b>
              <span>{decision.requested_destination} - {decision.area_name} - {when(decision.decided_at)}</span>
              {decision.denied_reason ? <small>Motivo: {decision.denied_reason}</small> : null}
            </li>
          ))}
        </ul>
      ) : <p className="form-note">Nenhuma autorizacao ou recusa registrada para este funcionario.</p>}
      <h3>Acoes no painel (ultimas 100)</h3>
      {actions.length ? (
        <ul className="staff-audit-list">
          {actions.map((entry) => (
            <li key={entry.id}>
              <b>{auditActionLabels[entry.action] || entry.action}{entry.entity_id ? ` #${entry.entity_id}` : ''}</b>
              <span>{when(entry.created_at)}{entry.details?.status ? ` - novo status: ${entry.details.status}` : ''}</span>
            </li>
          ))}
        </ul>
      ) : <p className="form-note">Nenhuma acao registrada para este funcionario.</p>}
    </div>
  );
}

// Acoes gravadas pela auditoria do backend (audit/audit.interceptor.ts).
const auditActionLabels = {
  'auth.login': 'Entrou no painel',
  'auth.registerStaff': 'Cadastrou funcionario',
  'calls.updateStatus': 'Alterou chamado',
  'visitoraccess.approve': 'Autorizou visita',
  'visitoraccess.authorize': 'Autorizou visita',
  'visitoraccess.deny': 'Negou visita',
  'visitoraccess.updateStatus': 'Alterou visita',
  'visitoraccess.get.view': 'Abriu pedido de visita',
  'checkins.create': 'Fez check-in',
  'checkins.updateStatus': 'Alterou check-in',
  'checkins.get.view': 'Abriu check-in',
  'operationalmessages.create': 'Enviou mensagem',
  'operationalmessages.markRead': 'Leu mensagem',
  'staff.deactivate': 'Desativou funcionario',
  'staff.reactivate': 'Reativou funcionario',
  'staff.audit.view': 'Abriu historico de funcionario',
  'reports.adminReport': 'Gerou relatorio',
};

function VisitorDenyForm({ visitor, onSubmit }) {
  const [reason, setReason] = useState('Horario de visita encerrado');
  return (
    <form className="modal-form" onSubmit={(event) => { event.preventDefault(); onSubmit(reason); }}>
      <Details data={{ visitante: visitor.name, destinoSolicitado: visitor.requestedDestination }} />
      <label>Motivo da negativa
        <select value={reason} onChange={(event) => setReason(event.target.value)}>
          <option>Horario de visita encerrado</option>
          <option>Destino restrito</option>
          <option>Dados insuficientes</option>
          <option>Orientar presencialmente na recepção</option>
          <option>Outro</option>
        </select>
      </label>
      <button className="primary danger">Confirmar negativa</button>
    </form>
  );
}

function Form({ fields, data, onSubmit }) {
  const [form, setForm] = useState(data);
  return <form className="modal-form" onSubmit={(e) => { e.preventDefault(); onSubmit(form); }}>{fields.map(([key, label]) => <label key={key}>{label}<input value={form[key] || ''} onChange={(e) => setForm((current) => ({ ...current, [key]: e.target.value }))} /></label>)}<button className="primary">Salvar</button></form>;
}

function Toast({ toast }) {
  return toast ? <div className={`toast ${toast.type}`}>{toast.message}</div> : null;
}

function Modal({ modal, onClose }) {
  if (!modal) return null;
  return <div className="modal-backdrop" onClick={onClose}><section className="modal" onClick={(e) => e.stopPropagation()}><header><h2>{modal.title}</h2><button onClick={onClose}>x</button></header><div>{modal.content}</div>{modal.footer && <footer>{modal.footer}</footer>}</section></div>;
}

createRoot(document.getElementById('root')).render(<App />);

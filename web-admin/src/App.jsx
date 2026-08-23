import React, { useEffect, useMemo, useState } from 'react';
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
  ['admin-settings', 'Configuracoes', Settings],
];

const receptionNav = [
  ['reception-dashboard', 'Painel', Gauge],
  ['reception-visitors', 'Visitantes', UserCheck],
  ['reception-access', 'Autorizacoes', ShieldCheck],
  ['reception-checkin', 'Check-ins', ClipboardCheck],
  ['reception-calls', 'Chamados', HelpCircle],
  ['reception-messages', 'Mensagens', MessageSquare],
  ['reception-settings', 'Configuracoes', Settings],
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
  reception: 'Recepcao',
};

function mapUserToStaffAccount(user) {
  const role = roleMap[user?.role];
  return {
    id: `API-${user?.id}`,
    name: user?.name || 'Funcionario Navora',
    email: user?.email,
    phone: user?.phone,
    role,
    roleLabel: roleLabelMap[role] || user?.role,
    sector: role === 'admin' ? 'Gestao' : 'Recepcao',
    status: user?.active === false ? 'Inativo' : 'Ativo',
    createdAt: user?.createdAt || '',
    lastLogin: 'Agora',
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
    createdAt: created
      ? created.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Agora',
    assignedTo: 'Nao atribuido',
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
    beacon: request.current_beacon || request.beacon || 'Nao informado',
    requestedDestination: request.requested_destination,
    reason: request.reason,
    accessibility: request.accessibility,
    status: visitorApiStatusToLabel[request.status] || request.status,
    onlineTime: created ? `${Math.max(1, Math.round((Date.now() - created.getTime()) / 60000))} min` : 'Agora',
    allowedRoute: request.authorized_route || request.allowed_route || '',
    allowedTime: request.permission_minutes ? `${request.permission_minutes} minutos` : request.allowed_time || '',
    releaseType: request.release_type,
    denialReason: request.denial_reason,
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

function matchesFloor(filter, floor) {
  if (!filter || filter === 'Todos') return true;
  const wanted = comparableLocation(filter);
  const current = comparableLocation(floor);
  return current === wanted || current.includes(wanted) || wanted.includes(current);
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
  } catch (error) {
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
      showToast('Sessao invalida ou expirada.', 'danger');
      return true;
    }

    if (isForbiddenError(error)) {
      showToast(forbiddenMessage, 'danger');
      return true;
    }

    return false;
  };

  const loadVisitorAccessRequests = async () => {
    try {
      const requests = await adminApi.getVisitorAccessRequests();
      setVisitors(requests.map(mapVisitorAccessFromApi));
    } catch (error) {
      if (handleAuthFailure(error)) return;
      showToast('API indisponivel, mantendo dados simulados de visitantes', 'warning');
    }
  };

  const loadCalls = async () => {
    try {
      const requests = await adminApi.getCalls();
      setCalls(requests.map(mapCallFromApi));
    } catch (error) {
      if (handleAuthFailure(error)) return;
      showToast('API indisponivel, mantendo chamados simulados', 'warning');
    }
  };

  const loadDashboardSummary = async () => {
    try {
      const summary = await adminApi.getDashboardSummary();
      setDashboardSummary(summary);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setDashboardSummary(null);
      showToast('API indisponivel, mantendo resumo local', 'warning');
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
      showToast('API indisponivel, usando check-ins simulados', 'warning');
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
      showToast('API indisponivel, usando mensagens simuladas', 'warning');
    }
  };

  const loadSectors = async () => {
    try {
      const { data: apiSectors, source } = await adminApi.getSectors();
      if (!Array.isArray(apiSectors)) throw new Error('Formato invalido de setores');

      const structuralSectors = apiSectors.map(normalizeSectorFromApi);
      setSectors(mergeSectorOperationalFallback(structuralSectors, initialSectors));
      setSectorsSource(source);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setSectors(initialSectors);
      setSectorsSource('fallback');
      showToast('API indisponivel, usando setores simulados', 'warning');
    }
  };

  const loadBeacons = async () => {
    try {
      const { data: apiBeacons, source } = await adminApi.getBeacons();
      if (!Array.isArray(apiBeacons)) throw new Error('Formato invalido de beacons');

      setBeacons(apiBeacons.map(normalizeBeaconFromApi));
      setBeaconsSource(source);
    } catch (error) {
      if (handleAuthFailure(error)) return;
      setBeacons(initialBeacons);
      setBeaconsSource('fallback');
      showToast('API indisponivel, usando beacons simulados', 'warning');
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

  useEffect(() => {
    if (currentRole) {
      loadVisitorAccessRequests();
      loadCalls();
      loadDashboardSummary();
      loadCheckIns();
      loadMessages();
      loadSectors();
      loadBeacons();
      loadNavigationData();
    }
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
            showToast('Sessao invalida ou expirada.', 'danger');
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
        showToast('Resposta de autenticacao invalida.', 'danger');
        return;
      }

      const account = mapUserToStaffAccount(auth?.user);

      if (!account.role || !['admin', 'reception'].includes(account.role)) {
        clearAdminSession();
        showToast('Este perfil nao possui acesso ao painel administrativo.', 'danger');
        return;
      }

      if (role && account.role !== role) {
        clearAdminSession();
        showToast('Perfil selecionado nao corresponde ao usuario autenticado', 'danger');
        return;
      }

      storeAdminSession({ accessToken: auth.access_token, user: auth.user });
      const authUser = await adminApi.getAuthMe();
      const confirmedAccount = mapUserToStaffAccount(authUser);

      if (!confirmedAccount.role || !['admin', 'reception'].includes(confirmedAccount.role)) {
        clearAdminSession();
        showToast('Este perfil nao possui acesso ao painel administrativo.', 'danger');
        return;
      }

      if (role && confirmedAccount.role !== role) {
        clearAdminSession();
        showToast('Perfil selecionado nao corresponde ao usuario autenticado', 'danger');
        return;
      }

      storeAdminSession({ accessToken: auth.access_token, user: authUser });
      enterAdminPanel(confirmedAccount);
      showToast(`Bem-vindo(a), ${confirmedAccount.name}`, 'info');
    } catch (error) {
      if (isNetworkError(error)) {
        showToast('Nao foi possivel conectar ao backend de autenticacao.', 'danger');
        return;
      }
      if (isUnauthorizedError(error)) {
        clearAdminSession();
        showToast('Credenciais invalidas ou sessao expirada.', 'danger');
        return;
      }
      if (isForbiddenError(error)) {
        showToast('Acesso negado para este perfil.', 'danger');
        return;
      }
      showToast('Nao foi possivel autenticar agora', 'danger');
    }
  };

  const logout = () => {
    leaveAdminPanel();
    showToast('Sessao encerrada', 'info');
  };

  const createStaffAccount = (data) => {
    const emailExists = staffAccounts.some(
      (item) => item.email.toLowerCase() === data.email.trim().toLowerCase()
    );

    if (emailExists) {
      showToast('Ja existe uma conta com este e-mail', 'warning');
      return;
    }

    const role = data.role || 'reception';
    const roleLabel = role === 'admin' ? 'Administrador' : 'Recepcao';
    const nextAccount = {
      id: `AC-${Date.now()}`,
      name: data.name,
      email: data.email,
      role,
      roleLabel,
      sector: data.sector || 'Recepcao',
      status: data.status || 'Ativo',
      createdAt: new Date().toLocaleDateString('pt-BR'),
      lastLogin: 'Nunca',
    };

    setStaffAccounts((items) => [nextAccount, ...items]);
    setUsers((items) => [
      {
        id: Date.now(),
        name: nextAccount.name,
        role: nextAccount.roleLabel,
        status: nextAccount.status,
        location: nextAccount.sector,
        lastSeen: 'Nunca',
        accessibility: 'Nao',
      },
      ...items,
    ]);
    showToast('Funcionario cadastrado com acesso ao sistema');
    closeModal();
  };

  const toggleStaffStatus = (id) => {
    setStaffAccounts((items) =>
      items.map((item) =>
        item.id === id
          ? { ...item, status: item.status === 'Ativo' ? 'Inativo' : 'Ativo' }
          : item
      )
    );
    showToast('Status de acesso atualizado');
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
      showToast('Chamado nao atualizado. Dados locais mantidos.', 'danger');
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
      showToast('Equipe nao acionada. Dados locais mantidos.', 'danger');
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
      showToast('Check-in nao criado. API indisponivel ou dados recusados.', 'danger');
    }
  };

  const updateCheckinStatus = async (id, status) => {
    try {
      const updated = await adminApi.updateCheckInStatus(id, checkInLabelToApiStatus[status] || status);
      setCheckins((items) => items.map((item) => (item.id === id ? mapCheckInFromApi(updated) : item)));
      showToast(`Check-in atualizado para ${status}`);
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para atualizar check-in')) return;
      showToast('Check-in nao atualizado. Dados locais mantidos.', 'danger');
    }
  };

  const updateBeacon = (id, changes) => {
    setBeacons((items) => items.map((item) => (item.id === id ? { ...item, ...changes } : item)));
  };

  const restartBeacon = (id) => {
    updateBeacon(id, { status: 'Reiniciando...' });
    showToast('Reiniciando beacon', 'info');
    window.setTimeout(() => {
      updateBeacon(id, { status: 'Online', battery: Math.max(beacons.find((b) => b.id === id)?.battery || 80, 35), lastSignal: 'Agora' });
      showToast('Beacon online novamente');
    }, 900);
  };

  const createMessage = async (data) => {
    try {
      const created = await adminApi.createOperationalMessage(data);
      setMessages((items) => [mapMessageFromApi(created), ...items]);
      showToast('Mensagem enviada');
      closeModal();
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para enviar mensagem')) return;
      showToast('Mensagem nao enviada. API indisponivel ou dados recusados.', 'danger');
    }
  };

  const saveSettings = (data) => {
    setSettings((current) => ({ ...current, ...data }));
    showToast('Configuracoes salvas');
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
      showToast('Visitante nao atualizado. Dados locais mantidos.', 'danger');
      return;
    }
    loadVisitorAccessRequests();
    loadDashboardSummary();
  };

  const authorizeVisitor = async (visitor, data) => {
    const allowedRoute =
      visitor.areaId === 'private'
        ? `Recepcao Private -> rota autorizada -> ${visitor.requestedDestination}`
        : `Recepcao Hospital Marco Capute -> rota autorizada -> ${visitor.requestedDestination}`;

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
      showToast('Acesso nao autorizado. Dados locais mantidos.', 'danger');
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
      showToast('Negativa nao registrada. Dados locais mantidos.', 'danger');
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
    const lowBeacon = beacons.find((beacon) => beacon.battery < 30);
    return {
      period,
      monitoredPeople: users.length,
      activeRoutes,
      sos,
      help,
      doctor,
      averageResponse: '4 min',
      busiestSector: busiestSector?.name || 'Recepcao',
      lowBeacon: lowBeacon?.id || 'Nenhum',
      closed: calls.filter((call) => call.status === 'Encerrado').length,
      pending: calls.filter((call) => call.status === 'Pendente').length,
      recommendations: ['Reforcar equipe no Setor de Imagem', 'Substituir beacon com bateria baixa', 'Manter prioridade para SOS e solicitacoes medicas'],
    };
  };

  const generateReport = async (period = 'diario') => {
    try {
      const report = await adminApi.generateAdminReport({ period });
      if (report?.demoMode) return generateLocalReport(period);
      return report;
    } catch (error) {
      if (handleAuthFailure(error, 'Acesso negado para gerar relatorio')) {
        return {
          period,
          source: 'auth-error',
          status: 'Nao autorizado',
        };
      }
      showToast('API indisponivel, gerando relatorio local', 'warning');
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
    messages, visitors, settings, filters, dashboardSummary,
    setCurrentPage: navigatePage, setFilters, showToast, openModal, closeModal,
    updateCallStatus, assignTeam, closeCall, createCheckin, updateCheckinStatus,
    updateBeacon, restartBeacon, createMessage, saveSettings, generateReport, exportToCSV,
    setSectors, setMessages, setCalls, setUsers, setVisitors, updateVisitor, updateVisitorAccessStatus, authorizeVisitor, denyVisitor,
    createStaffAccount, toggleStaffStatus, updateCurrentUserProfile,
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
  const sos = summary ? summary.activeSOS : app.calls.filter((call) => call.type === 'SOS Emergencia' && call.status !== 'Encerrado').length;
  const routes = app.users.filter((user) => user.status === 'Em rota').length + app.checkins.filter((item) => item.status === 'Em rota').length;
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
            <button onClick={() => app.showToast('Dados atualizados com sucesso')}>Atualizar dados</button>
            <button onClick={() => app.openModal('Relatorio operacional', <ReportView report={report} />, <ReportFooter app={app} report={report} />)}>Gerar relatorio</button>
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
  const [lastUpdated, setLastUpdated] = useState(() => new Date());
  const activeFloor = getHeatmapFloorOption(floorKey);
  const refreshMap = (silent = false) => {
    setLastUpdated(new Date());
    if (!silent) app.showToast('Mapa atualizado');
  };
  useEffect(() => {
    const timer = window.setInterval(() => refreshMap(true), 60000);
    return () => window.clearInterval(timer);
  }, []);
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
        <button className="heatmap-refresh" onClick={() => refreshMap()}>
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
        <Heatmap sectors={visible} nodes={floorNodes} floor={activeFloor} beacons={floorBeacons} onSelect={(sector) => openSector(app, sector)} large lastUpdated={lastUpdated} />
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
        <PageHeading title="Chamados e SOS" subtitle="Acompanhe pedidos de ajuda, emergencias e solicitacoes operacionais." />
        <section className="kpi-grid">
          <KpiCard icon={HeartPulse} tone="danger" label="SOS ativos" value={app.calls.filter((call) => call.type === 'SOS Emergencia' && call.status !== 'Encerrado').length} helper="Prioridade critica" />
          <KpiCard icon={HelpCircle} tone="warning" label="Pedidos de ajuda" value={app.calls.filter((call) => call.type !== 'SOS Emergencia' && call.status !== 'Encerrado').length} helper="Nao encerrados" />
          <KpiCard icon={Clock3} tone="info" label="Em atendimento" value={app.calls.filter((call) => call.status === 'Em atendimento').length} helper="Equipe acompanhando" />
          <KpiCard icon={CheckCircle2} tone="success" label="Encerrados" value={app.calls.filter((call) => call.status === 'Encerrado').length} helper="Historico operacional" />
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
          <h2>{admin ? 'Alertas e SOS' : 'Chamados da recepcao'}</h2>
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
      (filter === 'Recepcao' && account.role === 'reception');
    return matchesQuery && matchesFilter;
  });
  const visible = app.users.filter((user) => {
    const okFilter =
      filter === 'Todos' ||
      (filter === 'Administrador' && user.role === 'Administrador') ||
      (filter === 'Recepcao' && user.role === 'Recepcao') ||
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
        <KpiCard icon={UserCheck} tone="warning" label="Acesso recepcao" value={receptionStaff} helper="Perfis de recepcao" />
        <KpiCard icon={Activity} tone="info" label="Pacientes monitorados" value={app.users.length} helper="Usuarios na plataforma" />
      </section>

      <div className="page-toolbar">
        <div className="page-search"><Search size={16} /><input placeholder="Buscar por nome, e-mail ou setor" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="btn btn-primary" onClick={() => openStaffAccount(app)}><Plus size={16} />Adicionar perfil local</button>
        <button className="btn btn-secondary" onClick={() => app.exportToCSV('usuarios.csv', [...staffQuery, ...visible])}><Download size={16} />Exportar</button>
      </div>

      <FilterChips items={['Todos', 'Administrador', 'Recepcao', 'Pacientes']} active={filter} onChange={setFilter} />

      <SectionCard title="Acessos administrativos" subtitle="Controle de acessos da equipe interna ao sistema.">
        <PremiumTable
          rows={staffQuery}
          columns={[
            { key: 'name', label: 'Nome', render: (account) => <UserCell name={account.name} sub={account.email} /> },
            { key: 'email', label: 'E-mail', render: (account) => account.email },
            { key: 'roleLabel', label: 'Perfil', render: (account) => <RoleBadge value={account.roleLabel} /> },
            { key: 'sector', label: 'Setor', render: (account) => account.sector },
            { key: 'status', label: 'Status', render: (account) => <NvBadge value={account.status} /> },
            { key: 'lastLogin', label: 'Ultimo acesso', render: (account) => account.lastLogin },
            { key: 'actions', label: 'Acoes', render: (account) => (
              <RowActions>
                <button className="btn btn-secondary" onClick={() => app.openModal('Perfil administrativo', <Details data={account} />)}>Ver perfil</button>
                <ActionMenu>
                  <button onClick={() => app.toggleStaffStatus(account.id)}>{account.status === 'Ativo' ? 'Desativar' : 'Ativar'}</button>
                  <button onClick={() => app.openModal('Dados de acesso', <Details data={account} />)}>Ver dados</button>
                </ActionMenu>
              </RowActions>
            ) },
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
            { key: 'location', label: 'Localizacao', render: (user) => user.location },
            { key: 'accessibility', label: 'Acessibilidade', render: (user) => <AccessibilityNote value={user.accessibility} /> },
            { key: 'lastSeen', label: 'Ultima atualizacao', render: (user) => user.lastSeen },
            { key: 'actions', label: 'Acoes', render: (user) => (
              <RowActions>
                <button className="btn btn-secondary" onClick={() => app.openModal('Perfil do usuario', <UserProfile user={user} />)}>Ver perfil</button>
                <button className="btn btn-info" onClick={() => { app.setCurrentPage('admin-heatmap'); app.setFilters({ sector: user.location }); }}>Localizacao</button>
                <ActionMenu>
                  <button onClick={() => openMessage(app, user.name)}>Enviar notificacao</button>
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
    const matchesFilter = filter === 'Todos' || beacon.status === filter || (filter === 'Bateria baixa' && beacon.battery < 30);
    const matchesQuery = `${beacon.id} ${beacon.name} ${beacon.sector} ${beacon.area}`.toLowerCase().includes(query.toLowerCase());
    return matchesFilter && matchesQuery;
  });
  const rows = visible.map((beacon) => ({
    ...beacon,
    node: beacon.originNodeCode || beacon.navigationNode?.code || 'Nao informado',
    lastSignal: beacon.lastSignal || 'Sem sinal',
  }));
  return (
    <div className="page-view premium-page">
      <PageHeading title="Beacons" subtitle="Monitoramento dos dispositivos de localizacao indoor" />
      <section className="kpi-grid">
        <KpiCard icon={RadioTower} tone="info" label="Total de beacons" value={app.beacons.length} helper="Dispositivos cadastrados" />
        <KpiCard icon={CheckCircle2} tone="success" label="Online" value={app.beacons.filter((b) => b.status === 'Online').length} helper="Transmitindo sinal" />
        <KpiCard icon={Clock3} tone="warning" label="Bateria baixa" value={app.beacons.filter((b) => b.battery < 30).length} helper="Requer atencao" />
        <KpiCard icon={ShieldCheck} tone="danger" label="Offline" value={app.beacons.filter((b) => b.status === 'Offline').length} helper="Sem comunicacao" />
      </section>
      <div className="page-toolbar">
        <div className="page-search"><Search size={16} /><input placeholder="Buscar por codigo, nome ou setor" value={query} onChange={(e) => setQuery(e.target.value)} /></div>
        <button className="btn btn-secondary" onClick={() => app.exportToCSV('beacons.csv', rows)}><Download size={16} />Exportar</button>
      </div>
      <FilterChips items={['Todos', 'Online', 'Atencao', 'Offline', 'Sem sinal', 'Bateria baixa', 'Manutencao']} active={filter} onChange={setFilter} />
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
                <ActionMenu>
                  <button onClick={() => app.restartBeacon(beacon.id)}>Reiniciar</button>
                  <button onClick={() => { app.updateBeacon(beacon.id, { status: 'Manutencao' }); app.showToast('Beacon marcado para manutencao', 'warning'); }}>Manutencao</button>
                </ActionMenu>
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
      <PageHeading title="Relatorios" subtitle="Gere, visualize e exporte informacoes operacionais do Navora." />
      <section className="kpi-grid">
        <KpiCard icon={HeartPulse} tone="danger" label="SOS" value={app.calls.filter((c) => c.type === 'SOS Emergencia').length} helper="Chamados de emergencia" />
        <KpiCard icon={HelpCircle} tone="warning" label="Help" value={app.calls.filter((c) => c.type !== 'SOS Emergencia').length} helper="Pedidos de ajuda" />
        <KpiCard icon={UserCheck} tone="info" label="Visitantes" value={app.visitors.length} helper="Solicitacoes registradas" />
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
    : [['receptionName', 'Nome da recepcao'], ['waitLimit', 'Tempo maximo de espera']];
  const toggles = admin
    ? [['sosNotifications', 'Notificacoes de SOS'], ['heatmap', 'Heatmap operacional'], ['beaconMonitoring', 'Monitoramento de beacons'], ['maintenanceMode', 'Modo manutencao']]
    : [['soundAlerts', 'Alertas sonoros'], ['prioritizeSos', 'Priorizar SOS'], ['prioritizeDoctor', 'Priorizar medico'], ['showClosed', 'Exibir encerrados']];
  return (
    <div className="page-view premium-page">
      <PageHeading
        title={admin ? 'Configuracoes' : 'Configuracoes da recepcao'}
        subtitle={admin ? 'Gerencie preferencias administrativas e operacionais.' : 'Ajuste preferencias operacionais da recepcao.'}
      />
      <div className="settings-grid premium-settings-grid">
        <section className="settings-group">
          <div><h3 className="section-title">{admin ? 'Instituicao' : 'Recepcao'}</h3><p className="section-subtitle">Dados operacionais exibidos no painel.</p></div>
          {textFields.map(([key, label]) => <label className="form-label settings-row" key={key}>{label}<input className="form-control" value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}
        </section>
        <section className="settings-group">
          <div><h3 className="section-title">Operacao e notificacoes</h3><p className="section-subtitle">Preferencias de alertas e monitoramento.</p></div>
          {toggles.map(([key, label]) => (
            <label className={`toggle settings-toggle ${key === 'maintenanceMode' ? 'warning' : ''}`} key={key}><input type="checkbox" checked={!!form[key]} onChange={(e) => update(key, e.target.checked)} /><span>{label}</span></label>
          ))}
        </section>
      </div>
      <button className="btn btn-primary settings-save" onClick={() => app.saveSettings(form)}>Salvar configuracoes</button>
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
  return <span className={`badge badge-${tone}`}>{value || 'Nao informado'}</span>;
}

function NvBadge({ value }) {
  const label = String(value || 'Nao informado');
  const normalized = comparableLocation(label);
  const tone =
    normalized.includes('bloqueado') || normalized.includes('offline') || normalized.includes('negado')
      ? 'danger'
      : normalized.includes('aguardando') || normalized.includes('atencao') || normalized.includes('manutencao') || normalized.includes('bateria')
        ? 'warning'
        : normalized.includes('em rota') || normalized.includes('sem sinal')
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
      <PageHeading title="Painel da Recepcao" subtitle="Acompanhe pacientes, visitantes e solicitacoes em tempo real." />
      <section className="kpi-grid">
        <KpiCard icon={ClipboardCheck} tone="info" label="Check-ins aguardando" value={waiting} helper="Fila inicial" />
        <KpiCard icon={UserCheck} tone="warning" label="Visitantes pendentes" value={awaitingVisitors} helper="Aguardando autorizacao" />
        <KpiCard icon={HelpCircle} tone="info" label="Chamados ativos" value={openCalls} helper="Nao encerrados" />
        <KpiCard icon={HeartPulse} tone="danger" label="SOS ativos" value={sos} helper="Prioridade critica" />
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
        <SectionCard title="Solicitacoes de visitantes" subtitle="Visitantes aguardando decisao da recepcao.">
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
        title={accessOnly ? 'Autorizacoes' : 'Visitantes'}
        subtitle={accessOnly ? 'Analise solicitacoes de acesso e libere rotas autorizadas.' : 'Acompanhe visitantes, status de rota e permissoes ativas.'}
      />
      <section className="kpi-grid">
        <KpiCard icon={Building2} tone="info" label="Private" value={app.visitors.filter((v) => v.areaId === 'private').length} helper="Visitantes registrados" />
        <KpiCard icon={ShieldCheck} tone="success" label="Autorizados" value={app.visitors.filter((v) => v.status === 'Autorizado').length} helper="Permissao ativa" />
        <KpiCard icon={Clock3} tone="warning" label="Pendentes" value={app.visitors.filter((v) => v.status === 'Aguardando autorizacao').length} helper="Aguardando decisao" />
        <KpiCard icon={HeartPulse} tone="danger" label="Fora da rota" value={app.visitors.filter((v) => v.status === 'Fora da rota').length} helper="Requer atencao" />
      </section>
      <FilterChips items={statuses} active={filter} onChange={setFilter} />
      <SectionCard title={accessOnly ? 'Solicitacoes de acesso' : 'Visitantes monitorados'} subtitle="Dados reais ou fallback operacional ja existente no projeto.">
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
                  <button onClick={() => app.updateVisitorAccessStatus(visitor, 'Em rota', { requestedDestination: visitor.areaId === 'private' ? 'Recepcao Private' : 'Recepcao Hospital Marco Capute' }, 'Visitante orientado ate a recepcao')}>Levar ate recepcao</button>
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
      <PageHeading title="Mensagens" subtitle="Comunicacao operacional da recepcao com pacientes e setores." />
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

function Stat({ title, value, detail = 'Ver detalhes', tone = 'info', icon: Icon = Activity, onClick }) {
  return (
    <button className={`stat-card ${tone}`} onClick={onClick}>
      <span className="stat-icon" aria-hidden="true"><Icon size={20} /></span>
      <span className="stat-label">{title}</span>
      <strong>{value}</strong>
      <small>{detail}</small>
    </button>
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
            <small>Auto a cada 60s</small>
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
            <h3>{floor.special ? 'Mapeamento do Terraco / Heliponto ainda nao configurado.' : 'Mapeamento deste andar ainda nao disponivel.'}</h3>
            <p>Os setores e pontos de navegacao serao exibidos apos a configuracao estrutural.</p>
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

        <div className="badges call-badges">
          <em className={`call-badge ${getPriorityBadgeTone(call.priority)}`}>{call.priority}</em>
          <em className={`call-badge ${getStatusBadgeTone(call.status)}`}>{call.status}</em>
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

      <div className="badges call-badges">
        <em className={`call-badge ${getPriorityBadgeTone(call.priority)}`}>{call.priority}</em>
        <em className={`call-badge ${getStatusBadgeTone(call.status)}`}>{call.status}</em>
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

function Table({ rows, columns, actions, rowClass = () => '' }) {
  return (
    <div className="table" style={{ '--cols': columns.length }}>
      <div className="table-head">{columns.map((col) => <b key={col}>{col}</b>)}<b>Acoes</b></div>
      {rows.map((row) => <div className={`table-row ${rowClass(row)}`} key={row.id}>{columns.map((col) => <span key={col}>{renderCell(col, row[col])}</span>)}<div className="actions">{actions(row)}</div></div>)}
    </div>
  );
}

function renderCell(col, value) {
  if (['status', 'priority', 'role', 'roleLabel'].includes(col)) {
    return <StatusBadge value={value} />;
  }
  if (col === 'battery') return value === undefined || value === null ? 'Nao informado' : `${value}%`;
  return String(value ?? 'Nao informado');
}

function StatusBadge({ value }) {
  const label = String(value || 'Nao informado');
  const normalized = comparableLocation(label);
  const tone =
    normalized.includes('critica') || normalized.includes('sos') || normalized.includes('negado') || normalized.includes('offline') || normalized.includes('bloqueado')
      ? 'danger'
      : normalized.includes('pendente') || normalized.includes('aguardando') || normalized.includes('atencao') || normalized.includes('alta')
        ? 'warning'
        : normalized.includes('ativo') || normalized.includes('online') || normalized.includes('autorizado') || normalized.includes('encerrado') || normalized.includes('finalizado')
          ? 'success'
          : 'neutral';
  return <em className={`status-badge ${tone}`}>{label}</em>;
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
      <p className="form-note">Alteracoes visuais ficam salvas nesta sessao do painel. O e-mail e a permissao continuam vindo da autenticacao real.</p>
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
  return <div><Details data={user} /><h3>Historico de rota</h3><ul><li>Recepcao para Tomografia</li><li>Tomografia para Laboratorio</li><li>Preferencia: rota acessivel</li></ul></div>;
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
    app.setCalls((items) => [{ ...call, id: `CH-${Date.now()}`, type: 'Solicitar Medico', reason: data.reason, priority: 'Alta', status: 'Pendente', history: ['Solicitacao medica criada'] }, ...items]);
    app.showToast('Solicitacao medica criada');
    app.closeModal();
  }} />);
}

function openCheckin(app) {
  app.openModal('Novo check-in', <Form fields={[['patient', 'Nome paciente'], ['document', 'Documento'], ['destination', 'Destino'], ['accessibility', 'Precisa acessibilidade?'], ['observations', 'Observacoes']]} data={{ patient: '', document: '', destination: 'Tomografia', accessibility: 'Nao', observations: '' }} onSubmit={app.createCheckin} />);
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
  app.openModal('Adicionar perfil local', <StaffAccountForm onSubmit={app.createStaffAccount} />);
}

function StaffAccountForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    role: 'reception',
    sector: 'Recepcao',
    status: 'Ativo',
  });

  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));

  return (
    <form
      className="modal-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(form);
      }}
    >
      <label>Nome do funcionario<input required value={form.name} onChange={(event) => update('name', event.target.value)} /></label>
      <label>E-mail de login<input required type="email" value={form.email} onChange={(event) => update('email', event.target.value)} /></label>
      <label>Tipo de acesso
        <select value={form.role} onChange={(event) => update('role', event.target.value)}>
          <option value="reception">Recepcao</option>
          <option value="admin">Administrador</option>
        </select>
      </label>
      <label>Setor<input value={form.sector} onChange={(event) => update('sector', event.target.value)} /></label>
      <label>Status
        <select value={form.status} onChange={(event) => update('status', event.target.value)}>
          <option>Ativo</option>
          <option>Inativo</option>
        </select>
      </label>
      <p className="form-note">Cadastro local para organizacao do painel. Criacao real de usuario administrativo depende da integracao do backend.</p>
      <button className="primary">Cadastrar acesso local</button>
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
      ? 'Recepcao Private -> rota autorizada -> destino Private'
      : 'Recepcao Hospital Marco Capute -> rota autorizada -> destino SUS';

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
          <option>Liberar somente ate recepcao</option>
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
          <option>Orientar presencialmente na recepcao</option>
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

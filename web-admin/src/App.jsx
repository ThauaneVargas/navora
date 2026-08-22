import React, { useEffect, useMemo, useState } from 'react';
import { createRoot } from 'react-dom/client';
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
import { isAuthError, isNetworkError } from './services/api.js';
import { getAdminToken, removeAdminToken, saveAdminToken } from './services/adminToken.js';
import './styles.css';

const adminNav = [
  ['admin-dashboard', 'Dashboard'],
  ['admin-heatmap', 'Heatmap'],
  ['admin-alerts', 'Alertas SOS'],
  ['admin-users', 'Usuarios'],
  ['admin-beacons', 'Beacons'],
  ['admin-reports', 'Relatorios'],
  ['admin-settings', 'Configuracoes'],
];

const receptionNav = [
  ['reception-dashboard', 'Dashboard'],
  ['reception-visitors', 'Visitantes Online'],
  ['reception-calls', 'Chamados'],
  ['reception-checkin', 'Check-in'],
  ['reception-access', 'Solicitacoes de Acesso'],
  ['reception-sectors', 'Setores'],
  ['reception-messages', 'Mensagens'],
  ['reception-settings', 'Configuracoes'],
];

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

function App() {
  const [currentRole, setCurrentRole] = useState(null);
  const [currentPage, setCurrentPage] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);
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

  const loadVisitorAccessRequests = async () => {
    try {
      const requests = await adminApi.getVisitorAccessRequests();
      setVisitors(requests.map(mapVisitorAccessFromApi));
    } catch (error) {
      showToast('API indisponivel, mantendo dados simulados de visitantes', 'warning');
    }
  };

  const loadCalls = async () => {
    try {
      const requests = await adminApi.getCalls();
      setCalls(requests.map(mapCallFromApi));
    } catch (error) {
      showToast('API indisponivel, mantendo chamados simulados', 'warning');
    }
  };

  const loadDashboardSummary = async () => {
    const summary = await adminApi.getDashboardSummary();
    setDashboardSummary(summary);
  };

  const loadCheckIns = async () => {
    try {
      const apiCheckIns = await adminApi.getCheckIns();
      setCheckins(Array.isArray(apiCheckIns) ? apiCheckIns.map(mapCheckInFromApi) : []);
    } catch (error) {
      if (isAuthError(error)) {
        setCheckins([]);
        showToast('Acesso negado aos check-ins', 'danger');
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
      if (isAuthError(error)) {
        setMessages([]);
        showToast('Acesso negado as mensagens', 'danger');
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
      if (!getAdminToken()) return;

      try {
        const user = await adminApi.getAuthMe();
        const account = mapUserToStaffAccount(user);
        if (!account.role || !['admin', 'reception'].includes(account.role)) {
          removeAdminToken();
          return;
        }
        if (!active) return;
        setCurrentUser(account);
        setCurrentRole(account.role);
        setCurrentPage(account.role === 'admin' ? 'admin-dashboard' : 'reception-dashboard');
        window.history.replaceState({}, '', account.role === 'admin' ? '/admin/dashboard' : '/recepcao/painel');
      } catch (error) {
        if (isAuthError(error)) {
          removeAdminToken();
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const loginWithFallback = ({ email, password, role }) => {
    const account = staffAccounts.find(
      (item) =>
        item.email.toLowerCase() === email.trim().toLowerCase() &&
        item.password === password &&
        (!role || item.role === role)
    );

    if (!account) {
      showToast('Login ou senha invalidos, ou acesso inativo', 'danger');
      return;
    }

    if (account.status !== 'Ativo') {
      showToast('Este funcionario esta inativo', 'warning');
      return;
    }

    setCurrentUser(account);
    setCurrentRole(account.role);
    setCurrentPage(account.role === 'admin' ? 'admin-dashboard' : 'reception-dashboard');
    window.history.pushState({}, '', account.role === 'admin' ? '/admin/dashboard' : '/recepcao/painel');
    setStaffAccounts((items) =>
      items.map((item) => (item.id === account.id ? { ...item, lastLogin: 'Agora' } : item))
    );
    showToast(`Bem-vindo(a), ${account.name}`, 'info');
  };

  const login = async ({ email, password, role }) => {
    try {
      const auth = await adminApi.login({ email, password });
      const account = mapUserToStaffAccount(auth?.user);

      if (!account.role || !['admin', 'reception'].includes(account.role)) {
        showToast('Este usuario nao pode acessar o painel administrativo', 'danger');
        return;
      }

      if (role && account.role !== role) {
        showToast('Perfil selecionado nao corresponde ao usuario autenticado', 'danger');
        return;
      }

      saveAdminToken(auth.access_token);
      const authUser = await adminApi.getAuthMe();
      const confirmedAccount = mapUserToStaffAccount(authUser);
      setCurrentUser(confirmedAccount);
      setCurrentRole(confirmedAccount.role);
      setCurrentPage(confirmedAccount.role === 'admin' ? 'admin-dashboard' : 'reception-dashboard');
      window.history.pushState({}, '', confirmedAccount.role === 'admin' ? '/admin/dashboard' : '/recepcao/painel');
      showToast(`Bem-vindo(a), ${confirmedAccount.name}`, 'info');
    } catch (error) {
      if (isNetworkError(error)) {
        loginWithFallback({ email, password, role });
        return;
      }
      if (isAuthError(error)) {
        showToast('Login ou senha invalidos, ou acesso nao autorizado', 'danger');
        return;
      }
      showToast('Nao foi possivel autenticar agora', 'danger');
    }
  };

  const logout = () => {
    removeAdminToken();
    setCurrentRole(null);
    setCurrentPage(null);
    setCurrentUser(null);
    window.history.pushState({}, '', '/login');
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
      password: data.password || '123456',
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

  const updateStaffPassword = (id, password) => {
    setStaffAccounts((items) =>
      items.map((item) => (item.id === id ? { ...item, password } : item))
    );
    showToast('Senha atualizada');
    closeModal();
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
      showToast(isAuthError(error) ? 'Acesso negado para atualizar chamado' : 'Chamado nao atualizado. Dados locais mantidos.', 'danger');
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
      showToast(isAuthError(error) ? 'Acesso negado para acionar equipe' : 'Equipe nao acionada. Dados locais mantidos.', 'danger');
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
      if (isAuthError(error)) {
        showToast('Acesso negado para criar check-in', 'danger');
        return;
      }
      showToast('Check-in nao criado. API indisponivel ou dados recusados.', 'danger');
    }
  };

  const updateCheckinStatus = async (id, status) => {
    try {
      const updated = await adminApi.updateCheckInStatus(id, checkInLabelToApiStatus[status] || status);
      setCheckins((items) => items.map((item) => (item.id === id ? mapCheckInFromApi(updated) : item)));
      showToast(`Check-in atualizado para ${status}`);
    } catch (error) {
      if (isAuthError(error)) {
        showToast('Acesso negado para atualizar check-in', 'danger');
        return;
      }
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
      if (isAuthError(error)) {
        showToast('Acesso negado para enviar mensagem', 'danger');
        return;
      }
      showToast('Mensagem nao enviada. API indisponivel ou dados recusados.', 'danger');
    }
  };

  const saveSettings = (data) => {
    setSettings((current) => ({ ...current, ...data }));
    showToast('Configuracoes salvas');
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
      showToast(isAuthError(error) ? 'Acesso negado para atualizar visitante' : 'Visitante nao atualizado. Dados locais mantidos.', 'danger');
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
      showToast(isAuthError(error) ? 'Acesso negado para autorizar visitante' : 'Acesso nao autorizado. Dados locais mantidos.', 'danger');
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
      showToast(isAuthError(error) ? 'Acesso negado para negar visitante' : 'Negativa nao registrada. Dados locais mantidos.', 'danger');
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
      if (isAuthError(error)) {
        showToast('Acesso negado para gerar relatorio', 'danger');
        return generateLocalReport(period);
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
    setCurrentPage, setFilters, showToast, openModal, closeModal,
    updateCallStatus, assignTeam, closeCall, createCheckin, updateCheckinStatus,
    updateBeacon, restartBeacon, createMessage, saveSettings, generateReport, exportToCSV,
    setSectors, setMessages, setCalls, setUsers, setVisitors, updateVisitor, updateVisitorAccessStatus, authorizeVisitor, denyVisitor,
    createStaffAccount, toggleStaffStatus, updateStaffPassword,
  };

  if (!currentRole) return <LoginPage onLogin={login} toast={toast} />;

  return (
    <main className="admin-shell">
      <Sidebar role={currentRole} currentUser={currentUser} currentPage={currentPage} onNavigate={setCurrentPage} onLogout={logout} />
      <section className="workspace">
        <Header role={currentRole} currentUser={currentUser} currentPage={currentPage} calls={calls} messages={messages} />
        <PageRouter role={currentRole} page={currentPage} app={app} />
      </section>
      <Toast toast={toast} />
      <Modal modal={modal} onClose={closeModal} />
    </main>
  );
}

function Sidebar({ role, currentUser, currentPage, onNavigate, onLogout }) {
  const nav = role === 'admin' ? adminNav : receptionNav;
  return (
    <aside className="sidebar">
      <button className="brand" onClick={() => onNavigate(role === 'admin' ? 'admin-dashboard' : 'reception-dashboard')}>navora</button>
      <nav>
        {nav.map(([id, label]) => (
          <button key={id} className={currentPage === id ? 'active' : ''} onClick={() => onNavigate(id)}>
            <span>{label.slice(0, 1)}</span>{label}
          </button>
        ))}
      </nav>
      <div className="side-profile">
        <b>{currentUser?.name || (role === 'admin' ? 'Amanda Souza' : 'Juliana Lima')}</b>
        <small>{currentUser?.roleLabel || (role === 'admin' ? 'Administradora' : 'Recepcao')}</small>
      </div>
      <button className="logout" onClick={onLogout}>Sair</button>
    </aside>
  );
}

function Header({ role, currentUser, currentPage, calls, messages }) {
  const title = role === 'admin' ? `Ola, ${currentUser?.name?.split(' ')[0] || 'Amanda'}!` : 'Painel da Recepcao';
  const subtitle = role === 'admin' ? 'Bem-vinda ao painel administrativo do Navora.' : 'Gerencie chamados, ajuda e fluxo de pacientes.';
  return (
    <header className="topbar">
      <div>
        <small>{currentPage.replace('-', ' / ')}</small>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </div>
      <div className="top-actions">
        <span>{new Date().toLocaleDateString('pt-BR')}</span>
        <button title="Notificacoes">{calls.filter((call) => call.status !== 'Encerrado').length + messages.length}</button>
      </div>
    </header>
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
  const closedCalls = summary ? summary.closedCalls : app.calls.filter((call) => call.status === 'Encerrado').length;
  const alerts = app.calls.filter((call) => ['Critica', 'Alta'].includes(call.priority) && call.status !== 'Encerrado');

  return (
    <div className="page-stack">
      <section className="stats-grid">
        <Stat title={summary?.source === 'api' ? 'Pacientes cadastrados' : 'Pacientes demo'} value={people} tone="good" onClick={() => app.setCurrentPage('admin-users')} />
        <Stat title="Alertas SOS Ativos" value={sos} tone="danger" onClick={() => app.setCurrentPage('admin-alerts')} />
        <Stat title="Visitantes aguardando" value={pendingVisitors} tone="warning" onClick={() => app.setCurrentPage('reception-access')} />
        <Stat title="Beacons Online" value={summary ? `${online}/${summary.beaconsTotal}` : online} tone="good" onClick={() => app.setCurrentPage('admin-beacons')} />
        <Stat title="Chamados encerrados" value={closedCalls} tone="info" onClick={() => app.setCurrentPage('admin-alerts')} />
      </section>
      {summary?.source === 'api' ? (
        <section className="stats-grid">
          <Stat title="Chamados abertos" value={summary.openCalls} tone="warning" onClick={() => app.setCurrentPage('admin-alerts')} />
          <Stat title="Help ativos" value={summary.activeHelp} tone="info" onClick={() => app.setCurrentPage('admin-alerts')} />
          <Stat title="Visitantes aprovados" value={summary.approvedVisitors} tone="good" onClick={() => app.setCurrentPage('reception-access')} />
          <Stat title="Setores cadastrados" value={summary.sectorsTotal} tone="info" onClick={() => app.setCurrentPage('reception-sectors')} />
          <Stat title="Destinos cadastrados" value={summary.destinationsTotal} tone="info" onClick={() => app.setCurrentPage('admin-beacons')} />
        </section>
      ) : null}
      <section className="two-col">
        <Panel title="Mapa de calor">
          <Toolbar>
            <select onChange={(event) => app.setFilters({ ...app.filters, floor: event.target.value })}>
              <option>Terreo</option><option>1o Andar</option><option>2o Andar</option>
            </select>
            <button onClick={() => app.showToast('Dados atualizados com sucesso')}>Atualizar dados</button>
            <button onClick={() => app.openModal('Relatorio operacional', <ReportView report={report} />, <ReportFooter app={app} report={report} />)}>Gerar relatorio</button>
          </Toolbar>
          <Heatmap sectors={app.sectors.filter((sector) => matchesFloor(app.filters.floor, sector.floor))} onSelect={(sector) => openSector(app, sector)} />
        </Panel>
        <Panel title="Alertas recentes">
          <div className="card-list">
            {alerts.map((call) => <CallCard key={call.id} call={call} app={app} />)}
          </div>
        </Panel>
      </section>
    </div>
  );
}

function AdminHeatmap({ app }) {
  const [floor, setFloor] = useState('Todos');
  const [sectorKey, setSectorKey] = useState(app.filters.sector || 'Todos');
  const visible = app.sectors.filter(
    (sector) => matchesFloor(floor, sector.floor) && (sectorKey === 'Todos' || matchesSector(sectorKey, sector))
  );
  return (
    <Panel title="Heatmap operacional" wide>
      <Toolbar>
        <select value={floor} onChange={(e) => setFloor(e.target.value)}><option>Todos</option><option>Terreo</option><option>1o Andar</option><option>2o Andar</option></select>
        <select value={sectorKey} onChange={(e) => setSectorKey(e.target.value)}><option>Todos</option>{app.sectors.map((s) => <option key={s.id} value={s.code || s.name}>{s.name}</option>)}</select>
        <button onClick={() => app.showToast('Fluxo recalculado')}>Recalcular fluxo</button>
        <button onClick={() => { app.setMessages((m) => [{ id: `MSG-${Date.now()}`, to: 'Recepcao', message: 'Aviso de fluxo elevado enviado pelo admin.', priority: 'Alta', time: 'Agora', direction: 'Recebida' }, ...m]); app.showToast('Aviso enviado para recepcao'); }}>Enviar aviso para recepcao</button>
      </Toolbar>
      <div className="heatmap-layout">
        <Heatmap sectors={visible} onSelect={(sector) => openSector(app, sector)} large />
        <div className="rank-list">
          {visible.sort((a, b) => b.peopleCount - a.peopleCount).map((sector) => (
            <button key={sector.id} onClick={() => openSector(app, sector)}>
              <b>{sector.name}</b><span>{sector.peopleCount} pessoas</span><small>{sector.flow} - {sector.waitingTime}</small>
            </button>
          ))}
        </div>
      </div>
    </Panel>
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
  return (
    <Panel title={admin ? 'Alertas e SOS' : 'Chamados da recepcao'} wide>
      <Toolbar>
        <input placeholder="Buscar paciente, setor ou tipo" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={() => app.exportToCSV('chamados.csv', visible)}>Exportar CSV</button>
      </Toolbar>
      <Pills items={filterList} active={filter} onChange={setFilter} />
      <div className="card-list">
        {visible.map((call) => <CallCard key={call.id} call={call} app={app} reception={!admin} />)}
      </div>
    </Panel>
  );
}

function UsersPage({ app }) {
  const [filter, setFilter] = useState('Todos');
  const [query, setQuery] = useState('');
  const activeStaff = app.staffAccounts.filter((account) => account.status === 'Ativo').length;
  const receptionStaff = app.staffAccounts.filter((account) => account.role === 'reception').length;
  const visible = app.users.filter((user) => {
    const okFilter = filter === 'Todos' || (filter === 'Pacientes' && user.role === 'Paciente') || (filter === 'Funcionarios' && user.role !== 'Paciente') || (filter === 'Em rota' && user.status === 'Em rota') || (filter === 'Precisam acessibilidade' && user.accessibility !== 'Nao');
    return okFilter && user.name.toLowerCase().includes(query.toLowerCase());
  });
  return (
    <Panel title="Usuarios monitorados" wide>
      <section className="access-summary">
        <article>
          <span>Acessos internos</span>
          <strong>{app.staffAccounts.length}</strong>
          <small>Funcionarios cadastrados</small>
        </article>
        <article>
          <span>Ativos agora</span>
          <strong>{activeStaff}</strong>
          <small>Podem entrar no sistema</small>
        </article>
        <article>
          <span>Acesso recepcao</span>
          <strong>{receptionStaff}</strong>
          <small>Perfis de recepcao</small>
        </article>
      </section>

      <Toolbar>
        <input placeholder="Buscar por nome" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={() => openStaffAccount(app)}>Cadastrar funcionario</button>
      </Toolbar>

      <div className="access-panel">
        <div className="panel-title access-title">
          <div>
            <h2>Logins e senhas de funcionarios</h2>
            <p>Controle quem acessa o painel administrativo e a recepcao.</p>
          </div>
          <div className="credential-hint">
            <span>Admin: admin@navora.com / admin123</span>
            <span>Recepcao: recepcao@navora.com / recepcao123</span>
          </div>
        </div>
        <Table rows={app.staffAccounts} columns={['name', 'email', 'roleLabel', 'sector', 'status', 'lastLogin']} actions={(account) => (
          <>
            <button onClick={() => app.toggleStaffStatus(account.id)}>{account.status === 'Ativo' ? 'Desativar' : 'Ativar'}</button>
            <button onClick={() => openPasswordReset(app, account)}>Alterar senha</button>
            <button onClick={() => app.openModal('Dados de acesso', <Details data={{ ...account, password: `senha atual: ${account.password}` }} />)}>Ver acesso</button>
          </>
        )} />
      </div>

      <Pills items={['Todos', 'Pacientes', 'Funcionarios', 'Em rota', 'Precisam acessibilidade']} active={filter} onChange={setFilter} />
      <Table rows={visible} columns={['name', 'role', 'status', 'location', 'accessibility', 'lastSeen']} actions={(user) => (
        <>
          <button onClick={() => app.openModal('Perfil do usuario', <UserProfile user={user} />)}>Ver perfil</button>
          <button onClick={() => { app.setCurrentPage('admin-heatmap'); app.setFilters({ sector: user.location }); }}>Ver localizacao</button>
          <button onClick={() => openMessage(app, user.name)}>Enviar notificacao</button>
          <button onClick={() => { app.setUsers((items) => items.map((item) => item.id === user.id ? { ...item, status: item.status === 'Bloqueado' ? 'Ativo' : 'Bloqueado' } : item)); app.showToast('Status do usuario atualizado'); }}>Bloquear/Desbloquear</button>
        </>
      )} />
    </Panel>
  );
}

function BeaconsPage({ app }) {
  const [filter, setFilter] = useState('Todos');
  const visible = app.beacons.filter((beacon) => filter === 'Todos' || beacon.status === filter || (filter === 'Bateria baixa' && beacon.battery < 30));
  return (
    <Panel title="Beacons MBM04" wide>
      <Pills items={['Todos', 'Online', 'Atencao', 'Offline', 'Bateria baixa', 'Manutencao']} active={filter} onChange={setFilter} />
      <Table rows={visible} columns={['id', 'name', 'sector', 'floor', 'battery', 'status', 'lastSignal', 'distance']} rowClass={(b) => b.battery < 30 || b.status !== 'Online' ? 'row-warning' : ''} actions={(beacon) => (
        <>
          <button onClick={() => app.openModal('Detalhes do beacon', <Details data={beacon} />)}>Ver detalhes</button>
          <button onClick={() => app.restartBeacon(beacon.id)}>Reiniciar</button>
          <button onClick={() => { app.updateBeacon(beacon.id, { status: 'Manutencao' }); app.showToast('Beacon marcado para manutencao', 'warning'); }}>Manutencao</button>
          <button onClick={() => { app.setFilters({ sector: beacon.sector }); app.setCurrentPage('admin-heatmap'); }}>Localizar</button>
        </>
      )} />
    </Panel>
  );
}

function ReportsPage({ app }) {
  const [report, setReport] = useState({ period: 'diario', source: 'fallback', status: 'Aguardando geracao' });
  const [loading, setLoading] = useState(false);
  const make = async (period) => {
    setLoading(true);
    const next = await app.generateReport(period);
    setReport(next);
    setLoading(false);
    app.showToast(`Relatorio ${period} gerado`);
  };
  return (
    <Panel title="Relatorios" wide>
      <Toolbar>
        <button onClick={() => make('diario')} disabled={loading}>Gerar diario</button>
        <button onClick={() => make('semanal')} disabled={loading}>Gerar semanal</button>
        <button onClick={() => make('mensal')} disabled={loading}>Gerar mensal</button>
        <button onClick={() => app.openModal('Relatorio', <ReportView report={report} />, <ReportFooter app={app} report={report} />)}>Visualizar relatorio</button>
        <button onClick={() => app.showToast('PDF gerado com sucesso')}>Exportar PDF</button>
        <button onClick={() => app.exportToCSV(`relatorio-${report.period}.csv`, [report])}>Exportar CSV</button>
      </Toolbar>
      <ReportView report={report} />
    </Panel>
  );
}

function SettingsPage({ app, admin = false }) {
  const [form, setForm] = useState(app.settings);
  const update = (key, value) => setForm((current) => ({ ...current, [key]: value }));
  return (
    <Panel title={admin ? 'Configuracoes administrativas' : 'Configuracoes da recepcao'} wide>
      <div className="settings-grid">
        {(admin ? [
          ['hospitalName', 'Nome do hospital'], ['hospitalAddress', 'Endereco do hospital'], ['waitLimit', 'Tempo limite de espera'],
        ] : [
          ['receptionName', 'Nome da recepcao'], ['waitLimit', 'Tempo maximo de espera'],
        ]).map(([key, label]) => <label key={key}>{label}<input value={form[key]} onChange={(e) => update(key, e.target.value)} /></label>)}
        {(admin ? ['sosNotifications', 'heatmap', 'beaconMonitoring', 'maintenanceMode'] : ['soundAlerts', 'prioritizeSos', 'prioritizeDoctor', 'showClosed']).map((key) => (
          <label className="toggle" key={key}><input type="checkbox" checked={!!form[key]} onChange={(e) => update(key, e.target.checked)} />{key}</label>
        ))}
      </div>
      <button className="primary" onClick={() => app.saveSettings(form)}>Salvar configuracoes</button>
    </Panel>
  );
}

function ReceptionDashboard({ app }) {
  const summary = app.dashboardSummary;
  const waiting = app.checkins.filter((item) => item.status === 'Aguardando').length;
  const help = summary ? summary.activeHelp : app.calls.filter((call) => call.type.includes('Ajuda') && call.status !== 'Encerrado').length;
  const sos = summary ? summary.activeSOS : app.calls.filter((call) => call.type === 'SOS Emergencia' && call.status !== 'Encerrado').length;
  const doctors = app.calls.filter((call) => call.type === 'Solicitar Medico' && call.status !== 'Encerrado').length;
  const awaitingVisitors = summary ? summary.pendingVisitorRequests : app.visitors.filter((visitor) => visitor.status === 'Aguardando autorizacao').length;
  return (
    <div className="page-stack">
      <section className="stats-grid five">
        <Stat title="Check-ins Hoje" value={app.checkins.length} onClick={() => app.setCurrentPage('reception-checkin')} />
        <Stat title="Pacientes Esperando" value={waiting} onClick={() => { app.setFilters({ checkin: 'Aguardando' }); app.setCurrentPage('reception-checkin'); }} />
        <Stat title="Pedidos de Ajuda" value={help} onClick={() => { app.setFilters({ calls: 'Ajuda' }); app.setCurrentPage('reception-calls'); }} />
        <Stat title="SOS Ativos" value={sos} tone="danger" onClick={() => { app.setFilters({ calls: 'SOS' }); app.setCurrentPage('reception-calls'); }} />
        <Stat title="Visitantes aguardando" value={awaitingVisitors || doctors} tone={awaitingVisitors ? 'warning' : 'info'} onClick={() => app.setCurrentPage('reception-access')} />
      </section>
      <section className="two-col">
        <Panel title="Chamados recebidos"><div className="card-list">{app.calls.filter((c) => c.status === 'Pendente').map((call) => <CallCard key={call.id} call={call} app={app} reception />)}</div></Panel>
        <Panel title="Fluxo recepcao">
          <div className="flow-card"><b>Tempo medio de espera</b><strong>15 min</strong><span>Fluxo medio</span></div>
          <button onClick={() => app.showToast('Fluxo atualizado')}>Atualizar</button>
        </Panel>
      </section>
    </div>
  );
}

function VisitorsAccessPage({ app, accessOnly = false }) {
  const [filter, setFilter] = useState(accessOnly ? 'Aguardando autorizacao' : 'Todos');
  const visible = app.visitors.filter((visitor) => filter === 'Todos' || visitor.status === filter);
  const statuses = ['Todos', 'Online', 'Aguardando autorizacao', 'Autorizado', 'Em rota', 'Chegou ao destino', 'Fora da rota', 'Acesso negado', 'Finalizado', 'Offline'];

  return (
    <Panel title={accessOnly ? 'Solicitacoes de Acesso' : 'Visitantes Online / Acessos'} wide>
      <section className="visitor-summary">
        <Stat title="Private" value={app.visitors.filter((v) => v.areaId === 'private').length} />
        <Stat title="Hospital Marco Capute" value={app.visitors.filter((v) => v.areaId === 'sus').length} />
        <Stat title="Aguardando" value={app.visitors.filter((v) => v.status === 'Aguardando autorizacao').length} tone="warning" />
        <Stat title="Fora da rota" value={app.visitors.filter((v) => v.status === 'Fora da rota').length} tone="danger" />
      </section>
      <Pills items={statuses} active={filter} onChange={setFilter} />
      <div className="visitor-grid">
        {visible.map((visitor) => (
          <article className={`visitor-card ${visitor.status === 'Fora da rota' ? 'off-route' : ''}`} key={visitor.id}>
            <header>
              <div>
                <b>{visitor.name}</b>
                <span>{visitor.profile} - {visitor.area}</span>
              </div>
              <em>{visitor.status}</em>
            </header>
            <div className="visitor-details">
              <p><strong>Entrada</strong><span>{visitor.entry}</span></p>
              <p><strong>Local atual</strong><span>{visitor.currentLocation}</span></p>
              <p><strong>Beacon atual</strong><span>{visitor.beacon}</span></p>
              <p><strong>Destino solicitado</strong><span>{visitor.requestedDestination}</span></p>
              <p><strong>Motivo</strong><span>{visitor.reason}</span></p>
              <p><strong>Tempo online</strong><span>{visitor.onlineTime}</span></p>
            </div>
            {visitor.status === 'Fora da rota' ? (
              <div className="route-alert">
                <b>Visitante fora da rota autorizada</b>
                <div>
                  <button onClick={() => app.showToast('Orientacao enviada ao visitante')}>Enviar orientacao</button>
                  <button onClick={() => app.showToast('Equipe chamada para apoio', 'warning')}>Chamar equipe</button>
                  <button onClick={() => app.updateVisitorAccessStatus(visitor, 'Finalizado', {}, 'Permissao encerrada')}>Encerrar permissao</button>
                </div>
              </div>
            ) : null}
            <div className="actions">
              <button onClick={() => app.openModal('Detalhes do visitante', <Details data={visitor} />)}>Ver detalhes</button>
              <button onClick={() => openAuthorizeVisitor(app, visitor)}>Autorizar rota</button>
              <button onClick={() => openDenyVisitor(app, visitor)}>Negar acesso</button>
              <button onClick={() => app.updateVisitorAccessStatus(visitor, 'Em rota', { requestedDestination: visitor.areaId === 'private' ? 'Recepcao Private' : 'Recepcao Hospital Marco Capute' }, 'Visitante orientado ate a recepcao')}>Levar ate recepcao</button>
              <button onClick={() => openMessage(app, visitor.name)}>Enviar mensagem</button>
              <button onClick={() => app.updateVisitorAccessStatus(visitor, 'Finalizado', {}, 'Permissao encerrada')}>Encerrar permissao</button>
            </div>
          </article>
        ))}
      </div>
    </Panel>
  );
}

function CheckinPage({ app }) {
  const [filter, setFilter] = useState(app.filters.checkin || 'Todos');
  const [query, setQuery] = useState('');
  const visible = app.checkins.filter((item) => (filter === 'Todos' || item.status === filter) && `${item.patient} ${item.document}`.toLowerCase().includes(query.toLowerCase()));
  return (
    <Panel title="Check-ins" wide>
      <Toolbar>
        <input placeholder="Buscar nome/documento" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button onClick={() => openCheckin(app)}>Novo check-in</button>
        <button onClick={() => app.exportToCSV('checkins.csv', visible)}>Exportar CSV</button>
      </Toolbar>
      <Pills items={['Todos', 'Aguardando', 'Em rota', 'Em atendimento', 'Finalizado']} active={filter} onChange={setFilter} />
      <Table rows={visible} columns={['patient', 'document', 'destination', 'status', 'time', 'accessibility']} actions={(item) => (
        <>
          <button onClick={() => app.updateCheckinStatus(item.id, 'Em rota')}>Iniciar rota</button>
          <button onClick={() => app.updateCheckinStatus(item.id, 'Em atendimento')}>Marcar atendimento</button>
          <button onClick={() => app.updateCheckinStatus(item.id, 'Finalizado')}>Finalizar</button>
          <button onClick={() => app.openModal('Detalhes do check-in', <Details data={item} />)}>Ver detalhes</button>
        </>
      )} />
    </Panel>
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
  return (
    <Panel title="Mensagens" wide>
      <Toolbar><button onClick={() => openMessage(app)}>Criar mensagem</button></Toolbar>
      <div className="card-list">{app.messages.map((msg) => <article className="message-card" key={msg.id}><b>{msg.direction} - {msg.to}</b><p>{msg.message}</p><span>{msg.priority} - {msg.time}</span></article>)}</div>
    </Panel>
  );
}

function Stat({ title, value, tone = 'info', onClick }) {
  return <button className={`stat-card ${tone}`} onClick={onClick}><span>{title}</span><strong>{value}</strong><small>Clique para abrir</small></button>;
}

function Panel({ title, children, wide = false }) {
  return <section className={`panel ${wide ? 'wide' : ''}`}><div className="panel-title"><h2>{title}</h2></div>{children}</section>;
}

function Toolbar({ children }) { return <div className="toolbar">{children}</div>; }

function Pills({ items, active, onChange }) {
  return <div className="pills">{items.map((item) => <button key={item} className={active === item ? 'active' : ''} onClick={() => onChange(item)}>{item}</button>)}</div>;
}

function Heatmap({ sectors, onSelect, large = false }) {
  const getLevel = (count) => {
    if (count >= 75) return 'critical';
    if (count >= 45) return 'high';
    if (count >= 18) return 'medium';
    return 'low';
  };
  const sectorPosition = {
    Recepcao: { x: 18, y: 70, size: 156 },
    'Setor de Imagem': { x: 63, y: 42, size: 132 },
    Laboratorio: { x: 51, y: 67, size: 104 },
    Consultorios: { x: 78, y: 30, size: 116 },
    Banheiro: { x: 34, y: 36, size: 74 },
    Elevador: { x: 46, y: 50, size: 86 },
    'Saida / Emergencia': { x: 85, y: 70, size: 72 },
  };

  return (
    <div className={`heatmap ${large ? 'large' : ''}`}>
      <header className="heatmap-head">
        <div>
          <span>Mapa de calor</span>
          <b>Movimentacao por setor</b>
        </div>
        <em>{sectors.reduce((total, sector) => total + sector.peopleCount, 0)} pessoas monitoradas</em>
      </header>
      <div className="hospital-map">
        <div className="map-room reception">Recepcao</div>
        <div className="map-room imaging">Setor de Imagem</div>
        <div className="map-room lab">Laboratorio</div>
        <div className="map-room consult">Consultorios</div>
        <div className="map-room bathroom">Banheiro</div>
        <div className="map-room elevator">Elevador</div>
        <div className="map-room exit">Saida Emergencia</div>
        <div className="map-room pharmacy">Farmacia</div>
        <div className="map-room waiting">Espera</div>
        <div className="map-corridor corridor-a" />
        <div className="map-corridor corridor-b" />
        <div className="map-corridor corridor-c" />
        {sectors.map((sector, index) => {
          const level = getLevel(sector.peopleCount);
          const position = sectorPosition[sector.name] || { x: 48 + index * 5, y: 48, size: 88 };
          return (
            <button
              key={sector.id}
              className={`heat-spot ${level}`}
              style={{
                '--x': `${position.x}%`,
                '--y': `${position.y}%`,
                '--spot': `${Math.max(position.size, sector.peopleCount * 1.45)}px`,
              }}
              onClick={() => onSelect(sector)}
              aria-label={`${sector.name}, ${sector.peopleCount} pessoas, fluxo ${sector.flow}`}
            >
              <span>{sector.peopleCount}</span>
              <small>{sector.name}</small>
            </button>
          );
        })}
      </div>
      <div className="heatmap-legend">
        <span><i className="low" />Pouco fluxo</span>
        <span><i className="medium" />Fluxo medio</span>
        <span><i className="high" />Fluxo alto</span>
        <span><i className="critical" />Lotacao critica</span>
      </div>
    </div>
  );
}

function CallCard({ call, app, reception = false }) {
  const critical = call.priority === 'Critica' || call.type === 'SOS Emergencia';
  return (
    <article className={`call-card ${critical ? 'critical' : ''}`}>
      <div><b>{call.type}</b><h3>{call.patient}</h3><p>{call.reason}</p><span>{call.location} - {call.beacon}</span></div>
      <div className="badges"><em>{call.priority}</em><em>{call.status}</em><em>{call.createdAt}</em></div>
      <div className="actions">
        <button onClick={() => app.openModal('Detalhes do chamado', <CallDetails call={call} />)}>Ver detalhes</button>
        <button onClick={() => app.updateCallStatus(call.id, statusOrder.Aceito)}>Aceitar</button>
        <button onClick={() => app.assignTeam(call.id)}>Acionar equipe</button>
        {reception && <button onClick={() => openDoctor(app, call)}>Solicitar medico</button>}
        <button onClick={() => app.updateCallStatus(call.id, statusOrder['Em atendimento'])}>Em atendimento</button>
        <button onClick={() => app.closeCall(call.id)}>Encerrar</button>
      </div>
    </article>
  );
}

function Table({ rows, columns, actions, rowClass = () => '' }) {
  return (
    <div className="table">
      <div className="table-head">{columns.map((col) => <b key={col}>{col}</b>)}<b>Acoes</b></div>
      {rows.map((row) => <div className={`table-row ${rowClass(row)}`} key={row.id}>{columns.map((col) => <span key={col}>{String(row[col])}</span>)}<div className="actions">{actions(row)}</div></div>)}
    </div>
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
  return <><button onClick={() => app.showToast('PDF gerado com sucesso')}>Exportar PDF</button><button onClick={() => app.exportToCSV(`relatorio-${report.period}.csv`, [report])}>Baixar CSV</button></>;
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
  app.openModal('Cadastrar funcionario', <StaffAccountForm onSubmit={app.createStaffAccount} />);
}

function openPasswordReset(app, account) {
  app.openModal(
    `Alterar senha - ${account.name}`,
    <PasswordForm account={account} onSubmit={(password) => app.updateStaffPassword(account.id, password)} />
  );
}

function StaffAccountForm({ onSubmit }) {
  const [form, setForm] = useState({
    name: '',
    email: '',
    password: '123456',
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
      <label>Senha inicial<input required value={form.password} onChange={(event) => update('password', event.target.value)} /></label>
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
      <button className="primary">Cadastrar acesso</button>
    </form>
  );
}

function PasswordForm({ account, onSubmit }) {
  const [password, setPassword] = useState(account.password);

  return (
    <form
      className="modal-form"
      onSubmit={(event) => {
        event.preventDefault();
        onSubmit(password);
      }}
    >
      <label>Nova senha<input required value={password} onChange={(event) => setPassword(event.target.value)} /></label>
      <button className="primary">Salvar nova senha</button>
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

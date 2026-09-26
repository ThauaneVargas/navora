import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import SplashScreen from './src/screens/SplashScreen';
import LoginScreen from './src/screens/LoginScreen';
import HomeScreen from './src/screens/HomeScreen';
import HomeStartScreen from './src/screens/HomeStartScreen';
import CareAreaChoiceScreen from './src/screens/CareAreaChoiceScreen';
import ExternalRouteScreen from './src/screens/ExternalRouteScreen';
import ArrivalDetectedScreen from './src/screens/ArrivalDetectedScreen';
import ProfileChoiceScreen from './src/screens/ProfileChoiceScreen';
import PatientAccessChoiceScreen from './src/screens/PatientAccessChoiceScreen';
import PatientLoginScreen from './src/screens/PatientLoginScreen';
import PatientQuickRegisterScreen from './src/screens/PatientQuickRegisterScreen';
import PatientAccessibilitySetupScreen from './src/screens/PatientAccessibilitySetupScreen';
import PatientHomeScreen from './src/screens/PatientHomeScreen';
import AssistantScreen from './src/screens/AssistantScreen';
import SearchScreen from './src/screens/SearchScreen';
import MapScreen from './src/screens/MapScreen';
import HowToGetScreen from './src/screens/HowToGetScreen';
import Mode3DScreen from './src/screens/Mode3DScreen';
import HelpScreen from './src/screens/HelpScreen';
import LostScreen from './src/screens/LostScreen';
import ProfileScreen from './src/screens/ProfileScreen';
import NotificationsScreen from './src/screens/NotificationsScreen';
import MenuScreen from './src/screens/MenuScreen';
import PatientRegisterScreen from './src/screens/PatientRegisterScreen';
import AccessibilityScreen from './src/screens/AccessibilityScreen';
import EmergencyRoutesScreen from './src/screens/EmergencyRoutesScreen';
import WaitingModeScreen from './src/screens/WaitingModeScreen';
import AreaEntryScreen from './src/screens/AreaEntryScreen';
import VisitorEntryScreen from './src/screens/VisitorEntryScreen';
import VisitorAccessStatusScreen from './src/screens/VisitorAccessStatusScreen';
import PlaceholderScreen from './src/screens/PlaceholderScreen';
import { initialHelpRequests } from './src/data/helpRequests';
import { AppProvider } from './src/context/AppContext';
import {
  canAccessDestination,
  destinations as fallbackDestinations,
  getAreaById,
  getExternalExamAccessStatus,
  getReceptionDestination,
  hospitalAreas as fallbackAreas,
} from './src/data/routes';
import { isAuthError, navoraApi } from './src/services/api';
import { getAuthToken, removeAuthToken } from './src/services/authToken';
import { indoorLocationService, indoorLog } from './src/services/indoorLocationService';
import { deriveNavigationProgress } from './src/services/navigationAdapter';

const screens = {
  Splash: SplashScreen,
  HomeStart: HomeStartScreen,
  CareAreaChoice: CareAreaChoiceScreen,
  ExternalRoute: ExternalRouteScreen,
  ArrivalDetected: ArrivalDetectedScreen,
  ProfileChoice: ProfileChoiceScreen,
  PatientAccessChoice: PatientAccessChoiceScreen,
  PatientLogin: PatientLoginScreen,
  PatientQuickRegister: PatientQuickRegisterScreen,
  PatientQuickAccess: PatientQuickRegisterScreen,
  PatientAccessibilitySetup: PatientAccessibilitySetupScreen,
  PatientHome: PatientHomeScreen,
  Login: LoginScreen,
  Home: PatientHomeScreen,
  Assistance: AssistantScreen,
  Assistant: AssistantScreen,
  Navigation: MapScreen,
  Search: SearchScreen,
  Map: MapScreen,
  HowToGet: HowToGetScreen,
  Mode3D: Mode3DScreen,
  Help: HelpScreen,
  Lost: LostScreen,
  Profile: ProfileScreen,
  Notifications: NotificationsScreen,
  Menu: MenuScreen,
  PatientRegister: PatientRegisterScreen,
  Accessibility: AccessibilityScreen,
  EmergencyRoutes: EmergencyRoutesScreen,
  WaitingMode: WaitingModeScreen,
  AreaEntry: AreaEntryScreen,
  VisitorEntry: VisitorEntryScreen,
  VisitorAccessStatus: VisitorAccessStatusScreen,
  RouteHistory: PlaceholderScreen,
  Settings: PlaceholderScreen,
  Privacy: PlaceholderScreen,
};

const mobileScreens = new Set(Object.keys(screens));

export default function App() {
  const [screenStack, setScreenStack] = useState(['Splash']);
  const [routeParams, setRouteParams] = useState({});
  const [userProfile, setUserProfile] = useState(null);
  const [activeRoute, setActiveRoute] = useState(null);
  const [visitorAccessRequest, setVisitorAccessRequest] = useState(null);
  const [navigationData, setNavigationData] = useState({
    areas: fallbackAreas,
    destinations: fallbackDestinations,
    entrances: [],
  });
  const [navigationSource, setNavigationSource] = useState('fallback');
  const [navigationLoaded, setNavigationLoaded] = useState(false);
  const [sessionRestored, setSessionRestored] = useState(false);
  const [helpRequests, setHelpRequests] = useState(() => [...initialHelpRequests]);
  const lastIndoorResolutionRef = useRef(null);
  const screen = screenStack[screenStack.length - 1];
  const CurrentScreen = screens[screen] || SplashScreen;
  const navigationProgress = useMemo(
    () => deriveNavigationProgress(activeRoute),
    [activeRoute]
  );

  useEffect(() => {
    let active = true;

    navoraApi.getNavigationBootstrap().then((result) => {
      if (!active) return;
      setNavigationData(result.data);
      setNavigationSource(result.source);
      setNavigationLoaded(true);
    });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;

    const restoreSession = async () => {
      const token = await getAuthToken();
      if (!token) {
        return;
      }

      try {
        const authUser = await navoraApi.getAuthMe();
        if (authUser?.role !== 'PATIENT') {
          await removeAuthToken();
          return;
        }
        const patient = await navoraApi.getMyPatientProfile();
        if (!active) return;
        handlePatientReady({ ...patient, apiUser: authUser, authSource: 'api', hasAccount: true });
        setSessionRestored(true);
        setScreenStack((current) => (current[current.length - 1] === 'Splash' ? current : ['PatientHome']));
      } catch (error) {
        if (isAuthError(error)) {
          await removeAuthToken();
        }
      }
    };

    restoreSession();

    return () => {
      active = false;
    };
  }, []);

  const navigate = (nextScreen, params = {}) => {
    const resolvedScreen = mobileScreens.has(nextScreen) ? nextScreen : 'Home';
    setRouteParams(params || {});
    setScreenStack((current) => [...current, resolvedScreen]);
  };

  const goBack = (defaultScreen = 'Home') => {
    setRouteParams({});
    setScreenStack((current) => {
      if (current.length <= 1) return [defaultScreen];
      const next = current.slice(0, -1);
      return next.length ? next : [defaultScreen];
    });
  };

  const getCurrentAreaById = (areaId = 'private') =>
    navigationData.areas.find((area) => area.id === areaId || area.code === areaId) || getAreaById(areaId);

  const getCurrentReceptionDestination = (areaId = 'private') =>
    navigationData.destinations.find((destination) => destination.id === `${areaId}-reception` || destination.code === `${areaId}-reception`) ||
    navigationData.destinations.find((destination) => destination.id === 'shared-lost' || destination.code === 'shared-lost') ||
    getReceptionDestination(areaId);

  const getDestinationCode = (destination) => destination?.code || destination?.id;
  const getDestinationNodeCode = (destination) =>
    destination?.navigationNodeCode || destination?.navigation_node_code || destination?.navigationNode?.code || null;

  const getOriginNodeCode = (context = {}) => {
    if (context.originNodeCode) return context.originNodeCode;
    if (userProfile?.originNodeCode) return userProfile.originNodeCode;
    if (userProfile?.area === 'sus') return 'sus-entry';
    return 'private-entry';
  };

  const getAccessibilityPayload = (context = {}) => {
    if (context.accessibility === 'Sim') return { mobility: true };
    if (context.accessibility && typeof context.accessibility === 'object') return context.accessibility;
    const accessibility = userProfile?.accessibility || {};
    return {
      mobility: Boolean(
        accessibility.mobility ||
        accessibility.wheelchair ||
        accessibility.avoidStairs ||
        accessibility.preferElevator ||
        accessibility.needsStretcher
      ),
    };
  };

  const updateLocationFromBeacon = (area = 'private', detection = {}) => {
    const areaData = getCurrentAreaById(area === 'unknown' ? 'private' : area);
    setUserProfile((current) => ({
      ...(current || {}),
      area: areaData.id,
      entry: areaData.entry,
      entryLabel: areaData.entryLabel,
      currentLocation: detection.navigation_node?.label || detection.entrance || areaData.entryLabel,
      currentBeacon: detection.beacon_code || detection.beaconCode || areaData.entry,
      originNodeCode: detection.origin_node_code || current?.originNodeCode,
    }));
  };

  const getSubject = (profile = userProfile) => {
    if (profile?.type === 'visitor') return 'VISITOR';
    if (profile?.type === 'patient' && profile?.authSource === 'api' && profile?.role === 'PATIENT') {
      return 'PATIENT';
    }
    if (profile?.type === 'patient' && profile?.hasAccount === false && profile?.alreadyPatient === false) {
      return 'EXTERNAL_PATIENT';
    }
    return 'PATIENT';
  };

  const buildProfile = (selectedType, selectedArea = userProfile?.area || 'private') => {
    const area = getCurrentAreaById(selectedArea);
    return {
      type: selectedType === 'visitor' || selectedType === 'visitante' ? 'visitor' : 'patient',
      area: area.id,
      entry: area.entry,
      entryLabel: area.entryLabel,
    };
  };

  const handleAreaProfileSelect = ({ area = 'private', type = 'patient' }) => {
    const profile = buildProfile(type, area);
    setUserProfile(profile);
    setActiveRoute(null);
    setVisitorAccessRequest(null);
    setRouteParams({});
    setScreenStack(profile.type === 'visitor' ? ['VisitorEntry'] : ['Home']);
  };

  const handleAreaDetected = (area = 'private', detection = {}) => {
    updateLocationFromBeacon(area, detection);
  };

  const handleProfileDraft = ({ type = 'patient', area = userProfile?.area || 'private' }) => {
    const areaData = getCurrentAreaById(area);
    setUserProfile((current) => ({
      ...(current || {}),
      type,
      area: areaData.id,
      entry: areaData.entry,
      entryLabel: areaData.entryLabel,
      hasAccount: false,
    }));
  };

  const handlePatientReady = (patient) => {
    const area = getCurrentAreaById(patient?.area || userProfile?.area || 'private');
    const apiUser = patient?.apiUser || patient?.user;
    setUserProfile({
      type: 'patient',
      id: patient?.id,
      userId: apiUser?.id,
      role: apiUser?.role || patient?.role,
      authSource: patient?.authSource || (patient?.demoMode ? 'fallback' : undefined),
      email: apiUser?.email || patient?.email,
      phone: apiUser?.phone || patient?.phone,
      patientCode: patient?.patientCode,
      birthDate: patient?.birthDate,
      name: patient?.name || apiUser?.name?.split(' ')[0] || 'Paciente',
      fullName: patient?.fullName || apiUser?.name || patient?.name || 'Paciente Navora',
      area: area.id,
      entry: area.entry,
      entryLabel: area.entryLabel,
      hasAccount: Boolean(patient?.hasAccount),
      alreadyPatient: Boolean(patient?.alreadyPatient),
      quick: Boolean(patient?.quick),
      accessibility: patient?.accessibility || {},
      lastDestination: patient?.lastDestination,
      emergencyContact: patient?.emergencyContact,
    });
    setActiveRoute(null);
    setVisitorAccessRequest(null);
  };

  const handleLoginSuccess = (selectedUserType) => {
    const profile = buildProfile(selectedUserType);
    setUserProfile(profile);
    setRouteParams({});
    setScreenStack(profile.type === 'visitor' ? ['VisitorEntry'] : ['Home']);
  };

  const handleLogout = async () => {
    await removeAuthToken();
    setUserProfile(null);
    setSessionRestored(false);
    setActiveRoute(null);
    setVisitorAccessRequest(null);
    setRouteParams({});
    setScreenStack(['AreaEntry']);
  };

  const handleCreateHelpRequest = (request) => {
    const profileName = userProfile?.type === 'visitor' ? 'Visitante Navora' : 'Paciente Navora';
    const profileType = userProfile?.type === 'visitor' ? 'Visitante' : 'Paciente';

    const newRequest = {
      id: `CH-${Date.now()}`,
      nome: profileName,
      perfil: profileType,
      local: 'Recepcao',
      andar: 'Terreo',
      setor: 'Entrada principal',
      horario: 'Agora',
      status: 'Pendente',
      prioridade: request?.urgente ? 'Alta' : 'Media',
      ...request,
    };

    setHelpRequests((currentRequests) => [newRequest, ...currentRequests]);
    return newRequest;
  };

  const handleUpdateHelpRequest = (requestId, status) => {
    setHelpRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === requestId ? { ...request, status } : request
      )
    );
  };

  const startRouteDirect = (destination) => {
    const nextDestination = destination || getCurrentReceptionDestination(userProfile?.area);
    const origin = getCurrentReceptionDestination(userProfile?.area)?.name || 'Recepcao';

    setActiveRoute({
      origin,
      originNodeCode: getOriginNodeCode(),
      destination: nextDestination.name,
      requestedDestination: nextDestination,
      effectiveDestination: nextDestination,
      nodes: [],
      edges: [],
      steps: [],
      totalDistance: null,
      estimatedTime: null,
      distance: nextDestination.distance || '80 m',
      time: nextDestination.time || '2 min',
      eta: nextDestination.time || '2 min',
      status: 'active',
      area: nextDestination.area,
      source: 'fallback',
    });
    navigate('Navigation', { destination: nextDestination.name });
  };

  const resolveOfflineAccess = (destination, context = {}) => {
    const nextDestination = destination || getCurrentReceptionDestination(userProfile?.area);
    const externalAccess = getExternalExamAccessStatus(nextDestination);

    if (!canAccessDestination(nextDestination, userProfile || {})) {
      Alert.alert('Acesso indisponivel', 'Procure a recepcao para orientacao.');
      return;
    }

    if (userProfile?.type === 'visitor' && nextDestination.accessLevel === 'visitor_authorization' && !context.visitorAccessRequest) {
      handleVisitorAccessRequest({
        visitorName: context.visitorName || userProfile?.name || 'Visitante Navora',
        destination: nextDestination,
        destinationCode: getDestinationCode(nextDestination),
        requestedDestination: nextDestination.name,
        reason: context.reason || 'Visita',
        accessibility: context.accessibility || 'Nao',
      });
      return;
    }

    if (userProfile?.type !== 'visitor' && externalAccess.controlled && !externalAccess.allowed) {
      const reception = getCurrentReceptionDestination(userProfile?.area);
      Alert.alert(
        'Atendimento externo',
        `${nextDestination.name} recebe pacientes externos das ${externalAccess.label.replace('Atendimento externo: ', '')}.\nProcure a recepcao para orientacao ou aguarde o horario permitido.`,
        [
          { text: `Levar ate ${reception?.name}`, onPress: () => startRouteDirect(reception) },
          { text: 'Cancelar', style: 'cancel' },
        ]
      );
      return;
    }

    startRouteDirect(nextDestination);
  };

  const resolveNavigationAccess = async (destination, context = {}) => {
    const nextDestination = destination || getCurrentReceptionDestination(userProfile?.area);

    if (navigationSource !== 'api') {
      resolveOfflineAccess(nextDestination, context);
      return;
    }

    const payload = {
      origin_node_code: getOriginNodeCode(context),
      destination_code: getDestinationCode(nextDestination),
      subject: context.subject || getSubject(),
      current_area_code: userProfile?.area,
      current_beacon_code: userProfile?.currentBeacon,
      visitor_access_request_id: context.visitorAccessRequestId || visitorAccessRequest?.id,
      accessibility: getAccessibilityPayload(context),
    };

    let result;
    try {
      result = await navoraApi.getRoutePreview(payload, nextDestination);
    } catch (error) {
      Alert.alert('Navegacao indisponivel', error?.payload?.message || 'Nao foi possivel calcular a rota agora.');
      return;
    }

    if (result.source !== 'api') {
      resolveOfflineAccess(nextDestination, context);
      return;
    }

    const decision = result.data?.decision;
    if (decision === 'ALLOW') {
      if (!result.data?.routeFound) {
        Alert.alert('Rota indisponivel', result.data?.reason || 'Nao existe rota para este destino.');
        return;
      }
      setActiveRoute(result.data);
      navigate('Navigation', { destination: result.data.destination });
      return;
    }

    if (decision === 'REDIRECT_TO_RECEPTION') {
      const redirectDestination = result.data?.effectiveDestination;
      if (redirectDestination && result.data?.routeFound) {
        Alert.alert('Orientacao', result.data?.access?.reason || 'Procure a recepcao para orientacao.', [
          {
            text: `Ir ate ${redirectDestination.name}`,
            onPress: () => {
              setActiveRoute(result.data);
              navigate('Navigation', { destination: result.data.destination });
            },
          },
          { text: 'Cancelar', style: 'cancel' },
        ]);
        return;
      }
      Alert.alert('Orientacao', result.data?.reason || result.data?.access?.reason || 'Procure a recepcao para orientacao.');
      return;
    }

    if (decision === 'REQUIRE_AUTHORIZATION') {
      handleVisitorAccessRequest({
        visitorName: context.visitorName || userProfile?.name || 'Visitante Navora',
        destination: nextDestination,
        destinationCode: getDestinationCode(nextDestination),
        requestedDestination: nextDestination.name,
        reason: context.reason || 'Visita',
        accessibility: context.accessibility || 'Nao',
      });
      return;
    }

    Alert.alert('Acesso bloqueado', result.data?.reason || 'Acesso bloqueado para este destino.');
  };

  const recalculateActiveRouteFromBeacon = async (beaconDetection = {}) => {
    const nextOriginNodeCode = beaconDetection.origin_node_code || beaconDetection.navigation_node?.code;
    const nextArea = beaconDetection.area || userProfile?.area || 'private';

    updateLocationFromBeacon(nextArea, beaconDetection);

    if (!activeRoute || activeRoute.status !== 'active') {
      return { recalculated: false, reason: 'no-active-route' };
    }

    if (!nextOriginNodeCode) {
      return { recalculated: false, reason: 'beacon-without-origin' };
    }

    if (nextOriginNodeCode === activeRoute.originNodeCode) {
      return { recalculated: false, reason: 'same-origin' };
    }

    const effectiveDestination = activeRoute.effectiveDestination || activeRoute.requestedDestination;
    const destinationNodeCode = getDestinationNodeCode(effectiveDestination);

    if (destinationNodeCode && nextOriginNodeCode === destinationNodeCode) {
      const arrivedRoute = {
        ...activeRoute,
        origin: beaconDetection.navigation_node?.label || activeRoute.destination,
        originNodeCode: nextOriginNodeCode,
        distance: '0 m',
        time: '0 min',
        eta: '0 min',
        totalDistance: 0,
        estimatedTime: 0,
        status: 'arrived',
        steps: [
          {
            index: 1,
            instruction: `Voce chegou ao destino: ${activeRoute.destination}.`,
            distance: 0,
            floor: beaconDetection.navigation_node?.floor || effectiveDestination?.floor || null,
            node_code: nextOriginNodeCode,
            type: 'ARRIVAL',
          },
        ],
      };
      setActiveRoute(arrivedRoute);
      navigate('WaitingMode', { destination: arrivedRoute.destination });
      return { recalculated: false, reason: 'arrived', route: arrivedRoute };
    }

    const destinationCode = getDestinationCode(effectiveDestination);
    if (!destinationCode) {
      Alert.alert('Rota ativa', 'Nao foi possivel identificar o destino atual para recalcular.');
      return { recalculated: false, reason: 'missing-destination' };
    }

    const payload = {
      origin_node_code: nextOriginNodeCode,
      destination_code: destinationCode,
      subject: getSubject(),
      current_area_code: nextArea,
      current_beacon_code: beaconDetection.beacon_code || beaconDetection.beaconCode || userProfile?.currentBeacon,
      visitor_access_request_id: visitorAccessRequest?.id,
      accessibility: getAccessibilityPayload(),
    };

    let result;
    try {
      result = await navoraApi.getRoutePreview(payload, effectiveDestination);
    } catch (error) {
      Alert.alert('Replanejamento indisponivel', error?.payload?.message || 'Mantenha a rota atual e procure a recepcao se precisar.');
      return { recalculated: false, reason: 'api-error' };
    }

    if (result.source !== 'api') {
      Alert.alert('Sem conexao', 'Mantivemos a rota atual ate a conexao voltar.');
      return { recalculated: false, reason: 'offline' };
    }

    const decision = result.data?.decision;
    if (decision === 'BLOCK') {
      Alert.alert('Acesso bloqueado', result.data?.reason || result.data?.access?.reason || 'Mantenha a rota atual e procure orientacao.');
      return { recalculated: false, reason: 'blocked' };
    }

    if (decision === 'REQUIRE_AUTHORIZATION') {
      Alert.alert('Autorizacao necessaria', result.data?.reason || result.data?.access?.reason || 'Procure a recepcao para autorizacao.');
      return { recalculated: false, reason: 'requires-authorization' };
    }

    if (!result.data?.routeFound) {
      Alert.alert('Rota indisponivel', result.data?.reason || 'Mantivemos a rota anterior enquanto recalculamos uma alternativa segura.');
      return { recalculated: false, reason: 'route-not-found' };
    }

    const recalculatedRoute = {
      ...result.data,
      requestedDestination: activeRoute.requestedDestination || result.data.requestedDestination,
    };
    setActiveRoute(recalculatedRoute);
    return { recalculated: true, reason: decision === 'REDIRECT_TO_RECEPTION' ? 'redirected' : 'updated', route: recalculatedRoute };
  };

  const handleIndoorLocationDetection = async (indoorEvent = {}) => {
    const beaconIdentifier = indoorEvent.identifier;
    indoorLog('event_received', {
      source: indoorEvent.source,
      identifier: beaconIdentifier,
      rssi: indoorEvent.rssi,
      detectedAt: indoorEvent.detectedAt,
    });

    if (!beaconIdentifier) {
      indoorLog('beacon_unknown', { reason: 'missing-identifier' });
      return { detected: false, reason: 'missing-identifier', event: indoorEvent };
    }

    const lastResolution = lastIndoorResolutionRef.current;
    if (
      activeRoute?.status === 'active' &&
      lastResolution?.identifier === beaconIdentifier &&
      lastResolution?.originNodeCode &&
      lastResolution.originNodeCode === activeRoute.originNodeCode
    ) {
      indoorLog('duplicate_same_origin', {
        identifier: beaconIdentifier,
        originNodeCode: lastResolution.originNodeCode,
      });
      return {
        detected: true,
        reason: 'same-origin-cached',
        event: indoorEvent,
        detection: lastResolution.detection,
        recalculation: { recalculated: false, reason: 'same-origin' },
      };
    }

    let detected;
    try {
      detected = await navoraApi.detectBeacon(beaconIdentifier);
    } catch (error) {
      indoorLog('beacon_detect_api_error', { identifier: beaconIdentifier, message: error?.message });
      return { detected: false, reason: 'api-error', error, event: indoorEvent };
    }

    if (!detected?.detected) {
      indoorLog(detected?.api_offline ? 'beacon_detect_api_offline' : 'beacon_unknown', {
        identifier: beaconIdentifier,
      });
      return {
        detected: false,
        reason: detected?.api_offline ? 'api-offline' : 'unknown-beacon',
        event: indoorEvent,
        detection: detected,
      };
    }

    const beaconDetection = {
      ...detected,
      beacon_code: beaconIdentifier,
      indoor_event: indoorEvent,
    };
    lastIndoorResolutionRef.current = {
      identifier: beaconIdentifier,
      originNodeCode: beaconDetection.origin_node_code,
      detection: beaconDetection,
    };

    indoorLog('beacon_identified', {
      identifier: beaconIdentifier,
      originNodeCode: beaconDetection.origin_node_code,
    });

    if (beaconDetection.origin_node_code && beaconDetection.origin_node_code === activeRoute?.originNodeCode) {
      indoorLog('same_origin', { originNodeCode: beaconDetection.origin_node_code });
    } else if (activeRoute?.status === 'active') {
      indoorLog('new_origin', { originNodeCode: beaconDetection.origin_node_code });
      indoorLog('replanning_started', { originNodeCode: beaconDetection.origin_node_code });
    }

    const recalculation = await recalculateActiveRouteFromBeacon(beaconDetection);
    if (recalculation?.reason === 'route-not-found') {
      indoorLog('route_found_false', { originNodeCode: beaconDetection.origin_node_code });
    }
    if (recalculation?.reason === 'arrived') {
      indoorLog('arrival_detected', { originNodeCode: beaconDetection.origin_node_code });
    }
    indoorLog('replanning_finished', {
      reason: recalculation?.reason,
      recalculated: recalculation?.recalculated,
      routeFound: recalculation?.route?.routeFound,
    });

    return {
      detected: true,
      event: indoorEvent,
      detection: beaconDetection,
      recalculation,
    };
  };

  useEffect(() => {
    indoorLocationService.start();
    const unsubscribe = indoorLocationService.subscribe(handleIndoorLocationDetection);
    return () => {
      unsubscribe();
      indoorLocationService.stop();
    };
  }, [activeRoute, userProfile, visitorAccessRequest, navigationSource]);

  const handleStartRoute = (destination) => {
    resolveNavigationAccess(destination);
  };

  const normalizeVisitorAccessRequest = (request, fallback = {}) => ({
    id: request?.id || fallback.id || `VAR-${Date.now()}`,
    visitorName: request?.visitor_name || fallback.visitorName || 'Visitante Navora',
    area: request?.area_id || fallback.area || userProfile?.area || 'private',
    areaName: request?.area_name || fallback.areaName,
    entry: request?.entry || fallback.entry,
    entrance: request?.entrance || fallback.entrance,
    currentLocation: request?.current_location || fallback.currentLocation || getCurrentReceptionDestination(userProfile?.area)?.name || 'Entrada',
    requestedDestination: request?.requested_destination || fallback.requestedDestination,
    destinationCode: request?.destination_code || fallback.destinationCode,
    destinationId: request?.destination_id || fallback.destinationId,
    reason: request?.reason || fallback.reason || 'Visita',
    accessibility: request?.accessibility || fallback.accessibility || 'Nao',
    status: request?.status || fallback.status || 'Aguardando autorizacao',
    allowedRoute: request?.allowed_route || fallback.allowedRoute,
    allowedTime: request?.allowed_time || fallback.allowedTime,
    createdAt: request?.created_at || fallback.createdAt || new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
  });

  const handleVisitorAccessRequest = async (request, options = {}) => {
    const area = getCurrentAreaById(userProfile?.area);
    const reception = getCurrentReceptionDestination(userProfile?.area);
    const fallbackRequest = {
      id: `VAR-${Date.now()}`,
      visitorName: request?.visitorName || 'Visitante Navora',
      area: area.id,
      areaName: area.name,
      entry: area.entryLabel,
      entrance: area.entranceName,
      currentLocation: reception?.name || 'Entrada',
      requestedDestination: request?.requestedDestination,
      destinationCode: request?.destinationCode || getDestinationCode(request?.destination),
      destinationId: request?.destination?.numericId,
      reason: request?.reason || 'Visita',
      accessibility: request?.accessibility || 'Nao',
      status: 'Aguardando autorizacao',
      createdAt: new Date().toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }),
    };

    setVisitorAccessRequest(fallbackRequest);
    setActiveRoute(null);
    if (!options.skipNavigate) {
      navigate('VisitorAccessStatus', { request: fallbackRequest });
    }

    try {
      const apiRequest = await navoraApi.createVisitorAccessRequest({
        visitor_name: fallbackRequest.visitorName,
        area_id: area.id,
        area_name: area.name,
        entry: area.entryLabel,
        entrance: area.entranceName,
        current_location: fallbackRequest.currentLocation,
        requested_destination: fallbackRequest.requestedDestination,
        reason: fallbackRequest.reason,
        accessibility: fallbackRequest.accessibility,
        beacon: area.entry,
      });
      if (apiRequest?.demoMode) {
        // Sem conexao: o pedido existe so no aparelho e a recepcao nao o recebeu.
        const unsentRequest = { ...fallbackRequest, syncError: true };
        setVisitorAccessRequest(unsentRequest);
        return unsentRequest;
      }
      const syncedRequest = normalizeVisitorAccessRequest(apiRequest, fallbackRequest);
      setVisitorAccessRequest(syncedRequest);
      setRouteParams({ request: syncedRequest });
      return syncedRequest;
    } catch (error) {
      const unsentRequest = { ...fallbackRequest, syncError: true };
      setVisitorAccessRequest(unsentRequest);
      return unsentRequest;
    }
  };

  if (screen === 'Splash') {
    return (
      <AppProvider>
      <SafeAreaProvider>
        <SplashScreen onSplashFinish={() => setScreenStack([sessionRestored || userProfile?.authSource === 'api' ? 'PatientHome' : 'HomeStart'])} />
      </SafeAreaProvider>
      </AppProvider>
    );
  }

  return (
    <AppProvider>
    <SafeAreaProvider>
      {screen === 'Login' ? (
        <LoginScreen
          onLoginSuccess={handleLoginSuccess}
          onCreateAccount={() => {
            setRouteParams({});
            setScreenStack(['Login', 'PatientRegister']);
          }}
        />
      ) : (
        <CurrentScreen
          navigate={navigate}
          goBack={goBack}
          routeParams={routeParams}
          currentScreen={screen}
          userType={userProfile?.type}
          userProfile={userProfile}
          activeRoute={activeRoute}
          navigationProgress={navigationProgress}
          visitorAccessRequest={visitorAccessRequest}
          navigationData={navigationData}
          navigationSource={navigationSource}
          navigationLoaded={navigationLoaded}
          helpRequests={helpRequests}
          onAreaProfileSelect={handleAreaProfileSelect}
          onAreaDetected={handleAreaDetected}
          onBeaconDetected={recalculateActiveRouteFromBeacon}
          onProfileDraft={handleProfileDraft}
          onPatientReady={handlePatientReady}
          onStartRoute={handleStartRoute}
          onResolveNavigationAccess={resolveNavigationAccess}
          onCreateVisitorAccessRequest={handleVisitorAccessRequest}
          onCancelVisitorAccessRequest={() => setVisitorAccessRequest(null)}
          onCreateHelpRequest={handleCreateHelpRequest}
          onUpdateHelpRequest={handleUpdateHelpRequest}
          onLogout={handleLogout}
        />
      )}
    </SafeAreaProvider>
    </AppProvider>
  );
}

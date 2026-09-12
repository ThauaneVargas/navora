import {
  destinations as fallbackDestinations,
  hospitalAreas as fallbackAreas,
  getReceptionDestination,
  routePoints,
} from '../data/routes';

const fallbackIconByCategory = {
  Atendimento: 'stethoscope',
  Exames: 'flask-outline',
  Restrito: 'lock-alert-outline',
  Servicos: 'desk',
  Visita: 'account-heart-outline',
};

export const normalizeArea = (area = {}) => ({
  id: area.code || area.id || 'private',
  numericId: area.id,
  code: area.code || area.id || 'private',
  name: area.name || area.area_name || 'Hospital ativo',
  entranceName: area.entrances?.[0]?.name || area.entranceName || defaultEntranceName(area.code || area.id),
  entry: area.entrances?.[0]?.entryKey || area.entry || defaultEntry(area.code || area.id),
  entryLabel: area.entrances?.[0]?.entryKey || area.entryLabel || defaultEntryLabel(area.code || area.id),
  label: area.label || area.name || area.code || 'Area',
  description: area.description || '',
});

export const normalizeDestination = (destination = {}) => {
  const areaCode = destination.area?.code || destination.area || destination.areaCode || 'shared';
  const code = destination.code || destination.id || '';

  return {
    id: code,
    code,
    numericId: destination.id,
    icon: destination.icon || fallbackIconByCategory[destination.category] || 'map-marker-outline',
    name: destination.name || 'Destino',
    area: areaCode,
    areaName: destination.area?.name || destination.areaName || '',
    category: destination.category || 'Servicos',
    floor: destination.floor || destination.navigationNode?.floor || 'Piso Terreo',
    distance: destination.distanceLabel || destination.distance || '80 m',
    time: destination.timeLabel || destination.time || '2 min',
    accessLevel: destination.accessLevel || destination.access_level || 'public',
    sector: destination.sector?.name || (typeof destination.sector === 'string' ? destination.sector : null),
    navigationNode: destination.navigationNode,
    navigationNodeCode: destination.navigation_node_code || destination.navigationNode?.code || null,
    externalPatientAccess: Boolean(destination.externalPatientAccess),
    source: destination.source,
  };
};

export const normalizeNavigationBootstrap = (bootstrap = {}) => ({
  areas: normalizeAreas(bootstrap.areas),
  destinations: normalizeDestinations(bootstrap.destinations),
  entrances: bootstrap.entrances || [],
});

export const normalizeAreas = (areas) =>
  Array.isArray(areas) && areas.length ? areas.map(normalizeArea) : fallbackAreas;

export const normalizeDestinations = (destinations) =>
  Array.isArray(destinations) && destinations.length ? destinations.map(normalizeDestination) : fallbackDestinations;

export const normalizeAccessDestination = (destination = {}) =>
  destination.code
    ? normalizeDestination(destination)
    : null;

export const fallbackNavigationBootstrap = {
  areas: fallbackAreas,
  destinations: fallbackDestinations,
  entrances: [],
};

export const fallbackAccessCheck = (payload = {}, destination) => {
  const target = destination || fallbackDestinations.find((item) => item.id === payload.destination_code);
  if (!target) {
    return {
      source: 'fallback',
      allowed: false,
      decision: 'BLOCK',
      reason: 'Destino nao encontrado.',
      requires_authorization: false,
      redirect_destination: null,
    };
  }

  return {
    source: 'fallback',
    allowed: true,
    decision: 'ALLOW',
    reason: 'Acesso permitido em modo offline.',
    requires_authorization: false,
    destination: target,
    redirect_destination: null,
  };
};

export const normalizeApiEnvelope = (data, source = 'api') => ({ data, source });

export const normalizeRouteCoordinates = (nodes = [], options = {}) => {
  const padding = Number.isFinite(options.padding) ? options.padding : 10;
  const usableRange = Math.max(1, 100 - padding * 2);
  const positionedNodes = nodes.filter(
    (node) => Number.isFinite(Number(node?.x)) && Number.isFinite(Number(node?.y))
  );

  if (!positionedNodes.length) {
    return nodes.map((node, index) => ({
      ...node,
      originalX: node?.x ?? null,
      originalY: node?.y ?? null,
      normalizedX: 50,
      normalizedY: 50,
      coordinateFallback: true,
      coordinateIndex: index,
    }));
  }

  const xs = positionedNodes.map((node) => Number(node.x));
  const ys = positionedNodes.map((node) => Number(node.y));
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const spanX = Math.max(1, maxX - minX);
  const spanY = Math.max(1, maxY - minY);

  return nodes.map((node, index) => {
    const hasCoordinates = Number.isFinite(Number(node?.x)) && Number.isFinite(Number(node?.y));
    return {
      ...node,
      originalX: node?.x ?? null,
      originalY: node?.y ?? null,
      normalizedX: hasCoordinates ? padding + ((Number(node.x) - minX) / spanX) * usableRange : 50,
      normalizedY: hasCoordinates ? padding + ((Number(node.y) - minY) / spanY) * usableRange : 50,
      coordinateFallback: !hasCoordinates,
      coordinateIndex: index,
    };
  });
};

export const deriveNavigationProgress = (activeRoute = null) => {
  const nodes = Array.isArray(activeRoute?.nodes) ? activeRoute.nodes : [];
  const edges = Array.isArray(activeRoute?.edges) ? activeRoute.edges : [];
  const steps = Array.isArray(activeRoute?.steps) ? activeRoute.steps : [];
  const currentNodeCode = activeRoute?.originNodeCode || null;
  const currentNodeIndex = currentNodeCode
    ? nodes.findIndex((node) => node?.code === currentNodeCode)
    : -1;
  const progressKnown = Boolean(currentNodeCode) && currentNodeIndex >= 0 && nodes.length > 0;
  const currentNode = progressKnown ? nodes[currentNodeIndex] : null;
  const destinationNodeCode = getRouteDestinationNodeCode(activeRoute, nodes);
  const arrived = activeRoute?.status === 'arrived' || Boolean(currentNodeCode && destinationNodeCode && currentNodeCode === destinationNodeCode);
  const nextNode = progressKnown && !arrived ? nodes[currentNodeIndex + 1] || null : null;
  const nextNodeCode = nextNode?.code || null;
  const stepState = resolveRouteSteps(steps, {
    arrived,
    nextNodeCode,
  });
  const edgeState = classifyRouteEdges(edges, nodes, currentNodeIndex, progressKnown, arrived);

  return {
    currentNodeCode,
    currentNodeIndex: progressKnown ? currentNodeIndex : null,
    currentNode,
    currentFloor: currentNode?.floor || null,
    destinationNodeCode,
    nextNodeCode,
    nextNode,
    currentStepIndex: stepState.currentStepIndex,
    currentStep: stepState.currentStep,
    nextStepIndex: stepState.nextStepIndex,
    nextStep: stepState.nextStep,
    traversedNodeCodes: progressKnown
      ? nodes.slice(0, currentNodeIndex).map((node) => node?.code).filter(Boolean)
      : [],
    remainingNodeCodes: progressKnown && !arrived
      ? nodes.slice(currentNodeIndex + 1).map((node) => node?.code).filter(Boolean)
      : [],
    currentEdgeIds: edgeState.currentEdgeIds,
    traversedEdgeIds: edgeState.traversedEdgeIds,
    remainingEdgeIds: edgeState.remainingEdgeIds,
    edgeStatusByKey: edgeState.edgeStatusByKey,
    arrived,
    progressKnown,
    redirected: Boolean(activeRoute?.redirected),
  };
};

export const normalizeRoutePreview = (preview = {}, source = 'api', fallbackDestination) => {
  const effectiveDestination = normalizeAccessDestination(preview.effective_destination) || fallbackDestination || null;
  const requestedDestination = normalizeAccessDestination(preview.requested_destination) || effectiveDestination;
  const nodes = Array.isArray(preview.nodes) ? preview.nodes : [];
  const edges = Array.isArray(preview.edges) ? preview.edges : [];
  const steps = Array.isArray(preview.steps) ? preview.steps : [];
  const originNode = preview.origin || nodes[0] || null;
  const rawDest = preview.destination;
  const destinationName =
    effectiveDestination?.name ||
    (typeof rawDest === 'string' ? rawDest : rawDest?.name) ||
    fallbackDestination?.name ||
    'Destino';
  const rawOriginStr = typeof preview.origin === 'string' ? preview.origin : null;
  const totalDistance = preview.total_distance ?? preview.totalDistance ?? null;
  const estimatedTime = preview.estimated_time_seconds ?? preview.estimatedTime ?? null;

  return {
    routeFound: preview.route_found !== false,
    decision: preview.decision || 'ALLOW',
    redirected: Boolean(preview.redirected),
    reason: preview.reason || null,
    accessibleRouteFound: preview.accessible_route_found ?? null,
    origin: originNode?.label || originNode?.name || rawOriginStr || 'Origem',
    originNodeCode: originNode?.code || preview.origin_node_code || null,
    destination: destinationName,
    requestedDestination,
    effectiveDestination,
    nodes,
    edges,
    steps,
    totalDistance,
    estimatedTime,
    distance: totalDistance !== null ? `${Math.round(totalDistance)} m` : effectiveDestination?.distance || fallbackDestination?.distance || '80 m',
    time: estimatedTime !== null ? secondsToLabel(estimatedTime) : effectiveDestination?.time || fallbackDestination?.time || '2 min',
    eta: estimatedTime !== null ? secondsToLabel(estimatedTime) : effectiveDestination?.time || fallbackDestination?.time || '2 min',
    status: preview.route_found === false ? 'not_found' : 'active',
    area: effectiveDestination?.area || fallbackDestination?.area,
    access: preview.access,
    accessibility: preview.accessibility,
    source,
  };
};

export const fallbackRoutePreview = (payload = {}, destination) => {
  const reception = localReceptionForArea(destination?.area || 'private');
  const target = destination || reception;
  const origin = payload.origin_node_code?.includes('sus') ? 'Entrada do hospital ativo' : reception?.name || 'Recepcao';

  return {
    route_found: true,
    decision: 'ALLOW',
    redirected: false,
    reason: null,
    origin: {
      code: payload.origin_node_code || null,
      label: origin,
      floor: 'Piso Terreo',
    },
    requested_destination: target,
    effective_destination: target,
    total_distance: Number.parseInt(String(target?.distance || '80'), 10) || 80,
    estimated_time_seconds: Number.parseInt(String(target?.time || '2'), 10) * 60 || 120,
    nodes: routePoints.map((point) => ({
      code: point.id,
      label: point.label,
      floor: 'Piso Terreo',
      x: point.x,
      y: point.y,
    })),
    edges: [],
    steps: routePoints.map((point, index) => ({
      index: index + 1,
      instruction: point.instruction,
      distance: index === 0 ? 0 : 15,
      floor: 'Piso Terreo',
      node_code: point.id,
      type: 'CORRIDOR',
    })),
  };
};

export const normalizeRedirectDestination = (destination) => {
  if (!destination) return null;
  return normalizeDestination(destination);
};

export const localReceptionForArea = (area) => getReceptionDestination(area);

function defaultEntranceName(areaCode) {
  if (areaCode === 'sus') return 'Entrada pela Frente';
  if (areaCode === 'shared') return 'Recepcao mais proxima';
  return 'Entrada pelos Fundos';
}

function defaultEntry(areaCode) {
  if (areaCode === 'sus') return 'frente';
  if (areaCode === 'shared') return 'shared';
  return 'fundos';
}

function defaultEntryLabel(areaCode) {
  if (areaCode === 'sus') return 'Frente';
  if (areaCode === 'shared') return 'Compartilhado';
  return 'Fundos';
}

function secondsToLabel(seconds) {
  const minutes = Math.max(1, Math.ceil(Number(seconds || 0) / 60));
  return `${minutes} min`;
}

function getRouteDestinationNodeCode(activeRoute, nodes) {
  return activeRoute?.effectiveDestination?.navigationNodeCode ||
    activeRoute?.effectiveDestination?.navigation_node_code ||
    activeRoute?.effectiveDestination?.navigationNode?.code ||
    nodes[nodes.length - 1]?.code ||
    null;
}

function resolveRouteSteps(steps, { arrived, nextNodeCode }) {
  if (!steps.length || arrived) {
    return {
      currentStepIndex: null,
      currentStep: null,
      nextStepIndex: null,
      nextStep: null,
    };
  }

  const explicitIndex = nextNodeCode
    ? steps.findIndex((step) => step?.node_code === nextNodeCode)
    : -1;

  if (explicitIndex >= 0) {
    const nextIndex = findNextInstructionStepIndex(steps, explicitIndex + 1);
    return {
      currentStepIndex: explicitIndex,
      currentStep: steps[explicitIndex],
      nextStepIndex: nextIndex,
      nextStep: nextIndex !== null ? steps[nextIndex] : null,
    };
  }

  const fallbackIndex = steps.findIndex((step) => step?.type !== 'ARRIVAL');
  return {
    currentStepIndex: null,
    currentStep: fallbackIndex >= 0 ? steps[fallbackIndex] : null,
    nextStepIndex: null,
    nextStep: null,
  };
}

function findNextInstructionStepIndex(steps, startIndex) {
  const index = steps.findIndex((step, currentIndex) => currentIndex >= startIndex && step?.type !== 'ARRIVAL');
  return index >= 0 ? index : null;
}

function classifyRouteEdges(edges, nodes, currentNodeIndex, progressKnown, arrived) {
  const nodeIndexById = new Map(nodes.map((node, index) => [node?.id, index]));
  const traversedEdgeIds = [];
  const currentEdgeIds = [];
  const remainingEdgeIds = [];
  const edgeStatusByKey = {};

  edges.forEach((edge, index) => {
    const fromIndex = nodeIndexById.get(edge?.from_node_id ?? edge?.fromNodeId);
    const toIndex = nodeIndexById.get(edge?.to_node_id ?? edge?.toNodeId);
    const key = getEdgeKey(edge, index);
    if (!Number.isInteger(fromIndex) || !Number.isInteger(toIndex)) return;

    const status = getEdgeProgressStatus(fromIndex, toIndex, currentNodeIndex, progressKnown, arrived);
    edgeStatusByKey[key] = status;
    if (status === 'traversed') traversedEdgeIds.push(edge?.id || key);
    if (status === 'current') currentEdgeIds.push(edge?.id || key);
    if (status === 'remaining') remainingEdgeIds.push(edge?.id || key);
  });

  return {
    currentEdgeIds,
    traversedEdgeIds,
    remainingEdgeIds,
    edgeStatusByKey,
  };
}

function getEdgeProgressStatus(fromIndex, toIndex, currentNodeIndex, progressKnown, arrived) {
  if (!progressKnown) return 'remaining';
  const start = Math.min(fromIndex, toIndex);
  const end = Math.max(fromIndex, toIndex);
  if (arrived || end <= currentNodeIndex) return 'traversed';
  if (start <= currentNodeIndex && end === currentNodeIndex + 1) return 'current';
  return 'remaining';
}

function getEdgeKey(edge, index) {
  return edge?.id || `${edge?.from_node_id ?? edge?.fromNodeId}-${edge?.to_node_id ?? edge?.toNodeId}-${index}`;
}

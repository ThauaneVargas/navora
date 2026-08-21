const FALLBACK_FLOOR = 'Terreo';
const FALLBACK_DISTANCE = '-';

const metricCodeAliases = {
  'private-reception': 'Recepcao',
  'sus-reception': 'Recepcao',
  'private-imaging': 'Setor de Imagem',
  'private-laboratory': 'Laboratorio',
  'sus-laboratory': 'Laboratorio',
  'private-services': 'Banheiro',
  'sus-services': 'Banheiro',
  'shared-elevator': 'Elevador',
  'shared-exit': 'Saida / Emergencia',
  'shared-corridor': 'Corredor A',
};

const normalizeKey = (value) =>
  String(value || '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/\s+(private|sus|hospital marco capute)$/i, '');

function metricFallbacks(initialSectors) {
  const byCode = new Map();
  const byName = new Map();

  initialSectors.forEach((sector) => {
    if (sector.code) byCode.set(sector.code, sector);
    byName.set(normalizeKey(sector.name), sector);
  });

  Object.entries(metricCodeAliases).forEach(([code, name]) => {
    const sector = byName.get(normalizeKey(name));
    if (sector) byCode.set(code, sector);
  });

  return { byCode, byName };
}

export function normalizeSectorFromApi(sector) {
  return {
    id: sector.id,
    code: sector.code,
    name: sector.name || sector.code || 'Setor sem nome',
    floor: sector.floor || FALLBACK_FLOOR,
    serviceType: sector.service_type || sector.serviceType,
    areaId: sector.area_id || sector.areaId || sector.area?.id,
    areaCode: sector.area?.code || sector.area_code,
    areaName: sector.area?.label || sector.area?.name || sector.area_name,
    destinations: sector.destinations || [],
    navigationNodes: sector.navigationNodes || sector.navigation_nodes || [],
  };
}

export function applyLocalOperationalMetrics(sectors, initialSectors) {
  const fallbacks = metricFallbacks(initialSectors);

  return sectors.map((sector) => {
    const localMetrics =
      fallbacks.byCode.get(sector.code) ||
      fallbacks.byName.get(normalizeKey(sector.name)) ||
      {};

    return {
      ...sector,
      peopleCount: localMetrics.peopleCount ?? 0,
      flow: localMetrics.flow ?? 'Baixo',
      waitingTime: localMetrics.waitingTime ?? '0 min',
      status: localMetrics.status ?? 'Normal',
      externalAttendance: localMetrics.externalAttendance,
      externalPatientAccessWindow: localMetrics.externalPatientAccessWindow,
      operationalMetricsSource: localMetrics.id ? 'local-overlay' : 'local-default',
    };
  });
}

export function normalizeBeaconFromApi(beacon) {
  const lastSignal = beacon.last_signal_at ? new Date(beacon.last_signal_at) : null;

  return {
    id: beacon.code || beacon.id,
    code: beacon.code,
    name: beacon.name || beacon.code || 'Beacon sem nome',
    areaId: beacon.area,
    areaName: beacon.area_name || beacon.areaName,
    area: beacon.area_name || beacon.areaName || beacon.area,
    sector: beacon.sector || beacon.location || 'Nao informado',
    location: beacon.location || beacon.sector || 'Nao informado',
    floor: beacon.floor || FALLBACK_FLOOR,
    battery: beacon.battery ?? 0,
    status: beacon.status || 'Offline',
    lastSignal: lastSignal
      ? lastSignal.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
      : 'Nao informado',
    lastSignalAt: beacon.last_signal_at,
    distance: beacon.distance || FALLBACK_DISTANCE,
  };
}

export function normalizeAreaFromApi(area) {
  return {
    id: area.id,
    code: area.code,
    name: area.name || area.label || area.code || 'Area sem nome',
    label: area.label || area.name,
    description: area.description,
    entrances: (area.entrances || []).map((entrance) => ({
      id: entrance.id,
      code: entrance.code,
      name: entrance.name,
      entryKey: entrance.entry_key || entrance.entryKey,
      navigationNode: entrance.navigationNode || entrance.navigation_node,
    })),
  };
}

export function normalizeDestinationFromApi(destination) {
  return {
    id: destination.id,
    code: destination.code,
    name: destination.name || destination.code || 'Destino sem nome',
    category: destination.category || 'Servico',
    floor: destination.floor || FALLBACK_FLOOR,
    accessLevel: destination.access_level || destination.accessLevel,
    area: destination.area
      ? {
          id: destination.area.id,
          code: destination.area.code,
          name: destination.area.label || destination.area.name,
        }
      : null,
    sector: destination.sector
      ? {
          id: destination.sector.id,
          code: destination.sector.code,
          name: destination.sector.name,
        }
      : null,
    navigationNode: destination.navigationNode || destination.navigation_node || null,
  };
}

export function normalizeNavigationMapFromApi(map) {
  return {
    nodes: (map?.nodes || []).map((node) => ({
      id: node.id,
      code: node.code,
      label: node.label || node.code,
      type: node.type,
      floor: node.floor,
      x: node.x,
      y: node.y,
      z: node.z,
      instruction: node.instruction,
      area: node.area
        ? { id: node.area.id, code: node.area.code, name: node.area.label || node.area.name }
        : null,
      sector: node.sector
        ? { id: node.sector.id, code: node.sector.code, name: node.sector.name }
        : null,
      destinations: node.destinations || [],
      entrances: node.entrances || [],
    })),
    edges: (map?.edges || []).map((edge) => ({
      id: edge.id,
      fromNodeId: edge.from_node_id || edge.fromNodeId,
      toNodeId: edge.to_node_id || edge.toNodeId,
      distanceMeters: edge.distance_meters || edge.distanceMeters,
      accessible: !!edge.accessible,
      bidirectional: edge.bidirectional !== false,
      instruction: edge.instruction,
      fromNode: edge.fromNode,
      toNode: edge.toNode,
    })),
  };
}

export function fallbackAreasFromSectors(sectors) {
  const areaNames = [...new Set(sectors.map((sector) => sector.areaName).filter(Boolean))];
  return areaNames.map((name, index) => ({
    id: `fallback-area-${index + 1}`,
    code: normalizeKey(name).replaceAll(' ', '-'),
    name,
    label: name,
    description: 'Area local de demonstracao',
    entrances: [],
  }));
}

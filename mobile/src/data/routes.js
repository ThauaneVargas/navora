export const routePoints = [
  { id: 'p1', label: 'Recepcao', x: 28, y: 76, instruction: 'Saia da recepcao e siga pelo corredor principal.' },
  { id: 'p2', label: 'Corredor A', x: 46, y: 76, instruction: 'Continue em frente por 15 metros.' },
  { id: 'p3', label: 'Acesso Imagem', x: 46, y: 52, instruction: 'Vire a direita no corredor do Setor de Imagem.' },
  { id: 'p4', label: 'Imagem', x: 66, y: 52, instruction: 'Siga ate a placa de Diagnostico por Imagem.' },
  { id: 'p5', label: 'Tomografia', x: 78, y: 30, instruction: 'Voce chegou proximo a Tomografia.' },
];

export const currentLocation = {
  nome: 'Recepcao',
  setor: 'Entrada principal',
  beacon: 'MBM04-ENTRADA',
  precisao: '2,8 m',
};

export const hospitalAreas = [
  {
    id: 'private',
    name: 'HMC Private',
    hospitalId: 'hospital-demo-private',
    unitName: 'Unidade Private',
    address: 'Rua Ronaldo Fiuza Manhaes, no 1 - Centro, Vassouras - RJ',
    latitude: null,
    longitude: null,
    entranceName: 'Entrada pelos Fundos',
    entry: 'fundos',
    entryLabel: 'Fundos',
    label: 'Private',
    description: 'Rotas e setores do atendimento particular/convenio.',
  },
  {
    id: 'sus',
    name: 'Hospital Marco Capute',
    hospitalId: 'hospital-demo-sus',
    unitName: 'Unidade Hospitalar',
    address: 'Rua Ronaldo Fiuza Manhaes, no 1 - Centro, Vassouras - RJ',
    latitude: null,
    longitude: null,
    entranceName: 'Entrada pela Frente',
    entry: 'frente',
    entryLabel: 'Frente',
    label: 'SUS',
    description: 'Rotas e setores do atendimento SUS.',
  },
];

export const getAreaById = (areaId = 'private') =>
  hospitalAreas.find((area) => area.id === areaId) || hospitalAreas[0];

export const hospitalName = 'Hospital Marcos Capute';

export const entranceMetadata = {
  PRIVATE_BACK: {
    id: 'private-back',
    code: 'PRIVATE_BACK',
    name: 'Private - Fundos',
    fullName: 'Entrada Private - Fundos',
    hospitalArea: 'PRIVATE',
    areaId: 'private',
    beaconCodes: ['MBM04-01'],
  },
  SUS_FRONT: {
    id: 'sus-front',
    code: 'SUS_FRONT',
    name: 'SUS - Frente',
    fullName: 'Entrada SUS - Frente',
    hospitalArea: 'SUS',
    areaId: 'sus',
    beaconCodes: ['MBM04-10'],
  },
};

export const entrances = Object.values(entranceMetadata);

export const getEntranceByAreaId = (areaId = 'private') =>
  entrances.find((entrance) => entrance.areaId === areaId) || entranceMetadata.PRIVATE_BACK;

export const getEntranceByBeaconCode = (beaconCode) =>
  entrances.find((entrance) => entrance.beaconCodes.includes(beaconCode)) || null;

export const getHospitalEnvironment = (areaId = 'private', detection = {}) => {
  const area = getAreaById(areaId);
  const entrance = detection.detectedEntrance || getEntranceByAreaId(area.id);
  return {
    id: area.hospitalId || area.id,
    name: hospitalName,
    unitName: area.unitName,
    latitude: area.latitude,
    longitude: area.longitude,
    address: area.address,
    entrances: [
      {
        id: entrance.id,
        code: entrance.code,
        name: entrance.fullName,
        label: entrance.name,
        beaconCode: detection.beacon_code || detection.beaconCode || null,
      },
    ],
    floors: [...new Set(destinations.filter((destination) => destination.area === area.id).map((destination) => destination.floor).filter(Boolean))],
    activeAreaId: area.id,
  };
};

export const externalExamAccessWindow = {
  start: '07:00',
  end: '17:00',
  label: '07h as 17h',
};

const toMinutes = (time) => {
  const [hours = 0, minutes = 0] = String(time).split(':').map(Number);
  return hours * 60 + minutes;
};

const getCurrentMinutes = (date = new Date()) => date.getHours() * 60 + date.getMinutes();

export const isWithinExternalExamAccessWindow = (date = new Date()) => {
  const current = getCurrentMinutes(date);
  return current >= toMinutes(externalExamAccessWindow.start) && current <= toMinutes(externalExamAccessWindow.end);
};

export const isExternalExamDestination = (destination) =>
  Boolean(destination?.externalPatientAccess);

export const getExternalExamAccessStatus = (destination, date = new Date()) => {
  if (!isExternalExamDestination(destination)) {
    return { controlled: false, allowed: true, label: '' };
  }

  const allowed = isWithinExternalExamAccessWindow(date);
  return {
    controlled: true,
    allowed,
    label: `Atendimento externo: ${externalExamAccessWindow.label}`,
  };
};

export const destinations = [
  { id: 'private-reception', icon: 'desk', name: 'Recepcao Private', area: 'private', category: 'Servicos', floor: 'Piso Terreo', distance: '40 m', time: '1 min', accessLevel: 'public' },
  { id: 'private-imagem', icon: 'radiology-box-outline', name: 'Setor de Imagem Private', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '120 m', time: '2 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-tomografia', icon: 'scanner', name: 'Tomografia', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '140 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-raiox', icon: 'radiology-box', name: 'Raio-X', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '125 m', time: '2 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-mamografia', icon: 'human-female', name: 'Mamografia', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '160 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-ultrassonografia', icon: 'monitor-screenshot', name: 'Ultrassonografia', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '150 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-laboratorio', icon: 'flask-outline', name: 'Laboratorio Private', area: 'private', category: 'Exames', floor: 'Piso Terreo', distance: '135 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'private-bathroom', icon: 'toilet', name: 'Banheiro Private', area: 'private', category: 'Servicos', floor: 'Piso Terreo', distance: '65 m', time: '1 min', accessLevel: 'visitor_allowed' },
  { id: 'private-waiting', icon: 'seat-outline', name: 'Sala de espera Private', area: 'private', category: 'Servicos', floor: 'Piso Terreo', distance: '75 m', time: '1 min', accessLevel: 'visitor_allowed' },
  { id: 'private-exit', icon: 'exit-run', name: 'Saida Private', area: 'private', category: 'Servicos', floor: 'Piso Terreo', distance: '90 m', time: '2 min', accessLevel: 'public' },
  { id: 'private-visita', icon: 'account-heart-outline', name: 'Visita / Internacao Private', area: 'private', category: 'Visita', floor: '1o Andar', distance: '210 m', time: '4 min', accessLevel: 'visitor_authorization' },
  { id: 'sus-reception', icon: 'desk', name: 'Recepcao Hospital Marco Capute', area: 'sus', category: 'Servicos', floor: 'Piso Terreo', distance: '35 m', time: '1 min', accessLevel: 'public' },
  { id: 'sus-atendimento', icon: 'stethoscope', name: 'Atendimento SUS', area: 'sus', category: 'Atendimento', floor: 'Piso Terreo', distance: '110 m', time: '2 min', accessLevel: 'patient' },
  { id: 'sus-laboratorio', icon: 'flask-outline', name: 'Laboratorio SUS', area: 'sus', category: 'Exames', floor: 'Piso Terreo', distance: '150 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'sus-exame-sangue', icon: 'test-tube', name: 'Exame de sangue', area: 'sus', category: 'Exames', floor: 'Piso Terreo', distance: '155 m', time: '3 min', accessLevel: 'patient', externalPatientAccess: true },
  { id: 'sus-bathroom', icon: 'toilet', name: 'Banheiro SUS', area: 'sus', category: 'Servicos', floor: 'Piso Terreo', distance: '70 m', time: '1 min', accessLevel: 'visitor_allowed' },
  { id: 'sus-waiting', icon: 'seat-outline', name: 'Sala de espera SUS', area: 'sus', category: 'Servicos', floor: 'Piso Terreo', distance: '80 m', time: '1 min', accessLevel: 'visitor_allowed' },
  { id: 'sus-exit', icon: 'exit-run', name: 'Saida SUS', area: 'sus', category: 'Servicos', floor: 'Piso Terreo', distance: '95 m', time: '2 min', accessLevel: 'public' },
  { id: 'sus-visita', icon: 'account-heart-outline', name: 'Visita / Internacao Hospital Marco Capute', area: 'sus', category: 'Visita', floor: '1o Andar', distance: '220 m', time: '4 min', accessLevel: 'visitor_authorization' },
  { id: 'shared-lost', icon: 'map-marker-question-outline', name: 'Recepcao mais proxima', area: 'shared', category: 'Servicos', floor: 'Piso Terreo', distance: '50 m', time: '1 min', accessLevel: 'public' },
  { id: 'centro-cirurgico', icon: 'lock-alert-outline', name: 'Centro Cirurgico', area: 'restricted', category: 'Restrito', floor: '1o Andar', distance: '240 m', time: '5 min', accessLevel: 'restricted' },
];

export const visitorReasons = [
  'Visitar paciente',
  'Acompanhar paciente',
  'Ir a recepcao',
  'Buscar informacoes',
  'Outro',
];

export const canAccessDestination = (destination, userProfile = {}) => {
  if (!destination || destination.accessLevel === 'restricted') return false;
  const userArea = userProfile.area || 'private';
  const userType = userProfile.type || 'patient';
  const allowedArea = destination.area === userArea || destination.area === 'shared';
  if (!allowedArea) return false;

  if (userType === 'visitor') {
    return ['public', 'visitor_allowed', 'visitor_authorization'].includes(destination.accessLevel);
  }

  return ['public', 'patient', 'visitor_allowed'].includes(destination.accessLevel);
};

export const getReceptionDestination = (area = 'private') =>
  destinations.find((destination) => destination.id === `${area}-reception`) ||
  destinations.find((destination) => destination.id === 'shared-lost');

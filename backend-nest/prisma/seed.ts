import {
  AccessDecision,
  AccessRuleScope,
  AccessSubject,
  PrismaClient,
  CallStatus,
  CallType,
  CheckInStatus,
  NavigationNodeType,
  Priority,
  RouteType,
  UserRole,
  VisitorAccessStatus,
} from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();
const demoPassword = 'navora-demo-123';

const areaSeeds = [
  { code: 'private', name: 'HMC Private', label: 'Private', description: 'Rotas e setores do atendimento particular/convenio.' },
  { code: 'sus', name: 'Hospital Marco Capute', label: 'SUS', description: 'Rotas e setores do atendimento SUS.' },
  { code: 'shared', name: 'Compartilhado', label: 'Compartilhado', description: 'Areas comuns e rotas de apoio.' },
  { code: 'restricted', name: 'Area restrita', label: 'Restrito', description: 'Destinos de acesso controlado.' },
];

const sectorSeeds = [
  { code: 'private-reception', name: 'Recepcao Private', floor: 'Piso Terreo', serviceType: 'Servicos', areaCode: 'private' },
  { code: 'private-imaging', name: 'Setor de Imagem Private', floor: 'Piso Terreo', serviceType: 'Exames', areaCode: 'private' },
  { code: 'private-laboratory', name: 'Laboratorio Private', floor: 'Piso Terreo', serviceType: 'Exames', areaCode: 'private' },
  { code: 'private-services', name: 'Servicos Private', floor: 'Piso Terreo', serviceType: 'Servicos', areaCode: 'private' },
  { code: 'private-visit', name: 'Visita / Internacao Private', floor: '1o Andar', serviceType: 'Visita', areaCode: 'private' },
  { code: 'sus-reception', name: 'Recepcao Hospital Marco Capute', floor: 'Piso Terreo', serviceType: 'Servicos', areaCode: 'sus' },
  { code: 'sus-care', name: 'Atendimento SUS', floor: 'Piso Terreo', serviceType: 'Atendimento', areaCode: 'sus' },
  { code: 'sus-laboratory', name: 'Laboratorio SUS', floor: 'Piso Terreo', serviceType: 'Exames', areaCode: 'sus' },
  { code: 'sus-services', name: 'Servicos SUS', floor: 'Piso Terreo', serviceType: 'Servicos', areaCode: 'sus' },
  { code: 'sus-visit', name: 'Visita / Internacao Hospital Marco Capute', floor: '1o Andar', serviceType: 'Visita', areaCode: 'sus' },
  { code: 'shared-corridor', name: 'Corredor compartilhado', floor: 'Piso Terreo', serviceType: 'Circulacao', areaCode: 'shared' },
  { code: 'shared-elevator', name: 'Elevador', floor: '1o Andar', serviceType: 'Circulacao', areaCode: 'shared' },
  { code: 'shared-exit', name: 'Saida / Emergencia', floor: 'Piso Terreo', serviceType: 'Emergencia', areaCode: 'shared' },
  { code: 'restricted-surgery', name: 'Centro Cirurgico', floor: '1o Andar', serviceType: 'Restrito', areaCode: 'restricted' },
];

const nodeSeeds = [
  { code: 'private-entry', label: 'Entrada Private', type: NavigationNodeType.ENTRANCE, floor: 'Piso Terreo', x: 18, y: 82, z: 0, areaCode: 'private', sectorCode: 'private-reception', instruction: 'Entrada pelos fundos.' },
  { code: 'private-reception', label: 'Recepcao Private', type: NavigationNodeType.RECEPTION, floor: 'Piso Terreo', x: 28, y: 76, z: 0, areaCode: 'private', sectorCode: 'private-reception', instruction: 'Saia da recepcao e siga pelo corredor principal.' },
  { code: 'corridor-a', label: 'Corredor A', type: NavigationNodeType.CORRIDOR, floor: 'Piso Terreo', x: 46, y: 76, z: 0, areaCode: 'shared', sectorCode: 'shared-corridor', instruction: 'Continue em frente por 15 metros.' },
  { code: 'imaging-access', label: 'Acesso Imagem', type: NavigationNodeType.CORRIDOR, floor: 'Piso Terreo', x: 46, y: 52, z: 0, areaCode: 'private', sectorCode: 'private-imaging', instruction: 'Vire a direita no corredor do Setor de Imagem.' },
  { code: 'private-imaging', label: 'Setor de Imagem Private', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 66, y: 52, z: 0, areaCode: 'private', sectorCode: 'private-imaging', instruction: 'Siga ate a placa de Diagnostico por Imagem.' },
  { code: 'private-tomography', label: 'Tomografia', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 78, y: 30, z: 0, areaCode: 'private', sectorCode: 'private-imaging', instruction: 'Voce chegou proximo a Tomografia.' },
  { code: 'private-xray', label: 'Raio-X', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 72, y: 42, z: 0, areaCode: 'private', sectorCode: 'private-imaging' },
  { code: 'private-mammography', label: 'Mamografia', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 74, y: 48, z: 0, areaCode: 'private', sectorCode: 'private-imaging' },
  { code: 'private-ultrasound', label: 'Ultrassonografia', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 70, y: 56, z: 0, areaCode: 'private', sectorCode: 'private-imaging' },
  { code: 'private-laboratory', label: 'Laboratorio Private', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 58, y: 68, z: 0, areaCode: 'private', sectorCode: 'private-laboratory' },
  { code: 'private-bathroom', label: 'Banheiro Private', type: NavigationNodeType.BATHROOM, floor: 'Piso Terreo', x: 34, y: 36, z: 0, areaCode: 'private', sectorCode: 'private-services' },
  { code: 'private-waiting', label: 'Sala de espera Private', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 36, y: 72, z: 0, areaCode: 'private', sectorCode: 'private-services' },
  { code: 'private-exit', label: 'Saida Private', type: NavigationNodeType.EXIT, floor: 'Piso Terreo', x: 85, y: 70, z: 0, areaCode: 'private', sectorCode: 'shared-exit' },
  { code: 'private-visit', label: 'Visita / Internacao Private', type: NavigationNodeType.ROOM, floor: '1o Andar', x: 82, y: 24, z: 1, areaCode: 'private', sectorCode: 'private-visit' },
  { code: 'sus-entry', label: 'Entrada Hospital Marco Capute', type: NavigationNodeType.ENTRANCE, floor: 'Piso Terreo', x: 12, y: 84, z: 0, areaCode: 'sus', sectorCode: 'sus-reception', instruction: 'Entrada pela frente.' },
  { code: 'sus-reception', label: 'Recepcao Hospital Marco Capute', type: NavigationNodeType.RECEPTION, floor: 'Piso Terreo', x: 24, y: 78, z: 0, areaCode: 'sus', sectorCode: 'sus-reception' },
  { code: 'sus-care', label: 'Atendimento SUS', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 48, y: 70, z: 0, areaCode: 'sus', sectorCode: 'sus-care' },
  { code: 'sus-laboratory', label: 'Laboratorio SUS', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 60, y: 66, z: 0, areaCode: 'sus', sectorCode: 'sus-laboratory' },
  { code: 'sus-blood-test', label: 'Exame de sangue', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 64, y: 62, z: 0, areaCode: 'sus', sectorCode: 'sus-laboratory' },
  { code: 'sus-bathroom', label: 'Banheiro SUS', type: NavigationNodeType.BATHROOM, floor: 'Piso Terreo', x: 32, y: 42, z: 0, areaCode: 'sus', sectorCode: 'sus-services' },
  { code: 'sus-waiting', label: 'Sala de espera SUS', type: NavigationNodeType.ROOM, floor: 'Piso Terreo', x: 34, y: 74, z: 0, areaCode: 'sus', sectorCode: 'sus-services' },
  { code: 'sus-exit', label: 'Saida SUS', type: NavigationNodeType.EXIT, floor: 'Piso Terreo', x: 88, y: 72, z: 0, areaCode: 'sus', sectorCode: 'shared-exit' },
  { code: 'sus-visit', label: 'Visita / Internacao Hospital Marco Capute', type: NavigationNodeType.ROOM, floor: '1o Andar', x: 84, y: 28, z: 1, areaCode: 'sus', sectorCode: 'sus-visit' },
  { code: 'nearest-reception', label: 'Recepcao mais proxima', type: NavigationNodeType.RECEPTION, floor: 'Piso Terreo', x: 26, y: 76, z: 0, areaCode: 'shared', sectorCode: 'shared-corridor' },
  { code: 'surgery-center', label: 'Centro Cirurgico', type: NavigationNodeType.ROOM, floor: '1o Andar', x: 90, y: 22, z: 1, areaCode: 'restricted', sectorCode: 'restricted-surgery' },
];

const entranceSeeds = [
  { code: 'private-back-entry', name: 'Entrada pelos Fundos', entryKey: 'fundos', areaCode: 'private', nodeCode: 'private-entry' },
  { code: 'sus-front-entry', name: 'Entrada pela Frente', entryKey: 'frente', areaCode: 'sus', nodeCode: 'sus-entry' },
];

const edgeSeeds = [
  { from: 'private-entry', to: 'private-reception', distanceMeters: 40, accessible: true, instruction: 'Siga da entrada pelos fundos ate a Recepcao Private.' },
  { from: 'private-reception', to: 'corridor-a', distanceMeters: 18, accessible: true, instruction: 'Siga pelo corredor principal.' },
  { from: 'corridor-a', to: 'imaging-access', distanceMeters: 15, accessible: true, instruction: 'Continue pelo Corredor A.' },
  { from: 'imaging-access', to: 'private-imaging', distanceMeters: 20, accessible: true, instruction: 'Entre no Setor de Imagem.' },
  { from: 'private-imaging', to: 'private-tomography', distanceMeters: 20, accessible: true },
  { from: 'private-imaging', to: 'private-xray', distanceMeters: 12, accessible: true },
  { from: 'private-imaging', to: 'private-mammography', distanceMeters: 16, accessible: true },
  { from: 'private-imaging', to: 'private-ultrasound', distanceMeters: 15, accessible: true },
  { from: 'corridor-a', to: 'private-laboratory', distanceMeters: 18, accessible: true },
  { from: 'corridor-a', to: 'private-bathroom', distanceMeters: 12, accessible: true },
  { from: 'private-reception', to: 'private-waiting', distanceMeters: 10, accessible: true },
  { from: 'corridor-a', to: 'private-exit', distanceMeters: 28, accessible: true },
  { from: 'corridor-a', to: 'private-visit', distanceMeters: 80, accessible: true, instruction: 'Use o elevador para acessar internacao Private.' },
  { from: 'sus-entry', to: 'sus-reception', distanceMeters: 35, accessible: true, instruction: 'Siga da entrada pela frente ate a recepcao.' },
  { from: 'sus-reception', to: 'sus-care', distanceMeters: 110, accessible: true },
  { from: 'sus-reception', to: 'sus-laboratory', distanceMeters: 150, accessible: true },
  { from: 'sus-laboratory', to: 'sus-blood-test', distanceMeters: 5, accessible: true },
  { from: 'sus-reception', to: 'sus-bathroom', distanceMeters: 70, accessible: true },
  { from: 'sus-reception', to: 'sus-waiting', distanceMeters: 80, accessible: true },
  { from: 'sus-reception', to: 'sus-exit', distanceMeters: 95, accessible: true },
  { from: 'sus-reception', to: 'sus-visit', distanceMeters: 220, accessible: true, instruction: 'Use o elevador para acessar internacao SUS.' },
  { from: 'nearest-reception', to: 'private-reception', distanceMeters: 50, accessible: true },
  { from: 'nearest-reception', to: 'sus-reception', distanceMeters: 50, accessible: true },
];

function routeTypeForSeedEdge(edge: { from: string; to: string }) {
  if (edge.from === 'corridor-a' && edge.to === 'private-visit') return RouteType.ELEVATOR;
  if (edge.from === 'sus-reception' && edge.to === 'sus-visit') return RouteType.ELEVATOR;
  return RouteType.CORRIDOR;
}

const destinationSeeds = [
  { code: 'private-reception', icon: 'desk', name: 'Recepcao Private', areaCode: 'private', sectorCode: 'private-reception', nodeCode: 'private-reception', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '40 m', timeLabel: '1 min', accessLevel: 'public' },
  { code: 'private-imagem', icon: 'radiology-box-outline', name: 'Setor de Imagem Private', areaCode: 'private', sectorCode: 'private-imaging', nodeCode: 'private-imaging', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '120 m', timeLabel: '2 min', accessLevel: 'patient' },
  { code: 'private-tomografia', icon: 'scanner', name: 'Tomografia', areaCode: 'private', sectorCode: 'private-imaging', nodeCode: 'private-tomography', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '140 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'private-raiox', icon: 'radiology-box', name: 'Raio-X', areaCode: 'private', sectorCode: 'private-imaging', nodeCode: 'private-xray', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '125 m', timeLabel: '2 min', accessLevel: 'patient' },
  { code: 'private-mamografia', icon: 'human-female', name: 'Mamografia', areaCode: 'private', sectorCode: 'private-imaging', nodeCode: 'private-mammography', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '160 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'private-ultrassonografia', icon: 'monitor-screenshot', name: 'Ultrassonografia', areaCode: 'private', sectorCode: 'private-imaging', nodeCode: 'private-ultrasound', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '150 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'private-laboratorio', icon: 'flask-outline', name: 'Laboratorio Private', areaCode: 'private', sectorCode: 'private-laboratory', nodeCode: 'private-laboratory', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '135 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'private-bathroom', icon: 'toilet', name: 'Banheiro Private', areaCode: 'private', sectorCode: 'private-services', nodeCode: 'private-bathroom', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '65 m', timeLabel: '1 min', accessLevel: 'visitor_allowed' },
  { code: 'private-waiting', icon: 'seat-outline', name: 'Sala de espera Private', areaCode: 'private', sectorCode: 'private-services', nodeCode: 'private-waiting', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '75 m', timeLabel: '1 min', accessLevel: 'visitor_allowed' },
  { code: 'private-exit', icon: 'exit-run', name: 'Saida Private', areaCode: 'private', sectorCode: 'shared-exit', nodeCode: 'private-exit', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '90 m', timeLabel: '2 min', accessLevel: 'public' },
  { code: 'private-visita', icon: 'account-heart-outline', name: 'Visita / Internacao Private', areaCode: 'private', sectorCode: 'private-visit', nodeCode: 'private-visit', category: 'Visita', floor: '1o Andar', distanceLabel: '210 m', timeLabel: '4 min', accessLevel: 'visitor_authorization' },
  { code: 'sus-reception', icon: 'desk', name: 'Recepcao Hospital Marco Capute', areaCode: 'sus', sectorCode: 'sus-reception', nodeCode: 'sus-reception', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '35 m', timeLabel: '1 min', accessLevel: 'public' },
  { code: 'sus-atendimento', icon: 'stethoscope', name: 'Atendimento SUS', areaCode: 'sus', sectorCode: 'sus-care', nodeCode: 'sus-care', category: 'Atendimento', floor: 'Piso Terreo', distanceLabel: '110 m', timeLabel: '2 min', accessLevel: 'patient' },
  { code: 'sus-laboratorio', icon: 'flask-outline', name: 'Laboratorio SUS', areaCode: 'sus', sectorCode: 'sus-laboratory', nodeCode: 'sus-laboratory', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '150 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'sus-exame-sangue', icon: 'test-tube', name: 'Exame de sangue', areaCode: 'sus', sectorCode: 'sus-laboratory', nodeCode: 'sus-blood-test', category: 'Exames', floor: 'Piso Terreo', distanceLabel: '155 m', timeLabel: '3 min', accessLevel: 'patient' },
  { code: 'sus-bathroom', icon: 'toilet', name: 'Banheiro SUS', areaCode: 'sus', sectorCode: 'sus-services', nodeCode: 'sus-bathroom', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '70 m', timeLabel: '1 min', accessLevel: 'visitor_allowed' },
  { code: 'sus-waiting', icon: 'seat-outline', name: 'Sala de espera SUS', areaCode: 'sus', sectorCode: 'sus-services', nodeCode: 'sus-waiting', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '80 m', timeLabel: '1 min', accessLevel: 'visitor_allowed' },
  { code: 'sus-exit', icon: 'exit-run', name: 'Saida SUS', areaCode: 'sus', sectorCode: 'shared-exit', nodeCode: 'sus-exit', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '95 m', timeLabel: '2 min', accessLevel: 'public' },
  { code: 'sus-visita', icon: 'account-heart-outline', name: 'Visita / Internacao Hospital Marco Capute', areaCode: 'sus', sectorCode: 'sus-visit', nodeCode: 'sus-visit', category: 'Visita', floor: '1o Andar', distanceLabel: '220 m', timeLabel: '4 min', accessLevel: 'visitor_authorization' },
  { code: 'shared-lost', icon: 'map-marker-question-outline', name: 'Recepcao mais proxima', areaCode: 'shared', sectorCode: 'shared-corridor', nodeCode: 'nearest-reception', category: 'Servicos', floor: 'Piso Terreo', distanceLabel: '50 m', timeLabel: '1 min', accessLevel: 'public' },
  { code: 'centro-cirurgico', icon: 'lock-alert-outline', name: 'Centro Cirurgico', areaCode: 'restricted', sectorCode: 'restricted-surgery', nodeCode: 'surgery-center', category: 'Restrito', floor: '1o Andar', distanceLabel: '240 m', timeLabel: '5 min', accessLevel: 'restricted' },
];

async function upsertDemoUser(data: {
  email: string;
  name: string;
  role: UserRole;
  phone?: string;
  jobTitle?: string;
  sectorId?: number;
}) {
  const passwordHash = await bcrypt.hash(demoPassword, 10);
  const user = await prisma.user.upsert({
    where: { email: data.email },
    update: {
      name: data.name,
      phone: data.phone,
      role: data.role,
      active: true,
    },
    create: {
      email: data.email,
      passwordHash,
      name: data.name,
      phone: data.phone,
      role: data.role,
      active: true,
    },
    select: { id: true, role: true },
  });

  if (data.role === UserRole.ADMIN || data.role === UserRole.RECEPTION) {
    await prisma.staffProfile.upsert({
      where: { userId: user.id },
      update: {
        jobTitle: data.jobTitle,
        sectorId: data.sectorId,
        active: true,
      },
      create: {
        userId: user.id,
        jobTitle: data.jobTitle,
        sectorId: data.sectorId,
        active: true,
      },
    });
  }

  if (data.role === UserRole.PATIENT) {
    await prisma.patientProfile.upsert({
      where: { userId: user.id },
      update: {
        accessibility: {
          avoidStairs: true,
          preferElevator: true,
          voiceGuidance: true,
        },
      },
      create: {
        userId: user.id,
        patientCode: 'PAT-DEMO-001',
        accessibility: {
          avoidStairs: true,
          preferElevator: true,
          voiceGuidance: true,
        },
      },
    });
  }
}

async function main() {
  const areas = new Map<string, { id: number }>();
  for (const area of areaSeeds) {
    const saved = await prisma.hospitalArea.upsert({
      where: { code: area.code },
      update: area,
      create: area,
      select: { id: true, code: true },
    });
    areas.set(saved.code, saved);
  }

  const sectors = new Map<string, { id: number }>();
  for (const sector of sectorSeeds) {
    const area = areas.get(sector.areaCode);
    const saved = await prisma.sector.upsert({
      where: { code: sector.code },
      update: {
        name: sector.name,
        floor: sector.floor,
        serviceType: sector.serviceType,
        areaId: area?.id,
      },
      create: {
        code: sector.code,
        name: sector.name,
        floor: sector.floor,
        serviceType: sector.serviceType,
        areaId: area?.id,
      },
      select: { id: true, code: true },
    });
    sectors.set(saved.code, saved);
  }

  await upsertDemoUser({
    email: 'admin@navora.com',
    name: 'Amanda Souza',
    role: UserRole.ADMIN,
    jobTitle: 'Administradora Navora',
    sectorId: sectors.get('private-reception')?.id,
  });
  await upsertDemoUser({
    email: 'recepcao@navora.com',
    name: 'Juliana Lima',
    role: UserRole.RECEPTION,
    jobTitle: 'Recepcao',
    sectorId: sectors.get('sus-reception')?.id,
  });
  await upsertDemoUser({
    email: 'paciente@navora.com',
    name: 'Paciente Demo',
    role: UserRole.PATIENT,
    phone: '+5500000000000',
  });

  const nodes = new Map<string, { id: number }>();
  for (const node of nodeSeeds) {
    const area = areas.get(node.areaCode);
    const sector = sectors.get(node.sectorCode);
    const saved = await prisma.navigationNode.upsert({
      where: { code: node.code },
      update: {
        label: node.label,
        type: node.type,
        floor: node.floor,
        x: node.x,
        y: node.y,
        z: node.z,
        instruction: node.instruction,
        areaId: area?.id,
        sectorId: sector?.id,
      },
      create: {
        code: node.code,
        label: node.label,
        type: node.type,
        floor: node.floor,
        x: node.x,
        y: node.y,
        z: node.z,
        instruction: node.instruction,
        areaId: area?.id,
        sectorId: sector?.id,
      },
      select: { id: true, code: true },
    });
    nodes.set(saved.code, saved);
  }

  for (const entrance of entranceSeeds) {
    const area = areas.get(entrance.areaCode);
    const node = nodes.get(entrance.nodeCode);
    if (!area) continue;
    await prisma.entrance.upsert({
      where: { code: entrance.code },
      update: {
        name: entrance.name,
        entryKey: entrance.entryKey,
        areaId: area.id,
        navigationNodeId: node?.id,
      },
      create: {
        code: entrance.code,
        name: entrance.name,
        entryKey: entrance.entryKey,
        areaId: area.id,
        navigationNodeId: node?.id,
      },
    });
  }

  for (const edge of edgeSeeds) {
    const fromNode = nodes.get(edge.from);
    const toNode = nodes.get(edge.to);
    if (!fromNode || !toNode) continue;
    await prisma.routeEdge.upsert({
      where: {
        fromNodeId_toNodeId: {
          fromNodeId: fromNode.id,
          toNodeId: toNode.id,
        },
      },
      update: {
        distanceMeters: edge.distanceMeters,
        accessible: edge.accessible,
        routeType: routeTypeForSeedEdge(edge),
        wheelchairAccessible: true,
        stretcherAccessible: true,
        bidirectional: true,
        instruction: edge.instruction,
      },
      create: {
        fromNodeId: fromNode.id,
        toNodeId: toNode.id,
        distanceMeters: edge.distanceMeters,
        accessible: edge.accessible,
        routeType: routeTypeForSeedEdge(edge),
        wheelchairAccessible: true,
        stretcherAccessible: true,
        bidirectional: true,
        instruction: edge.instruction,
      },
    });
  }

  const destinations = new Map<string, { id: number; code: string }>();
  for (const destination of destinationSeeds) {
    const area = areas.get(destination.areaCode);
    const sector = sectors.get(destination.sectorCode);
    const node = nodes.get(destination.nodeCode);
    const saved = await prisma.destination.upsert({
      where: { code: destination.code },
      update: {
        name: destination.name,
        icon: destination.icon,
        category: destination.category,
        floor: destination.floor,
        distanceLabel: destination.distanceLabel,
        timeLabel: destination.timeLabel,
        accessLevel: destination.accessLevel,
        areaId: area?.id,
        sectorId: sector?.id,
        navigationNodeId: node?.id,
      },
      create: {
        code: destination.code,
        name: destination.name,
        icon: destination.icon,
        category: destination.category,
        floor: destination.floor,
        distanceLabel: destination.distanceLabel,
        timeLabel: destination.timeLabel,
        accessLevel: destination.accessLevel,
        areaId: area?.id,
        sectorId: sector?.id,
        navigationNodeId: node?.id,
      },
      select: { id: true, code: true },
    });
    destinations.set(saved.code, saved);
  }

  const upsertAccessRule = async (rule: {
    code: string;
    name: string;
    subject: AccessSubject;
    scope: AccessRuleScope;
    priority: number;
    decision?: AccessDecision;
    message?: string;
    areaCode?: string;
    sectorCode?: string;
    destinationCode?: string;
    fallbackDestinationCode?: string;
    category?: string;
    accessLevel?: string;
  }) => {
    const area = rule.areaCode ? areas.get(rule.areaCode) : undefined;
    const sector = rule.sectorCode ? sectors.get(rule.sectorCode) : undefined;
    const destination = rule.destinationCode ? destinations.get(rule.destinationCode) : undefined;
    const fallbackDestination = rule.fallbackDestinationCode ? destinations.get(rule.fallbackDestinationCode) : undefined;

    return prisma.accessRule.upsert({
      where: { code: rule.code },
      update: {
        name: rule.name,
        enabled: true,
        subject: rule.subject,
        scope: rule.scope,
        priority: rule.priority,
        decision: rule.decision,
        message: rule.message,
        areaId: area?.id,
        sectorId: sector?.id,
        destinationId: destination?.id,
        fallbackDestinationId: fallbackDestination?.id,
        category: rule.category,
        accessLevel: rule.accessLevel,
      },
      create: {
        code: rule.code,
        name: rule.name,
        enabled: true,
        subject: rule.subject,
        scope: rule.scope,
        priority: rule.priority,
        decision: rule.decision,
        message: rule.message,
        areaId: area?.id,
        sectorId: sector?.id,
        destinationId: destination?.id,
        fallbackDestinationId: fallbackDestination?.id,
        category: rule.category,
        accessLevel: rule.accessLevel,
      },
      select: { id: true, code: true },
    });
  };

  const accessLevelRules = [
    { code: 'public-patient', name: 'Destinos publicos para pacientes', subject: AccessSubject.PATIENT, accessLevel: 'public', decision: AccessDecision.ALLOW },
    { code: 'public-visitor', name: 'Destinos publicos para visitantes', subject: AccessSubject.VISITOR, accessLevel: 'public', decision: AccessDecision.ALLOW },
    { code: 'public-external-patient', name: 'Destinos publicos para pacientes externos', subject: AccessSubject.EXTERNAL_PATIENT, accessLevel: 'public', decision: AccessDecision.ALLOW },
    { code: 'patient-patient', name: 'Destinos de paciente para pacientes', subject: AccessSubject.PATIENT, accessLevel: 'patient', decision: AccessDecision.ALLOW },
    { code: 'patient-external-patient', name: 'Destinos de paciente para pacientes externos', subject: AccessSubject.EXTERNAL_PATIENT, accessLevel: 'patient', decision: AccessDecision.ALLOW },
    { code: 'visitor-allowed-patient', name: 'Destinos liberados a visitantes para pacientes', subject: AccessSubject.PATIENT, accessLevel: 'visitor_allowed', decision: AccessDecision.ALLOW },
    { code: 'visitor-allowed-visitor', name: 'Destinos liberados a visitantes', subject: AccessSubject.VISITOR, accessLevel: 'visitor_allowed', decision: AccessDecision.ALLOW },
    { code: 'visitor-allowed-external-patient', name: 'Destinos liberados a visitantes para pacientes externos', subject: AccessSubject.EXTERNAL_PATIENT, accessLevel: 'visitor_allowed', decision: AccessDecision.ALLOW },
    { code: 'visitor-authorization-visitor', name: 'Destinos de visitante com autorizacao', subject: AccessSubject.VISITOR, accessLevel: 'visitor_authorization', decision: AccessDecision.REQUIRE_AUTHORIZATION, message: 'Este destino precisa de autorizacao da recepcao.' },
    { code: 'restricted-patient', name: 'Destinos restritos para pacientes', subject: AccessSubject.PATIENT, accessLevel: 'restricted', decision: AccessDecision.BLOCK },
    { code: 'restricted-visitor', name: 'Destinos restritos para visitantes', subject: AccessSubject.VISITOR, accessLevel: 'restricted', decision: AccessDecision.BLOCK },
    { code: 'restricted-external-patient', name: 'Destinos restritos para pacientes externos', subject: AccessSubject.EXTERNAL_PATIENT, accessLevel: 'restricted', decision: AccessDecision.BLOCK },
  ];

  for (const rule of accessLevelRules) {
    await upsertAccessRule({
      ...rule,
      scope: AccessRuleScope.ACCESS_LEVEL,
      priority: rule.accessLevel === 'restricted' ? 500 : 100,
    });
  }

  const upsertAccessWindow = async (
    ruleId: number,
    window: {
      startTime: string;
      endTime: string;
      timezone: string;
      daysOfWeek: number[];
      insideDecision: AccessDecision;
      outsideDecision: AccessDecision;
      insideMessage?: string;
      outsideMessage?: string;
      fallbackDestinationCode?: string;
    },
  ) => {
    const fallbackDestination = window.fallbackDestinationCode ? destinations.get(window.fallbackDestinationCode) : undefined;
    const existing = await prisma.accessWindow.findFirst({ where: { ruleId }, select: { id: true } });
    const data = {
      startTime: window.startTime,
      endTime: window.endTime,
      timezone: window.timezone,
      daysOfWeek: window.daysOfWeek,
      insideDecision: window.insideDecision,
      outsideDecision: window.outsideDecision,
      insideMessage: window.insideMessage,
      outsideMessage: window.outsideMessage,
      fallbackDestinationId: fallbackDestination?.id,
    };

    if (existing) {
      await prisma.accessWindow.update({ where: { id: existing.id }, data });
      return;
    }

    await prisma.accessWindow.create({ data: { ruleId, ...data } });
  };

  const externalExamRules = [
    {
      code: 'external-exams-private-0700-1700',
      name: 'Exames externos Private das 07:00 as 17:00',
      areaCode: 'private',
      fallbackDestinationCode: 'private-reception',
    },
    {
      code: 'external-exams-sus-0700-1700',
      name: 'Exames externos SUS das 07:00 as 17:00',
      areaCode: 'sus',
      fallbackDestinationCode: 'sus-reception',
    },
  ];

  for (const rule of externalExamRules) {
    const savedRule = await upsertAccessRule({
      code: rule.code,
      name: rule.name,
      subject: AccessSubject.EXTERNAL_PATIENT,
      scope: AccessRuleScope.CATEGORY,
      priority: 300,
      areaCode: rule.areaCode,
      category: 'Exames',
      fallbackDestinationCode: rule.fallbackDestinationCode,
      message: 'Atendimento externo disponivel das 07:00 as 17:00.',
    });

    await upsertAccessWindow(savedRule.id, {
      startTime: '07:00',
      endTime: '17:00',
      timezone: 'America/Sao_Paulo',
      daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
      insideDecision: AccessDecision.ALLOW,
      outsideDecision: AccessDecision.REDIRECT_TO_RECEPTION,
      insideMessage: 'Destino liberado para atendimento externo.',
      outsideMessage: 'Atendimento externo disponivel das 07:00 as 17:00. Procure a recepcao para orientacao ou aguarde o horario permitido.',
      fallbackDestinationCode: rule.fallbackDestinationCode,
    });
  }

  await prisma.beacon.upsert({
    where: { code: 'MBM04-01' },
    update: { navigationNodeId: nodes.get('private-entry')?.id },
    create: {
      code: 'MBM04-01',
      name: 'Entrada Private',
      area: 'private',
      areaName: 'HMC Private',
      location: 'Entrada pelos fundos',
      sector: 'Entrada Private',
      battery: 92,
      status: 'Online',
      navigationNodeId: nodes.get('private-entry')?.id,
    },
  });

  await prisma.beacon.upsert({
    where: { code: 'MBM04-02' },
    update: { navigationNodeId: nodes.get('private-reception')?.id },
    create: {
      code: 'MBM04-02',
      name: 'Recepcao Private',
      area: 'private',
      areaName: 'HMC Private',
      location: 'Recepcao Private',
      sector: 'Recepcao Private',
      battery: 88,
      status: 'Online',
      navigationNodeId: nodes.get('private-reception')?.id,
    },
  });

  await prisma.beacon.upsert({
    where: { code: 'MBM04-10' },
    update: { navigationNodeId: nodes.get('sus-entry')?.id },
    create: {
      code: 'MBM04-10',
      name: 'Entrada Hospital Marco Capute',
      area: 'sus',
      areaName: 'Hospital Marco Capute',
      location: 'Entrada pela frente',
      sector: 'Entrada Hospital Marco Capute',
      battery: 90,
      status: 'Online',
      navigationNodeId: nodes.get('sus-entry')?.id,
    },
  });

  await prisma.beacon.upsert({
    where: { code: 'MBM04-11' },
    update: { navigationNodeId: nodes.get('sus-reception')?.id },
    create: {
      code: 'MBM04-11',
      name: 'Recepcao Hospital Marco Capute',
      area: 'sus',
      areaName: 'Hospital Marco Capute',
      location: 'Recepcao Hospital Marco Capute',
      sector: 'Recepcao Hospital Marco Capute',
      battery: 84,
      status: 'Online',
      navigationNodeId: nodes.get('sus-reception')?.id,
    },
  });

  await prisma.beacon.upsert({
    where: { code: 'MBM04-20' },
    update: { navigationNodeId: nodes.get('corridor-a')?.id },
    create: {
      code: 'MBM04-20',
      name: 'Corredor compartilhado',
      area: 'shared',
      areaName: 'Compartilhado',
      location: 'Corredor compartilhado',
      sector: 'Corredor compartilhado',
      battery: 70,
      status: 'Online',
      navigationNodeId: nodes.get('corridor-a')?.id,
    },
  });

  const calls = await prisma.callRequest.count();
  if (calls === 0) {
    await prisma.callRequest.createMany({
      data: [
        {
          userType: 'patient',
          userName: 'Mariana Souza',
          patientName: 'Mariana Souza',
          area: 'private',
          areaName: 'HMC Private',
          callType: CallType.SOS,
          reason: 'SOS paciente Private pendente',
          location: 'Recepcao Private',
          sector: 'Recepcao Private',
          beaconCode: 'MBM04-02',
          message: 'SOS paciente Private pendente',
          priority: Priority.CRITICAL,
          status: CallStatus.PENDING,
        },
        {
          userType: 'visitor',
          userName: 'Visitante SUS',
          patientName: 'Visitante SUS',
          area: 'sus',
          areaName: 'Hospital Marco Capute',
          callType: CallType.HELP,
          reason: 'Pedido de ajuda visitante SUS pendente',
          location: 'Recepcao Hospital Marco Capute',
          sector: 'Recepcao Hospital Marco Capute',
          beaconCode: 'MBM04-11',
          message: 'Pedido de ajuda visitante SUS pendente',
          priority: Priority.MEDIUM,
          status: CallStatus.PENDING,
        },
      ],
    });
  }

  const visitorAccess = await prisma.visitorAccessRequest.count();
  if (visitorAccess === 0) {
    await prisma.visitorAccessRequest.createMany({
      data: [
        {
          visitorName: 'Maria Souza',
          areaId: 'private',
          area: 'HMC Private',
          areaName: 'HMC Private',
          entrance: 'Entrada pelos fundos',
          entry: 'Entrada pelos fundos',
          reason: 'Visitar paciente',
          requestedDestination: 'Visita / Internacao Private',
          accessibility: 'Nao',
          currentLocation: 'Entrada Private',
          currentBeacon: 'MBM04-01',
          beacon: 'MBM04-01',
          status: VisitorAccessStatus.PENDING,
        },
        {
          visitorName: 'Joao Lima',
          areaId: 'sus',
          area: 'Hospital Marco Capute',
          areaName: 'Hospital Marco Capute',
          entrance: 'Entrada pela frente',
          entry: 'Entrada pela frente',
          reason: 'Acompanhar paciente',
          requestedDestination: 'Visita / Internacao Hospital Marco Capute',
          accessibility: 'Sim',
          currentLocation: 'Recepcao Hospital Marco Capute',
          currentBeacon: 'MBM04-11',
          beacon: 'MBM04-11',
          status: VisitorAccessStatus.APPROVED,
          permissionMinutes: 30,
          authorizedRoute: 'Recepcao Hospital Marco Capute -> rota autorizada -> destino',
          allowedRoute: 'Recepcao Hospital Marco Capute -> rota autorizada -> destino',
          allowedTime: '30 minutos',
        },
      ],
    });
  }

  const checkIns = await prisma.checkIn.count();
  if (checkIns === 0) {
    await prisma.checkIn.createMany({
      data: [
        {
          patientName: 'Paciente Demo',
          document: 'PAT-DEMO-001',
          destinationLabel: 'Tomografia',
          accessibility: 'Sim',
          observations: 'Demo: rota acessivel com preferencia por elevador.',
          status: CheckInStatus.WAITING,
          destinationId: destinations.get('private-tomografia')?.id,
          sectorId: sectors.get('private-imaging')?.id,
        },
        {
          patientName: 'Mariana Souza',
          document: 'DOC-DEMO-002',
          destinationLabel: 'Laboratorio SUS',
          accessibility: 'Nao',
          observations: 'Demo: paciente em rota para atendimento.',
          status: CheckInStatus.IN_ROUTE,
          destinationId: destinations.get('sus-laboratorio')?.id,
          sectorId: sectors.get('sus-laboratory')?.id,
        },
      ],
    });
  }

  const operationalMessages = await prisma.operationalMessage.count();
  if (operationalMessages === 0) {
    await prisma.operationalMessage.createMany({
      data: [
        {
          recipient: 'Recepcao',
          content: 'Monitorar chamados HELP e SOS pendentes durante a demonstracao.',
          priority: 'Alta',
          direction: 'Enviada',
        },
        {
          recipient: 'Setor de Imagem Private',
          content: 'Orientar pacientes externos para a recepcao fora da janela de atendimento.',
          priority: 'Media',
          direction: 'Enviada',
        },
      ],
    });
  }
}

main()
  .finally(async () => {
    await prisma.$disconnect();
  })
  .catch(async (error) => {
    console.error(error);
    await prisma.$disconnect();
    process.exit(1);
  });

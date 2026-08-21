import { strict as assert } from 'node:assert';
import { BadRequestException, NotFoundException } from '@nestjs/common';
import { AccessDecision, AccessSubject, NavigationNodeType, RouteType } from '@prisma/client';
import { NavigationInstructionsService } from './navigation-instructions.service';
import { NavigationRoutingService } from './navigation-routing.service';

const baseNodes = [
  node(1, 'private-entry', 'Entrada Private', NavigationNodeType.ENTRANCE),
  node(2, 'private-reception', 'Recepcao Private', NavigationNodeType.RECEPTION),
  node(3, 'corridor-a', 'Corredor A', NavigationNodeType.CORRIDOR),
  node(4, 'imaging-access', 'Acesso Imagem', NavigationNodeType.CORRIDOR),
  node(5, 'private-imaging', 'Setor de Imagem Private', NavigationNodeType.ROOM),
  node(6, 'private-tomography', 'Tomografia', NavigationNodeType.ROOM),
  node(7, 'sus-entry', 'Entrada Hospital Marco Capute', NavigationNodeType.ENTRANCE),
  node(8, 'sus-reception', 'Recepcao Hospital Marco Capute', NavigationNodeType.RECEPTION),
  node(9, 'sus-laboratory', 'Laboratorio SUS', NavigationNodeType.ROOM),
  node(10, 'surgery-center', 'Centro Cirurgico', NavigationNodeType.ROOM, '1o Andar', 1),
  node(11, 'private-bathroom', 'Banheiro Private', NavigationNodeType.BATHROOM),
  node(12, 'private-waiting', 'Sala de espera Private', NavigationNodeType.ROOM),
  node(13, 'nearest-reception', 'Recepcao mais proxima', NavigationNodeType.RECEPTION),
];

const baseEdges = [
  edge(1, 1, 2, 40, true, true, 'Siga da entrada pelos fundos ate a Recepcao Private.'),
  edge(2, 2, 3, 18),
  edge(3, 3, 4, 15),
  edge(4, 4, 5, 20),
  edge(5, 5, 6, 20),
  edge(6, 7, 8, 35),
  edge(7, 8, 9, 150),
  edge(8, 3, 11, 12),
  edge(9, 2, 12, 10),
  edge(10, 13, 2, 50),
];

const baseDestinations = [
  destination(1, 'private-tomografia', 'Tomografia', 'patient', 6),
  destination(2, 'sus-laboratorio', 'Laboratorio SUS', 'patient', 9),
  destination(3, 'centro-cirurgico', 'Centro Cirurgico', 'restricted', 10),
  destination(4, 'private-reception', 'Recepcao Private', 'public', 2),
  destination(5, 'private-bathroom', 'Banheiro Private', 'visitor_allowed', 11),
  destination(6, 'private-waiting', 'Sala de espera Private', 'visitor_allowed', 12),
  destination(7, 'shared-lost', 'Recepcao mais proxima', 'public', 13),
  destination(8, 'destination-without-node', 'Destino sem node', 'public', null),
];

function node(id: number, code: string, label: string, type: NavigationNodeType, floor = 'Piso Terreo', z = 0) {
  return {
    id,
    code,
    label,
    type,
    floor,
    x: id * 10,
    y: id * 5,
    z,
    instruction: null,
  };
}

function edge(
  id: number,
  fromNodeId: number,
  toNodeId: number,
  distanceMeters?: number | null,
  accessible = true,
  bidirectional = true,
  instruction: string | null = null,
  routeType: RouteType = RouteType.CORRIDOR,
  wheelchairAccessible = true,
  stretcherAccessible = true,
) {
  return {
    id,
    fromNodeId,
    toNodeId,
    distanceMeters,
    accessible,
    routeType,
    wheelchairAccessible,
    stretcherAccessible,
    bidirectional,
    instruction,
  };
}

function destination(id: number, code: string, name: string, accessLevel: string, navigationNodeId: number | null) {
  const navigationNode = navigationNodeId
    ? baseNodes.find((item) => item.id === navigationNodeId) ?? null
    : null;

  return {
    id,
    code,
    name,
    icon: null,
    category: accessLevel === 'restricted' ? 'Restrito' : 'Exames',
    floor: navigationNode?.floor ?? null,
    distanceLabel: null,
    timeLabel: null,
    accessLevel,
    areaId: null,
    sectorId: null,
    navigationNodeId,
    area: null,
    sector: null,
    navigationNode,
  };
}

function makeService(options: {
  nodes?: any[];
  edges?: any[];
  destinations?: any[];
  decision?: AccessDecision;
  redirectCode?: string;
  reason?: string;
  patientProfile?: any;
  onFindEdges?: () => void;
} = {}) {
  const nodes = options.nodes ?? baseNodes;
  const destinations = options.destinations ?? baseDestinations;
  const prisma = {
    navigationNode: {
      findUnique: async ({ where }: any) => nodes.find((item) => item.code === where.code) ?? null,
      findMany: async () => [...nodes].sort((left, right) => left.code.localeCompare(right.code)),
    },
    destination: {
      findUnique: async ({ where }: any) => destinations.find((item) => item.code === where.code || item.id === where.id) ?? null,
    },
    routeEdge: {
      findMany: async () => {
        options.onFindEdges?.();
        return [...(options.edges ?? baseEdges)].sort((left, right) => left.id - right.id);
      },
    },
    patientProfile: {
      findUnique: async ({ where }: any) => (options.patientProfile?.userId === where.userId ? options.patientProfile : null),
    },
  };
  const access = {
    checkAccess: async () => ({
      allowed: (options.decision ?? AccessDecision.ALLOW) === AccessDecision.ALLOW,
      decision: options.decision ?? AccessDecision.ALLOW,
      reason: options.reason ?? 'Acesso permitido.',
      requires_authorization: (options.decision ?? AccessDecision.ALLOW) === AccessDecision.REQUIRE_AUTHORIZATION,
      evaluated_at: '2026-01-05T12:00:00.000Z',
      timezone: 'America/Sao_Paulo',
      destination: null,
      matched_rule: null,
      redirect_destination: options.redirectCode
        ? {
            id: 4,
            code: options.redirectCode,
            name: 'Recepcao Private',
            access_level: 'public',
          }
        : null,
      visitor_authorization: null,
    }),
  };

  return new NavigationRoutingService(prisma as any, access as any, new NavigationInstructionsService());
}

async function route(
  service: NavigationRoutingService,
  origin: string,
  destinationCode: string,
  subject: AccessSubject = AccessSubject.PATIENT,
  extraPayload: Record<string, any> = {},
  user?: any,
) {
  return service.routePreview(
    {
      origin_node_code: origin,
      destination_code: destinationCode,
      subject,
      ...extraPayload,
    },
    user,
  );
}

async function assertRejectsWith(label: string, action: () => Promise<unknown>, errorType: any) {
  try {
    await action();
    assert.fail(`${label} deveria falhar`);
  } catch (error) {
    assert.ok(error instanceof errorType, label);
  }
}

async function run() {
  const privateRoute = await route(makeService(), 'private-entry', 'private-tomografia');
  assert.equal(privateRoute.route_found, true, 'private-entry -> private-tomografia encontra rota');
  assert.equal(privateRoute.total_distance, 113, 'private-entry -> private-tomografia soma distanceMeters');
  assert.equal(privateRoute.steps.at(-1)?.instruction, 'Voce chegou ao destino: Tomografia.', 'route-preview inclui steps');
  assert.deepEqual(privateRoute.nodes.map((item: any) => item.code), [
    'private-entry',
    'private-reception',
    'corridor-a',
    'imaging-access',
    'private-imaging',
    'private-tomography',
  ]);

  const susRoute = await route(makeService(), 'sus-entry', 'sus-laboratorio');
  assert.equal(susRoute.route_found, true, 'sus-entry -> sus-laboratorio encontra rota');
  assert.equal(susRoute.total_distance, 185);

  const simpleRoute = await route(makeService(), 'private-entry', 'private-reception');
  assert.equal(simpleRoute.edges.length, 1, 'rota simples usa uma edge');
  assert.equal(simpleRoute.edges[0].route_type, RouteType.CORRIDOR, 'routeType default serializa como CORRIDOR');
  assert.equal(simpleRoute.edges[0].accessible, true, 'accessible legado continua serializado');
  assert.equal(simpleRoute.edges[0].wheelchair_accessible, true, 'wheelchairAccessible default serializa como true');
  assert.equal(simpleRoute.edges[0].stretcher_accessible, true, 'stretcherAccessible default serializa como true');

  const elevatorMetadataRoute = await route(
    makeService({
      nodes: [node(1, 'a', 'A', NavigationNodeType.ROOM), node(2, 'b', 'B', NavigationNodeType.ROOM)],
      edges: [edge(1, 1, 2, 10, true, true, null, RouteType.ELEVATOR)],
      destinations: [destinationWithNode('b-dest', 2)],
    }),
    'a',
    'b-dest',
  );
  assert.equal(elevatorMetadataRoute.edges[0].route_type, RouteType.ELEVATOR, 'route_type ELEVATOR nao some na serializacao');
  assert.equal(elevatorMetadataRoute.edges[0].wheelchair_accessible, true);
  assert.equal(elevatorMetadataRoute.edges[0].stretcher_accessible, true);

  const multiPathService = makeService({
    nodes: [node(1, 'a', 'A', NavigationNodeType.ROOM), node(2, 'b', 'B', NavigationNodeType.ROOM), node(3, 'c', 'C', NavigationNodeType.ROOM)],
    edges: [edge(1, 1, 2, 10), edge(2, 2, 3, 10), edge(3, 1, 3, 30)],
    destinations: [destinationWithNode('target', 3)],
  });
  const multiPath = await route(multiPathService, 'a', 'target');
  assert.deepEqual(multiPath.edges.map((item: any) => item.id), [1, 2], 'Dijkstra escolhe menor caminho entre multiplas opcoes');
  assert.equal(multiPath.total_distance, 20);

  const bidirectionalRoute = await route(makeService(), 'private-tomography', 'private-reception');
  assert.equal(bidirectionalRoute.route_found, true, 'edge bidirecional permite caminho reverso');

  const oneWayService = makeService({
    nodes: [node(1, 'a', 'A', NavigationNodeType.ROOM), node(2, 'b', 'B', NavigationNodeType.ROOM)],
    edges: [edge(1, 1, 2, 10, true, false)],
    destinations: [destinationWithNode('a-dest', 1), destinationWithNode('b-dest', 2)],
  });
  assert.equal((await route(oneWayService, 'a', 'b-dest')).route_found, true, 'edge unidirecional permite from -> to');
  assert.equal((await route(oneWayService, 'b', 'a-dest')).route_found, false, 'edge unidirecional bloqueia to -> from');

  await assertRejectsWith('origem inexistente', () => route(makeService(), 'missing-origin', 'private-tomografia'), NotFoundException);
  await assertRejectsWith('destino inexistente', () => route(makeService(), 'private-entry', 'missing-destination'), NotFoundException);
  await assertRejectsWith('destination sem node', () => route(makeService(), 'private-entry', 'destination-without-node'), BadRequestException);
  await assertRejectsWith(
    'edge sem distanceMeters e inconsistencia controlada',
    () => route(makeService({ edges: [edge(1, 1, 2, undefined)] }), 'private-entry', 'private-reception'),
    BadRequestException,
  );

  const noRoute = await route(makeService(), 'private-entry', 'centro-cirurgico');
  assert.equal(noRoute.route_found, false, 'sem rota retorna route_found=false');

  const surgeryRoute = await route(makeService({ decision: AccessDecision.ALLOW }), 'private-entry', 'centro-cirurgico');
  assert.equal(surgeryRoute.route_found, false, 'surgery-center isolado nao causa crash');

  const sameNode = await route(makeService(), 'private-reception', 'private-reception');
  assert.equal(sameNode.route_found, true, 'mesma origem e destino encontra rota trivial');
  assert.equal(sameNode.total_distance, 0);
  assert.equal(sameNode.nodes.length, 1);
  assert.equal(sameNode.edges.length, 0);

  const blocked = await route(makeService({ decision: AccessDecision.BLOCK, reason: 'Bloqueado.' }), 'private-entry', 'centro-cirurgico');
  assert.equal(blocked.route_found, false, 'BLOCK nao calcula rota normal');
  assert.equal(blocked.decision, AccessDecision.BLOCK);
  assert.equal(blocked.reason, 'Bloqueado.');

  const requireAuthorization = await route(
    makeService({ decision: AccessDecision.REQUIRE_AUTHORIZATION, reason: 'Precisa autorizacao.' }),
    'private-entry',
    'private-tomografia',
    AccessSubject.VISITOR,
  );
  assert.equal(requireAuthorization.route_found, false, 'REQUIRE_AUTHORIZATION nao calcula rota normal');
  assert.equal(requireAuthorization.decision, AccessDecision.REQUIRE_AUTHORIZATION);

  const redirected = await route(
    makeService({ decision: AccessDecision.REDIRECT_TO_RECEPTION, redirectCode: 'private-reception' }),
    'private-entry',
    'private-tomografia',
    AccessSubject.EXTERNAL_PATIENT,
  );
  assert.equal(redirected.route_found, true, 'REDIRECT_TO_RECEPTION calcula rota para fallback');
  assert.equal(redirected.redirected, true);
  assert.equal(redirected.effective_destination.code, 'private-reception');
  assert.equal(redirected.total_distance, 40);

  const accessibilityNodes = [
    node(1, 'a', 'A', NavigationNodeType.ROOM),
    node(2, 'b', 'B', NavigationNodeType.ROOM),
    node(3, 'c', 'C', NavigationNodeType.ROOM),
    node(4, 'd', 'D', NavigationNodeType.ROOM),
  ];
  const accessibilityDestinations = [destinationWithNode('target', 4)];
  const accessibilityEdges = [
    edge(1, 1, 4, 10, false),
    edge(2, 1, 2, 10, true),
    edge(3, 2, 3, 10, true),
    edge(4, 3, 4, 10, true),
  ];
  const normalAccessibility = await route(
    makeService({ nodes: accessibilityNodes, edges: accessibilityEdges, destinations: accessibilityDestinations }),
    'a',
    'target',
  );
  assert.equal(normalAccessibility.total_distance, 10, 'rota normal pode usar edge inacessivel');
  assert.equal(normalAccessibility.accessible_route_found, null);

  const mobilityRoute = await route(
    makeService({ nodes: accessibilityNodes, edges: accessibilityEdges, destinations: accessibilityDestinations }),
    'a',
    'target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { mobility: true } },
  );
  assert.equal(mobilityRoute.route_found, true, 'mobility=true encontra rota alternativa acessivel');
  assert.equal(mobilityRoute.total_distance, 30);
  assert.equal(mobilityRoute.accessible_route_found, true);
  assert.deepEqual(mobilityRoute.edges.map((item: any) => item.id), [2, 3, 4], 'edge inacessivel e ignorada');

  const noAccessibleRoute = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [edge(1, 1, 4, 10, false)],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { mobility: true } },
  );
  assert.equal(noAccessibleRoute.route_found, false, 'nenhuma rota acessivel retorna route_found=false');
  assert.equal(noAccessibleRoute.accessible_route_found, false);

  const wheelchairRoute = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [
        edge(1, 1, 4, 10, true, true, null, RouteType.CORRIDOR, false),
        edge(2, 1, 2, 10),
        edge(3, 2, 3, 10),
        edge(4, 3, 4, 10),
      ],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.VISITOR,
    { accessibility: { wheelchair: true } },
  );
  assert.deepEqual(wheelchairRoute.edges.map((item: any) => item.id), [2, 3, 4], 'wheelchair=true descarta wheelchairAccessible=false');

  const stretcherRoute = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [
        edge(1, 1, 4, 10, true, true, null, RouteType.CORRIDOR, true, false),
        edge(2, 1, 2, 10),
        edge(3, 2, 3, 10),
        edge(4, 3, 4, 10),
      ],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { needsStretcher: true } },
  );
  assert.deepEqual(stretcherRoute.edges.map((item: any) => item.id), [2, 3, 4], 'needsStretcher=true descarta stretcherAccessible=false');

  const stairsGraph = {
    nodes: accessibilityNodes,
    edges: [
      edge(1, 1, 4, 10, true, true, null, RouteType.STAIRS),
      edge(2, 1, 2, 10),
      edge(3, 2, 3, 10),
      edge(4, 3, 4, 10),
    ],
    destinations: accessibilityDestinations,
  };
  const stairsAllowed = await route(makeService(stairsGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { avoidStairs: false } });
  assert.deepEqual(stairsAllowed.edges.map((item: any) => item.id), [1], 'avoidStairs=false permite STAIRS se demais requisitos permitirem');
  const stairsAvoided = await route(makeService(stairsGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { avoidStairs: true } });
  assert.deepEqual(stairsAvoided.edges.map((item: any) => item.id), [2, 3, 4], 'avoidStairs=true descarta STAIRS');

  const combinedWheelchairStairs = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [
        edge(1, 1, 4, 10, true, true, null, RouteType.STAIRS),
        edge(2, 1, 2, 10, true, true, null, RouteType.CORRIDOR, false),
        edge(3, 2, 4, 10),
        edge(4, 1, 3, 12),
        edge(5, 3, 4, 12),
      ],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { wheelchair: true, avoidStairs: true } },
  );
  assert.deepEqual(combinedWheelchairStairs.edges.map((item: any) => item.id), [4, 5], 'wheelchair + avoidStairs aplica regras cumulativas');

  const combinedStretcherWheelchair = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [
        edge(1, 1, 4, 10, true, true, null, RouteType.CORRIDOR, true, false),
        edge(2, 1, 2, 10, true, true, null, RouteType.CORRIDOR, false, true),
        edge(3, 2, 4, 10),
        edge(4, 1, 3, 12),
        edge(5, 3, 4, 12),
      ],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.VISITOR,
    { accessibility: { wheelchair: true, needsStretcher: true } },
  );
  assert.deepEqual(combinedStretcherWheelchair.edges.map((item: any) => item.id), [4, 5], 'stretcher + wheelchair aplica regras cumulativas');

  const preferenceGraph = {
    nodes: [node(1, 'a', 'A', NavigationNodeType.ROOM), node(2, 'b', 'B', NavigationNodeType.ROOM), node(3, 'c', 'C', NavigationNodeType.ROOM)],
    edges: [
      edge(1, 1, 3, 10, true, true, null, RouteType.CORRIDOR),
      edge(2, 1, 2, 8, true, true, null, RouteType.ELEVATOR),
      edge(3, 2, 3, 8, true, true, null, RouteType.CORRIDOR),
    ],
    destinations: [destinationWithNode('target', 3)],
  };
  const preferElevatorRoute = await route(makeService(preferenceGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { preferElevator: true } });
  assert.deepEqual(preferElevatorRoute.edges.map((item: any) => item.id), [1], 'preferElevator nao obriga ELEVATOR nem altera peso');
  const voiceGuidanceRoute = await route(makeService(preferenceGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { voiceGuidance: true } });
  assert.deepEqual(voiceGuidanceRoute.edges.map((item: any) => item.id), [1], 'voiceGuidance nao altera rota');
  const largerTextRoute = await route(makeService(preferenceGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { largerText: true } });
  assert.deepEqual(largerTextRoute.edges.map((item: any) => item.id), [1], 'largerText nao altera rota');
  const highContrastRoute = await route(makeService(preferenceGraph), 'a', 'target', AccessSubject.VISITOR, { accessibility: { highContrast: true } });
  assert.deepEqual(highContrastRoute.edges.map((item: any) => item.id), [1], 'highContrast nao altera rota');

  const mobilityDifficultyRoute = await route(
    makeService({ nodes: accessibilityNodes, edges: accessibilityEdges, destinations: accessibilityDestinations }),
    'a',
    'target',
    AccessSubject.VISITOR,
    { accessibility: { mobilityDifficulty: true } },
  );
  assert.deepEqual(mobilityDifficultyRoute.edges.map((item: any) => item.id), [2, 3, 4], 'mobilityDifficulty=true exige accessible=true');

  const patientProfileRoute = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: accessibilityEdges,
      destinations: accessibilityDestinations,
      patientProfile: { userId: 77, accessibility: { wheelchair: true } },
    }),
    'a',
    'target',
    AccessSubject.PATIENT,
    { accessibility: { mobility: false } },
    { id: 77, role: 'PATIENT' },
  );
  assert.equal(patientProfileRoute.total_distance, 30, 'PatientProfile prevalece sobre preferencia enviada pelo cliente');
  assert.equal(patientProfileRoute.accessibility.source, 'patient_profile');
  assert.equal(patientProfileRoute.accessibility.wheelchair, true);

  const visitorTemporaryRoute = await route(
    makeService({ nodes: accessibilityNodes, edges: accessibilityEdges, destinations: accessibilityDestinations }),
    'a',
    'target',
    AccessSubject.VISITOR,
    { accessibility: { mobility: true } },
  );
  assert.equal(visitorTemporaryRoute.accessibility?.source, 'request', 'VISITOR usa accessibility temporaria');

  const externalPatientTemporaryRoute = await route(
    makeService({ nodes: accessibilityNodes, edges: accessibilityEdges, destinations: accessibilityDestinations }),
    'a',
    'target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { mobility: true } },
  );
  assert.equal(externalPatientTemporaryRoute.accessibility?.source, 'request', 'EXTERNAL_PATIENT usa accessibility temporaria');

  const redirectedAccessible = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: accessibilityEdges,
      destinations: [destinationWithNode('blocked-target', 4), destinationWithNode('redirect-target', 4)],
      decision: AccessDecision.REDIRECT_TO_RECEPTION,
      redirectCode: 'redirect-target',
    }),
    'a',
    'blocked-target',
    AccessSubject.EXTERNAL_PATIENT,
    { accessibility: { mobility: true } },
  );
  assert.equal(redirectedAccessible.redirected, true, 'REDIRECT calcula rota para destino efetivo');
  assert.deepEqual(redirectedAccessible.edges.map((item: any) => item.id), [2, 3, 4], 'REDIRECT respeita accessibility no destino efetivo');

  let blockFindEdgesCalls = 0;
  const blockedWithoutDijkstra = await route(
    makeService({
      decision: AccessDecision.BLOCK,
      onFindEdges: () => {
        blockFindEdgesCalls += 1;
      },
    }),
    'private-entry',
    'private-tomografia',
  );
  assert.equal(blockedWithoutDijkstra.route_found, false);
  assert.equal(blockFindEdgesCalls, 0, 'BLOCK nao executa Dijkstra');

  const topologicalOnlyRoute = await route(
    makeService({
      nodes: accessibilityNodes,
      edges: [edge(1, 1, 4, 10, true, true, null, RouteType.CORRIDOR, false)],
      destinations: accessibilityDestinations,
    }),
    'a',
    'target',
    AccessSubject.VISITOR,
    { accessibility: { wheelchair: true } },
  );
  assert.equal(topologicalOnlyRoute.route_found, false, 'rota topologica nao vira fallback inseguro');
  assert.equal(topologicalOnlyRoute.accessible_route_found, false);
  assert.equal(topologicalOnlyRoute.reason, 'Nao existe rota acessivel entre a origem e o destino efetivo.');

  console.log('navigation routing tests passed');
}

function destinationWithNode(code: string, navigationNodeId: number) {
  const navigationNode = {
    id: navigationNodeId,
    code: navigationNodeId === 1 ? 'a' : navigationNodeId === 2 ? 'b' : 'c',
    label: code,
    type: NavigationNodeType.ROOM,
    floor: 'Piso Terreo',
    x: null,
    y: null,
    z: 0,
    instruction: null,
  };

  return {
    id: navigationNodeId,
    code,
    name: code,
    icon: null,
    category: 'Teste',
    floor: 'Piso Terreo',
    distanceLabel: null,
    timeLabel: null,
    accessLevel: 'public',
    areaId: null,
    sectorId: null,
    navigationNodeId,
    area: null,
    sector: null,
    navigationNode,
  };
}

run().catch((error) => {
  console.error(error);
  process.exit(1);
});

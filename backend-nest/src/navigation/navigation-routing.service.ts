import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { AccessDecision, AccessSubject, RouteType, UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { PrismaService } from '../database/prisma.service';
import { RoutePreviewDto } from './dto/route-preview.dto';
import { NavigationAccessService } from './navigation-access.service';
import { NavigationInstructionsService } from './navigation-instructions.service';

const WALKING_SPEED_METERS_PER_SECOND = 0.8;

type NodeRecord = {
  id: number;
  code: string;
  label: string;
  type: string;
  floor: string | null;
  x: number | null;
  y: number | null;
  z: number | null;
  instruction: string | null;
};

type EdgeRecord = {
  id: number;
  fromNodeId: number;
  toNodeId: number;
  distanceMeters?: number | null;
  accessible: boolean;
  routeType?: RouteType | null;
  wheelchairAccessible?: boolean | null;
  stretcherAccessible?: boolean | null;
  bidirectional: boolean;
  instruction: string | null;
};

type QueueItem = { nodeId: number; distance: number };
type PreviousHop = { previousNodeId: number; edgeId: number };
type RouteAccessibilityPreferences = {
  mobility: boolean;
  mobilityDifficulty: boolean;
  wheelchair: boolean;
  needsStretcher: boolean;
  avoidStairs: boolean;
  preferElevator: boolean;
  voiceGuidance: boolean;
  largerText: boolean;
  highContrast: boolean;
  hasRoutingConstraint: boolean;
  source: 'patient_profile' | 'request' | 'none';
};

@Injectable()
export class NavigationRoutingService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly navigationAccessService: NavigationAccessService,
    private readonly navigationInstructionsService: NavigationInstructionsService,
  ) {}

  async routePreview(payload: RoutePreviewDto, user?: AuthenticatedUser) {
    const [origin, requestedDestination] = await Promise.all([
      this.prisma.navigationNode.findUnique({ where: { code: payload.origin_node_code } }),
      this.prisma.destination.findUnique({
        where: { code: payload.destination_code },
        include: { area: true, sector: true, navigationNode: true },
      }),
    ]);

    if (!origin) {
      throw new NotFoundException('No de origem nao encontrado');
    }

    if (!requestedDestination) {
      throw new NotFoundException('Destino nao encontrado');
    }

    if (!requestedDestination.navigationNode) {
      throw new BadRequestException('Destino nao possui no de navegacao associado');
    }

    const access = await this.navigationAccessService.checkAccess({
      destination_code: payload.destination_code,
      subject: payload.subject,
      current_area_code: payload.current_area_code,
      current_beacon_code: payload.current_beacon_code,
      visitor_access_request_id: payload.visitor_access_request_id,
    });

    if (access.decision === AccessDecision.BLOCK || access.decision === AccessDecision.REQUIRE_AUTHORIZATION) {
      return {
        route_found: false,
        decision: access.decision,
        redirected: false,
        reason: access.reason,
        origin: this.nodeSummary(origin),
        requested_destination: this.destinationSummary(requestedDestination),
        effective_destination: this.destinationSummary(requestedDestination),
        access,
        total_distance: null,
        estimated_time_seconds: null,
        nodes: [],
        edges: [],
        steps: [],
      };
    }

    const effectiveDestination =
      access.decision === AccessDecision.REDIRECT_TO_RECEPTION
        ? await this.resolveRedirectDestination(access.redirect_destination?.code)
        : requestedDestination;
    const effectiveDestinationNode = effectiveDestination.navigationNode;

    if (!effectiveDestinationNode) {
      throw new BadRequestException('Destino efetivo nao possui no de navegacao associado');
    }

    const accessibility = await this.resolveAccessibility(payload, user);
    const route = await this.shortestPath(origin.id, effectiveDestinationNode.id, accessibility);
    const unrestrictedRoute = !route.found && accessibility.hasRoutingConstraint
      ? await this.shortestPath(origin.id, effectiveDestinationNode.id)
      : null;
    const noAccessibleRoute = Boolean(accessibility.hasRoutingConstraint && !route.found && unrestrictedRoute?.found);

    return {
      route_found: route.found,
      decision: access.decision,
      redirected: access.decision === AccessDecision.REDIRECT_TO_RECEPTION,
      reason: route.found
        ? null
        : noAccessibleRoute
          ? 'Nao existe rota acessivel entre a origem e o destino efetivo.'
          : 'Nao existe rota entre a origem e o destino efetivo.',
      accessible_route_found: accessibility.hasRoutingConstraint ? route.found : null,
      accessibility,
      origin: this.nodeSummary(origin),
      requested_destination: this.destinationSummary(requestedDestination),
      effective_destination: this.destinationSummary(effectiveDestination),
      access,
      total_distance: route.found ? route.totalDistance : null,
      estimated_time_seconds: route.found
        ? Math.ceil(route.totalDistance / WALKING_SPEED_METERS_PER_SECOND)
        : null,
      nodes: route.nodes.map((node) => this.nodeSummary(node)),
      edges: route.edges.map((edge) => this.edgeSummary(edge)),
      steps: route.found ? this.navigationInstructionsService.generateSteps(route.nodes, route.edges) : [],
    };
  }

  private async resolveRedirectDestination(destinationCode?: string) {
    if (!destinationCode) {
      throw new BadRequestException('Destino de redirecionamento nao definido');
    }

    const destination = await this.prisma.destination.findUnique({
      where: { code: destinationCode },
      include: { area: true, sector: true, navigationNode: true },
    });

    if (!destination) {
      throw new NotFoundException('Destino de redirecionamento nao encontrado');
    }

    if (!destination.navigationNode) {
      throw new BadRequestException('Destino de redirecionamento nao possui no de navegacao associado');
    }

    return destination;
  }

  private async resolveAccessibility(payload: RoutePreviewDto, user?: AuthenticatedUser): Promise<RouteAccessibilityPreferences> {
    if (payload.subject === AccessSubject.PATIENT && user?.role === UserRole.PATIENT) {
      const profile = await this.prisma.patientProfile.findUnique({ where: { userId: user.id } });
      if (profile) {
        return this.resolveRouteAccessibilityPreferences(this.cleanAccessibility(profile.accessibility), 'patient_profile');
      }
    }

    return this.resolveRouteAccessibilityPreferences(
      this.cleanAccessibility(payload.accessibility),
      payload.accessibility ? 'request' : 'none',
    );
  }

  private cleanAccessibility(value: unknown): Record<string, unknown> {
    if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
    return value as Record<string, unknown>;
  }

  private resolveRouteAccessibilityPreferences(
    accessibility: Record<string, unknown>,
    source: RouteAccessibilityPreferences['source'],
  ): RouteAccessibilityPreferences {
    const mobility = this.booleanPreference(accessibility.mobility);
    const mobilityDifficulty = this.booleanPreference(accessibility.mobilityDifficulty);
    const wheelchair = this.booleanPreference(accessibility.wheelchair);
    const needsStretcher = this.booleanPreference(accessibility.needsStretcher);
    const avoidStairs = this.booleanPreference(accessibility.avoidStairs);

    return {
      mobility,
      mobilityDifficulty,
      wheelchair,
      needsStretcher,
      avoidStairs,
      preferElevator: this.booleanPreference(accessibility.preferElevator),
      voiceGuidance: this.booleanPreference(accessibility.voiceGuidance),
      largerText: this.booleanPreference(accessibility.largerText),
      highContrast: this.booleanPreference(accessibility.highContrast),
      hasRoutingConstraint: Boolean(mobility || mobilityDifficulty || wheelchair || needsStretcher || avoidStairs),
      source,
    };
  }

  private booleanPreference(value: unknown) {
    return value === true;
  }

  private async shortestPath(originNodeId: number, destinationNodeId: number, preferences?: RouteAccessibilityPreferences) {
    const [nodes, edges] = await Promise.all([
      this.prisma.navigationNode.findMany({ orderBy: { code: 'asc' } }),
      this.prisma.routeEdge.findMany({ orderBy: { id: 'asc' } }),
    ]) as [NodeRecord[], EdgeRecord[]];

    const nodesById = new Map(nodes.map((node) => [node.id, node]));
    if (!nodesById.has(originNodeId) || !nodesById.has(destinationNodeId)) {
      throw new BadRequestException('Origem ou destino nao existe no grafo carregado');
    }

    if (originNodeId === destinationNodeId) {
      return {
        found: true,
        totalDistance: 0,
        nodes: [nodesById.get(originNodeId)!],
        edges: [] as EdgeRecord[],
      };
    }

    const edgeById = new Map(edges.map((edge) => [edge.id, edge]));
    const adjacency = this.buildAdjacency(edges, preferences);
    const distances = new Map<number, number>();
    const previous = new Map<number, PreviousHop>();
    const queue: QueueItem[] = [];

    for (const node of nodes) {
      distances.set(node.id, Number.POSITIVE_INFINITY);
    }
    distances.set(originNodeId, 0);
    queue.push({ nodeId: originNodeId, distance: 0 });

    while (queue.length > 0) {
      queue.sort((left, right) => left.distance - right.distance);
      const current = queue.shift()!;
      if (current.distance > (distances.get(current.nodeId) ?? Number.POSITIVE_INFINITY)) continue;
      if (current.nodeId === destinationNodeId) break;

      for (const next of adjacency.get(current.nodeId) ?? []) {
        const candidate = current.distance + next.weight;
        if (candidate < (distances.get(next.toNodeId) ?? Number.POSITIVE_INFINITY)) {
          distances.set(next.toNodeId, candidate);
          previous.set(next.toNodeId, { previousNodeId: current.nodeId, edgeId: next.edgeId });
          queue.push({ nodeId: next.toNodeId, distance: candidate });
        }
      }
    }

    const totalDistance = distances.get(destinationNodeId) ?? Number.POSITIVE_INFINITY;
    if (!Number.isFinite(totalDistance)) {
      return {
        found: false,
        totalDistance: 0,
        nodes: [] as NodeRecord[],
        edges: [] as EdgeRecord[],
      };
    }

    const pathNodeIds: number[] = [];
    const pathEdges: EdgeRecord[] = [];
    let currentNodeId = destinationNodeId;

    while (currentNodeId !== originNodeId) {
      pathNodeIds.push(currentNodeId);
      const hop = previous.get(currentNodeId);
      if (!hop) {
        return { found: false, totalDistance: 0, nodes: [] as NodeRecord[], edges: [] as EdgeRecord[] };
      }
      const edge = edgeById.get(hop.edgeId);
      if (!edge) {
        throw new BadRequestException('Aresta da rota nao encontrada no grafo carregado');
      }
      pathEdges.push(edge);
      currentNodeId = hop.previousNodeId;
    }

    pathNodeIds.push(originNodeId);
    pathNodeIds.reverse();
    pathEdges.reverse();

    return {
      found: true,
      totalDistance,
      nodes: pathNodeIds.map((nodeId) => nodesById.get(nodeId)!),
      edges: pathEdges,
    };
  }

  private buildAdjacency(edges: EdgeRecord[], preferences?: RouteAccessibilityPreferences) {
    const adjacency = new Map<number, Array<{ toNodeId: number; edgeId: number; weight: number }>>();

    for (const edge of edges) {
      if (!this.isEdgeAllowedForAccessibility(edge, preferences)) continue;

      if (edge.distanceMeters === null || edge.distanceMeters === undefined || !Number.isFinite(edge.distanceMeters)) {
        throw new BadRequestException(`RouteEdge ${edge.id} sem distance_meters valido`);
      }
      if (edge.distanceMeters < 0) {
        throw new BadRequestException(`RouteEdge ${edge.id} possui distance_meters negativo`);
      }

      this.addAdjacent(adjacency, edge.fromNodeId, edge.toNodeId, edge.id, edge.distanceMeters);
      if (edge.bidirectional) {
        this.addAdjacent(adjacency, edge.toNodeId, edge.fromNodeId, edge.id, edge.distanceMeters);
      }
    }

    return adjacency;
  }

  private isEdgeAllowedForAccessibility(edge: EdgeRecord, preferences?: RouteAccessibilityPreferences) {
    if (!preferences?.hasRoutingConstraint) return true;

    const requiresLegacyAccessible =
      preferences.mobility ||
      preferences.mobilityDifficulty ||
      preferences.wheelchair ||
      preferences.needsStretcher;

    if (requiresLegacyAccessible && !edge.accessible) return false;
    if (preferences.wheelchair && !edge.wheelchairAccessible) return false;
    if (preferences.needsStretcher && !edge.stretcherAccessible) return false;
    if (preferences.avoidStairs && edge.routeType === RouteType.STAIRS) return false;

    return true;
  }

  private addAdjacent(
    adjacency: Map<number, Array<{ toNodeId: number; edgeId: number; weight: number }>>,
    fromNodeId: number,
    toNodeId: number,
    edgeId: number,
    weight: number,
  ) {
    const current = adjacency.get(fromNodeId) ?? [];
    current.push({ toNodeId, edgeId, weight });
    adjacency.set(fromNodeId, current);
  }

  private destinationSummary(destination: any) {
    return {
      id: destination.id,
      code: destination.code,
      name: destination.name,
      access_level: destination.accessLevel,
      category: destination.category,
      navigation_node_code: destination.navigationNode?.code ?? null,
    };
  }

  private nodeSummary(node: any) {
    return {
      id: node.id,
      code: node.code,
      label: node.label,
      type: node.type,
      floor: node.floor,
      x: node.x,
      y: node.y,
      z: node.z,
    };
  }

  private edgeSummary(edge: EdgeRecord) {
    return {
      id: edge.id,
      from_node_id: edge.fromNodeId,
      to_node_id: edge.toNodeId,
      distance: edge.distanceMeters,
      distance_meters: edge.distanceMeters,
      accessible: edge.accessible,
      route_type: edge.routeType ?? RouteType.CORRIDOR,
      wheelchair_accessible: edge.wheelchairAccessible ?? true,
      stretcher_accessible: edge.stretcherAccessible ?? true,
      bidirectional: edge.bidirectional,
      instruction: edge.instruction,
    };
  }
}

import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  // Todo o mapa e por hospital: um hospital nunca ve o mapa do outro.
  async bootstrap(hospitalId: number) {
    const [areas, entrances, destinations] = await Promise.all([
      this.areas(hospitalId),
      this.entrances(hospitalId),
      this.destinations(hospitalId),
    ]);

    return {
      areas,
      entrances,
      destinations,
    };
  }

  async areas(hospitalId: number) {
    return this.prisma.hospitalArea.findMany({
      where: { hospitalId },
      orderBy: { code: 'asc' },
      include: {
        entrances: {
          include: { navigationNode: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  async entrances(hospitalId: number) {
    return this.prisma.entrance.findMany({
      where: { hospitalId },
      orderBy: { code: 'asc' },
      include: {
        area: true,
        navigationNode: true,
      },
    });
  }

  async sectors(hospitalId: number) {
    return this.prisma.sector.findMany({
      where: { hospitalId },
      orderBy: [{ area: { code: 'asc' } }, { name: 'asc' }],
      include: {
        area: true,
        destinations: true,
        navigationNodes: true,
      },
    });
  }

  async destinations(hospitalId: number) {
    return this.prisma.destination.findMany({
      where: { hospitalId },
      orderBy: [{ area: { code: 'asc' } }, { name: 'asc' }],
      include: {
        area: true,
        sector: true,
        navigationNode: true,
      },
    });
  }

  async destination(hospitalId: number, destinationId: number) {
    const destination = await this.prisma.destination.findFirst({
      where: { id: destinationId, hospitalId },
      include: {
        area: true,
        sector: true,
        navigationNode: true,
      },
    });

    if (!destination) {
      throw new NotFoundException('Destino nao encontrado');
    }

    return destination;
  }

  async map(hospitalId: number) {
    const [nodes, edges] = await Promise.all([
      this.prisma.navigationNode.findMany({
        where: { hospitalId },
        orderBy: { code: 'asc' },
        include: {
          area: true,
          sector: true,
          destinations: true,
          entrances: true,
        },
      }),
      this.prisma.routeEdge.findMany({
        where: { fromNode: { hospitalId } },
        orderBy: { id: 'asc' },
        include: {
          fromNode: true,
          toNode: true,
        },
      }),
    ]);

    return {
      nodes,
      edges,
    };
  }
}

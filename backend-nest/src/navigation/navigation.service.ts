import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../database/prisma.service';

@Injectable()
export class NavigationService {
  constructor(private readonly prisma: PrismaService) {}

  async bootstrap() {
    const [areas, entrances, destinations] = await Promise.all([
      this.areas(),
      this.entrances(),
      this.destinations(),
    ]);

    return {
      areas,
      entrances,
      destinations,
    };
  }

  async areas() {
    return this.prisma.hospitalArea.findMany({
      orderBy: { code: 'asc' },
      include: {
        entrances: {
          include: { navigationNode: true },
          orderBy: { code: 'asc' },
        },
      },
    });
  }

  async entrances() {
    return this.prisma.entrance.findMany({
      orderBy: { code: 'asc' },
      include: {
        area: true,
        navigationNode: true,
      },
    });
  }

  async sectors() {
    return this.prisma.sector.findMany({
      orderBy: [{ area: { code: 'asc' } }, { name: 'asc' }],
      include: {
        area: true,
        destinations: true,
        navigationNodes: true,
      },
    });
  }

  async destinations() {
    return this.prisma.destination.findMany({
      orderBy: [{ area: { code: 'asc' } }, { name: 'asc' }],
      include: {
        area: true,
        sector: true,
        navigationNode: true,
      },
    });
  }

  async destination(destinationId: number) {
    const destination = await this.prisma.destination.findUnique({
      where: { id: destinationId },
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

  async map() {
    const [nodes, edges] = await Promise.all([
      this.prisma.navigationNode.findMany({
        orderBy: { code: 'asc' },
        include: {
          area: true,
          sector: true,
          destinations: true,
          entrances: true,
        },
      }),
      this.prisma.routeEdge.findMany({
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

import { Injectable, Logger } from '@nestjs/common';
import { mapBeaconToApi } from '../common/api-mappers';
import { PrismaService } from '../database/prisma.service';
import { DetectBeaconDto } from './dto/detect-beacon.dto';

@Injectable()
export class BeaconsService {
  private readonly logger = new Logger(BeaconsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const beacons = await this.prisma.beacon.findMany({
      orderBy: { code: 'asc' },
      include: { navigationNode: true },
    });
    return beacons.map(mapBeaconToApi);
  }

  async detect(payload: DetectBeaconDto) {
    const code = payload.beaconCode || payload.beacon_code;
    this.logger.debug(`beacon_detection_received code=${code ?? 'missing'}`);
    if (!code) {
      return { detected: false };
    }

    const beacon = await this.prisma.beacon.findUnique({
      where: { code },
      include: { navigationNode: true },
    });
    if (!beacon) {
      this.logger.debug(`beacon_unknown code=${code}`);
      return { detected: false };
    }

    await this.prisma.beacon.update({
      where: { code },
      data: { lastSignalAt: new Date() },
    });
    this.logger.debug(`beacon_identified code=${code} origin_node_code=${beacon.navigationNode?.code ?? 'null'}`);
    return {
      detected: true,
      area: beacon.area,
      areaName: beacon.areaName,
      entrance: beacon.area === 'private' ? 'Entrada pelos fundos' : 'Entrada pela frente',
      navigation_node: beacon.navigationNode
        ? {
            id: beacon.navigationNode.id,
            code: beacon.navigationNode.code,
            label: beacon.navigationNode.label,
            floor: beacon.navigationNode.floor,
          }
        : null,
      origin_node_code: beacon.navigationNode?.code ?? null,
    };
  }
}

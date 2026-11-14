import { Injectable, Logger } from '@nestjs/common';
import { mapBeaconToApi } from '../common/api-mappers';
import { PrismaService } from '../database/prisma.service';
import { DetectBeaconDto } from './dto/detect-beacon.dto';
import { normalizeIbeaconUuid } from './ibeacon-uuid';

@Injectable()
export class BeaconsService {
  private readonly logger = new Logger(BeaconsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async list(hospitalId: number) {
    const beacons = await this.prisma.beacon.findMany({
      where: { hospitalId },
      orderBy: { code: 'asc' },
      include: { navigationNode: true },
    });
    return beacons.map(mapBeaconToApi);
  }

  async detect(hospitalId: number, payload: DetectBeaconDto) {
    const beacon = await this.findDetectedBeacon(hospitalId, payload);
    if (!beacon) {
      return { detected: false };
    }

    // So a leitura BLE real (uuid/major/minor) conta como sinal de vida. O
    // modo simulado do app manda so o codigo e nao pode marcar um aparelho
    // fisico como "Online".
    const fromRealBle = !(payload.beaconCode || payload.beacon_code);
    if (fromRealBle) {
      await this.prisma.beacon.update({
        where: { id: beacon.id },
        data: { lastSignalAt: new Date() },
      });
    }
    this.logger.debug(`beacon_identified code=${beacon.code} origin_node_code=${beacon.navigationNode?.code ?? 'null'}`);
    return {
      detected: true,
      beacon_code: beacon.code,
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

  // Código interno tem prioridade (compatibilidade com o app atual); senão,
  // usa o trio iBeacon lido pelo celular. Sem um dos dois completo: não detecta.
  private async findDetectedBeacon(hospitalId: number, payload: DetectBeaconDto) {
    const code = payload.beaconCode || payload.beacon_code;
    if (code) {
      this.logger.debug(`beacon_detection_received code=${code}`);
      const beacon = await this.prisma.beacon.findUnique({
        where: { hospitalId_code: { hospitalId, code } },
        include: { navigationNode: true },
      });
      if (!beacon) this.logger.debug(`beacon_unknown code=${code}`);
      return beacon;
    }

    const { major, minor, rssi } = payload;
    const uuid = normalizeIbeaconUuid(payload.uuid);
    if (!uuid || major === undefined || minor === undefined) {
      this.logger.debug('beacon_detection_received code=missing');
      return null;
    }

    this.logger.debug(`beacon_detection_received ibeacon=${major}/${minor} rssi=${rssi ?? 'n/a'}`);
    const beacon = await this.prisma.beacon.findUnique({
      where: {
        hospitalId_ibeaconUuid_ibeaconMajor_ibeaconMinor: {
          hospitalId,
          ibeaconUuid: uuid,
          ibeaconMajor: major,
          ibeaconMinor: minor,
        },
      },
      include: { navigationNode: true },
    });
    if (!beacon) this.logger.debug(`beacon_unknown ibeacon=${major}/${minor}`);
    return beacon;
  }
}

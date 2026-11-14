import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { BeaconsService } from './beacons.service';
import { DetectBeaconDto } from './dto/detect-beacon.dto';

@Controller('beacons')
export class BeaconsController {
  constructor(private readonly beaconsService: BeaconsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list(@HospitalId() hospitalId: number) {
    return this.beaconsService.list(hospitalId);
  }

  // O beacon lido pelo celular e procurado so no hospital do header X-Hospital.
  @Post('detect')
  @UseGuards(OptionalJwtAuthGuard)
  detect(@Body() payload: DetectBeaconDto, @HospitalId() hospitalId: number) {
    return this.beaconsService.detect(hospitalId, payload);
  }
}

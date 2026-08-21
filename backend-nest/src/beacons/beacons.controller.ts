import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { BeaconsService } from './beacons.service';
import { DetectBeaconDto } from './dto/detect-beacon.dto';

@Controller('beacons')
export class BeaconsController {
  constructor(private readonly beaconsService: BeaconsService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list() {
    return this.beaconsService.list();
  }

  @Post('detect')
  detect(@Body() payload: DetectBeaconDto) {
    return this.beaconsService.detect(payload);
  }
}

import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { CheckInsService } from './check-ins.service';
import { CreateCheckInDto } from './dto/create-check-in.dto';
import { UpdateCheckInStatusDto } from './dto/update-check-in-status.dto';

@Controller('check-ins')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RECEPTION)
export class CheckInsController {
  constructor(private readonly checkInsService: CheckInsService) {}

  @Get()
  list(@HospitalId() hospitalId: number) {
    return this.checkInsService.list(hospitalId);
  }

  @Get(':checkInId')
  get(@Param('checkInId', ParseIntPipe) checkInId: number, @HospitalId() hospitalId: number) {
    return this.checkInsService.get(hospitalId, checkInId);
  }

  @Post()
  create(@Body() payload: CreateCheckInDto, @HospitalId() hospitalId: number) {
    return this.checkInsService.create(hospitalId, payload);
  }

  @Patch(':checkInId/status')
  updateStatus(
    @Param('checkInId', ParseIntPipe) checkInId: number,
    @Body() payload: UpdateCheckInStatusDto,
    @HospitalId() hospitalId: number,
  ) {
    return this.checkInsService.updateStatus(hospitalId, checkInId, payload.status);
  }
}

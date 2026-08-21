import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  @Post()
  create(@Body() payload: CreateCallDto) {
    return this.callsService.create(payload);
  }

  @Post('help')
  createHelp(@Body() payload: CreateCallDto) {
    return this.callsService.createHelp(payload);
  }

  @Post('sos')
  createSos(@Body() payload: CreateCallDto) {
    return this.callsService.createSos(payload);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list() {
    return this.callsService.list();
  }

  @Patch(':callId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  updateStatus(@Param('callId', ParseIntPipe) callId: number, @Body() payload: UpdateCallStatusDto) {
    return this.callsService.updateStatus(callId, payload.status);
  }
}

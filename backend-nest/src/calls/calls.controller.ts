import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  // Publicos (Acesso rapido e visitante nao tem conta). Se vier o token do
  // paciente, o chamado fica ligado a conta dele; sem token = "sem conta".
  @Post()
  @UseGuards(OptionalJwtAuthGuard)
  create(@Body() payload: CreateCallDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.callsService.create(payload, undefined, undefined, user);
  }

  @Post('help')
  @UseGuards(OptionalJwtAuthGuard)
  createHelp(@Body() payload: CreateCallDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.callsService.createHelp(payload, user);
  }

  // Emergencia nunca pode ser barrada por limite de requisicoes: no Wi-Fi do
  // hospital muitos celulares saem pelo mesmo IP.
  @Post('sos')
  @SkipThrottle()
  @UseGuards(OptionalJwtAuthGuard)
  createSos(@Body() payload: CreateCallDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.callsService.createSos(payload, user);
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

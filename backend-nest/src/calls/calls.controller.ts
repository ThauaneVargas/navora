import { BadRequestException, Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
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
import { UpdateCallDetailsDto } from './dto/update-call-details.dto';
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

  // O painel consulta a cada ~2 s com updated_since; sem limite de requisicoes
  // (a recepcao sai pelo mesmo IP do Wi-Fi do hospital que os pacientes).
  @Get()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list(@Query('updated_since') updatedSince?: string) {
    let since: Date | undefined;
    if (updatedSince) {
      since = new Date(updatedSince);
      if (Number.isNaN(since.getTime())) throw new BadRequestException('updated_since invalido');
    }
    return this.callsService.list(since);
  }

  // Celular de quem pediu: acompanha o andamento com o codigo secreto
  // (header X-Call-Token) devolvido ao criar o chamado.
  @Get(':callId/status')
  @SkipThrottle()
  status(@Param('callId', ParseIntPipe) callId: number, @Headers('x-call-token') token?: string) {
    return this.callsService.status(callId, token);
  }

  @Patch(':callId/details')
  @SkipThrottle()
  updateDetails(
    @Param('callId', ParseIntPipe) callId: number,
    @Body() payload: UpdateCallDetailsDto,
    @Headers('x-call-token') token?: string,
  ) {
    return this.callsService.updateDetails(callId, token, payload);
  }

  @Patch(':callId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  updateStatus(@Param('callId', ParseIntPipe) callId: number, @Body() payload: UpdateCallStatusDto) {
    return this.callsService.updateStatus(callId, payload.status);
  }
}

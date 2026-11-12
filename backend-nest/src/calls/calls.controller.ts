import { BadRequestException, Body, Controller, Get, Headers, Param, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { CallsService } from './calls.service';
import { CreateCallDto } from './dto/create-call.dto';
import { UpdateCallStatusDto } from './dto/update-call-status.dto';

@Controller('calls')
export class CallsController {
  constructor(private readonly callsService: CallsService) {}

  // Chamados exigem login (decisao da usuaria, 29/10): o app inteiro so abre
  // com conta, e a recepcao sempre sabe quem pediu (protege contra trote).
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() payload: CreateCallDto, @CurrentUser() user: AuthenticatedUser, @HospitalId() hospitalId: number) {
    return this.callsService.create(payload, user, hospitalId);
  }

  @Post('help')
  @UseGuards(JwtAuthGuard)
  createHelp(@Body() payload: CreateCallDto, @CurrentUser() user: AuthenticatedUser, @HospitalId() hospitalId: number) {
    return this.callsService.createHelp(payload, user, hospitalId);
  }

  // Emergencia nunca pode ser barrada por limite de requisicoes: no Wi-Fi do
  // hospital muitos celulares saem pelo mesmo IP.
  @Post('sos')
  @SkipThrottle()
  @UseGuards(JwtAuthGuard)
  createSos(@Body() payload: CreateCallDto, @CurrentUser() user: AuthenticatedUser, @HospitalId() hospitalId: number) {
    return this.callsService.createSos(payload, user, hospitalId);
  }

  // O painel consulta a cada ~2 s com updated_since; sem limite de requisicoes
  // (a recepcao sai pelo mesmo IP do Wi-Fi do hospital que os pacientes).
  @Get()
  @SkipThrottle()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list(@HospitalId() hospitalId: number, @Query('updated_since') updatedSince?: string) {
    let since: Date | undefined;
    if (updatedSince) {
      since = new Date(updatedSince);
      if (Number.isNaN(since.getTime())) throw new BadRequestException('updated_since invalido');
    }
    return this.callsService.list(hospitalId, since);
  }

  // Celular de quem pediu: acompanha o andamento com o codigo secreto
  // (header X-Call-Token) devolvido ao criar o chamado.
  @Get(':callId/status')
  @SkipThrottle()
  status(@Param('callId', ParseIntPipe) callId: number, @Headers('x-call-token') token?: string) {
    return this.callsService.status(callId, token);
  }

  @Patch(':callId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  updateStatus(
    @Param('callId', ParseIntPipe) callId: number,
    @Body() payload: UpdateCallStatusDto,
    @HospitalId() hospitalId: number,
  ) {
    return this.callsService.updateStatus(hospitalId, callId, payload.status);
  }
}

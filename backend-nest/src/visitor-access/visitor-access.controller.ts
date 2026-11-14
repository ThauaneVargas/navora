import { Body, Controller, Get, Headers, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole, VisitorAccessStatus } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { AuthorizeVisitorAccessDto } from './dto/authorize-visitor-access.dto';
import { CreateVisitorAccessDto } from './dto/create-visitor-access.dto';
import { DenyVisitorAccessDto } from './dto/deny-visitor-access.dto';
import { UpdateVisitorAccessStatusDto } from './dto/update-visitor-access-status.dto';
import { VisitorAccessService } from './visitor-access.service';

@Controller('visitor-access')
export class VisitorAccessController {
  constructor(private readonly visitorAccessService: VisitorAccessService) {}

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  list(
    @HospitalId() hospitalId: number,
    @Query('status', new ParseEnumPipe(VisitorAccessStatus, { optional: true })) status?: VisitorAccessStatus,
  ) {
    return this.visitorAccessService.list(hospitalId, status);
  }

  // O visitante não tem conta: lê o próprio pedido com o código secreto que
  // recebeu ao criá-lo (header X-Visitor-Token). Recepção/admin leem com o JWT.
  @Get(':requestId')
  @UseGuards(OptionalJwtAuthGuard)
  get(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Headers('x-visitor-token') visitorToken?: string,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.visitorAccessService.get(requestId, { visitorToken, user });
  }

  // Modo visita exige login (29/10): o pedido sai com o nome da conta.
  @Post()
  @UseGuards(JwtAuthGuard)
  create(@Body() payload: CreateVisitorAccessDto, @CurrentUser() user: AuthenticatedUser, @HospitalId() hospitalId: number) {
    return this.visitorAccessService.create(payload, user, hospitalId);
  }

  @Patch(':requestId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  approve(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() payload: AuthorizeVisitorAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
    @HospitalId() hospitalId: number,
  ) {
    return this.visitorAccessService.approve(hospitalId, requestId, payload, actor);
  }

  @Patch(':requestId/authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  authorize(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() payload: AuthorizeVisitorAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
    @HospitalId() hospitalId: number,
  ) {
    return this.visitorAccessService.approve(hospitalId, requestId, payload, actor);
  }

  @Patch(':requestId/deny')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  deny(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() payload: DenyVisitorAccessDto,
    @CurrentUser() actor: AuthenticatedUser,
    @HospitalId() hospitalId: number,
  ) {
    return this.visitorAccessService.deny(hospitalId, requestId, payload, actor);
  }

  @Patch(':requestId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  updateStatus(
    @Param('requestId', ParseIntPipe) requestId: number,
    @Body() payload: UpdateVisitorAccessStatusDto,
    @HospitalId() hospitalId: number,
  ) {
    return this.visitorAccessService.updateStatus(hospitalId, requestId, payload.status);
  }
}

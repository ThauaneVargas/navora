import { Body, Controller, Get, Param, ParseEnumPipe, ParseIntPipe, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { UserRole, VisitorAccessStatus } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
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
  list(@Query('status', new ParseEnumPipe(VisitorAccessStatus, { optional: true })) status?: VisitorAccessStatus) {
    return this.visitorAccessService.list(status);
  }

  @Get(':requestId')
  get(@Param('requestId', ParseIntPipe) requestId: number) {
    return this.visitorAccessService.get(requestId);
  }

  @Post()
  create(@Body() payload: CreateVisitorAccessDto) {
    return this.visitorAccessService.create(payload);
  }

  @Patch(':requestId/approve')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  approve(@Param('requestId', ParseIntPipe) requestId: number, @Body() payload: AuthorizeVisitorAccessDto) {
    return this.visitorAccessService.approve(requestId, payload);
  }

  @Patch(':requestId/authorize')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  authorize(@Param('requestId', ParseIntPipe) requestId: number, @Body() payload: AuthorizeVisitorAccessDto) {
    return this.visitorAccessService.approve(requestId, payload);
  }

  @Patch(':requestId/deny')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  deny(@Param('requestId', ParseIntPipe) requestId: number, @Body() payload: DenyVisitorAccessDto) {
    return this.visitorAccessService.deny(requestId, payload);
  }

  @Patch(':requestId/status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  updateStatus(@Param('requestId', ParseIntPipe) requestId: number, @Body() payload: UpdateVisitorAccessStatusDto) {
    return this.visitorAccessService.updateStatus(requestId, payload.status);
  }
}

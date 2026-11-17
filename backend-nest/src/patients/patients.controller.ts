import { Body, Controller, Delete, Get, Post, Put, UseGuards } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserRole } from '@prisma/client';
import { CurrentUser } from '../auth/current-user.decorator';
import { AuthenticatedUser } from '../auth/auth.types';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { DeleteAccountDto } from './dto/delete-account.dto';
import { RegisterPatientDto } from './dto/register-patient.dto';
import { UpdateAccessibilityDto } from './dto/update-accessibility.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientsService } from './patients.service';

@Controller('patients')
export class PatientsController {
  constructor(private readonly patientsService: PatientsService) {}

  // Limite próprio contra criação de contas em massa (o global é 200/min).
  // 10/min por IP: no Wi-Fi do hospital várias pessoas saem pelo mesmo IP.
  @Post('register')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  register(@Body() payload: RegisterPatientDto) {
    return this.patientsService.register(payload);
  }

  @Get('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  me(@CurrentUser() user: AuthenticatedUser) {
    return this.patientsService.me(user);
  }

  // Pede a senha de novo: um celular destravado nas mãos de outra pessoa não
  // basta pra apagar a conta.
  @Delete('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  deleteMe(@CurrentUser() user: AuthenticatedUser, @Body() payload: DeleteAccountDto) {
    return this.patientsService.deleteMe(user, payload.password);
  }

  @Put('me')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  updateMe(@CurrentUser() user: AuthenticatedUser, @Body() payload: UpdatePatientDto) {
    return this.patientsService.updateMe(user, payload);
  }

  @Put('me/accessibility')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.PATIENT)
  updateAccessibility(@CurrentUser() user: AuthenticatedUser, @Body() payload: UpdateAccessibilityDto) {
    return this.patientsService.updateAccessibility(user, payload);
  }
}

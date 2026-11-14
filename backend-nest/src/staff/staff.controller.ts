import { Body, Controller, Delete, Get, HttpException, HttpStatus, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { ChangeStaffStatusDto } from './dto/change-staff-status.dto';
import { StaffService } from './staff.service';

@Controller('staff')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class StaffController {
  constructor(private readonly staffService: StaffService) {}

  @Get()
  list(@HospitalId() hospitalId: number) {
    return this.staffService.list(hospitalId);
  }

  @Get(':userId/audit')
  audit(@Param('userId', ParseIntPipe) userId: number, @HospitalId() hospitalId: number) {
    return this.staffService.audit(hospitalId, userId);
  }

  @Patch(':userId/deactivate')
  deactivate(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() payload: ChangeStaffStatusDto,
    @HospitalId() hospitalId: number,
  ) {
    return this.staffService.deactivate(hospitalId, userId, actor, payload);
  }

  @Patch(':userId/reactivate')
  reactivate(
    @Param('userId', ParseIntPipe) userId: number,
    @CurrentUser() actor: AuthenticatedUser,
    @Body() payload: ChangeStaffStatusDto,
    @HospitalId() hospitalId: number,
  ) {
    return this.staffService.reactivate(hospitalId, userId, actor, payload);
  }

  // Regra de seguranca: funcionarios nunca sao excluidos, apenas desativados.
  @Delete(':userId')
  remove() {
    throw new HttpException(
      'Funcionarios nao podem ser excluidos. Use a desativacao para bloquear o acesso.',
      HttpStatus.METHOD_NOT_ALLOWED,
    );
  }
}

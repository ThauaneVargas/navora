import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { AdminReportDto } from './dto/admin-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
// So o admin: o painel da recepcao nao tem a tela de relatorios.
@Roles(UserRole.ADMIN)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('admin')
  adminReport(@Body() payload: AdminReportDto, @HospitalId() hospitalId: number) {
    return this.reportsService.adminReport(hospitalId, payload);
  }
}

import { Body, Controller, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AdminReportDto } from './dto/admin-report.dto';
import { ReportsService } from './reports.service';

@Controller('reports')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RECEPTION)
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Post('admin')
  adminReport(@Body() payload: AdminReportDto) {
    return this.reportsService.adminReport(payload);
  }
}

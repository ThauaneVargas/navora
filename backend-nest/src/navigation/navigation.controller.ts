import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { AccessCheckDto } from './dto/access-check.dto';
import { RoutePreviewDto } from './dto/route-preview.dto';
import { NavigationAccessService } from './navigation-access.service';
import { NavigationRoutingService } from './navigation-routing.service';
import { NavigationService } from './navigation.service';

// Rotas publicas usam OptionalJwtAuthGuard: com login de equipe, vale o
// hospital da conta; sem login ou com paciente, o do header X-Hospital.
@Controller('navigation')
export class NavigationController {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationAccessService: NavigationAccessService,
    private readonly navigationRoutingService: NavigationRoutingService,
  ) {}

  @Get('bootstrap')
  @UseGuards(OptionalJwtAuthGuard)
  bootstrap(@HospitalId() hospitalId: number) {
    return this.navigationService.bootstrap(hospitalId);
  }

  @Get('areas')
  @UseGuards(OptionalJwtAuthGuard)
  areas(@HospitalId() hospitalId: number) {
    return this.navigationService.areas(hospitalId);
  }

  @Get('destinations')
  @UseGuards(OptionalJwtAuthGuard)
  destinations(@HospitalId() hospitalId: number) {
    return this.navigationService.destinations(hospitalId);
  }

  @Get('destinations/:destinationId')
  @UseGuards(OptionalJwtAuthGuard)
  destination(@Param('destinationId', ParseIntPipe) destinationId: number, @HospitalId() hospitalId: number) {
    return this.navigationService.destination(hospitalId, destinationId);
  }

  @Get('map')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  map(@HospitalId() hospitalId: number) {
    return this.navigationService.map(hospitalId);
  }

  @Post('access-check')
  @UseGuards(OptionalJwtAuthGuard)
  accessCheck(@Body() payload: AccessCheckDto, @HospitalId() hospitalId: number) {
    return this.navigationAccessService.checkAccess(hospitalId, payload);
  }

  @Post('route-preview')
  @UseGuards(OptionalJwtAuthGuard)
  routePreview(
    @Body() payload: RoutePreviewDto,
    @HospitalId() hospitalId: number,
    @CurrentUser() user?: AuthenticatedUser,
  ) {
    return this.navigationRoutingService.routePreview(hospitalId, payload, user);
  }
}

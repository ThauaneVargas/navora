import { Body, Controller, Get, Param, ParseIntPipe, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { AuthenticatedUser } from '../auth/auth.types';
import { CurrentUser } from '../auth/current-user.decorator';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { OptionalJwtAuthGuard } from '../auth/optional-jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { AccessCheckDto } from './dto/access-check.dto';
import { RoutePreviewDto } from './dto/route-preview.dto';
import { NavigationAccessService } from './navigation-access.service';
import { NavigationRoutingService } from './navigation-routing.service';
import { NavigationService } from './navigation.service';

@Controller('navigation')
export class NavigationController {
  constructor(
    private readonly navigationService: NavigationService,
    private readonly navigationAccessService: NavigationAccessService,
    private readonly navigationRoutingService: NavigationRoutingService,
  ) {}

  @Get('bootstrap')
  bootstrap() {
    return this.navigationService.bootstrap();
  }

  @Get('areas')
  areas() {
    return this.navigationService.areas();
  }

  @Get('destinations')
  destinations() {
    return this.navigationService.destinations();
  }

  @Get('destinations/:destinationId')
  destination(@Param('destinationId', ParseIntPipe) destinationId: number) {
    return this.navigationService.destination(destinationId);
  }

  @Get('map')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN, UserRole.RECEPTION)
  map() {
    return this.navigationService.map();
  }

  @Post('access-check')
  accessCheck(@Body() payload: AccessCheckDto) {
    return this.navigationAccessService.checkAccess(payload);
  }

  @Post('route-preview')
  @UseGuards(OptionalJwtAuthGuard)
  routePreview(@Body() payload: RoutePreviewDto, @CurrentUser() user?: AuthenticatedUser) {
    return this.navigationRoutingService.routePreview(payload, user);
  }
}

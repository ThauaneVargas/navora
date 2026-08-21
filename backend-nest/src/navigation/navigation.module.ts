import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { NavigationController } from './navigation.controller';
import { NavigationAccessService } from './navigation-access.service';
import { NavigationInstructionsService } from './navigation-instructions.service';
import { NavigationRoutingService } from './navigation-routing.service';
import { NavigationService } from './navigation.service';
import { SectorsController } from './sectors.controller';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [NavigationController, SectorsController],
  providers: [NavigationService, NavigationAccessService, NavigationInstructionsService, NavigationRoutingService],
})
export class NavigationModule {}

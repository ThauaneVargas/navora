import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { BeaconsController } from './beacons.controller';
import { BeaconsService } from './beacons.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [BeaconsController],
  providers: [BeaconsService],
})
export class BeaconsModule {}


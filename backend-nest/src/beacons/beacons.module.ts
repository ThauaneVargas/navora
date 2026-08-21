import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { BeaconsController } from './beacons.controller';
import { BeaconsService } from './beacons.service';

@Module({
  imports: [DatabaseModule],
  controllers: [BeaconsController],
  providers: [BeaconsService],
})
export class BeaconsModule {}

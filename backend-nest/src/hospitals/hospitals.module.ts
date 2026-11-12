import { Global, Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { HospitalMiddleware } from './hospital.middleware';
import { HospitalsService } from './hospitals.service';

@Global()
@Module({
  imports: [DatabaseModule],
  providers: [HospitalsService, HospitalMiddleware],
  exports: [HospitalsService, HospitalMiddleware],
})
export class HospitalsModule {}

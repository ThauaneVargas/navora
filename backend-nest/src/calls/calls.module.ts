import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CallsController } from './calls.controller';
import { CallsService } from './calls.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CallsController],
  providers: [CallsService],
  exports: [CallsService],
})
export class CallsModule {}
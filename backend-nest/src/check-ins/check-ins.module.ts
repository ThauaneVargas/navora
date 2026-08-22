import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { CheckInsController } from './check-ins.controller';
import { CheckInsService } from './check-ins.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [CheckInsController],
  providers: [CheckInsService],
})
export class CheckInsModule {}


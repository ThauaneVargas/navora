import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { VisitorAccessController } from './visitor-access.controller';
import { VisitorAccessService } from './visitor-access.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [VisitorAccessController],
  providers: [VisitorAccessService],
  exports: [VisitorAccessService],
})
export class VisitorAccessModule {}


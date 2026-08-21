import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { VisitorAccessController } from './visitor-access.controller';
import { VisitorAccessService } from './visitor-access.service';

@Module({
  imports: [DatabaseModule],
  controllers: [VisitorAccessController],
  providers: [VisitorAccessService],
  exports: [VisitorAccessService],
})
export class VisitorAccessModule {}

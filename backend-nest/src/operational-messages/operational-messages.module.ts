import { Module } from '@nestjs/common';
import { DatabaseModule } from '../database/database.module';
import { OperationalMessagesController } from './operational-messages.controller';
import { OperationalMessagesService } from './operational-messages.service';

@Module({
  imports: [DatabaseModule],
  controllers: [OperationalMessagesController],
  providers: [OperationalMessagesService],
})
export class OperationalMessagesModule {}

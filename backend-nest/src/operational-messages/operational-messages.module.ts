import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module';
import { DatabaseModule } from '../database/database.module';
import { OperationalMessagesController } from './operational-messages.controller';
import { OperationalMessagesService } from './operational-messages.service';

@Module({
  imports: [DatabaseModule, AuthModule],
  controllers: [OperationalMessagesController],
  providers: [OperationalMessagesService],
})
export class OperationalMessagesModule {}


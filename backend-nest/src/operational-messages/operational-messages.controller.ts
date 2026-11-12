import { Body, Controller, Get, Param, ParseIntPipe, Patch, Post, UseGuards } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { Roles } from '../auth/roles.decorator';
import { RolesGuard } from '../auth/roles.guard';
import { HospitalId } from '../hospitals/hospital-id.decorator';
import { CreateOperationalMessageDto } from './dto/create-operational-message.dto';
import { OperationalMessagesService } from './operational-messages.service';

@Controller('operational-messages')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN, UserRole.RECEPTION)
export class OperationalMessagesController {
  constructor(private readonly messagesService: OperationalMessagesService) {}

  @Get()
  list(@HospitalId() hospitalId: number) {
    return this.messagesService.list(hospitalId);
  }

  @Post()
  create(@Body() payload: CreateOperationalMessageDto, @HospitalId() hospitalId: number) {
    return this.messagesService.create(hospitalId, payload);
  }

  @Patch(':messageId/read')
  markRead(@Param('messageId', ParseIntPipe) messageId: number, @HospitalId() hospitalId: number) {
    return this.messagesService.markRead(hospitalId, messageId);
  }
}

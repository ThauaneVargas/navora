import { IsEnum } from 'class-validator';
import { CallStatus } from '@prisma/client';

export class UpdateCallStatusDto {
  @IsEnum(CallStatus)
  status: CallStatus;
}

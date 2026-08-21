import { IsEnum } from 'class-validator';
import { CheckInStatus } from '@prisma/client';

export class UpdateCheckInStatusDto {
  @IsEnum(CheckInStatus)
  status: CheckInStatus;
}

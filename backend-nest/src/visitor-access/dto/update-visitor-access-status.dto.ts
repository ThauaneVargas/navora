import { IsEnum } from 'class-validator';
import { VisitorAccessStatus } from '@prisma/client';

export class UpdateVisitorAccessStatusDto {
  @IsEnum(VisitorAccessStatus)
  status: VisitorAccessStatus;
}

import { AccessSubject } from '@prisma/client';
import { IsEnum, IsInt, IsOptional, IsString } from 'class-validator';

export class AccessCheckDto {
  @IsOptional()
  @IsInt()
  destination_id?: number;

  @IsOptional()
  @IsString()
  destination_code?: string;

  @IsEnum(AccessSubject)
  subject: AccessSubject;

  @IsOptional()
  @IsString()
  current_area_code?: string;

  @IsOptional()
  @IsString()
  current_beacon_code?: string;

  @IsOptional()
  @IsInt()
  visitor_access_request_id?: number;
}

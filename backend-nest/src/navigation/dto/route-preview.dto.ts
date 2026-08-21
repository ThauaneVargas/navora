import { AccessSubject } from '@prisma/client';
import { IsEnum, IsInt, IsObject, IsOptional, IsString } from 'class-validator';

export class RoutePreviewDto {
  @IsString()
  origin_node_code: string;

  @IsString()
  destination_code: string;

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

  @IsOptional()
  @IsObject()
  accessibility?: {
    mobility?: boolean;
    mobilityDifficulty?: boolean;
    wheelchair?: boolean;
    avoidStairs?: boolean;
    preferElevator?: boolean;
    needsStretcher?: boolean;
    voiceGuidance?: boolean;
    largerText?: boolean;
    highContrast?: boolean;
  };
}

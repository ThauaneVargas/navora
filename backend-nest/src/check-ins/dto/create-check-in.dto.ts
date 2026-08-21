import { IsInt, IsOptional, IsString } from 'class-validator';

export class CreateCheckInDto {
  @IsOptional()
  @IsString()
  patient?: string;

  @IsOptional()
  @IsString()
  patient_name?: string;

  @IsOptional()
  @IsString()
  document?: string;

  @IsOptional()
  @IsString()
  destination?: string;

  @IsOptional()
  @IsString()
  destination_label?: string;

  @IsOptional()
  @IsString()
  accessibility?: string;

  @IsOptional()
  @IsString()
  observations?: string;

  @IsOptional()
  @IsInt()
  user_id?: number;

  @IsOptional()
  @IsInt()
  destination_id?: number;

  @IsOptional()
  @IsInt()
  sector_id?: number;

  @IsOptional()
  @IsInt()
  visitor_access_request_id?: number;
}

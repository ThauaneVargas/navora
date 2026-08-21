import { IsEnum, IsOptional, IsString } from 'class-validator';
import { VisitorAccessStatus } from '@prisma/client';

export class CreateVisitorAccessDto {
  @IsOptional()
  @IsString()
  visitor_name = 'Visitante Navora';

  @IsOptional()
  @IsString()
  area = 'private';

  @IsOptional()
  @IsString()
  area_name = 'HMC Private';

  @IsOptional()
  @IsString()
  entrance = 'Entrada pelos fundos';

  @IsOptional()
  @IsString()
  area_id = 'private';

  @IsOptional()
  @IsString()
  entry = 'Entrada Private';

  @IsOptional()
  @IsString()
  current_location = 'Entrada';

  @IsOptional()
  @IsString()
  current_beacon?: string;

  @IsString()
  requested_destination: string;

  @IsOptional()
  @IsString()
  reason = 'Visita';

  @IsOptional()
  @IsString()
  accessibility = 'Nao';

  @IsOptional()
  @IsEnum(VisitorAccessStatus)
  status = VisitorAccessStatus.PENDING;

  @IsOptional()
  @IsString()
  beacon?: string;
}

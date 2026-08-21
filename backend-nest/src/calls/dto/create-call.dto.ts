import { IsEnum, IsOptional, IsString } from 'class-validator';
import { CallType, Priority } from '@prisma/client';

export class CreateCallDto {
  @IsOptional()
  @IsString()
  user_type = 'patient';

  @IsOptional()
  @IsString()
  user_name?: string;

  @IsOptional()
  @IsString()
  area = 'private';

  @IsOptional()
  @IsString()
  area_name = 'HMC Private';

  @IsOptional()
  @IsString()
  patient_name = 'Paciente Navora';

  @IsOptional()
  @IsEnum(CallType)
  call_type = CallType.HELP;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  location = 'Recepcao';

  @IsOptional()
  @IsString()
  sector = 'Entrada Principal';

  @IsOptional()
  @IsString()
  beacon_code?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority = Priority.MEDIUM;
}

import { ArrayMaxSize, IsArray, IsEnum, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CALL_NEEDS } from '../call-codes';
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
  @IsString()
  emergency_contact?: string;

  @IsOptional()
  @IsEnum(Priority)
  priority = Priority.MEDIUM;

  // Telefone para a recepcao ligar de volta.
  @IsOptional()
  @IsString()
  @MaxLength(30)
  caller_phone?: string;

  // O que a equipe precisa levar: cadeira de rodas, maca etc.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CALL_NEEDS.length)
  @IsIn(CALL_NEEDS, { each: true })
  needs?: string[];
}

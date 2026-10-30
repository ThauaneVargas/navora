import { IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { PHONE_PATTERN } from './register-patient.dto';

export class UpdatePatientDto {
  @IsOptional()
  @IsString()
  @MinLength(2)
  name?: string;

  // Obrigatório na conta: pode trocar, não apagar.
  @IsOptional()
  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Telefone invalido (informe DDD + numero)' })
  phone?: string;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContact?: string;
}

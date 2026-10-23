import { Equals, IsDateString, IsEmail, IsObject, IsOptional, IsString, MaxLength, MinLength } from 'class-validator';

export class RegisterPatientDto {
  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(6)
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsString()
  patientCode?: string;

  @IsOptional()
  @IsDateString()
  birthDate?: string;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  emergencyContact?: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  // LGPD: sem o aceite explícito da política (inclui dados de saúde), não cria conta.
  @Equals(true, { message: 'E preciso aceitar a politica de privacidade' })
  acceptedPrivacyPolicy!: boolean;

  @IsString()
  @MaxLength(20)
  privacyPolicyVersion!: string;
}

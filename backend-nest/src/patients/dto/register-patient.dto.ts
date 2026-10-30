import { Equals, IsEmail, IsObject, IsOptional, IsString, Matches, MaxLength, MinLength } from 'class-validator';
import { StrongPassword } from '../../common/strong-password';

// Telefone brasileiro com DDD: 10 ou 11 dígitos, com ou sem máscara.
export const PHONE_PATTERN = /^\D*(\d\D*){10,11}$/;

// Cadastro mínimo (LGPD, 29/10): nome, e-mail, telefone e senha obrigatórios;
// contato de emergência e acessibilidade opcionais. CPF, nascimento e
// observações não existem mais.
export class RegisterPatientDto {
  @IsEmail()
  email!: string;

  @StrongPassword()
  password!: string;

  @IsString()
  @MinLength(2)
  name!: string;

  @IsString()
  @Matches(PHONE_PATTERN, { message: 'Telefone invalido (informe DDD + numero)' })
  phone!: string;

  @IsOptional()
  @IsObject()
  accessibility?: Record<string, boolean>;

  @IsOptional()
  @IsString()
  @MaxLength(120)
  emergencyContact?: string;

  // LGPD: sem o aceite explícito da política (inclui dados de saúde), não cria conta.
  @Equals(true, { message: 'E preciso aceitar a politica de privacidade' })
  acceptedPrivacyPolicy!: boolean;

  @IsString()
  @MaxLength(20)
  privacyPolicyVersion!: string;
}

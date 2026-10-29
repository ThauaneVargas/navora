import { IsEmail, IsOptional, IsString, MaxLength } from 'class-validator';
import { StrongPassword } from '../../common/strong-password';

export class ResetPasswordDto {
  // E-mail da conta: o codigo de 6 digitos so vale junto com ele (e conta
  // tentativas por conta). Opcional so por compatibilidade com o app antigo.
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsString()
  @MaxLength(128)
  token: string;

  @StrongPassword()
  newPassword: string;
}

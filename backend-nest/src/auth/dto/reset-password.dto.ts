import { IsString } from 'class-validator';
import { StrongPassword } from '../../common/strong-password';

export class ResetPasswordDto {
  @IsString()
  token: string;

  @StrongPassword()
  newPassword: string;
}

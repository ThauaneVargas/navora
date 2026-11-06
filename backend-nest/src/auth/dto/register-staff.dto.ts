import { IsEmail, IsEnum, IsString } from 'class-validator';
import { StrongPassword } from '../../common/strong-password';

export enum StaffRole {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
}

export class RegisterStaffDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @StrongPassword()
  password: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}

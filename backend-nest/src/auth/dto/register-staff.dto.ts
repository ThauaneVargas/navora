import { IsEmail, IsEnum, IsString, MinLength } from 'class-validator';

export enum StaffRole {
  ADMIN = 'ADMIN',
  RECEPTION = 'RECEPTION',
}

export class RegisterStaffDto {
  @IsString()
  name: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(StaffRole)
  role: StaffRole;
}

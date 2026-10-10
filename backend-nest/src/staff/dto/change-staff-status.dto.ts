import { IsOptional, IsString, MaxLength } from 'class-validator';

export class ChangeStaffStatusDto {
  @IsOptional()
  @IsString()
  @MaxLength(300)
  reason?: string;
}

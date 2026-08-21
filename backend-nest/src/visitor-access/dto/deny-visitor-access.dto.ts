import { IsOptional, IsString } from 'class-validator';

export class DenyVisitorAccessDto {
  @IsOptional()
  @IsString()
  denial_reason = 'Orientar presencialmente na recepcao';

  @IsOptional()
  @IsString()
  deniedReason?: string;
}

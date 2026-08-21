import { IsOptional, IsString } from 'class-validator';

export class AdminReportDto {
  @IsOptional()
  @IsString()
  period?: string;

  @IsOptional()
  @IsString()
  from?: string;

  @IsOptional()
  @IsString()
  to?: string;
}

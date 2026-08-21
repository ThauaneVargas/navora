import { IsOptional, IsString } from 'class-validator';

export class CreateOperationalMessageDto {
  @IsOptional()
  @IsString()
  to?: string;

  @IsOptional()
  @IsString()
  recipient?: string;

  @IsOptional()
  @IsString()
  message?: string;

  @IsOptional()
  @IsString()
  content?: string;

  @IsOptional()
  @IsString()
  priority?: string;
}

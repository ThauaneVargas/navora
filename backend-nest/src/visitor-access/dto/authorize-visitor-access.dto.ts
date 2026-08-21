import { IsNumber, IsOptional, IsString } from 'class-validator';

export class AuthorizeVisitorAccessDto {
  @IsOptional()
  @IsString()
  release_type = 'Liberar rota ate o destino';

  @IsOptional()
  @IsString()
  release_time = '30 minutos';

  @IsOptional()
  @IsNumber()
  permissionMinutes?: number;

  @IsOptional()
  @IsNumber()
  permission_minutes?: number;

  @IsOptional()
  @IsString()
  authorizedRoute?: string;

  @IsOptional()
  @IsString()
  authorized_route?: string;

  @IsOptional()
  @IsString()
  allowed_route?: string;
}

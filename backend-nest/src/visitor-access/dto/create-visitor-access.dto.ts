import { ArrayMaxSize, IsArray, IsEnum, IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';
import { VisitorAccessStatus } from '@prisma/client';

export class CreateVisitorAccessDto {
  @IsOptional()
  @IsString()
  visitor_name = 'Visitante Navora';

  @IsOptional()
  @IsString()
  area = 'private';

  @IsOptional()
  @IsString()
  area_name = 'HMC Private';

  @IsOptional()
  @IsString()
  entrance = 'Entrada pelos fundos';

  @IsOptional()
  @IsString()
  area_id = 'private';

  @IsOptional()
  @IsString()
  entry = 'Entrada Private';

  @IsOptional()
  @IsString()
  current_location = 'Entrada';

  @IsOptional()
  @IsString()
  current_beacon?: string;

  @IsString()
  requested_destination: string;

  @IsOptional()
  @IsString()
  reason = 'Visita';

  @IsOptional()
  @IsString()
  accessibility = 'Nao';

  // Aceito so por compatibilidade com versoes antigas do app; o backend
  // sempre cria o pedido como PENDING.
  @IsOptional()
  @IsEnum(VisitorAccessStatus)
  status?: VisitorAccessStatus;

  @IsOptional()
  @IsString()
  beacon?: string;

  // Acompanhantes: [{ name, type }]. O service guarda so esses dois campos.
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(10)
  companions?: Array<{ name?: string; type?: string }>;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(11)
  group_total?: number;

  @IsOptional()
  @IsString()
  @MaxLength(20)
  visit_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(200)
  assistance_request?: string;
}

import { Transform } from 'class-transformer';
import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

const trim = ({ value }: { value: unknown }) => (typeof value === 'string' ? value.trim() : value);

// Endpoint publico usado pelo app do visitante.
// - Nao aceita `status`: todo pedido nasce PENDING e so a recepcao decide (antes era
//   possivel criar um pedido ja APPROVED e liberar area restrita sem autorizacao).
// - Campos de area/entrada nao tem valor padrao aqui; o service resolve o padrao a
//   partir da area informada. Com padrao no DTO, `area: 'sus'` virava 'private'.
export class CreateVisitorAccessDto {
  @Transform(trim)
  @IsString()
  @IsNotEmpty({ message: 'Nome do visitante e obrigatorio' })
  visitor_name: string;

  @IsOptional()
  @IsString()
  area?: string;

  @IsOptional()
  @IsString()
  area_name?: string;

  @IsOptional()
  @IsString()
  entrance?: string;

  @IsOptional()
  @IsString()
  area_id?: string;

  @IsOptional()
  @IsString()
  entry?: string;

  @IsOptional()
  @IsString()
  current_location?: string;

  @IsOptional()
  @IsString()
  current_beacon?: string;

  @Transform(trim)
  @IsString()
  @IsNotEmpty()
  requested_destination: string;

  @IsOptional()
  @IsString()
  reason?: string;

  @IsOptional()
  @IsString()
  accessibility?: string;

  @IsOptional()
  @IsString()
  beacon?: string;
}

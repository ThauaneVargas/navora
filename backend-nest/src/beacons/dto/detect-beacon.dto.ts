import { IsInt, IsOptional, IsString, Max, MaxLength, Min } from 'class-validator';

// Duas formas de identificar o beacon (se vierem as duas, o código vence):
// - beaconCode / beacon_code: código interno (ex.: "FSC-01");
// - uuid + major + minor: o que o celular lê no pacote iBeacon.
export class DetectBeaconDto {
  @IsOptional()
  @IsString()
  beaconCode?: string;

  @IsOptional()
  @IsString()
  beacon_code?: string;

  @IsOptional()
  @IsString()
  @MaxLength(64)
  uuid?: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  major?: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(65535)
  minor?: number;

  // Intensidade do sinal lida pelo celular (dBm, negativo). Só registrada em log.
  @IsOptional()
  @IsInt()
  @Min(-127)
  @Max(20)
  rssi?: number;
}

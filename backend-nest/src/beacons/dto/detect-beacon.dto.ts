import { IsOptional, IsString } from 'class-validator';

export class DetectBeaconDto {
  @IsOptional()
  @IsString()
  beaconCode?: string;

  @IsOptional()
  @IsString()
  beacon_code?: string;
}

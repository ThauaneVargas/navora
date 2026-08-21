import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateAccessibilityDto {
  @IsOptional()
  @IsBoolean()
  wheelchair?: boolean;

  @IsOptional()
  @IsBoolean()
  avoidStairs?: boolean;

  @IsOptional()
  @IsBoolean()
  preferElevator?: boolean;

  @IsOptional()
  @IsBoolean()
  voiceGuidance?: boolean;

  @IsOptional()
  @IsBoolean()
  largerText?: boolean;

  @IsOptional()
  @IsBoolean()
  highContrast?: boolean;

  @IsOptional()
  @IsBoolean()
  needsStretcher?: boolean;

  @IsOptional()
  @IsBoolean()
  mobilityDifficulty?: boolean;
}

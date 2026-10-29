import { ArrayMaxSize, IsArray, IsIn, IsOptional, IsString, MaxLength } from 'class-validator';
import { CALL_PROBLEMS } from '../call-codes';

// O que a pessoa marca DEPOIS de enviar o SOS ("O que esta acontecendo?").
export class UpdateCallDetailsDto {
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(CALL_PROBLEMS.length)
  @IsIn(CALL_PROBLEMS, { each: true })
  problems?: string[];

  @IsOptional()
  @IsString()
  @MaxLength(200)
  problem_note?: string;
}

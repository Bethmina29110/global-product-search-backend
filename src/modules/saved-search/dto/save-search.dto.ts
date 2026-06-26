import { IsString, IsNumber } from 'class-validator';

export class SaveSearchDto {
  @IsString()
  query!: string;

  @IsString()
  type!: string;

  @IsNumber()
  matchesCount!: number;
}

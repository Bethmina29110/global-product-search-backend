import { IsString, IsOptional, IsNumber } from 'class-validator';

export class SaveFavouriteDto {
  @IsString()
  title!: string;

  @IsOptional()
  @IsString()
  price?: string;

  @IsOptional()
  @IsString()
  imageUrl?: string;

  @IsOptional()
  @IsString()
  store?: string;

  @IsOptional()
  @IsString()
  productUrl?: string;

  @IsOptional()
  @IsNumber()
  rating?: number;

  @IsOptional()
  @IsString()
  category?: string;

  @IsOptional()
  @IsString()
  summary?: string;
}

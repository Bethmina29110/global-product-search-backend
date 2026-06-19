import { Expose, Type } from 'class-transformer';

export class TopRecommendationDto {
  @Expose()
  title!: string;

  @Expose()
  reason!: string;

  @Expose()
  score!: number;
}

export class ProductRecommendationDto {
  @Expose()
  title!: string;

  @Expose()
  imageUrl!: string;

  @Expose()
  price!: string | number;

  @Expose()
  rating!: number;

  @Expose()
  store!: string;

  @Expose()
  productUrl!: string;

  @Expose()
  confidence!: number;

  @Expose()
  summary!: string;

  @Expose()
  score!: number;
}

export class SearchRecommendationResponseDto {
  @Expose()
  query!: string;

  @Expose()
  @Type(() => TopRecommendationDto)
  topRecommendation!: TopRecommendationDto;

  @Expose()
  @Type(() => ProductRecommendationDto)
  products!: ProductRecommendationDto[];
}

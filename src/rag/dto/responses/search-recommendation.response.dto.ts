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
  summary!: string;

  @Expose()
  score!: number;
}

export class SourceDto {
  @Expose()
  title!: string;

  @Expose()
  url!: string;
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

  @Expose()
  @Type(() => SourceDto)
  sources!: SourceDto[];
}

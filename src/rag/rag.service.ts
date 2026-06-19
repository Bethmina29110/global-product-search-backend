import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { GeminiService } from '../ai/gemini.service';
import { SearchRecommendationResponseDto } from './dto/responses/search-recommendation.response.dto';

@Injectable()
export class RagService {
  constructor(
    private readonly searchService: SearchService,
    private readonly geminiService: GeminiService,
  ) {}

  async search(query: string): Promise<SearchRecommendationResponseDto> {
    const searchResults = await this.searchService.search(query);
    
    const structuredProducts = searchResults.results || [];
    
    // AI evaluates the pre-structured SerpApi products
    const extractedData = await this.geminiService.extractProducts(query, structuredProducts);

    return {
      query,
      topRecommendation: extractedData.topRecommendation,
      products: extractedData.products || [],
    };
  }
}

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
    
    const rawProducts = searchResults.results || [];
    
    // Extract structured JSON from Gemini
    const extractedData = await this.geminiService.extractProducts(query, rawProducts);

    // Map sources directly from Tavily results
    const sources = rawProducts.map((p: any) => ({
      title: p.title,
      url: p.source || p.url,
    }));

    return {
      query,
      topRecommendation: extractedData.topRecommendation,
      products: extractedData.products || [],
      sources,
    };
  }
}

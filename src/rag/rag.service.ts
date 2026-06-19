import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { AiService } from '../ai/ai.service';

@Injectable()
export class RagService {
  constructor(
    private readonly searchService: SearchService,
    private readonly aiService: AiService,
  ) {}

  async search(query: string) {
    const searchResults = this.searchService.search(query);
    
    const products = searchResults.results || [];
    
    const aiResponse = await this.aiService.generateAnswer(query, products);

    return {
      query,
      topRecommendation: aiResponse.topRecommendation,
      products: aiResponse.products,
    };
  }
}

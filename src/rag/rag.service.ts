import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { GeminiService } from '../ai/gemini.service';
import { SearchRecommendationResponseDto } from './dto/responses/search-recommendation.response.dto';

@Injectable()
export class RagService {
  constructor(
    private readonly searchService: SearchService,
    private readonly geminiService: GeminiService,
  ) { }

  async search(query: string, page: number = 1, limit: number = 10): Promise<SearchRecommendationResponseDto> {
    const searchResults = await this.searchService.search(query, page, limit);

    let structuredProducts = searchResults.results || [];

    // Heuristic pre-filtering
    const lowerQuery = query.toLowerCase();
    if (lowerQuery.includes('gaming')) {
      structuredProducts = structuredProducts.filter((p: any) => {
        const title = p.title.toLowerCase();
        return !title.includes('chromebook') &&
          !title.includes('ideapad slim') &&
          !title.includes('business') &&
          !title.includes('office');
      });
    }

    // AI evaluates the pre-structured SerpApi products
    const extractedData = await this.geminiService.extractProducts(query, structuredProducts);

    let finalProducts = extractedData.products || [];

    // Merge guaranteed data directly from SerpApi search results
    finalProducts = finalProducts.map((aiProduct: any) => {
      const originalProduct = structuredProducts.find((p: any) => p.title === aiProduct.title);

      if (!originalProduct) {
        console.log('\n--- Title Mismatch Detected ---');
        console.log('AI Title:', aiProduct.title);
        console.log('Available Titles:', structuredProducts.map((p: any) => p.title));
      } else {
        console.log('\n--- Matched Product ---');
        console.log(JSON.stringify(originalProduct, null, 2));
      }

      return {
        ...aiProduct,
        productUrl: originalProduct?.productUrl || originalProduct?.link || '',
        imageUrl: originalProduct?.imageUrl || '',
        price: originalProduct?.price || '',
        rating: originalProduct?.rating || null,
        store: originalProduct?.store || '',
      };
    });


    // Sort by score descending and limit to top 10
    finalProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));
    finalProducts = finalProducts.slice(0, 10);

    return {
      query,
      meta: {
        page,
        limit,
      },
      topRecommendation: extractedData.topRecommendation || {
        title: finalProducts[0]?.title || 'No products found',
        reason: 'Top organic result (AI fallback).',
        score: finalProducts[0]?.score || 0
      },
      products: finalProducts,
    };
  }
}

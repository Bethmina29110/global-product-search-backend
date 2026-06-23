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

  async search(query: string): Promise<SearchRecommendationResponseDto> {
    const searchResults = await this.searchService.search(query);

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

    let extractedData: any = null;
    let finalProducts: any[] = [];

    try {
      // AI evaluates the pre-structured SerpApi products
      extractedData = await this.geminiService.extractProducts(query, structuredProducts);
      finalProducts = extractedData.products || [];
    } catch (error: any) {
      console.warn('Gemini AI failed, falling back to raw search results:', error.message);
      
      // Fallback: Mock the AI fields so the app doesn't crash
      finalProducts = structuredProducts.map((p: any, index: number) => ({
        title: p.title,
        category: 'Uncategorized (AI Fallback)',
        specs: {},
        confidence: Math.max(1, 100 - (index * 5)),
        summary: 'AI temporarily unavailable. Showing raw organic search results.',
        score: Math.max(1, 10 - index)
      }));

      extractedData = {
        topRecommendation: {
          title: finalProducts[0]?.title || 'No products found',
          reason: 'Top organic result (AI Fallback).',
          score: finalProducts[0]?.score || 0
        },
        products: finalProducts
      };
    }

    // Helper function to dynamically build a search link using the store name and product title
    const generateStoreLink = (store: string, title: string) => {
      const query = encodeURIComponent(title);
      const storeName = (store || '').toLowerCase();
      
      // INDUSTRY STANDARD: You must map the unique search paths for major retailers
      if (storeName.includes('amazon')) return `https://www.amazon.com/s?k=${query}`;
      if (storeName.includes('walmart')) return `https://www.walmart.com/search?q=${query}`;
      if (storeName.includes('best buy') || storeName.includes('bestbuy')) return `https://www.bestbuy.com/site/searchpage.jsp?st=${query}`;
      if (storeName.includes('target')) return `https://www.target.com/s?searchTerm=${query}`;
      if (storeName.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${query}`;
      if (storeName.includes('h&m') || storeName.includes('hm')) return `https://www2.hm.com/en_us/search-results.html?q=${query}`;
      if (storeName.includes('dick')) return `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${query}`;
      if (storeName.includes('old navy')) return `https://oldnavy.gap.com/browse/search.do?searchText=${query}`;
      if (storeName.includes('gap')) return `https://www.gap.com/browse/search.do?searchText=${query}`;
      if (storeName.includes('foot locker')) return `https://www.footlocker.com/search?query=${query}`;
      if (storeName.includes('michaels')) return `https://www.michaels.com/search?q=${query}`;

      // If we don't know the exact search URL format for this specific store, fallback to Google Search
      return `https://www.google.com/search?q=${encodeURIComponent(store + ' ' + title)}`;
    };

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

      const store = originalProduct?.store || 'Amazon';
      const title = originalProduct?.title || aiProduct.title;

      return {
        ...aiProduct,
        productUrl: generateStoreLink(store, title),
        imageUrl: originalProduct?.imageUrl || '',
        price: originalProduct?.price || '',
        rating: originalProduct?.rating || null,
        store: store,
      };
    });


    // Sort by score descending
    finalProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    return {
      query,
      meta: {
        page: 1,
        limit: finalProducts.length,
        total: searchResults.total || 0,
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

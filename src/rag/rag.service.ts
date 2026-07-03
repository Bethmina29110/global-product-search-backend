import { Injectable, Logger } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { GeminiService } from '../ai/gemini.service';
import { RankingService } from '../ranking/ranking.service';
import { SearchRecommendationResponseDto } from './dto/responses/search-recommendation.response.dto';

@Injectable()
export class RagService {
  private readonly logger = new Logger(RagService.name);

  constructor(
    private readonly searchService: SearchService,
    private readonly geminiService: GeminiService,
    private readonly rankingService: RankingService,
  ) { }

  async search(query: string, userId?: number): Promise<SearchRecommendationResponseDto> {
    // Step 1: Retrieve all products from Search Module (multi-page, deduped)
    const searchResults = await this.searchService.search(query, userId);
    const allProducts = searchResults.results || [];

    this.logger.log(`Search Module returned ${allProducts.length} products for query: "${query}"`);

    // Step 2: Semantic Ranking — delegate to Ranking Module (replaces hardcoded slice)
    const { top: top15, rest: remainingProducts } = await this.rankingService.rankProducts(query, allProducts, 15) as any;

    // Step 3: AI Module enriches the top 15 semantically ranked products
    let extractedData: any = null;
    let aiProducts: any[] = [];

    try {
      extractedData = await this.geminiService.extractProducts(query, top15);
      aiProducts = extractedData.products || [];
    } catch (error: any) {
      this.logger.error('🔴 GEMINI AI FAILED — falling back to raw top 15');
      this.logger.error(`Error: ${error.message}`);

      // Fallback: use placeholder fields so the frontend never crashes
      aiProducts = top15.map((p: any, index: number) => ({
        title: p.title,
        category: 'Uncategorized (AI Fallback)',
        specifications: {},
        confidence: Math.max(1, 100 - (index * 5)),
        summary: 'AI temporarily unavailable. Showing raw organic search results.',
        reasoning: 'AI processing failed. This product is ranked by semantic similarity.',
        score: Math.max(1, 15 - index),
      }));

      extractedData = {
        topRecommendation: {
          title: aiProducts[0]?.title || 'No products found',
          reason: 'Top semantic result (AI Fallback).',
          score: aiProducts[0]?.score || 0,
        },
        products: aiProducts,
      };
    }

    // Step 4: Map remaining products with placeholder fields (not processed by AI)
    const defaultRemainingProducts = remainingProducts.map((p: any) => ({
      title: p.title,
      category: 'General',
      specifications: {},
      confidence: 30,
      summary: 'Standard search result — not evaluated by AI.',
      reasoning: '',
      score: 1,
    }));

    // Step 5: Merge AI-enriched top 15 with the raw remaining products
    let finalProducts = [...aiProducts, ...defaultRemainingProducts];

    // Step 6: Enrich all products with real data from the original SerpApi response
    const generateStoreLink = (store: string, title: string) => {
      const encodedTitle = encodeURIComponent(title);
      const storeName = (store || '').toLowerCase();

      if (storeName.includes('amazon')) return `https://www.amazon.com/s?k=${encodedTitle}`;
      if (storeName.includes('walmart')) return `https://www.walmart.com/search?q=${encodedTitle}`;
      if (storeName.includes('best buy') || storeName.includes('bestbuy')) return `https://www.bestbuy.com/site/searchpage.jsp?st=${encodedTitle}`;
      if (storeName.includes('target')) return `https://www.target.com/s?searchTerm=${encodedTitle}`;
      if (storeName.includes('ebay')) return `https://www.ebay.com/sch/i.html?_nkw=${encodedTitle}`;
      if (storeName.includes('h&m') || storeName.includes('hm')) return `https://www2.hm.com/en_us/search-results.html?q=${encodedTitle}`;
      if (storeName.includes('dick')) return `https://www.dickssportinggoods.com/search/SearchDisplay?searchTerm=${encodedTitle}`;
      if (storeName.includes('old navy')) return `https://oldnavy.gap.com/browse/search.do?searchText=${encodedTitle}`;
      if (storeName.includes('gap')) return `https://www.gap.com/browse/search.do?searchText=${encodedTitle}`;
      if (storeName.includes('foot locker')) return `https://www.footlocker.com/search?query=${encodedTitle}`;
      if (storeName.includes('michaels')) return `https://www.michaels.com/search?q=${encodedTitle}`;

      return `https://www.google.com/search?q=${encodeURIComponent(store + ' ' + title)}`;
    };

    finalProducts = finalProducts.map((aiProduct: any) => {
      const original = allProducts.find((p: any) => p.title === aiProduct.title);
      const store = original?.store || 'Amazon';
      const title = original?.title || aiProduct.title;

      return {
        ...aiProduct,
        // Normalize specs/specifications field
        specifications: aiProduct.specifications || aiProduct.specs || {},
        productUrl: generateStoreLink(store, title),
        imageUrl: original?.imageUrl || '',
        price: original?.price || '',
        rating: original?.rating || null,
        store,
      };
    });

    // Step 7: Sort final list by score descending
    finalProducts.sort((a: any, b: any) => (b.score || 0) - (a.score || 0));

    this.logger.log(`RAG search complete. Returning ${finalProducts.length} products.`);

    return {
      query,
      meta: {
        page: 1,
        limit: finalProducts.length,
        total: searchResults.total || 0,
      },
      topRecommendation: extractedData.topRecommendation || {
        title: finalProducts[0]?.title || 'No products found',
        reason: 'Top semantic result (AI fallback).',
        score: finalProducts[0]?.score || 0,
      },
      products: finalProducts,
    };
  }
}

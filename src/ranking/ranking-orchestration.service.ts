import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';
import { RankingService } from './ranking.service';

@Injectable()
export class RankingOrchestrationService {
  constructor(
    private readonly searchService: SearchService,
    private readonly rankingService: RankingService,
  ) {}

  async searchAndRank(query: string, topN = 15) {
    // Step 1: Fetch all products from Search Module
    const searchResults = await this.searchService.search(query);
    const allProducts = searchResults.results || [];

    // Step 2: Rank all products by semantic similarity
    const { top, rest } = await this.rankingService.rankProducts(query, allProducts, topN) as any;

    return {
      query,
      total: allProducts.length,
      topCount: top.length,
      remainingCount: rest.length,
      topProducts: top.map((p: any) => ({
        title: p.title,
        store: p.store || null,
        price: p.price || null,
        rating: p.rating || null,
        imageUrl: p.imageUrl || null,
        similarityScore: parseFloat((p._similarityScore || 0).toFixed(4)),
      })),
      remainingProducts: rest.map((p: any) => ({
        title: p.title,
        store: p.store || null,
        price: p.price || null,
        similarityScore: parseFloat((p._similarityScore || 0).toFixed(4)),
      })),
    };
  }
}

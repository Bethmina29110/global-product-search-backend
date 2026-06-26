import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';
import { PrismaService } from '../infrastructure/database/prisma.service';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  constructor(private prisma: PrismaService) {}

  async search(query: string, userId?: number) {
    const startTime = performance.now();
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey || apiKey === 'your_serpapi_key_here') {
      this.logger.error('SERPAPI_API_KEY not found or invalid in environment variables.');
      throw new InternalServerErrorException('Search service is not configured properly.');
    }

    try {
      let allRawResults: any[] = [];
      const MAX_PAGES = 5; // Prevent infinite loops
      let pageCount = 1;
      let nextUrl: string | null = null;
      let total = 0;

      // 1. Initial Google Shopping search request
      this.logger.log(`Fetching page ${pageCount} for query: "${query}"`);
      let response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_shopping',
          q: query,
          api_key: apiKey,
        }
      });

      if (response.data.shopping_results) {
        allRawResults.push(...response.data.shopping_results);
      }

      // Extract total results from first page
      if (response.data.search_information && response.data.search_information.total_results) {
        total = response.data.search_information.total_results;
      } else if (response.data.serpapi_pagination && response.data.serpapi_pagination.total) {
        total = response.data.serpapi_pagination.total;
      }

      nextUrl = response.data.serpapi_pagination?.next || null;

      // 2. Loop through subsequent pages
      while (nextUrl && pageCount < MAX_PAGES) {
        pageCount++;
        this.logger.log(`Fetching page ${pageCount} for query: "${query}"`);
        
        try {
          // The next URL from SerpApi often contains the full required URL
          response = await axios.get(nextUrl, {
            params: { api_key: apiKey }
          });

          if (response.data.shopping_results) {
            allRawResults.push(...response.data.shopping_results);
          }

          nextUrl = response.data.serpapi_pagination?.next || null;
        } catch (pageError: any) {
          // Graceful handling of failed page requests
          this.logger.warn(`Failed to fetch page ${pageCount}: ${pageError.message}. Continuing with accumulated results.`);
          break;
        }
      }

      // 3. Deduplicate by product_id
      const uniqueResultsMap = new Map();
      for (const item of allRawResults) {
        // Fallback to title if product_id is somehow missing
        const key = item.product_id || item.title;
        if (key && !uniqueResultsMap.has(key)) {
          uniqueResultsMap.set(key, item);
        }
      }
      const uniqueRawResults = Array.from(uniqueResultsMap.values());
      
      this.logger.log(`Retrieved ${allRawResults.length} items across ${pageCount} pages. After deduplication: ${uniqueRawResults.length} unique items.`);

      // 4. Normalize results
      const normalizedResults = uniqueRawResults.map((result: any) => ({
        title: result.title,
        price: result.price || result.extracted_price,
        rating: result.rating || null,
        imageUrl: result.thumbnail,
        store: result.source,
        productUrl: result.product_link || result.link || '',
      }));

      // Fallback total if still 0
      if (!total) {
        total = normalizedResults.length;
      }

      const latencyMs = Math.round(performance.now() - startTime);
      
      // Log search asynchronously
      this.prisma.searchLog.create({
        data: {
          query,
          latencyMs,
          userId: userId || null,
        }
      }).catch(err => this.logger.error(`Failed to log search: ${err.message}`));

      return {
        query,
        results: normalizedResults,
        total,
      };
    } catch (error: any) {
      this.logger.error(`SerpApi search failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve search results.');
    }
  }
}

import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  async search(query: string) {
    const apiKey = process.env.SERPAPI_API_KEY;
    
    if (!apiKey || apiKey === 'your_serpapi_key_here') {
      this.logger.error('SERPAPI_API_KEY not found or invalid in environment variables.');
      throw new InternalServerErrorException('Search service is not configured properly.');
    }

    try {
      // Use SerpApi Google Shopping engine
      const response = await axios.get('https://serpapi.com/search.json', {
        params: {
          engine: 'google_shopping',
          q: query,
          api_key: apiKey,
          num: 15, // Limit to 15 results to save context window
        }
      });

      if (!response.data.shopping_results) {
        return { query, results: [] };
      }

      // Map SerpApi results to our structured format
      const normalizedResults = response.data.shopping_results.map((result: any) => ({
        title: result.title,
        price: result.price || result.extracted_price, // fallback if price string is missing
        rating: result.rating || null,
        imageUrl: result.thumbnail,
        store: result.source,
        productUrl: result.link,
      }));

      return {
        query,
        results: normalizedResults,
      };
    } catch (error: any) {
      this.logger.error(`SerpApi search failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve search results.');
    }
  }
}

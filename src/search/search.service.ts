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
        productUrl: result.product_link || result.link || '',
      }));

      // Extract total results if available, otherwise just use a fallback or the length of current results
      let total = 0;
      if (response.data.search_information && response.data.search_information.total_results) {
        total = response.data.search_information.total_results;
      } else if (response.data.serpapi_pagination && response.data.serpapi_pagination.total) {
        total = response.data.serpapi_pagination.total;
      } else {
        total = normalizedResults.length; // fallback
      }

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

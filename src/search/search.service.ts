import { Injectable, Logger, InternalServerErrorException } from '@nestjs/common';
import axios from 'axios';

@Injectable()
export class SearchService {
  private readonly logger = new Logger(SearchService.name);

  async search(query: string) {
    const apiKey = process.env.TAVILY_API_KEY;
    
    if (!apiKey) {
      this.logger.error('TAVILY_API_KEY not found in environment variables.');
      throw new InternalServerErrorException('Search service is not configured properly.');
    }

    try {
      const response = await axios.post('https://api.tavily.com/search', {
        api_key: apiKey,
        query: query,
        search_depth: 'basic',
        include_answer: false,
      });

      // Normalize Search Results
      const normalizedResults = response.data.results.map((result: any, index: number) => ({
        title: result.title,
        price: 999 - (index * 50), // Mock price since Tavily provides raw web results
        source: result.url,
        content: result.content,
      }));

      return {
        query,
        results: normalizedResults,
      };
    } catch (error: any) {
      this.logger.error(`Tavily search failed: ${error.message}`);
      throw new InternalServerErrorException('Failed to retrieve search results.');
    }
  }
}

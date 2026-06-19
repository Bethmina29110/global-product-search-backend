import { Injectable } from '@nestjs/common';
import { SearchService } from '../search/search.service';

@Injectable()
export class RagService {
  constructor(
    private readonly searchService: SearchService,
  ) {}

  async search(query: string) {
    const searchResults = this.searchService.search(query);

    return {
      query,
      retrievedResults: searchResults,
    };
  }
}

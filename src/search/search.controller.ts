import { Controller, Get, Query } from '@nestjs/common';
import { SearchService } from './search.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('search')
export class SearchController {
  constructor(private readonly searchService: SearchService) {}

  @Get()
  search(
    @Query('q') query: string,
    @CurrentUser() user: any
  ) {
    const userId = user?.sub ? Number(user.sub) : undefined;
    return this.searchService.search(query, userId);
  }
}

import { Body, Controller, Post, Query } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  search(
    @Body() body: { query: string; page?: number; limit?: number },
    @Query('page') queryPage?: string,
    @Query('limit') queryLimit?: string
  ) {
    // Read from query params first, fallback to body, then default
    const page = queryPage ? parseInt(queryPage, 10) : (body.page || 1);
    const limit = queryLimit ? parseInt(queryLimit, 10) : (body.limit || 10);
    
    return this.ragService.search(body.query, page, limit);
  }
}

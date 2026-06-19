import { Body, Controller, Post } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  search(@Body() body: { query: string; page?: number; limit?: number }) {
    return this.ragService.search(body.query, body.page || 1, body.limit || 10);
  }
}

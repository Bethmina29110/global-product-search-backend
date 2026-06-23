import { Body, Controller, Post, Query } from '@nestjs/common';
import { RagService } from './rag.service';

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  search(@Body() body: { query: string }) {
    return this.ragService.search(body.query);
  }
}

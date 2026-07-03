import { Body, Controller, Post, Query } from '@nestjs/common';
import { RagService } from './rag.service';
import { CurrentUser } from '../common/decorators/current-user.decorator';

@Controller('rag')
export class RagController {
  constructor(
    private readonly ragService: RagService,
  ) {}

  @Post('search')
  search(
    @Body() body: { query: string },
    @CurrentUser() user: any
  ) {
    const userId = user?.sub ? Number(user.sub) : undefined;
    return this.ragService.search(body.query, userId);
  }
}

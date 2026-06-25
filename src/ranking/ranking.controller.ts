import { Controller, Post, Body } from '@nestjs/common';
import { RankingOrchestrationService } from './ranking-orchestration.service';

@Controller('ranking')
export class RankingController {
  constructor(private readonly rankingOrchestrationService: RankingOrchestrationService) {}

  @Post('search')
  async search(@Body() body: { query: string; topN?: number }) {
    return this.rankingOrchestrationService.searchAndRank(body.query, body.topN || 15);
  }
}

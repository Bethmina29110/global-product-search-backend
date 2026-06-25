import { Module } from '@nestjs/common';
import { RankingService } from './ranking.service';
import { RankingController } from './ranking.controller';
import { RankingOrchestrationService } from './ranking-orchestration.service';
import { SearchModule } from '../search/search.module';

@Module({
  imports: [SearchModule],
  providers: [RankingService, RankingOrchestrationService],
  controllers: [RankingController],
  exports: [RankingService],
})
export class RankingModule {}

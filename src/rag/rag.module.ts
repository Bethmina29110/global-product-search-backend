import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { AiModule } from '../ai/ai.module';
import { RankingModule } from '../ranking/ranking.module';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [SearchModule, AiModule, RankingModule],
  providers: [RagService],
  controllers: [RagController]
})
export class RagModule {}

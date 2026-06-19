import { Module } from '@nestjs/common';
import { SearchModule } from '../search/search.module';
import { RagService } from './rag.service';
import { RagController } from './rag.controller';

@Module({
  imports: [SearchModule],
  providers: [RagService],
  controllers: [RagController]
})
export class RagModule {}

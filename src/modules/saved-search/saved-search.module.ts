import { Module } from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import { SavedSearchController } from './saved-search.controller';

@Module({
  controllers: [SavedSearchController],
  providers: [SavedSearchService],
  exports: [SavedSearchService],
})
export class SavedSearchModule {}

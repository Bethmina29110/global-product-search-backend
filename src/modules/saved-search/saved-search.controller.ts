import {
  Controller,
  Post,
  Get,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { SavedSearchService } from './saved-search.service';
import { SaveSearchDto } from './dto/save-search.dto';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('saved-search')
export class SavedSearchController {
  constructor(private readonly savedSearchService: SavedSearchService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  save(@CurrentUser() user: any, @Body() dto: SaveSearchDto) {
    return this.savedSearchService.save(Number(user.sub), dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.savedSearchService.findAll(Number(user.sub));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.savedSearchService.delete(Number(user.sub), id);
  }
}

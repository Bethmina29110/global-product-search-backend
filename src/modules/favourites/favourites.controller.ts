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
import { FavouritesService } from './favourites.service';
import { SaveFavouriteDto } from './dto/save-favourite.dto';
import { CurrentUser } from '@common/decorators/current-user.decorator';

@Controller('favourites')
export class FavouritesController {
  constructor(private readonly favouritesService: FavouritesService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  save(@CurrentUser() user: any, @Body() dto: SaveFavouriteDto) {
    return this.favouritesService.save(Number(user.sub), dto);
  }

  @Get()
  findAll(@CurrentUser() user: any) {
    return this.favouritesService.findAll(Number(user.sub));
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  delete(@CurrentUser() user: any, @Param('id', ParseIntPipe) id: number) {
    return this.favouritesService.delete(Number(user.sub), id);
  }
}

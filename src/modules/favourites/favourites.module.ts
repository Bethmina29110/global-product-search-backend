import { Module } from '@nestjs/common';
import { FavouritesService } from './favourites.service';
import { FavouritesController } from './favourites.controller';
import { PrismaModule } from '@infrastructure/database/prisma.module';

@Module({
  imports: [PrismaModule],
  providers: [FavouritesService],
  controllers: [FavouritesController],
})
export class FavouritesModule {}

import {
  Injectable,
  Logger,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { SaveFavouriteDto } from './dto/save-favourite.dto';

@Injectable()
export class FavouritesService {
  private readonly logger = new Logger(FavouritesService.name);

  constructor(private readonly prisma: PrismaService) {}

  async save(userId: number, dto: SaveFavouriteDto) {
    this.logger.log(`User ${userId} saving favourite: "${dto.title}"`);

    try {
      const favourite = await this.prisma.favourite.create({
        data: {
          userId,
          title: dto.title,
          price: dto.price,
          imageUrl: dto.imageUrl,
          store: dto.store,
          productUrl: dto.productUrl,
          rating: dto.rating,
          category: dto.category,
          summary: dto.summary,
        },
      });

      this.logger.log(`Favourite saved with id: ${favourite.id}`);
      return favourite;
    } catch (error: any) {
      if (error.code === 'P2002') {
        throw new ConflictException('This product is already in your favourites.');
      }
      throw error;
    }
  }

  async findAll(userId: number, page: number = 1) {
    this.logger.log(`Fetching all favourites for user ${userId}, page ${page}`);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.favourite.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.favourite.count({ where: { userId } })
    ]);

    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      }
    };
  }

  async delete(userId: number, id: number) {
    this.logger.log(`User ${userId} deleting favourite id: ${id}`);

    const favourite = await this.prisma.favourite.findUnique({
      where: { id },
    });

    if (!favourite) {
      throw new NotFoundException('Favourite not found.');
    }

    if (favourite.userId !== userId) {
      throw new NotFoundException('Favourite not found.');
    }

    await this.prisma.favourite.delete({ where: { id } });

    return { message: 'Favourite removed successfully.' };
  }
}

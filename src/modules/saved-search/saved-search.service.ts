import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { SaveSearchDto } from './dto/save-search.dto';

@Injectable()
export class SavedSearchService {
  private readonly logger = new Logger(SavedSearchService.name);

  constructor(private prisma: PrismaService) {}

  async save(userId: number, dto: SaveSearchDto) {
    this.logger.log(`User ${userId} saving search: "${dto.query}"`);

    try {
      const savedSearch = await this.prisma.savedSearch.create({
        data: {
          userId,
          query: dto.query,
          type: dto.type,
          matchesCount: dto.matchesCount,
        },
      });

      return {
        status: 'success',
        message: 'Search saved successfully',
        data: savedSearch,
      };
    } catch (error) {
      this.logger.error(`Failed to save search: ${error instanceof Error ? error.message : String(error)}`);
      throw error;
    }
  }

  async findAll(userId: number, page: number = 1) {
    this.logger.log(`Fetching all saved searches for user ${userId}, page ${page}`);
    const limit = 20;
    const skip = (page - 1) * limit;

    const [data, total] = await Promise.all([
      this.prisma.savedSearch.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip,
      }),
      this.prisma.savedSearch.count({ where: { userId } })
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
    this.logger.log(`User ${userId} deleting saved search ${id}`);
    
    // Ensure the saved search belongs to the user
    const savedSearch = await this.prisma.savedSearch.findUnique({
      where: { id },
    });

    if (!savedSearch || savedSearch.userId !== userId) {
      throw new Error('Saved search not found or unauthorized');
    }

    await this.prisma.savedSearch.delete({
      where: { id },
    });

    return {
      status: 'success',
      message: 'Saved search deleted successfully',
    };
  }
}

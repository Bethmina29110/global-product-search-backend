import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getOverview() {
    this.logger.log('Fetching dashboard overview metrics');

    try {
      // Run queries concurrently
      const [
        totalSearches,
        savedQueries,
        favoriteProducts,
        latencyAgg
      ] = await Promise.all([
        this.prisma.searchLog.count(),
        this.prisma.savedSearch.count(),
        this.prisma.favourite.count(),
        this.prisma.searchLog.aggregate({
          _avg: {
            latencyMs: true,
          },
        })
      ]);

      return {
        totalSearches,
        savedIntentQueries: savedQueries,
        favoriteProducts,
        averageLatency: latencyAgg._avg.latencyMs ? Math.round(latencyAgg._avg.latencyMs) : 0,
      };
    } catch (error: any) {
      this.logger.error(`Failed to fetch dashboard overview: ${error.message}`);
      throw error;
    }
  }
}

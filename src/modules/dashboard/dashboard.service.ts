import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class DashboardService {
  private readonly logger = new Logger(DashboardService.name);

  constructor(private prisma: PrismaService) {}

  async getOverview(userId: number) {
    this.logger.log(`Fetching dashboard overview metrics for user ${userId}`);

    try {
      // Run queries concurrently
      const [
        totalSearches,
        savedQueries,
        favoriteProducts,
        latencyAgg
      ] = await Promise.all([
        this.prisma.searchLog.count({ where: { userId } }),
        this.prisma.savedSearch.count({ where: { userId } }),
        this.prisma.favourite.count({ where: { userId } }),
        this.prisma.searchLog.aggregate({
          where: { userId },
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

  async getRecentSavedQueries(userId: number) {
    this.logger.log(`Fetching 4 most recent saved queries for user ${userId}`);
    try {
      return await this.prisma.savedSearch.findMany({
        where: { userId },
        take: 4,
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          user: {
            select: {
              name: true,
              email: true,
            }
          }
        }
      });
    } catch (error: any) {
      this.logger.error(`Failed to fetch recent saved queries: ${error.message}`);
      throw error;
    }
  }

  async getWeeklySearchActivity(userId: number) {
    this.logger.log(`Fetching weekly search activity for user ${userId}`);
    try {
      // Get the start of the current week (Monday)
      const now = new Date();
      const currentDay = now.getDay() || 7; // 1 (Mon) - 7 (Sun)
      const startOfWeek = new Date(now);
      startOfWeek.setDate(now.getDate() - currentDay + 1);
      startOfWeek.setHours(0, 0, 0, 0);

      const logs = await this.prisma.searchLog.findMany({
        where: {
          userId,
          createdAt: {
            gte: startOfWeek,
          },
        },
        select: {
          createdAt: true,
        },
      });

      // Initialize counts array for Mon to Sun
      const weeklyData = [0, 0, 0, 0, 0, 0, 0];

      for (const log of logs) {
        const day = log.createdAt.getDay() || 7; // 1 (Mon) - 7 (Sun)
        weeklyData[day - 1]++;
      }

      return weeklyData;
    } catch (error: any) {
      this.logger.error(`Failed to fetch weekly search activity: ${error.message}`);
      throw error;
    }
  }
}

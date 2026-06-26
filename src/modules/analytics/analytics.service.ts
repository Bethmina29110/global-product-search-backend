import { Injectable, Logger } from '@nestjs/common';
import { PrismaService } from '../../infrastructure/database/prisma.service';

@Injectable()
export class AnalyticsService {
  private readonly logger = new Logger(AnalyticsService.name);

  constructor(private prisma: PrismaService) {}

  async getOverview(userId: number) {
    this.logger.log(`Fetching analytics overview for user ${userId}`);

    const [
      totalSearches,
      savedSearches,
      favoriteProducts,
      latencyAgg
    ] = await Promise.all([
      this.prisma.searchLog.count({ where: { userId } }),
      this.prisma.savedSearch.count({ where: { userId } }),
      this.prisma.favourite.count({ where: { userId } }),
      this.prisma.searchLog.aggregate({
        _avg: { latencyMs: true },
        where: { userId }
      })
    ]);

    return {
      totalSearches,
      savedSearches,
      favoriteProducts,
      averageLatency: latencyAgg._avg.latencyMs ? Math.round(latencyAgg._avg.latencyMs) : 0,
    };
  }

  async getSearchTrend(userId: number) {
    this.logger.log(`Fetching search trend for user ${userId}`);
    const now = new Date();
    const sevenDaysAgo = new Date(now);
    sevenDaysAgo.setDate(now.getDate() - 6);
    sevenDaysAgo.setHours(0, 0, 0, 0);

    const logs = await this.prisma.searchLog.findMany({
      where: {
        userId,
        createdAt: { gte: sevenDaysAgo },
      },
      select: { createdAt: true },
    });

    const trend = [0, 0, 0, 0, 0, 0, 0];
    
    // We want the array to map to [6 days ago, 5 days ago, ..., today]
    logs.forEach(log => {
      const diffTime = Math.abs(now.getTime() - log.createdAt.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      // diffDays = 0 means today, diffDays = 1 means yesterday.
      // We want today at index 6, yesterday at index 5, etc.
      if (diffDays <= 6) {
        const index = 6 - diffDays;
        trend[index]++;
      }
    });

    return trend;
  }

  async getTopCategories(userId: number) {
    this.logger.log(`Fetching top categories for user ${userId}`);
    const favorites = await this.prisma.favourite.findMany({
      where: { userId },
      select: { category: true },
    });

    const categoryCounts: Record<string, number> = {};
    favorites.forEach(f => {
      const category = f.category || 'Uncategorized';
      categoryCounts[category] = (categoryCounts[category] || 0) + 1;
    });

    return Object.entries(categoryCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  async getTopStores(userId: number) {
    this.logger.log(`Fetching top stores for user ${userId}`);
    const favorites = await this.prisma.favourite.findMany({
      where: { userId },
      select: { store: true },
    });

    const storeCounts: Record<string, number> = {};
    favorites.forEach(f => {
      const store = f.store || 'Unknown';
      storeCounts[store] = (storeCounts[store] || 0) + 1;
    });

    return Object.entries(storeCounts)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }

  async getPriceDistribution(userId: number) {
    this.logger.log(`Fetching price distribution for user ${userId}`);
    const favorites = await this.prisma.favourite.findMany({
      where: { userId },
      select: { price: true },
    });

    const buckets = {
      '$0-$50': 0,
      '$50-$100': 0,
      '$100-$500': 0,
      '$500+': 0,
    };

    favorites.forEach(f => {
      if (!f.price) return;
      
      const priceVal = parseFloat(f.price.replace(/[^0-9.]/g, ''));
      if (isNaN(priceVal)) return;

      if (priceVal <= 50) buckets['$0-$50']++;
      else if (priceVal <= 100) buckets['$50-$100']++;
      else if (priceVal <= 500) buckets['$100-$500']++;
      else buckets['$500+']++;
    });

    return [
      { range: '$0-$50', count: buckets['$0-$50'] },
      { range: '$50-$100', count: buckets['$50-$100'] },
      { range: '$100-$500', count: buckets['$100-$500'] },
      { range: '$500+', count: buckets['$500+'] },
    ];
  }
}

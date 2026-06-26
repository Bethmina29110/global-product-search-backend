import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { AnalyticsService } from './analytics.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(@CurrentUser() user: any) {
    return this.analyticsService.getOverview(Number(user.sub));
  }

  @Get('search-trend')
  @HttpCode(HttpStatus.OK)
  async getSearchTrend(@CurrentUser() user: any) {
    return this.analyticsService.getSearchTrend(Number(user.sub));
  }

  @Get('top-categories')
  @HttpCode(HttpStatus.OK)
  async getTopCategories(@CurrentUser() user: any) {
    return this.analyticsService.getTopCategories(Number(user.sub));
  }

  @Get('top-stores')
  @HttpCode(HttpStatus.OK)
  async getTopStores(@CurrentUser() user: any) {
    return this.analyticsService.getTopStores(Number(user.sub));
  }

  @Get('price-distribution')
  @HttpCode(HttpStatus.OK)
  async getPriceDistribution(@CurrentUser() user: any) {
    return this.analyticsService.getPriceDistribution(Number(user.sub));
  }
}

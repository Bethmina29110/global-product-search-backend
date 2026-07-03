import { Controller, Get, HttpCode, HttpStatus } from '@nestjs/common';
import { DashboardService } from './dashboard.service';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Public } from '../../common/decorators/public.decorator';

@Controller('dashboard')
export class DashboardController {
  constructor(private readonly dashboardService: DashboardService) {}

  @Get('overview')
  @HttpCode(HttpStatus.OK)
  async getOverview(@CurrentUser() user: any) {
    return this.dashboardService.getOverview(Number(user.sub));
  }

  @Get('recent-saved-queries')
  @HttpCode(HttpStatus.OK)
  async getRecentSavedQueries(@CurrentUser() user: any) {
    return this.dashboardService.getRecentSavedQueries(Number(user.sub));
  }

  @Get('semantic-search-activity')
  @HttpCode(HttpStatus.OK)
  async getWeeklySearchActivity(@CurrentUser() user: any) {
    return this.dashboardService.getWeeklySearchActivity(Number(user.sub));
  }
}

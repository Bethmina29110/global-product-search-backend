import { Controller, Get, Logger } from '@nestjs/common';
import { HealthCheck, HealthCheckService, HealthIndicatorResult } from '@nestjs/terminus';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { Public } from '../../common/decorators/public.decorator';
import { RedisHealthIndicator } from './indicators/redis.health';

@Controller('health')
export class HealthController {
  private readonly logger = new Logger(HealthController.name);

  constructor(
    private readonly health: HealthCheckService,
    private readonly prisma: PrismaService,
    private readonly redisHealthIndicator: RedisHealthIndicator,
  ) {}

  @Get()
  @Public()
  @HealthCheck()
  async check() {
    return this.health.check([
      // Database health check
      async (): Promise<HealthIndicatorResult> => {
        try {
          await this.prisma.$queryRaw`SELECT 1`;
          return {
            database: {
              status: 'up',
            },
          };
        } catch (error) {
          return {
            database: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Database connection failed',
            },
          };
        }
      },
      // Redis health check
      async (): Promise<HealthIndicatorResult> => {
        try {
          return await this.redisHealthIndicator.isHealthy('redis');
        } catch (error) {
          this.logger.error('Redis health check error:', error);
          return {
            redis: {
              status: 'down',
              message: error instanceof Error ? error.message : 'Redis health check failed',
            },
          };
        }
      },
    ]);
  }
}
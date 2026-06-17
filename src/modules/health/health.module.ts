import { Module, OnModuleInit, Logger, forwardRef } from '@nestjs/common';
import { ModuleRef } from '@nestjs/core';
import { TerminusModule } from '@nestjs/terminus';
import { HealthController } from './health.controller';
import { PrismaModule } from '../../infrastructure/database/prisma.module';
import { CacheModule } from '../../infrastructure/cache/cache.module';
import { RedisHealthIndicator } from './indicators/redis.health';

@Module({
  imports: [
    TerminusModule,
    PrismaModule,
    CacheModule,
  ],
  controllers: [HealthController],
  providers: [RedisHealthIndicator],
  exports: [RedisHealthIndicator],
})
export class HealthModule {}
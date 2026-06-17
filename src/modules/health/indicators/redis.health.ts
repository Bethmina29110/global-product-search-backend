import { Injectable } from '@nestjs/common';
import { HealthIndicator, HealthIndicatorResult } from '@nestjs/terminus';
import { CacheService } from '../../../infrastructure/cache/cache.service';
import { ConfigService } from '@nestjs/config';

/**
 * Interface for Redis health provider.
 * 
 * Provides methods to check Redis connection status and health.
 */
export interface IRedisHealthProvider {
  /**
   * Check if Redis is enabled in configuration.
   * 
   * @returns true if Redis is enabled, false otherwise
   */
  isEnabled(): boolean;

  /**
   * Check if Redis is currently connected.
   * 
   * @returns true if connected, false otherwise
   */
  isConnected(): boolean;

  /**
   * Perform a health check ping to Redis.
   * 
   * @returns Promise that resolves to true if ping succeeds, false otherwise
   */
  ping(): Promise<boolean>;
}

/**
 * Redis health indicator.
 * 
 * Checks the health of the Redis cache connection. Provides information about:
 * - Redis connection status
 * - Whether Redis is enabled in configuration
 * - Connection health via ping test
 * 
 * Features:
 * - Handles disabled Redis gracefully (returns 'up' with disabled status)
 * - Performs actual ping test to verify connection
 * - Provides connection status information
 * 
 * @example
 * ```typescript
 * // Health check response when Redis is enabled and connected:
 * // {
 * //   redis: {
 * //     status: 'up',
 * //     enabled: true,
 * //     connected: true,
 * //     ping: true
 * //   }
 * // }
 * 
 * // Health check response when Redis is disabled:
 * // {
 * //   redis: {
 * //     status: 'up',
 * //     enabled: false,
 * //     connected: false,
 * //     message: 'Redis is disabled'
 * //   }
 * // }
 * ```
 */
@Injectable()
export class RedisHealthIndicator extends HealthIndicator {
  constructor(
    private readonly cacheService: CacheService,
    private readonly configService: ConfigService,
  ) {
    super();
  }

  /**
   * Check Redis server health.
   * 
   * Performs a health check on the Redis connection:
   * - Checks if Redis is enabled in configuration
   * - Checks connection status
   * - Performs a ping test to verify connectivity
   * 
   * @param key - Health indicator key (default: 'redis')
   * @returns Health check result with Redis status information
   */
  async isHealthy(key: string = 'redis'): Promise<HealthIndicatorResult> {
    const enabled = this.configService.get<boolean>('redis.enabled', false);

    // If Redis is disabled, return 'up' status with disabled info
    if (!enabled) {
      return this.getStatus(key, true, {
        enabled: false,
        connected: false,
        message: 'Redis is disabled (REDIS_ENABLED=false)',
      });
    }

    // Check connection status
    const connected = this.isCacheServiceConnected();

    // If not connected, return 'down' status
    if (!connected) {
      return this.getStatus(key, false, {
        enabled: true,
        connected: false,
        message: 'Redis connection is not established',
      });
    }

    // Perform ping test
    try {
      const pingResult = await this.pingCacheService();
      
      if (pingResult) {
        return this.getStatus(key, true, {
          enabled: true,
          connected: true,
          ping: true,
        });
      } else {
        return this.getStatus(key, false, {
          enabled: true,
          connected: false,
          ping: false,
          message: 'Redis ping test failed',
        });
      }
    } catch (error) {
      return this.getStatus(key, false, {
        enabled: true,
        connected: false,
        ping: false,
        message: error instanceof Error ? error.message : 'Redis health check failed',
      });
    }
  }

  /**
   * Check if CacheService reports connection status.
   * 
   * @returns true if connected, false otherwise
   * @private
   */
  private isCacheServiceConnected(): boolean {
    return this.cacheService.isConnected === true;
  }

  /**
   * Perform a ping test on the CacheService.
   * 
   * Uses the CacheService ping method to verify Redis connectivity.
   * 
   * @returns Promise that resolves to true if ping succeeds, false otherwise
   * @private
   */
  private async pingCacheService(): Promise<boolean> {
    try {
      return await this.cacheService.ping();
    } catch {
      return false;
    }
  }
}

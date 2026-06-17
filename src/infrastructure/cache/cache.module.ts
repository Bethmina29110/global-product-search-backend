import { Module, Global } from '@nestjs/common';
import { CacheService } from './cache.service';

/**
 * Cache Module.
 * 
 * Provides global Redis cache service for the entire application.
 * This module is marked as @Global() to make CacheService available
 * to all modules without explicit imports.
 * 
 * **Features:**
 * - Global module (available to all modules)
 * - Redis caching integration
 * - Automatic connection management
 * - Graceful degradation (works without Redis)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * imports: [CacheModule]
 * 
 * // In any service (no need to import CacheModule)
 * constructor(private cache: CacheService) {}
 * 
 * // Set cache with TTL
 * await this.cache.set('user:123', userData, 3600); // 1 hour
 * 
 * // Get cache
 * const user = await this.cache.get<User>('user:123');
 * 
 * // Delete cache
 * await this.cache.del('user:123');
 * ```
 * 
 * **Graceful Degradation:**
 * - If Redis is disabled or unavailable, CacheService continues to work
 * - All cache operations return null/false but don't throw errors
 * - Application continues to function normally without caching
 */
@Global()
@Module({
  providers: [CacheService],
  exports: [CacheService],
})
export class CacheModule {}


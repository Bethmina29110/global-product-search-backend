import { registerAs } from '@nestjs/config';

/**
 * Redis configuration interface.
 * 
 * Defines the structure of Redis connection configuration settings.
 */
export interface RedisConfig {
  /** Whether Redis is enabled (default: false) */
  enabled: boolean;
  /** Whether TLS/SSL is enabled (default: false) */
  tls: boolean;
  /** Redis server hostname (default: 'localhost') */
  host: string;
  /** Redis server port (default: 6379) */
  port: number;
  /** Redis password (optional) */
  password?: string;
  /** Redis database number (0-15, default: 0) */
  db: number;
  /** Default TTL for cached values in seconds (default: 3600) */
  ttl: number;
  /** Maximum number of retry attempts (default: 3) */
  maxRetries: number;
  /** Connection timeout in milliseconds (default: 10000) */
  connectTimeout: number;
}

/**
 * Redis configuration factory.
 * 
 * Provides Redis connection settings including host, port, TLS, and
 * connection pool configuration. Used for caching and WebSocket adapter.
 * 
 * **Environment Variables:**
 * - `REDIS_ENABLED`: Enable Redis (default: false)
 * - `REDIS_TLS_ENABLED`: Enable TLS/SSL (default: false)
 * - `REDIS_HOST`: Redis server hostname (default: 'localhost')
 * - `REDIS_PORT`: Redis server port (default: 6379)
 * - `REDIS_PASSWORD`: Redis password (optional)
 * - `REDIS_DB`: Database number 0-15 (default: 0)
 * - `REDIS_TTL`: Default cache TTL in seconds (default: 3600)
 * - `REDIS_MAX_RETRIES`: Max retry attempts (default: 3)
 * - `REDIS_CONNECT_TIMEOUT`: Connection timeout in ms (default: 10000)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [redisConfig],
 * })
 * 
 * // In CacheService
 * constructor(private configService: ConfigService) {
 *   const redisConfig = this.configService.get<RedisConfig>('redis');
 *   if (redisConfig.enabled) {
 *     // Initialize Redis connection
 *   }
 * }
 * ```
 * 
 * @returns Redis configuration object
 */
export default registerAs('redis', (): RedisConfig => ({
  enabled: process.env.REDIS_ENABLED === 'true',
  tls: process.env.REDIS_TLS_ENABLED === 'true',
  host: process.env.REDIS_HOST ?? 'localhost',
  port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
  password: process.env.REDIS_PASSWORD,
  db: parseInt(process.env.REDIS_DB ?? '0', 10) || 0,
  ttl: parseInt(process.env.REDIS_TTL ?? '3600', 10) || 3600,
  maxRetries: parseInt(process.env.REDIS_MAX_RETRIES ?? '3', 10) || 3,
  connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '10000', 10) || 10000,
}));
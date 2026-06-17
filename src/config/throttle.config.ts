import { registerAs } from '@nestjs/config';

/**
 * Throttle configuration interface.
 * 
 * Defines the structure of rate limiting/throttle configuration settings.
 */
export interface ThrottleConfig {
  /** Auth-sensitive: login, forgot-password, reset-password, change-password. IP-based, 5 per 15 min. */
  authSensitive: {
    limit: number;
    ttl: number;
  };
  /** Refresh token endpoint. More lenient than login; prevents token replay abuse. IP-based, 10 per min. */
  authRefresh: {
    limit: number;
    ttl: number;
  };
  /** Registration endpoint. Prevents mass account creation. IP-based, 3 per hour. */
  authRegister: {
    limit: number;
    ttl: number;
  };
}

/**
 * Rate limiting/throttle configuration factory.
 * 
 * Provides rate limiting settings for global and authentication-specific
 * endpoints. Used by @nestjs/throttler module.
 * 
 * **Environment Variables:**
 * 
 * **Auth-Sensitive (login, forgot-password, reset-password, change-password):**
 * - `AUTH_SENSITIVE_LIMIT`: Max attempts per IP (default: 5)
 * - `AUTH_SENSITIVE_TTL`: Time window in ms (default: 900000 = 15 min)
 *
 * **Auth-Refresh (refresh token endpoint):**
 * - `AUTH_REFRESH_LIMIT`: Max refresh attempts per IP (default: 10)
 * - `AUTH_REFRESH_TTL`: Time window in ms (default: 60000 = 1 min)
 *
 * **Auth-Register (registration endpoint):**
 * - `AUTH_REGISTER_LIMIT`: Max registration attempts per IP (default: 3)
 * - `AUTH_REGISTER_TTL`: Time window in ms (default: 3600000 = 1 hour)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [throttleConfig],
 * })
 * 
 * // In ThrottlerModule
 * ThrottlerModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (configService: ConfigService) => [
 *     {
 *       name: 'default',
 *       ttl: configService.get<number>('throttle.global.ttl'),
 *       limit: configService.get<number>('throttle.global.limit'),
 *     },
 *   ],
 * })
 * ```
 * 
 * @returns Throttle configuration object
 */
export default registerAs('throttle', (): ThrottleConfig => ({
  authSensitive: {
    limit: parseInt(process.env.AUTH_SENSITIVE_LIMIT ?? '5', 10) || 5,
    ttl: parseInt(process.env.AUTH_SENSITIVE_TTL ?? '900000', 10) || 900000,
  },
  authRefresh: {
    limit: parseInt(process.env.AUTH_REFRESH_LIMIT ?? '10', 10) || 10,
    ttl: parseInt(process.env.AUTH_REFRESH_TTL ?? '60000', 10) || 60000,
  },
  authRegister: {
    limit: parseInt(process.env.AUTH_REGISTER_LIMIT ?? '3', 10) || 3,
    ttl: parseInt(process.env.AUTH_REGISTER_TTL ?? '3600000', 10) || 3600000,
  },
}));

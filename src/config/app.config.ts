import { registerAs } from '@nestjs/config';

/**
 * Application configuration interface.
 * 
 * Defines the structure of application-wide configuration settings.
 */
export interface AppConfig {
  /** Node.js environment (development, production, test, staging) */
  nodeEnv: string;
  /** Server port number */
  port: number;
  /** API route prefix (e.g., 'api/v1') */
  apiPrefix: string;
  /** Application base URL */
  appUrl: string;
  /** Application display name */
  appName: string;
  /** Performance monitoring configuration */
  performance: {
    /** Threshold in milliseconds for warning-level slow requests (default: 1000ms) */
    slowRequestWarningThreshold: number;
    /** Threshold in milliseconds for critical-level slow requests (default: 3000ms) */
    slowRequestCriticalThreshold: number;
  };
}

/**
 * Application configuration factory.
 * 
 * Provides application-wide settings including environment, port, API prefix,
 * and performance thresholds for slow request detection.
 * 
 * **Environment Variables:**
 * - `NODE_ENV`: Node.js environment (default: 'development')
 * - `PORT`: Server port (default: 3000)
 * - `API_PREFIX`: API route prefix (default: 'api/v1')
 * - `APP_URL`: Application base URL (required, validated by env.validation.config.ts)
 * - `APP_NAME`: Application display name (default: 'Classifieds Marketplace')
 * - `SLOW_REQUEST_WARNING_THRESHOLD`: Warning threshold in ms (default: 1000)
 * - `SLOW_REQUEST_CRITICAL_THRESHOLD`: Critical threshold in ms (default: 3000)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [appConfig],
 * })
 * 
 * // In service/controller
 * constructor(private configService: ConfigService) {
 *   const appConfig = this.configService.get<AppConfig>('app');
 *   const port = appConfig.port;
 * }
 * ```
 * 
 * @returns Application configuration object
 */
export default registerAs('app', (): AppConfig => ({
  nodeEnv: process.env.NODE_ENV ?? 'development',
  port: parseInt(process.env.PORT ?? '3000', 10) || 3000,
  apiPrefix: process.env.API_PREFIX ?? 'api/v1',
  appUrl: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`,
  appName: process.env.APP_NAME ?? 'Classifieds Marketplace',
  performance: {
    slowRequestWarningThreshold: parseInt(process.env.SLOW_REQUEST_WARNING_THRESHOLD ?? '1000', 10) || 1000,
    slowRequestCriticalThreshold: parseInt(process.env.SLOW_REQUEST_CRITICAL_THRESHOLD ?? '3000', 10) || 3000,
  },
}));
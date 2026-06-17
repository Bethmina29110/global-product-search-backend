import { registerAs } from '@nestjs/config';

/**
 * Database configuration interface.
 * 
 * Defines the structure of database connection configuration settings.
 */
export interface DatabaseConfig {
  /** Database connection URL (required, validated by env.validation.config.ts) */
  url: string;
  /** Minimum number of connections in the pool (default: 10) */
  poolMin: number;
  /** Maximum number of connections in the pool (default: 50) */
  poolMax: number;
  /** Idle timeout for connections in milliseconds (default: 30000) */
  poolIdleTimeout: number;
}

/**
 * Database configuration factory.
 * 
 * Provides Prisma database connection settings including connection pool
 * configuration. The DATABASE_URL is validated by env.validation.config.ts.
 * 
 * **Environment Variables:**
 * - `DATABASE_URL`: Database connection string (required)
 * - `DB_POOL_MIN`: Minimum pool connections (default: 10, range: 1-20)
 * - `DB_POOL_MAX`: Maximum pool connections (default: 50, range: 10-100)
 * - `DB_POOL_IDLE_TIMEOUT`: Idle timeout in ms (default: 30000)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [databaseConfig],
 * })
 * 
 * // In PrismaService
 * constructor(private configService: ConfigService) {
 *   const dbConfig = this.configService.get<DatabaseConfig>('database');
 *   // Use dbConfig.url for Prisma connection
 * }
 * ```
 * 
 * @returns Database configuration object
 * @throws {Error} If DATABASE_URL is missing (caught by validation schema)
 */
export default registerAs('database', (): DatabaseConfig => {
  const url = process.env.DATABASE_URL;
  if (!url) {
    throw new Error('DATABASE_URL is required');
  }

  return {
    url,
    poolMin: parseInt(process.env.DB_POOL_MIN ?? '10', 10) || 10,
    poolMax: parseInt(process.env.DB_POOL_MAX ?? '50', 10) || 50,
    poolIdleTimeout: parseInt(process.env.DB_POOL_IDLE_TIMEOUT ?? '30000', 10) || 30000,
  };
});
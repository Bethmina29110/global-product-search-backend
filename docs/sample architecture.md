# Config Code

```typescript
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
```

```typescript
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

```

```typescript
import * as Joi from 'joi';

/**
 * Environment variables validation schema.
 * 
 * Validates all environment variables on application startup using Joi.
 * Provides defaults for optional values and ensures required values are present.
 * 
 * **Validation Features:**
 * - Type checking (string, number, boolean)
 * - Range validation (min/max for numbers)
 * - Enum validation (valid values for strings)
 * - URI validation for URLs
 * - Email validation for email addresses
 * - Default values for optional fields
 * 
 * **Usage:**
 * ```typescript
 * ConfigModule.forRoot({
 *   validationSchema: envValidationSchema,
 *   validationOptions: {
 *     abortEarly: false,
 *     allowUnknown: true,
 *   },
 * })
 * ```
 * 
 * **Validation Behavior:**
 * - Required fields without values will cause application startup to fail
 * - Optional fields use default values if not provided
 * - Invalid values (wrong type, out of range) will cause validation errors
 * - Unknown environment variables are allowed (allowUnknown: true)
 * 
 * @see {@link https://joi.dev/api/ | Joi Documentation}
 */
export const envValidationSchema = Joi.object({
  // ============================================
  // APPLICATION
  // ============================================
  NODE_ENV: Joi.string()
    .valid('development', 'production', 'test', 'staging')
    .default('development'),
  PORT: Joi.number().port().default(3000),
  API_PREFIX: Joi.string().default('api/v1'),
  APP_URL: Joi.string().uri().required(),
  APP_NAME: Joi.string().default('Classifieds Marketplace'),

  // ============================================
  // DATABASE
  // ============================================
  DATABASE_URL: Joi.string().required(),
  DB_POOL_MIN: Joi.number().min(1).max(20).default(10),
  DB_POOL_MAX: Joi.number().min(10).max(100).default(50),
  DB_POOL_IDLE_TIMEOUT: Joi.number().default(30000),

  // ============================================
  // JWT SECURITY
  // ============================================
  JWT_SECRET: Joi.string().min(32).required(),
  JWT_EXPIRATION: Joi.string().default('15m'),
  JWT_REFRESH_SECRET: Joi.string().min(32).required(),
  JWT_REFRESH_EXPIRATION: Joi.string().default('7d'),
  JWT_ISSUER: Joi.string().default('classifieds-api'),
  JWT_AUDIENCE: Joi.string().default('classifieds-client'),

  // ============================================
  // SECURITY
  // ============================================

  MAX_LOGIN_ATTEMPTS: Joi.number().min(3).max(10).default(5),
  ACCOUNT_LOCK_DURATION: Joi.number().default(1800000),
  FAILED_LOGIN_RESET_TIME: Joi.number().default(900000),

  PASSWORD_RESET_TOKEN_EXPIRY: Joi.number().default(3600000),
  PASSWORD_RESET_MAX_ATTEMPTS: Joi.number().default(3),

  BCRYPT_ROUNDS: Joi.number().min(10).max(15).default(12),

  MAX_SESSIONS_PER_USER: Joi.number().min(1).max(20).default(5),

  // ============================================
  // RATE LIMITING (auth-sensitive endpoints only)
  // ============================================
  AUTH_SENSITIVE_LIMIT: Joi.number().min(1).max(100).default(5),
  AUTH_SENSITIVE_TTL: Joi.number().min(1000).max(86400000).default(900000),
  AUTH_REFRESH_LIMIT: Joi.number().min(1).max(100).default(10),
  AUTH_REFRESH_TTL: Joi.number().min(1000).max(86400000).default(60000),
  AUTH_REGISTER_LIMIT: Joi.number().min(1).max(100).default(3),
  AUTH_REGISTER_TTL: Joi.number().min(1000).max(86400000).default(3600000),

  // ============================================
  // CORS
  // ============================================
  ALLOWED_ORIGINS: Joi.string().when('NODE_ENV', {
    is: 'production',
    then: Joi.string()
      .required()
      .custom((value, helpers) => {
        // In production, wildcard is not allowed
        if (value === '*' || value.includes('*')) {
          return helpers.error('string.productionNoWildcard', {
            message: 'ALLOWED_ORIGINS cannot contain wildcard "*" in production. Set specific origins like: https://example.com,https://app.example.com'
          });
        }
        // Validate URLs
        const origins = value.split(',').map((o: string) => o.trim());
        const urlPattern = /^https?:\/\/.+/;
        const invalidOrigins = origins.filter((o: string) => !urlPattern.test(o));
        if (invalidOrigins.length > 0) {
          return helpers.error('string.invalidOrigins', {
            message: `Invalid origin URLs: ${invalidOrigins.join(', ')}. Origins must be valid URLs (http:// or https://)`
          });
        }
        return value;
      }),
    otherwise: Joi.string().optional().default('*'),
  }),
  ALLOWED_METHODS: Joi.string().default('GET,POST,PUT,DELETE,PATCH,OPTIONS'),
  ALLOWED_HEADERS: Joi.string().default('Content-Type,Authorization,X-Request-ID'),
  CREDENTIALS: Joi.boolean().default(true),

  // ============================================
  // REDIS
  // ============================================
  REDIS_ENABLED: Joi.boolean().default(false),
  REDIS_TLS_ENABLED: Joi.boolean().default(false),
  REDIS_HOST: Joi.string().default('localhost'),
  REDIS_PORT: Joi.number().port().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  REDIS_DB: Joi.number().min(0).max(15).default(0),
  REDIS_TTL: Joi.number().default(3600),
  REDIS_MAX_RETRIES: Joi.number().default(3),
  REDIS_CONNECT_TIMEOUT: Joi.number().default(10000),

  // ============================================
  // LOGGING
  // ============================================
  LOG_LEVEL: Joi.string()
    .valid('error', 'warn', 'info', 'http', 'verbose', 'debug', 'silly')
    .default('info'),

  LOG_FILE_ENABLED: Joi.boolean().default(true),
  LOG_FILE_PATH: Joi.string().default('logs/app.log'),
  LOG_ERROR_FILE_PATH: Joi.string().default('logs/error.log'),
  LOG_MAX_SIZE: Joi.string().default('20m'),
  LOG_MAX_FILES: Joi.string().default('14d'),
  LOG_COMPRESS: Joi.boolean().default(true),

  SENTRY_DSN: Joi.string().uri().optional().allow(''),
  SENTRY_ENVIRONMENT: Joi.string().optional(),
  SENTRY_TRACES_SAMPLE_RATE: Joi.number().min(0).max(1).default(0.1),

  // ============================================
  // EMAIL (Using MAIL_* prefix to match mail.config.ts)
  // ============================================
  MAIL_HOST: Joi.string().optional(),
  MAIL_PORT: Joi.number().port().default(587),
  MAIL_USERNAME: Joi.string().optional(),
  MAIL_PASSWORD: Joi.string().optional(),
  MAIL_FROM_ADDRESS: Joi.string().email().optional(),
  MAIL_FROM_NAME: Joi.string().optional(),
  SMTP_SECURE: Joi.boolean().default(false),

  EMAIL_VERIFY_EXPIRY: Joi.number().default(86400000),
  EMAIL_TEMPLATE_DIR: Joi.string().default('src/templates/emails'),

  // ============================================
  // WEBSOCKET
  // ============================================
  WEBSOCKET_CORS_ORIGIN: Joi.string().optional(),
  WS_PING_TIMEOUT: Joi.number().default(30000),
  WS_PING_INTERVAL: Joi.number().default(25000),
  WS_CONNECT_TIMEOUT: Joi.number().default(45000),
  WS_MAX_HTTP_BUFFER_SIZE: Joi.number().default(1048576),
  WS_MAX_EVENTS_PER_SECOND: Joi.number().default(10),
  WS_BLOCK_DURATION: Joi.number().default(60000),
  WS_MAX_ROOMS_PER_USER: Joi.number().default(100),
  WS_REDIS_ENABLED: Joi.boolean().default(false),
  WS_REDIS_DB: Joi.number().min(0).max(15).default(1),
  WS_REDIS_KEY_PREFIX: Joi.string().default('ws:'),

  // ============================================
  // SMS
  // ============================================
  SMS_PROVIDER: Joi.string().valid('twilio', 'aws-sns').optional(),
  SMS_ACCOUNT_SID: Joi.string().optional(),
  SMS_AUTH_TOKEN: Joi.string().optional(),
  SMS_FROM_NUMBER: Joi.string().optional(),

  OTP_LENGTH: Joi.number().min(4).max(8).default(6),
  OTP_EXPIRY: Joi.number().default(300000),
  OTP_MAX_ATTEMPTS: Joi.number().default(3),
  OTP_RESEND_DELAY: Joi.number().default(60000),

  // ============================================
  // AWS
  // ============================================
  AWS_REGION: Joi.string().optional(),
  AWS_ACCESS_KEY_ID: Joi.string().optional(),
  AWS_SECRET_ACCESS_KEY: Joi.string().optional(),

  AWS_S3_BUCKET: Joi.string().optional(),
  AWS_S3_REGION: Joi.string().optional(),
  AWS_S3_ACCELERATE: Joi.boolean().default(true),
  AWS_CLOUDFRONT_URL: Joi.string().uri().optional(),

  // ============================================
  // MONITORING
  // ============================================
  APM_ENABLED: Joi.boolean().default(true),
  APM_SERVER_URL: Joi.string().uri().optional(),
  APM_SERVICE_NAME: Joi.string().default('classifieds-api'),
  APM_ENVIRONMENT: Joi.string().optional(),

  METRICS_ENABLED: Joi.boolean().default(true),
  METRICS_PORT: Joi.number().port().default(9090),
  METRICS_PATH: Joi.string().default('/metrics'),

  HEALTH_CHECK_ENABLED: Joi.boolean().default(true),
  HEALTH_CHECK_PATH: Joi.string().default('/health'),
  READINESS_CHECK_PATH: Joi.string().default('/health/ready'),
  LIVENESS_CHECK_PATH: Joi.string().default('/health/live'),

  // ============================================
  // FEATURE FLAGS
  // ============================================
  FEATURE_EMAIL_VERIFICATION: Joi.boolean().default(true),
  FEATURE_PHONE_VERIFICATION: Joi.boolean().default(true),
  FEATURE_TWO_FACTOR_AUTH: Joi.boolean().default(false),
  FEATURE_SOCIAL_LOGIN: Joi.boolean().default(false),
  FEATURE_AUDIT_LOGGING: Joi.boolean().default(true),

  // ============================================
  // PERFORMANCE
  // ============================================
  REQUEST_TIMEOUT: Joi.number().default(30000),
  BODY_LIMIT: Joi.string().default('10mb'),
  JSON_LIMIT: Joi.string().default('1mb'),

  COMPRESSION_ENABLED: Joi.boolean().default(true),
  COMPRESSION_LEVEL: Joi.number().min(0).max(9).default(6),
  COMPRESSION_THRESHOLD: Joi.number().default(1024),

  // Slow Request Detection
  SLOW_REQUEST_WARNING_THRESHOLD: Joi.number().min(100).max(10000).default(1000), // milliseconds
  SLOW_REQUEST_CRITICAL_THRESHOLD: Joi.number().min(500).max(30000).default(3000), // milliseconds

  // ============================================
  // DEVELOPMENT
  // ============================================
  DEBUG: Joi.boolean().default(false),
  VERBOSE_LOGGING: Joi.boolean().default(false),

  // ============================================
  // SEEDING
  // ============================================
  SEED_DATABASE: Joi.boolean().default(false),
  SEED_ADMIN_EMAIL: Joi.string().email().optional(),
  SEED_ADMIN_PASSWORD: Joi.string().optional(),
  SEED_ADMIN_FIRST_NAME: Joi.string().optional(),
  SEED_ADMIN_LAST_NAME: Joi.string().optional(),
});


```

```typescript
import { registerAs } from '@nestjs/config';

/**
 * JWT configuration interface.
 * 
 * Defines the structure of JWT token configuration settings.
 */
export interface JwtConfig {
  /** JWT access token secret (required, min 32 chars, validated by env.validation.config.ts) */
  secret: string;
  /** Access token expiration time (default: '15m') */
  expiresIn: string;
  /** JWT issuer claim (default: 'classifieds-api') */
  issuer: string;
  /** JWT audience claim (default: 'classifieds-client') */
  audience: string;
  /** JWT refresh token secret (required, min 32 chars, validated by env.validation.config.ts) */
  refreshSecret: string;
  /** Refresh token expiration time (default: '7d') */
  refreshExpiresIn: string;
}

/**
 * JWT configuration factory.
 * 
 * Provides JWT token configuration including access and refresh token settings.
 * Secrets are validated by env.validation.config.ts and jwt-secrets.util.ts.
 * 
 * **Environment Variables:**
 * - `JWT_SECRET`: Access token secret (required, min 32 chars)
 * - `JWT_EXPIRATION`: Access token expiration (default: '15m')
 * - `JWT_ISSUER`: Token issuer claim (default: 'classifieds-api')
 * - `JWT_AUDIENCE`: Token audience claim (default: 'classifieds-client')
 * - `JWT_REFRESH_SECRET`: Refresh token secret (required, min 32 chars)
 * - `JWT_REFRESH_EXPIRATION`: Refresh token expiration (default: '7d')
 * 
 * **Security Notes:**
 * - Secrets must be at least 32 characters long
 * - Secrets are validated on application startup via jwt-secrets.util.ts
 * - Use strong, randomly generated secrets in production
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [jwtConfig],
 * })
 * 
 * // In JwtModule
 * JwtModule.registerAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     secret: config.get<string>('jwt.secret'),
 *     signOptions: {
 *       expiresIn: config.get<string>('jwt.expiresIn'),
 *       issuer: config.get<string>('jwt.issuer'),
 *       audience: config.get<string>('jwt.audience'),
 *     },
 *   }),
 * })
 * ```
 * 
 * @returns JWT configuration object
 */
export default registerAs('jwt', (): JwtConfig => ({
  secret: process.env.JWT_SECRET!,
  expiresIn: process.env.JWT_EXPIRATION ?? '15m',
  issuer: process.env.JWT_ISSUER ?? 'classifieds-api',
  audience: process.env.JWT_AUDIENCE ?? 'classifieds-client',
  refreshSecret: process.env.JWT_REFRESH_SECRET!,
  refreshExpiresIn: process.env.JWT_REFRESH_EXPIRATION ?? '7d',
}));



```

```typescript
import { WinstonModule } from 'nest-winston';
import * as winston from 'winston';
import { ConfigService } from '@nestjs/config';
import * as path from 'path';
import * as fs from 'fs';
const DailyRotateFile = require('winston-daily-rotate-file');

/**
 * Parses max size string (e.g., '20m', '100k', '1g') to bytes.
 * 
 * Supports size units: k (kilobytes), m (megabytes), g (gigabytes).
 * If no unit is specified, returns the value as bytes.
 * 
 * @param sizeStr - Size string (e.g., '20m', '100k', '1g')
 * @returns Size in bytes (default: 20MB if parsing fails)
 * 
 * @example
 * ```typescript
 * parseMaxSize('20m') // Returns 20971520 (20 * 1024 * 1024)
 * parseMaxSize('100k') // Returns 102400 (100 * 1024)
 * parseMaxSize('1g') // Returns 1073741824 (1 * 1024 * 1024 * 1024)
 * ```
 */
function parseMaxSize(sizeStr: string): number {
  const match = sizeStr.match(/^(\d+)([kmg]?)$/i);
  if (!match) return 20 * 1024 * 1024; // Default 20MB

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  switch (unit) {
    case 'g': return value * 1024 * 1024 * 1024;
    case 'm': return value * 1024 * 1024;
    case 'k': return value * 1024;
    default: return value;
  }
}

/**
 * Parses max files string (e.g., '14d', '30d', '7d') to number of days.
 * 
 * Expects format: '{number}d' where number is the days to retain logs.
 * 
 * @param filesStr - Files retention string (e.g., '14d', '30d')
 * @returns Number of days (default: 14 if parsing fails)
 * 
 * @example
 * ```typescript
 * parseMaxFiles('14d') // Returns 14
 * parseMaxFiles('30d') // Returns 30
 * parseMaxFiles('7d') // Returns 7
 * ```
 */
function parseMaxFiles(filesStr: string): number {
  const match = filesStr.match(/^(\d+)d$/i);
  if (!match) return 14; // Default 14 days
  return parseInt(match[1], 10);
}

/**
 * Winston format function that masks sensitive data in log output.
 * 
 * Automatically masks sensitive fields such as passwords, tokens, secrets,
 * API keys, credit cards, SSN, and PINs. Recursively processes nested objects
 * and arrays to ensure all sensitive data is masked.
 * 
 * **Masked Fields:**
 * - password, token, secret, refreshToken, accessToken
 * - authorization, apiKey, apikey
 * - creditCard, creditcard, ssn, pin
 * 
 * **Behavior:**
 * - Replaces sensitive values with '********'
 * - Preserves object structure
 * - Handles nested objects and arrays
 * - Processes Error objects and metadata
 * 
 * @example
 * ```typescript
 * // Input: { user: { email: 'user@example.com', password: 'secret123' } }
 * // Output: { user: { email: 'user@example.com', password: '********' } }
 * ```
 */
const maskSensitiveData = winston.format((info) => {
  const sensitiveKeys = [
    'password',
    'token',
    'secret',
    'refreshToken',
    'accessToken',
    'authorization',
    'apiKey',
    'apikey',
    'creditCard',
    'creditcard',
    'ssn',
    'pin',
  ];

  const maskValue = (obj: any): any => {
    if (obj === null || obj === undefined) return obj;
    if (typeof obj !== 'object') return obj;
    if (Array.isArray(obj)) return obj.map(maskValue);

    const masked: any = {};
    for (const [key, value] of Object.entries(obj)) {
      const lowerKey = key.toLowerCase();
      if (sensitiveKeys.some((sk) => lowerKey.includes(sk))) {
        masked[key] = '********';
      } else if (typeof value === 'object' && value !== null) {
        masked[key] = maskValue(value);
      } else {
        masked[key] = value;
      }
    }
    return masked;
  };

  if (info.message && typeof info.message === 'object') {
    if (info.message instanceof Error) {
      info.message = info.message.message || 'Error occurred';
    } else if (Object.keys(info.message).some(k => /^\d+$/.test(k))) {
      const msgObj = info.message as any;
      const msg = msgObj.message || msgObj.code || 'Error occurred';
      info.message = msg;
    } else {
      info.message = maskValue(info.message);
    }
  }
  
  if (info.metadata) {
    if (typeof info.metadata === 'object' && !Array.isArray(info.metadata)) {
      const cleaned: any = {};
      for (const [key, value] of Object.entries(info.metadata)) {
        if (value instanceof Error) {
          cleaned[key] = value.message || 'Error';
        } else if (typeof value === 'object' && value !== null) {
          const keys = Object.keys(value);
          if (keys.length > 0 && keys.every(k => /^\d+$/.test(k))) {
            continue;
          }
          cleaned[key] = maskValue(value);
        } else {
          cleaned[key] = maskValue(value);
        }
      }
      info.metadata = cleaned;
    } else {
      info.metadata = maskValue(info.metadata);
    }
  }
  
  const infoKeys = Object.keys(info);
  if (infoKeys.some(k => /^\d+$/.test(k))) {
    for (const key of infoKeys) {
      if (/^\d+$/.test(key)) {
        delete info[key];
      }
    }
  }
  
  if (info.context) {
    info.context = maskValue(info.context);
  }

  return info;
});

/**
 * Winston logger configuration interface.
 * 
 * Defines the structure of Winston logger configuration.
 */
export interface WinstonLoggerConfig {
  /** Log level (error, warn, info, http, verbose, debug, silly) */
  level: string;
  /** Log format (JSON format) */
  format: winston.Logform.Format;
  /** Log transports (console, file) */
  transports: winston.transport[];
  /** Exception handlers (optional) */
  exceptionHandlers?: winston.transport[];
  /** Rejection handlers (optional) */
  rejectionHandlers?: winston.transport[];
  /** Whether to exit on error (default: false) */
  exitOnError: boolean;
}

/**
 * Creates Winston logger configuration based on environment variables.
 * 
 * **Features:**
 * - JSON format for both console and file transports
 * - Daily log rotation with compression
 * - Separate error log file
 * - Sensitive data masking (passwords, tokens, etc.)
 * - Configurable log levels and file sizes
 * - Exception and rejection handlers
 * 
 * **Environment Variables:**
 * - `LOG_LEVEL`: Log level (default: 'info')
 * - `LOG_FILE_ENABLED`: Enable file logging (default: true)
 * - `LOG_FILE_PATH`: App log file path (default: 'logs/app.log')
 * - `LOG_ERROR_FILE_PATH`: Error log file path (default: 'logs/error.log')
 * - `LOG_MAX_SIZE`: Max log file size (default: '20m')
 * - `LOG_MAX_FILES`: Max log files retention (default: '14d')
 * - `LOG_COMPRESS`: Compress rotated logs (default: true)
 * 
 * **Log Format:**
 * - All logs are in JSON format for easy parsing
 * - Sensitive data (passwords, tokens) is automatically masked
 * - Timestamps are included in ISO format
 * - Stack traces are included for errors
 * 
 * **Usage:**
 * ```typescript
 * WinstonModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (configService: ConfigService) => getWinstonLoggerConfig(configService),
 * })
 * ```
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Winston logger configuration object
 */
export const createWinstonLogger = (configService: ConfigService): WinstonLoggerConfig => {
  const logLevel = configService.get<string>('LOG_LEVEL', 'info');
  const logFileEnabled = configService.get<boolean>('LOG_FILE_ENABLED', true);
  const logFilePath = configService.get<string>('LOG_FILE_PATH', 'logs/app.log');
  const logErrorFilePath = configService.get<string>('LOG_ERROR_FILE_PATH', 'logs/error.log');
  const logMaxSize = configService.get<string>('LOG_MAX_SIZE', '20m');
  const logMaxFiles = configService.get<string>('LOG_MAX_FILES', '14d');
  const logCompress = configService.get<boolean>('LOG_COMPRESS', true);

  if (logFileEnabled) {
    try {
      const logDir = path.dirname(logFilePath);
      if (!fs.existsSync(logDir)) {
        fs.mkdirSync(logDir, { recursive: true });
      }
      const errorLogDir = path.dirname(logErrorFilePath);
      if (!fs.existsSync(errorLogDir)) {
        fs.mkdirSync(errorLogDir, { recursive: true });
      }
    } catch (error) {
      console.error('[Logger Config] Failed to create log directories:', error);
    }
  }

  // Always use JSON format for both console and files
  const getConsoleFormat = () => {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      maskSensitiveData(),
      winston.format.json(),
    );
  };

  const getFileFormat = () => {
    return winston.format.combine(
      winston.format.timestamp(),
      winston.format.errors({ stack: true }),
      winston.format.splat(),
      maskSensitiveData(),
      winston.format.json(),
    );
  };

  const transports: winston.transport[] = [
    new winston.transports.Console({
      level: logLevel,
      format: getConsoleFormat(),
    }),
  ];

  if (logFileEnabled) {
    const appLogFilename = path.basename(logFilePath, path.extname(logFilePath)) + '-%DATE%' + path.extname(logFilePath);
    const errorLogFilename = path.basename(logErrorFilePath, path.extname(logErrorFilePath)) + '-%DATE%' + path.extname(logErrorFilePath);
    
    const appLogTransport = new DailyRotateFile({
      dirname: path.dirname(logFilePath),
      filename: appLogFilename,
      datePattern: 'YYYY-MM-DD',
      level: logLevel,
      maxSize: parseMaxSize(logMaxSize),
      maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
      zippedArchive: logCompress,
      format: getFileFormat(),
    });

    appLogTransport.on('error', (err: Error) => {
      console.error('[Logger] Error writing to app log file:', err);
    });

    transports.push(appLogTransport);

    const errorLogTransport = new DailyRotateFile({
      dirname: path.dirname(logErrorFilePath),
      filename: errorLogFilename,
      datePattern: 'YYYY-MM-DD',
      level: 'error',
      maxSize: parseMaxSize(logMaxSize),
      maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
      zippedArchive: logCompress,
      format: getFileFormat(),
    });

    errorLogTransport.on('error', (err: Error) => {
      console.error('[Logger] Error writing to error log file:', err);
    });

    transports.push(errorLogTransport);
  }

  return {
    level: logLevel,
    format: getConsoleFormat(),
    transports,
    exceptionHandlers: logFileEnabled
      ? [
          new DailyRotateFile({
            dirname: path.dirname(logErrorFilePath),
            filename: `exceptions-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: parseMaxSize(logMaxSize),
            maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
            zippedArchive: logCompress,
            format: getFileFormat(),
          }),
        ]
      : [],
    rejectionHandlers: logFileEnabled
      ? [
          new DailyRotateFile({
            dirname: path.dirname(logErrorFilePath),
            filename: `rejections-%DATE%.log`,
            datePattern: 'YYYY-MM-DD',
            maxSize: parseMaxSize(logMaxSize),
            maxFiles: `${parseMaxFiles(logMaxFiles)}d`,
            zippedArchive: logCompress,
            format: getFileFormat(),
          }),
        ]
      : [],
    exitOnError: false,
  };
};

/**
 * Gets Winston logger configuration.
 * 
 * Convenience wrapper around createWinstonLogger for use in NestJS modules.
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Winston logger configuration object
 */
export const getWinstonLoggerConfig = (configService: ConfigService): WinstonLoggerConfig => {
  return createWinstonLogger(configService);
};

/**
 * Creates a Winston logger instance.
 * 
 * Creates and returns a configured Winston logger instance ready for use.
 * 
 * @param configService - NestJS ConfigService instance
 * @returns Configured Winston logger instance
 */
export const createWinstonLoggerInstance = (configService: ConfigService) => {
  const config = createWinstonLogger(configService);
  return WinstonModule.createLogger(config);
};
```

```typescript
import { registerAs } from '@nestjs/config';

/**
 * Mail configuration interface.
 * 
 * Defines the structure of SMTP email service configuration settings.
 */
export interface MailConfig {
  /** SMTP server hostname (optional) */
  mailHost?: string;
  /** SMTP server port (default: 587) */
  mailPort: number;
  /** SMTP username (optional) */
  mailUser?: string;
  /** SMTP password (optional) */
  mailPassword?: string;
  /** Email sender address (default: 'noreply@example.com') */
  mailFrom: string;
  /** Email sender name (default: 'Support') */
  mailFromName: string;
}

/**
 * Mail/SMTP configuration factory.
 * 
 * Provides email service configuration including SMTP server settings
 * and sender information. Used by @nestjs-modules/mailer.
 * 
 * **Environment Variables:**
 * - `MAIL_HOST`: SMTP server hostname (optional)
 * - `MAIL_PORT`: SMTP server port (default: 587)
 * - `MAIL_USERNAME`: SMTP username (optional)
 * - `MAIL_PASSWORD`: SMTP password (optional)
 * - `MAIL_FROM_ADDRESS`: Sender email address (default: 'noreply@example.com')
 * - `MAIL_FROM_NAME`: Sender display name (default: 'Support')
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [mailConfig],
 * })
 * 
 * // In MailModule
 * MailerModule.forRootAsync({
 *   imports: [ConfigModule],
 *   inject: [ConfigService],
 *   useFactory: (config: ConfigService) => ({
 *     transport: {
 *       host: config.get<string>('mail.mailHost'),
 *       port: config.get<number>('mail.mailPort'),
 *       auth: {
 *         user: config.get<string>('mail.mailUser'),
 *         pass: config.get<string>('mail.mailPassword'),
 *       },
 *     },
 *     defaults: {
 *       from: `"${config.get<string>('mail.mailFromName')}" <${config.get<string>('mail.mailFrom')}>`,
 *     },
 *   }),
 * })
 * ```
 * 
 * @returns Mail configuration object
 */
export default registerAs('mail', (): MailConfig => ({
  mailHost: process.env.MAIL_HOST,
  mailPort: parseInt(process.env.MAIL_PORT ?? '587', 10) || 587,
  mailUser: process.env.MAIL_USERNAME,
  mailPassword: process.env.MAIL_PASSWORD,
  mailFrom: process.env.MAIL_FROM_ADDRESS ?? 'noreply@example.com',
  mailFromName: process.env.MAIL_FROM_NAME ?? 'Support',
}));

```

```typescript
import { registerAs } from '@nestjs/config';

/**
 * Security configuration interface.
 * 
 * Defines the structure of security-related configuration settings.
 */
export interface SecurityConfig {
  /** Session management (max devices per user) */
  session: {
    maxSessionsPerUser: number;
  };
  /** Password security settings */
  password: {
    /** Bcrypt hashing rounds (10-15, default: 12) */
    bcryptRounds: number;
    /** Password reset token expiry in milliseconds (default: 3600000 = 1 hour) */
    resetTokenExpiry: number;
    /** Maximum password reset attempts (default: 3) */
    resetMaxAttempts: number;
  };
  /** Account lockout settings */
  lockout: {
    /** Maximum login attempts before lockout (default: 5) */
    maxLoginAttempts: number;
    /** Account lock duration in milliseconds (default: 1800000 = 30 minutes) */
    lockDuration: number;
    /** Failed login reset time in milliseconds (default: 900000 = 15 minutes) */
    failedLoginResetTime: number;
  };
  /** CORS (Cross-Origin Resource Sharing) settings */
  cors: {
    /** Allowed origin domains (comma-separated, default: ['*']) */
    allowedOrigins: string[];
    /** Allowed HTTP methods (comma-separated, default: GET,POST,PUT,DELETE,PATCH,OPTIONS) */
    allowedMethods: string[];
    /** Allowed request headers (comma-separated, default: Content-Type,Authorization,X-Request-ID) */
    allowedHeaders: string[];
    /** Whether to allow credentials (default: true) */
    credentials: boolean;
  };
}

/**
 * Security configuration factory.
 * 
 * Provides security-related settings including password hashing, account
 * lockout policies, and CORS configuration.
 * 
 * **Environment Variables:**
 * 
 * **Password Security:**
 * - `BCRYPT_ROUNDS`: Bcrypt hashing rounds 10-15 (default: 12)
 * - `PASSWORD_RESET_TOKEN_EXPIRY`: Reset token expiry in ms (default: 3600000)
 * - `PASSWORD_RESET_MAX_ATTEMPTS`: Max reset attempts (default: 3)
 * 
 * **Account Lockout:**
 * - `MAX_LOGIN_ATTEMPTS`: Max login attempts before lockout (default: 5)
 * - `ACCOUNT_LOCK_DURATION`: Lock duration in ms (default: 1800000)
 * - `FAILED_LOGIN_RESET_TIME`: Failed login reset time in ms (default: 900000)
 * 
 * **CORS:**
 * - `ALLOWED_ORIGINS`: Comma-separated origins
 *   - **Production:** REQUIRED, must be specific URLs (wildcard '*' is NOT allowed)
 *   - **Development:** Optional, defaults to '*' if not set
 *   - Example: `ALLOWED_ORIGINS=https://example.com,https://app.example.com`
 * - `ALLOWED_METHODS`: Comma-separated HTTP methods (default: GET,POST,PUT,DELETE,PATCH,OPTIONS)
 * - `ALLOWED_HEADERS`: Comma-separated headers (default: Content-Type,Authorization,X-Request-ID)
 * - `CREDENTIALS`: Allow credentials (default: true)
 * 
 * **Security Notes:**
 * - **Production:** Application will FAIL to start if `ALLOWED_ORIGINS` is not set or contains '*'
 * - **Development:** Defaults to `['*']` for convenience
 * - Set specific origins in production: `ALLOWED_ORIGINS=https://example.com,https://app.example.com`
 * - Bcrypt rounds should be 12-15 for production (higher = more secure but slower)
 * - CORS validation happens at startup - invalid configuration will prevent application from starting
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [securityConfig],
 * })
 * 
 * // In main.ts
 * app.enableCors({
 *   origin: config.get<string[]>('security.cors.allowedOrigins'),
 *   methods: config.get<string[]>('security.cors.allowedMethods'),
 *   allowedHeaders: config.get<string[]>('security.cors.allowedHeaders'),
 *   credentials: config.get<boolean>('security.cors.credentials'),
 * })
 * ```
 * 
 * @returns Security configuration object
 */
export default registerAs('security', (): SecurityConfig => ({
  session: {
    maxSessionsPerUser: parseInt(process.env.MAX_SESSIONS_PER_USER ?? '5', 10) || 5,
  },
  password: {
    bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS ?? '12', 10) || 12,
    resetTokenExpiry: parseInt(process.env.PASSWORD_RESET_TOKEN_EXPIRY ?? '3600000', 10) || 3600000,
    resetMaxAttempts: parseInt(process.env.PASSWORD_RESET_MAX_ATTEMPTS ?? '3', 10) || 3,
  },
  lockout: {
    maxLoginAttempts: parseInt(process.env.MAX_LOGIN_ATTEMPTS ?? '5', 10) || 5,
    lockDuration: parseInt(process.env.ACCOUNT_LOCK_DURATION ?? '1800000', 10) || 1800000,
    failedLoginResetTime: parseInt(process.env.FAILED_LOGIN_RESET_TIME ?? '900000', 10) || 900000,
  },
  cors: {
    allowedOrigins: (() => {
      const nodeEnv = process.env.NODE_ENV || 'development';
      const originsEnv = process.env.ALLOWED_ORIGINS;
      
      // In production, require specific origins (no wildcard)
      if (nodeEnv === 'production') {
        if (!originsEnv || originsEnv.trim() === '' || originsEnv === '*') {
          throw new Error(
            'ALLOWED_ORIGINS must be set to specific origins in production. ' +
            'Wildcard "*" is not allowed. Example: ALLOWED_ORIGINS=https://example.com,https://app.example.com'
          );
        }
        const origins = originsEnv.split(',').map((o) => o.trim()).filter((o) => o && o !== '*');
        if (origins.length === 0) {
          throw new Error(
            'ALLOWED_ORIGINS must contain at least one valid origin URL in production. ' +
            'Example: ALLOWED_ORIGINS=https://example.com,https://app.example.com'
          );
        }
        return origins;
      }
      
      // In development/staging, allow wildcard or specific origins
      if (originsEnv) {
        return originsEnv.split(',').map((o) => o.trim()).filter(Boolean);
      }
      
      // Default to wildcard for development
      return ['*'];
    })(),
    allowedMethods: process.env.ALLOWED_METHODS?.split(',').map((m) => m.trim()) ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: process.env.ALLOWED_HEADERS?.split(',').map((h) => h.trim()) ?? ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: process.env.CREDENTIALS === undefined || process.env.CREDENTIALS === 'true',
  },
}));

```

```typescript
import { ExecutionContext } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Factory for ThrottlerModule options.
 * Throttle applied only to auth endpoints; other APIs have no throttle.
 * Skips throttling in test env to avoid e2e flakiness.
 */
export function getThrottlerModuleOptions(configService: ConfigService) {
  const skipIf = (_context: ExecutionContext) =>
    configService.get<string>('app.nodeEnv', 'development') === 'test';

  return {
    skipIf,
    throttlers: [
    {
      name: 'auth-sensitive',
      ttl: configService.get<number>('throttle.authSensitive.ttl', 900000),
      limit: configService.get<number>('throttle.authSensitive.limit', 5),
    },
    {
      name: 'auth-refresh',
      ttl: configService.get<number>('throttle.authRefresh.ttl', 60000),
      limit: configService.get<number>('throttle.authRefresh.limit', 10),
    },
    {
      name: 'auth-register',
      ttl: configService.get<number>('throttle.authRegister.ttl', 3600000),
      limit: configService.get<number>('throttle.authRegister.limit', 3),
    },
    ],
  };
}
```

```typescript
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
```

```typescript
```

# authcontroller code

```typescript
import { Controller, Post, Body, HttpCode, HttpStatus, Ip, Req, Get, Delete, Param, UseGuards } from '@nestjs/common';
import { ParseBigIntPipe } from '../../common/pipes/parse-bigint.pipe';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';
import { UserRole } from '@prisma/client';
import { AuthService } from './auth.service';
import { Public } from '../../common/decorators/public.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RequestUser } from '../../common/interfaces/request-user.interface';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolesGuard } from '../../common/guards/roles.guard';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { RegisterStaffRequestDto } from './dto/requests/register-staff.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password.request.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { VerifyEmployeeRequestDto } from './dto/requests/verify-employee.request.dto';
import { EmailVerifySendRequestDto } from './dto/requests/email-verify-send.request.dto';
import { EmailVerifyCheckRequestDto } from './dto/requests/email-verify-check.request.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) { }

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-register': {} })
  async register(
    @Body() dto: RegisterRequestDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.register(dto, ipAddress, userAgent);
  }

  @Post('register/staff')
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.SUPER_ADMIN)
  async registerStaff(
    @Body() dto: RegisterStaffRequestDto,
    @CurrentUser() user: RequestUser,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.registerStaff(
      dto,
      BigInt(user.sub || user.id),
      ipAddress,
      userAgent,
    );
  }

  @Public()
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async login(
    @Body() dto: LoginRequestDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.login(dto, ipAddress, userAgent);
  }

  @Post('logout')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async logout(
    @CurrentUser() user: RequestUser,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    const sessionId = user.sessionId ? BigInt(user.sessionId) : null;
    if (!sessionId) {
      return { message: 'Logged out successfully' };
    }
    return this.authService.logout(BigInt(user.sub || user.id), sessionId, ipAddress, userAgent);
  }

  @Public()
  @Post('employee/verify')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async verifyEmployee(@Body() _dto: VerifyEmployeeRequestDto) {
    return this.authService.verifyEmployee();
  }

  @Public()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-refresh': {} })
  async refreshToken(
    @Body() dto: RefreshTokenRequestDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.refreshToken(dto, ipAddress, userAgent);
  }

  @Get('details')
  @UseGuards(JwtAuthGuard)
  async getCurrentUser(@CurrentUser() user: RequestUser) {
    return this.authService.getProfile(BigInt(user.sub || user.id));
  }

  @Get('sessions')
  @UseGuards(JwtAuthGuard)
  async getSessions(@CurrentUser() user: RequestUser) {
    return this.authService.getSessions(BigInt(user.sub || user.id));
  }

  @Delete('sessions/revoke/:sessionId')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeSession(
    @CurrentUser() user: RequestUser,
    @Param('sessionId', ParseBigIntPipe) sessionId: bigint,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.revokeSession(
      BigInt(user.sub || user.id),
      sessionId,
      ipAddress,
      userAgent,
    );
  }

  @Post('sessions/revoke-all')
  @UseGuards(JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  async revokeAllSessions(
    @CurrentUser() user: RequestUser,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.logoutAll(BigInt(user.sub || user.id), ipAddress, userAgent);
  }

  @Post('change-password')
  @UseGuards(ThrottlerGuard, JwtAuthGuard)
  @HttpCode(HttpStatus.OK)
  @Throttle({ 'auth-sensitive': {} })
  async changePassword(@CurrentUser() user: RequestUser,
    @Body() dto: ChangePasswordRequestDto,
    @Ip() ipAddress: string,
    @Req() req: Request,
  ) {
    const userAgent = req.headers['user-agent'] || 'Unknown';
    return this.authService.changePassword(BigInt(user.sub || user.id), dto, ipAddress, userAgent);
  }

  @Public()
  @Post('forgot-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async forgotPassword(@Body() dto: ForgotPasswordRequestDto) {
    return this.authService.forgotPassword(dto);
  }

  @Public()
  @Post('reset-password')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async resetPassword(@Body() dto: ResetPasswordRequestDto) {
    return this.authService.resetPassword(dto);
  }

  /** Send email verification OTP. No database save. Returns hashed token + expiresAt. */
  @Public()
  @Post('email-verify/send')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async sendEmailVerifyOtp(@Body() dto: EmailVerifySendRequestDto) {
    return this.authService.sendEmailVerifyOtp(dto.email);
  }

  /** Verify email OTP using token from send response. No database check. */
  @Public()
  @Post('email-verify/check')
  @HttpCode(HttpStatus.OK)
  @UseGuards(ThrottlerGuard)
  @Throttle({ 'auth-sensitive': {} })
  async verifyEmailOtp(@Body() dto: EmailVerifyCheckRequestDto) {
    return this.authService.verifyEmailOtp(dto.otp, dto.token);
  }
}

auth servisse logic =

import { Injectable, UnauthorizedException, ForbiddenException, Logger, ConflictException, BadRequestException, } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../infrastructure/database/prisma.service';
import { CacheService } from '../../infrastructure/cache/cache.service';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { UserRole, UserStatus, User, RiskLevel, NotificationType } from '@prisma/client';
import { plainToInstance } from 'class-transformer';
import { RegisterRequestDto } from './dto/requests/register.request.dto';
import { RegisterStaffRequestDto, STAFF_REGISTER_ALLOWED_ROLES, } from './dto/requests/register-staff.request.dto';
import { LoginRequestDto } from './dto/requests/login.request.dto';
import { AuthUserResponseDto } from './dto/responses/auth-user.response.dto';
import { ChangePasswordRequestDto } from './dto/requests/change-password.request.dto';
import { ForgotPasswordRequestDto } from './dto/requests/forgot-password.request.dto';
import { ResetPasswordRequestDto } from './dto/requests/reset-password.request.dto';
import { RefreshTokenRequestDto } from './dto/requests/refresh-token.request.dto';
import { MailService } from '../mail/mail.service';
import { NotificationsService } from '../notifications/notifications.service';
import { logAudit } from '../../common/utils/audit.util';

const DUMMY_PASSWORD_HASH = '$2b$12$PcXSboIVoeL.6tM7V2fIV.j7.3/1/1/1/1/1/1/1/1/1/1/1/1';
/** Email verification OTP expiry: 10 minutes (no database; token bound to expiry) */
const EMAIL_VERIFY_OTP_EXPIRY_MS = 10 * 60 * 1000;

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);
  private readonly MAX_LOGIN_ATTEMPTS: number;
  private readonly ACCOUNT_LOCK_DURATION: number;
  private readonly FAILED_LOGIN_RESET_TIME: number;
  private readonly BCRYPT_ROUNDS: number;
  private readonly PASSWORD_RESET_TOKEN_EXPIRY: number;
  private readonly PASSWORD_RESET_MAX_ATTEMPTS: number;
  private readonly REFRESH_TOKEN_EXPIRY_DAYS: number;
  private readonly MAX_SESSIONS_PER_USER: number;

  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly mailService: MailService,
    private readonly notificationsService: NotificationsService,
    private readonly cache: CacheService,
  ) {
    this.MAX_LOGIN_ATTEMPTS = this.configService.get<number>('security.lockout.maxLoginAttempts', 5);
    this.ACCOUNT_LOCK_DURATION = this.configService.get<number>('security.lockout.lockDuration', 1800000);
    this.FAILED_LOGIN_RESET_TIME = this.configService.get<number>('security.lockout.failedLoginResetTime', 900000);
    this.BCRYPT_ROUNDS = this.configService.get<number>('security.password.bcryptRounds', 12);
    this.PASSWORD_RESET_TOKEN_EXPIRY = this.configService.get<number>('security.password.resetTokenExpiry', 3600000);
    this.PASSWORD_RESET_MAX_ATTEMPTS = this.configService.get<number>('security.password.resetMaxAttempts', 3);

    // Parse refresh token expiry (e.g., '7d' -> 7 days)
    const refreshExpiry = this.configService.get<string>('jwt.refreshExpiresIn', '7d');
    this.REFRESH_TOKEN_EXPIRY_DAYS = this.parseExpiryToDays(refreshExpiry);
    this.MAX_SESSIONS_PER_USER = this.configService.get<number>('security.session.maxSessionsPerUser', 5);
  }

  /**
   * Parse expiry string (e.g., '7d', '30d', '1h') to days
   */
  private parseExpiryToDays(expiry: string): number {
    const match = expiry.match(/^(\d+)([dhms])$/);
    if (!match) return 7; // Default 7 days

    const value = parseInt(match[1], 10);
    const unit = match[2];

    switch (unit) {
      case 'd': return value;
      case 'h': return value / 24;
      case 'm': return value / (24 * 60);
      case 's': return value / (24 * 60 * 60);
      default: return 7;
    }
  }

  /**
   * Validates uniqueness of email, phoneNo, employeeId, and nic (used by both register and registerStaff).
   * Throws ConflictException with a clear message when any value is already in use.
   */
  private async assertUserUniqueness(params: {
    email: string;
    phoneNo?: string | null;
    employeeId?: string | null;
    nic?: string | null;
  }): Promise<void> {
    const orConditions: Array<{ email: string } | { phoneNo: string | null } | { employeeId: string | null } | { nic: string | null }> = [
      { email: params.email },
      ...(params.phoneNo ? [{ phoneNo: params.phoneNo }] : []),
      ...(params.employeeId ? [{ employeeId: params.employeeId }] : []),
      ...(params.nic ? [{ nic: params.nic }] : []),
    ];

    const existingUser = await this.prisma.user.findFirst({
      where: { OR: orConditions, deletedAt: null },
    });

    if (existingUser) {
      if (existingUser.email === params.email) {
        throw new ConflictException('Email already in use');
      }
      if (params.phoneNo && existingUser.phoneNo === params.phoneNo) {
        throw new ConflictException('Phone number already in use');
      }
      if (params.employeeId && existingUser.employeeId === params.employeeId) {
        throw new ConflictException('Employee ID already in use');
      }
      if (params.nic && existingUser.nic === params.nic) {
        throw new ConflictException('NIC already in use');
      }
    }
  }

  async register(dto: RegisterRequestDto, ipAddress: string, userAgent: string) {
    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    await this.assertUserUniqueness({
      email: dto.email,
      phoneNo: dto.phoneNo ?? null,
      employeeId: dto.employeeId ?? null,
      nic: dto.nic ?? null,
    });

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          employeeId: dto.employeeId,
          address: dto.address,
          nic: dto.nic,
          phoneNo: dto.phoneNo,
          role: UserRole.USER,
          status: UserStatus.ACTIVE,
          lastLoginIp: ipAddress,
        },
      });

      await logAudit(tx, {
        userId: user.id,
        action: 'USER_REGISTERED',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress,
        userAgent,
        riskLevel: RiskLevel.LOW,
      });

      return user;
    });

    try {
      await this.notificationsService.create({
        userId: newUser.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Classifieds!',
        message: `Hi ${newUser.fullName}, your account has been successfully created.`,
        data: { email: newUser.email }
      });
    } catch (error) {
      this.logger.error(`Failed to create welcome notification for user ${newUser.id}`, error);
    }

    try {
      await this.mailService.sendWelcomeEmail(newUser.email, newUser.fullName);
    } catch (error) {
      this.logger.error(`Failed to send welcome email for user ${newUser.id}`, error);
    }

    return {
      message: 'User registered successfully.',
      email: newUser.email,
      createdAt: newUser.createdAt,
    };
  }


  async registerStaff(
    dto: RegisterStaffRequestDto,
    createdByUserId: bigint,
    ipAddress: string,
    userAgent: string,
  ) {
    // Validation: only Super Admin can create staff accounts
    const creator = await this.prisma.user.findUnique({
      where: { id: createdByUserId },
      select: { role: true, deletedAt: true },
    });
    if (!creator || creator.deletedAt) {
      throw new UnauthorizedException('User not found');
    }
    if (creator.role !== UserRole.SUPER_ADMIN) {
      throw new ForbiddenException('Only Super Admin can create Admin or Moderator accounts.');
    }

    // Validation: only ADMIN or MODERATOR can be assigned
    if (!STAFF_REGISTER_ALLOWED_ROLES.includes(dto.role)) {
      throw new BadRequestException(
        'Only ADMIN or MODERATOR accounts can be created. USER, SUPER_ADMIN, and GUEST are not allowed.',
      );
    }

    if (dto.password !== dto.confirmPassword) {
      throw new BadRequestException('Password and confirm password do not match');
    }

    await this.assertUserUniqueness({
      email: dto.email,
      phoneNo: dto.phoneNo ?? null,
      employeeId: dto.employeeId ?? null,
      nic: dto.nic ?? null,
    });

    const passwordHash = await bcrypt.hash(dto.password, this.BCRYPT_ROUNDS);

    const newUser = await this.prisma.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: {
          email: dto.email,
          passwordHash,
          fullName: dto.fullName,
          employeeId: dto.employeeId,
          address: dto.address,
          nic: dto.nic,
          phoneNo: dto.phoneNo,
          role: dto.role,
          status: UserStatus.ACTIVE,
          lastLoginIp: ipAddress,
        },
      });

      await logAudit(tx, {
        userId: user.id,
        action: 'STAFF_REGISTERED',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress,
        userAgent,
        riskLevel: RiskLevel.LOW,
        metadata: { createdByUserId: createdByUserId.toString(), role: dto.role },
      });

      return user;
    });

    try {
      await this.notificationsService.create({
        userId: newUser.id,
        type: NotificationType.SYSTEM,
        title: 'Welcome to Classifieds (Staff)',
        message: `Hi ${newUser.fullName}, your staff account has been created with role ${newUser.role}.`,
        data: { email: newUser.email, role: newUser.role },
      });
    } catch (error) {
      this.logger.error(`Failed to create welcome notification for staff ${newUser.id}`, error);
    }

    try {
      await this.mailService.sendWelcomeEmail(newUser.email, newUser.fullName);
    } catch (error) {
      this.logger.error(`Failed to send welcome email for staff ${newUser.id}`, error);
    }

    return {
      message: 'Staff registered successfully.',
      email: newUser.email,
      role: newUser.role,
      createdAt: newUser.createdAt,
    };
  }

  /**
   * Employee verify - placeholder for future verification logic.
   * Returns success response; implement actual logic later.
   */
  async verifyEmployee(): Promise<{ message: string }> {
    return { message: 'Employee verification successful.' };
  }

  async login(dto: LoginRequestDto, ipAddress: string, userAgent: string) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.deletedAt) {
      await bcrypt.compare('dummy_password', DUMMY_PASSWORD_HASH);
      throw new UnauthorizedException('Invalid credentials');
    }

    if (user.status === UserStatus.BANNED) throw new ForbiddenException('Account has been banned');
    if (user.status === UserStatus.SUSPENDED) throw new ForbiddenException('Account suspended');

    if (user.accountLockedUntil && user.accountLockedUntil > new Date()) {
      throw new ForbiddenException('Account is temporarily locked due to many failed attempts.');
    }

    const isMatch = await bcrypt.compare(dto.password, user.passwordHash || '');
    if (!isMatch) {
      await this.handleFailedLogin(user, ipAddress, userAgent);
      throw new UnauthorizedException('Invalid credentials');
    }

    await this.handleSuccessfulLogin(user, ipAddress, userAgent);

    const now = new Date();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    const session = await this.prisma.$transaction(async (tx) => {
      const activeCount = await tx.userSession.count({
        where: { userId: user.id, expiresAt: { gt: now } },
      });
      if (activeCount >= this.MAX_SESSIONS_PER_USER) {
        const oldest = await tx.userSession.findFirst({
          where: { userId: user.id },
          orderBy: { lastActiveAt: 'asc' },
        });
        if (oldest) {
          await tx.userSession.delete({ where: { id: oldest.id } });
          await logAudit(tx, {
            userId: user.id,
            action: 'SESSION_EVICTED',
            entity: 'UserSession',
            entityId: oldest.id.toString(),
            ipAddress,
            userAgent,
            riskLevel: RiskLevel.LOW,
            metadata: { reason: 'Max sessions reached (LRU eviction)' },
          });
          this.logger.log(`Session evicted for user ${user.id} (LRU)`);
        }
      }

      return tx.userSession.create({
        data: {
          userId: user.id,
          refreshTokenHash: 'pending',
          ipAddress,
          userAgent,
          lastActiveAt: now,
          expiresAt,
        },
      });
    });

    const { refreshToken } = await this.generateRefreshToken(user, session.id);
    const tokenHash = crypto.createHash('sha256').update(refreshToken).digest('hex');
    await this.prisma.userSession.update({
      where: { id: session.id },
      data: { refreshTokenHash: tokenHash },
    });

    const accessToken = await this.generateAccessToken(user, session.id);

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId: user.id,
        action: 'SESSION_CREATED',
        entity: 'UserSession',
        entityId: session.id.toString(),
        ipAddress,
        userAgent,
        riskLevel: RiskLevel.LOW,
      });
    });

    return {
      message: 'Login successful',
      accessToken,
      refreshToken,
    };
  }

  private async handleSuccessfulLogin(user: User, ip: string, agent: string) {
    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        failedLoginCount: 0,
        accountLockedUntil: null,
        lastLoginAt: new Date(),
        lastLoginIp: ip,
      },
    });

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId: user.id,
        action: 'USER_LOGIN',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress: ip,
        userAgent: agent,
        riskLevel: RiskLevel.LOW,
      });
    });

    try {
      await this.notificationsService.create({
        userId: user.id,
        type: NotificationType.ACCOUNT,
        title: 'New Login Detected',
        message: `You have successfully logged in from IP: ${ip}`,
        data: { ip, agent: agent.substring(0, 50) }
      });
    } catch (error) {
      this.logger.error(`Failed to create login notification for user ${user.id}`, error);
    }
  }

  async logout(userId: bigint, sessionId: bigint, ipAddress: string, userAgent: string) {
    const deleted = await this.prisma.userSession.deleteMany({
      where: { id: sessionId, userId },
    });

    if (deleted.count > 0) {
      await this.prisma.$transaction(async (tx) => {
        await logAudit(tx, {
          userId,
          action: 'SESSION_REVOKED',
          entity: 'UserSession',
          entityId: sessionId.toString(),
          ipAddress,
          userAgent,
          riskLevel: RiskLevel.LOW,
        });
      });
    }

    try {
      await this.notificationsService.create({
        userId,
        type: NotificationType.ACCOUNT,
        title: 'Logged Out',
        message: 'You have been successfully logged out from your account.',
      });
    } catch (error) {
      this.logger.error('Failed to create logout notification', error);
    }

    return { message: 'Logged out successfully' };
  }

  /**
   * Refresh access token using a valid refresh token (session-based)
   */
  async refreshToken(dto: RefreshTokenRequestDto, ipAddress: string, userAgent: string) {
    try {
      const payload = await this.jwtService.verifyAsync(dto.refreshToken, {
        secret: this.configService.getOrThrow('jwt.refreshSecret'),
        issuer: this.configService.get<string>('jwt.issuer', 'classifieds-api'),
        audience: this.configService.get<string>('jwt.audience', 'classifieds-client'),
      });

      if (payload.type !== 'refresh') {
        throw new UnauthorizedException('Invalid token type');
      }

      const userId = BigInt(payload.sub);
      const sessionId = payload.sessionId ? BigInt(payload.sessionId) : null;

      if (!sessionId) {
        throw new UnauthorizedException('Invalid refresh token - missing session');
      }

      const session = await this.prisma.userSession.findFirst({
        where: { id: sessionId, userId },
        include: { user: true },
      });

      if (!session || !session.user) {
        throw new UnauthorizedException('Session not found');
      }

      const user = session.user;
      if (user.deletedAt) {
        throw new UnauthorizedException('User not found');
      }

      if (user.status === UserStatus.BANNED) {
        throw new ForbiddenException('Account has been banned');
      }

      if (user.status === UserStatus.SUSPENDED) {
        throw new ForbiddenException('Account suspended');
      }

      if (session.expiresAt < new Date()) {
        await this.prisma.userSession.delete({ where: { id: sessionId } });
        throw new UnauthorizedException('Refresh token has expired');
      }

      const tokenHash = crypto.createHash('sha256').update(dto.refreshToken).digest('hex');
      if (tokenHash !== session.refreshTokenHash) {
        this.logger.warn(`Refresh token reuse detected for user ${userId}`);
        await this.revokeAllUserSessions(userId);
        throw new UnauthorizedException('Invalid refresh token - all sessions revoked');
      }

      const now = new Date();
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: { lastActiveAt: now },
      });

      const { refreshToken: newRefreshToken } = await this.generateRefreshToken(user, sessionId);
      const newTokenHash = crypto.createHash('sha256').update(newRefreshToken).digest('hex');
      await this.prisma.userSession.update({
        where: { id: sessionId },
        data: { refreshTokenHash: newTokenHash },
      });

      const newAccessToken = await this.generateAccessToken(user, sessionId);

      await this.prisma.$transaction(async (tx) => {
        await logAudit(tx, {
          userId,
          action: 'TOKEN_REFRESHED',
          entity: 'UserSession',
          entityId: sessionId.toString(),
          ipAddress,
          userAgent,
          riskLevel: RiskLevel.LOW,
        });
      });

      this.logger.log(`Token refreshed for user ${userId}`);

      return {
        message: 'Token refreshed successfully',
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      };
    } catch (error) {
      if (error instanceof UnauthorizedException || error instanceof ForbiddenException) {
        throw error;
      }

      this.logger.error('Token refresh failed', error);
      throw new UnauthorizedException('Invalid or expired refresh token');
    }
  }

  /**
   * Revoke all sessions for a user (e.g. token reuse / theft detection)
   */
  private async revokeAllUserSessions(userId: bigint) {
    await this.prisma.userSession.deleteMany({ where: { userId } });

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId,
        action: 'ALL_SESSIONS_REVOKED',
        entity: 'User',
        entityId: userId.toString(),
        ipAddress: '',
        riskLevel: RiskLevel.HIGH,
        metadata: { reason: 'Possible token theft detected' },
      });
    });
  }

  async changePassword(userId: bigint, dto: ChangePasswordRequestDto, ipAddress: string, userAgent: string) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });

    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found');
    }

    const isMatch = await bcrypt.compare(dto.oldPassword, user.passwordHash || '');
    if (!isMatch) {
      throw new BadRequestException('Invalid old password');
    }

    const newHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: userId },
        data: {
          passwordHash: newHash,
          passwordChangedAt: new Date(),
        },
      });
      await tx.userSession.deleteMany({ where: { userId } });

      await logAudit(tx, {
        userId,
        action: 'PASSWORD_CHANGED',
        entity: 'User',
        entityId: userId.toString(),
        ipAddress,
        userAgent,
        riskLevel: RiskLevel.HIGH,
      });
    });

    try {
      await this.notificationsService.create({
        userId,
        type: NotificationType.SECURITY,
        title: 'Security Alert: Password Changed',
        message: 'Your account password was recently changed. If this was not you, please contact support.',
        data: { ip: ipAddress }
      });
    } catch (error) {
      this.logger.error('Failed to create password change notification', error);
    }

    await this.cache.del(`user:profile:${userId}`);

    return { message: 'Password changed successfully' };
  }

  async resetPassword(dto: ResetPasswordRequestDto) {
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('Passwords do not match');
    }

    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || !user.passwordResetOtpHash || !user.passwordResetExpires) {
      throw new BadRequestException('Invalid request or OTP expired');
    }

    if (new Date() > user.passwordResetExpires) {
      throw new BadRequestException('OTP has expired');
    }

    const isOtpValid = await bcrypt.compare(dto.otp, user.passwordResetOtpHash);
    if (!isOtpValid) {
      throw new BadRequestException('Invalid OTP code');
    }

    const newPasswordHash = await bcrypt.hash(dto.newPassword, this.BCRYPT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: { id: user.id },
        data: {
          passwordHash: newPasswordHash,
          passwordResetOtpHash: null,
          passwordResetExpires: null,
          passwordChangedAt: new Date(),
        },
      });
      await tx.userSession.deleteMany({ where: { userId: user.id } });

      await logAudit(tx, {
        userId: user.id,
        action: 'PASSWORD_RESET_SUCCESS',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress: '',
        riskLevel: RiskLevel.HIGH,
      });
    });

    try {
      await this.notificationsService.create({
        userId: user.id,
        type: NotificationType.SECURITY,
        title: 'Password Reset Successful',
        message: 'Your password has been successfully reset using the OTP.',
        data: { email: user.email }
      });
    } catch (error) {
      this.logger.error('Failed to create reset password notification', error);
    }

    await this.cache.del(`user:profile:${user.id}`);

    return { message: 'Password reset successfully' };
  }


  // HELPERS

  private async handleFailedLogin(user: User, ip: string, agent: string) {
    // Check if failed login count should be reset (last attempt was more than FAILED_LOGIN_RESET_TIME ago)
    const lastFailedAttempt = user.updatedAt;
    const timeSinceLastAttempt = Date.now() - lastFailedAttempt.getTime();

    // Reset count if enough time has passed since last failed attempt
    const currentCount = timeSinceLastAttempt > this.FAILED_LOGIN_RESET_TIME ? 0 : user.failedLoginCount;
    const newCount = currentCount + 1;
    let lockUntil = null;

    if (newCount >= this.MAX_LOGIN_ATTEMPTS) {
      lockUntil = new Date(Date.now() + this.ACCOUNT_LOCK_DURATION);
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: { failedLoginCount: newCount, accountLockedUntil: lockUntil },
    });

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId: user.id,
        action: 'LOGIN_FAILED',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress: ip,
        userAgent: agent,
        riskLevel: RiskLevel.MEDIUM,
        metadata: { reason: 'Invalid Password', attempt: newCount },
      });
    });
  }

  private async generateAccessToken(user: User, sessionId: bigint): Promise<string> {
    const payload = {
      sub: user.id.toString(),
      sessionId: sessionId.toString(),
      email: user.email,
      role: user.role,
      type: 'access' as const,
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('jwt.secret'),
      expiresIn: this.configService.get('jwt.expiresIn'),
      issuer: this.configService.get<string>('jwt.issuer', 'classifieds-api'),
      audience: this.configService.get<string>('jwt.audience', 'classifieds-client'),
    });
  }

  /**
   * Generate a refresh token (session-based; hash stored in UserSession)
   */
  private async generateRefreshToken(user: User, sessionId: bigint): Promise<{ refreshToken: string; expiresAt: Date }> {
    const payload = {
      sub: user.id.toString(),
      sessionId: sessionId.toString(),
      type: 'refresh' as const,
      jti: crypto.randomUUID(),
    };

    const refreshToken = await this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow('jwt.refreshSecret'),
      expiresIn: this.configService.get('jwt.refreshExpiresIn', '7d'),
      issuer: this.configService.get<string>('jwt.issuer', 'classifieds-api'),
      audience: this.configService.get<string>('jwt.audience', 'classifieds-client'),
    });

    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + this.REFRESH_TOKEN_EXPIRY_DAYS);

    return { refreshToken, expiresAt };
  }

  async forgotPassword(dto: ForgotPasswordRequestDto) {
    const user = await this.prisma.user.findUnique({ where: { email: dto.email } });

    if (!user || user.status === UserStatus.DELETED || user.status === UserStatus.BANNED) {
      return { message: 'If this email exists, an OTP has been sent.' };
    }

    // Check password reset rate limit (max attempts within expiry window)
    const recentResetAttempts = await this.prisma.auditLog.count({
      where: {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        createdAt: { gte: new Date(Date.now() - this.PASSWORD_RESET_TOKEN_EXPIRY) },
      },
    });

    if (recentResetAttempts >= this.PASSWORD_RESET_MAX_ATTEMPTS) {
      this.logger.warn(`Password reset rate limit exceeded for user ${user.id}`);
      return { message: 'If this email exists, an OTP has been sent.' }; // Don't reveal rate limit
    }

    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const otpHash = await bcrypt.hash(otp, 10);
    const expiresAt = new Date(Date.now() + this.PASSWORD_RESET_TOKEN_EXPIRY);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetOtpHash: otpHash,
        passwordResetExpires: expiresAt,
      },
    });

    await this.mailService.sendPasswordResetOtp(user.email, otp);

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId: user.id,
        action: 'FORGOT_PASSWORD_REQUEST',
        entity: 'User',
        entityId: user.id.toString(),
        ipAddress: '',
        riskLevel: RiskLevel.LOW,
      });
    });

    return { message: 'If this email exists, an OTP has been sent.' };
  }

  /**
   * Send email verification OTP. No database save or check.
   * Generates 4-digit OTP, sends to email, returns a single token (payload + HMAC) for later verification.
   * Token encodes email and expiresAt so verify request body only needs { otp, token }.
   */
  async sendEmailVerifyOtp(email: string) {
    const otp = Math.floor(1000 + Math.random() * 9000).toString();
    const expiresAtMs = Date.now() + EMAIL_VERIFY_OTP_EXPIRY_MS;
    const expiresAt = String(expiresAtMs);

    const sent = await this.mailService.sendEmailVerifyOtp(email, otp);
    if (!sent) {
      this.logger.warn(`Failed to send email verify OTP to ${email}`);
      throw new BadRequestException('Failed to send verification code. Please try again.');
    }

    const secret = this.configService.getOrThrow<string>('jwt.secret');
    const payload = Buffer.from(JSON.stringify({ email, expiresAt }), 'utf8').toString('base64url');
    const hmac = crypto.createHmac('sha256', secret).update(`${email}:${otp}:${expiresAt}`).digest('hex');
    const token = `${payload}.${hmac}`;

    return {
      message: 'Verification code sent to your email',
      token,
    };
  }

  /**
   * Verify email OTP using token from send-otp response.
   * Request body: { otp, token } only. Token contains email and expiresAt (payload.hmac).
   */
  async verifyEmailOtp(otp: string, token: string) {
    const parts = token.split('.');
    if (parts.length !== 2) {
      throw new BadRequestException('Invalid verification token.');
    }
    let payload: { email: string; expiresAt: string };
    try {
      payload = JSON.parse(Buffer.from(parts[0], 'base64url').toString('utf8'));
    } catch {
      throw new BadRequestException('Invalid verification token.');
    }
    const { email, expiresAt } = payload;
    if (!email || !expiresAt) {
      throw new BadRequestException('Invalid verification token.');
    }

    const expiresAtMs = parseInt(expiresAt, 10);
    if (Number.isNaN(expiresAtMs) || Date.now() > expiresAtMs) {
      throw new BadRequestException('Verification code has expired. Please request a new one.');
    }

    const secret = this.configService.getOrThrow<string>('jwt.secret');
    const expectedHmac = crypto.createHmac('sha256', secret).update(`${email}:${otp}:${expiresAt}`).digest('hex');
    const receivedHmac = parts[1];
    const expectedBuf = Buffer.from(expectedHmac, 'hex');
    const receivedBuf = Buffer.from(receivedHmac, 'hex');
    if (expectedBuf.length !== receivedBuf.length || expectedBuf.length !== 32 || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
      throw new BadRequestException('Invalid verification code or token.');
    }

    return {
      message: 'Email verified successfully',
      verified: true,
    };
  }

  async getSessions(userId: bigint) {
    const sessions = await this.prisma.userSession.findMany({
      where: { userId, expiresAt: { gt: new Date() } },
      orderBy: { lastActiveAt: 'desc' },
      select: {
        id: true,
        deviceName: true,
        ipAddress: true,
        userAgent: true,
        lastActiveAt: true,
        createdAt: true,
      },
    });
    return {
      message: 'Sessions retrieved',
      sessions: sessions.map((s) => ({
        id: s.id.toString(),
        deviceName: s.deviceName,
        ipAddress: s.ipAddress,
        userAgent: s.userAgent,
        lastActiveAt: s.lastActiveAt,
        createdAt: s.createdAt,
      })),
    };
  }

  async revokeSession(userId: bigint, sessionId: bigint, ipAddress: string, userAgent: string) {
    const deleted = await this.prisma.userSession.deleteMany({
      where: { id: sessionId, userId },
    });

    if (deleted.count > 0) {
      await this.prisma.$transaction(async (tx) => {
        await logAudit(tx, {
          userId,
          action: 'SESSION_REVOKED',
          entity: 'UserSession',
          entityId: sessionId.toString(),
          ipAddress,
          userAgent,
          riskLevel: RiskLevel.LOW,
          metadata: { reason: 'User revoked specific session' },
        });
      });
    }

    return {
      message: deleted.count > 0 ? 'Session revoked successfully' : 'Session not found',
      ...(deleted.count > 0 && { sessionId: sessionId.toString() }),
    };
  }

  async logoutAll(userId: bigint, ipAddress: string, userAgent: string) {
    const deleted = await this.prisma.userSession.deleteMany({ where: { userId } });

    await this.prisma.$transaction(async (tx) => {
      await logAudit(tx, {
        userId,
        action: 'ALL_SESSIONS_REVOKED',
        entity: 'User',
        entityId: userId.toString(),
        ipAddress,
        userAgent,
        riskLevel: RiskLevel.HIGH,
        metadata: { reason: 'User requested logout all devices' },
      });
    });

    return {
      message: `Logged out from ${deleted.count} device(s) successfully`,
      revokedCount: deleted.count,
    };
  }

  async getProfile(userId: bigint) {
    const cacheKey = `user:profile:${userId}`;
    const cached = await this.cache.get<{ message: string; user: AuthUserResponseDto }>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit: getProfile(${userId})`);
      return cached;
    }

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.deletedAt || user.status !== UserStatus.ACTIVE) {
      throw new UnauthorizedException('User not found');
    }
    const result = {
      message: 'Profile retrieved',
      user: plainToInstance(AuthUserResponseDto, user, { excludeExtraneousValues: true })
    };

    await this.cache.set(cacheKey, result, 900); // 15 min TTL
    return result;
  }
}

auth, interfaces=

import { UserRole } from '@prisma/client';

export interface JwtPayload {
  sub: string;
  sessionId?: string;
  email?: string;
  role?: UserRole;
  type: 'access' | 'refresh';
  jti?: string;
  iat?: number;
  exp?: number;
}

,export interface Tokens {
  accessToken: string;
}

,stratagy=import { Injectable, UnauthorizedException, Logger } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { ConfigService } from '@nestjs/config';
import { UserStatus } from '@prisma/client';
import { PrismaService } from '@infrastructure/database/prisma.service';
import { JwtPayload } from '../interfaces/jwt-payload.interface';
import { RequestUser } from '../../../common/interfaces/request-user.interface';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt') {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {

    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('jwt.secret'),
      issuer: configService.get<string>('jwt.issuer', 'classifieds-api'),
      audience: configService.get<string>('jwt.audience', 'classifieds-client'),
    });
  }

  async validate(payload: JwtPayload) {
    if (payload.type !== 'access') {
      this.logger.warn(`Invalid token type: ${payload.type}`);
      throw new UnauthorizedException('Invalid token type');
    }

    if (!payload.sessionId) {
      this.logger.warn('Access token missing sessionId - re-login required');
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    const sessionId = BigInt(payload.sessionId);
    const session = await this.prisma.userSession.findFirst({
      where: { id: sessionId, userId: BigInt(payload.sub), expiresAt: { gt: new Date() } },
      include: { user: true },
    });

    if (!session || !session.user) {
      this.logger.warn(`Session not found or expired: ${sessionId}`);
      throw new UnauthorizedException('Session expired. Please login again.');
    }

    const user = session.user;
    if (user.deletedAt) {
      throw new UnauthorizedException('User not found');
    }

    if (user.status !== UserStatus.ACTIVE) {
      this.logger.warn(`Inactive account: ${user.id} (Status: ${user.status})`);
      throw new UnauthorizedException(`Account is ${user.status.toLowerCase()}`);
    }

    this.prisma.userSession
      .update({ where: { id: sessionId }, data: { lastActiveAt: new Date() } })
      .catch((error) => this.logger.error('Failed to update lastActiveAt', error));

    const requestUser: RequestUser = {
      id: user.id.toString(),
      sub: user.id.toString(),
      sessionId: payload.sessionId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
      status: user.status,
    };
    return requestUser;
  }
}

```

```typescript
 modules/                          # Feature modules
│   │   │
│   │   ├── auth/                        # Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts     # (target also: jwt-refresh.strategy, google.strategy)
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   ├── register.request.dto.ts
│   │   │   │   │   ├── register-staff.request.dto.ts
│   │   │   │   │   ├── login.request.dto.ts
│   │   │   │   │   ├── refresh-token.request.dto.ts
│   │   │   │   │   ├── change-password.request.dto.ts
│   │   │   │   │   ├── forgot-password.request.dto.ts
│   │   │   │   │   ├── reset-password.request.dto.ts
│   │   │   │   │   ├── email-verify-send.request.dto.ts
│   │   │   │   │   ├── email-verify-check.request.dto.ts
│   │   │   │   │   └── verify-employee.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       ├── auth-user.response.dto.ts
│   │   │   │       ├── auth-tokens.response.dto.ts
│   │   │   │       └── login-user.response.dto.ts
│   │   │   └── interfaces/
│   │   │       ├── jwt-payload.interface.ts
│   │   │       └── tokens.interface.ts
--------------------------------------------------------------------------------

mail module=

── mail/                        # Email (welcome, email-verify; target: modules/email)
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts
│   │   │   ├── templates/
│   │   │   │   ├── welcome.hbs
│   │   │   │   └── email-verify.hbs
│   │   │   # (target: ad-approved, ad-expired, password-reset templates)

--------------------------------------------------------------------------------

notification= notifications/               # In-app Notifications (no email/sms/push sub-services)
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   └── create-notification.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       └── notification.response.dto.ts
│   │   │   └── interfaces/
│   │   │       └── notification.interface.ts


--------------------------------------------------------------------------------

user module= users/                       # User Management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   └── update-profile.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       └── update-user.response.dto.ts
│   │   │   └── interfaces/
│   │   │       └── user-profile.interface.ts


--------------------------------------------------------------------------------

common files= common/                          # Shared utilities & helpers
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── response-message.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts           # (target also: throttle.guard.ts)
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── prisma-exception.filter.ts
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── bigint.interceptor.ts    # (target: timeout.interceptor.ts)
│   │   ├── pipes/
│   │   │   └── parse-bigint.pipe.ts     # (target: validation.pipe, parse-int.pipe)
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts # (target also: logger.middleware)
│   │   ├── interfaces/
│   │   │   ├── paginated-result.interface.ts
│   │   │   ├── page-token-paginated-result.interface.ts
│   │   │   ├── request-user.interface.ts
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── page-token-pagination.dto.ts  # (target: response.dto.ts)
│   │   └── utils/
│   │       ├── slug.util.ts
│   │       ├── pagination.util.ts
│   │       ├── audit.util.ts
│   │       └── jwt-secrets.util.ts     # (target also: date.util, encryption.util)

--------------------------------------------------------------------------------

config=
 config/                          # Configuration (no aws.config or elasticsearch.config)
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── env.validation.config.ts    # (target: env.validation.ts)
│   │   ├── jwt.config.ts
│   │   ├── logger.config.ts
│   │   ├── mail.config.ts
│   │   ├── security.config.ts
│   │   ├── throttle.config.ts
│   │   ├── throttle-module.config.ts



--------------------------------------------------------------------------------

common file s codes=

common/decoders

import { createParamDecorator, ExecutionContext, UnauthorizedException } from '@nestjs/common';

/**
 * Parameter decorator that extracts the authenticated user from the request object.
 * 
 * The user is set by JwtAuthGuard after successful JWT authentication.
 * This decorator provides type safety and validation to ensure the user exists.
 * 
 * **Features:**
 * - Type-safe user extraction with generic type parameter
 * - Validation: Throws UnauthorizedException if user is not authenticated
 * - Works seamlessly with JwtAuthGuard
 * 
 * **Usage:**
 * - Must be used with @UseGuards(JwtAuthGuard) to ensure authentication
 * - Provides type safety when used with TypeScript generics
 * - Throws UnauthorizedException if user is missing (defensive check)
 * 
 * @template T - Type of the user object (defaults to any)
 * 
 * @example
 * ```typescript
 * @Get('profile')
 * @UseGuards(JwtAuthGuard)
 * async getProfile(@CurrentUser() user: User) {
 *   return user; // user is guaranteed to exist and be typed as User
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Put('users/:id')
 * @UseGuards(JwtAuthGuard)
 * async updateUser(
 *   @Param('id') id: string,
 *   @CurrentUser() user: User,
 *   @Body() dto: UpdateUserDto
 * ) {
 *   return this.usersService.update(id, dto, user.id);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // With custom user type
 * interface AuthUser {
 *   id: string;
 *   email: string;
 *   role: UserRole;
 * }
 * 
 * @Get('dashboard')
 * @UseGuards(JwtAuthGuard)
 * async getDashboard(@CurrentUser() user: AuthUser) {
 *   return this.dashboardService.getData(user.id);
 * }
 * ```
 * 
 * @returns The authenticated user object from the request
 * @throws {UnauthorizedException} If user is not authenticated (user is undefined/null)
 */
export const CurrentUser = createParamDecorator(
  <T = any>(data: unknown, ctx: ExecutionContext): T => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;

    // Defensive check: If JwtAuthGuard is working correctly, user should always exist
    // However, this check provides an extra layer of safety
    if (!user) {
      throw new UnauthorizedException('User not authenticated');
    }

    return user as T;
  },
);
```

```typescript
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to mark routes as public.
 * Used by JwtAuthGuard to bypass authentication checks.
 */
export const IS_PUBLIC_KEY = 'isPublic';

/**
 * Decorator that marks a route as public, bypassing JWT authentication.
 * 
 * When applied to a route handler or controller, the JwtAuthGuard will
 * skip authentication checks for that route.
 * 
 * @example
 * ```typescript
 * @Controller('auth')
 * export class AuthController {
 *   @Public()
 *   @Post('login')
 *   async login(@Body() dto: LoginDto) {
 *     return this.authService.login(dto);
 *   }
 * 
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: User) {
 *     return user; // Requires authentication
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Public()
 * @Controller('health')
 * export class HealthController {
 *   @Get()
 *   async check() {
 *     return { status: 'ok' };
 *   }
 * }
 * ```
 * 
 * @returns A metadata decorator that sets IS_PUBLIC_KEY to true
 */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);

```

```typescript
import { SetMetadata } from '@nestjs/common';

/**
 * Metadata key used to store custom response messages.
 * Used by TransformInterceptor to override the default "Success" message.
 */
export const RESPONSE_MESSAGE_KEY = 'response_message';

/**
 * Decorator that sets a custom success message for the API response.
 * 
 * The message will be used by TransformInterceptor to override the default
 * "Success" message in the response. If the service returns an object with
 * a "message" property, the decorator message takes precedence.
 * 
 * @param message - Custom success message to include in the response
 * 
 * @example
 * ```typescript
 * @Post('users')
 * @ResponseMessage('User created successfully')
 * async createUser(@Body() dto: CreateUserDto) {
 *   return this.usersService.create(dto);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Delete('users/:id')
 * @ResponseMessage('User deleted successfully')
 * async deleteUser(@Param('id') id: string) {
 *   await this.usersService.delete(id);
 *   return { id };
 * }
 * ```
 * 
 * @returns A metadata decorator that stores the custom message
 * 
 * @throws {Error} If message is empty or not a string
 */
export const ResponseMessage = (message: string) => {
  if (!message || typeof message !== 'string' || message.trim().length === 0) {
    throw new Error('ResponseMessage decorator requires a non-empty string');
  }
  return SetMetadata(RESPONSE_MESSAGE_KEY, message);
};

```

```typescript
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '@prisma/client';

/**
 * Metadata key used to store required roles for route access.
 * Used by RolesGuard to enforce role-based authorization.
 */
export const ROLES_KEY = 'roles';

/**
 * Decorator that restricts route access to users with specific roles.
 * 
 * When applied to a route handler or controller, the RolesGuard will
 * check if the authenticated user has one of the specified roles.
 * Works in conjunction with JwtAuthGuard (must be applied first).
 * 
 * @param roles - One or more UserRole values that are allowed to access the route
 * 
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class AdminController {
 *   @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 *   @Delete('users/:id')
 *   async deleteUser(@Param('id') id: string) {
 *     return this.usersService.delete(id);
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Roles(UserRole.SUPER_ADMIN)
 * @Post('system/settings')
 * async updateSystemSettings(@Body() dto: SettingsDto) {
 *   return this.settingsService.update(dto);
 * }
 * ```
 * 
 * @returns A metadata decorator that stores the required roles
 * 
 * @throws {Error} If no roles are provided
 */
export const Roles = (...roles: UserRole[]) => {
  if (!roles || roles.length === 0) {
    throw new Error('Roles decorator requires at least one role');
  }
  return SetMetadata(ROLES_KEY, roles);
};

--------------------------------------------------------------------------------

common/dto
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min, IsString } from 'class-validator';

/**
 * Page token-based pagination query parameters DTO.
 * 
 * Implements Google AIP-158 standard for token-based pagination, which is more efficient
 * than offset-based pagination for large datasets. Page token pagination doesn't require
 * scanning skipped records, making it ideal for large datasets.
 * 
 * **Industry Standard (Google AIP-158):**
 * - Uses `page_token` parameter (instead of `cursor`)
 * - Uses `next_page_token` in response (instead of `nextCursor`)
 * - Follows REST API best practices
 * 
 * **When to use page token pagination:**
 * - Large datasets (>10,000 records)
 * - Real-time data that changes frequently
 * - When you need consistent results even if data is added/removed during pagination
 * - When performance is critical
 * 
 * **How it works:**
 * - First request: Omit `page_token`, returns first `limit` items
 * - Subsequent requests: Use `page_token` from previous response's `next_page_token`
 * - Continue until `next_page_token` is null
 * 
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@Query() pagination: PageTokenPaginationDto) {
 *   return this.usersService.findAll(pagination);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // First request: GET /api/v1/users?limit=20
 * // Response: { data: [...], meta: { next_page_token: "123", hasMore: true } }
 * 
 * // Next request: GET /api/v1/users?limit=20&page_token=123
 * // Response: { data: [...], meta: { next_page_token: "456", hasMore: true } }
 * 
 * // Last request: GET /api/v1/users?limit=20&page_token=456
 * // Response: { data: [...], meta: { next_page_token: null, hasMore: false } }
 * ```
 * 
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export class PageTokenPaginationDto {
    /**
     * Number of items to return per page.
     * 
     * @default 10
     * @minimum 1
     * @maximum 100
     * 
     * @example 10
     * @example 50
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    /**
     * Page token for pagination (typically the ID of the last item from previous page).
     * 
     * Omit for the first page. Use the `next_page_token` value from the previous response
     * to fetch the next page.
     * 
     * Follows Google AIP-158 standard naming convention.
     * 
     * @default undefined
     * 
     * @example "123"
     * @example "550e8400-e29b-41d4-a716-446655440000"
     */
    @IsOptional()
    @IsString()
    page_token?: string;
}
```

```typescript
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * Pagination query parameters DTO.
 * 
 * Used for paginated endpoints to accept page and limit query parameters.
 * Provides validation and type transformation for pagination values.
 * 
 * **Features:**
 * - Automatic type transformation (string to number)
 * - Validation (min/max constraints)
 * - Default values (page: 1, limit: 10)
 * - Maximum limit enforcement (100 items per page)
 * 
 * **Validation Rules:**
 * - `page`: Must be an integer >= 1 (default: 1)
 * - `limit`: Must be an integer between 1 and 100 (default: 10)
 * 
 * **Usage:**
 * This DTO is used with the `@Query()` decorator in NestJS controllers.
 * The ValidationPipe automatically validates and transforms query parameters.
 * 
 * @example
 * ```typescript
 * @Get('users')
 * async getUsers(@Query() pagination: PaginationDto) {
 *   return this.usersService.findAll(pagination);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Request: GET /api/v1/users?page=2&limit=20
 * // pagination.page = 2 (automatically converted to number)
 * // pagination.limit = 20 (automatically converted to number)
 * 
 * // Request: GET /api/v1/users (no query params)
 * // pagination.page = 1 (default)
 * // pagination.limit = 10 (default)
 * 
 * // Request: GET /api/v1/users?page=0&limit=200
 * // Validation fails: page must be >= 1, limit must be <= 100
 * ```
 * 
 * @example
 * ```typescript
 * // With filters
 * @Get('ads')
 * async getAds(
 *   @Query() pagination: PaginationDto,
 *   @Query('status') status?: string
 * ) {
 *   return this.adsService.findAll(pagination, { status });
 * }
 * ```
 * 
 * @see {@link https://docs.nestjs.com/techniques/validation | NestJS Validation}
 * @see {@link PaginatedResult} For the response structure
 */
export class PaginationDto {
    /**
     * Page number (1-indexed).
     * 
     * Represents the current page number in offset-based pagination.
     * Pages are numbered starting from 1 (not 0).
     * 
     * **Validation:**
     * - Must be an integer
     * - Minimum value: 1
     * - Automatically converted from string to number
     * 
     * **Default:** 1 (first page)
     * 
     * @example 1
     * @example 2
     * @example 10
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    page?: number = 1;

    /**
     * Number of items per page.
     * 
     * Specifies how many items should be returned in each page.
     * This value is enforced to prevent excessive data retrieval
     * and ensure consistent API performance.
     * 
     * **Validation:**
     * - Must be an integer
     * - Minimum value: 1
     * - Maximum value: 100 (enforced to prevent performance issues)
     * - Automatically converted from string to number
     * 
     * **Default:** 10 items per page
     * 
     * **Performance Note:**
     * Larger limits increase response time and memory usage.
     * For large datasets (>10,000 records), consider using
     * page token-based pagination instead.
     * 
     * @example 10
     * @example 20
     * @example 50
     * @example 100 (maximum)
     */
    @IsOptional()
    @Type(() => Number)
    @IsInt()
    @Min(1)
    @Max(100)
    limit?: number = 10;
}.


common/filters


import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { HttpAdapterHost } from '@nestjs/core';

/**
 * Standardized error response interface.
 * 
 * Matches the success response format from TransformInterceptor for consistency.
 * All error responses follow this structure.
 */
export interface ErrorResponse {
  /** HTTP status code */
  statusCode: number;
  /** Always false for error responses */
  success: boolean;
  /** Human-readable error message */
  message: string;
  /** Error details with code and optional details */
  error: {
    /** Error code (e.g., 'VALIDATION_ERROR', 'BAD_REQUEST') */
    code?: string;
    /** Additional error details (e.g., validation errors array) */
    details?: any;
  } | null;
  /** Response metadata */
  meta: {
    /** ISO timestamp of the error */
    timestamp: string;
    /** Request path where error occurred */
    path: string;
  };
}

/**
 * Global exception filter that catches all unhandled exceptions.
 * 
 * Provides standardized error response format matching TransformInterceptor.
 * This filter handles:
 * - HTTP exceptions (BadRequestException, NotFoundException, etc.)
 * - Validation errors from class-validator
 * - Unhandled errors (converts to 500 Internal Server Error)
 * - Maps HTTP status codes to error codes
 * - Logs errors appropriately (error level for 5xx, warn for 4xx)
 * 
 * Features:
 * - Consistent error format across all endpoints
 * - Proper error logging with stack traces for server errors
 * - User-friendly error messages
 * - Error code mapping for client error handling
 * 
 * @example
 * ```typescript
 * // Thrown: new BadRequestException('Invalid input')
 * // Response: {
 * //   statusCode: 400,
 * //   success: false,
 * //   message: 'Invalid input',
 * //   error: { code: 'BAD_REQUEST' },
 * //   meta: { timestamp: '...', path: '/api/v1/users' }
 * // }
 * ```
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  constructor(private readonly httpAdapterHost: HttpAdapterHost) {}

  /**
   * Catches and handles all exceptions.
   * 
   * @param exception - The exception that was thrown
   * @param host - Arguments host containing request/response context
   */
  catch(exception: unknown, host: ArgumentsHost): void {
    const { httpAdapter } = this.httpAdapterHost;
    const ctx = host.switchToHttp();
    const request = ctx.getRequest();

    const httpStatus =
      exception instanceof HttpException
        ? exception.getStatus()
        : HttpStatus.INTERNAL_SERVER_ERROR;

    // Extract error details from exception
    const exceptionResponse =
      exception instanceof HttpException
        ? exception.getResponse()
        : 'Internal Server Error';

    // Parse message and error details
    let message: string;
    let errorDetails: { code?: string; details?: any } | null = null;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
    } else if (typeof exceptionResponse === 'object') {
      const response = exceptionResponse as any;
      message = response.message || response.error || 'An error occurred';

      // Handle validation errors (class-validator)
      if (Array.isArray(response.message)) {
        message = 'Validation failed';
        errorDetails = {
          code: 'VALIDATION_ERROR',
          details: response.message,
        };
      } else if (response.error) {
        // Include error code/type if available
        errorDetails = {
          code: this.getErrorCode(httpStatus, response.error),
        };
      }
    } else {
      message = 'An error occurred';
    }

    // Log server errors with stack trace
    if (httpStatus === HttpStatus.INTERNAL_SERVER_ERROR) {
      this.logger.error(
        `[${request.method}] ${request.url} - ${message}`,
        exception instanceof Error ? exception.stack : String(exception),
      );
    } else if (httpStatus >= 400) {
      // Log client errors at warn level for security monitoring
      this.logger.warn(
        `[${request.method}] ${request.url} - ${httpStatus} - ${message}`,
      );
    }

    // Build standardized response matching TransformInterceptor format
    const responseBody: ErrorResponse = {
      statusCode: httpStatus,
      success: false,
      message: message,
      error: errorDetails,
      meta: {
        timestamp: new Date().toISOString(),
        path: httpAdapter.getRequestUrl(request),
      },
    };

    httpAdapter.reply(ctx.getResponse(), responseBody, httpStatus);
  }

  /**
   * Maps HTTP status code and error type to a standardized error code.
   * 
   * Converts HTTP status codes and error types to uppercase error codes
   * for consistent client-side error handling.
   * 
   * @param status - HTTP status code
   * @param errorType - Optional error type string (e.g., "Bad Request")
   * @returns Standardized error code (e.g., "BAD_REQUEST")
   * 
   * @example
   * ```typescript
   * getErrorCode(400, "Bad Request") // Returns "BAD_REQUEST"
   * getErrorCode(404) // Returns "NOT_FOUND"
   * getErrorCode(500) // Returns "INTERNAL_SERVER_ERROR"
   * ```
   */
  /**
   * Maps HTTP status code and error type to a standardized error code.
   * 
   * Converts HTTP status codes and error types to uppercase error codes
   * for consistent client-side error handling. Includes comprehensive
   * mapping for all standard HTTP status codes.
   * 
   * @param status - HTTP status code
   * @param errorType - Optional error type string (e.g., "Bad Request")
   * @returns Standardized error code (e.g., "BAD_REQUEST")
   * 
   * @example
   * ```typescript
   * getErrorCode(400, "Bad Request") // Returns "BAD_REQUEST"
   * getErrorCode(404) // Returns "NOT_FOUND"
   * getErrorCode(500) // Returns "INTERNAL_SERVER_ERROR"
   * getErrorCode(405) // Returns "METHOD_NOT_ALLOWED"
   * ```
   */
  private getErrorCode(status: number, errorType?: string): string {
    if (errorType) {
      // Convert "Bad Request" to "BAD_REQUEST"
      return errorType.toUpperCase().replace(/\s+/g, '_');
    }

    // Comprehensive HTTP status code mapping
    const statusCodeMap: Record<number, string> = {
      // 4xx Client Errors
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      402: 'PAYMENT_REQUIRED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      405: 'METHOD_NOT_ALLOWED',
      406: 'NOT_ACCEPTABLE',
      407: 'PROXY_AUTHENTICATION_REQUIRED',
      408: 'REQUEST_TIMEOUT',
      409: 'CONFLICT',
      410: 'GONE',
      411: 'LENGTH_REQUIRED',
      412: 'PRECONDITION_FAILED',
      413: 'PAYLOAD_TOO_LARGE',
      414: 'URI_TOO_LONG',
      415: 'UNSUPPORTED_MEDIA_TYPE',
      416: 'RANGE_NOT_SATISFIABLE',
      417: 'EXPECTATION_FAILED',
      418: "I'M_A_TEAPOT",
      421: 'MISDIRECTED_REQUEST',
      422: 'UNPROCESSABLE_ENTITY',
      423: 'LOCKED',
      424: 'FAILED_DEPENDENCY',
      425: 'TOO_EARLY',
      426: 'UPGRADE_REQUIRED',
      428: 'PRECONDITION_REQUIRED',
      429: 'TOO_MANY_REQUESTS',
      431: 'REQUEST_HEADER_FIELDS_TOO_LARGE',
      451: 'UNAVAILABLE_FOR_LEGAL_REASONS',

      // 5xx Server Errors
      500: 'INTERNAL_SERVER_ERROR',
      501: 'NOT_IMPLEMENTED',
      502: 'BAD_GATEWAY',
      503: 'SERVICE_UNAVAILABLE',
      504: 'GATEWAY_TIMEOUT',
      505: 'HTTP_VERSION_NOT_SUPPORTED',
      506: 'VARIANT_ALSO_NEGOTIATES',
      507: 'INSUFFICIENT_STORAGE',
      508: 'LOOP_DETECTED',
      510: 'NOT_EXTENDED',
      511: 'NETWORK_AUTHENTICATION_REQUIRED',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }
},

import { ArgumentsHost, Catch, HttpStatus, Logger } from '@nestjs/common';
import { BaseExceptionFilter } from '@nestjs/core';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

/**
 * Standardized Prisma error response interface.
 * 
 * Matches the success response format from TransformInterceptor for consistency.
 */
interface PrismaErrorResponse {
  statusCode: number;
  success: boolean;
  message: string;
  error: {
    code: string;
    details?: any;
  } | null;
  meta: {
    timestamp: string;
    path: string;
  };
}

/**
 * Exception filter for Prisma database errors.
 * 
 * Converts Prisma-specific errors to user-friendly HTTP responses with
 * appropriate status codes and error messages.
 * 
 * Handled Error Codes:
 * - P2000: Value too long → 400 Bad Request
 * - P2001: Record does not exist → 404 Not Found
 * - P2002: Unique constraint violation → 409 Conflict
 * - P2003: Foreign key constraint violation → 400 Bad Request
 * - P2011: Null constraint violation → 400 Bad Request
 * - P2012: Missing required value → 400 Bad Request
 * - P2014: Required relation violation → 400 Bad Request
 * - P2015: Record not found for operation → 404 Not Found
 * - P2016: Query interpretation error → 400 Bad Request
 * - P2017: Records for relation not connected → 400 Bad Request
 * - P2018: Required connected records not found → 404 Not Found
 * - P2019: Input error → 400 Bad Request
 * - P2020: Value out of range → 400 Bad Request
 * - P2021: Table does not exist → 500 Internal Server Error
 * - P2022: Column does not exist → 500 Internal Server Error
 * - P2023: Inconsistent column data → 500 Internal Server Error
 * - P2024: Connection pool timeout → 503 Service Unavailable
 * - P2025: Record not found → 404 Not Found
 * - P2026: Unsupported database feature → 400 Bad Request
 * - P2027: Multiple errors → 400 Bad Request
 * - Default: Unhandled Prisma errors → Delegates to base filter
 * 
 * Features:
 * - User-friendly error messages
 * - Proper HTTP status code mapping
 * - Field name formatting (snake_case → readable format)
 * - Detailed error logging
 * - Standardized error response format
 * 
 * @see https://www.prisma.io/docs/reference/api-reference/error-reference
 * 
 * @example
 * ```typescript
 * // Prisma Error: Unique constraint on email
 * // Response: {
 * //   statusCode: 409,
 * //   success: false,
 * //   message: 'A record with this email already exists.',
 * //   error: { code: 'UNIQUE_CONSTRAINT_VIOLATION', details: { fields: ['email'] } },
 * //   meta: { timestamp: '...', path: '/api/v1/users' }
 * // }
 * ```
 */
@Catch(Prisma.PrismaClientKnownRequestError)
export class PrismaClientExceptionFilter extends BaseExceptionFilter {
  private readonly logger = new Logger(PrismaClientExceptionFilter.name);

  /**
   * Catches and handles Prisma database errors.
   * 
   * @param exception - The Prisma error that was thrown
   * @param host - Arguments host containing request/response context
   */
  catch(exception: Prisma.PrismaClientKnownRequestError, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const timestamp = new Date().toISOString();
    const path = request.url;

    switch (exception.code) {
      case 'P2000': {
        // Value too long for column type
        const status = HttpStatus.BAD_REQUEST;
        const column = exception.meta?.column_name as string;
        const message = column
          ? `The provided value is too long for the ${this.formatFieldName(column)} field.`
          : 'The provided value is too long for the field.';

        this.logger.warn(
          `[${request.method}] ${path} - Value too long for column: ${column || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'VALUE_TOO_LONG',
            details: column ? { column } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2001': {
        // Record does not exist (query filter)
        const status = HttpStatus.NOT_FOUND;
        const message = 'The requested record was not found.';

        this.logger.warn(`[${request.method}] ${path} - Record does not exist`);

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_DOES_NOT_EXIST',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2002': {
        // Unique constraint violation
        const status = HttpStatus.CONFLICT;
        const fields = (exception.meta?.target as string[]) || [];
        const fieldNames = fields.map((f) => this.formatFieldName(f)).join(', ');
        const message = fields.length > 0
          ? `A record with this ${fieldNames} already exists.`
          : 'A record with these values already exists.';

        this.logger.warn(
          `[${request.method}] ${path} - Unique constraint violation on: ${fields.join(', ')}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'UNIQUE_CONSTRAINT_VIOLATION',
            details: { fields },
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2003': {
        // Foreign key constraint violation
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `Invalid reference: the related ${this.formatFieldName(field)} does not exist.`
          : 'Invalid reference: the related record does not exist.';

        this.logger.warn(
          `[${request.method}] ${path} - Foreign key constraint violation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'FOREIGN_KEY_CONSTRAINT_VIOLATION',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2011': {
        // Null constraint violation
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The ${this.formatFieldName(field)} field cannot be null.`
          : 'A required field cannot be null.';

        this.logger.warn(
          `[${request.method}] ${path} - Null constraint violation on: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'NULL_CONSTRAINT_VIOLATION',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2012': {
        // Missing required value
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The ${this.formatFieldName(field)} field is required.`
          : 'A required value is missing.';

        this.logger.warn(
          `[${request.method}] ${path} - Missing required value: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'MISSING_REQUIRED_VALUE',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2014': {
        // Required relation violation
        const status = HttpStatus.BAD_REQUEST;
        const message = 'The operation would violate a required relation.';

        this.logger.warn(
          `[${request.method}] ${path} - Required relation violation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'REQUIRED_RELATION_VIOLATION',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2015': {
        // Record not found for update/delete operation
        const status = HttpStatus.NOT_FOUND;
        const message = 'The record to update or delete was not found.';

        this.logger.warn(
          `[${request.method}] ${path} - Record not found for operation`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_NOT_FOUND_FOR_OPERATION',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2016': {
        // Query interpretation error
        const status = HttpStatus.BAD_REQUEST;
        const message = 'Invalid query parameters. Please check your request.';

        this.logger.warn(
          `[${request.method}] ${path} - Query interpretation error`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'QUERY_INTERPRETATION_ERROR',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2017': {
        // Records for relation not connected
        const status = HttpStatus.BAD_REQUEST;
        const message = 'The records for this relation are not connected.';

        this.logger.warn(
          `[${request.method}] ${path} - Records for relation not connected`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RELATION_NOT_CONNECTED',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2018': {
        // Required connected records not found
        const status = HttpStatus.NOT_FOUND;
        const message = 'Required connected records were not found.';

        this.logger.warn(
          `[${request.method}] ${path} - Required connected records not found`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'REQUIRED_CONNECTED_RECORDS_NOT_FOUND',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2019': {
        // Input error
        const status = HttpStatus.BAD_REQUEST;
        const message = 'Invalid input provided. Please check your request data.';

        this.logger.warn(
          `[${request.method}] ${path} - Input error`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'INPUT_ERROR',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2020': {
        // Value out of range
        const status = HttpStatus.BAD_REQUEST;
        const field = exception.meta?.field_name as string;
        const message = field
          ? `The provided value for ${this.formatFieldName(field)} is out of range.`
          : 'The provided value is out of range.';

        this.logger.warn(
          `[${request.method}] ${path} - Value out of range: ${field || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'VALUE_OUT_OF_RANGE',
            details: field ? { field } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2021': {
        // Table does not exist
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const table = exception.meta?.table_name as string;
        const message = table
          ? `Database table "${table}" does not exist.`
          : 'Database table does not exist.';

        this.logger.error(
          `[${request.method}] ${path} - Table does not exist: ${table || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'TABLE_DOES_NOT_EXIST',
            details: table ? { table } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2022': {
        // Column does not exist
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const column = exception.meta?.column_name as string;
        const message = column
          ? `Database column "${column}" does not exist.`
          : 'Database column does not exist.';

        this.logger.error(
          `[${request.method}] ${path} - Column does not exist: ${column || 'unknown'}`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'COLUMN_DOES_NOT_EXIST',
            details: column ? { column } : undefined,
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2023': {
        // Inconsistent column data
        const status = HttpStatus.INTERNAL_SERVER_ERROR;
        const message = 'Inconsistent column data detected.';

        this.logger.error(
          `[${request.method}] ${path} - Inconsistent column data`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'INCONSISTENT_COLUMN_DATA',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2024': {
        // Timed out fetching a new connection from the connection pool
        const status = HttpStatus.SERVICE_UNAVAILABLE;
        const message = 'Database connection timeout. Please try again later.';

        this.logger.error(
          `[${request.method}] ${path} - Connection pool timeout`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'CONNECTION_POOL_TIMEOUT',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2025': {
        // Record not found
        const status = HttpStatus.NOT_FOUND;
        const message = 'The requested record was not found.';

        this.logger.warn(`[${request.method}] ${path} - Record not found`);

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'RECORD_NOT_FOUND',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2026': {
        // Unsupported database feature
        const status = HttpStatus.BAD_REQUEST;
        const message = 'This database feature is not supported.';

        this.logger.warn(
          `[${request.method}] ${path} - Unsupported database feature`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'UNSUPPORTED_DATABASE_FEATURE',
          },
          meta: { timestamp, path },
        });
        break;
      }

      case 'P2027': {
        // Multiple errors occurred
        const status = HttpStatus.BAD_REQUEST;
        const errors = exception.meta?.errors as any[] || [];
        const message = 'Multiple errors occurred while processing your request.';

        this.logger.warn(
          `[${request.method}] ${path} - Multiple errors: ${errors.length} errors`,
        );

        this.sendResponse(response, {
          statusCode: status,
          success: false,
          message: message,
          error: {
            code: 'MULTIPLE_ERRORS',
            details: { errors },
          },
          meta: { timestamp, path },
        });
        break;
      }

      default:
        // Log unhandled Prisma errors
        this.logger.error(
          `[${request.method}] ${path} - Unhandled Prisma error: ${exception.code}`,
          exception.stack,
        );
        super.catch(exception, host);
        break;
    }
  }

  /**
   * Sends a standardized JSON error response.
   * 
   * @param response - Express response object
   * @param body - Error response body
   */
  private sendResponse(response: Response, body: PrismaErrorResponse): void {
    response.status(body.statusCode).json(body);
  }

  /**
   * Formats database field names to human-readable format.
   * 
   * Converts snake_case and camelCase field names to readable text.
   * 
   * @param field - Database field name (e.g., "email_address", "userId")
   * @returns Human-readable field name (e.g., "email address", "user ID")
   * 
   * @example
   * ```typescript
   * formatFieldName('email_address') // Returns "email address"
   * formatFieldName('userId') // Returns "user id"
   * formatFieldName('first_name') // Returns "first name"
   * ```
   */
  private formatFieldName(field: string): string {
    return field
      .replace(/_/g, ' ')
      .replace(/([a-z])([A-Z])/g, '$1 $2')
      .toLowerCase();
  }
},

common/guard

import { Injectable, ExecutionContext, Logger, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AuthGuard } from '@nestjs/passport';
import { IS_PUBLIC_KEY } from '@common/decorators/public.decorator';

/**
 * JWT Authentication Guard.
 * 
 * Protects routes by default, requiring valid JWT tokens for access.
 * Routes can be marked as public using the @Public() decorator to bypass authentication.
 * 
 * This guard:
 * - Validates JWT tokens from the Authorization header
 * - Sets the authenticated user on the request object (request.user)
 * - Allows public routes via @Public() decorator
 * - Works in conjunction with RolesGuard for role-based authorization
 * - Provides comprehensive error handling and logging
 * 
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard)
 * export class UsersController {
 *   @Public()
 *   @Get('public')
 *   async publicRoute() {
 *     return { message: 'Public route - no auth required' };
 *   }
 * 
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: User) {
 *     return user; // Requires authentication
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class AdminController {
 *   @Roles(UserRole.ADMIN)
 *   @Delete('users/:id')
 *   async deleteUser(@Param('id') id: string) {
 *     return this.usersService.delete(id);
 *   }
 * }
 * ```
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {
  private readonly logger = new Logger(JwtAuthGuard.name);

  constructor(private reflector: Reflector) {
    super();
  }

  /**
   * Determines if the route can be activated.
   * 
   * Checks if the route is marked as public. If public, allows access without authentication.
   * Otherwise, delegates to the parent AuthGuard to validate JWT token.
   * 
   * @param context - Execution context containing route handler and class metadata
   * @returns true if route is public, otherwise result of JWT validation
   * @throws {UnauthorizedException} If authentication fails
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const route = `${request.method} ${request.url}`;

    // Check if route is marked as public
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    // Validate JWT token via parent AuthGuard
    try {
      const result = await super.canActivate(context);
      
      // Handle both boolean and Promise<boolean> results
      const canActivate = result instanceof Promise ? await result : result;
      
      if (!canActivate) {
        this.logger.warn(`[${route}] Authentication failed - Guard returned false`);
        throw new UnauthorizedException('Authentication failed');
      }

      return canActivate;
    } catch (error) {
      // Log authentication failures for security monitoring
      if (error instanceof UnauthorizedException) {
        this.logger.warn(`[${route}] Authentication failed: ${error.message}`);
        throw error;
      }

      // Handle unexpected errors
      this.logger.error(
        `[${route}] Unexpected error during authentication: ${error instanceof Error ? error.message : String(error)}`,
        error instanceof Error ? error.stack : undefined,
      );

      // Re-throw as UnauthorizedException for consistency
      throw new UnauthorizedException('Authentication failed');
    }
  }

  /**
   * Handles authentication errors.
   * 
   * Overrides the parent method to provide better error handling and logging.
   * 
   * @param err - The error that occurred during authentication
   * @param user - The user object (if available)
   * @param info - Additional error information
   * @returns Never returns (always throws)
   * @throws {UnauthorizedException} Always throws an UnauthorizedException
   */
  handleRequest<TUser = any>(
    err: Error | null,
    user: TUser | false,
    info: any,
  ): TUser {
    if (err) {
      this.logger.error(`JWT authentication error: ${err.message}`, err.stack);
      throw new UnauthorizedException('Authentication failed');
    }

    if (!user) {
      const errorMessage = info?.message || 'Invalid or expired token';
      this.logger.warn(`JWT authentication failed: ${errorMessage}`);
      throw new UnauthorizedException(errorMessage);
    }

    return user;
  }
},



import { Injectable, CanActivate, ExecutionContext, ForbiddenException, UnauthorizedException, Logger } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator';
import { IS_PUBLIC_KEY } from '../decorators/public.decorator';
import { UserRole } from '@prisma/client';

/**
 * Role-based Authorization Guard.
 * 
 * Restricts route access based on user roles. Requires JwtAuthGuard to run first
 * to authenticate the user and set request.user. Routes can be marked as public
 * using @Public() decorator to bypass role checks.
 * 
 * This guard:
 * - Checks if route is public (bypasses role check)
 * - Checks if route requires specific roles via @Roles() decorator
 * - Validates that the authenticated user has one of the required roles
 * - Throws ForbiddenException if user lacks required role
 * - Provides comprehensive error handling and security logging
 * 
 * Usage:
 * - Apply @Roles(UserRole.ADMIN) to restrict to specific roles
 * - Works with @Public() decorator (bypasses role check)
 * - Requires JwtAuthGuard to run first (sets request.user)
 * 
 * @example
 * ```typescript
 * @Controller('admin')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class AdminController {
 *   @Roles(UserRole.ADMIN, UserRole.SUPER_ADMIN)
 *   @Delete('users/:id')
 *   async deleteUser(@Param('id') id: string) {
 *     return this.usersService.delete(id);
 *   }
 * 
 *   @Roles(UserRole.SUPER_ADMIN)
 *   @Post('system/settings')
 *   async updateSystemSettings(@Body() dto: SettingsDto) {
 *     return this.settingsService.update(dto);
 *   }
 * }
 * ```
 * 
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(JwtAuthGuard, RolesGuard)
 * export class UsersController {
 *   @Public()
 *   @Get('public')
 *   async publicRoute() {
 *     return { message: 'Public route' };
 *   }
 * 
 *   @Roles(UserRole.USER, UserRole.ADMIN)
 *   @Get('profile')
 *   async getProfile(@CurrentUser() user: User) {
 *     return user;
 *   }
 * }
 * ```
 */
@Injectable()
export class RolesGuard implements CanActivate {
    private readonly logger = new Logger(RolesGuard.name);

    constructor(private reflector: Reflector) { }

    /**
     * Determines if the route can be activated based on user roles.
     * 
     * @param context - Execution context containing route handler and class metadata
     * @returns true if user has required role or route is public
     * @throws {UnauthorizedException} If user is not authenticated
     * @throws {ForbiddenException} If user does not have required role
     */
    canActivate(context: ExecutionContext): boolean {
        const request = context.switchToHttp().getRequest();
        const route = `${request.method} ${request.url}`;
        const ip = request.ip || request.connection?.remoteAddress || 'unknown';

        // Check if route is marked as public
        const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);
        
        if (isPublic) {
            return true;
        }

        // Get required roles from decorator metadata
        const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
            context.getHandler(),
            context.getClass(),
        ]);

        // No roles required - allow access
        if (!requiredRoles || requiredRoles.length === 0) {
            return true;
        }

        // Get authenticated user from request (set by JwtAuthGuard)
        const { user } = request;

        // User must be authenticated (set by JwtAuthGuard)
        if (!user) {
            this.logger.warn(
                `[${route}] Authorization failed - User not authenticated (IP: ${ip})`
            );
            throw new UnauthorizedException('User not authenticated. Please login to access this resource.');
        }

        // Validate user object has required properties
        if (!user.role || typeof user.role !== 'string') {
            this.logger.error(
                `[${route}] Invalid user object - missing or invalid role property (User ID: ${user.id || 'unknown'})`
            );
            throw new UnauthorizedException('Invalid user session. Please login again.');
        }

        // Check if user has one of the required roles
        const hasRole = requiredRoles.some((role) => user.role === role);

        if (!hasRole) {
            const userRole = user.role || 'unknown';
            const userId = user.id || 'unknown';
            const requiredRolesStr = requiredRoles.join(', ');
            
            // Log authorization failures for security monitoring
            this.logger.warn(
                `[${route}] Authorization denied - User ${userId} (Role: ${userRole}) attempted to access route requiring: ${requiredRolesStr} (IP: ${ip})`
            );

            throw new ForbiddenException(
                `Access denied. This resource requires one of the following roles: ${requiredRolesStr}. Your current role: ${userRole}.`
            );
        }

        // Log successful authorization for audit trail (optional, can be verbose)
        // this.logger.debug(`[${route}] Authorization granted - User ${user.id} (Role: ${user.role})`);

        return true;
    }
}


common/interceptors
import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

/**
 * BigInt serialization interceptor.
 * 
 * Converts BigInt values to strings for JSON serialization, as JavaScript's
 * JSON.stringify() cannot serialize BigInt values natively. This interceptor
 * recursively transforms nested objects and arrays to ensure all BigInt values
 * are converted to strings.
 * 
 * Features:
 * - Recursively transforms nested objects and arrays
 * - Preserves Date objects (not converted)
 * - Handles null and undefined values
 * - Type-safe transformation
 * 
 * @example
 * ```typescript
 * // Input: { id: 123n, user: { id: 456n }, items: [789n, 101112n] }
 * // Output: { id: "123", user: { id: "456" }, items: ["789", "101112"] }
 * 
 * // Input: { id: 123n, createdAt: new Date() }
 * // Output: { id: "123", createdAt: Date object (preserved) }
 * ```
 */
@Injectable()
export class BigIntInterceptor implements NestInterceptor {
  /**
   * Intercepts the response and transforms BigInt values to strings.
   * 
   * @param context - Execution context
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable with transformed data (BigInt values as strings)
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map((data) => this.transformBigInt(data)),
    );
  }

  /**
   * Recursively transforms BigInt values to strings in the data structure.
   * 
   * @param data - Data to transform (can be any type)
   * @returns Transformed data with BigInt values as strings
   */
  private transformBigInt(data: any): any {
    // Handle null and undefined
    if (data === null || data === undefined) {
      return data;
    }

    // Convert BigInt to string
    if (typeof data === 'bigint') {
      return data.toString();
    }

    // Preserve Date objects
    if (data instanceof Date) {
      return data;
    }

    // Transform arrays recursively
    if (Array.isArray(data)) {
      return data.map((item) => this.transformBigInt(item));
    }

    // Transform objects recursively
    if (typeof data === 'object') {
      // Preserve class instances (except plain objects)
      if (data.constructor && data.constructor !== Object) {
        return data;
      }

      const transformed: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          transformed[key] = this.transformBigInt(data[key]);
        }
      }
      return transformed;
    }

    // Return primitive values as-is
    return data;
  }
},


import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Observable, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

/**
 * HTTP request/response logging interceptor.
 * 
 * Logs all HTTP requests with comprehensive information including:
 * - Request details: method, URL, IP address, User-Agent, Request ID
 * - Response details: status code, duration
 * - Error details: error message, stack trace (for server errors)
 * - Performance warnings: slow request detection with configurable thresholds
 * 
 * Log Format:
 * - Request: `[requestId] METHOD URL - IP: xxx - User-Agent: xxx`
 * - Success: `[requestId] METHOD URL STATUS_CODE - DURATIONms`
 * - Slow Warning: `[requestId] SLOW REQUEST: METHOD URL STATUS_CODE - DURATIONms (threshold: XXXms)`
 * - Slow Critical: `[requestId] CRITICAL SLOW REQUEST: METHOD URL STATUS_CODE - DURATIONms (threshold: XXXms)`
 * - Error: `[requestId] METHOD URL STATUS_CODE - DURATIONms - Error: xxx\nStack: xxx`
 * 
 * Features:
 * - Tracks request duration for performance monitoring
 * - Includes Request ID for request tracing
 * - Logs errors with stack traces for debugging
 * - Uses different log levels based on status codes
 * - Configurable slow request thresholds (warning and critical)
 * - Categorizes slow requests by severity
 * 
 * Configuration:
 * - `SLOW_REQUEST_WARNING_THRESHOLD`: Threshold for warning-level slow requests (default: 1000ms)
 * - `SLOW_REQUEST_CRITICAL_THRESHOLD`: Threshold for critical-level slow requests (default: 3000ms)
 * 
 * @example
 * ```typescript
 * // Request log:
 * // [abc-123] GET /api/v1/users - IP: 192.168.1.1 - User-Agent: Mozilla/5.0...
 * 
 * // Success log:
 * // [abc-123] GET /api/v1/users 200 - 45ms
 * 
 * // Slow request warning:
 * // [abc-123] SLOW REQUEST: GET /api/v1/users 200 - 1500ms (threshold: 1000ms)
 * 
 * // Critical slow request:
 * // [abc-123] CRITICAL SLOW REQUEST: POST /api/v1/reports 200 - 4500ms (threshold: 3000ms)
 * 
 * // Error log:
 * // [abc-123] POST /api/v1/users 500 - 120ms - Error: Internal server error\nStack: ...
 * ```
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');
  private readonly slowRequestWarningThreshold: number;
  private readonly slowRequestCriticalThreshold: number;

  constructor(private readonly configService: ConfigService) {
    this.slowRequestWarningThreshold = this.configService.get<number>(
      'app.performance.slowRequestWarningThreshold',
      1000,
    );
    this.slowRequestCriticalThreshold = this.configService.get<number>(
      'app.performance.slowRequestCriticalThreshold',
      3000,
    );
  }

  /**
   * Intercepts HTTP requests and responses for logging.
   * 
   * @param context - Execution context containing request/response
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable that logs request/response information
   */
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const ctx = context.switchToHttp();
    const req = ctx.getRequest();
    const res = ctx.getResponse();
    
    const method = req.method;
    const url = req.originalUrl || req.url;
    const requestId = (req as any).requestId || '-';
    const userAgent = req.headers['user-agent'] || '-';
    const ip = req.ip || req.connection?.remoteAddress || '-';
    const now = Date.now();

    // Log incoming request
    this.logger.log(`[${requestId}] ${method} ${url} - IP: ${ip} - User-Agent: ${userAgent.substring(0, 50)}`);

    return next.handle().pipe(
      tap((data) => {
        const delay = Date.now() - now;
        const statusCode = res.statusCode;
        
        // Categorize slow requests by severity
        if (delay >= this.slowRequestCriticalThreshold) {
          // Critical slow request - log as error for immediate attention
          this.logger.error(
            `[${requestId}] CRITICAL SLOW REQUEST: ${method} ${url} ${statusCode} - ${delay}ms (threshold: ${this.slowRequestCriticalThreshold}ms)`,
          );
        } else if (delay >= this.slowRequestWarningThreshold) {
          // Warning-level slow request - log as warning
          this.logger.warn(
            `[${requestId}] SLOW REQUEST: ${method} ${url} ${statusCode} - ${delay}ms (threshold: ${this.slowRequestWarningThreshold}ms)`,
          );
        } else {
          // Normal request - log as info
          this.logger.log(`[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms`);
        }
      }),
      catchError((error) => {
        const delay = Date.now() - now;
        const statusCode = error.status || res.statusCode || 500;
        
        // Log error response - include stack trace in message to avoid Winston serialization issues
        const errorMessage = error.message || 'Unknown error';
        const stackTrace = error.stack || 'N/A';
        
        // Check if error occurred in a slow request context
        const isSlowRequest = delay >= this.slowRequestWarningThreshold;
        const slowRequestPrefix = isSlowRequest 
          ? delay >= this.slowRequestCriticalThreshold 
            ? 'CRITICAL SLOW REQUEST + ERROR:'
            : 'SLOW REQUEST + ERROR:'
          : '';
        
        // Use different log levels based on status code
        if (statusCode >= 500) {
          // Server errors: log as error with stack trace
          const logMessage = slowRequestPrefix
            ? `[${requestId}] ${slowRequestPrefix} ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}\nStack: ${stackTrace}`
            : `[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}\nStack: ${stackTrace}`;
          
          this.logger.error(logMessage);
        } else {
          // Client errors: log as warn (4xx errors)
          const logMessage = slowRequestPrefix
            ? `[${requestId}] ${slowRequestPrefix} ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}`
            : `[${requestId}] ${method} ${url} ${statusCode} - ${delay}ms - Error: ${errorMessage}`;
          
          this.logger.warn(logMessage);
        }
        
        return throwError(() => error);
      }),
    );
  }
},


import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { RESPONSE_MESSAGE_KEY } from '../decorators/response-message.decorator';

/**
 * Standardized API response format.
 * 
 * All successful API responses follow this structure for consistency.
 * 
 * @template T - Type of the data payload
 */
export interface Response<T> {
  /** HTTP status code */
  statusCode: number;
  /** Whether the request was successful (2xx status codes) */
  success: boolean;
  /** Success or error message */
  message: string;
  /** Response data payload (null if only message is returned) */
  data: T;
  /** Response metadata */
  meta?: {
    /** ISO timestamp of the response */
    timestamp: string;
    /** Request path */
    path: string;
  };
}

/**
 * Response transformation interceptor.
 * 
 * Standardizes all API responses to a consistent format. This interceptor:
 * - Wraps all responses in a standardized structure
 * - Extracts custom messages from service responses or @ResponseMessage decorator
 * - Adds timestamp and path metadata
 * - Handles empty data responses (when only message is returned)
 * 
 * Response Format:
 * ```typescript
 * {
 *   statusCode: number,
 *   success: boolean,
 *   message: string,
 *   data: T | null,
 *   meta: {
 *     timestamp: string,
 *     path: string
 *   }
 * }
 * ```
 * 
 * @template T - Type of the response data
 * 
 * @example
 * ```typescript
 * // Service returns: { message: 'User created', id: '123' }
 * // Response: { statusCode: 201, success: true, message: 'User created', data: { id: '123' }, meta: {...} }
 * 
 * // Service returns: { message: 'Operation successful' }
 * // Response: { statusCode: 200, success: true, message: 'Operation successful', data: null, meta: {...} }
 * 
 * // Service returns: { id: '123', name: 'John' }
 * // Response: { statusCode: 200, success: true, message: 'Success', data: { id: '123', name: 'John' }, meta: {...} }
 * ```
 */
@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T>>
{
  constructor(private reflector: Reflector) {}

  /**
   * Intercepts the response and transforms it to the standard format.
   * 
   * @param context - Execution context containing request/response
   * @param next - Call handler for the next interceptor or route handler
   * @returns Observable of the transformed response
   */
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse();
    const request = ctx.getRequest();

    // Check for custom message from @ResponseMessage decorator
    const customMessage = this.reflector.getAllAndOverride<string>(
      RESPONSE_MESSAGE_KEY,
      [context.getHandler(), context.getClass()],
    );

    return next.handle().pipe(
      map((data) => {
        const statusCode = response.statusCode || 200;
        let message = customMessage || 'Success';
        let finalData = data;

        // Extract message from service response if no custom message is set
        if (!customMessage && data && typeof data === 'object' && !Array.isArray(data)) {
          if ('message' in data) {
            message = data.message;
            const { message: extractedMsg, ...rest } = data;
            // If only message exists, set data to null
            if (Object.keys(rest).length === 0) {
              finalData = null;
            } else {
              finalData = rest;
            }
          }
        }

        return {
          statusCode,
          success: statusCode >= 200 && statusCode < 300,
          message: message,
          data: finalData,
          meta: {
            timestamp: new Date().toISOString(),
            path: request.url,
          },
        };
      }),
    );
  }
}


common/interfaces
/**
 * Page token-based paginated response structure.
 * 
 * Implements Google AIP-158 standard for token-based pagination responses.
 * Page token pagination is more efficient for large datasets as it doesn't require
 * scanning skipped records.
 * 
 * **Industry Standard (Google AIP-158):**
 * - Uses `next_page_token` field (instead of `nextCursor`)
 * - Follows REST API best practices
 * - Compatible with Google Cloud APIs, AWS APIs, and other major platforms
 * 
 * @template T - Type of items in the data array
 * 
 * @example
 * ```typescript
 * const result: PageTokenPaginatedResult<User> = {
 *   data: [user1, user2, user3],
 *   meta: {
 *     next_page_token: "123",
 *     hasMore: true,
 *     limit: 10
 *   }
 * };
 * ```
 * 
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export interface PageTokenPaginatedResult<T> {
    /** Array of paginated items */
    data: T[];
    /** Page token pagination metadata */
    meta: {
        /** Page token for the next page (null if no more pages) - Google AIP-158 standard */
        next_page_token: string | null;
        /** Whether there are more items available */
        hasMore: boolean;
        /** Number of items per page */
        limit: number;
        /** Optional: Total count (if available, may be expensive for large datasets) */
        total?: number;
    };
}
```

```typescript
/**
 * Standard paginated response structure.
 * 
 * Used by the pagination utility and all paginated endpoints to provide
 * a consistent response format across the application.
 * 
 * @template T - Type of items in the data array
 * 
 * @example
 * ```typescript
 * const result: PaginatedResult<User> = {
 *   data: [user1, user2, user3],
 *   meta: {
 *     total: 100,
 *     lastPage: 10,
 *     currentPage: 1,
 *     perPage: 10,
 *     prev: null,
 *     next: 2
 *   }
 * };
 * ```
 */
export interface PaginatedResult<T> {
    /** Array of paginated items */
    data: T[];
    /** Pagination metadata */
    meta: {
        /** Total number of items across all pages */
        total: number;
        /** Last page number */
        lastPage: number;
        /** Current page number (1-indexed) */
        currentPage: number;
        /** Number of items per page */
        perPage: number;
        /** Previous page number (null if on first page) */
        prev: number | null;
        /** Next page number (null if on last page) */
        next: number | null;
        /** Optional: Unread count (used for notifications) */
        unreadCount?: number;
    };
},
import { UserRole } from '@prisma/client';

/**
 * Shape of the authenticated user attached to the request by JwtStrategy.
 * Use with @CurrentUser() in controllers.
 */
export interface RequestUser {
  /** User ID (string). Use BigInt(user.id) when calling services that expect bigint. */
  id: string;
  /** Present for compatibility with code that uses user.sub; same as id. */
  sub?: string;
  /** Session ID for per-device logout. */
  sessionId?: string;
  email: string;
  fullName: string;
  role: UserRole;
  status: string;
}


common/middleware

import { Injectable, NestMiddleware, Logger } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { v4 as uuidv4 } from 'uuid';

/**
 * Request ID middleware.
 * 
 * Generates or extracts a unique request ID for request tracing and correlation.
 * This middleware:
 * - Extracts X-Request-ID from request headers if present and valid
 * - Validates header format, length, and character restrictions
 * - Generates a UUID v4 if no header is provided or header is invalid
 * - Attaches the request ID to the request object (req.requestId)
 * - Sets X-Request-ID response header for client correlation
 * - Logs warnings for invalid headers (security monitoring)
 * 
 * The request ID is used throughout the application for:
 * - Logging and log correlation
 * - Error tracking and debugging
 * - Request tracing across services
 * - Performance monitoring
 * 
 * Header Validation Rules:
 * - Maximum length: 128 characters (configurable)
 * - Allowed characters: alphanumeric, hyphens (-), underscores (_), dots (.)
 * - Must not be empty after trimming
 * - Invalid headers are rejected and a new UUID is generated
 * 
 * @example
 * ```typescript
 * // Valid request header: X-Request-ID: abc-123-def-456
 * // Response header: X-Request-ID: abc-123-def-456
 * // Request object: req.requestId = "abc-123-def-456"
 * 
 * // Invalid header (contains special chars): X-Request-ID: <script>alert('xss')</script>
 * // Generates new UUID: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 * // Logs warning about invalid header
 * 
 * // No header provided:
 * // Generates: X-Request-ID: 550e8400-e29b-41d4-a716-446655440000
 * ```
 */
@Injectable()
export class RequestIdMiddleware implements NestMiddleware {
    private readonly logger = new Logger(RequestIdMiddleware.name);
    
    /** Maximum length for request ID header (prevents DoS attacks) */
    private readonly MAX_REQUEST_ID_LENGTH = 128;
    
    /** Regular expression for valid request ID characters (alphanumeric, hyphens, underscores, dots) */
    private readonly VALID_REQUEST_ID_PATTERN = /^[a-zA-Z0-9._-]+$/;

    /**
     * Validates the request ID header format and content.
     * 
     * @param headerId - The header value to validate
     * @returns true if valid, false otherwise
     */
    private isValidRequestId(headerId: string): boolean {
        // Check length
        if (headerId.length > this.MAX_REQUEST_ID_LENGTH) {
            return false;
        }

        // Check character pattern (alphanumeric, hyphens, underscores, dots only)
        if (!this.VALID_REQUEST_ID_PATTERN.test(headerId)) {
            return false;
        }

        return true;
    }

    /**
     * Processes the request to add or extract request ID.
     * 
     * Validates incoming X-Request-ID headers for security and format compliance.
     * Invalid headers are rejected and a new UUID is generated, with a warning logged.
     * 
     * @param req - Express request object
     * @param res - Express response object
     * @param next - Express next function
     */
    use(req: Request, res: Response, next: NextFunction): void {
        const headerId = req.headers['x-request-id'];
        let requestId: string;

        // Check if header is provided and is a string
        if (headerId && typeof headerId === 'string') {
            const trimmedId = headerId.trim();
            
            // Validate header if not empty
            if (trimmedId.length > 0) {
                if (this.isValidRequestId(trimmedId)) {
                    // Valid header - use it
                    requestId = trimmedId;
                } else {
                    // Invalid header - log warning and generate new UUID
                    const ip = req.ip || req.connection?.remoteAddress || 'unknown';
                    const url = req.url || req.originalUrl || 'unknown';
                    
                    this.logger.warn(
                        `Invalid X-Request-ID header rejected - IP: ${ip}, URL: ${url}, ` +
                        `Header value: "${headerId.substring(0, 50)}${headerId.length > 50 ? '...' : ''}" ` +
                        `(length: ${headerId.length}, contains invalid characters or exceeds max length)`
                    );
                    
                    requestId = uuidv4();
                }
            } else {
                // Empty header after trimming - generate new UUID
                requestId = uuidv4();
            }
        } else {
            // No header provided or not a string - generate new UUID
            requestId = uuidv4();
        }
        
        // Attach to request object for use in controllers/services
        (req as any).requestId = requestId;
        
        // Set response header for client correlation
        res.setHeader('X-Request-ID', requestId);
        
        next();
    }
}

common/pipes

import { PipeTransform, Injectable, ArgumentMetadata, BadRequestException } from '@nestjs/common';

/**
 * Transforms string parameters to BigInt values.
 * 
 * This pipe validates and transforms string route parameters (typically IDs) into BigInt values.
 * It is designed for use with Prisma models that use BigInt for primary keys and foreign keys.
 * 
 * **Validation Rules:**
 * - Input must be a non-empty string
 * - Must contain only numeric digits (0-9) - no decimals, signs, or whitespace
 * - Must represent a non-negative integer (>= 0)
 * - Must be convertible to BigInt without overflow
 * - Whitespace is automatically trimmed before validation
 * 
 * **Error Handling:**
 * - Provides descriptive error messages including the parameter name
 * - Throws `BadRequestException` (400 status) for all validation failures
 * - Error messages are user-friendly and include the invalid value
 * 
 * **Use Cases:**
 * - Route parameters representing database IDs (users/:id, ads/:id)
 * - Query parameters that need BigInt conversion
 * - Path parameters in nested routes
 * 
 * **BigInt Considerations:**
 * - BigInt can represent arbitrarily large integers (unlike Number)
 * - No maximum value validation is performed (supports very large IDs)
 * - Negative numbers are rejected (IDs should be positive)
 * - Leading/trailing whitespace is automatically trimmed
 * 
 * @example
 * ```typescript
 * // Basic usage with route parameter
 * @Get('users/:id')
 * async getUser(@Param('id', ParseBigIntPipe) id: bigint) {
 *   return this.usersService.findOne(id);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Usage with nested routes
 * @Delete('ads/:adId/reviews/:reviewId')
 * async deleteReview(
 *   @Param('adId', ParseBigIntPipe) adId: bigint,
 *   @Param('reviewId', ParseBigIntPipe) reviewId: bigint,
 * ) {
 *   return this.reviewsService.delete(adId, reviewId);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Usage with query parameter (if needed)
 * @Get('conversations')
 * async getConversations(
 *   @Query('userId', ParseBigIntPipe) userId: bigint,
 * ) {
 *   return this.conversationsService.findByUser(userId);
 * }
 * ```
 * 
 * @example
 * ```typescript
 * // Error responses
 * // Invalid: "abc" → 400 Bad Request
 * // Error: "Invalid id: \"abc\" is not a valid ID. Expected a numeric value."
 * 
 * // Invalid: "-123" → 400 Bad Request  
 * // Error: "Invalid id: ID must be a positive number."
 * 
 * // Invalid: "123.45" → 400 Bad Request
 * // Error: "Invalid id: \"123.45\" is not a valid ID. Expected a numeric value."
 * 
 * // Valid: "12345678901234567890" → BigInt(12345678901234567890n)
 * ```
 * 
 * @throws {BadRequestException} When:
 * - Value is not a string or is empty
 * - Value contains non-numeric characters
 * - Value represents a negative number
 * - Value cannot be converted to BigInt
 * 
 * @see {@link https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/BigInt | MDN: BigInt}
 * @see {@link https://docs.nestjs.com/pipes | NestJS Pipes Documentation}
 */
@Injectable()
export class ParseBigIntPipe implements PipeTransform<string, bigint> {
  /**
   * Transforms a string parameter to a BigInt value.
   * 
   * Performs comprehensive validation before conversion:
   * 1. Validates input is a non-empty string
   * 2. Validates format contains only digits (after trimming)
   * 3. Converts to BigInt
   * 4. Validates result is non-negative
   * 
   * @param value - String value from route parameter, query parameter, or request body
   * @param metadata - Argument metadata containing parameter name and type information
   * @returns BigInt value representing the validated and converted input
   * @throws {BadRequestException} If validation fails at any step
   * 
   * @example
   * ```typescript
   * // Input: "123"
   * // Output: 123n (BigInt)
   * 
   * // Input: "  456  "
   * // Output: 456n (BigInt, whitespace trimmed)
   * 
   * // Input: "abc"
   * // Throws: BadRequestException
   * ```
   */
  transform(value: string, metadata: ArgumentMetadata): bigint {
    const paramName = metadata.data || metadata.type || 'parameter';
    
    // Validate input is a string
    if (!value || typeof value !== 'string') {
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" is not a valid string.`
      );
    }

    // Validate format (only digits)
    if (!/^\d+$/.test(value.trim())) {
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" is not a valid ID. Expected a numeric value.`
      );
    }

    try {
      const result = BigInt(value.trim());

      // Validate positive number
      if (result < 0n) {
        throw new BadRequestException(
          `Invalid ${paramName}: ID must be a positive number.`
        );
      }

      return result;
    } catch (error) {
      // Re-throw BadRequestException as-is
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      // Handle BigInt conversion errors
      throw new BadRequestException(
        `Invalid ${paramName}: "${value}" cannot be converted to a valid ID.`
      );
    }
  }
}


common/utils


import { RiskLevel } from '@prisma/client';

/**
 * Input for the shared logAudit helper.
 */
export interface AuditLogData {
  userId: bigint | null;
  action: string;
  entity: string;
  entityId: string;
  ipAddress: string;
  userAgent?: string | null;
  requestId?: string | null;
  oldValues?: unknown;
  newValues?: unknown;
  riskLevel?: RiskLevel;
  metadata?: unknown;
}

/**
 * Writes a single audit log entry inside a Prisma transaction.
 * Use from services: await logAudit(tx, { userId, action, entity, entityId, ipAddress, oldValues, newValues }).
 *
 * @param tx - Prisma transaction client (from prisma.$transaction)
 * @param data - Audit fields (entity, entityId, ipAddress required)
 */
export async function logAudit(tx: any, data: AuditLogData): Promise<void> {
  await tx.auditLog.create({
    data: {
      userId: data.userId,
      action: data.action,
      entity: data.entity,
      entityId: data.entityId,
      ipAddress: data.ipAddress,
      userAgent: data.userAgent ?? undefined,
      requestId: data.requestId ?? undefined,
      riskLevel: data.riskLevel ?? RiskLevel.LOW,
      oldValues: data.oldValues ?? undefined,
      newValues: data.newValues ?? undefined,
      metadata: data.metadata ?? undefined,
    },
  });
}
```

```typescript
import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Insecure JWT secret patterns that must never be used in production.
 *
 * IMPORTANT:
 * - This check is a guardrail for preventing accidental deployments with placeholder secrets.
 * - It does NOT replace proper secret management (Secrets Manager / CI/CD env vars).
 */
const INSECURE_JWT_PATTERNS = [
  'change_this',
  'change_this_in_production',
  'super_secret',
  'your_jwt_secret',
  'your_refresh_secret',
  '123456789',
  '456789',
  'placeholder',
  'default',
  'secret_key',
] as const;

/**
 * Checks if a JWT secret is insecure or a placeholder.
 * 
 * A secret is considered insecure if:
 * - It's empty or less than 32 characters
 * - It matches any of the insecure patterns (case-insensitive)
 * 
 * @param secret - JWT secret to validate
 * @returns true if secret is insecure, false otherwise
 * 
 * @internal
 */
function isInsecureJwtSecret(secret: string): boolean {
  if (!secret || secret.length < 32) return true;
  const lower = secret.toLowerCase();
  return INSECURE_JWT_PATTERNS.some((p) => lower.includes(p));
}

/**
 * Validates JWT secrets at application startup.
 *
 * This function performs security checks on JWT secrets to prevent deployment
 * with insecure or placeholder values. It validates both access token and
 * refresh token secrets.
 *
 * Behavior:
 * - In development/staging/test: logs warnings only (allows startup)
 * - In production: throws error and prevents startup if insecure secrets detected
 * - Never logs actual secret values (security best practice)
 *
 * Validations:
 * - Secret length must be at least 32 characters
 * - Secret must not match insecure patterns
 * - Access and refresh secrets must be different
 *
 * @param config - ConfigService instance to read JWT configuration
 * @param logger - Logger instance for error/warning messages
 * 
 * @throws {Error} In production if insecure secrets are detected
 * 
 * @example
 * ```typescript
 * // In main.ts bootstrap function
 * const logger = new Logger('Bootstrap');
 * validateJwtSecrets(config, logger);
 * ```
 * 
 * @see https://docs.nestjs.com/security/authentication#jwt-secret-management
 */
export function validateJwtSecrets(config: ConfigService, logger: Logger): void {
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');
  const jwtSecret = config.get<string>('jwt.secret');
  const jwtRefreshSecret = config.get<string>('jwt.refreshSecret');

  const secretInsecure = jwtSecret ? isInsecureJwtSecret(jwtSecret) : true;
  const refreshInsecure = jwtRefreshSecret ? isInsecureJwtSecret(jwtRefreshSecret) : true;

  if (secretInsecure || refreshInsecure) {
    const msg = [
      'Insecure JWT secrets detected.',
      secretInsecure ? 'JWT_SECRET appears to be a placeholder or weak.' : '',
      refreshInsecure ? 'JWT_REFRESH_SECRET appears to be a placeholder or weak.' : '',
      'Generate strong secrets: openssl rand -base64 32',
      'See docs/security/JWT_SECRETS_SECURITY_GUIDE.md',
    ]
      .filter(Boolean)
      .join(' ');

    if (nodeEnv === 'production') {
      logger.error(msg);
      throw new Error(
        `Application cannot start in production with insecure JWT secrets. ${msg}`,
      );
    }

    logger.warn(`[SECURITY] ${msg}`);
  }

  if (jwtSecret && jwtRefreshSecret && jwtSecret === jwtRefreshSecret) {
    const msg = 'JWT_SECRET and JWT_REFRESH_SECRET must be different.';
    if (nodeEnv === 'production') {
      logger.error(msg);
      throw new Error(msg);
    }
    logger.warn(`[SECURITY] ${msg}`);
  }
}

```

```typescript
import { PaginationDto } from '../dto/pagination.dto';
import { PageTokenPaginationDto } from '../dto/page-token-pagination.dto';
import { PaginatedResult } from '../interfaces/paginated-result.interface';
import { PageTokenPaginatedResult } from '../interfaces/page-token-paginated-result.interface';

/**
 * Paginates Prisma model queries using offset-based pagination.
 * 
 * This utility function provides a standardized way to paginate database queries.
 * It uses offset-based pagination (skip/take), which is efficient for small to
 * medium datasets. For large datasets (>10,000 records), consider implementing
 * page token-based pagination (Google AIP-158 standard) for better performance.
 * 
 * Features:
 * - Parallel query execution (findMany and count run simultaneously)
 * - Standardized pagination metadata
 * - Type-safe generic implementation
 * - Supports all Prisma query options (where, orderBy, select, include, etc.)
 * 
 * @template T - Type of items in the paginated result
 * 
 * @param model - Prisma model delegate with findMany and count methods
 * @param paginationDto - Pagination parameters (page, limit)
 * @param args - Additional Prisma query arguments (where, orderBy, select, include, etc.)
 * 
 * @returns Paginated result with data array and metadata
 * 
 * @example
 * ```typescript
 * // Basic pagination
 * const result = await paginate(
 *   this.prisma.user,
 *   { page: 1, limit: 10 }
 * );
 * 
 * // With filters and ordering
 * const result = await paginate(
 *   this.prisma.ad,
 *   { page: 2, limit: 20 },
 *   {
 *     where: { status: 'ACTIVE' },
 *     orderBy: { createdAt: 'desc' },
 *     include: { user: true, category: true }
 *   }
 * );
 * 
 * // Response format:
 * // {
 * //   data: [...],
 * //   meta: {
 * //     total: 100,
 * //     lastPage: 5,
 * //     currentPage: 2,
 * //     perPage: 20,
 * //     prev: 1,
 * //     next: 3
 * //   }
 * // }
 * ```
 * 
 * @note For large datasets, consider page token-based pagination:
 * ```typescript
 * // Page token pagination example (Google AIP-158 standard)
 * const result = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10, page_token: '123' },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * ```
 */
export async function paginate<T>(
    model: {
        findMany: (args: any) => Promise<T[]>;
        count: (args: any) => Promise<number>;
    },
    paginationDto: PaginationDto,
    args: any = {},
): Promise<PaginatedResult<T>> {
    // Normalize pagination parameters
    const page = Math.max(1, Number(paginationDto.page) || 1);
    const limit = Math.max(1, Math.min(100, Number(paginationDto.limit) || 10));
    const skip = (page - 1) * limit;

    // Execute queries in parallel for better performance
    const [data, total] = await Promise.all([
        model.findMany({
            ...args,
            skip,
            take: limit,
        }),
        model.count({
            where: args.where,
        }),
    ]);

    // Calculate pagination metadata (lastPage 0 when no results)
    const lastPage = total === 0 ? 0 : Math.ceil(total / limit);

    return {
        data,
        meta: {
            total,
            lastPage,
            currentPage: page,
            perPage: limit,
            prev: page > 1 ? page - 1 : null,
            next: page < lastPage ? page + 1 : null,
        },
    };
}

/**
 * Paginates Prisma model queries using page token-based pagination (Google AIP-158 standard).
 * 
 * Page token pagination is more efficient than offset-based pagination for large datasets
 * because it doesn't require scanning skipped records. It's ideal for:
 * - Large datasets (>10,000 records)
 * - Real-time data that changes frequently
 * - When consistent results are needed even if data changes during pagination
 * 
 * **Industry Standard:**
 * - Follows Google AIP-158 pagination standard
 * - Uses `page_token` parameter (industry standard naming)
 * - Uses `next_page_token` in response (industry standard naming)
 * - Compatible with Google Cloud APIs, AWS APIs, and other major platforms
 * 
 * **Performance Benefits:**
 * - O(1) complexity instead of O(n) for offset-based
 * - No performance degradation as you paginate deeper
 * - More efficient database queries (uses indexed token field)
 * 
 * **How it works:**
 * 1. First request: Omit page_token, returns first `limit` items ordered by token field
 * 2. Subsequent requests: Use page_token from previous response's `next_page_token`
 * 3. Continue until `hasMore` is false
 * 
 * **Requirements:**
 * - The model must have a unique, ordered field (typically `id` or `createdAt`)
 * - The `orderBy` argument should order by the token field (ascending or descending)
 * - The token field must be included in the query results
 * 
 * @template T - Type of items in the paginated result
 * 
 * @param model - Prisma model delegate with findMany method
 * @param paginationDto - Page token pagination parameters (limit, page_token)
 * @param args - Additional Prisma query arguments (where, orderBy, select, include, etc.)
 * @param tokenField - Field name to use as page token (default: 'id')
 * 
 * @returns Page token-paginated result with data array and token metadata
 * 
 * @example
 * ```typescript
 * // Basic page token pagination
 * const result = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10 },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * 
 * // Next page using page token
 * const nextResult = await paginatePageToken(
 *   this.prisma.user,
 *   { limit: 10, page_token: result.meta.next_page_token },
 *   { orderBy: { id: 'asc' } },
 *   'id'
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // With filters and ordering by createdAt
 * const result = await paginatePageToken(
 *   this.prisma.ad,
 *   { limit: 20, page_token: '2024-01-01T00:00:00Z' },
 *   {
 *     where: { status: 'ACTIVE' },
 *     orderBy: { createdAt: 'desc' },
 *     include: { user: true, category: true }
 *   },
 *   'createdAt'
 * );
 * ```
 * 
 * @example
 * ```typescript
 * // Response format (Google AIP-158 standard):
 * // {
 * //   data: [...],
 * //   meta: {
 * //     next_page_token: "123",
 * //     hasMore: true,
 * //     limit: 10
 * //   }
 * // }
 * ```
 * 
 * @note The token field must be:
 * - Unique (or unique within the filtered dataset)
 * - Ordered (ascending or descending, matching orderBy)
 * - Included in the query results (use select/include)
 * 
 * @see {@link paginate} For offset-based pagination (better for small datasets)
 * @see {@link https://aip.dev/158 | Google AIP-158: Pagination}
 */
export async function paginatePageToken<T extends Record<string, any>>(
    model: {
        findMany: (args: any) => Promise<T[]>;
        count?: (args: any) => Promise<number>;
    },
    paginationDto: PageTokenPaginationDto,
    args: any = {},
    tokenField: string = 'id',
): Promise<PageTokenPaginatedResult<T>> {
    // Normalize pagination parameters
    const limit = Math.max(1, Math.min(100, Number(paginationDto.limit) || 10));
    const pageToken = paginationDto.page_token;

    // Build query arguments
    const queryArgs: any = {
        ...args,
        take: limit + 1, // Fetch one extra to determine if there are more pages
    };

    // Add page token condition if provided
    if (pageToken) {
        // Determine sort direction from orderBy
        const orderBy = args.orderBy || {};
        const orderByField = Object.keys(orderBy)[0] || tokenField;
        const orderDirection = orderBy[orderByField] || 'asc';

        // Build page token condition
        queryArgs.where = {
            ...args.where,
            [tokenField]: orderDirection === 'desc'
                ? { lt: pageToken }
                : { gt: pageToken },
        };
    }

    // Execute query
    const data = await model.findMany(queryArgs);

    // Determine if there are more pages
    const hasMore = data.length > limit;
    const items = hasMore ? data.slice(0, limit) : data;

    // Get next page token (value of tokenField from last item) - Google AIP-158 standard
    const nextPageToken = hasMore && items.length > 0
        ? String(items[items.length - 1][tokenField])
        : null;

    // Optionally get total count (may be expensive for large datasets)
    let total: number | undefined;
    if (model.count && !pageToken) {
        // Only count on first page to avoid performance issues
        try {
            total = await model.count({ where: args.where });
        } catch (error) {
            // Silently fail if count is not available or expensive
            total = undefined;
        }
    }

    return {
        data: items,
        meta: {
            next_page_token: nextPageToken,
            hasMore,
            limit,
            ...(total !== undefined && { total }),
        },
    };
},


/**
 * Slug utility — URL-safe string for SEO and public URLs.
 *
 * Use for: Ad, MainCategory, SubCategory, Shop, Country, District, City.
 * Do not use for: AuditLog, Notification, AdMedia, Favorite, etc.
 *
 * **Industrial Standards:**
 * - Handles empty strings and edge cases
 * - Prevents timestamp collisions with random component
 * - Protects against counter overflow
 * - Race condition safe (use with DB unique constraint)
 *
 * @see docs/COMMON_FUNCTIONS_AND_HELPERS_GUIDE.md
 * @see docs/MODULE_IMPLEMENTATION_DEVELOPER_GUIDE.md (Slug Column section)
 */

/**
 * Maximum slug length — matches all tables: Ad, MainCategory, SubCategory, Shop, Country, District, City (VarChar(220)).
 * Standardized length across all tables for consistency.
 */
export const SLUG_MAX_LENGTH = 220;

/** Maximum counter attempts for ensureUniqueSlug (prevents infinite loops). */
const MAX_SLUG_COUNTER = 10000;

/**
 * Generates a URL-safe slug from a string.
 *
 * **Transformation:**
 * - Lowercase, trim whitespace
 * - "&" → "and"
 * - Non-alphanumeric → single hyphen
 * - Leading/trailing hyphens removed
 * - Optionally append unique suffix (timestamp + random)
 *
 * **Edge Cases:**
 * - Empty string → returns "item"
 * - Only special chars → returns "item"
 * - Very long strings → truncated to maxLength
 *
 * @param value - Source string (e.g. title, name)
 * @param options - Optional: addUniqueSuffix (default false), maxLength (default 220 to match VarChar(220) columns)
 * @returns Slug string (never empty); length ≤ maxLength
 *
 * @example
 * slugify('My Ad Title')           // 'my-ad-title'
 * slugify('Electronics & Gadgets')  // 'electronics-and-gadgets'
 * slugify('Hello World', { addUniqueSuffix: true })  // 'hello-world-k3j2x-a7b'
 * slugify('')                      // 'item'
 * slugify('!!!')                   // 'item'
 */
export function slugify(
  value: string,
  options: { addUniqueSuffix?: boolean; maxLength?: number } = {},
): string {
  const { addUniqueSuffix = false, maxLength = SLUG_MAX_LENGTH } = options;

  // Handle empty or invalid input
  if (!value || typeof value !== 'string') {
    return addUniqueSuffix ? `item-${generateUniqueSuffix()}` : 'item';
  }

  // Normalize: lowercase, trim, replace &, replace non-alphanumeric with hyphens
  let base = value
    .toLowerCase()
    .trim()
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)+/g, '');

  // Handle case where normalization results in empty string
  if (!base || base.length === 0) {
    base = 'item';
  }

  // Truncate base if needed (leave room for suffix if required)
  const suffixLength = addUniqueSuffix ? 12 : 0; // timestamp(36) + '-' + random(3) = ~12 chars
  const maxBaseLength = Math.max(1, maxLength - suffixLength);
  base = base.substring(0, maxBaseLength);

  if (addUniqueSuffix) {
    const suffix = generateUniqueSuffix();
    const fullSlug = `${base}-${suffix}`;
    return fullSlug.substring(0, maxLength);
  }

  return base;
}

/**
 * Generates a unique suffix combining timestamp and random component.
 * Reduces collision probability in high-concurrency scenarios.
 *
 * Format: `{timestamp36}-{random3chars}`
 * Example: `k3j2x-a7b`
 *
 * @internal
 */
function generateUniqueSuffix(): string {
  const timestamp = Date.now().toString(36);
  // Random 3-character suffix (base36: 0-9, a-z)
  const random = Math.floor(Math.random() * 46656) // 36^3
    .toString(36)
    .padStart(3, '0');
  return `${timestamp}-${random}`;
}

/**
 * Ensures unique slug by appending numeric suffix if needed.
 * Use when DB enforces unique slug and you don't want timestamp in slug.
 *
 * **Race Condition Protection:**
 * - This function checks existence, but between check and create, another request could create the same slug.
 * - **Solution:** Always use with DB unique constraint (`@unique` in Prisma schema).
 * - If unique constraint violation occurs (P2002), catch and retry with new slug.
 *
 * **Counter Overflow Protection:**
 * - Maximum 10,000 attempts to prevent infinite loops.
 * - Throws error if counter exceeds limit (indicates system issue).
 *
 * @param baseSlug - Slug from slugify(value) - must not be empty
 * @param exists - Async function that returns true if slug is taken
 * @returns Unique slug
 * @throws {Error} If counter exceeds MAX_SLUG_COUNTER (10,000)
 *
 * @example
 * ```typescript
 * const baseSlug = slugify('My Title');
 * const uniqueSlug = await ensureUniqueSlug(baseSlug, async (slug) => {
 *   return !!(await prisma.ad.findUnique({ where: { slug } }));
 * });
 * ```
 */
export async function ensureUniqueSlug(
  baseSlug: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  // Validate base slug
  if (!baseSlug || baseSlug.trim().length === 0) {
    throw new Error('Base slug cannot be empty');
  }

  const trimmedBaseSlug = baseSlug.trim();
  let slug = trimmedBaseSlug;
  let counter = 1;

  // Check base slug first
  if (!(await exists(slug))) {
    return slug;
  }

  // Try with counter suffix
  while (counter <= MAX_SLUG_COUNTER) {
    slug = `${trimmedBaseSlug}-${counter}`;
    if (!(await exists(slug))) {
      return slug;
    }
    counter++;
  }

  // Counter overflow protection
  throw new Error(
    `Failed to generate unique slug after ${MAX_SLUG_COUNTER} attempts. Base slug: "${baseSlug}". This may indicate a system issue.`,
  );
}

/**
 * Creates a slug with automatic retry on unique constraint violation.
 * Handles race conditions by catching Prisma P2002 errors and retrying.
 *
 * **Use Case:** When multiple users create records with same title/name simultaneously.
 *
 * @param generateSlug - Function that generates slug (e.g., `() => slugify(title, { addUniqueSuffix: true })`)
 * @param createRecord - Async function that creates record with slug, throws on unique constraint violation
 * @param maxRetries - Maximum retry attempts (default: 3)
 * @returns Created record
 * @throws {Error} If max retries exceeded or non-unique constraint error occurs
 *
 * @example
 * ```typescript
 * const ad = await createWithUniqueSlug(
 *   () => slugify(dto.title, { addUniqueSuffix: true }),
 *   async (slug) => {
 *     return await prisma.ad.create({
 *       data: { ...dto, slug },
 *     });
 *   },
 * );
 * ```
 */
export async function createWithUniqueSlug<T>(
  generateSlug: () => string,
  createRecord: (slug: string) => Promise<T>,
  maxRetries: number = 3,
): Promise<T> {
  let attempts = 0;
  let lastError: unknown;

  while (attempts < maxRetries) {
    const slug = generateSlug();
    try {
      return await createRecord(slug);
    } catch (error: any) {
      // Prisma unique constraint violation (P2002)
      if (error?.code === 'P2002' && error?.meta?.target?.includes('slug')) {
        attempts++;
        lastError = error;
        // Generate new slug for retry
        continue;
      }
      // Non-unique constraint error - rethrow immediately
      throw error;
    }
  }

  throw new Error(
    `Failed to create record with unique slug after ${maxRetries} attempts. Last error: ${lastError}`,
  );
}
```

```typescript
--------------------------------------------------------------------------------

tsconfig.json

{
  "compilerOptions": {
    "module": "commonjs",
    "declaration": true,
    "removeComments": true,
    "emitDecoratorMetadata": true,
    "experimentalDecorators": true,
    "allowSyntheticDefaultImports": true,
    "target": "ES2021",
    "sourceMap": true,
    "outDir": "./dist",
    "baseUrl": "./",
    "incremental": true,
    "skipLibCheck": true,
    "strict": true,
    "strictNullChecks": true,
    "noImplicitAny": true,
    "strictBindCallApply": true,
    "forceConsistentCasingInFileNames": true,
    "noFallthroughCasesInSwitch": true,
    "paths": {
      "@/*": [
        "src/*"
      ],
      "@modules/*": [
        "src/modules/*"
      ],
      "@common/*": [
        "src/common/*"
      ],
      "@config/*": [
        "src/config/*"
      ],
      "@infrastructure/*": [
        "src/infrastructure/*"
      ]
    }
  }
}

--------------------------------------------------------------------------------------------------
tsconfig.build.json

{
  "extends": "./tsconfig.json",
  "exclude": ["node_modules", "test", "dist", "**/*spec.ts"]
}



---------------------------------------------------------------------
nest-cli.json

{
  "$schema": "https://json.schemastore.org/nest-cli",
  "collection": "@nestjs/schematics",
  "sourceRoot": "src",
  "compilerOptions": {
    "deleteOutDir": true,
    "assets": [
      "**/*.hbs",
      "**/*.html"
    ],
    "watchAssets": true
  }
}

----------------------------------------------------------------

.env


NODE_ENV=development 
# NODE_ENV=test                             # Environment (development, production, test)
PORT=3000                                        # Port for the server to listen on
API_PREFIX=api/v1                                # API version prefix (e.g., api/v1)
APP_NAME="Classifieds Marketplace"               # Application name (used in logs, emails, etc.)
APP_URL=http://localhost:3000                    # Base URL for the application (used in email links, etc.)


# Connect to Supabase via connection pooling
DATABASE_URL="postgresql://postgres.tazibhxzhltocdrapvtd:yarnixlabsSuperbase%402026@aws-1-ap-northeast-2.pooler.supabase.com:6543/postgres?pgbouncer=true"

# Direct connection to the database. Used for migrations
DIRECT_URL="postgresql://postgres.tazibhxzhltocdrapvtd:yarnixlabsSuperbase%402026@aws-1-ap-northeast-2.pooler.supabase.com:5432/postgres"


# Supabase Storage
SUPABASE_URL="https://mfrxcmlzudzpbhzrdlyz.supabase.co"
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcnhjbWx6dWR6cGJoenJkbHl6Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3Njg3NDczMTYsImV4cCI6MjA4NDMyMzMxNn0.V8qXR9T6rNsDEyJMSIpWB_5w-usZLI3aMXkv08GDGRg
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1mcnhjbWx6dWR6cGJoenJkbHl6Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2ODc0NzMxNiwiZXhwIjoyMDg0MzIzMzE2fQ.zJvQseCxcOxTMiYE2Ac1ArBxc0_Mbh_R6sve4Tzq1Xo
SUPABASE_STORAGE_BUCKET=tour-web-system-storage
MAX_FILE_SIZE_BYTES=20971520 # 20MB



# ============================================
# JWT SECURITY CONFIGURATION
# ============================================
JWT_SECRET=dnV01ZvCfCiP6es6ZwS6JAXsepXS1Zq6TozpRFEygp8=               # Secret key for signing JWTs (use a strong, random value in production)
JWT_EXPIRATION=24h                                                    # Access token expiration time (e.g., 15m, 1h, 24h)
JWT_REFRESH_SECRET=bvau615M/UBFy4qg5Jcf63Qo5FdofLS6mTCcvGey260=       # Secret key for signing refresh tokens (use a different strong, random value in production)
JWT_REFRESH_EXPIRATION=7d                                             # Refresh token expiration time (e.g., 7d, 30d)
JWT_ISSUER=common backend                                            # Issuer claim for JWTs (identifies the issuing authority)
JWT_AUDIENCE=classifieds-client                                       # Audience claim for JWTs (identifies the intended recipients, e.g., your frontend app)


# ============================================
# SECURITY CONFIGURATION
# ============================================
# Password Hashing
BCRYPT_ROUNDS=12                                  # Number of salt rounds for bcrypt (default: 12)

# Account Lockout
MAX_LOGIN_ATTEMPTS=5                              # Max failed attempts before lockout (default: 5)
ACCOUNT_LOCK_DURATION=1800000                     # Lock duration in ms (default: 30 min)
FAILED_LOGIN_RESET_TIME=900000                    # Reset failed count after ms (default: 15 min)

# Password Reset
PASSWORD_RESET_TOKEN_EXPIRY=3600000               # Token expiry in ms (default: 1 hour)
PASSWORD_RESET_MAX_ATTEMPTS=3                     # Max reset attempts (default: 3)


# ============================================
# RATE LIMITING (Protection)
# ============================================
# Auth-Specific Rate Limits
AUTH_REGISTER_LIMIT=3                             # Register attempts (default: 3)
AUTH_REGISTER_TTL=3600000                         # Register window in ms (default: 1 hour)

# Sensitive Endpoint Protection (e.g., login, password reset)
AUTH_SENSITIVE_LIMIT=10                            # Max attempts per IP (default: 5)
AUTH_SENSITIVE_TTL=900000  

# Time window in ms (default: 15 min)
AUTH_REFRESH_LIMIT=10                             # Refresh attempts (default: 10)
AUTH_REFRESH_TTL=60000                            # Refresh window in ms (default: 1 min)


# ============================================
# SESSION MANAGEMENT
# ============================================
MAX_SESSIONS_PER_USER=5                          # Max concurrent devices per user (default: 5)


# ============================================
# CORS CONFIGURATION
# ============================================
ALLOWED_ORIGINS="http://localhost:5173,http://localhost:5174"         # (required) Comma-separated origins frntend app URLs (e.g., http://localhost:5173,http://localhost:5174)
ALLOWED_METHODS="GET,POST,PUT,DELETE,PATCH,OPTIONS"                   # Allowed HTTP methods
ALLOWED_HEADERS="Content-Type,Authorization,X-Request-ID"             # Allowed headers
CREDENTIALS=true    




# ============================================
# LOGGING
# ============================================
LOG_LEVEL=info                                    # error, warn, info, http, verbose, debug, silly
LOG_FILE_ENABLED=true                             # Enable file logging (default: true)  Enable file logging (default: true)
LOG_FILE_PATH=logs/app.log                        # Application log file path
LOG_ERROR_FILE_PATH=logs/error.log                # Error log file path
LOG_MAX_SIZE=20m                                  # Max log file size (default: 20m)
LOG_MAX_FILES=14d                                 # Log retention period (default: 14 days)
LOG_COMPRESS=true                                 # Compress rotated logs (default: true)


# ============================================
# EMAIL CONFIGURATION
# ============================================
MAIL_HOST=smtp.gmail.com                                # Gmail SMTP server
MAIL_PORT=587                                           # TLS port for secure email submission
MAIL_USERNAME=wishwanthapriyadharshana@gmail.com        # Your Gmail email address
MAIL_PASSWORD="rxeg yqwp rowv khey"                     # App-specific password generated from your Google Account (https://myaccount.google.com/apppasswords)
MAIL_FROM_ADDRESS=wishwanthapriyadharshana@gmail.com    # Sender email address (same as username for Gmail)
MAIL_FROM_NAME="Classifieds Support"                    # Sender name displayed in emails


# ============================================
# PERFORMANCE CONFIGURATION
# ============================================
# Slow Request Detection
SLOW_REQUEST_WARNING_THRESHOLD=1000                     # Threshold in ms for warning-level slow requests (default: 1000ms = 1 second)
SLOW_REQUEST_CRITICAL_THRESHOLD=3000                    # Threshold in ms for critical-level slow requests (default: 3000ms = 3 seconds)



# SEEDING CONFIGURATION (Super Admin)
SEED_DATABASE=true                                # Set to true to seed the database with initial data (default: false)
SEED_ADMIN_EMAIL=nirmalwishwantha@gmail.com        # Email for the seeded super admin user
SEED_ADMIN_PASSWORD=SuperAdmin1@1                  # Password for the seeded super admin user (must meet password policy)
SEED_ADMIN_FULL_NAME=Nirmal Wishwantha                        # Full name for the seeded super admin user
SEED_ADMIN_PHONE_NO=+94771234567                            # Optional: Phone number for the super admin (leave empty for null)


----------------------------------------------------------------------------
main.ts
import { NestFactory, HttpAdapterHost } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';
import { ValidationPipe, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_PROVIDER, WinstonLogger } from 'nest-winston';
import { Logger as WinstonLoggerInstance } from 'winston';
import helmet from 'helmet';
import * as compression from 'compression';
import { AllExceptionsFilter } from './common/filters/all-exceptions.filter';
import { PrismaClientExceptionFilter } from './common/filters/prisma-exception.filter';
import { createRedisAdapter } from '@infrastructure/websocket/redis-io.adapter';
import { validateJwtSecrets } from './common/utils/jwt-secrets.util';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule, {
    bufferLogs: true,
  });

  app.set('trust proxy', 1);

  const config = app.get(ConfigService);

  const winstonInstance = app.get<WinstonLoggerInstance>(WINSTON_MODULE_PROVIDER);
  const nestWinstonLogger = new WinstonLogger(winstonInstance);
  app.useLogger(nestWinstonLogger);

  const logger = new Logger('Bootstrap');
  validateJwtSecrets(config, logger);

  const httpAdapterHost = app.get(HttpAdapterHost);

  const redisAdapter = await createRedisAdapter(app, config);
  app.useWebSocketAdapter(redisAdapter);

  app.use(helmet());

  const allowedOrigins = config.get<string[]>('security.cors.allowedOrigins');
  const nodeEnv = config.get<string>('app.nodeEnv', 'development');
  
  if (nodeEnv === 'production') {
    logger.log(`CORS configured for production with ${allowedOrigins?.length || 0} allowed origin(s)`);
    if (allowedOrigins?.includes('*')) {
      logger.warn('WARNING: CORS wildcard "*" detected in production! This is a security risk.');
    }
  } else {
    logger.debug(`CORS configured for ${nodeEnv} with origins: ${allowedOrigins?.join(', ') || '*'}`);
  }

  app.enableCors({
    origin: allowedOrigins ?? ['*'],
    methods: config.get<string[]>('security.cors.allowedMethods') ?? ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: config.get<string[]>('security.cors.allowedHeaders') ?? ['Content-Type', 'Authorization', 'X-Request-ID'],
    credentials: config.get<boolean>('security.cors.credentials', true),
  });

  app.use(compression());

  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    transform: true,
    forbidNonWhitelisted: true,
    transformOptions: { enableImplicitConversion: true },
  }));

  app.useGlobalFilters(
    new AllExceptionsFilter(httpAdapterHost),
    new PrismaClientExceptionFilter(httpAdapterHost.httpAdapter)
  );

  const prefix = config.get<string>('app.apiPrefix') ?? 'api/v1';
  app.setGlobalPrefix(prefix);

  const port = config.get<number>('app.port') || 3000;
  await app.listen(port);

  logger.log(`Application running in ${config.get('app.nodeEnv')} mode on port ${port}`);
  logger.log(`REST API: http://localhost:${port}/${prefix}`);
  logger.log(`WebSocket: ws://localhost:${port}/chat`);
}
bootstrap();

----------------------------------------------------------------------------

app.module.ts

import { Module, MiddlewareConsumer, RequestMethod, NestModule } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { ThrottlerModule } from '@nestjs/throttler';
import { WinstonModule } from 'nest-winston';
import { envValidationSchema } from './config/env.validation.config';
import appConfig from './config/app.config';
import databaseConfig from './config/database.config';
import jwtConfig from './config/jwt.config';
import securityConfig from './config/security.config';
import redisConfig from './config/redis.config';
import websocketConfig from './config/websocket.config';
import throttleConfig from './config/throttle.config';
import { getWinstonLoggerConfig } from './config/logger.config';
import { PrismaModule } from './infrastructure/database/prisma.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HealthModule } from './modules/health/health.module';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { ClassSerializerInterceptor } from '@nestjs/common';
import mailConfig from './config/mail.config';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CategoriesModule } from './modules/categories/categories.module';
import { LocationsModule } from './modules/locations/locations.module';
import { AdsModule } from './modules/ads/ads.module';
import { FavoritesModule } from './modules/favorites/favorites.module';
import { ReviewsModule } from './modules/reviews/reviews.module';
import { ChatModule } from './modules/chat/chat.module';
import { ShopsModule } from './modules/shops/shops.module';
import { SearchModule } from './modules/search/search.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { getThrottlerModuleOptions } from './config/throttle-module.config';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      expandVariables: true,
      load: [
        mailConfig,
        appConfig,
        databaseConfig,
        jwtConfig,
        securityConfig,
        redisConfig,
        websocketConfig,
        throttleConfig,
      ],
      validationSchema: envValidationSchema,
      validationOptions: {
        abortEarly: false,
        allowUnknown: true,
      },
      envFilePath: [
        `.env.${process.env.NODE_ENV || 'development'}`,
        '.env',
      ],
    }),

    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: getThrottlerModuleOptions,
    }),

    WinstonModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => getWinstonLoggerConfig(configService),
    }),

    PrismaModule,
    CacheModule,
    HealthModule,
    AuthModule,
    UsersModule,
    MailModule,
    NotificationsModule,
    CategoriesModule,
    LocationsModule,
    AdsModule,
    FavoritesModule,
    ReviewsModule,
    ChatModule,
    ShopsModule,
    SearchModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },

    {
      provide: APP_GUARD,
      useClass: RolesGuard,
    },

    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: BigIntInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: TransformInterceptor,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: ClassSerializerInterceptor,
    },

  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(RequestIdMiddleware)
      .forRoutes({ path: '*path', method: RequestMethod.ALL });
  }
}
----------------------------------------------------------------------------

prisma

prisma/seeds/super-admin.seed.ts


import { PrismaClient, UserRole, UserStatus, RiskLevel } from '@prisma/client';
import * as bcrypt from 'bcrypt';
import { Logger } from 'winston';

export const seedSuperAdmin = async (prisma: PrismaClient, logger: Logger) => {
    const email = process.env.SEED_ADMIN_EMAIL || 'superadmin@gmail.com';
    const password = process.env.SEED_ADMIN_PASSWORD || 'admin123';
    const fullName = process.env.SEED_ADMIN_FULL_NAME || 'Super Admin';
    
    // Optional fields from .env - convert empty/undefined to null
    const employeeId = process.env.SEED_ADMIN_EMPLOYEE_ID?.trim() || null;
    const nic = process.env.SEED_ADMIN_NIC?.trim() || null;
    const address = process.env.SEED_ADMIN_ADDRESS?.trim() || null;
    const phoneNo = process.env.SEED_ADMIN_PHONE_NO?.trim() || null;

    logger.info(`Checking for Super Admin account: ${email}`);

    const existingUser = await prisma.user.findUnique({
        where: { email },
    });

    if (existingUser) {
        logger.warn('Super Admin already exists. Skipping creation.');
        return;
    }

    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    await prisma.$transaction(async (tx) => {

        const superAdmin = await tx.user.create({
            data: {
                email,
                passwordHash,
                fullName,
                employeeId,
                nic,
                address,
                phoneNo,
                role: UserRole.SUPER_ADMIN,
                status: UserStatus.ACTIVE,
                createdAt: new Date(),
            },
        });

        await tx.auditLog.create({
            data: {
                userId: superAdmin.id,
                action: 'SYSTEM_INIT_SUPER_ADMIN',
                entity: 'User',
                entityId: superAdmin.id.toString(),
                ipAddress: '127.0.0.1',
                userAgent: 'Prisma Seeding Script',
                riskLevel: RiskLevel.CRITICAL,
                details: {
                    message: 'Initial Super Admin created via seeding script',
                },
            },
        });

        logger.info('Super Admin created successfully!');
        logger.info(`Email: ${superAdmin.email}`);
        if (superAdmin.employeeId) logger.info(`Employee ID: ${superAdmin.employeeId}`);
        if (superAdmin.nic) logger.info(`NIC: ${superAdmin.nic}`);
        if (superAdmin.address) logger.info(`Address: ${superAdmin.address}`);
        if (superAdmin.phoneNo) logger.info(`Phone: ${superAdmin.phoneNo}`);

        if (process.env.NODE_ENV === 'development') {
            logger.info(`Password: (As defined in .env or default)`);
        }
    });
};


prisma/prisma.sheema

// ============================================
// PRISMA SCHEMA - ENTERPRISE GRADE
// ============================================

generator client {
  provider      = "prisma-client-js"
  binaryTargets = ["native", "linux-musl-openssl-3.0.x"]
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id                   BigInt     @id @default(autoincrement())
  uuid                 String     @unique @default(uuid()) @db.Char(36)
  email                String     @unique @db.VarChar(255)
  passwordHash         String?    @map("password_hash") @db.VarChar(255)
  fullName             String     @map("full_name") @db.VarChar(255)
  employeeId           String?    @unique @map("employee_id") @db.VarChar(50)
  address              String?    @db.VarChar(512)
  nic                  String?    @unique @map("nic") @db.VarChar(20)
  phoneNo              String?    @unique @map("phone_no") @db.VarChar(20)
  profileImage         String?    @map("profile_image") @db.VarChar(512)
  role                 UserRole   @default(USER)
  status               UserStatus @default(PENDING)
  failedLoginCount     Int        @default(0) @map("failed_login_count")
  accountLockedUntil   DateTime?  @map("account_locked_until")
  passwordChangedAt    DateTime?  @map("password_changed_at")
  lastPasswordResetAt  DateTime?  @map("last_password_reset_at")
  passwordResetOtpHash String?    @map("password_reset_otp_hash") @db.VarChar(255)
  passwordResetExpires DateTime?  @map("password_reset_expires")

  // Activity
  lastLoginAt  DateTime? @map("last_login_at")
  lastLogoutAt DateTime? @map("last_logout_at")
  lastLoginIp  String?   @map("last_login_ip") @db.VarChar(45)
  lastSeenAt   DateTime? @map("last_seen_at")

  // Timestamps
  deletedAt DateTime? @map("deleted_at")
  deletedBy BigInt?   @map("deleted_by")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  sessions      UserSession[]
  auditLogs     AuditLog[]
  notifications Notification[]
  ads           Ad[]
  favorites     Favorite[]
  adViews       AdView[]
  adShares      AdShare[]

  // Review Relations
  reviewsGiven    Review[] @relation("ReviewerRelation")
  reviewsReceived Review[] @relation("SellerRelation")

  // Chat Relations
  buyerConversations       Conversation[] @relation("BuyerConversations")
  sellerConversations      Conversation[] @relation("SellerConversations")
  blockedConversations     Conversation[] @relation("BlockedByUser")
  lastMessageConversations Conversation[] @relation("LastMessageSender")
  messagesSent             Message[]      @relation("MessageSender")

  // Shop Relations
  shop          Shop?          @relation("ShopOwner")
  shopFollowing ShopFollower[] @relation("ShopFollowerUser")
  shopReviews   ShopReview[]   @relation("ShopReviewer")
  shopViews     ShopView[]     @relation("ShopViewUser")

  // Indexes
  @@index([email, status, deletedAt], name: "idx_user_email_status_deleted")
  @@index([phoneNo, deletedAt], name: "idx_user_phone_deleted")
  @@index([role, status, deletedAt], name: "idx_user_role_status_deleted")
  @@index([uuid], name: "idx_user_uuid")
  @@index([createdAt], name: "idx_user_created")
  @@map("users")
}

// User sessions: max 5 devices per user (refresh token per session)
model UserSession {
  id               BigInt   @id @default(autoincrement())
  uuid             String   @unique @default(uuid()) @db.Char(36)
  userId           BigInt   @map("user_id")
  refreshTokenHash String   @map("refresh_token_hash") @db.VarChar(255)
  deviceName       String?  @map("device_name") @db.VarChar(200)
  ipAddress        String   @map("ip_address") @db.VarChar(45)
  userAgent        String?  @map("user_agent") @db.Text
  lastActiveAt     DateTime @map("last_active_at")
  expiresAt        DateTime @map("expires_at")
  createdAt        DateTime @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([uuid], name: "idx_session_uuid")
  @@index([userId], name: "idx_session_user")
  @@index([refreshTokenHash], name: "idx_session_token")
  @@index([userId, lastActiveAt], name: "idx_session_user_lru")
  @@map("user_sessions")
}

model AuditLog {
  id        BigInt    @id @default(autoincrement())
  uuid      String    @unique @default(uuid()) @db.Char(36)
  userId    BigInt?   @map("user_id")
  action    String    @db.VarChar(100)
  entity    String?   @db.VarChar(100)
  entityId  String?   @map("entity_id") @db.VarChar(100)
  ipAddress String?   @map("ip_address") @db.VarChar(45)
  userAgent String?   @map("user_agent") @db.Text
  requestId String?   @map("request_id") @db.VarChar(100)
  oldValues Json?     @map("old_values")
  newValues Json?     @map("new_values")
  metadata  Json?
  details   Json?
  riskLevel RiskLevel @default(LOW) @map("risk_level")
  flagged   Boolean   @default(false)
  createdAt DateTime  @default(now()) @map("created_at")

  user User? @relation(fields: [userId], references: [id], onDelete: SetNull)

  @@index([uuid], name: "idx_audit_uuid")
  @@index([userId, createdAt], name: "idx_audit_user_created")
  @@index([action, createdAt], name: "idx_audit_action_created")
  @@index([entity, entityId, createdAt], name: "idx_audit_entity_created")
  @@index([riskLevel, createdAt], name: "idx_audit_risk_created")
  @@index([flagged, createdAt], name: "idx_audit_flagged_created")
  @@map("audit_logs")
}

enum UserRole {
  GUEST
  USER
  ADMIN
  SUPER_ADMIN
  MODERATOR
}

enum UserStatus {
  PENDING
  ACTIVE
  SUSPENDED
  BANNED
  DELETED
}

enum RiskLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

// Notification

model Notification {
  id      BigInt           @id @default(autoincrement())
  uuid    String           @unique @default(uuid()) @db.Char(36)
  userId  BigInt           @map("user_id")
  type    NotificationType
  title   String           @db.VarChar(255)
  message String           @db.Text
  data    Json?            @db.Json
  isRead  Boolean          @default(false) @map("is_read")

  // Timestamps
  deletedAt DateTime? @map("deleted_at")
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")

  // Relations
  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([uuid], name: "idx_notification_uuid")
  @@index([userId])
  @@index([isRead])
  @@index([userId, deletedAt], name: "idx_notification_user_deleted")
  @@index([userId, isRead, deletedAt], name: "idx_notification_user_read_deleted")
  @@index([createdAt], name: "idx_notification_created")
  @@index([type, createdAt], name: "idx_notification_type_created")
  @@map("notifications")
}

enum NotificationType {
  SYSTEM
  ACCOUNT
  AD_STATUS
  PROMOTION
  SECURITY
  FAVORITE
  REVIEW
  MESSAGE
  SHOP_STATUS
  SHOP_REVIEW
  SHOP_FOLLOWER
}
```

```typescript
prisma/seeds.ts

import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';
import { seedSuperAdmin } from './seeds/super-admin.seed';
import { seedCategories } from './seeds/category.seed';
import { seedLocations } from './seeds/location.seed';

const logger = winston.createLogger({
    level: 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.colorize(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level}]: ${message}`;
        }),
    ),
    transports: [new winston.transports.Console()],
});

const prisma = new PrismaClient();

async function main() {
    const seedEnabled = process.env.SEED_DATABASE === 'true';

    if (!seedEnabled) {
        logger.info('Database seeding is disabled. Set SEED_DATABASE=true to enable.');
        return;
    }

    logger.info('Starting database seeding process...');

    try {
        await seedSuperAdmin(prisma, logger);
        await seedCategories(prisma, logger);
        await seedLocations(prisma, logger);
       
    } catch (e) {
        logger.error(`Seeding failed with error: ${e instanceof Error ? e.message : e}`);
        process.exit(1);
    }

    logger.info('Seeding completed successfully.');
}

main()
    .catch((e) => {
        throw e;
    })
    .finally(async () => {
        await prisma.$disconnect();
    });

----------------------------------------------------------------------------
backend folder architecturre=


classifieds-backend/
│
├── src/
│   ├── main.ts                          # Application entry point
│   ├── app.module.ts                    # Root module
│   ├── app.controller.ts
│   ├── app.service.ts
│   │
│   ├── config/                          # Configuration (no aws.config or elasticsearch.config)
│   │   ├── app.config.ts
│   │   ├── database.config.ts
│   │   ├── env.validation.config.ts    # (target: env.validation.ts)
│   │   ├── jwt.config.ts
│   │   ├── logger.config.ts
│   │   ├── mail.config.ts
│   │   ├── redis.config.ts
│   │   ├── security.config.ts
│   │   ├── throttle.config.ts
│   │   ├── throttle-module.config.ts
│   │   └── websocket.config.ts
│   │
│   ├── common/                          # Shared utilities & helpers
│   │   ├── decorators/
│   │   │   ├── current-user.decorator.ts
│   │   │   ├── roles.decorator.ts
│   │   │   ├── public.decorator.ts
│   │   │   └── response-message.decorator.ts
│   │   ├── guards/
│   │   │   ├── jwt-auth.guard.ts
│   │   │   └── roles.guard.ts           # (target also: throttle.guard.ts)
│   │   ├── filters/
│   │   │   ├── all-exceptions.filter.ts
│   │   │   ├── prisma-exception.filter.ts
│   │   │   └── ws-exception.filter.ts  # (target: http-exception.filter.ts)
│   │   ├── interceptors/
│   │   │   ├── logging.interceptor.ts
│   │   │   ├── transform.interceptor.ts
│   │   │   └── bigint.interceptor.ts    # (target: timeout.interceptor.ts)
│   │   ├── pipes/
│   │   │   └── parse-bigint.pipe.ts     # (target: validation.pipe, parse-int.pipe)
│   │   ├── middleware/
│   │   │   └── request-id.middleware.ts # (target also: logger.middleware)
│   │   ├── interfaces/
│   │   │   ├── paginated-result.interface.ts
│   │   │   ├── page-token-paginated-result.interface.ts
│   │   │   ├── request-user.interface.ts
│   │   │   └── ws-socket.interface.ts  # (target: jwt-payload in auth; pagination.interface)
│   │   ├── dto/
│   │   │   ├── pagination.dto.ts
│   │   │   └── page-token-pagination.dto.ts  # (target: response.dto.ts)
│   │   └── utils/
│   │       ├── slug.util.ts
│   │       ├── pagination.util.ts
│   │       ├── audit.util.ts
│   │       └── jwt-secrets.util.ts     # (target also: date.util, encryption.util)
│   │   # (target also: common/enums/, common/constants/ — not present; Prisma enums used)
│   │
│   ├── modules/                          # Feature modules
│   │   │
│   │   ├── auth/                        # Authentication & Authorization
│   │   │   ├── auth.module.ts
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── strategies/
│   │   │   │   └── jwt.strategy.ts     # (target also: jwt-refresh.strategy, google.strategy)
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   ├── register.request.dto.ts
│   │   │   │   │   ├── register-staff.request.dto.ts
│   │   │   │   │   ├── login.request.dto.ts
│   │   │   │   │   ├── refresh-token.request.dto.ts
│   │   │   │   │   ├── change-password.request.dto.ts
│   │   │   │   │   ├── forgot-password.request.dto.ts
│   │   │   │   │   ├── reset-password.request.dto.ts
│   │   │   │   │   ├── email-verify-send.request.dto.ts
│   │   │   │   │   ├── email-verify-check.request.dto.ts
│   │   │   │   │   └── verify-employee.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       ├── auth-user.response.dto.ts
│   │   │   │       ├── auth-tokens.response.dto.ts
│   │   │   │       └── login-user.response.dto.ts
│   │   │   └── interfaces/
│   │   │       ├── jwt-payload.interface.ts
│   │   │       └── tokens.interface.ts
│   │   │
│   │   ├── users/                       # User Management
│   │   │   ├── users.module.ts
│   │   │   ├── users.controller.ts
│   │   │   ├── users.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   └── update-profile.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       └── update-user.response.dto.ts
│   │   │   └── interfaces/
│   │   │       └── user-profile.interface.ts
│   │   │   # (target: create-user, update-user DTOs — user creation via auth/register)
│   │   │
│   │   │
│   │   │
│   │   │
│   │   ├── notifications/               # In-app Notifications (no email/sms/push sub-services)
│   │   │   ├── notifications.module.ts
│   │   │   ├── notifications.controller.ts
│   │   │   ├── notifications.service.ts
│   │   │   ├── dto/
│   │   │   │   ├── requests/
│   │   │   │   │   └── create-notification.request.dto.ts
│   │   │   │   └── responses/
│   │   │   │       └── notification.response.dto.ts
│   │   │   └── interfaces/
│   │   │       └── notification.interface.ts
│   │   │   # (target: services/ email, sms, push; consumers/ — not implemented)
│   │   │
│   │   ├── mail/                        # Email (welcome, email-verify; target: modules/email)
│   │   │   ├── mail.module.ts
│   │   │   ├── mail.service.ts
│   │   │   ├── templates/
│   │   │   │   ├── welcome.hbs
│   │   │   │   └── email-verify.hbs
│   │   │   # (target: ad-approved, ad-expired, password-reset templates)
│   │   │
│   │   │
│   │   │
│   │   └── health/                      # Health Checks
│   │       ├── health.module.ts
│   │       ├── health.controller.ts
│   │       └── indicators/
│   │           ├── redis.health.ts
│   │           └── websocket.health.ts
│   │   # (target modules not implemented: email, otp, media, promotions, reports, analytics,
│   │   #  saved-searches, admin, payments, subscriptions, moderation, featured-ads, audit)
│   │
│   ├── infrastructure/                  # Infrastructure Layer (current subset)
│   │   ├── cache/
│   │   │   ├── cache.module.ts
│   │   │   └── cache.service.ts        # (target: redis.service.ts + cache.service)
│   │   ├── database/
│   │   │   ├── prisma.module.ts        # (target: database.module)
│   │   │   └── prisma.service.ts
│   │   │   # (target also: transaction.service, transaction.interceptor)
│   │   └── websocket/
│   │       └── redis-io.adapter.ts     # Redis adapter for Socket.IO
│   │   # (target but not implemented: search/, queue/, storage/, ai/, monitoring/, sms/,
│   │   #  events/, jobs/, rate-limiting/, resilience/, feature-flags/, gateway/, observability/)
│   │
│   └── test/                            # Test helpers (unit specs next to sources)
│       ├── mock-factories.ts
│       ├── test-helpers.ts
│       └── index.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── seed.ts
│   ├── migrations/
│   │   ├── 20260220102646_init/
│   │   ├── 20260223100743_add_moderator_to_user_role/
│   │   └── 20260223104101_add_nic_unique_to_user/
│   └── seeds/
│       ├── super-admin.seed.ts         # (target: admin-user.seed, user-roles.seed)
│       ├── category.seed.ts
│       └── location.seed.ts            # (target: locations.seed)
│       # (target: test-data.seed — not present)
│
├── test/                                # E2E testing
│   ├── jest-e2e.json
│   └── app.e2e-spec.ts
│  
│
├── docs
├── nest-cli.json
├── package.json
├── tsconfig.json
├── tsconfig.build.json
└── README.md


----------------------------------------------------------------------------

----------------------------------------------------------------------------
package.json

{
  "name": "classifieds-backend",
  "version": "0.0.1",
  "description": "",
  "author": "",
  "private": true,
  "license": "UNLICENSED",
  "scripts": {
    "build": "nest build",
    "format": "prettier --write \"src/**/*.ts\" \"test/**/*.ts\"",
    "start": "nest start",
    "start:dev": "nest start --watch",
    "start:debug": "nest start --debug --watch",
    "start:prod": "node dist/main",
    "lint": "eslint \"{src,apps,libs,test}/**/*.ts\" --fix",
    "test": "jest",
    "test:watch": "jest --watch",
    "test:cov": "jest --coverage",
    "test:debug": "node --inspect-brk -r tsconfig-paths/register -r ts-node/register node_modules/.bin/jest --runInBand",
    "test:e2e": "jest --config ./test/jest-e2e.json"
  },
  "dependencies": {
    "@nestjs-modules/mailer": "^2.0.2",
    "@nestjs/common": "^11.0.1",
    "@nestjs/config": "^4.0.2",
    "@nestjs/core": "^11.0.1",
    "@nestjs/jwt": "^11.0.2",
    "@nestjs/mapped-types": "^2.0.6",
    "@nestjs/passport": "^11.0.5",
    "@nestjs/platform-express": "^11.0.1",
    "@nestjs/platform-socket.io": "^11.0.1",
    "@nestjs/terminus": "^11.0.0",
    "@nestjs/throttler": "^6.5.0",
    "@nestjs/websockets": "^11.0.1",
    "@prisma/client": "^6.19.1",
    "@socket.io/redis-adapter": "^8.3.0",
    "bcrypt": "^6.0.0",
    "class-transformer": "^0.5.1",
    "class-validator": "^0.14.3",
    "compression": "^1.8.1",
    "handlebars": "^4.7.8",
    "helmet": "^8.1.0",
    "joi": "^18.0.2",
    "nest-winston": "^1.10.2",
    "nodemailer": "^7.0.11",
    "passport": "^0.7.0",
    "passport-jwt": "^4.0.1",
    "redis": "^4.7.0",
    "reflect-metadata": "^0.2.2",
    "rxjs": "^7.8.1",
    "socket.io": "^4.8.1",
    "uuid": "^13.0.0",
    "winston": "^3.19.0",
    "winston-daily-rotate-file": "^5.0.0"
  },
  "devDependencies": {
    "@eslint/eslintrc": "^3.2.0",
    "@eslint/js": "^9.18.0",
    "@nestjs/cli": "^11.0.0",
    "@nestjs/schematics": "^11.0.0",
    "@nestjs/testing": "^11.0.1",
    "@types/bcrypt": "^6.0.0",
    "@types/compression": "^1.8.1",
    "@types/express": "^5.0.0",
    "@types/jest": "^30.0.0",
    "@types/node": "^22.10.7",
    "@types/nodemailer": "^7.0.4",
    "@types/passport-jwt": "^4.0.1",
    "@types/supertest": "^6.0.2",
    "@types/uuid": "^10.0.0",
    "eslint": "^9.18.0",
    "eslint-config-prettier": "^10.0.1",
    "eslint-plugin-prettier": "^5.2.2",
    "globals": "^16.0.0",
    "jest": "^30.0.0",
    "prettier": "^3.4.2",
    "prisma": "^6.19.1",
    "source-map-support": "^0.5.21",
    "supertest": "^7.0.0",
    "ts-jest": "^29.2.5",
    "ts-loader": "^9.5.2",
    "ts-node": "^10.9.2",
    "tsconfig-paths": "^4.2.0",
    "typescript": "^5.7.3",
    "typescript-eslint": "^8.20.0"
  },
  "jest": {
    "moduleFileExtensions": [
      "js",
      "json",
      "ts"
    ],
    "rootDir": "src",
    "testRegex": ".*\\.spec\\.ts$",
    "transform": {
      "^.+\\.(t|j)s$": "ts-jest"
    },
    "collectCoverageFrom": [
      "**/*.(t|j)s",
      "!**/*.module.ts",
      "!**/main.ts",
      "!**/*.dto.ts",
      "!**/dto/**",
      "!**/interfaces/**",
      "!**/test/**",
      "!**/strategies/**",
      "!**/config/**"
    ],
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 90,
        "lines": 90,
        "statements": 90
      }
    },
    "moduleNameMapper": {
      "^@common/(.*)$": "<rootDir>/common/$1",
      "^@modules/(.*)$": "<rootDir>/modules/$1",
      "^@config/(.*)$": "<rootDir>/config/$1",
      "^@infrastructure/(.*)$": "<rootDir>/infrastructure/$1",
      "^@test/(.*)$": "<rootDir>/test/$1"
    },
    "coverageDirectory": "../coverage",
    "testEnvironment": "node",
    "forceExit": true
  },
  "prisma": {
    "seed": "ts-node -r tsconfig-paths/register prisma/seed.ts"
  }
}



----------------------------------------------------------------------------

----------------------------------------------------------------------------
```

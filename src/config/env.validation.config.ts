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

});
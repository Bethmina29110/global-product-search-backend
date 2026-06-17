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
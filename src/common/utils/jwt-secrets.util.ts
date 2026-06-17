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


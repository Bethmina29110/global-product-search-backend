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
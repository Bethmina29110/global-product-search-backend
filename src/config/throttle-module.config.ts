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

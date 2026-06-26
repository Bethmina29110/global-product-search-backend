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
import { LoggingInterceptor } from './common/interceptors/logging.interceptor';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware';
import { TransformInterceptor } from './common/interceptors/transform.interceptor';
import { BigIntInterceptor } from './common/interceptors/bigint.interceptor';
import { ClassSerializerInterceptor } from '@nestjs/common';
import mailConfig from './config/mail.config';
import { MailModule } from './modules/mail/mail.module';
import { NotificationsModule } from './modules/notifications/notifications.module';
import { CacheModule } from './infrastructure/cache/cache.module';
import { getThrottlerModuleOptions } from './config/throttle-module.config';
import { SearchModule } from './search/search.module';
import { RagModule } from './rag/rag.module';
import { AiModule } from './ai/ai.module';
import { RankingModule } from './ranking/ranking.module';
import { FavouritesModule } from './modules/favourites/favourites.module';

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
    SearchModule,
    RagModule,
    AiModule,
    RankingModule,
    FavouritesModule,
  ],

  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
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
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
  logger.log(`WebSocket Server: ws://localhost:${port}/notifications`);
}
bootstrap();

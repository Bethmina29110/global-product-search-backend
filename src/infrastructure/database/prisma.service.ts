import { Injectable, OnModuleInit, OnModuleDestroy, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit, OnModuleDestroy {
  private readonly logger = new Logger(PrismaService.name);

  constructor(private readonly configService: ConfigService) {
    super({
      log: configService.get('app.nodeEnv') === 'development'
        ? ['info', 'warn', 'error']
        : ['error'],
    });
  }

  async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('Checking database connection...');
      await this.$queryRaw`SELECT 1`;
      this.logger.log('Database connected successfully');
    } catch (e) {
      const errorMsg = e instanceof Error ? e.message : String(e);
      this.logger.error(`Database connection failed: ${errorMsg}`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.$disconnect();
    this.logger.log('Database disconnected');
  }
}
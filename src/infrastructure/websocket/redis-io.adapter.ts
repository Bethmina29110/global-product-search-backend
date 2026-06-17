import { IoAdapter } from '@nestjs/platform-socket.io';
import { ServerOptions } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
import { createClient } from 'redis';
import { INestApplication, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

/**
 * Redis Socket.IO Adapter.
 * 
 * Enables horizontal scaling for Socket.IO by using Redis Pub/Sub.
 * Required for multi-instance deployments (ECS, Kubernetes, etc.).
 * 
 * **Features:**
 * - Redis Pub/Sub for cross-instance communication
 * - Automatic fallback to in-memory adapter if Redis unavailable
 * - Configurable connection settings (TLS, timeout, etc.)
 * - Connection health monitoring
 * - Graceful error handling
 * 
 * **How It Works:**
 * - Uses Redis Pub/Sub to broadcast events across instances
 * - Each instance subscribes to Redis channels
 * - Events are published to Redis and received by all instances
 * - Enables WebSocket scaling across multiple servers
 * 
 * **Architecture:**
 * ```
 * Instance 1 (Server A)  ──┐
 *                           ├──> Redis Pub/Sub ──> Instance 2 (Server B)
 * Instance 3 (Server C)  ──┘                      Instance 4 (Server D)
 * ```
 * 
 * **Usage:**
 * ```typescript
 * // In main.ts
 * const redisAdapter = await createRedisAdapter(app, configService);
 * app.useWebSocketAdapter(redisAdapter);
 * ```
 * 
 * **Configuration:**
 * - Set `WS_REDIS_ENABLED=true` to enable Redis adapter
 * - Configure Redis connection via websocket.redis config
 * - Falls back to in-memory adapter if Redis unavailable
 * 
 * **Fallback Behavior:**
 * - If Redis is disabled or connection fails, uses in-memory adapter
 * - In-memory adapter works for single-instance deployments
 * - No errors thrown - graceful degradation
 */
export class RedisIoAdapter extends IoAdapter {
  private readonly logger = new Logger(RedisIoAdapter.name);
  private adapterConstructor: ReturnType<typeof createAdapter> | null = null;

  constructor(
    app: INestApplication,
    private readonly configService: ConfigService,
  ) {
    super(app);
  }

  /**
   * Connects to Redis and initializes the Pub/Sub adapter.
   * 
   * Creates Redis pub and sub clients, connects them, and sets up
   * the Socket.IO Redis adapter. Falls back to in-memory adapter
   * if connection fails.
   * 
   * **Connection Process:**
   * 1. Checks if Redis adapter is enabled
   * 2. Retrieves Redis configuration from ConfigService
   * 3. Creates pub and sub Redis clients
   * 4. Sets up error handlers for both clients
   * 5. Connects with timeout protection (max 10s)
   * 6. Creates Socket.IO Redis adapter
   * 7. Falls back to in-memory adapter on failure
   * 
   * **Reconnection Strategy:**
   * - Exponential backoff: 100ms, 200ms, ... max 3s
   * - Maximum 10 reconnection attempts
   * - Returns error after max retries exceeded
   * 
   * **Error Handling:**
   * - Logs errors but doesn't throw
   * - Falls back to in-memory adapter on failure
   * - Continues operation even if Redis unavailable
   * - Single-instance mode works without Redis
   * 
   * **TLS Support:**
   * - Supports TLS/SSL for secure Redis connections
   * - Required for AWS ElastiCache and similar services
   * - Configured via `REDIS_TLS_ENABLED` environment variable
   * 
   * @throws Never throws - always falls back gracefully
   * 
   * @example
   * ```typescript
   * const adapter = new RedisIoAdapter(app, configService);
   * await adapter.connectToRedis();
   * // Adapter is ready (Redis or in-memory)
   * ```
   */
  async connectToRedis(): Promise<void> {
    const isEnabled = this.configService.get<boolean>('websocket.redis.enabled', false);

    if (!isEnabled) {
      this.logger.log('Redis adapter disabled - running in single-instance mode');
      return;
    }

    const redisHost = this.configService.get<string>('websocket.redis.host', 'localhost');
    const redisPort = this.configService.get<number>('websocket.redis.port', 6379);
    const redisPassword = this.configService.get<string>('websocket.redis.password');
    const redisDb = this.configService.get<number>('websocket.redis.db', 1);
    const connectTimeout = this.configService.get<number>('websocket.redis.connectTimeout', 10000);
    const tls = this.configService.get<boolean>('websocket.redis.tls', false);

    const scheme = tls ? 'rediss' : 'redis';
    const redisUrl = redisPassword
      ? `${scheme}://:${redisPassword}@${redisHost}:${redisPort}/${redisDb}`
      : `${scheme}://${redisHost}:${redisPort}/${redisDb}`;

    const socketOptions: {
      connectTimeout: number;
      reconnectStrategy: (retries: number) => number | Error;
      tls?: boolean;
    } = {
      connectTimeout: Math.min(connectTimeout, 10000),
      reconnectStrategy: (retries: number) =>
        retries > 10 ? new Error('Max Redis reconnection retries exceeded') : Math.min(retries * 100, 3000),
    };
    if (tls) {
      socketOptions.tls = true;
    }

    try {
      const pubClient = createClient({
        url: redisUrl,
        socket: socketOptions,
      });
      const subClient = pubClient.duplicate();

      pubClient.on('error', (err) => {
        this.logger.error('Redis Pub Client Error:', err);
      });

      subClient.on('error', (err) => {
        this.logger.error('Redis Sub Client Error:', err);
      });

      // Add timeout wrapper for initial connection (up to 10s for production)
      const timeoutMs = Math.min(connectTimeout, 10000);
      await Promise.race([
        Promise.all([pubClient.connect(), subClient.connect()]),
        new Promise<void>((_, reject) =>
          setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
        ),
      ]);

      this.adapterConstructor = createAdapter(pubClient, subClient);
      this.logger.log(`Redis adapter connected to ${redisHost}:${redisPort}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.logger.error('Failed to connect to Redis for Socket.IO adapter:', errorMessage);
      this.logger.warn('Falling back to in-memory adapter (single-instance mode)');
    }
  }

  /**
   * Creates Socket.IO server with Redis or in-memory adapter.
   * 
   * Creates a Socket.IO server instance with appropriate adapter
   * (Redis if connected, in-memory otherwise) and applies configuration
   * from ConfigService.
   * 
   * **Server Configuration:**
   * - CORS settings from websocket.cors config
   * - Ping timeout and interval from websocket config
   * - Connection timeout from websocket config
   * - Max HTTP buffer size from websocket config
   * - Supports websocket and polling transports
   * - Allows transport upgrades
   * 
   * **Adapter Selection:**
   * - Uses Redis adapter if `connectToRedis()` succeeded
   * - Falls back to in-memory adapter if Redis unavailable
   * - Logs which adapter is being used
   * 
   * **Process:**
   * 1. Creates Socket.IO server with base configuration
   * 2. Applies CORS, timeout, and buffer size settings
   * 3. Configures transports (websocket, polling)
   * 4. Sets adapter (Redis or in-memory)
   * 5. Returns configured server
   * 
   * @param port - Port number for Socket.IO server
   * @param options - Optional Socket.IO server options (merged with config)
   * @returns Configured Socket.IO server instance
   * 
   * @example
   * ```typescript
   * const server = adapter.createIOServer(3000);
   * // Server is ready with Redis or in-memory adapter
   * ```
   */
  createIOServer(port: number, options?: ServerOptions): any {
    const server = super.createIOServer(port, {
      ...options,
      cors: {
        origin: this.configService.get<string[]>('websocket.cors.origin', ['http://localhost:3000']),
        credentials: true,
      },
      pingTimeout: this.configService.get<number>('websocket.pingTimeout', 30000),
      pingInterval: this.configService.get<number>('websocket.pingInterval', 25000),
      connectTimeout: this.configService.get<number>('websocket.connectTimeout', 45000),
      maxHttpBufferSize: this.configService.get<number>('websocket.maxHttpBufferSize', 1048576),
      transports: ['websocket', 'polling'],
      allowUpgrades: true,
    });

    if (this.adapterConstructor) {
      server.adapter(this.adapterConstructor);
      this.logger.log('Socket.IO server using Redis adapter');
    } else {
      this.logger.log('Socket.IO server using in-memory adapter');
    }

    return server;
  }
}

/**
 * Factory function to create and initialize Redis adapter.
 * 
 * Creates a RedisIoAdapter instance and connects it to Redis.
 * This is the recommended way to create and configure the adapter.
 * 
 * **Process:**
 * 1. Creates RedisIoAdapter instance
 * 2. Calls `connectToRedis()` to establish connection
 * 3. Returns configured adapter ready for use
 * 
 * **Usage:**
 * ```typescript
 * // In main.ts
 * const redisAdapter = await createRedisAdapter(app, configService);
 * app.useWebSocketAdapter(redisAdapter);
 * ```
 * 
 * **Error Handling:**
 * - Never throws - adapter always created successfully
 * - Falls back to in-memory adapter if Redis unavailable
 * - Application continues to work in single-instance mode
 * 
 * @param app - NestJS application instance
 * @param configService - Configuration service for Redis settings
 * @returns Configured RedisIoAdapter (Redis or in-memory)
 * 
 * @example
 * ```typescript
 * async function bootstrap() {
 *   const app = await NestFactory.create(AppModule);
 *   const config = app.get(ConfigService);
 *   
 *   const redisAdapter = await createRedisAdapter(app, config);
 *   app.useWebSocketAdapter(redisAdapter);
 *   
 *   await app.listen(3000);
 * }
 * ```
 */
export async function createRedisAdapter(
  app: INestApplication,
  configService: ConfigService,
): Promise<RedisIoAdapter> {
  const adapter = new RedisIoAdapter(app, configService);
  await adapter.connectToRedis();
  return adapter;
}


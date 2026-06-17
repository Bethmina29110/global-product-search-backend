import { registerAs } from '@nestjs/config';

/**
 * WebSocket configuration interface.
 * 
 * Defines the structure of Socket.IO WebSocket server configuration settings.
 */
export interface WebSocketConfig {
  /** CORS (Cross-Origin Resource Sharing) settings */
  cors: {
    /** Allowed origin domains (comma-separated, default: ['http://localhost:3000']) */
    origin: string[];
    /** Whether to allow credentials (default: true) */
    credentials: boolean;
  };
  /** Ping timeout in milliseconds (default: 30000) */
  pingTimeout: number;
  /** Ping interval in milliseconds (default: 25000) */
  pingInterval: number;
  /** Connection timeout in milliseconds (default: 45000) */
  connectTimeout: number;
  /** Maximum HTTP buffer size in bytes (default: 1048576 = 1MB) */
  maxHttpBufferSize: number;
  /** Redis adapter settings for WebSocket scaling */
  redis: {
    /** Whether Redis adapter is enabled (default: false) */
    enabled: boolean;
    /** Whether TLS/SSL is enabled (default: false) */
    tls: boolean;
    /** Redis server hostname (default: 'localhost') */
    host: string;
    /** Redis server port (default: 6379) */
    port: number;
    /** Redis password (optional) */
    password?: string;
    /** Redis database number 0-15 (default: 1) */
    db: number;
    /** Key prefix for Redis keys (default: 'ws:') */
    keyPrefix: string;
    /** Connection timeout in milliseconds (default: 10000) */
    connectTimeout: number;
  };
  /** Rate limiting settings for WebSocket events */
  rateLimit: {
    /** Maximum events per second per connection (default: 10) */
    maxEventsPerSecond: number;
    /** Block duration in milliseconds when rate limit exceeded (default: 60000) */
    blockDuration: number;
  };
  /** Room management settings */
  rooms: {
    /** Maximum rooms a user can join (default: 100) */
    maxRoomsPerUser: number;
  };
}

/**
 * WebSocket configuration factory.
 * 
 * Provides Socket.IO WebSocket server configuration including CORS,
 * connection timeouts, Redis adapter settings, and rate limiting.
 * 
 * **Environment Variables:**
 * 
 * **CORS:**
 * - `WEBSOCKET_CORS_ORIGIN`: Comma-separated origins (default: 'http://localhost:3000')
 * 
 * **Connection:**
 * - `WS_PING_TIMEOUT`: Ping timeout in ms (default: 30000)
 * - `WS_PING_INTERVAL`: Ping interval in ms (default: 25000)
 * - `WS_CONNECT_TIMEOUT`: Connection timeout in ms (default: 45000)
 * - `WS_MAX_HTTP_BUFFER_SIZE`: Max buffer size in bytes (default: 1048576)
 * 
 * **Redis Adapter:**
 * - `WS_REDIS_ENABLED`: Enable Redis adapter (default: false)
 * - `REDIS_TLS_ENABLED`: Enable TLS/SSL (default: false)
 * - `REDIS_HOST`: Redis hostname (default: 'localhost')
 * - `REDIS_PORT`: Redis port (default: 6379)
 * - `REDIS_PASSWORD`: Redis password (optional)
 * - `WS_REDIS_DB`: Database number 0-15 (default: 1)
 * - `WS_REDIS_KEY_PREFIX`: Key prefix (default: 'ws:')
 * - `REDIS_CONNECT_TIMEOUT`: Connection timeout in ms (default: 10000)
 * 
 * **Rate Limiting:**
 * - `WS_MAX_EVENTS_PER_SECOND`: Max events per second (default: 10)
 * - `WS_BLOCK_DURATION`: Block duration in ms (default: 60000)
 * 
 * **Rooms:**
 * - `WS_MAX_ROOMS_PER_USER`: Max rooms per user (default: 100)
 * 
 * **Usage:**
 * ```typescript
 * // In app.module.ts
 * ConfigModule.forRoot({
 *   load: [websocketConfig],
 * })
 * 
 * // In WebSocket gateway
 * @WebSocketGateway({
 *   cors: {
 *     origin: config.get<string[]>('websocket.cors.origin'),
 *     credentials: config.get<boolean>('websocket.cors.credentials'),
 *   },
 *   pingTimeout: config.get<number>('websocket.pingTimeout'),
 *   pingInterval: config.get<number>('websocket.pingInterval'),
 * })
 * ```
 * 
 * @returns WebSocket configuration object
 */
export default registerAs('websocket', (): WebSocketConfig => ({
  cors: {
    origin: process.env.WEBSOCKET_CORS_ORIGIN?.split(',') ?? ['http://localhost:3000'],
    credentials: true,
  },
  pingTimeout: parseInt(process.env.WS_PING_TIMEOUT ?? '30000', 10) || 30000,
  pingInterval: parseInt(process.env.WS_PING_INTERVAL ?? '25000', 10) || 25000,
  connectTimeout: parseInt(process.env.WS_CONNECT_TIMEOUT ?? '45000', 10) || 45000,
  maxHttpBufferSize: parseInt(process.env.WS_MAX_HTTP_BUFFER_SIZE ?? '1048576', 10) || 1048576,
  redis: {
    enabled: process.env.WS_REDIS_ENABLED === 'true',
    tls: process.env.REDIS_TLS_ENABLED === 'true',
    host: process.env.REDIS_HOST ?? 'localhost',
    port: parseInt(process.env.REDIS_PORT ?? '6379', 10) || 6379,
    password: process.env.REDIS_PASSWORD,
    db: parseInt(process.env.WS_REDIS_DB ?? '1', 10) || 1,
    keyPrefix: process.env.WS_REDIS_KEY_PREFIX ?? 'ws:',
    connectTimeout: parseInt(process.env.REDIS_CONNECT_TIMEOUT ?? '10000', 10) || 10000,
  },
  rateLimit: {
    maxEventsPerSecond: parseInt(process.env.WS_MAX_EVENTS_PER_SECOND ?? '10', 10) || 10,
    blockDuration: parseInt(process.env.WS_BLOCK_DURATION ?? '60000', 10) || 60000,
  },
  rooms: {
    maxRoomsPerUser: parseInt(process.env.WS_MAX_ROOMS_PER_USER ?? '100', 10) || 100,
  },
}));




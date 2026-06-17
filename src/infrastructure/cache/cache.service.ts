import { Injectable, Logger, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { createClient, RedisClientType } from 'redis';

/**
 * Redis Cache Service.
 * 
 * Provides high-performance caching for search results, suggestions, and frequently accessed data.
 * Implements automatic connection management, error handling, and graceful degradation.
 * 
 * **Features:**
 * - Automatic Redis connection on module initialization
 * - Graceful degradation (continues without cache if Redis unavailable)
 * - Connection health checking via ping
 * - Comprehensive cache operations (get, set, del, mget, mset, etc.)
 * - Pattern-based key deletion
 * - TTL support for automatic expiration
 * - JSON serialization/deserialization
 * - Reconnection strategy with exponential backoff
 * 
 * **Connection Management:**
 * - Automatically connects on module init
 * - Handles connection errors gracefully
 * - Falls back to no-op operations if Redis unavailable
 * - Reconnection strategy: exponential backoff (100ms, 200ms, ... max 3s)
 * - Maximum 10 reconnection attempts
 * 
 * **Graceful Degradation:**
 * - If Redis is disabled (`REDIS_ENABLED=false`), service runs without cache
 * - If Redis connection fails, service continues without cache
 * - All operations return null/false on error but don't throw exceptions
 * - Application continues to function normally without caching
 * 
 * **Usage:**
 * ```typescript
 * constructor(private cache: CacheService) {}
 * 
 * // Set cache with TTL (1 hour)
 * await this.cache.set('user:123', userData, 3600);
 * 
 * // Get cache
 * const user = await this.cache.get<User>('user:123');
 * if (user) {
 *   // Use cached data
 * } else {
 *   // Fetch from database
 * }
 * 
 * // Delete cache
 * await this.cache.del('user:123');
 * 
 * // Pattern deletion
 * await this.cache.delPattern('user:*');
 * 
 * // Multiple operations
 * await this.cache.mset({ 'key1': value1, 'key2': value2 }, 3600);
 * const values = await this.cache.mget<string[]>(['key1', 'key2']);
 * 
 * // Check connection health
 * const isHealthy = await this.cache.ping();
 * ```
 * 
 * **Error Handling:**
 * - All operations return null/false on error (graceful degradation)
 * - Errors are logged but don't throw exceptions
 * - Service continues to work even if Redis is unavailable
 * - Connection errors are logged at warn level
 * - Operation errors are logged at error level
 * 
 * **Configuration:**
 * - `REDIS_ENABLED`: Enable/disable Redis (default: false)
 * - `REDIS_HOST`: Redis hostname (default: 'localhost')
 * - `REDIS_PORT`: Redis port (default: 6379)
 * - `REDIS_PASSWORD`: Redis password (optional)
 * - `REDIS_DB`: Database number 0-15 (default: 0)
 * - `REDIS_TTL`: Default cache TTL in seconds (default: 3600)
 * - `REDIS_TLS_ENABLED`: Enable TLS/SSL (default: false)
 * - `REDIS_CONNECT_TIMEOUT`: Connection timeout in ms (default: 10000)
 * - `REDIS_MAX_RETRIES`: Max retry attempts (default: 3)
 */
@Injectable()
export class CacheService implements OnModuleInit, OnModuleDestroy {
    private readonly logger = new Logger(CacheService.name);
    private client: RedisClientType | null = null;
    private _isConnected = false;

    /**
     * Get the current Redis connection status.
     * 
     * Indicates whether the service is currently connected to Redis.
     * Returns false if Redis is disabled, connection failed, or connection was lost.
     * 
     * @returns true if Redis is connected and ready, false otherwise
     * 
     * @example
     * ```typescript
     * if (this.cache.isConnected) {
     *   // Redis is available, use caching
     *   await this.cache.set('key', value);
     * } else {
     *   // Redis unavailable, skip caching
     * }
     * ```
     */
    get isConnected(): boolean {
        return this._isConnected;
    }

    constructor(private readonly configService: ConfigService) {}

    /**
     * Initializes Redis connection on module initialization.
     * 
     * Called automatically by NestJS when the module is initialized.
     * Attempts to connect to Redis and sets up error handlers.
     */
    async onModuleInit(): Promise<void> {
        await this.connect();
    }

    /**
     * Gracefully disconnects from Redis on module destruction.
     * 
     * Called automatically by NestJS when the module is destroyed.
     * Ensures clean Redis connection closure.
     */
    async onModuleDestroy(): Promise<void> {
        await this.disconnect();
    }

    /**
     * Connects to Redis server.
     * 
     * Establishes connection to Redis with configuration from ConfigService.
     * Sets up error handlers and reconnection strategy.
     * 
     * **Process:**
     * 1. Checks if Redis is enabled
     * 2. Retrieves connection configuration
     * 3. Creates Redis client with TLS support if enabled
     * 4. Sets up error and connect event handlers
     * 5. Connects with timeout protection
     * 6. Updates connection status
     * 
     * **Reconnection Strategy:**
     * - Exponential backoff: 100ms, 200ms, ... max 3s
     * - Maximum 10 reconnection attempts
     * - Returns error after max retries exceeded
     * 
     * **Error Handling:**
     * - Logs warnings but doesn't throw
     * - Sets connection status to false
     * - Service continues without cache
     * 
     * @private
     */
    private async connect(): Promise<void> {
        const enabled = this.configService.get<boolean>('redis.enabled', false);
        if (!enabled) {
            this.logger.log('Redis cache is disabled (REDIS_ENABLED=false). Running without cache.');
            return;
        }

        try {
            const host = this.configService.get<string>('redis.host', 'localhost');
            const port = this.configService.get<number>('redis.port', 6379);
            const password = this.configService.get<string>('redis.password');
            const db = this.configService.get<number>('redis.db', 0);
            const connectTimeout = this.configService.get<number>('redis.connectTimeout', 10000);
            const tls = this.configService.get<boolean>('redis.tls', false);

            const scheme = tls ? 'rediss' : 'redis';
            const redisUrl = password
                ? `${scheme}://:${password}@${host}:${port}/${db}`
                : `${scheme}://${host}:${port}/${db}`;

            const socketOptions: {
                connectTimeout: number;
                reconnectStrategy: (retries: number) => number | Error;
                tls?: boolean;
            } = {
                connectTimeout: Math.min(connectTimeout, 10000), // Up to 10s for production (e.g. ElastiCache in VPC)
                reconnectStrategy: (retries: number) => {
                    if (retries > 10) {
                        return new Error('Max Redis reconnection retries exceeded');
                    }
                    return Math.min(retries * 100, 3000); // Backoff: 100ms, 200ms, ... max 3s
                },
            };
            if (tls) {
                socketOptions.tls = true;
            }

            this.client = createClient({
                url: redisUrl,
                socket: socketOptions,
            });

            this.client.on('error', (err) => {
                // Only log error code/message as plain string, not the error object
                const errorCode = err?.code || 'UNKNOWN';
                const errorMessage = err?.message || 'Connection error';
                // Use plain string to avoid Winston serializing the error object
                this.logger.warn(`Redis connection error: ${errorCode} - ${errorMessage}`);
                this._isConnected = false;
            });

            this.client.on('connect', () => {
                this.logger.log(`Redis connected to ${host}:${port}`);
                this._isConnected = true;
            });

            // Add timeout wrapper for initial connection (up to 10s for production)
            const timeoutMs = Math.min(connectTimeout, 10000);
            await Promise.race([
                this.client.connect(),
                new Promise<void>((_, reject) =>
                    setTimeout(() => reject(new Error(`Connection timeout after ${timeoutMs}ms`)), timeoutMs)
                ),
            ]);
            
            // Set connection status after successful connection
            this._isConnected = true;
        } catch (error) {
            // Extract only the message as plain string to avoid Winston serializing error object
            const errorMessage = error instanceof Error ? error.message : String(error);
            // Use plain string message only, no second parameter to avoid object serialization
            this.logger.warn(`Redis connection failed, running without cache: ${errorMessage}`);
            this._isConnected = false;
            this.client = null;
        }
    }

    /**
     * Disconnects from Redis server.
     * 
     * Gracefully closes Redis connection and cleans up resources.
     * Handles connection errors silently.
     * 
     * **Process:**
     * 1. Checks if client exists
     * 2. Sends QUIT command to Redis
     * 3. Clears client reference
     * 4. Updates connection status
     * 
     * **Error Handling:**
     * - Ignores quit errors (e.g., already closed)
     * - Always completes successfully
     * 
     * @private
     */
    private async disconnect(): Promise<void> {
        if (this.client) {
            try {
                await this.client.quit();
                this.logger.log('Redis disconnected');
            } catch {
                // Ignore quit errors (e.g. already closed)
            }
            this.client = null;
        }
        this._isConnected = false;
    }

    /**
     * Check Redis connection health by performing a ping operation.
     * 
     * Performs an actual Redis PING command to verify connectivity and responsiveness.
     * Used by health checks to ensure Redis is available and responding.
     * 
     * **Process:**
     * 1. Checks if connected and client exists
     * 2. Sends PING command to Redis
     * 3. Verifies response is 'PONG'
     * 4. Updates connection status based on result
     * 
     * **Error Handling:**
     * - Returns false if not connected or on error
     * - Logs errors at error level
     * - Updates connection status to false on error
     * 
     * @returns Promise that resolves to true if Redis responds with 'PONG', false otherwise
     * 
     * @example
     * ```typescript
     * // In health check
     * const isHealthy = await this.cache.ping();
     * if (!isHealthy) {
     *   // Redis is down or unresponsive
     * }
     * ```
     */
    async ping(): Promise<boolean> {
        if (!this._isConnected || !this.client) {
            return false;
        }

        try {
            // Use Redis PING command for health check
            const result = await this.client.ping();
            return result === 'PONG';
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Redis ping failed: ${errorMsg}`);
            this._isConnected = false;
            return false;
        }
    }

    /**
     * Get cached value by key.
     * 
     * Retrieves a cached value and deserializes it from JSON.
     * Returns null if key doesn't exist, Redis is unavailable, or on error.
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Retrieves value from Redis
     * 3. Deserializes JSON string to object
     * 4. Returns typed value or null
     * 
     * **Error Handling:**
     * - Returns null if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @template T - Type of the cached value
     * @param key - Cache key
     * @returns Cached value or null if not found/unavailable
     * 
     * @example
     * ```typescript
     * // Get cached user
     * const user = await this.cache.get<User>('user:123');
     * if (user) {
     *   // Use cached user
     *   return user;
     * } else {
     *   // Fetch from database
     *   const user = await this.prisma.user.findUnique({ where: { id: 123n } });
     *   await this.cache.set('user:123', user, 3600);
     *   return user;
     * }
     * ```
     */
    async get<T>(key: string): Promise<T | null> {
        if (!this._isConnected || !this.client) {
            return null;
        }

        try {
            const value = await this.client.get(key);
            return value ? (JSON.parse(value) as T) : null;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error getting cache key ${key}: ${errorMsg}`);
            return null;
        }
    }

    /**
     * Set cached value with optional TTL (Time To Live).
     * 
     * Stores a value in Redis cache with optional expiration time.
     * Serializes the value to JSON before storing.
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Serializes value to JSON string
     * 3. Stores in Redis with optional TTL
     * 4. Returns success status
     * 
     * **TTL Behavior:**
     * - If `ttlSeconds` is provided, value expires after specified seconds
     * - If `ttlSeconds` is omitted, value persists indefinitely
     * - TTL is set using Redis SETEX command
     * 
     * **Error Handling:**
     * - Returns false if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param key - Cache key
     * @param value - Value to cache (will be JSON serialized)
     * @param ttlSeconds - Optional TTL in seconds (default: no expiration)
     * @returns true if successfully cached, false otherwise
     * 
     * @example
     * ```typescript
     * // Cache user for 1 hour
     * await this.cache.set('user:123', userData, 3600);
     * 
     * // Cache without expiration
     * await this.cache.set('config:app', configData);
     * 
     * // Cache complex object
     * await this.cache.set('search:results', { results: [...], total: 100 }, 1800);
     * ```
     */
    async set(key: string, value: any, ttlSeconds?: number): Promise<boolean> {
        if (!this._isConnected || !this.client) {
            return false;
        }

        try {
            const serialized = JSON.stringify(value);
            if (ttlSeconds) {
                await this.client.setEx(key, ttlSeconds, serialized);
            } else {
                await this.client.set(key, serialized);
            }
            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error setting cache key ${key}: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Delete cached value by key.
     * 
     * Removes a single key from Redis cache.
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Deletes key from Redis
     * 3. Returns success status
     * 
     * **Error Handling:**
     * - Returns false if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param key - Cache key to delete
     * @returns true if successfully deleted, false otherwise
     * 
     * @example
     * ```typescript
     * // Delete single cache key
     * await this.cache.del('user:123');
     * 
     * // Delete after update
     * await this.userService.update(id, data);
     * await this.cache.del(`user:${id}`);
     * ```
     */
    async del(key: string): Promise<boolean> {
        if (!this._isConnected || !this.client) {
            return false;
        }

        try {
            await this.client.del(key);
            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error deleting cache key ${key}: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Delete multiple keys by pattern.
     * 
     * Finds all keys matching the pattern and deletes them.
     * Uses Redis KEYS command to find matching keys, then deletes them.
     * 
     * **Warning:**
     * - KEYS command can be slow on large Redis instances
     * - Use with caution in production
     * - Consider using SCAN for better performance on large datasets
     * 
     * **Pattern Examples:**
     * - `'user:*'` - Matches all keys starting with 'user:'
     * - `'*:123'` - Matches all keys ending with ':123'
     * - `'user:*:profile'` - Matches keys like 'user:123:profile'
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Finds all keys matching pattern using KEYS command
     * 3. Deletes all matching keys
     * 4. Returns count of deleted keys
     * 
     * **Error Handling:**
     * - Returns 0 if Redis unavailable, no keys found, or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param pattern - Redis key pattern (supports * wildcard)
     * @returns Number of keys deleted (0 if none found or error)
     * 
     * @example
     * ```typescript
     * // Delete all user caches
     * const deleted = await this.cache.delPattern('user:*');
     * // deleted = 150 (number of user cache keys deleted)
     * 
     * // Delete all search result caches
     * await this.cache.delPattern('search:*');
     * ```
     */
    async delPattern(pattern: string): Promise<number> {
        if (!this._isConnected || !this.client) {
            return 0;
        }

        try {
            const keys = await this.client.keys(pattern);
            if (keys.length === 0) {
                return 0;
            }
            await this.client.del(keys);
            return keys.length;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error deleting cache pattern ${pattern}: ${errorMsg}`);
            return 0;
        }
    }

    /**
     * Check if cache key exists.
     * 
     * Verifies whether a key exists in Redis cache without retrieving its value.
     * More efficient than `get()` when you only need to check existence.
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Uses Redis EXISTS command
     * 3. Returns true if key exists (result === 1)
     * 
     * **Error Handling:**
     * - Returns false if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param key - Cache key to check
     * @returns true if key exists, false otherwise
     * 
     * @example
     * ```typescript
     * // Check if cache exists before fetching
     * if (await this.cache.exists('user:123')) {
     *   const user = await this.cache.get<User>('user:123');
     * } else {
     *   // Fetch from database
     * }
     * ```
     */
    async exists(key: string): Promise<boolean> {
        if (!this._isConnected || !this.client) {
            return false;
        }

        try {
            const result = await this.client.exists(key);
            return result === 1;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error checking cache key ${key}: ${errorMsg}`);
            return false;
        }
    }

    /**
     * Increment a numeric cache value.
     * 
     * Atomically increments a numeric value stored in Redis.
     * If the key doesn't exist, it is initialized to 0 before incrementing.
     * 
     * **Use Cases:**
     * - Counter operations (view counts, like counts, etc.)
     * - Rate limiting
     * - Statistics tracking
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Uses Redis INCR command (atomic operation)
     * 3. Returns new incremented value
     * 
     * **Error Handling:**
     * - Returns null if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param key - Cache key containing numeric value
     * @returns New incremented value or null on error
     * 
     * @example
     * ```typescript
     * // Increment view count
     * const views = await this.cache.incr('ad:123:views');
     * // views = 1 (first increment)
     * // views = 2 (second increment)
     * 
     * // Rate limiting
     * const count = await this.cache.incr(`rate:${userId}`);
     * if (count && count > 10) {
     *   throw new Error('Rate limit exceeded');
     * }
     * ```
     */
    async incr(key: string): Promise<number | null> {
        if (!this._isConnected || !this.client) {
            return null;
        }

        try {
            return await this.client.incr(key);
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error incrementing cache key ${key}: ${errorMsg}`);
            return null;
        }
    }

    /**
     * Get multiple cache values by keys.
     * 
     * Retrieves multiple cached values in a single operation.
     * More efficient than multiple `get()` calls.
     * 
     * **Process:**
     * 1. Checks if Redis is connected and keys array is not empty
     * 2. Uses Redis MGET command to retrieve all values
     * 3. Deserializes each JSON string to object
     * 4. Returns array of values (null for missing keys)
     * 
     * **Return Value:**
     * - Returns array with same length as input keys
     * - Missing keys are represented as null
     * - Values are deserialized from JSON
     * 
     * **Error Handling:**
     * - Returns array of nulls if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @template T - Type of the cached values
     * @param keys - Array of cache keys
     * @returns Array of cached values (null for missing keys)
     * 
     * @example
     * ```typescript
     * // Get multiple users
     * const users = await this.cache.mget<User>([
     *   'user:123',
     *   'user:456',
     *   'user:789'
     * ]);
     * // users = [user1, user2, null] (if user:789 doesn't exist)
     * 
     * // Process results
     * users.forEach((user, index) => {
     *   if (user) {
     *     // Use cached user
     *   } else {
     *     // Fetch from database for keys[index]
     *   }
     * });
     * ```
     */
    async mget<T>(keys: string[]): Promise<(T | null)[]> {
        if (!this._isConnected || !this.client || keys.length === 0) {
            return keys.map(() => null);
        }

        try {
            const values = await this.client.mGet(keys);
            return values.map((v) => (v ? (JSON.parse(v) as T) : null));
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error getting multiple cache keys: ${errorMsg}`);
            return keys.map(() => null);
        }
    }

    /**
     * Set multiple cache key-value pairs.
     * 
     * Stores multiple key-value pairs in Redis in a single atomic operation.
     * More efficient than multiple `set()` calls.
     * 
     * **Process:**
     * 1. Checks if Redis is connected
     * 2. Creates Redis pipeline for atomic operation
     * 3. Serializes each value to JSON
     * 4. Sets all keys with optional TTL
     * 5. Executes pipeline atomically
     * 
     * **TTL Behavior:**
     * - If `ttlSeconds` is provided, all keys expire after specified seconds
     * - If `ttlSeconds` is omitted, keys persist indefinitely
     * - TTL applies to all keys in the operation
     * 
     * **Error Handling:**
     * - Returns false if Redis unavailable or on error
     * - Logs errors at error level
     * - Never throws exceptions (graceful degradation)
     * 
     * @param keyValues - Object with key-value pairs to cache
     * @param ttlSeconds - Optional TTL in seconds for all keys (default: no expiration)
     * @returns true if successfully cached, false otherwise
     * 
     * @example
     * ```typescript
     * // Cache multiple users with 1 hour TTL
     * await this.cache.mset({
     *   'user:123': user1,
     *   'user:456': user2,
     *   'user:789': user3
     * }, 3600);
     * 
     * // Cache configuration without expiration
     * await this.cache.mset({
     *   'config:app': appConfig,
     *   'config:db': dbConfig
     * });
     * ```
     */
    async mset(keyValues: Record<string, any>, ttlSeconds?: number): Promise<boolean> {
        if (!this._isConnected || !this.client) {
            return false;
        }

        try {
            const pipeline = this.client.multi();
            for (const [key, value] of Object.entries(keyValues)) {
                const serialized = JSON.stringify(value);
                if (ttlSeconds) {
                    pipeline.setEx(key, ttlSeconds, serialized);
                } else {
                    pipeline.set(key, serialized);
                }
            }
            await pipeline.exec();
            return true;
        } catch (error) {
            const errorMsg = error instanceof Error ? error.message : String(error);
            this.logger.error(`Error setting multiple cache keys: ${errorMsg}`);
            return false;
        }
    }
}


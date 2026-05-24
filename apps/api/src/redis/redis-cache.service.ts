import { Inject, Injectable, Logger } from '@nestjs/common';
import Redis from 'ioredis';
import { REDIS_CLIENT } from './redis.constants';
import { ConfigService } from '@nestjs/config';

/**
 * Redis caching service following best practices:
 * - data-key-naming: Use consistent key naming conventions (namespace:type:id)
 * - ram-ttl: Set TTL on cache keys to prevent memory leaks
 * - conn-pipelining: Use pipelining for bulk operations
 */
@Injectable()
export class RedisCacheService {
  private readonly logger = new Logger(RedisCacheService.name);
  private readonly defaultTtl: number;
  private readonly keyPrefix = 'life-dashboard';

  constructor(
    @Inject(REDIS_CLIENT) private readonly client: Redis,
    private readonly configService: ConfigService,
  ) {
    this.defaultTtl = this.configService.get<number>('redis.ttl') || 3600;
  }

  /**
   * Build a namespaced key following convention: prefix:module:type:id
   */
  private buildKey(module: string, type: string, id: string): string {
    return `${this.keyPrefix}:${module}:${type}:${id}`;
  }

  /**
   * Set a value with TTL
   */
  async set<T>(
    module: string,
    type: string,
    id: string,
    value: T,
    ttl?: number,
  ): Promise<void> {
    const key = this.buildKey(module, type, id);
    const serialized = JSON.stringify(value);
    const effectiveTtl = ttl ?? this.defaultTtl;

    await this.client.setex(key, effectiveTtl, serialized);
    this.logger.debug(`Cache set: ${key} (TTL: ${effectiveTtl}s)`);
  }

  /**
   * Get a value by key
   */
  async get<T>(module: string, type: string, id: string): Promise<T | null> {
    const key = this.buildKey(module, type, id);
    const value = await this.client.get(key);

    if (!value) {
      this.logger.debug(`Cache miss: ${key}`);
      return null;
    }

    this.logger.debug(`Cache hit: ${key}`);
    return JSON.parse(value) as T;
  }

  /**
   * Delete a key
   */
  async delete(module: string, type: string, id: string): Promise<number> {
    const key = this.buildKey(module, type, id);
    const result = await this.client.del(key);
    this.logger.debug(`Cache deleted: ${key}`);
    return result;
  }

  /**
   * Delete multiple keys matching a pattern
   * WARNING: Use carefully in production - can be slow
   */
  async deleteByPattern(module: string, type?: string): Promise<number> {
    let pattern = `${this.keyPrefix}:${module}`;
    if (type) {
      pattern += `:${type}`;
    }
    pattern += ':*';

    const keys = await this.client.keys(pattern);
    if (keys.length === 0) {
      return 0;
    }

    // conn-pipelining: Use pipeline for bulk delete
    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.del(key));
    const results = await pipeline.exec();

    this.logger.debug(
      `Cache deleted ${results?.length || 0} keys matching: ${pattern}`,
    );
    return results?.length || 0;
  }

  /**
   * Check if key exists
   */
  async exists(module: string, type: string, id: string): Promise<boolean> {
    const key = this.buildKey(module, type, id);
    const result = await this.client.exists(key);
    return result === 1;
  }

  /**
   * Get TTL of a key
   */
  async getTtl(module: string, type: string, id: string): Promise<number> {
    const key = this.buildKey(module, type, id);
    return await this.client.ttl(key);
  }

  /**
   * Refresh TTL of a key
   */
  async refreshTtl(
    module: string,
    type: string,
    id: string,
    ttl?: number,
  ): Promise<boolean> {
    const key = this.buildKey(module, type, id);
    const effectiveTtl = ttl ?? this.defaultTtl;
    const result = await this.client.expire(key, effectiveTtl);
    return result === 1;
  }

  /**
   * Get or set with fallback function
   */
  async getOrSet<T>(
    module: string,
    type: string,
    id: string,
    fallback: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(module, type, id);
    if (cached !== null) {
      return cached;
    }

    const value = await fallback();
    await this.set(module, type, id, value, ttl);
    return value;
  }

  /**
   * Increment a counter
   */
  async increment(module: string, type: string, id: string): Promise<number> {
    const key = this.buildKey(module, type, id);
    return await this.client.incr(key);
  }

  /**
   * Decrement a counter
   */
  async decrement(module: string, type: string, id: string): Promise<number> {
    const key = this.buildKey(module, type, id);
    return await this.client.decr(key);
  }

  /**
   * Health check
   */
  async isHealthy(): Promise<boolean> {
    try {
      const result = await this.client.ping();
      return result === 'PONG';
    } catch {
      return false;
    }
  }

  /**
   * Clear all cache with the app prefix
   * USE WITH CAUTION - for development/debugging only
   */
  async clearAll(): Promise<void> {
    const pattern = `${this.keyPrefix}:*`;
    const keys = await this.client.keys(pattern);

    if (keys.length === 0) {
      return;
    }

    const pipeline = this.client.pipeline();
    keys.forEach((key) => pipeline.del(key));
    await pipeline.exec();

    this.logger.log(`Cleared ${keys.length} cache keys`);
  }
}

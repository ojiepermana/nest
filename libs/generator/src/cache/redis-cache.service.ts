/**
 * Redis Cache Service Implementation
 *
 * Implements ICacheService using Redis via @nestjs/cache-manager
 * Provides caching with auto-invalidation support
 */

import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import {
  ICacheService,
  CacheOptions,
  CacheInvalidationOptions,
  CacheStats,
} from './cache.interface';
import { Logger } from '../utils/logger.util';

@Injectable()
export class RedisCacheService implements ICacheService {
  private hits = 0;
  private misses = 0;

  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  /**
   * Get value from cache
   */
  async get<T>(key: string): Promise<T | null> {
    try {
      const value = await this.cacheManager.get<T>(key);

      if (value !== undefined && value !== null) {
        this.hits++;
        Logger.debug(`Cache HIT: ${key}`);
        return value;
      }

      this.misses++;
      Logger.debug(`Cache MISS: ${key}`);
      return null;
    } catch (error) {
      Logger.error(`Cache get error for key: ${key}`, error as Error);
      return null;
    }
  }

  /**
   * Set value in cache with optional TTL
   */
  async set<T>(key: string, value: T, options?: CacheOptions): Promise<void> {
    try {
      const ttl = options?.ttl || 300000; // Default 5 minutes

      await this.cacheManager.set(key, value, ttl);
      Logger.debug(`Cache SET: ${key} (TTL: ${ttl}ms)`);
    } catch (error) {
      Logger.error(`Cache set error for key: ${key}`, error as Error);
    }
  }

  /**
   * Delete specific key from cache
   */
  async delete(key: string): Promise<void> {
    try {
      await this.cacheManager.del(key);
      Logger.debug(`Cache DELETE: ${key}`);
    } catch (error) {
      Logger.error(`Cache delete error for key: ${key}`, error as Error);
    }
  }

  /**
   * Delete multiple keys matching pattern
   */
  async deletePattern(pattern: string): Promise<number> {
    try {
      // Note: This requires Redis store with SCAN support
      const store = this.cacheManager.store as any;

      if (!store.keys) {
        Logger.warn('Cache store does not support pattern deletion');
        return 0;
      }

      const keys = await store.keys(pattern);
      let deleted = 0;

      for (const key of keys) {
        await this.cacheManager.del(key);
        deleted++;
      }

      Logger.debug(`Cache DELETE PATTERN: ${pattern} (${deleted} keys)`);
      return deleted;
    } catch (error) {
      Logger.error(`Cache delete pattern error for: ${pattern}`, error as Error);
      return 0;
    }
  }

  /**
   * Clear all cache
   */
  async clear(): Promise<void> {
    try {
      await this.cacheManager.reset();
      Logger.debug('Cache CLEARED');
    } catch (error) {
      Logger.error('Cache clear error', error as Error);
    }
  }

  /**
   * Check if key exists in cache
   */
  async has(key: string): Promise<boolean> {
    try {
      const value = await this.cacheManager.get(key);
      return value !== undefined && value !== null;
    } catch (error) {
      Logger.error(`Cache has error for key: ${key}`, error as Error);
      return false;
    }
  }

  /**
   * Get remaining TTL for key
   */
  async ttl(key: string): Promise<number> {
    try {
      const store = this.cacheManager.store as any;

      if (!store.ttl) {
        Logger.warn('Cache store does not support TTL query');
        return -1;
      }

      const ttl = await store.ttl(key);
      return ttl;
    } catch (error) {
      Logger.error(`Cache TTL error for key: ${key}`, error as Error);
      return -1;
    }
  }

  /**
   * Invalidate cache by options
   */
  async invalidate(options: CacheInvalidationOptions): Promise<number> {
    let deleted = 0;

    try {
      if (options.exact) {
        await this.delete(options.exact);
        deleted = 1;
      }

      if (options.pattern) {
        deleted += await this.deletePattern(options.pattern);
      }

      if (options.tags && options.tags.length > 0) {
        // Invalidate by tags (requires tag-based cache strategy)
        for (const tag of options.tags) {
          deleted += await this.deletePattern(`*:tag:${tag}:*`);
        }
      }

      Logger.debug(`Cache INVALIDATED: ${deleted} keys`);
      return deleted;
    } catch (error) {
      Logger.error('Cache invalidation error', error as Error);
      return deleted;
    }
  }

  /**
   * Get cache statistics
   */
  async getStats(): Promise<CacheStats> {
    try {
      const store = this.cacheManager.store as any;
      let keys = 0;

      if (store.keys) {
        const allKeys = await store.keys('*');
        keys = allKeys.length;
      }

      return {
        hits: this.hits,
        misses: this.misses,
        keys,
      };
    } catch (error) {
      Logger.error('Cache stats error', error as Error);
      return {
        hits: this.hits,
        misses: this.misses,
        keys: 0,
      };
    }
  }

  /**
   * Reset statistics
   */
  resetStats(): void {
    this.hits = 0;
    this.misses = 0;
  }
}

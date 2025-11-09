/**
 * Cacheable Decorator
 *
 * Automatically cache method results
 * Usage: @Cacheable({ key: 'users', ttl: 300000 })
 */

import { CacheOptions } from './cache.interface';

export interface CacheableOptions extends CacheOptions {
  keyPrefix?: string;
  keyGenerator?: (...args: any[]) => string;
}

/**
 * Cacheable method decorator
 */
export function Cacheable(options: CacheableOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Get cache service from class instance
      const cacheService = (this as any).cacheService;

      if (!cacheService) {
        // No cache service, execute method normally
        return originalMethod.apply(this, args);
      }

      // Generate cache key
      let cacheKey: string;
      if (options.keyGenerator) {
        cacheKey = options.keyGenerator(...args);
      } else {
        const prefix = options.keyPrefix || target.constructor.name;
        const argsKey = JSON.stringify(args);
        cacheKey = `${prefix}:${propertyKey}:${argsKey}`;
      }

      // Try to get from cache
      const cached = await cacheService.get(cacheKey);
      if (cached !== null && cached !== undefined) {
        return cached;
      }

      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Store in cache
      if (result !== null && result !== undefined) {
        await cacheService.set(cacheKey, result, {
          ttl: options.ttl,
          tags: options.tags,
        });
      }

      return result;
    };

    return descriptor;
  };
}

/**
 * CacheInvalidate decorator
 * Invalidates cache after method execution
 */
export interface CacheInvalidateOptions {
  keyPrefix?: string;
  pattern?: string;
  tags?: string[];
  keyGenerator?: (...args: any[]) => string;
}

export function CacheInvalidate(options: CacheInvalidateOptions = {}) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor,
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (...args: any[]) {
      // Execute original method
      const result = await originalMethod.apply(this, args);

      // Get cache service from class instance
      const cacheService = (this as any).cacheService;

      if (cacheService) {
        // Invalidate cache
        if (options.pattern) {
          await cacheService.deletePattern(options.pattern);
        } else if (options.keyGenerator) {
          const key = options.keyGenerator(...args);
          await cacheService.delete(key);
        } else if (options.tags) {
          await cacheService.invalidate({ tags: options.tags });
        } else {
          // Default: invalidate all keys with prefix
          const prefix = options.keyPrefix || target.constructor.name;
          await cacheService.deletePattern(`${prefix}:*`);
        }
      }

      return result;
    };

    return descriptor;
  };
}

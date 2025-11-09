/**
 * Cache Service Interface
 *
 * Provides caching capabilities for generated repositories
 * Supports Redis, memory, and other cache-manager stores
 */

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string; // Custom cache key
  tags?: string[]; // Cache tags for grouped invalidation
}

export interface CacheInvalidationOptions {
  pattern?: string; // Pattern to match keys (Redis SCAN)
  tags?: string[]; // Invalidate by tags
  exact?: string; // Exact key to invalidate
}

/**
 * Cache Service Interface
 */
export interface ICacheService {
  /**
   * Get value from cache
   */
  get<T>(key: string): Promise<T | null>;

  /**
   * Set value in cache with optional TTL
   */
  set<T>(key: string, value: T, options?: CacheOptions): Promise<void>;

  /**
   * Delete specific key from cache
   */
  delete(key: string): Promise<void>;

  /**
   * Delete multiple keys matching pattern
   */
  deletePattern(pattern: string): Promise<number>;

  /**
   * Clear all cache
   */
  clear(): Promise<void>;

  /**
   * Check if key exists in cache
   */
  has(key: string): Promise<boolean>;

  /**
   * Get remaining TTL for key
   */
  ttl(key: string): Promise<number>;

  /**
   * Invalidate cache by options
   */
  invalidate(options: CacheInvalidationOptions): Promise<number>;

  /**
   * Get cache statistics
   */
  getStats(): Promise<CacheStats>;
}

export interface CacheStats {
  hits: number;
  misses: number;
  keys: number;
  size?: number; // Memory size in bytes (if available)
}

/**
 * Cache key builder
 */
export class CacheKeyBuilder {
  private parts: string[] = [];

  constructor(private prefix: string = 'app') {
    this.parts.push(prefix);
  }

  /**
   * Add entity name
   */
  entity(name: string): this {
    this.parts.push(name);
    return this;
  }

  /**
   * Add operation
   */
  operation(op: string): this {
    this.parts.push(op);
    return this;
  }

  /**
   * Add ID
   */
  id(id: string | number): this {
    this.parts.push(String(id));
    return this;
  }

  /**
   * Add custom segment
   */
  segment(segment: string): this {
    this.parts.push(segment);
    return this;
  }

  /**
   * Add query parameters hash
   */
  query(params: Record<string, any>): this {
    const sorted = Object.keys(params)
      .sort()
      .reduce(
        (acc, key) => {
          acc[key] = params[key];
          return acc;
        },
        {} as Record<string, any>,
      );

    const hash = JSON.stringify(sorted);
    this.parts.push(hash);
    return this;
  }

  /**
   * Build final cache key
   */
  build(): string {
    return this.parts.join(':');
  }

  /**
   * Build pattern for deletion
   */
  pattern(): string {
    return this.parts.join(':') + ':*';
  }

  /**
   * Static factory
   */
  static create(prefix?: string): CacheKeyBuilder {
    return new CacheKeyBuilder(prefix);
  }
}

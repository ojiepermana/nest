/**
 * Redis Cache Service Tests
 */

import { RedisCacheService } from './redis-cache.service';
import { CacheKeyBuilder } from './cache.interface';

describe('RedisCacheService', () => {
  let service: RedisCacheService;
  let mockCacheManager: any;

  beforeEach(() => {
    mockCacheManager = {
      get: jest.fn(),
      set: jest.fn(),
      del: jest.fn(),
      reset: jest.fn(),
      store: {
        keys: jest.fn(),
        ttl: jest.fn(),
      },
    };

    service = new RedisCacheService(mockCacheManager);
  });

  describe('get', () => {
    it('should return cached value and increment hits', async () => {
      const testValue = { id: '1', name: 'Test' };
      mockCacheManager.get.mockResolvedValue(testValue);

      const result = await service.get('test-key');

      expect(result).toEqual(testValue);
      expect(mockCacheManager.get).toHaveBeenCalledWith('test-key');
    });

    it('should return null and increment misses when not found', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const result = await service.get('missing-key');

      expect(result).toBeNull();
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.get.mockRejectedValue(new Error('Redis error'));

      const result = await service.get('error-key');

      expect(result).toBeNull();
    });
  });

  describe('set', () => {
    it('should set value with default TTL', async () => {
      const testValue = { id: '1', name: 'Test' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', testValue);

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', testValue, 300000);
    });

    it('should set value with custom TTL', async () => {
      const testValue = { id: '1' };
      mockCacheManager.set.mockResolvedValue(undefined);

      await service.set('test-key', testValue, { ttl: 60000 });

      expect(mockCacheManager.set).toHaveBeenCalledWith('test-key', testValue, 60000);
    });

    it('should handle errors gracefully', async () => {
      mockCacheManager.set.mockRejectedValue(new Error('Redis error'));

      await expect(service.set('key', 'value')).resolves.not.toThrow();
    });
  });

  describe('delete', () => {
    it('should delete key from cache', async () => {
      mockCacheManager.del.mockResolvedValue(1);

      await service.delete('test-key');

      expect(mockCacheManager.del).toHaveBeenCalledWith('test-key');
    });
  });

  describe('deletePattern', () => {
    it('should delete all keys matching pattern', async () => {
      const mockKeys = ['users:1', 'users:2', 'users:3'];
      mockCacheManager.store.keys.mockResolvedValue(mockKeys);
      mockCacheManager.del.mockResolvedValue(1);

      const deleted = await service.deletePattern('users:*');

      expect(deleted).toBe(3);
      expect(mockCacheManager.store.keys).toHaveBeenCalledWith('users:*');
      expect(mockCacheManager.del).toHaveBeenCalledTimes(3);
    });

    it('should return 0 if store does not support keys', async () => {
      const serviceWithoutKeys = new RedisCacheService({
        ...mockCacheManager,
        store: {},
      });

      const deleted = await serviceWithoutKeys.deletePattern('test:*');

      expect(deleted).toBe(0);
    });
  });

  describe('clear', () => {
    it('should clear all cache', async () => {
      mockCacheManager.reset.mockResolvedValue(undefined);

      await service.clear();

      expect(mockCacheManager.reset).toHaveBeenCalled();
    });
  });

  describe('has', () => {
    it('should return true if key exists', async () => {
      mockCacheManager.get.mockResolvedValue('value');

      const exists = await service.has('test-key');

      expect(exists).toBe(true);
    });

    it('should return false if key does not exist', async () => {
      mockCacheManager.get.mockResolvedValue(null);

      const exists = await service.has('missing-key');

      expect(exists).toBe(false);
    });
  });

  describe('ttl', () => {
    it('should return TTL for key', async () => {
      mockCacheManager.store.ttl.mockResolvedValue(3600);

      const ttl = await service.ttl('test-key');

      expect(ttl).toBe(3600);
      expect(mockCacheManager.store.ttl).toHaveBeenCalledWith('test-key');
    });

    it('should return -1 if store does not support TTL', async () => {
      const serviceWithoutTtl = new RedisCacheService({
        ...mockCacheManager,
        store: {},
      });

      const ttl = await serviceWithoutTtl.ttl('test-key');

      expect(ttl).toBe(-1);
    });
  });

  describe('invalidate', () => {
    it('should invalidate exact key', async () => {
      mockCacheManager.del.mockResolvedValue(1);

      const deleted = await service.invalidate({ exact: 'users:1' });

      expect(deleted).toBe(1);
      expect(mockCacheManager.del).toHaveBeenCalledWith('users:1');
    });

    it('should invalidate by pattern', async () => {
      mockCacheManager.store.keys.mockResolvedValue(['users:1', 'users:2']);
      mockCacheManager.del.mockResolvedValue(1);

      const deleted = await service.invalidate({ pattern: 'users:*' });

      expect(deleted).toBe(2);
    });

    it('should invalidate by tags', async () => {
      mockCacheManager.store.keys.mockResolvedValue(['key1', 'key2']);
      mockCacheManager.del.mockResolvedValue(1);

      const deleted = await service.invalidate({ tags: ['user', 'product'] });

      expect(deleted).toBeGreaterThan(0);
    });
  });

  describe('getStats', () => {
    it('should return cache statistics', async () => {
      mockCacheManager.store.keys.mockResolvedValue(['key1', 'key2', 'key3']);

      // Simulate cache hits
      mockCacheManager.get.mockResolvedValue('value');
      await service.get('key1');
      await service.get('key2');

      const stats = await service.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(0);
      expect(stats.keys).toBe(3);
    });
  });

  describe('resetStats', () => {
    it('should reset hit and miss counters', async () => {
      mockCacheManager.get.mockResolvedValue('value');
      await service.get('key1');
      await service.get('key2');

      service.resetStats();

      mockCacheManager.store.keys.mockResolvedValue([]);
      const stats = await service.getStats();

      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
    });
  });
});

describe('CacheKeyBuilder', () => {
  describe('build', () => {
    it('should build simple cache key', () => {
      const key = CacheKeyBuilder.create('myapp').entity('users').operation('list').build();

      expect(key).toBe('myapp:users:list');
    });

    it('should build cache key with ID', () => {
      const key = CacheKeyBuilder.create('myapp')
        .entity('users')
        .operation('detail')
        .id('123')
        .build();

      expect(key).toBe('myapp:users:detail:123');
    });

    it('should build cache key with query params', () => {
      const key = CacheKeyBuilder.create('myapp')
        .entity('users')
        .operation('list')
        .query({ page: 1, limit: 10, status: 'active' })
        .build();

      expect(key).toContain('myapp:users:list:');
      expect(key).toContain('"limit":10');
      expect(key).toContain('"page":1');
      expect(key).toContain('"status":"active"');
    });

    it('should build cache key with custom segments', () => {
      const key = CacheKeyBuilder.create('myapp')
        .entity('users')
        .segment('recent')
        .segment('active')
        .build();

      expect(key).toBe('myapp:users:recent:active');
    });
  });

  describe('pattern', () => {
    it('should build pattern for deletion', () => {
      const pattern = CacheKeyBuilder.create('myapp').entity('users').operation('list').pattern();

      expect(pattern).toBe('myapp:users:list:*');
    });
  });
});

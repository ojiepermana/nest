import { SetMetadata } from '@nestjs/common';

export const INVALIDATE_CACHE_KEY = 'invalidate_cache';

export interface InvalidateCacheOptions {
  key?: string;
  keys?: string[];
}

export const InvalidateCache = (options: InvalidateCacheOptions) =>
  SetMetadata(INVALIDATE_CACHE_KEY, options);

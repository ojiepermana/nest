/**
 * Cache Module Generator
 *
 * Generates NestJS module with Redis cache configuration
 */

export interface CacheModuleConfig {
  enableCache: boolean;
  redisHost?: string;
  redisPort?: number;
  redisPassword?: string;
  defaultTTL?: number;
}

export class CacheModuleGenerator {
  constructor(private config: CacheModuleConfig) {}

  /**
   * Generate cache imports
   */
  generateImports(): string[] {
    if (!this.config.enableCache) {
      return [];
    }

    return [
      "import { CacheModule } from '@nestjs/cache-manager';",
      "import { redisStore } from 'cache-manager-redis-yet';",
      "import type { RedisClientOptions } from 'redis';",
      "import { RedisCacheService } from '../cache/redis-cache.service';",
    ];
  }

  /**
   * Generate CacheModule configuration
   */
  generateCacheModuleImport(): string {
    if (!this.config.enableCache) {
      return '';
    }

    const host = this.config.redisHost || 'localhost';
    const port = this.config.redisPort || 6379;
    const ttl = this.config.defaultTTL || 300000; // 5 minutes

    const passwordConfig = this.config.redisPassword
      ? `      password: '${this.config.redisPassword}',`
      : '';

    return `
    CacheModule.registerAsync<RedisClientOptions>({
      isGlobal: true,
      useFactory: async () => ({
        store: await redisStore({
          socket: {
            host: '${host}',
            port: ${port},
          },
${passwordConfig}
        }),
        ttl: ${ttl}, // Default TTL in milliseconds
      }),
    }),`;
  }

  /**
   * Generate cache service provider
   */
  generateCacheProvider(): string {
    if (!this.config.enableCache) {
      return '';
    }

    return `
    {
      provide: 'CACHE_SERVICE',
      useClass: RedisCacheService,
    },`;
  }

  /**
   * Generate complete module with cache
   */
  generateModule(moduleName: string, controllers: string[], providers: string[]): string {
    const imports = this.generateImports();
    const cacheModuleImport = this.generateCacheModuleImport();
    const cacheProvider = this.generateCacheProvider();

    const importsSection = this.config.enableCache ? `${cacheModuleImport}\n` : '';

    const providersSection = [...providers, this.config.enableCache ? cacheProvider : '']
      .filter(Boolean)
      .join(',\n    ');

    return `
import { Module } from '@nestjs/common';
${imports.join('\n')}

@Module({
  imports: [${importsSection}],
  controllers: [${controllers.join(', ')}],
  providers: [
    ${providersSection}
  ],
  exports: [],
})
export class ${moduleName}Module {}
`;
  }

  /**
   * Generate cache configuration from metadata
   */
  static fromMetadata(tableMetadata: any): CacheModuleConfig {
    return {
      enableCache: tableMetadata.cache_enabled !== false,
      redisHost: process.env.REDIS_HOST || 'localhost',
      redisPort: parseInt(process.env.REDIS_PORT || '6379', 10),
      redisPassword: process.env.REDIS_PASSWORD,
      defaultTTL: tableMetadata.cache_ttl || 300000,
    };
  }
}

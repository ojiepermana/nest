/**
 * Search Module
 *
 * Dynamic NestJS module for search integration
 * Supports multiple search drivers (Elasticsearch, Algolia, Meilisearch, Database)
 */

import { Module, DynamicModule, Global } from '@nestjs/common';
import type { SearchModuleConfig } from './interfaces/search.interface';
import { SEARCH_DRIVER, SEARCH_CONFIG } from './search.constants';
import { SearchService } from './search.service';
import { ElasticsearchDriver } from './drivers/elasticsearch.driver';
import { AlgoliaDriver } from './drivers/algolia.driver';
import { MeilisearchDriver } from './drivers/meilisearch.driver';
import { DatabaseDriver } from './drivers/database.driver';

@Global()
@Module({})
export class SearchModule {
  /**
   * Register search module with configuration
   */
  static register(config: SearchModuleConfig): DynamicModule {
    const driverProvider = {
      provide: SEARCH_DRIVER,
      useFactory: () => {
        switch (config.driver) {
          case 'elasticsearch':
            if (!config.elasticsearch) {
              throw new Error('Elasticsearch configuration is required');
            }
            return new ElasticsearchDriver(config.elasticsearch);

          case 'algolia':
            if (!config.algolia) {
              throw new Error('Algolia configuration is required');
            }
            return new AlgoliaDriver(config.algolia);

          case 'meilisearch':
            if (!config.meilisearch) {
              throw new Error('Meilisearch configuration is required');
            }
            return new MeilisearchDriver(config.meilisearch);

          case 'database':
            throw new Error('Database driver not implemented yet');

          default:
            throw new Error(`Unknown search driver: ${config.driver}`);
        }
      },
    };

    const configProvider = {
      provide: SEARCH_CONFIG,
      useValue: config,
    };

    return {
      module: SearchModule,
      providers: [driverProvider, configProvider, SearchService],
      exports: [SearchService],
    };
  }

  /**
   * Register search module asynchronously
   */
  static registerAsync(options: {
    useFactory: (...args: any[]) => Promise<SearchModuleConfig> | SearchModuleConfig;
    inject?: any[];
  }): DynamicModule {
    const driverProvider = {
      provide: SEARCH_DRIVER,
      useFactory: async (...args: any[]) => {
        const factoryArgs = args as unknown[];
        const config = await options.useFactory(...factoryArgs);

        switch (config.driver) {
          case 'elasticsearch':
            if (!config.elasticsearch) {
              throw new Error('Elasticsearch configuration is required');
            }
            return new ElasticsearchDriver(config.elasticsearch);

          case 'algolia':
            if (!config.algolia) {
              throw new Error('Algolia configuration is required');
            }
            return new AlgoliaDriver(config.algolia);

          case 'meilisearch':
            if (!config.meilisearch) {
              throw new Error('Meilisearch configuration is required');
            }
            return new MeilisearchDriver(config.meilisearch);

          case 'database':
            if (!config.database) {
              throw new Error('Database configuration is required');
            }
            return new DatabaseDriver(config.database);

          default:
            throw new Error(`Unknown search driver: ${config.driver}`);
        }
      },
      inject: options.inject || [],
    };

    const configProvider = {
      provide: SEARCH_CONFIG,
      useFactory: options.useFactory,
      inject: options.inject || [],
    };

    return {
      module: SearchModule,
      providers: [driverProvider, configProvider, SearchService],
      exports: [SearchService],
    };
  }
}

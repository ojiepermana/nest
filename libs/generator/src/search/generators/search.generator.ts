/**
 * Search Generator
 *
 * Generates search integration code for existing modules
 * Adds search endpoints, decorators, and configuration
 */

import { Injectable } from '@nestjs/common';
import { MetadataService } from '../../metadata/metadata.service';
import type { ColumnMetadata, TableMetadata } from '../../interfaces/generator.interface';

export interface SearchGeneratorOptions {
  /**
   * Schema name
   */
  schema: string;

  /**
   * Table name
   */
  table: string;

  /**
   * Search driver to use
   */
  driver?: 'elasticsearch' | 'algolia' | 'meilisearch' | 'database';

  /**
   * Index name (defaults to table name)
   */
  indexName?: string;

  /**
   * Enable full-text search
   */
  enableFullText?: boolean;

  /**
   * Enable filters
   */
  enableFilters?: boolean;

  /**
   * Enable facets
   */
  enableFacets?: boolean;

  /**
   * Enable suggestions/autocomplete
   */
  enableSuggestions?: boolean;

  /**
   * Enable similar/more-like-this
   */
  enableSimilar?: boolean;

  /**
   * Auto-sync on CRUD operations
   */
  autoSync?: boolean;
}

@Injectable()
export class SearchGenerator {
  constructor(private readonly metadataService: MetadataService) {}

  /**
   * Generate search configuration from metadata
   */
  async generateSearchConfig(options: SearchGeneratorOptions): Promise<string> {
    const metadata = await this.metadataService.getTableMetadata(options.schema, options.table);
    const columns = await this.metadataService.getColumnMetadata(options.schema, options.table);

    const searchableFields = columns
      .filter((col) => col.is_searchable)
      .map((col) => col.column_name);

    const filterableFields = columns
      .filter((col) => col.is_filterable)
      .map((col) => col.column_name);

    const facets = columns
      .filter((col) => col.column_name.includes('category') || col.column_name.includes('type'))
      .map((col) => col.column_name);

    return `
/**
 * Search Configuration for ${this.toPascalCase(options.table)}
 */
import { SearchableConfig } from '@ojiepermana/nest-generator/search';

export const ${this.toPascalCase(options.table)}SearchConfig: SearchableConfig = {
  indexName: '${options.indexName || options.table}',
  searchableFields: [${searchableFields.map((f) => `'${f}'`).join(', ')}],
  filterableFields: [${filterableFields.map((f) => `'${f}'`).join(', ')}],
  facets: [${facets.map((f) => `'${f}'`).join(', ')}],
};
`.trim();
  }

  /**
   * Generate entity with @Searchable decorator
   */
  generateSearchableEntity(options: SearchGeneratorOptions, columns: ColumnMetadata[]): string {
    const className = this.toPascalCase(options.table);
    const searchableFields = columns
      .filter((col) => col.is_searchable)
      .map((col) => col.column_name);

    const filterableFields = columns
      .filter((col) => col.is_filterable)
      .map((col) => col.column_name);

    return `
import { Searchable } from '@ojiepermana/nest-generator/search';

@Searchable({
  indexName: '${options.indexName || options.table}',
  searchableFields: [${searchableFields.map((f) => `'${f}'`).join(', ')}],
  filterableFields: [${filterableFields.map((f) => `'${f}'`).join(', ')}],
})
export class ${className} {
${columns.map((col) => `  ${col.column_name}: ${this.mapDataType(col.data_type)};`).join('\n')}
}
`.trim();
  }

  /**
   * Generate search controller endpoints
   */
  generateSearchController(options: SearchGeneratorOptions): string {
    const className = this.toPascalCase(options.table);

    return `
import { Controller, Get, Query, Param } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { SearchService } from '@ojiepermana/nest-generator/search';

@Controller('${options.table}')
@ApiTags('${className}')
export class ${className}SearchController {
  constructor(private readonly searchService: SearchService) {}

  ${options.enableFullText !== false ? this.generateSearchEndpoint(className) : ''}
  ${options.enableSuggestions ? this.generateSuggestionsEndpoint(className) : ''}
  ${options.enableSimilar ? this.generateSimilarEndpoint(className) : ''}
}
`.trim();
  }

  /**
   * Generate search endpoint
   */
  private generateSearchEndpoint(className: string): string {
    return `
  @Get('search')
  @ApiOperation({ summary: 'Search ${className}' })
  async search(
    @Query('q') query: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ) {
    return this.searchService.search('${className}', query, {
      page,
      limit,
    });
  }
`.trim();
  }

  /**
   * Generate suggestions endpoint
   */
  private generateSuggestionsEndpoint(className: string): string {
    return `
  @Get('suggestions')
  @ApiOperation({ summary: 'Get search suggestions' })
  async suggestions(@Query('q') query: string) {
    return this.searchService
      .queryBuilder('${className}')
      .where('name', 'like', query)
      .limit(10)
      .get();
  }
`.trim();
  }

  /**
   * Generate similar/more-like-this endpoint
   */
  private generateSimilarEndpoint(className: string): string {
    return `
  @Get('similar/:id')
  @ApiOperation({ summary: 'Find similar ${className}' })
  async similar(@Param('id') id: string) {
    const driver = this.searchService['driver'];
    return driver.moreLikeThis('${className.toLowerCase()}s', id, { limit: 10 });
  }
`.trim();
  }

  /**
   * Generate auto-sync interceptor usage
   */
  generateAutoSyncUsage(options: SearchGeneratorOptions): string {
    const className = this.toPascalCase(options.table);

    return `
import { AutoSync } from '@ojiepermana/nest-generator/search';

@Controller('${options.table}')
export class ${className}Controller {
  constructor(
    private readonly service: ${className}Service,
    private readonly searchService: SearchService,
  ) {}

  @Post()
  @AutoSync({ modelName: '${className}', operation: 'create' })
  async create(@Body() dto: Create${className}Dto) {
    return this.service.create(dto);
  }

  @Put(':id')
  @AutoSync({ modelName: '${className}', operation: 'update' })
  async update(@Param('id') id: string, @Body() dto: Update${className}Dto) {
    return this.service.update(id, dto);
  }

  @Delete(':id')
  @AutoSync({ modelName: '${className}', operation: 'delete' })
  async delete(@Param('id') id: string) {
    return this.service.delete(id);
  }
}
`.trim();
  }

  /**
   * Generate module with SearchModule import
   */
  generateModuleWithSearch(options: SearchGeneratorOptions): string {
    const className = this.toPascalCase(options.table);
    const driver = options.driver || 'database';

    const driverConfig = this.getDriverConfig(driver);

    return `
import { Module } from '@nestjs/common';
import { SearchModule } from '@ojiepermana/nest-generator/search';
import { ${className}Controller } from './${options.table}.controller';
import { ${className}Service } from './${options.table}.service';
import { ${className}SearchController } from './${options.table}-search.controller';

@Module({
  imports: [
    SearchModule.register({
      driver: '${driver}',
      ${driverConfig}
    }),
  ],
  controllers: [${className}Controller, ${className}SearchController],
  providers: [${className}Service],
  exports: [${className}Service],
})
export class ${className}Module {}
`.trim();
  }

  /**
   * Get driver-specific configuration
   */
  private getDriverConfig(driver: string): string {
    switch (driver) {
      case 'elasticsearch':
        return `elasticsearch: {
        node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      },`;
      case 'algolia':
        return `algolia: {
        appId: process.env.ALGOLIA_APP_ID,
        apiKey: process.env.ALGOLIA_API_KEY,
      },`;
      case 'meilisearch':
        return `meilisearch: {
        host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
        apiKey: process.env.MEILISEARCH_API_KEY,
      },`;
      case 'database':
      default:
        return `database: {
        type: 'postgresql',
        host: process.env.DB_HOST,
        port: parseInt(process.env.DB_PORT || '5432', 10),
        username: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
        database: process.env.DB_DATABASE,
      },`;
    }
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[_-]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Map database type to TypeScript type
   */
  private mapDataType(dbType: string): string {
    const typeMap: Record<string, string> = {
      varchar: 'string',
      text: 'string',
      uuid: 'string',
      integer: 'number',
      bigint: 'number',
      numeric: 'number',
      decimal: 'number',
      boolean: 'boolean',
      timestamp: 'Date',
      date: 'Date',
      jsonb: 'any',
      json: 'any',
    };

    return typeMap[dbType.toLowerCase()] || 'any';
  }
}

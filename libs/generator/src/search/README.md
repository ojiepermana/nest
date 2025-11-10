# Search Integration Module

**Laravel Scout-like search integration for NestJS with multi-driver support**

## 🎯 Features

- ✅ **Multi-Driver Architecture** - Elasticsearch, Algolia, Meilisearch, Database (fallback)
- ✅ **Laravel Scout-Like API** - Familiar, intuitive interface for PHP developers
- ✅ **Fluent Query Builder** - Chainable methods for building complex queries
- ✅ **Full-Text Search** - Powerful text search with relevance scoring
- ✅ **Faceted Search** - Category filtering with aggregations
- ✅ **Geo Search** - Location-based search with distance sorting
- ✅ **Suggestions** - Auto-complete and search suggestions
- ✅ **More-Like-This** - Find similar documents
- ✅ **Bulk Operations** - Efficient batch indexing
- ✅ **Auto-Sync** - Automatic index updates on CRUD operations (planned)
- ✅ **Type-Safe** - Full TypeScript support with generics

## 📦 Installation

```bash
npm install @elastic/elasticsearch  # For Elasticsearch driver
# npm install algoliasearch          # For Algolia driver (future)
# npm install meilisearch             # For Meilisearch driver (future)
```

## 🚀 Quick Start

### 1. Register the Module

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { SearchModule } from '@ojiepermana/nest-generator/search';

@Module({
  imports: [
    SearchModule.register({
      driver: 'elasticsearch',
      elasticsearch: {
        node: 'http://localhost:9200',
        auth: {
          username: 'elastic',
          password: 'your-password',
        },
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Register Searchable Models

```typescript
// user.service.ts
import { Injectable, OnModuleInit } from '@nestjs/common';
import { SearchService } from '@ojiepermana/nest-generator/search';

@Injectable()
export class UserService implements OnModuleInit {
  constructor(private readonly searchService: SearchService) {}

  async onModuleInit() {
    // Register User model as searchable
    await this.searchService.registerSearchableModel('User', {
      indexName: 'users',
      searchableFields: ['name', 'email', 'bio'],
      filterableFields: ['department', 'role', 'is_active', 'created_at'],
      sortableFields: ['created_at', 'name'],
      facets: ['department', 'role'],
      rankingRules: ['name^3', 'email^2', 'bio'],
    });
  }
}
```

### 3. Index Documents

```typescript
// Make single document searchable
await this.searchService.makeSearchable('User', user, user.id);

// Update searchable document
await this.searchService.updateSearchable('User', { name: 'New Name' }, user.id);

// Remove from search index
await this.searchService.removeFromSearch('User', user.id);

// Bulk import
await this.searchService.importSearchable('User', users);
```

### 4. Search

#### Simple Search

```typescript
const results = await this.searchService.search('User', 'john doe');
```

#### Advanced Query Builder

```typescript
const results = await this.searchService
  .queryBuilder<User>('User')
  .where('john doe')
  .filter('is_active', true)
  .filter('department', 'Engineering')
  .facet('role')
  .facet('department')
  .paginate(1, 20)
  .orderBy('created_at', 'desc')
  .highlight(['name', 'bio'])
  .get();
```

#### Geographic Search

```typescript
const results = await this.searchService
  .queryBuilder<Store>('Store')
  .where('coffee shop')
  .near({ lat: -6.2088, lon: 106.8456 }, '5km')
  .orderBy('_geo_distance', 'asc')
  .get();
```

#### Suggestions (Auto-complete)

```typescript
const suggestions = await this.searchService.suggest('User', 'joh', 'name');
// Returns: ['john', 'johnny', 'johnson']
```

#### Similar Documents

```typescript
const similar = await this.searchService.similar('Product', productId, ['name', 'description']);
```

## 🔧 Configuration

### Elasticsearch Driver

```typescript
SearchModule.register({
  driver: 'elasticsearch',
  elasticsearch: {
    node: 'http://localhost:9200',
    auth: {
      username: 'elastic',
      password: 'changeme',
    },
    requestTimeout: 30000,
    maxRetries: 3,
  },
});
```

### Async Configuration

```typescript
SearchModule.registerAsync({
  useFactory: (configService: ConfigService) => ({
    driver: 'elasticsearch',
    elasticsearch: {
      node: configService.get('ELASTICSEARCH_NODE'),
      auth: {
        username: configService.get('ELASTICSEARCH_USERNAME'),
        password: configService.get('ELASTICSEARCH_PASSWORD'),
      },
    },
  }),
  inject: [ConfigService],
});
```

## 📚 API Reference

### SearchService

#### Model Registration

```typescript
registerSearchableModel(modelName: string, config: SearchableConfig): Promise<void>
```

Registers a model for search with configuration.

#### Indexing Operations

```typescript
makeSearchable<T>(modelName: string, document: T, id: string): Promise<void>
updateSearchable<T>(modelName: string, document: Partial<T>, id: string): Promise<void>
removeFromSearch(modelName: string, id: string): Promise<void>
importSearchable<T>(modelName: string, documents: T[], idField?: string): Promise<SyncStatus>
```

#### Search Operations

```typescript
search<T>(modelName: string, query: string | SearchQuery): Promise<SearchResult<T>>
queryBuilder<T>(modelName: string): SearchQueryBuilder<T>
suggest(modelName: string, query: string, field: string, size?: number): Promise<string[]>
similar<T>(modelName: string, id: string, fields: string[], size?: number): Promise<SearchResult<T>>
```

#### Index Management

```typescript
createIndex(modelName: string): Promise<void>
deleteIndex(modelName: string): Promise<void>
indexExists(modelName: string): Promise<boolean>
getIndexStats(modelName: string): Promise<IndexStats>
healthCheck(): Promise<boolean>
flush(modelName: string): Promise<void>
```

### SearchQueryBuilder

Fluent query builder with chainable methods:

```typescript
// Query
.where(query: string)

// Filters
.filter(field: string, value: any)
.whereEquals(field: string, value: any)
.whereNotEquals(field: string, value: any)
.whereIn(field: string, values: any[])
.whereBetween(field: string, min: any, max: any)

// Facets
.facet(field: string)

// Pagination
.paginate(page: number, perPage: number)
.take(limit: number)

// Fields
.select(fields: string[])
.searchIn(fields: string[])

// Sorting
.orderBy(field: string, order?: 'asc' | 'desc')

// Features
.highlight(fields: string[])
.near(location: GeoPoint, radius: string)
.typoTolerance(enabled: boolean, maxTypos?: number)
.minScore(score: number)

// Execution
.get(): Promise<SearchResult<T>>
.first(): Promise<T | null>
.count(): Promise<number>
```

## 🎨 Usage Examples

### E-Commerce Product Search

```typescript
const products = await this.searchService
  .queryBuilder<Product>('Product')
  .where('laptop gaming')
  .filter('in_stock', true)
  .whereBetween('price', 500, 2000)
  .whereIn('brand', ['Dell', 'HP', 'Lenovo'])
  .facet('brand')
  .facet('category')
  .facet('price_range')
  .orderBy('popularity', 'desc')
  .paginate(1, 24)
  .highlight(['name', 'description'])
  .get();

console.log(`Found ${products.total} products`);
console.log('Brands:', products.facets?.brand);
console.log('Categories:', products.facets?.category);
```

### User Directory with Filters

```typescript
const users = await this.searchService
  .queryBuilder<User>('User')
  .where('software engineer')
  .filter('department', 'Engineering')
  .filter('is_active', true)
  .facet('role')
  .facet('location')
  .orderBy('created_at', 'desc')
  .paginate(1, 50)
  .get();
```

### Location-Based Search

```typescript
const stores = await this.searchService
  .queryBuilder<Store>('Store')
  .where('starbucks')
  .near({ lat: -6.2088, lon: 106.8456 }, '10km')
  .filter('is_open', true)
  .orderBy('_geo_distance', 'asc')
  .take(10)
  .get();
```

### Auto-Complete Suggestions

```typescript
// In search input handler
const suggestions = await this.searchService.suggest(
  'Product',
  searchQuery,
  'name',
  10,
);
```

### Similar Products

```typescript
// "You might also like" section
const similar = await this.searchService.similar(
  'Product',
  currentProductId,
  ['name', 'description', 'category'],
  5,
);
```

### Bulk Import

```typescript
// Import all existing users into search index
const users = await this.userRepository.find();
const status = await this.searchService.importSearchable('User', users, 'id');

console.log(`Imported: ${status.indexed}, Failed: ${status.failed}`);
```

## 🏗️ Architecture

### Multi-Driver Support

```
┌─────────────────┐
│  SearchService  │  ← Unified API
└────────┬────────┘
         │
    ┌────┴────┐
    │ Drivers │
    └────┬────┘
         │
    ┌────┴────────────────────────┐
    │                             │
┌───┴───────┐  ┌─────────┐  ┌────┴────┐
│Elasticsearch│  │ Algolia │  │Meilisrch│
└───────────┘  └─────────┘  └─────────┘
```

### Query Flow

```
User Query
    ↓
SearchQueryBuilder (Fluent API)
    ↓
SearchQuery Object (Normalized)
    ↓
Driver-Specific Translation
    ↓
Search Engine (Elasticsearch/Algolia/etc.)
    ↓
SearchResult<T> (Typed Response)
```

## 🔜 Roadmap

### Phase 1 (Complete)
- ✅ Core interfaces and types
- ✅ Elasticsearch driver
- ✅ SearchService with Laravel Scout API
- ✅ SearchModule for NestJS integration
- ✅ Fluent query builder

### Phase 2 (Next)
- ⏳ Algolia driver
- ⏳ Meilisearch driver
- ⏳ Database driver (fallback)
- ⏳ @Searchable decorator
- ⏳ Auto-sync interceptor
- ⏳ Comprehensive tests

### Phase 3 (Future)
- ⏳ CLI generator integration
- ⏳ Query performance optimization
- ⏳ Advanced faceting
- ⏳ Search analytics
- ⏳ A/B testing support

## 🤝 Integration with Generator

The search module integrates seamlessly with the NestJS Generator:

```bash
# Generate module with search integration
nest-generator generate users.profile --features.search=true --searchDriver=elasticsearch

# Configure searchable fields in metadata
INSERT INTO meta.column_metadata (table_name, column_name, is_searchable, is_filterable)
VALUES ('profile', 'bio', true, false),
       ('profile', 'department', false, true);
```

## 📝 Best Practices

1. **Index Naming**: Use plural, lowercase names (e.g., 'users', 'products')
2. **Searchable Fields**: Limit to text fields that need full-text search
3. **Filterable Fields**: Use for exact matching (categories, statuses, etc.)
4. **Facets**: Add for common filter dimensions
5. **Ranking Rules**: Boost important fields (e.g., title^3 for 3x weight)
6. **Pagination**: Always paginate large result sets
7. **Bulk Operations**: Use `importSearchable()` for initial indexing

## 🐛 Troubleshooting

### Connection Issues
```typescript
// Check health
const isHealthy = await this.searchService.healthCheck();
if (!isHealthy) {
  console.error('Search engine is not available');
}
```

### Index Issues
```typescript
// Verify index exists
const exists = await this.searchService.indexExists('User');
if (!exists) {
  await this.searchService.createIndex('User');
}
```

### Performance
```typescript
// Get index statistics
const stats = await this.searchService.getIndexStats('User');
console.log(`Documents: ${stats.documentCount}`);
console.log(`Size: ${stats.sizeInBytes} bytes`);
```

## 📄 License

MIT

## 🙏 Credits

Inspired by [Laravel Scout](https://laravel.com/docs/scout) - The elegant search solution for Laravel.

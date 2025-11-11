# Search Integration - Complete Guide

Multi-driver search system for NestJS inspired by Laravel Scout. Supports Elasticsearch, Algolia, Meilisearch, and Database (PostgreSQL) drivers.

## Table of Contents

- [Installation](#installation)
- [Quick Start](#quick-start)
- [Driver Configuration](#driver-configuration)
- [Usage Examples](#usage-examples)
- [API Reference](#api-reference)
- [Migration Guide](#migration-guide)
- [Performance & Benchmarks](#performance--benchmarks)
- [Troubleshooting](#troubleshooting)

---

## Installation

### 1. Install the package

```bash
npm install @ojiepermana/nest-generator
```

### 2. Install driver dependencies

**Elasticsearch:**

```bash
npm install @elastic/elasticsearch
```

**Algolia:**

```bash
npm install algoliasearch
```

**Meilisearch:**

```bash
npm install meilisearch
```

**Database (PostgreSQL):**

```bash
npm install pg
# No additional search engine dependencies needed!
```

---

## Quick Start

### 1. Configure SearchModule

**app.module.ts:**

```typescript
import { Module } from '@nestjs/common';
import { SearchModule } from '@ojiepermana/nest-generator/search';

@Module({
  imports: [
    SearchModule.register({
      driver: 'database', // or 'elasticsearch', 'algolia', 'meilisearch'
      database: {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        username: 'postgres',
        password: 'password',
        database: 'myapp',
      },
    }),
  ],
})
export class AppModule {}
```

### 2. Mark Entity as Searchable

**product.entity.ts:**

```typescript
import { Searchable } from '@ojiepermana/nest-generator/search';

@Searchable({
  indexName: 'products',
  searchableFields: ['name', 'description', 'sku'],
  filterableFields: ['price', 'category', 'in_stock'],
  sortableFields: ['price', 'created_at'],
  facets: ['category', 'brand'],
})
export class Product {
  id: string;
  name: string;
  description: string;
  sku: string;
  price: number;
  category: string;
  brand: string;
  in_stock: boolean;
  created_at: Date;
}
```

### 3. Register Model & Start Indexing

**product.service.ts:**

```typescript
import { Injectable } from '@nestjs/common';
import { SearchService } from '@ojiepermana/nest-generator/search';
import { Product } from './product.entity';

@Injectable()
export class ProductService {
  constructor(private readonly searchService: SearchService) {
    // Register on init
    this.searchService.registerSearchableModel('Product', {
      indexName: 'products',
      searchableFields: ['name', 'description', 'sku'],
      filterableFields: ['price', 'category', 'in_stock'],
    });
  }

  async create(data: Partial<Product>): Promise<Product> {
    const product = await this.repository.save(data);

    // Index in search engine
    await this.searchService.makeSearchable('Product', product, product.id);

    return product;
  }
}
```

### 4. Search Your Data

```typescript
// Full-text search
const results = await searchService.search('Product', 'laptop');

// Advanced query builder
const results = await searchService
  .queryBuilder('Product')
  .where('category', 'eq', 'electronics')
  .where('price', 'gte', 500)
  .where('price', 'lte', 2000)
  .where('in_stock', 'eq', true)
  .orderBy('price', 'asc')
  .limit(20)
  .page(1)
  .get();

// Suggestions (autocomplete)
const suggestions = await driver.suggest('products', 'lap', { limit: 5 });

// Similar products (more-like-this)
const similar = await driver.moreLikeThis('products', 'product-123', { limit: 10 });
```

---

## Driver Configuration

### Elasticsearch

```typescript
SearchModule.register({
  driver: 'elasticsearch',
  elasticsearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
    auth: {
      username: process.env.ELASTICSEARCH_USERNAME,
      password: process.env.ELASTICSEARCH_PASSWORD,
    },
  },
});
```

**Environment Variables:**

```env
ELASTICSEARCH_NODE=http://localhost:9200
ELASTICSEARCH_USERNAME=elastic
ELASTICSEARCH_PASSWORD=changeme
```

### Algolia

```typescript
SearchModule.register({
  driver: 'algolia',
  algolia: {
    appId: process.env.ALGOLIA_APP_ID,
    apiKey: process.env.ALGOLIA_API_KEY,
  },
});
```

**Environment Variables:**

```env
ALGOLIA_APP_ID=your_app_id
ALGOLIA_API_KEY=your_admin_api_key
```

### Meilisearch

```typescript
SearchModule.register({
  driver: 'meilisearch',
  meilisearch: {
    host: process.env.MEILISEARCH_HOST || 'http://localhost:7700',
    apiKey: process.env.MEILISEARCH_API_KEY,
  },
});
```

**Environment Variables:**

```env
MEILISEARCH_HOST=http://localhost:7700
MEILISEARCH_API_KEY=your_master_key
```

### Database (PostgreSQL)

```typescript
SearchModule.register({
  driver: 'database',
  database: {
    type: 'postgresql',
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || '5432', 10),
    username: process.env.DB_USERNAME,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_DATABASE,
    schema: 'search', // Optional: custom schema for search tables
  },
});
```

**Environment Variables:**

```env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=password
DB_DATABASE=myapp
```

---

## Usage Examples

### Auto-Sync with @AutoSync Decorator

Automatically sync CRUD operations to search engine:

**product.controller.ts:**

```typescript
import { Controller, Post, Put, Delete, Body, Param } from '@nestjs/common';
import { AutoSync } from '@ojiepermana/nest-generator/search';

@Controller('products')
export class ProductController {
  constructor(
    private readonly productService: ProductService,
    private readonly searchService: SearchService,
  ) {}

  @Post()
  @AutoSync({ modelName: 'Product', operation: 'create', async: true })
  async create(@Body() dto: CreateProductDto) {
    return this.productService.create(dto);
  }

  @Put(':id')
  @AutoSync({ modelName: 'Product', operation: 'update', async: true })
  async update(@Param('id') id: string, @Body() dto: UpdateProductDto) {
    return this.productService.update(id, dto);
  }

  @Delete(':id')
  @AutoSync({ modelName: 'Product', operation: 'delete', async: true })
  async delete(@Param('id') id: string) {
    return this.productService.delete(id);
  }
}
```

### Using SearchSyncInterceptor

Apply interceptor at controller level:

```typescript
import { Controller, UseInterceptors } from '@nestjs/common';
import { createSearchSyncInterceptor } from '@ojiepermana/nest-generator/search';

@Controller('products')
@UseInterceptors(
  createSearchSyncInterceptor(searchService, 'Product', {
    async: true,
    onCreate: true,
    onUpdate: true,
    onDelete: true,
  }),
)
export class ProductController {
  // All CRUD operations will auto-sync to search engine
}
```

### Bulk Import

Index large datasets efficiently:

```typescript
async bulkImport() {
  const products = await this.repository.find();

  const documents = products.map(p => ({
    id: p.id,
    data: p,
  }));

  await this.searchService.importSearchable('Product', documents);
}
```

### Faceted Search

```typescript
const results = await searchService
  .queryBuilder('Product')
  .where('category', 'eq', 'electronics')
  .facet('brand')
  .facet('price_range')
  .get();

// Results include facet counts:
// {
//   hits: [...],
//   facets: {
//     brand: { 'Apple': 45, 'Samsung': 32, 'Sony': 28 },
//     price_range: { '0-500': 60, '500-1000': 30, '1000+': 15 }
//   }
// }
```

### Geo Search (Elasticsearch/Algolia)

```typescript
const results = await driver.geoSearch('stores', {
  lat: -6.2088,
  lon: 106.8456,
  radius: 5, // km
  limit: 20,
});
```

---

## API Reference

### SearchService

#### `registerSearchableModel(modelName, config)`

Register a model as searchable.

```typescript
searchService.registerSearchableModel('Product', {
  indexName: 'products',
  searchableFields: ['name', 'description'],
  filterableFields: ['price', 'category'],
});
```

#### `makeSearchable(modelName, data, id)`

Index a single document.

```typescript
await searchService.makeSearchable('Product', productData, 'product-123');
```

#### `updateSearchable(modelName, data, id)`

Update an indexed document.

```typescript
await searchService.updateSearchable('Product', { price: 999 }, 'product-123');
```

#### `removeFromSearch(modelName, id)`

Delete a document from index.

```typescript
await searchService.removeFromSearch('Product', 'product-123');
```

#### `search(modelName, query, options?)`

Perform full-text search.

```typescript
const results = await searchService.search('Product', 'laptop', {
  page: 1,
  limit: 20,
});
```

#### `importSearchable(modelName, documents, idField?)`

Bulk import documents.

```typescript
await searchService.importSearchable('Product', [
  { id: '1', data: { name: 'Product 1' } },
  { id: '2', data: { name: 'Product 2' } },
]);
```

#### `queryBuilder(modelName)`

Create a query builder instance.

```typescript
const builder = searchService.queryBuilder('Product');
```

### SearchQueryBuilder

#### `where(field, operator, value)`

Add filter condition.

**Operators:** `eq`, `ne`, `gt`, `gte`, `lt`, `lte`, `in`, `nin`, `like`, `between`, `exists`

```typescript
builder.where('price', 'gte', 500);
builder.where('category', 'in', ['electronics', 'computers']);
builder.where('name', 'like', 'laptop');
```

#### `orderBy(field, direction)`

Sort results.

```typescript
builder.orderBy('price', 'asc');
builder.orderBy('created_at', 'desc');
```

#### `limit(count)`

Limit results.

```typescript
builder.limit(20);
```

#### `page(number)`

Paginate results.

```typescript
builder.page(1); // First page
```

#### `facet(field)`

Add facet aggregation.

```typescript
builder.facet('category');
builder.facet('brand');
```

#### `get()`

Execute query and return results.

```typescript
const results = await builder.get();
```

---

## Migration Guide

### From Database to Elasticsearch

**1. Install Elasticsearch:**

```bash
npm install @elastic/elasticsearch
```

**2. Update configuration:**

```typescript
// Before
SearchModule.register({
  driver: 'database',
  database: {
    /* ... */
  },
});

// After
SearchModule.register({
  driver: 'elasticsearch',
  elasticsearch: {
    node: 'http://localhost:9200',
  },
});
```

**3. Reindex data:**

```typescript
// Export from database driver
const products = await oldDriver.search('products', '', { limit: 10000 });

// Import to Elasticsearch
await newDriver.bulk('products', 'index', products.hits);
```

### From Laravel Scout

The API is intentionally similar:

**Laravel Scout:**

```php
$products = Product::search('laptop')
    ->where('price', '>', 500)
    ->take(20)
    ->get();
```

**NestJS Search:**

```typescript
const products = await searchService.queryBuilder('Product').where('price', 'gt', 500).limit(20).get();
```

---

## Performance & Benchmarks

### Driver Comparison

| Driver            | Search Speed        | Setup Complexity | Cost        | Best For                        |
| ----------------- | ------------------- | ---------------- | ----------- | ------------------------------- |
| **Elasticsearch** | ⭐⭐⭐⭐⭐ (< 50ms) | Medium           | Self-hosted | Large datasets, complex queries |
| **Algolia**       | ⭐⭐⭐⭐⭐ (< 10ms) | Easy             | Paid SaaS   | Instant search, high traffic    |
| **Meilisearch**   | ⭐⭐⭐⭐ (< 100ms)  | Easy             | Self-hosted | Medium datasets, self-hosted    |
| **Database**      | ⭐⭐⭐ (< 500ms)    | None             | Free        | Development, small datasets     |

### Optimization Tips

**1. Use appropriate driver for dataset size:**

- < 10k records: Database driver
- 10k - 100k: Meilisearch
- 100k+: Elasticsearch or Algolia

**2. Enable async sync:**

```typescript
@AutoSync({ modelName: 'Product', operation: 'create', async: true })
```

**3. Batch imports:**

```typescript
await searchService.importSearchable('Product', documents); // vs single makeSearchable()
```

**4. Limit searchable fields:**

```typescript
@Searchable({
  searchableFields: ['name', 'sku'], // Don't include large text fields unnecessarily
})
```

---

## Troubleshooting

### Connection Errors

**Elasticsearch "Connection refused":**

```bash
# Check if Elasticsearch is running
curl http://localhost:9200

# Start Elasticsearch (Docker)
docker run -p 9200:9200 -e "discovery.type=single-node" docker.elastic.co/elasticsearch/elasticsearch:8.11.0
```

**Algolia "Invalid API Key":**

- Verify `ALGOLIA_APP_ID` and `ALGOLIA_API_KEY`
- Use **Admin API Key** for indexing (not Search-Only Key)

**Meilisearch "Unauthorized":**

```bash
# Check API key
curl http://localhost:7700 -H "Authorization: Bearer YOUR_KEY"

# Start Meilisearch with master key
meilisearch --master-key="YOUR_MASTER_KEY"
```

### Indexing Issues

**Documents not searchable:**

```typescript
// 1. Check if model is registered
searchService.registerSearchableModel('Product', config);

// 2. Verify index exists
await driver.createIndex('products', config);

// 3. Check index stats
const stats = await driver.getIndexStats('products');
console.log('Documents:', stats.documentCount);
```

**Auto-sync not working:**

```typescript
// Ensure SearchService is injected
constructor(
  private readonly searchService: SearchService, // <- Required for @AutoSync
) {}
```

### Performance Issues

**Slow searches (> 1s):**

1. Add indexes to filterable fields
2. Limit searchable fields
3. Use pagination
4. Consider upgrading to Elasticsearch/Algolia

**High memory usage (Database driver):**

- Database driver stores full documents in JSONB
- For large datasets, use dedicated search engine

---

## Support & Resources

- **Documentation:** [Full docs](./docs/search)
- **Examples:** [Example applications](./examples/search-demo)
- **Issues:** [GitHub Issues](https://github.com/ojiepermana/nest/issues)
- **Discussions:** [GitHub Discussions](https://github.com/ojiepermana/nest/discussions)

---

## License

MIT © Ojie Permana

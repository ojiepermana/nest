# Advanced Query Features Guide

Auto-generated query methods for JOIN, analytics, aggregation, and search operations.

**Version**: 4.0.3 | **Status**: ✅ Auto-Generated

---

## 📋 Table of Contents

1. [JOIN Queries](#join-queries) - Relation-based queries
2. [Recap/Analytics](#recapanalytics) - Time-based aggregations
3. [Aggregation/Statistics](#aggregationstatistics) - Numeric analytics
4. [Full-Text Search](#full-text-search) - Text search capabilities

---

## JOIN Queries

### Overview

Auto-generates JOIN query methods when foreign key relationships are detected in metadata.

**Detection**: Automatically enabled when columns have `ref_schema`, `ref_table`, `ref_column` in metadata.

### Generated Methods

#### 1. findOneWithRelations(id)

Fetch single record with all related data using JOINs.

**SQL Example**:
```sql
SELECT
  t.*,
  rel_0.id AS business_entity_id_id,
  rel_0.name AS business_entity_id_name
FROM "entity"."entity" AS t
INNER JOIN "entity"."business_entity" AS rel_0 
  ON t.business_entity_id = rel_0.id
WHERE t.id = $1 AND t.deleted_at IS NULL
```

**TypeScript**:
```typescript
const entity = await entityRepository.findOneWithRelations('uuid-here');
// Returns:
// {
//   id: 'uuid-here',
//   name: 'Main Office',
//   business_entity_id: 'be-uuid',
//   business_entity_id_id: 'be-uuid',      // ← Related ID
//   business_entity_id_name: 'PT Example'  // ← Related name
// }
```

#### 2. findAllWithRelations(filters, options)

Fetch multiple records with relations, supports pagination and filtering.

**TypeScript**:
```typescript
const entities = await entityRepository.findAllWithRelations(
  { status: 'active' },
  { limit: 10, offset: 0, sortBy: 'name', sortOrder: 'ASC' }
);
```

### JOIN Type Selection

- **INNER JOIN**: Used when FK column is NOT NULL (required relationship)
- **LEFT JOIN**: Used when FK column is nullable (optional relationship)

### Features

- ✅ Soft-delete filtering (`deleted_at IS NULL`)
- ✅ Pagination support (`limit`, `offset`)
- ✅ Sorting support (`sortBy`, `sortOrder`)
- ✅ Multi-level relations (all FKs in table)
- ✅ Automatic aliasing (`rel_0`, `rel_1`, etc.)

---

## Recap/Analytics

### Overview

Auto-generates time-based analytics methods when timestamp columns are detected.

**Detection**: Automatically enabled when columns like `created_at`, `updated_at`, or any `*_at` timestamp column exist.

**Priority**: `created_at` > `updated_at` > first `*_at` column found

### Generated Methods

#### 1. getDailyRecap(startDate, endDate)

Get daily aggregation within date range.

**TypeScript**:
```typescript
const dailyStats = await entityRepository.getDailyRecap(
  new Date('2025-01-01'),
  new Date('2025-01-31')
);
// Returns: [
//   { date: '2025-01-01', count: 15 },
//   { date: '2025-01-02', count: 23 },
//   ...
// ]
```

**SQL**:
```sql
SELECT
  DATE(created_at) as date,
  COUNT(*) as count
FROM "entity"."entity"
WHERE created_at BETWEEN $1 AND $2
  AND deleted_at IS NULL
GROUP BY DATE(created_at)
ORDER BY date
```

#### 2. getMonthlyRecap(year)

Get monthly counts for specific year.

**TypeScript**:
```typescript
const monthlyStats = await entityRepository.getMonthlyRecap(2025);
// Returns: [
//   { month: 1, count: 150 },
//   { month: 2, count: 178 },
//   ...
// ]
```

#### 3. getYearlyRecap()

Get yearly statistics across all years.

**TypeScript**:
```typescript
const yearlyStats = await entityRepository.getYearlyRecap();
// Returns: [
//   { year: 2023, count: 1250 },
//   { year: 2024, count: 1890 },
//   { year: 2025, count: 450 }
// ]
```

#### 4. getMonthlyBreakdown(year)

Get comprehensive breakdown with all 12 months (even if count is 0).

**TypeScript**:
```typescript
const breakdown = await entityRepository.getMonthlyBreakdown(2025);
// Returns: {
//   year: 2025,
//   months: [
//     { month: 'jan', count: 150 },
//     { month: 'feb', count: 178 },
//     { month: 'mar', count: 0 },     // ← Shows 0 for months with no data
//     ...
//   ],
//   total: 1234
// }
```

### Features

- ✅ PostgreSQL-specific date functions (EXTRACT, DATE)
- ✅ Soft-delete filtering
- ✅ Consistent return types
- ✅ Full 12-month coverage (breakdown method)

---

## Aggregation/Statistics

### Overview

Auto-generates statistical methods when numeric columns are detected.

**Detection**: Automatically enabled for columns with types: `integer`, `bigint`, `smallint`, `decimal`, `numeric`, `real`, `double precision`, `money`.

### Generated Methods

#### 1. getStatistics()

Comprehensive statistics for ALL numeric columns in single query.

**TypeScript**:
```typescript
const stats = await locationRepository.getStatistics();
// Returns: {
//   building_area_count: 150,
//   building_area_sum: 45000,
//   building_area_avg: 300,
//   building_area_min: 50,
//   building_area_max: 1200,
//   surface_area_count: 150,
//   surface_area_sum: 75000,
//   surface_area_avg: 500,
//   surface_area_min: 100,
//   surface_area_max: 2000
// }
```

**SQL**:
```sql
SELECT
  COUNT(building_area) as building_area_count,
  SUM(building_area) as building_area_sum,
  AVG(building_area) as building_area_avg,
  MIN(building_area) as building_area_min,
  MAX(building_area) as building_area_max,
  COUNT(surface_area) as surface_area_count,
  SUM(surface_area) as surface_area_sum,
  AVG(surface_area) as surface_area_avg,
  MIN(surface_area) as surface_area_min,
  MAX(surface_area) as surface_area_max
FROM "entity"."location"
WHERE deleted_at IS NULL
```

#### 2. getAggregation(groupBy, aggregateColumn)

Dynamic GROUP BY aggregation with column validation.

**TypeScript**:
```typescript
const grouped = await locationRepository.getAggregation(
  'location_type_id',   // Group by type
  'building_area'       // Aggregate this column
);
// Returns: [
//   {
//     group: 'office-uuid',
//     count: 45,
//     sum: 13500,
//     avg: 300,
//     min: 100,
//     max: 800
//   },
//   {
//     group: 'warehouse-uuid',
//     count: 23,
//     sum: 46000,
//     avg: 2000,
//     min: 500,
//     max: 5000
//   }
// ]
```

**Features**:
- ✅ Column validation (prevents SQL injection)
- ✅ Validates groupBy is categorical (varchar, text, uuid)
- ✅ Validates aggregateColumn is numeric
- ✅ Filters NULL values in GROUP BY column
- ✅ Ordered by count DESC

#### 3. Individual Column Methods

For each numeric column, generates 3 methods:

**getSum{Column}()** - Sum total:
```typescript
const total = await locationRepository.getSumBuildingArea();
// Returns: 45000
```

**getAvg{Column}()** - Average value:
```typescript
const average = await locationRepository.getAvgBuildingArea();
// Returns: 300
```

**getMinMax{Column}()** - Min and max values:
```typescript
const range = await locationRepository.getMinMaxBuildingArea();
// Returns: { min: 50, max: 1200 }
```

### Features

- ✅ COALESCE for NULL safety
- ✅ Type conversion (parseInt, parseFloat)
- ✅ Soft-delete filtering
- ✅ PascalCase method naming (e.g., `getSumBuildingArea`)

---

## Full-Text Search

### Overview

Auto-generates search methods when text columns are detected.

**Detection**: Automatically enabled for columns with types: `varchar`, `text`, `char`, `character varying`, `character`.

### Generated Methods

#### 1. search(query, options)

Multi-column full-text search across ALL text fields.

**TypeScript**:
```typescript
const results = await entityRepository.search(
  'Jakarta',
  { limit: 10, offset: 0 }
);
```

**SQL**:
```sql
SELECT *
FROM "entity"."entity"
WHERE (
  code::text ILIKE $1 OR
  name::text ILIKE $2 OR
  brand::text ILIKE $3 OR
  address::text ILIKE $4 OR
  email::text ILIKE $5
  -- ... all text columns
)
AND deleted_at IS NULL
ORDER BY id
LIMIT $N OFFSET $M
```

**Features**:
- Searches ALL text columns simultaneously
- Case-insensitive (ILIKE)
- Wildcard support (`%Jakarta%` pattern)
- Pagination support

#### 2. searchByColumn(column, query, options)

Search specific column with validation.

**TypeScript**:
```typescript
const results = await entityRepository.searchByColumn(
  'email',
  'example.com',
  { limit: 20 }
);
```

**Features**:
- ✅ Column validation (whitelist)
- ✅ Error throwing for invalid columns
- ✅ Pagination support
- ✅ Same ILIKE pattern matching

#### 3. searchCount(query)

Count total search results (for pagination metadata).

**TypeScript**:
```typescript
const total = await entityRepository.searchCount('Jakarta');
// Returns: 45

// Use for pagination:
const page = 1;
const limit = 10;
const results = await entityRepository.search('Jakarta', {
  limit,
  offset: (page - 1) * limit
});
const total = await entityRepository.searchCount('Jakarta');
const totalPages = Math.ceil(total / limit);
```

#### 4. fuzzySearch(query, threshold, options)

PostgreSQL trigram similarity search (requires `pg_trgm` extension).

**TypeScript**:
```typescript
const results = await entityRepository.fuzzySearch(
  'Jakarata',  // Typo!
  0.3,         // 30% similarity threshold
  { limit: 10 }
);
// Returns: [
//   {
//     id: 'uuid',
//     name: 'Jakarta Office',
//     similarity: 0.75  // ← Similarity score
//   },
//   ...
// ]
```

**Requirements**:
```sql
-- Enable extension (run once)
CREATE EXTENSION IF NOT EXISTS pg_trgm;
```

**Features**:
- ✅ Typo-tolerant search
- ✅ Similarity scoring (0.0-1.0)
- ✅ Configurable threshold
- ✅ Ordered by relevance

#### 5. searchBy{Column}() - Important Column Shortcuts

Auto-generated for columns containing: `name`, `title`, `description`, `email`

**TypeScript**:
```typescript
// Auto-generated if 'name' column exists
const byName = await entityRepository.searchByName('Office');

// Auto-generated if 'email' column exists
const byEmail = await entityRepository.searchByEmail('@example.com');
```

**Features**:
- Limit 50 results
- Ordered by searched column
- No pagination (use searchByColumn for that)

### Search Best Practices

1. **Use search() for general queries**: Searches all fields
2. **Use searchByColumn() for specific fields**: Better performance
3. **Use searchCount() for pagination**: Calculate total pages
4. **Use fuzzySearch() for typo tolerance**: Better UX
5. **Install pg_trgm**: Required for fuzzy search

**SQL Injection Safety**:
- ✅ All queries use parametrized statements
- ✅ Column names validated against whitelist
- ✅ No dynamic SQL concatenation

---

## Common Patterns

### Pagination with Search

```typescript
async function paginatedSearch(query: string, page: number = 1) {
  const limit = 10;
  const offset = (page - 1) * limit;
  
  const [results, total] = await Promise.all([
    entityRepository.search(query, { limit, offset }),
    entityRepository.searchCount(query)
  ]);
  
  return {
    data: results,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
}
```

### Analytics Dashboard

```typescript
async function getDashboardStats(year: number) {
  const [monthlyData, breakdown, numericStats] = await Promise.all([
    entityRepository.getMonthlyRecap(year),
    entityRepository.getMonthlyBreakdown(year),
    locationRepository.getStatistics()
  ]);
  
  return {
    timeline: monthlyData,
    breakdown,
    aggregations: numericStats
  };
}
```

### Related Data with Search

```typescript
async function searchWithRelations(query: string) {
  const results = await entityRepository.search(query, { limit: 50 });
  
  // Get full related data for results
  const enriched = await Promise.all(
    results.map(r => entityRepository.findOneWithRelations(r.id))
  );
  
  return enriched;
}
```

---

## Performance Considerations

### Indexing

Create indexes for frequently searched/aggregated columns:

```sql
-- Text search
CREATE INDEX idx_entity_name ON entity.entity USING gin(name gin_trgm_ops);
CREATE INDEX idx_entity_email ON entity.entity (email);

-- Aggregation
CREATE INDEX idx_location_building_area ON entity.location (building_area);
CREATE INDEX idx_location_type_area ON entity.location (location_type_id, building_area);

-- Time-based queries
CREATE INDEX idx_entity_created_at ON entity.entity (created_at);
CREATE INDEX idx_entity_created_year ON entity.entity (EXTRACT(YEAR FROM created_at));

-- JOINs
CREATE INDEX idx_entity_business_entity_id ON entity.entity (business_entity_id);
```

### Query Optimization

1. **Use searchByColumn()** instead of search() when possible
2. **Limit result sets** - Always use pagination
3. **Cache aggregation results** - Statistics change slowly
4. **Use JOIN methods sparingly** - Fetch relations only when needed

---

## Database Requirements

### PostgreSQL Extensions

```sql
-- For fuzzy search
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Check if installed
SELECT * FROM pg_extension WHERE extname = 'pg_trgm';
```

### Metadata Requirements

**For JOIN Queries**:
```sql
-- Columns must have FK metadata
UPDATE meta.column
SET 
  ref_schema = 'entity',
  ref_table = 'business_entity',
  ref_column = 'id'
WHERE table_name = 'entity' 
  AND column_name = 'business_entity_id';
```

**For Recap/Analytics**:
- At least one timestamp column (`*_at`)
- Preferably `created_at` or `updated_at`

**For Aggregation**:
- At least one numeric column (integer, bigint, decimal, etc.)

**For Search**:
- At least one text column (varchar, text, char)

---

## Troubleshooting

### "No JOIN methods generated"
- Check foreign key metadata (`ref_schema`, `ref_table`, `ref_column`)
- Verify columns have FK constraints in database
- Run: `SELECT * FROM meta.column WHERE ref_table IS NOT NULL`

### "No search methods generated"
- Verify text columns exist
- Check data types: `SELECT column_name, data_type FROM information_schema.columns WHERE data_type LIKE '%char%'`

### "fuzzySearch() throws error"
- Install pg_trgm: `CREATE EXTENSION pg_trgm;`
- Check extension: `SELECT * FROM pg_extension WHERE extname = 'pg_trgm';`

### "getAggregation() throws 'Invalid column'"
- Check column name spelling
- Verify column is in valid lists (printed in error message)
- Ensure groupBy column is categorical (varchar/text/uuid)
- Ensure aggregateColumn is numeric

---

## See Also

- [FEATURES.md](./FEATURES.md) - Complete feature matrix
- [BEST_PRACTICES.md](./BEST_PRACTICES.md) - Production patterns
- [DATABASE.md](./DATABASE.md) - Database configuration
- [QUICKSTART.md](./QUICKSTART.md) - Quick tutorial

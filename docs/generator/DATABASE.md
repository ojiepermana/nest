# Database Compatibility Matrix

This document outlines the minimum database versions required for `@ojiepermana/nest-generator` and the features that depend on specific database versions.

## Minimum Requirements

### PostgreSQL

**Minimum Version: 18.0**

PostgreSQL 18+ is required for optimal functionality. While the library may work with older versions, some features will not be available or may have degraded performance.

#### PostgreSQL 18+ Features

| Feature               | Description                                   | Fallback for Older Versions                |
| --------------------- | --------------------------------------------- | ------------------------------------------ |
| **UUID v7**           | Time-ordered UUIDs using `uuid_generate_v7()` | Custom PL/pgSQL function provided in setup |
| **JSONB Performance** | Enhanced JSONB indexing and operations        | Works but slower on older versions         |
| **Parallel Queries**  | Better parallel query execution               | Limited parallelization                    |

#### Required Extensions

The library automatically creates necessary functions during initialization:

```sql
-- UUID v7 function (automatically created)
CREATE OR REPLACE FUNCTION meta.uuid_generate_v7()
RETURNS uuid AS $$
-- Implementation provided in setup
$$;
```

### MySQL

**Minimum Version: 8.0**

MySQL 8.0+ is **strictly required**. The library will not function correctly with MySQL 5.7 or earlier.

#### MySQL 8.0+ Features

| Feature                 | Description                                           | Why Required                           |
| ----------------------- | ----------------------------------------------------- | -------------------------------------- |
| **JSON Functions**      | `JSON_EXTRACT()`, `JSON_CONTAINS()`, `JSON_UNQUOTE()` | Used for metadata storage and queries  |
| **Window Functions**    | `ROW_NUMBER()`, `RANK()`, `DENSE_RANK()`              | Used in advanced queries and reporting |
| **CTEs**                | Common Table Expressions with `WITH` clause           | Used for complex query generation      |
| **UUID()**              | Native UUID generation                                | Used for primary keys                  |
| **Default Expressions** | Complex default values                                | Used in generated schemas              |

## Version Detection

The library automatically detects and validates database versions during initialization:

```typescript
// Automatic validation during init
nest-generator init
// Output:
// ✓ Database version 18.1 meets minimum requirements (18.0.0+)
```

If an incompatible version is detected, you'll see:

```
⚠️  Database version does not meet minimum requirements!
   Current: PostgreSQL 16.2
   Minimum: 18.0.0
   Some features may not work correctly:
     - UUID v7 requires PostgreSQL 18+ or custom function
     - Performance optimizations for JSONB
? Continue with incompatible database version? (y/N)
```

## Feature Compatibility

### Core CRUD Operations

| Operation     | PostgreSQL | MySQL |
| ------------- | ---------- | ----- |
| Create        | 18+        | 8.0+  |
| Read (Single) | 18+        | 8.0+  |
| Read (List)   | 18+        | 8.0+  |
| Update        | 18+        | 8.0+  |
| Delete (Soft) | 18+        | 8.0+  |
| Delete (Hard) | 18+        | 8.0+  |

### Advanced Queries

| Feature              | PostgreSQL | MySQL | Notes                               |
| -------------------- | ---------- | ----- | ----------------------------------- |
| **Filtering**        | 18+        | 8.0+  | Uses parameterized queries          |
| **Pagination**       | 18+        | 8.0+  | `LIMIT/OFFSET` support              |
| **Sorting**          | 18+        | 8.0+  | Multi-column sorting                |
| **JOINs**            | 18+        | 8.0+  | Auto-detected from foreign keys     |
| **Aggregations**     | 18+        | 8.0+  | `COUNT`, `SUM`, `AVG`, `MIN`, `MAX` |
| **Window Functions** | 18+        | 8.0+  | For ranking and analytics           |
| **CTEs**             | 18+        | 8.0+  | Complex query optimization          |
| **Recap Queries**    | 18+        | 8.0+  | Monthly/yearly aggregations         |

### Data Types

#### PostgreSQL

| Generic Type | PostgreSQL Type | Minimum Version                           |
| ------------ | --------------- | ----------------------------------------- |
| UUID         | `UUID`          | 18+                                       |
| JSON         | `JSONB`         | 18+ (works on 9.4+ but optimized for 18+) |
| Array        | Native arrays   | 18+                                       |
| Text         | `TEXT`          | 18+                                       |
| Timestamp    | `TIMESTAMP`     | 18+                                       |

#### MySQL

| Generic Type | MySQL Type   | Minimum Version |
| ------------ | ------------ | --------------- |
| UUID         | `CHAR(36)`   | 8.0+            |
| JSON         | `JSON`       | 8.0+ (required) |
| Array        | `JSON` array | 8.0+            |
| Text         | `TEXT`       | 8.0+            |
| Timestamp    | `DATETIME`   | 8.0+            |

### Generated Features

| Feature            | PostgreSQL | MySQL | Notes                            |
| ------------------ | ---------- | ----- | -------------------------------- |
| **Audit Trail**    | 18+        | 8.0+  | Requires JSONB/JSON support      |
| **RBAC**           | 18+        | 8.0+  | Uses metadata tables             |
| **File Upload**    | 18+        | 8.0+  | Metadata storage only            |
| **Export (CSV)**   | 18+        | 8.0+  | No special requirements          |
| **Export (Excel)** | 18+        | 8.0+  | No special requirements          |
| **Caching**        | 18+        | 8.0+  | Redis-based, DB-agnostic         |
| **Rate Limiting**  | 18+        | 8.0+  | Application-level                |
| **Search**         | 18+        | 8.0+  | External (Elasticsearch/Algolia) |

## Upgrade Recommendations

### From PostgreSQL < 18

1. **Backup your database**

   ```bash
   pg_dump mydb > backup.sql
   ```

2. **Upgrade PostgreSQL**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install postgresql-18

   # macOS (Homebrew)
   brew install postgresql@18
   ```

3. **Restore and migrate**
   ```bash
   psql -d mydb -f backup.sql
   ```

### From MySQL < 8.0

1. **Backup your database**

   ```bash
   mysqldump -u root -p mydb > backup.sql
   ```

2. **Upgrade MySQL**

   ```bash
   # Ubuntu/Debian
   sudo apt-get install mysql-server-8.0

   # macOS (Homebrew)
   brew install mysql@8.0
   ```

3. **Run upgrade process**

   ```bash
   mysql_upgrade -u root -p
   ```

4. **Restore data**
   ```bash
   mysql -u root -p mydb < backup.sql
   ```

## Testing Compatibility

You can manually test database compatibility:

```typescript
import { DatabaseConnectionManager } from '@ojiepermana/nest-generator';

const manager = new DatabaseConnectionManager({
  type: 'postgresql',
  host: 'localhost',
  port: 5432,
  database: 'mydb',
  username: 'user',
  password: 'pass',
});

await manager.connect();
const validation = await manager.validateDatabaseVersion();

console.log(validation);
// {
//   valid: true,
//   version: '18.1',
//   minimumVersion: '18.0.0',
//   warnings: []
// }
```

## Version-Specific Code

The library includes database-specific dialects to handle differences:

```typescript
// PostgreSQL dialect
class PostgresDialect {
  generateUUID() {
    return 'uuid_generate_v7()'; // PostgreSQL 18+
  }

  jsonExtract(column, path) {
    return `${column}->>'${path}'`; // JSONB operator
  }
}

// MySQL dialect
class MySQLDialect {
  generateUUID() {
    return 'UUID()'; // MySQL 8.0+
  }

  jsonExtract(column, path) {
    return `JSON_UNQUOTE(JSON_EXTRACT(${column}, '$.${path}'))`; // MySQL 8.0+
  }
}
```

## Troubleshooting

### PostgreSQL Issues

**Issue: "function uuid_generate_v7() does not exist"**

Solution: The library creates this function automatically during `nest-generator init`. If you skipped init, run it now:

```bash
nest-generator init
```

**Issue: "permission denied for schema meta"**

Solution: Grant necessary permissions:

```sql
GRANT ALL ON SCHEMA meta TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA meta TO your_user;
```

### MySQL Issues

**Issue: "You have an error in your SQL syntax near 'JSON_EXTRACT'"**

Solution: Your MySQL version is too old. Upgrade to MySQL 8.0+.

**Issue: "This version of MySQL doesn't yet support 'WITH clause'"**

Solution: CTEs require MySQL 8.0+. Upgrade your database.

## Cloud Database Providers

### AWS RDS

- **PostgreSQL**: Use version 18 or higher
- **MySQL**: Use version 8.0 or higher
- Both versions are available in RDS

### Google Cloud SQL

- **PostgreSQL**: Use version 18 or higher
- **MySQL**: Use version 8.0 or higher
- Both versions are supported

### Azure Database

- **PostgreSQL**: Use Flexible Server with version 18
- **MySQL**: Use version 8.0
- Single Server is deprecated, use Flexible Server

### DigitalOcean

- **PostgreSQL**: Version 18 available in managed databases
- **MySQL**: Version 8.0 available in managed databases

## Migration Notes

When upgrading an existing project:

1. **Version Check**: Run `nest-generator init` to verify database compatibility
2. **Test Locally**: Test all generated modules with the new database version
3. **Update Dependencies**: Ensure `pg` or `mysql2` drivers are up-to-date
4. **Regenerate Code**: Regenerate modules to take advantage of new features

## Support

For version-specific issues:

1. Check this compatibility matrix
2. Verify your database version: `SELECT version();` (PostgreSQL) or `SELECT VERSION();` (MySQL)
3. Review the [GitHub Issues](https://github.com/ojiepermana/nest/issues)
4. Contact support with your database version and error logs

# Schema-Based Directory Structure

## Overview

The NestJS Generator now uses a **schema-based directory structure** where all tables from the same database schema are grouped together in one folder with one shared module. This provides better organization, reduces module proliferation, and logically groups related entities.

## Structure

```
src/
└── {schema}/                          # Schema name (e.g., 'entity', 'auth', 'billing')
    ├── controllers/
    │   ├── {table1}.controller.ts
    │   ├── {table2}.controller.ts
    │   └── {table3}.controller.ts
    ├── entities/
    │   ├── {table1}.entity.ts
    │   ├── {table2}.entity.ts
    │   └── {table3}.entity.ts
    ├── dto/
    │   ├── {table1}/
    │   │   ├── create-{table1}.dto.ts
    │   │   ├── update-{table1}.dto.ts
    │   │   └── {table1}-filter.dto.ts
    │   ├── {table2}/
    │   └── {table3}/
    ├── repositories/
    │   ├── {table1}.repository.ts
    │   ├── {table2}.repository.ts
    │   └── {table3}.repository.ts
    ├── services/
    │   ├── {table1}.service.ts
    │   ├── {table2}.service.ts
    │   └── {table3}.service.ts
    ├── {schema}.module.ts             # ONE module for ALL tables in this schema
    └── index.ts                       # Barrel exports
```

## Module Aggregation

**One module per schema** - automatically aggregates all tables:

```typescript
// entity.module.ts
import { Module } from '@nestjs/common';
import { LocationController } from './controllers/location.controller';
import { LocationService } from './services/location.service';
import { LocationRepository } from './repositories/location.repository';
import { BusinessEntityController } from './controllers/business-entity.controller';
import { BusinessEntityService } from './services/business-entity.service';
import { BusinessEntityRepository } from './repositories/business-entity.repository';

@Module({
  controllers: [LocationController, BusinessEntityController],
  providers: [LocationService, LocationRepository, BusinessEntityService, BusinessEntityRepository],
  exports: [LocationService, LocationRepository, BusinessEntityService, BusinessEntityRepository],
})
export class EntityModule {}
```

### Incremental Updates

When you generate a **second table** in the same schema:

```bash
# First table
npx nest-generator generate entity.location --app=user
# ✓ Created new entity.module.ts

# Second table
npx nest-generator generate entity.business_entity --app=user
# ✓ Added business-entity to existing entity.module.ts
```

The module is automatically updated:

- ✅ Imports added for new controller, service, repository
- ✅ Controller added to `controllers` array
- ✅ Service and Repository added to `providers` array
- ✅ Service and Repository added to `exports` array

## All Architectures Supported

### Microservices

**Service:**

```
apps/microservices/user/src/entity/
├── controllers/
├── entities/
├── dto/
├── repositories/
├── services/
├── entity.module.ts
└── index.ts
```

**Gateway:**

```
apps/microservices/gateway/src/entity/
├── controllers/
├── dto/
├── entity.module.ts
└── index.ts
```

**Contracts (shared between service and gateway):**

```
libs/contracts/
├── entity/                            # Schema-based organization
│   ├── dto/
│   │   ├── location/
│   │   │   ├── create-location.dto.ts
│   │   │   ├── update-location.dto.ts
│   │   │   └── location-filter.dto.ts
│   │   └── business-entity/
│   │       ├── create-business-entity.dto.ts
│   │       ├── update-business-entity.dto.ts
│   │       └── business-entity-filter.dto.ts
│   ├── interfaces/
│   └── index.ts                      # Barrel exports all DTOs
├── auth/                              # Different schema
│   ├── dto/
│   └── index.ts
└── billing/
    ├── dto/
    └── index.ts
```

**Import from contracts:**

```typescript
// Service imports from schema-based contracts
import { LocationDto, BusinessEntityDto } from '@app/contracts/entity';

// Gateway imports with Swagger decorators
import { CreateLocationDto, UpdateLocationDto } from '@app/contracts/entity';
```

### Standalone

```
apps/standalone/src/entity/
├── controllers/
├── entities/
├── dto/
├── repositories/
├── services/
├── entity.module.ts
└── index.ts
```

### Monorepo

```
apps/monorepo/user/src/entity/
├── controllers/
├── entities/
├── dto/
├── repositories/
├── services/
├── entity.module.ts
└── index.ts
```

## Benefits

### 1. **Logical Grouping**

Related tables from the same schema are co-located:

- `entity.location` and `entity.business_entity` → both in `src/entity/`
- `auth.users` and `auth.roles` → both in `src/auth/`

### 2. **Reduced Module Proliferation**

- **Before:** 10 tables = 10 modules
- **After:** 10 tables across 3 schemas = 3 modules

### 3. **Easier Navigation**

Find all entity-related code in one place instead of scattered across folders.

### 4. **Better Organization**

Follows database schema organization:

- Financial tables → `src/billing/`
- User management → `src/auth/`
- Business logic → `src/entity/`

### 5. **Clean Imports**

```typescript
// Import from schema-level barrel
import { LocationService, BusinessEntityService } from './entity';

// Import contracts by schema
import { LocationDto, BusinessEntityDto } from '@app/contracts/entity';
```

### 6. **Schema-Based Contracts** (Microservices)

Contracts are also organized by schema, eliminating redundancy:

- **Before:** `libs/contracts/location/`, `libs/contracts/business-entity/`
- **After:** `libs/contracts/entity/` (contains both)

Benefits:

- Single import path per schema: `@app/contracts/entity`
- Logical grouping of related DTOs
- Easier to manage shared contracts
- Consistent with service/gateway structure

## Contracts Structure (Microservices)

For microservices architecture, contracts are **schema-based** to match the service structure:

```
libs/contracts/
├── entity/                            # Schema name
│   ├── dto/
│   │   ├── location/                  # Table name
│   │   │   ├── create-location.dto.ts
│   │   │   ├── update-location.dto.ts
│   │   │   └── location-filter.dto.ts
│   │   ├── business-entity/
│   │   │   ├── create-business-entity.dto.ts
│   │   │   ├── update-business-entity.dto.ts
│   │   │   └── business-entity-filter.dto.ts
│   │   └── category/
│   │       └── ...
│   ├── interfaces/
│   └── index.ts                       # Exports all entity schema DTOs
├── auth/
│   ├── dto/
│   │   ├── users/
│   │   └── roles/
│   └── index.ts
└── billing/
    ├── dto/
    │   ├── invoices/
    │   └── payments/
    └── index.ts
```

**Usage in Service:**

```typescript
// apps/microservices/user/src/entity/dto/location/create-location.dto.ts
import { LocationDto as CreateLocationDto } from '@app/contracts/entity';

export class CreateLocationInternalDto extends CreateLocationDto {
  // Add service-specific validations
}
```

**Usage in Gateway:**

```typescript
// apps/microservices/gateway/src/entity/dto/location/create-location.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CreateLocationDto } from '@app/contracts/entity';

export class CreateLocationRequestDto extends CreateLocationDto {
  // Add Swagger decorators for API docs
}
```

**Benefits:**

- ✅ One import path per schema: `@app/contracts/entity`
- ✅ No DTO duplication between service and gateway
- ✅ Schema-aligned organization
- ✅ Easy to extend with service/gateway-specific logic

## Examples

### Generate Multiple Tables

```bash
# Generate tables from 'entity' schema
npx nest-generator generate entity.location --app=user
npx nest-generator generate entity.business_entity --app=user
npx nest-generator generate entity.category --app=user

# All three go into src/entity/ with ONE module
```

**Result:**

```
src/entity/
├── controllers/
│   ├── location.controller.ts
│   ├── business-entity.controller.ts
│   └── category.controller.ts
├── entities/
│   ├── location.entity.ts
│   ├── business-entity.entity.ts
│   └── category.entity.ts
├── entity.module.ts  ← 3 controllers, 6 providers
└── ...
```

### Different Schemas

```bash
# Generate from different schemas
npx nest-generator generate entity.location --app=user
npx nest-generator generate auth.users --app=user
npx nest-generator generate billing.invoices --app=user
```

**Result:**

```
src/
├── entity/
│   ├── controllers/location.controller.ts
│   ├── entity.module.ts
│   └── ...
├── auth/
│   ├── controllers/users.controller.ts
│   ├── auth.module.ts
│   └── ...
└── billing/
    ├── controllers/invoices.controller.ts
    ├── billing.module.ts
    └── ...
```

## Migration from Old Structure

If you have existing per-table modules, the generator will work alongside them. New generations use the schema-based structure.

To migrate:

1. Remove old modules: `rm -rf src/{table1,table2,table3}`
2. Regenerate with new structure: `npx nest-generator generate schema.table`

## Technical Details

### How It Works

1. **First table in schema:**
   - Creates `src/{schema}/` directory
   - Generates all subdirectories (controllers/, entities/, dto/, etc.)
   - Creates `{schema}.module.ts` with first table's components

2. **Subsequent tables:**
   - Detects existing `{schema}.module.ts`
   - Adds imports for new components
   - Updates `controllers`, `providers`, and `exports` arrays
   - Updates barrel export `index.ts`

### Implementation

Located in: `libs/generator/src/cli/commands/generate.command.ts`

**Key methods:**

- `generateOrUpdateSchemaModule()` - Creates or updates module
- `generateSchemaModuleCode()` - Initial module template
- `generateOrUpdateSchemaIndex()` - Barrel exports

**Array update logic:**

```typescript
// Check if controller already in array (not just in file)
const controllersMatch = moduleContent.match(/controllers:\s*\[([\s\S]*?)\]/);
if (controllersMatch && !controllersMatch[1].includes(`${pascalTable}Controller`)) {
  // Add to array
  moduleContent = moduleContent.replace(
    /controllers:\s*\[([\s\S]*?)\]/,
    (match, p1) => `controllers: [${p1.trim()}, ${pascalTable}Controller]`,
  );
}
```

## Testing

All architectures tested and verified:

```bash
# Microservices
npx nest-generator generate entity.location --app=user
npx nest-generator generate entity.business_entity --app=user
✅ Both in apps/microservices/user/src/entity/
✅ Both in apps/microservices/gateway/src/entity/

# Standalone
cd apps/standalone
npx nest-generator generate entity.location
npx nest-generator generate entity.business_entity
✅ Both in src/entity/

# Monorepo
cd apps/monorepo/user
npx nest-generator generate entity.location
npx nest-generator generate entity.business_entity
✅ Both in src/entity/
```

**Build verification:**

```bash
npm run build
# ✅ webpack 5.100.2 compiled successfully
```

**Test suite:**

```bash
npm test
# ✅ Test Suites: 39 passed
# ✅ Tests: 710 passed
```

## See Also

- [Recommended Schemas](./RECOMMENDED_SCHEMAS.md) - Best practices for schema organization
- [Microservices Guide](./quickstart/MICROSERVICES_QUICKSTART.md) - Using with microservices
- [Features Guide](./FEATURES.md) - All available features

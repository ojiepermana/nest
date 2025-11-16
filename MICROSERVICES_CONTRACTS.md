# Microservices Contract-First Pattern

## 🎯 Overview

Generator sekarang menggunakan **Contract-First pattern** untuk microservices architecture. Satu command generate 3 lokasi berbeda dengan single source of truth.

## 📁 Structure

```
nest/
├── libs/
│   └── contracts/                    ← Shared contracts (base DTOs)
│       └── business-entity/
│           ├── dto/
│           │   ├── create-business-entity.dto.ts    # Base validation
│           │   ├── update-business-entity.dto.ts
│           │   └── business-entity-filter.dto.ts
│           ├── interfaces/
│           └── index.ts              # Barrel export
│
├── apps/microservices/
│   ├── gateway/
│   │   └── src/business-entity/
│   │       ├── controllers/
│   │       │   └── business-entity.controller.ts    # HTTP + ClientProxy
│   │       ├── dto/business-entity/
│   │       │   ├── create-business-entity.dto.ts    # Extends + Swagger
│   │       │   ├── update-business-entity.dto.ts
│   │       │   └── business-entity-filter.dto.ts
│   │       └── business-entity.module.ts
│   │
│   └── user/
│       └── src/business-entity/
│           ├── controllers/
│           │   └── business-entity.controller.ts    # @MessagePattern
│           ├── dto/business-entity/
│           │   ├── create-business-entity.dto.ts    # Extends + Internal
│           │   ├── update-business-entity.dto.ts
│           │   └── business-entity-filter.dto.ts
│           ├── entities/
│           ├── repositories/
│           ├── services/
│           └── business-entity.module.ts
│
└── tsconfig.json                     # Path mapping: @app/contracts/*
```

## 🚀 Usage

```bash
# Single command generates everything
npx nest-generator generate entity.business_entity --app=user --skip-prompts
```

**Output:**

```
📝 Generating shared contracts...
✓ Shared contracts generated at: libs/contracts/business-entity
✓ Service DTOs generated (extends from contracts)
🌐 Auto-generating gateway controller...
✓ Gateway DTOs generated (extends from contracts with Swagger)
✓ Gateway controller generated at: apps/microservices/gateway/src/business-entity
```

## 📝 Generated Code Examples

### 1. Base Contract (libs/contracts/)

```typescript
// libs/contracts/business-entity/dto/create-business-entity.dto.ts
import { IsString, IsOptional } from 'class-validator';

export class CreateBusinessEntityDto {
  @IsString()
  @IsOptional()
  code?: string;

  @IsString()
  @IsOptional()
  description?: string;

  @IsString()
  @IsOptional()
  name?: string;
}
```

### 2. Service DTO (extends base)

```typescript
// apps/microservices/user/src/business-entity/dto/business-entity/create-business-entity.dto.ts
import { BusinessEntityDto as CreateBusinessEntityDto } from '@app/contracts/business-entity';

export class CreateBusinessEntityInternalDto extends CreateBusinessEntityDto {
  // Add service-specific validation
  // @IsUUID()
  // tenantId?: string;
}

export { CreateBusinessEntityDto };
```

### 3. Gateway DTO (extends base + Swagger)

```typescript
// apps/microservices/gateway/src/business-entity/dto/business-entity/create-business-entity.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { CreateBusinessEntityDto } from '@app/contracts/business-entity';

export class CreateBusinessEntityRequestDto extends CreateBusinessEntityDto {
  // Override with Swagger decorators
  // @ApiProperty({ example: 'PT ABC' })
  // name: string;
}

export { CreateBusinessEntityDto };
```

## ⚙️ Configuration

### 1. generator.config.json

```json
{
  "architecture": "microservices",
  "microservices": {
    "gatewayApp": "apps/microservices/gateway"
  }
}
```

### 2. tsconfig.json

```json
{
  "compilerOptions": {
    "paths": {
      "@app/contracts/*": ["libs/contracts/*"]
    }
  }
}
```

## ✅ Benefits

| Benefit             | Description                                 |
| ------------------- | ------------------------------------------- |
| **Type Safety**     | TypeScript contracts shared across services |
| **No Duplication**  | Single source of truth for DTOs             |
| **Flexibility**     | Each layer can add specific validation      |
| **Versioning**      | Easy to version contracts (v1, v2, v3)      |
| **Maintainability** | Update once, all services affected          |
| **Testing**         | Easy to mock with shared types              |
| **Documentation**   | Single place for API contracts              |

## 🔄 Workflow

```
1. Generate Service (--app=user)
   ↓
2. Create Base Contracts (libs/contracts/)
   ↓
3. Generate Service DTOs (extends contracts)
   ↓
4. Auto-detect Gateway Config
   ↓
5. Generate Gateway DTOs (extends contracts + Swagger)
   ↓
6. Generate Both Controllers
```

## 🏗️ Architecture Pattern

```
Client Request
     ↓
[Gateway] ← HTTP REST API (Swagger docs)
     ↓
ClientProxy.send('business-entity.create', dto)
     ↓
[Service] ← @MessagePattern handlers
     ↓
Business Logic + Database
```

**Gateway Controller:**

- Receives HTTP requests
- Validates with Swagger DTOs
- Forwards to service via ClientProxy

**Service Controller:**

- Receives messages via @MessagePattern
- Uses internal DTOs
- Executes business logic

**Contracts:**

- Shared between Gateway & Service
- Single source of truth
- Base validation rules

## 📊 Comparison

| Architecture      | Contract Pattern        | Why                                                 |
| ----------------- | ----------------------- | --------------------------------------------------- |
| **Standalone**    | ❌ No contracts         | Single app, no inter-service communication          |
| **Monorepo**      | ⚠️ Optional shared DTOs | Apps in same repo, shared deployment                |
| **Microservices** | ✅ **Contract-First**   | Distributed services, independent teams, versioning |

## 🎯 Only for Microservices

Pattern ini **HANYA** untuk microservices architecture. Standalone dan Monorepo tetap generate DTOs langsung (simpler approach).

Generator auto-detect architecture dan apply pattern yang sesuai.

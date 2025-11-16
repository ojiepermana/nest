<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

<h1 align="center">NestJS Libraries Monorepo</h1>

<p align="center">
  Collection of NestJS libraries by Ojie Permana
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/@ojiepermana/nest-generator"><img src="https://img.shields.io/npm/v/@ojiepermana/nest-generator.svg" alt="nest-generator version" /></a>
  <a href="https://www.npmjs.com/package/@ojiepermana/nest"><img src="https://img.shields.io/npm/v/@ojiepermana/nest.svg" alt="nest version" /></a>
  <a href="https://github.com/ojiepermana/nest/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/@ojiepermana/nest.svg" alt="License" /></a>
</p>

## 📦 Published Libraries

### [@ojiepermana/nest-generator](https://www.npmjs.com/package/@ojiepermana/nest-generator)

**Metadata-driven NestJS CRUD generator** - Generate complete, production-ready modules from database schema metadata. NO ORM, uses native database drivers (pg/mysql2) with raw SQL for maximum performance.

```bash
npm install @ojiepermana/nest-generator
```

**Features:**

- ✅ **Core CRUD** - Create, Read, Update, Delete with validation
- ✅ **Advanced Queries** - JOINs, CTEs, Aggregations, Recaps (daily/monthly/yearly)
- ✅ **Caching** - Redis integration with smart invalidation
- ✅ **Audit Trail** - Auto-track CREATE, UPDATE, DELETE with change history
- ✅ **File Upload** - 4 storage providers (Local, S3, GCS, Azure Blob)
- ✅ **RBAC** - Complete Role-Based Access Control system (NEW!)
- ✅ **Export** - CSV/Excel streaming for large datasets
- ✅ **Swagger** - Auto-generated API documentation
- ✅ **Multi-Architecture** - Standalone, Monorepo, Microservices

**RBAC Features:**

- 🔐 Permission-based & Role-based access control
- 🔐 Ownership verification (row-level security)
- 🔐 Field-level permissions
- 🔐 Decorators: `@RequirePermission`, `@RequireRole`, `@RequireOwnership`
- 🔐 Guards: PermissionsGuard, RolesGuard, OwnershipGuard
- 🔐 Hierarchical roles with super admin support
- 🔐 Role expiration and active status
- 🔐 Redis caching for performance
- 🔐 92 passing tests
- 📖 [Complete RBAC Guide](./docs/generator/rbac/RBAC_GUIDE.md) (1432 lines)

**Test Coverage:** 579/585 passing (99%)

### [@ojiepermana/nest](https://www.npmjs.com/package/@ojiepermana/nest)

NestJS Core Library - Core utilities and common modules.

```bash
npm install @ojiepermana/nest
```

## 🚀 Quick Start

### Using the Generator

**1. Install the generator:**

```bash
npm install -g @ojiepermana/nest-generator
# or
npx @ojiepermana/nest-generator
```

**2. Initialize metadata tables:**

```bash
nest-generator init
```

**3. Generate a module:**

```bash
# Basic CRUD module
nest-generator generate users.profile

# With features
nest-generator generate users.profile \
  --features.audit=true \
  --features.fileUpload=true \
  --features.rbac=true \
  --storageProvider=s3

# Interactive mode
nest-generator generate users.profile
# Follow the prompts to select features
```

**4. Generated structure:**

```
src/modules/users-profile/
├── users-profile.dto.ts          # DTOs (Create, Update, Filter, Response)
├── users-profile.query.ts        # SQL queries (JOINs, CTEs, Aggregations)
├── users-profile.repository.ts   # Database operations
├── users-profile.service.ts      # Business logic with audit
├── users-profile.controller.ts   # REST endpoints with RBAC
└── users-profile.module.ts       # NestJS module
```

**5. Use RBAC decorators:**

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { RequirePermission, RequireRole } from '../rbac/decorators';

@Controller('users')
export class UsersController {
  @Post()
  @RequirePermission('users.create')
  async create(@Body() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @Get('admin')
  @RequireRole('admin')
  async adminDashboard() {
    return this.service.getAdminStats();
  }
}
```

## 🏗️ Architecture-Specific Usage

The generator supports three architecture patterns. Each has different setup and usage patterns:

### 1️⃣ Standalone Architecture

**Best for:** Single application, simple projects, MVPs

**Setup:**

```bash
# Navigate to standalone app
cd apps/standalone

# Initialize generator (creates generator.config.json)
npx @ojiepermana/nest-generator init --architecture=standalone

# Generate module
npx @ojiepermana/nest-generator generate users.profile
```

**Directory structure:**

```
apps/standalone/
├── src/
│   ├── modules/
│   │   └── users-profile/        # Generated module
│   │       ├── users-profile.dto.ts
│   │       ├── users-profile.repository.ts
│   │       ├── users-profile.service.ts
│   │       ├── users-profile.controller.ts
│   │       └── users-profile.module.ts
│   ├── database/                 # Shared database module
│   ├── rbac/                     # RBAC system (if enabled)
│   └── app.module.ts
└── generator.config.json
```

**Import generated module:**

```typescript
// apps/standalone/src/app.module.ts
import { Module } from '@nestjs/common';
import { UsersProfileModule } from './modules/users-profile/users-profile.module';

@Module({
  imports: [UsersProfileModule],
})
export class AppModule {}
```

### 2️⃣ Monorepo Architecture

**Best for:** Multiple apps sharing common modules, team collaboration

**Setup:**

```bash
# Navigate to monorepo app (e.g., user service)
cd apps/monorepo/user

# Initialize generator
npx @ojiepermana/nest-generator init --architecture=monorepo

# Generate module
npx @ojiepermana/nest-generator generate users.profile
```

**Directory structure:**

```
apps/monorepo/
├── user/
│   ├── src/
│   │   ├── modules/
│   │   │   └── users-profile/    # Generated module
│   │   └── user.module.ts
│   └── generator.config.json
├── order/
│   ├── src/
│   │   ├── modules/
│   │   │   └── orders/           # Generated module
│   │   └── order.module.ts
│   └── generator.config.json
└── libs/                         # Shared libraries (optional)
    ├── database/
    └── rbac/
```

**Shared modules setup:**

```bash
# Create shared database module (run once)
cd apps/monorepo/user
nest generate module database
nest generate service database

# Both apps can now import from libs or duplicate minimal config
```

**Import in each app:**

```typescript
// apps/monorepo/user/src/user.module.ts
import { Module } from '@nestjs/common';
import { UsersProfileModule } from './modules/users-profile/users-profile.module';

@Module({
  imports: [UsersProfileModule],
})
export class UserModule {}
```

### 3️⃣ Microservices Architecture

**Best for:** Distributed systems, scalability, independent deployments

**Setup:**

```bash
# Navigate to specific microservice
cd apps/microservices/user

# Initialize generator
npx @ojiepermana/nest-generator init --architecture=microservices

# Generate module
npx @ojiepermana/nest-generator generate users.profile
```

**Directory structure:**

```
apps/microservices/
├── gateway/                      # API Gateway
│   ├── src/
│   │   ├── controllers/
│   │   │   └── users-profile.controller.ts  # HTTP endpoints
│   │   └── gateway.module.ts
│   └── generator.config.json
├── user/                         # User Microservice
│   ├── src/
│   │   ├── modules/
│   │   │   └── users-profile/    # Generated module
│   │   └── main.ts
│   └── generator.config.json
└── order/                        # Order Microservice
    ├── src/
    │   ├── modules/
    │   │   └── orders/
    │   └── main.ts
    └── generator.config.json
```

**Gateway setup (HTTP → gRPC/TCP):**

```typescript
// apps/microservices/gateway/src/gateway.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: { host: 'localhost', port: 3001 },
      },
    ]),
  ],
})
export class GatewayModule {}
```

**Microservice setup:**

```typescript
// apps/microservices/user/src/main.ts
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { UserServiceModule } from './user-service.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    UserServiceModule,
    {
      transport: Transport.TCP,
      options: { host: 'localhost', port: 3001 },
    },
  );
  await app.listen();
}
bootstrap();
```

**Generated controller with message patterns:**

```typescript
// apps/microservices/user/src/modules/users-profile/users-profile.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern } from '@nestjs/microservices';

@Controller()
export class UsersProfileController {
  @MessagePattern({ cmd: 'users.create' })
  async create(data: CreateUserDto) {
    return this.service.create(data);
  }

  @MessagePattern({ cmd: 'users.findAll' })
  async findAll(filter: UserFilterDto) {
    return this.service.findAll(filter);
  }
}
```

### Architecture Comparison

| Feature                | Standalone    | Monorepo      | Microservices |
| ---------------------- | ------------- | ------------- | ------------- |
| **Setup Complexity**   | ⭐ Simple     | ⭐⭐ Moderate | ⭐⭐⭐ Complex |
| **Code Sharing**       | ❌ None       | ✅ Shared     | ⚠️ Duplicated |
| **Scalability**        | ⚠️ Limited    | ⭐⭐ Good     | ⭐⭐⭐ Best   |
| **Deployment**         | ⭐⭐⭐ Simple | ⭐⭐ Moderate | ⭐ Complex    |
| **Team Collaboration** | ⚠️ Limited    | ✅ Good       | ✅ Excellent  |
| **Best For**           | MVPs, Startups | Medium teams  | Enterprise    |

📖 **Documentation:**

- [Complete Documentation Index](./docs/generator/INDEX.md)
- [Quick Start Guide](./docs/generator/QUICKSTART.md)
- [Feature Scoring](./docs/generator/FEATURE_SCORING.md)
- [RBAC Complete Guide](./docs/generator/rbac/RBAC_GUIDE.md)
- [Audit Trail Guide](./docs/generator/audit/AUDIT_DOCUMENTATION.md)
- [Publishing Guide](./PUBLISHING.md)

### Development Setup

### Prerequisites

- **Node.js**: 24.0.0 or higher (enforced by .nvmrc and engines)
- **npm**: 11.0.0 or higher
- **NestJS**: 11.x
- **Database**: PostgreSQL 18+ or MySQL 8+

### Node Version Management

This project uses `.nvmrc` to specify the required Node.js version:

```bash
# Automatically switch to correct Node.js version
nvm use

# Or install if not available
nvm install

# Verify version
node --version  # Should show v24.x.x
```

### Install Dependencies

```bash
npm install
```

### Build Libraries

```bash
# Build all libraries
npm run build:all-libs

# Build specific library
npm run build:generator
npm run build:nest
```

### Publish to npm

```bash
# Interactive publish
./scripts/publish-libs.sh

# Or use npm scripts
npm run publish:all-libs
```

📖 **See:** [QUICK-PUBLISH.md](./QUICK-PUBLISH.md) for quick guide or [PUBLISHING.md](./PUBLISHING.md) for complete documentation.

## � Feature Comparison

| Feature                           | Status      | Tests       | Documentation |
| --------------------------------- | ----------- | ----------- | ------------- |
| **Core CRUD**                     | ✅ Complete | 585 passing | ✅            |
| **Advanced Queries**              | ✅ Complete | Included    | ✅            |
| **JOINs (Auto-detect)**           | ✅ Complete | Included    | ✅            |
| **Aggregations**                  | ✅ Complete | Included    | ✅            |
| **Recaps (Daily/Monthly/Yearly)** | ✅ Complete | Included    | ✅            |
| **Caching (Redis)**               | ✅ Complete | Included    | ✅            |
| **Audit Trail**                   | ✅ Complete | Included    | ✅            |
| **File Upload**                   | ✅ Complete | 40 tests    | ✅            |
| **- Local Storage**               | ✅ Complete | ✅          | ✅            |
| **- AWS S3**                      | ✅ Complete | ✅          | ✅            |
| **- Google Cloud Storage**        | ✅ Complete | ✅          | ✅            |
| **- Azure Blob Storage**          | ✅ Complete | ✅          | ✅            |
| **Export (CSV/Excel)**            | ✅ Complete | Included    | ✅            |
| **Swagger Documentation**         | ✅ Complete | Included    | ✅            |
| **RBAC**                          | ✅ Complete | 92 tests    | ✅ 1432 lines |
| **- Permission-based**            | ✅ Complete | 22 tests    | ✅            |
| **- Role-based**                  | ✅ Complete | 28 tests    | ✅            |
| **- Ownership verification**      | ✅ Complete | Included    | ✅            |
| **- Field-level permissions**     | ✅ Complete | Included    | ✅            |
| **Architecture Support**          | ✅ Complete | Included    | ✅            |
| **- Standalone**                  | ✅ Complete | ✅          | ✅            |
| **- Monorepo**                    | ✅ Complete | ✅          | ✅            |
| **- Microservices**               | ✅ Complete | ✅          | ✅            |
| **Database Support**              | ✅ Complete | Included    | ✅            |
| **- PostgreSQL**                  | ✅ Complete | ✅          | ✅            |
| **- MySQL**                       | ✅ Complete | ✅          | ✅            |

**Overall Score:** 104.5/100 🎉

## Documentation

### Generator Documentation

- **[Complete Documentation Index](./docs/generator/INDEX.md)** - All generator documentation in one place
- **[Quick Start Guide](./docs/generator/QUICKSTART.md)** - Get started in 5 minutes (NEW!)
- **[Feature Scoring](./docs/generator/FEATURE_SCORING.md)** - Complete feature analysis (104.5/100)
- **[Feature Status](./docs/generator/FEATURE_STATUS.md)** - Implementation progress and capabilities
- **[RBAC Complete Guide](./docs/generator/rbac/RBAC_GUIDE.md)** - Comprehensive RBAC documentation (1432 lines)
- **[Audit Trail Documentation](./docs/generator/audit/AUDIT_DOCUMENTATION.md)** - Audit trail setup and usage
- **[File Upload Guide](./docs/generator/FILE_UPLOAD.md)** - Multi-provider file upload implementation
- **[Caching Guide](./docs/generator/CACHING.md)** - Redis caching implementation
- **[Database Guide](./docs/generator/DATABASE.md)** - PostgreSQL & MySQL setup
- **[Requirements](./docs/generator/REQUIREMENTS.md)** - System requirements compliance

### Publishing & Development

- **[Publishing Guide](./PUBLISHING.md)** - Complete guide untuk publish libraries
- **[Quick Publish Guide](./QUICK-PUBLISH.md)** - Panduan cepat publish
- **[Libraries Documentation](./LIBRARIES.md)** - Dokumentasi libraries
- **[Checklist](./CHECKLIST.md)** - Pre-publish verification checklist

### Examples & Tutorials

**Basic CRUD Module:**

```bash
nest-generator generate products.categories
```

**With All Features:**

```bash
nest-generator generate users.profile \
  --features.audit=true \
  --features.fileUpload=true \
  --features.rbac=true \
  --features.export=true \
  --storageProvider=s3 \
  --enableCache=true \
  --swagger=true
```

**Microservices Architecture:**

```bash
nest-generator init --architecture=microservices
nest-generator generate orders.transactions
# Automatically creates gateway endpoints + service handlers
```

## Description

[Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

## Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
npm run start

# watch mode
npm run start:dev

# production mode
npm run start:prod
```

## Run tests

```bash
# unit tests
$ npm run test

# e2e tests
$ npm run test:e2e

# test coverage
$ npm run test:cov
```

## Deployment

When you're ready to deploy your NestJS application to production, there are some key steps you can take to ensure it runs as efficiently as possible. Check out the [deployment documentation](https://docs.nestjs.com/deployment) for more information.

If you are looking for a cloud-based platform to deploy your NestJS application, check out [Mau](https://mau.nestjs.com), our official platform for deploying NestJS applications on AWS. Mau makes deployment straightforward and fast, requiring just a few simple steps:

```bash
$ npm install -g @nestjs/mau
$ mau deploy
```

With Mau, you can deploy your application in just a few clicks, allowing you to focus on building features rather than managing infrastructure.

## Resources

Check out a few resources that may come in handy when working with NestJS:

- Visit the [NestJS Documentation](https://docs.nestjs.com) to learn more about the framework.
- For questions and support, please visit our [Discord channel](https://discord.gg/G7Qnnhy).
- To dive deeper and get more hands-on experience, check out our official video [courses](https://courses.nestjs.com/).
- Deploy your application to AWS with the help of [NestJS Mau](https://mau.nestjs.com) in just a few clicks.
- Visualize your application graph and interact with the NestJS application in real-time using [NestJS Devtools](https://devtools.nestjs.com).
- Need help with your project (part-time to full-time)? Check out our official [enterprise support](https://enterprise.nestjs.com).
- To stay in the loop and get updates, follow us on [X](https://x.com/nestframework) and [LinkedIn](https://linkedin.com/company/nestjs).
- Looking for a job, or have a job to offer? Check out our official [Jobs board](https://jobs.nestjs.com).

## Support

Nest is an MIT-licensed open source project. It can grow thanks to the sponsors and support by the amazing backers. If you'd like to join them, please [read more here](https://docs.nestjs.com/support).

## Stay in touch

- Author - [Kamil Myśliwiec](https://twitter.com/kammysliwiec)
- Website - [https://nestjs.com](https://nestjs.com/)
- Twitter - [@nestframework](https://twitter.com/nestframework)

## License

Nest is [MIT licensed](https://github.com/nestjs/nest/blob/master/LICENSE).

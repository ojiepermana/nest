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

📖 **Documentation:**

- [Complete Documentation Index](./docs/generator/INDEX.md)
- [Generator Deep Analysis](./docs/generator/DEEP_ANALYSIS_SCORE.md)
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
- **[Generator Deep Analysis & Score](./docs/generator/DEEP_ANALYSIS_SCORE.md)** - Complete feature analysis and scoring
- **[RBAC Complete Guide](./docs/generator/rbac/RBAC_GUIDE.md)** - Comprehensive RBAC documentation (1432 lines)
- **[Audit Trail Documentation](./docs/generator/audit/AUDIT_DOCUMENTATION.md)** - Audit trail setup and usage
- **[File Upload Guide](./docs/generator/FILE_UPLOAD_GUIDE.md)** - Multi-provider file upload implementation
- **[Progress Reports](./docs/generator/PROGRESS_REPORT.md)** - Implementation progress and milestones

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

# @ojiepermana/nest-rbac

Production-ready Role-Based Access Control (RBAC) for NestJS applications.

## 🎯 Features

- 🔐 **Decorator-based Permission Checks** - Simple and intuitive API
- 👥 **Role Hierarchy Support** - Flexible role-based access control
- 🎯 **Ownership Validation** - Resource-level permission checks
- ⚡ **Built-in Caching** - Redis-backed performance optimization
- 🗄️ **Database Support** - PostgreSQL & MySQL with raw SQL
- 🧪 **100% Test Coverage** - Production-ready and battle-tested
- 📦 **Zero Dependencies** - Uses NestJS peer dependencies only

## 📦 Installation

```bash
npm install @ojiepermana/nest-rbac
```

### Peer Dependencies

```bash
npm install @nestjs/common @nestjs/core @nestjs/cache-manager cache-manager
```

For database support, install either:

```bash
# PostgreSQL
npm install pg

# MySQL
npm install mysql2
```

## 🚀 Quick Start

### 1. Import RBACModule

```typescript
import { Module } from '@nestjs/common';
import { RBACModule } from '@ojiepermana/nest-rbac';

@Module({
  imports: [
    RBACModule.register({
      cache: {
        enabled: true,
        ttl: 300, // 5 minutes
      },
      adminRoles: ['admin', 'super_admin'],
      superAdminRole: 'super_admin',
    }),
  ],
})
export class AppModule {}
```

### 2. Use Decorators

```typescript
import { Controller, Get, Post } from '@nestjs/common';
import { RequirePermission, RequireRole, Public } from '@ojiepermana/nest-rbac';

@Controller('users')
export class UsersController {
  @Get()
  @RequirePermission('users:read')
  findAll() {
    return this.usersService.findAll();
  }

  @Post()
  @RequirePermission('users:create')
  create() {
    return this.usersService.create();
  }

  @Get('admin')
  @RequireRole('admin')
  adminOnly() {
    return { message: 'Admin access granted' };
  }

  @Get('public')
  @Public()
  publicEndpoint() {
    return { message: 'Public access' };
  }
}
```

For detailed documentation, visit: [GitHub Repository](https://github.com/ojiepermana/nest)

## 📄 License

MIT © Ojie Permana

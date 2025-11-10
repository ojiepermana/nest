# Audit Trail Integration Guide

## Overview

The NestJS Generator now supports **automatic audit trail integration** for all generated CRUD modules. When enabled, every CREATE, UPDATE, and DELETE operation is automatically logged with:

- Action type (CREATE/UPDATE/DELETE)
- Entity type and ID
- User who performed the action
- Timestamp
- Old and new values (for updates)
- Rollback capability

---

## Quick Start

### 1. Generate Module with Audit Enabled

```bash
# Interactive mode (will prompt for audit)
nest-generator generate

# Or use the features flag
nest-generator generate user.users --features.auditLog=true

# Skip prompts
nest-generator generate user.users --skipPrompts --features.auditLog=true
```

### 2. Generated Code Structure

When audit is enabled, the generator creates:

```
src/
└── users/
    ├── users.module.ts        # Imports AuditModule
    ├── services/
    │   └── users.service.ts   # Injects AuditLogService + audit calls
    ├── controllers/
    │   └── users.controller.ts
    ├── repositories/
    │   └── users.repository.ts
    ├── entities/
    │   └── users.entity.ts
    └── dto/
        ├── create-users.dto.ts
        ├── update-users.dto.ts
        └── users-filter.dto.ts
```

---

## Generated Code Examples

### Module (users.module.ts)

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditModule } from '@ojiepermana/nest-generator/audit'; // ✅ Auto-imported

import { Users } from './entities/users.entity';
import { UsersController } from './controllers/users.controller';
import { UsersService } from './services/users.service';
import { UsersRepository } from './repositories/users.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Users]),
    AuditModule, // ✅ Auto-imported
  ],
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService, UsersRepository],
})
export class UsersModule {}
```

### Service (users.service.ts)

```typescript
import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { AuditLogService } from '@ojiepermana/nest-generator/audit'; // ✅ Auto-imported
import { UsersRepository } from '../repositories/users.repository';
// ... other imports

@Injectable()
export class UsersService {
  constructor(
    private readonly repository: UsersRepository,
    private readonly auditLogService: AuditLogService, // ✅ Auto-injected
  ) {}

  async create(createDto: CreateUsersDto): Promise<Users> {
    try {
      const user = await this.repository.create(createDto);
      
      // ✅ Auto-generated audit log
      await this.auditLogService.log({
        entity: 'Users',
        entityId: user.id,
        action: 'CREATE',
        data: createDto,
      });
      
      return user;
    } catch (error) {
      throw new BadRequestException(`Failed to create user: ${error.message}`);
    }
  }

  async update(id: string, updateDto: UpdateUsersDto): Promise<Users> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    const updated = await this.repository.update(id, updateDto);
    
    // ✅ Auto-generated audit log with old/new values
    await this.auditLogService.log({
      entity: 'Users',
      entityId: id,
      action: 'UPDATE',
      oldData: existing,
      data: updated,
    });
    
    return updated;
  }

  async remove(id: string): Promise<void> {
    const existing = await this.repository.findById(id);
    if (!existing) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }

    await this.repository.delete(id);
    
    // ✅ Auto-generated audit log
    await this.auditLogService.log({
      entity: 'Users',
      entityId: id,
      action: 'DELETE',
      oldData: existing,
    });
  }
}
```

---

## Features

### ✅ Automatic Logging

Every CRUD operation is automatically logged:

- **CREATE**: Logs new values
- **UPDATE**: Logs old and new values
- **DELETE**: Logs deleted values

### ✅ User Tracking

Pass user information in the log call:

```typescript
await this.auditLogService.log({
  entity: 'Users',
  entityId: user.id,
  action: 'CREATE',
  data: createDto,
  userId: currentUser.id, // Add user context
  metadata: { ip: req.ip, userAgent: req.headers['user-agent'] },
});
```

### ✅ Change Tracking

View what changed:

```typescript
const changes = await this.auditQueryService.getChanges({
  entityType: 'Users',
  entityId: '123',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
});

// Returns:
// [
//   { field: 'email', oldValue: 'old@example.com', newValue: 'new@example.com' },
//   { field: 'username', oldValue: 'john', newValue: 'john_doe' }
// ]
```

### ✅ Rollback Capability

Undo changes:

```typescript
await this.auditLogService.rollback(logId, {
  userId: currentUser.id,
  reason: 'Accidental deletion',
});
```

### ✅ Compliance Reports

Export audit logs for compliance:

```typescript
const report = await this.auditQueryService.exportLogs({
  format: 'csv',
  startDate: new Date('2024-01-01'),
  endDate: new Date('2024-12-31'),
  entityType: 'Users',
});
```

---

## Configuration

### App Module Setup

Import `AuditModule` in your root module:

```typescript
import { Module } from '@nestjs/common';
import { AuditModule } from '@ojiepermana/nest-generator/audit';
import { UsersModule } from './users/users.module';

@Module({
  imports: [
    AuditModule.forRoot({
      enabled: true,
      log_reads: false, // Don't log SELECT operations
      retention_days: 90, // Keep logs for 90 days
      excluded_fields: ['password', 'token', 'secret'], // Don't log sensitive fields
    }),
    UsersModule,
  ],
})
export class AppModule {}
```

### Environment Variables

```env
# .env
AUDIT_ENABLED=true
AUDIT_LOG_READS=false
AUDIT_RETENTION_DAYS=90
AUDIT_EXCLUDED_FIELDS=password,token,secret
```

---

## CLI Commands

### Generate with Audit

```bash
# Interactive (will prompt)
nest-generator generate

# With flag
nest-generator generate user.users --features.auditLog=true

# Multiple features
nest-generator generate user.users \
  --features.swagger=true \
  --features.caching=true \
  --features.auditLog=true \
  --features.validation=true
```

### Regenerate with Audit

If you already generated a module without audit, regenerate it:

```bash
nest-generator generate user.users --features.auditLog=true
```

The generator will:
1. Detect existing custom code
2. Preserve your custom methods
3. Add audit logging to CRUD operations
4. Update module imports

---

## Best Practices

### 1. Always Pass User Context

```typescript
async create(createDto: CreateUsersDto, currentUser: User): Promise<Users> {
  const user = await this.repository.create(createDto);
  
  await this.auditLogService.log({
    entity: 'Users',
    entityId: user.id,
    action: 'CREATE',
    data: createDto,
    userId: currentUser.id, // ✅ Track who created
    metadata: { role: currentUser.role },
  });
  
  return user;
}
```

### 2. Exclude Sensitive Data

```typescript
// In AuditModule configuration
AuditModule.forRoot({
  excluded_fields: ['password', 'token', 'secret', 'creditCard'],
});
```

### 3. Use Metadata for Context

```typescript
await this.auditLogService.log({
  entity: 'Orders',
  entityId: order.id,
  action: 'UPDATE',
  data: updateDto,
  metadata: {
    ip: req.ip,
    userAgent: req.headers['user-agent'],
    reason: 'Customer requested change',
  },
});
```

### 4. Archive Old Logs

```typescript
// Run this in a cron job
await this.auditQueryService.archiveLogs({
  olderThan: new Date(Date.now() - 90 * 24 * 60 * 60 * 1000),
  destination: 's3://audit-archives/2024/',
});
```

---

## Troubleshooting

### Audit logs not appearing?

Check:

1. AuditModule is imported in your app module
2. `enabled: true` in configuration
3. Database connection is working
4. No errors in console

### Performance issues?

- Set `log_reads: false` to avoid logging SELECT operations
- Use `excluded_fields` to skip large fields
- Archive old logs regularly
- Consider async logging with queue

### Rollback not working?

Rollback requires:
- Original values stored in `oldData`
- Entity still exists
- User has permission

---

## Migration from Manual Audit

If you have manual audit logging:

```typescript
// Before (manual)
async create(createDto: CreateUsersDto): Promise<Users> {
  const user = await this.repository.create(createDto);
  
  // Manual audit log
  await this.db.query(`
    INSERT INTO audit_logs (entity, entity_id, action)
    VALUES ('Users', $1, 'CREATE')
  `, [user.id]);
  
  return user;
}

// After (auto-generated)
async create(createDto: CreateUsersDto): Promise<Users> {
  const user = await this.repository.create(createDto);
  
  // Auto-generated audit log
  await this.auditLogService.log({
    entity: 'Users',
    entityId: user.id,
    action: 'CREATE',
    data: createDto,
  });
  
  return user;
}
```

Regenerate your modules with `--features.auditLog=true` to migrate automatically!

---

## Next Steps

- Read the [Audit Trail Documentation](../audit/AUDIT_DOCUMENTATION.md)
- See [Compliance Guide](../audit/COMPLIANCE.md)
- Explore [Advanced Features](../audit/ADVANCED.md)

---

**Status**: ✅ Production Ready  
**Version**: 1.0.0  
**Last Updated**: November 10, 2025

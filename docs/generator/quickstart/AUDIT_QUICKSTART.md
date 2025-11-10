# Audit Trail Quick Start Guide

Get comprehensive audit logging running in **5 minutes**.

## Prerequisites

- Node.js 24+
- npm 11+
- NestJS 11+
- Database (PostgreSQL 18+ or MySQL 8+)

## Step 1: Database Setup (1 min)

Create audit table:

**PostgreSQL:**

```sql
-- Create audit schema
CREATE SCHEMA IF NOT EXISTS audit;

-- Audit logs table
CREATE TABLE audit.logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  action VARCHAR(20) NOT NULL,
  user_id VARCHAR(100),
  user_email VARCHAR(255),
  old_values JSONB,
  new_values JSONB,
  changes JSONB,
  ip_address INET,
  user_agent TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  error_message TEXT,
  tags VARCHAR(50)[],
  metadata JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_audit_logs_entity ON audit.logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_user ON audit.logs(user_id);
CREATE INDEX idx_audit_logs_action ON audit.logs(action);
CREATE INDEX idx_audit_logs_created_at ON audit.logs(created_at DESC);
```

**MySQL:**

```sql
-- Audit logs table
CREATE TABLE audit_logs (
  id CHAR(36) PRIMARY KEY DEFAULT (UUID()),
  entity_type VARCHAR(100) NOT NULL,
  entity_id VARCHAR(100),
  action VARCHAR(20) NOT NULL,
  user_id VARCHAR(100),
  user_email VARCHAR(255),
  old_values JSON,
  new_values JSON,
  changes JSON,
  ip_address VARCHAR(45),
  user_agent TEXT,
  endpoint VARCHAR(255),
  method VARCHAR(10),
  status_code INTEGER,
  error_message TEXT,
  tags JSON,
  metadata JSON,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_entity (entity_type, entity_id),
  INDEX idx_user (user_id),
  INDEX idx_action (action),
  INDEX idx_created_at (created_at)
);
```

## Step 2: Generate Module with Audit (1 min)

```bash
nest-generator generate users.profile --features.audit=true
```

This automatically:
- Creates `AuditModule` (global)
- Adds `@AuditLog()` decorator to service methods
- Tracks CREATE, UPDATE, DELETE operations
- Captures user context and changes

Generated files:

```
src/audit/
├── audit-log.service.ts         # Audit logging
├── audit-query.service.ts       # Audit queries
├── audit-log.decorator.ts       # @AuditLog decorator
└── audit.module.ts              # Global module

src/modules/users-profile/
├── users-profile.service.ts     # With @AuditLog decorators
└── users-profile.module.ts      # Auto-imports AuditModule
```

## Step 3: Verify Audit Decorators (30 sec)

Check generated service has audit decorators:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLog } from '../../audit/audit-log.decorator';

@Injectable()
export class UsersProfileService {
  
  @AuditLog('users.profile', 'create')
  async create(dto: CreateDto, userId: string) {
    // Your create logic
    return this.repository.create(dto, userId);
  }

  @AuditLog('users.profile', 'update')
  async update(id: string, dto: UpdateDto, userId: string) {
    // Your update logic
    return this.repository.update(id, dto, userId);
  }

  @AuditLog('users.profile', 'delete')
  async delete(id: string, userId: string) {
    // Your delete logic
    return this.repository.delete(id, userId);
  }
}
```

**That's it!** 🎉 Audit logging is now automatic for all CRUD operations.

## Step 4: Test Audit Logging (1 min)

```bash
# Start your app
npm run start:dev

# Create a user profile
curl -X POST http://localhost:3000/users/profile \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "John Doe", "email": "john@example.com"}'

# Update the profile
curl -X PUT http://localhost:3000/users/profile/USER_ID \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{"name": "Jane Doe"}'

# Check audit logs
SELECT * FROM audit.logs ORDER BY created_at DESC LIMIT 5;
```

**Sample audit log:**

```json
{
  "id": "01933e8a-7b2c-7890-a1b2-c3d4e5f6a7b8",
  "entity_type": "users.profile",
  "entity_id": "550e8400-e29b-41d4-a716-446655440000",
  "action": "UPDATE",
  "user_id": "123e4567-e89b-12d3-a456-426614174000",
  "user_email": "admin@example.com",
  "old_values": {
    "name": "John Doe",
    "email": "john@example.com"
  },
  "new_values": {
    "name": "Jane Doe",
    "email": "john@example.com"
  },
  "changes": {
    "name": {
      "old": "John Doe",
      "new": "Jane Doe"
    }
  },
  "ip_address": "192.168.1.100",
  "user_agent": "Mozilla/5.0...",
  "endpoint": "/users/profile/550e8400-e29b-41d4-a716-446655440000",
  "method": "PUT",
  "status_code": 200,
  "created_at": "2024-11-10T10:30:00Z"
}
```

## Step 5: Query Audit Logs (1 min)

Use the generated audit query service:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditQueryService } from '../../audit/audit-query.service';

@Injectable()
export class ReportsService {
  constructor(private readonly auditQuery: AuditQueryService) {}

  // Get all changes for a specific entity
  async getEntityHistory(entityType: string, entityId: string) {
    return this.auditQuery.findByEntity(entityType, entityId);
  }

  // Get all actions by a user
  async getUserActivity(userId: string, days = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);
    
    return this.auditQuery.findByUser(userId, { since });
  }

  // Get all failed operations
  async getFailures() {
    return this.auditQuery.findByStatus('failure');
  }

  // Get changes in date range
  async getChangesBetween(startDate: Date, endDate: Date) {
    return this.auditQuery.findByDateRange(startDate, endDate);
  }

  // Search across all logs
  async searchLogs(query: string) {
    return this.auditQuery.search(query);
  }
}
```

## Step 6: Add Audit Endpoints (Optional, 1 min)

Create audit controller for viewing logs:

```typescript
import { Controller, Get, Query, Param, UseGuards } from '@nestjs/common';
import { AuditQueryService } from './audit-query.service';
import { RequirePermission } from '../rbac/rbac.decorator';
import { RbacGuard } from '../rbac/rbac.guard';

@Controller('audit')
@UseGuards(RbacGuard)
export class AuditController {
  constructor(private readonly auditQuery: AuditQueryService) {}

  @Get()
  @RequirePermission('audit:read')
  async findAll(@Query() filters: any) {
    return this.auditQuery.find(filters);
  }

  @Get('entity/:type/:id')
  @RequirePermission('audit:read')
  async getEntityHistory(
    @Param('type') entityType: string,
    @Param('id') entityId: string,
  ) {
    return this.auditQuery.findByEntity(entityType, entityId);
  }

  @Get('user/:userId')
  @RequirePermission('audit:read')
  async getUserActivity(@Param('userId') userId: string) {
    return this.auditQuery.findByUser(userId);
  }

  @Get('action/:action')
  @RequirePermission('audit:read')
  async getByAction(@Param('action') action: string) {
    return this.auditQuery.findByAction(action);
  }
}
```

## Advanced Usage

### Manual Audit Logging

For custom operations not covered by decorators:

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLogService } from './audit/audit-log.service';

@Injectable()
export class CustomService {
  constructor(private readonly auditLog: AuditLogService) {}

  async customOperation(userId: string) {
    try {
      // Your business logic
      const result = await this.performOperation();

      // Log success
      await this.auditLog.log({
        entityType: 'custom_operation',
        entityId: result.id,
        action: 'EXECUTE',
        userId: userId,
        newValues: result,
        metadata: { operation: 'custom', version: '1.0' },
      });

      return result;
    } catch (error) {
      // Log failure
      await this.auditLog.log({
        entityType: 'custom_operation',
        action: 'EXECUTE',
        userId: userId,
        statusCode: 500,
        errorMessage: error.message,
      });

      throw error;
    }
  }
}
```

### Rollback to Previous State

```typescript
async rollback(entityType: string, entityId: string) {
  // Get last successful update
  const logs = await this.auditQuery.findByEntity(entityType, entityId, {
    action: 'UPDATE',
    limit: 1,
  });

  if (logs.length === 0) {
    throw new Error('No previous state found');
  }

  const previousState = logs[0].old_values;
  
  // Restore previous state
  return this.repository.update(entityId, previousState);
}
```

### Export Audit Logs

```typescript
async exportLogs(filters: any, format: 'json' | 'csv' = 'json') {
  const logs = await this.auditQuery.find(filters);
  
  if (format === 'csv') {
    return this.convertToCSV(logs);
  }
  
  return logs;
}

private convertToCSV(logs: any[]): string {
  const headers = ['Timestamp', 'Entity', 'Action', 'User', 'Changes'];
  const rows = logs.map(log => [
    log.created_at,
    `${log.entity_type}:${log.entity_id}`,
    log.action,
    log.user_email || log.user_id,
    JSON.stringify(log.changes),
  ]);
  
  return [headers, ...rows]
    .map(row => row.join(','))
    .join('\n');
}
```

## Common Patterns

### 1. Track Login Attempts

```typescript
@Post('login')
async login(@Body() dto: LoginDto, @Req() req) {
  try {
    const user = await this.authService.validateUser(dto.email, dto.password);
    
    await this.auditLog.log({
      entityType: 'auth',
      action: 'LOGIN',
      userId: user.id,
      userEmail: user.email,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      statusCode: 200,
      metadata: { success: true },
    });
    
    return { token: await this.authService.generateToken(user) };
  } catch (error) {
    await this.auditLog.log({
      entityType: 'auth',
      action: 'LOGIN',
      userEmail: dto.email,
      ipAddress: req.ip,
      statusCode: 401,
      errorMessage: 'Invalid credentials',
      metadata: { success: false },
    });
    
    throw error;
  }
}
```

### 2. Compliance Reports

```typescript
async generateComplianceReport(startDate: Date, endDate: Date) {
  const logs = await this.auditQuery.findByDateRange(startDate, endDate);
  
  return {
    total_operations: logs.length,
    by_action: this.groupBy(logs, 'action'),
    by_user: this.groupBy(logs, 'user_id'),
    failures: logs.filter(l => l.status_code >= 400).length,
    data_changes: logs.filter(l => l.changes).length,
  };
}
```

### 3. Alert on Suspicious Activity

```typescript
async detectSuspiciousActivity(userId: string) {
  const recentLogs = await this.auditQuery.findByUser(userId, {
    since: new Date(Date.now() - 3600000), // Last hour
  });
  
  const failedLogins = recentLogs.filter(
    l => l.action === 'LOGIN' && l.status_code === 401
  );
  
  if (failedLogins.length > 5) {
    // Send alert
    await this.notificationService.sendAlert({
      type: 'SUSPICIOUS_ACTIVITY',
      message: `User ${userId} has ${failedLogins.length} failed login attempts`,
      severity: 'HIGH',
    });
  }
}
```

## Troubleshooting

### ❌ No audit logs created

**Check:**
1. Audit table exists: `SELECT * FROM audit.logs LIMIT 1;`
2. AuditModule is global: `@Global()` decorator present
3. Service methods have `@AuditLog()` decorator
4. User context is passed to service methods

### ❌ Missing user information in logs

**Solution**: Ensure user context is extracted in decorator:

```typescript
// In audit-log.decorator.ts
const userId = context.switchToHttp().getRequest().user?.id;
const userEmail = context.switchToHttp().getRequest().user?.email;
```

### ❌ Changes field is empty

**Solution**: Ensure old values are fetched before update:

```typescript
@AuditLog('users', 'update')
async update(id: string, dto: UpdateDto) {
  const oldValues = await this.findOne(id); // ← Fetch before update
  return this.repository.update(id, dto);
}
```

## Next Steps

- **Full Documentation**: [AUDIT_DOCUMENTATION.md](../audit/AUDIT_DOCUMENTATION.md)
- **Advanced Queries**: Aggregations, grouping, statistics
- **Rollback Procedures**: Restore previous states
- **Export & Reporting**: JSON, CSV, PDF reports
- **Compliance**: SOC 2, GDPR, HIPAA configuration
- **Integration**: Combine with RBAC for access control

## Quick Reference

```typescript
// Decorator
@AuditLog(entityType, action, options?)

// Manual logging
await auditLogService.log({
  entityType: 'users',
  entityId: '123',
  action: 'CREATE',
  userId: 'user-id',
  newValues: {...},
});

// Queries
await auditQueryService.findByEntity(entityType, entityId);
await auditQueryService.findByUser(userId, filters?);
await auditQueryService.findByAction(action);
await auditQueryService.findByDateRange(start, end);
await auditQueryService.search(query);
```

**Total Time: ~5 minutes** ✅

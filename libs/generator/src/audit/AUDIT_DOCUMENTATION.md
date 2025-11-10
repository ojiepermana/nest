# Audit Trail System - Complete Guide

Comprehensive audit logging system for tracking all CRUD operations with rollback capability, compliance features, and advanced analytics.

## Table of Contents

1. [Features](#features)
2. [Installation](#installation)
3. [Quick Start](#quick-start)
4. [Core Concepts](#core-concepts)
5. [Usage Examples](#usage-examples)
6. [API Reference](#api-reference)
7. [Rollback Procedures](#rollback-procedures)
8. [Advanced Queries](#advanced-queries)
9. [Export & Reporting](#export--reporting)
10. [Security & Compliance](#security--compliance)
11. [Performance Optimization](#performance-optimization)
12. [Best Practices](#best-practices)
13. [Troubleshooting](#troubleshooting)

## Features

### Core Features

- ✅ **Automatic CRUD Logging** - Track all create, read, update, delete operations
- ✅ **Change Tracking** - Detailed field-level changes (old → new values)
- ✅ **Rollback Capability** - Restore previous states with validation
- ✅ **User Activity Tracking** - Monitor who did what and when
- ✅ **Request Context** - Capture IP address, user agent, endpoint, method
- ✅ **Sensitive Data Redaction** - Auto-hide passwords, tokens, secrets
- ✅ **Flexible Filtering** - Query by entity, user, action, date, tags, etc.
- ✅ **Pagination** - Efficient handling of large audit logs
- ✅ **Statistics & Analytics** - Comprehensive reports and insights
- ✅ **Export** - JSON, CSV formats with custom filters
- ✅ **Archive** - Compliance-friendly log archival
- ✅ **Search** - Full-text search across audit logs
- ✅ **Grouping** - Group by entity, user, action, date

### Compliance Support

- SOC 2 Type II
- GDPR (with PII anonymization)
- HIPAA
- ISO 27001
- PCI DSS Level 1

## Installation

### 1. Add Database Schema

**PostgreSQL:**

```bash
psql -U username -d database -f libs/generator/src/audit/schemas/postgresql-audit.sql
```

**MySQL:**

```bash
mysql -u username -p database < libs/generator/src/audit/schemas/mysql-audit.sql
```

### 2. Import Module

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit/audit-log.service';
import { AuditQueryService } from './audit/audit-query.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      /* AuditLogEntity */
    ]),
  ],
  providers: [AuditLogService, AuditQueryService],
  exports: [AuditLogService, AuditQueryService],
})
export class AuditModule {}
```

### 3. Configure

Create `audit.config.ts`:

```typescript
import { AuditLogConfig } from './audit/audit-log.interface';

export const auditConfig: AuditLogConfig = {
  enabled: true,
  log_reads: false, // Set true to log SELECT queries
  log_successful_only: false, // Log failures too
  excluded_entities: ['sessions', 'refresh_tokens'],
  excluded_fields: ['password', 'token', 'secret'],
  retention_days: 90,
  anonymize_pii: false,
};
```

## Quick Start

### Automatic Logging with Decorator

```typescript
import { Injectable } from '@nestjs/common';
import { AuditLog } from './audit/audit-log.decorator';
import { AuditLogService } from './audit/audit-log.service';

@Injectable()
export class UsersService {
  constructor(private readonly auditLogService: AuditLogService) {}

  @AuditLog({
    action: 'CREATE',
    entityType: 'users',
    entityIdParam: 'return', // Extract ID from return value
    newValuesParam: 'return', // Use return value as new state
  })
  async create(dto: CreateUserDto): Promise<User> {
    return this.usersRepository.save(dto);
  }

  @AuditLog({
    action: 'UPDATE',
    entityType: 'users',
    entityIdParam: 'id', // Extract ID from first parameter
    oldValuesParam: (params) => this.findOne(params[0]), // Custom extractor
    newValuesParam: 1, // Second parameter (index 1)
  })
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    const oldUser = await this.findOne(id);
    return this.usersRepository.save({ id, ...dto });
  }

  @AuditLog({
    action: 'DELETE',
    entityType: 'users',
    entityIdParam: 0, // First parameter (index 0)
    oldValuesParam: (params) => this.findOne(params[0]),
  })
  async delete(id: string): Promise<void> {
    await this.usersRepository.delete(id);
  }
}
```

### Manual Logging

```typescript
await this.auditLogService.log({
  action: 'UPDATE',
  entity_type: 'users',
  entity_id: user.id,
  user_id: currentUser.id,
  user_name: currentUser.name,
  user_ip: request.ip,
  user_agent: request.headers['user-agent'],
  old_values: { name: 'John Doe', role: 'user' },
  new_values: { name: 'John Smith', role: 'admin' },
  endpoint: '/api/users/123',
  method: 'PUT',
  tags: ['critical', 'role-change'],
  metadata: {
    reason: 'Promotion',
    approved_by: 'manager-123',
  },
});
```

## Core Concepts

### Action Types

```typescript
type AuditAction =
  | 'CREATE' // Insert new record
  | 'UPDATE' // Modify existing record
  | 'DELETE' // Remove record
  | 'RESTORE' // Rollback/undelete
  | 'READ' // SELECT query (optional)
  | 'LOGIN' // User authentication
  | 'LOGOUT' // User logout
  | 'EXPORT' // Data export
  | 'IMPORT' // Data import
  | 'CUSTOM'; // Custom actions
```

### Change Detection

The system automatically detects changes:

```typescript
// Before
{ name: 'John Doe', email: 'john@old.com', role: 'user' }

// After
{ name: 'John Smith', email: 'john@old.com', role: 'admin' }

// Detected Changes
[
  { field: 'name', old_value: 'John Doe', new_value: 'John Smith', data_type: 'string' },
  { field: 'role', old_value: 'user', new_value: 'admin', data_type: 'string' }
]
```

### Sensitive Data Redaction

Automatically redacts configured fields:

```typescript
// Input
{
  name: 'John Doe',
  email: 'john@example.com',
  password: 'secret123',
  token: 'abc-def-ghi'
}

// Stored (password & token redacted)
{
  name: 'John Doe',
  email: 'john@example.com',
  password: '[REDACTED]',
  token: '[REDACTED]'
}
```

## Usage Examples

### Query Entity History

```typescript
// Get all changes to a specific user
const history = await auditLogService.getEntityHistory('users', 'user-123');

console.log(history);
// [
//   { action: 'CREATE', created_at: '2024-01-01T10:00:00Z', ... },
//   { action: 'UPDATE', created_at: '2024-01-15T14:30:00Z', ... },
//   { action: 'UPDATE', created_at: '2024-02-20T09:15:00Z', ... },
// ]
```

### Query User Activity

```typescript
// Get all actions by a user in date range
const activity = await auditLogService.getUserActivity('user-123', new Date('2024-01-01'), new Date('2024-12-31'));
```

### Advanced Filtering

```typescript
const logs = await auditLogService.find({
  action: ['UPDATE', 'DELETE'], // Multiple actions
  entity_type: 'users',
  status: 'SUCCESS',
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
  tags: ['critical'],
});
```

### Get Statistics

```typescript
const stats = await auditLogService.getStats({
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
});

console.log(stats);
// {
//   total_logs: 15420,
//   by_action: {
//     CREATE: 5240,
//     UPDATE: 8100,
//     DELETE: 2080
//   },
//   by_entity: {
//     users: 8000,
//     products: 5000,
//     orders: 2420
//   },
//   by_user: {
//     'user-1': 10000,
//     'user-2': 5420
//   },
//   failed_count: 250,
//   rolled_back_count: 15
// }
```

## Rollback Procedures

### Basic Rollback

```typescript
// Find the log to rollback
const logs = await auditLogService.getEntityHistory('users', 'user-123');
const lastUpdate = logs.find((log) => log.action === 'UPDATE');

// Rollback the change
await auditLogService.rollback({
  audit_log_id: lastUpdate.id,
  rolled_back_by: 'admin-user-id',
  reason: 'Accidental change',
});
```

### Validate Before Rollback

```typescript
// Check if rollback is possible
const result = await auditLogService.rollback({
  audit_log_id: logId,
  rolled_back_by: 'admin',
  validate: true, // Don't actually rollback, just check
});

console.log('Can rollback:', !result.is_rolled_back && result.old_values !== null);
```

### Rollback Workflow

```typescript
async rollbackUserChange(userId: string, logId: string, adminId: string) {
  // 1. Find the log
  const log = await this.auditLogService.findById(logId);

  if (!log) {
    throw new Error('Audit log not found');
  }

  // 2. Verify it's for the correct user
  if (log.entity_id !== userId) {
    throw new Error('Log does not belong to this user');
  }

  // 3. Check if already rolled back
  if (log.is_rolled_back) {
    throw new Error('Already rolled back');
  }

  // 4. Perform rollback
  await this.auditLogService.rollback({
    audit_log_id: logId,
    rolled_back_by: adminId,
    reason: 'User requested data restoration',
  });

  // 5. Apply the old values back to the entity
  if (log.old_values) {
    await this.usersRepository.update(userId, log.old_values);
  }

  return { success: true, restored: log.old_values };
}
```

## Advanced Queries

### Pagination

```typescript
const result = await auditQueryService.query(
  { entity_type: 'users' },
  1, // page
  20, // limit
);

console.log(result);
// {
//   data: [...], // 20 logs
//   total: 500,
//   page: 1,
//   limit: 20,
//   total_pages: 25,
//   has_next: true,
//   has_prev: false
// }
```

### Search

```typescript
// Full-text search
const results = await auditQueryService.search('john@example.com');
```

### Grouping

```typescript
// Group by entity type
const byEntity = await auditQueryService.groupBy('entity_type');

// Group by user
const byUser = await auditQueryService.groupBy('user_id');

// Group by date
const timeline = await auditQueryService.getTimeline();
```

### Date Shortcuts

```typescript
// Today's logs
const today = await auditQueryService.getToday();

// This week
const thisWeek = await auditQueryService.getThisWeek();

// Last 7 days
const last7Days = await auditQueryService.getLastNDays(7);

// Using filter shortcuts
const logs = await auditQueryService.query({
  last_30_days: true,
  action: 'DELETE',
});
```

### Compare States

```typescript
// Compare two audit log states
const comparison = await auditQueryService.compareStates(logId1, logId2);

console.log(comparison.differences);
// [
//   { field: 'name', value1: 'John', value2: 'Jane', changed: true },
//   { field: 'email', value1: 'john@example.com', value2: 'john@example.com', changed: false },
//   { field: 'role', value1: 'user', value2: 'admin', changed: true },
// ]
```

## Export & Reporting

### Export to JSON

```typescript
const json = await auditQueryService.export({
  format: 'json',
  filter: {
    entity_type: 'users',
    last_30_days: true,
  },
  include_metadata: true,
});

// Save to file
fs.writeFileSync('audit-logs.json', json);
```

### Export to CSV

```typescript
const csv = await auditQueryService.export({
  format: 'csv',
  filter: {
    action: ['UPDATE', 'DELETE'],
    start_date: new Date('2024-01-01'),
  },
});

// Send as download
res.setHeader('Content-Type', 'text/csv');
res.setHeader('Content-Disposition', 'attachment; filename=audit-logs.csv');
res.send(csv);
```

### Analytics

```typescript
// Most active users
const topUsers = await auditQueryService.getMostActiveUsers(10);

// Most modified entities
const topEntities = await auditQueryService.getMostModifiedEntities(10);

// Activity timeline
const timeline = await auditQueryService.getTimeline({
  last_30_days: true,
});
```

## Security & Compliance

### GDPR Compliance

```typescript
// Anonymize user data
service.configure({
  anonymize_pii: true,
  excluded_fields: ['email', 'phone', 'address', 'ssn', 'credit_card'],
});

// Export user's data (right to access)
const userData = await auditQueryService.export({
  format: 'json',
  filter: { user_id: 'user-123' },
});

// Delete user's audit logs (right to be forgotten)
// Note: Consider archiving instead of deleting for compliance
```

### Access Control

```typescript
@Controller('audit')
@UseGuards(AuthGuard, RolesGuard)
@Roles('admin', 'auditor')
export class AuditController {
  // Only admins and auditors can access audit logs
}
```

### Encryption

For sensitive environments, consider encrypting audit logs:

```typescript
// Encrypt values before storing
import { encrypt, decrypt } from './crypto.util';

const encryptedLog = {
  ...logData,
  old_values: encrypt(JSON.stringify(logData.old_values)),
  new_values: encrypt(JSON.stringify(logData.new_values)),
};
```

## Performance Optimization

### Indexing Strategy

The provided schemas include optimized indexes:

```sql
-- Entity lookups
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);

-- User activity
CREATE INDEX idx_audit_logs_user ON audit_logs(user_id);

-- Time-based queries
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Composite indexes
CREATE INDEX idx_audit_logs_entity_created
  ON audit_logs(entity_type, entity_id, created_at DESC);
```

### Partitioning (PostgreSQL)

For large datasets (> 10 million rows), use table partitioning:

```sql
CREATE TABLE audit_logs_partitioned (LIKE audit_logs INCLUDING ALL)
PARTITION BY RANGE (created_at);

-- Monthly partitions
CREATE TABLE audit_logs_2024_01 PARTITION OF audit_logs_partitioned
FOR VALUES FROM ('2024-01-01') TO ('2024-02-01');
```

### Archive Strategy

```typescript
// Run daily cron job to archive old logs
@Cron('0 2 * * *') // 2 AM daily
async archiveOldLogs() {
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - 90);

  const archived = await this.auditLogService.archiveOldLogs(cutoffDate);
  this.logger.log(`Archived ${archived} audit logs`);
}
```

### Disable READ Logging

```typescript
// Reading generates massive logs - disable in production
service.configure({
  log_reads: false,
});
```

## Best Practices

### 1. Configuration

```typescript
// ✅ Good: Environment-based config
const config = {
  enabled: process.env.AUDIT_ENABLED !== 'false',
  log_reads: process.env.AUDIT_LOG_READS === 'true',
  retention_days: parseInt(process.env.AUDIT_RETENTION_DAYS || '90'),
};

// ❌ Bad: Hardcoded values
const config = {
  enabled: true,
  log_reads: true, // Too much data!
};
```

### 2. Sensitive Fields

```typescript
// ✅ Good: Comprehensive exclusion list
excluded_fields: [
  'password',
  'password_hash',
  'token',
  'secret',
  'api_key',
  'access_token',
  'refresh_token',
  'credit_card',
  'ssn',
  'bank_account',
];

// ❌ Bad: Missing fields
excluded_fields: ['password'];
```

### 3. Error Handling

```typescript
// ✅ Good: Graceful error handling
try {
  await auditLogService.log(logData);
} catch (error) {
  this.logger.error('Failed to create audit log', error);
  // Don't break the main operation
}

// ❌ Bad: Let audit errors crash the app
await auditLogService.log(logData); // Throws on error
```

### 4. Tagging

```typescript
// ✅ Good: Meaningful tags for filtering
tags: ['critical', 'role-change', 'admin-action', 'security'];

// ❌ Bad: No tags or useless tags
tags: ['tag1', 'tag2'];
```

### 5. Metadata

```typescript
// ✅ Good: Rich contextual information
metadata: {
  reason: 'User requested account deletion',
  approved_by: 'manager-123',
  ticket_id: 'TICKET-456',
  ip_country: 'US',
}

// ❌ Bad: No context
metadata: {}
```

## Troubleshooting

### Issue: Audit logs not appearing

**Solution:**

```typescript
// Check if enabled
const config = auditLogService['config'];
console.log('Audit enabled:', config.enabled);

// Check decorator injection
console.log('Has auditLogService:', !!this.auditLogService);
```

### Issue: Too many logs (performance)

**Solution:**

```typescript
// Disable READ logging
service.configure({ log_reads: false });

// Exclude high-frequency entities
service.configure({
  excluded_entities: ['sessions', 'tokens', 'metrics']
});

// Enable archiving
service.archiveOldLogs(90DaysAgo);
```

### Issue: Rollback not working

**Solution:**

```typescript
// Check if old_values exists
const log = await service.findById(logId);
if (!log.old_values) {
  throw new Error('Cannot rollback CREATE action - no previous state');
}

// Check if already rolled back
if (log.is_rolled_back) {
  throw new Error('Already rolled back');
}
```

### Issue: Missing change details

**Solution:**

```typescript
// Ensure both old and new values are provided
await auditLogService.log({
  action: 'UPDATE',
  entity_type: 'users',
  entity_id: id,
  user_id: currentUser.id,
  old_values: beforeUpdate, // ← Required for changes
  new_values: afterUpdate, // ← Required for changes
});
```

---

## Support & Resources

- **Documentation**: This guide
- **Database Schemas**: `libs/generator/src/audit/schemas/`
- **Examples**: See test files `*.spec.ts`
- **Issue Tracker**: GitHub Issues

## License

MIT License - See LICENSE file for details

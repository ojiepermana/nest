/**
 * Audit module generator options
 */
export interface AuditModuleOptions {
  moduleName: string;
  withController?: boolean;
  withEntity?: boolean;
}

/**
 * Audit Module Generator
 *
 * Generates NestJS module with audit trail configuration
 * Includes AuditLogService provider and module setup
 */
export class AuditModuleGenerator {
  /**
   * Generate audit module file
   */
  generate(options: AuditModuleOptions): string {
    const { moduleName } = options;
    const className = this.toClassName(moduleName);

    return `import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuditLogService } from './audit-log.service';
import { AuditLogEntry } from './audit-log.interface';

/**
 * ${className}AuditModule
 *
 * Provides audit trail functionality for ${moduleName}
 *
 * Features:
 * - Automatic CRUD operation logging
 * - Change tracking with old/new values
 * - Rollback capability
 * - User activity monitoring
 * - Compliance features (archive, export)
 *
 * @example
 * \`\`\`typescript
 * // In your main module
 * import { ${className}AuditModule } from './${moduleName}-audit.module';
 *
 * @Module({
 *   imports: [${className}AuditModule],
 * })
 * export class AppModule {}
 * \`\`\`
 */
@Module({
  imports: [
    // Register audit log entity
    TypeOrmModule.forFeature([AuditLogEntry]),
  ],
  providers: [AuditLogService],
  exports: [AuditLogService],
})
export class ${className}AuditModule {}
`;
  }

  /**
   * Generate audit configuration file
   */
  generateConfig(options: AuditModuleOptions): string {
    return `import { AuditLogConfig } from './audit-log.interface';

/**
 * Audit Configuration
 *
 * Customize audit logging behavior
 */
export const auditConfig: AuditLogConfig = {
  // Enable/disable audit logging
  enabled: true,

  // Log READ operations (SELECT queries)
  // Warning: Can generate large amounts of data
  log_reads: false,

  // Only log successful operations
  // Set to false to also log failed operations
  log_successful_only: false,

  // Entities to exclude from audit logging
  excluded_entities: [
    'sessions',
    'refresh_tokens',
  ],

  // Fields to exclude from logging (sensitive data)
  excluded_fields: [
    'password',
    'password_hash',
    'token',
    'secret',
    'api_key',
    'access_token',
    'refresh_token',
  ],

  // Auto-archive logs older than X days
  retention_days: 90,

  // Anonymize personally identifiable information
  anonymize_pii: false,
};

/**
 * Get audit config
 */
export function getAuditConfig(): AuditLogConfig {
  return {
    ...auditConfig,
    // Override from environment variables
    enabled: process.env.AUDIT_ENABLED !== 'false',
    log_reads: process.env.AUDIT_LOG_READS === 'true',
    retention_days: parseInt(process.env.AUDIT_RETENTION_DAYS || '90', 10),
  };
}
`;
  }

  /**
   * Generate audit controller for API endpoints
   */
  generateController(options: AuditModuleOptions): string {
    const { moduleName } = options;
    const className = this.toClassName(moduleName);

    return `import {
  Controller,
  Get,
  Post,
  Query,
  Param,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { AuditLogService } from './audit-log.service';
import {
  AuditLogEntry,
  AuditLogFilter,
  RollbackOptions,
  AuditLogStats,
} from './audit-log.interface';

/**
 * ${className}AuditController
 *
 * REST API endpoints for audit trail
 *
 * Endpoints:
 * - GET /audit - Query audit logs
 * - GET /audit/:id - Get specific audit log
 * - GET /audit/entity/:type/:id - Get entity history
 * - GET /audit/user/:userId - Get user activity
 * - GET /audit/stats - Get audit statistics
 * - POST /audit/rollback - Rollback a change
 * - POST /audit/archive - Archive old logs
 * - GET /audit/export - Export logs
 */
@Controller('audit')
// @UseGuards(AuthGuard, RolesGuard)
// @Roles('admin', 'auditor')
export class ${className}AuditController {
  constructor(private readonly auditLogService: AuditLogService) {}

  /**
   * Query audit logs with filters
   *
   * @example
   * GET /audit?entity_type=users&action=UPDATE&start_date=2024-01-01
   */
  @Get()
  async findAll(@Query() filter: AuditLogFilter): Promise<AuditLogEntry[]> {
    return this.auditLogService.find(filter);
  }

  /**
   * Get specific audit log by ID
   *
   * @example
   * GET /audit/123e4567-e89b-12d3-a456-426614174000
   */
  @Get(':id')
  async findOne(@Param('id') id: string): Promise<AuditLogEntry | null> {
    return this.auditLogService.findById(id);
  }

  /**
   * Get entity history (all changes to specific entity)
   *
   * @example
   * GET /audit/entity/users/user-123
   */
  @Get('entity/:type/:id')
  async getEntityHistory(
    @Param('type') entityType: string,
    @Param('id') entityId: string,
    @Query('limit') limit?: number,
  ): Promise<AuditLogEntry[]> {
    return this.auditLogService.getEntityHistory(
      entityType,
      entityId,
      limit || 100,
    );
  }

  /**
   * Get user activity
   *
   * @example
   * GET /audit/user/user-123?start_date=2024-01-01&end_date=2024-12-31
   */
  @Get('user/:userId')
  async getUserActivity(
    @Param('userId') userId: string,
    @Query('start_date') startDate?: string,
    @Query('end_date') endDate?: string,
  ): Promise<AuditLogEntry[]> {
    return this.auditLogService.getUserActivity(
      userId,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  /**
   * Get audit statistics
   *
   * @example
   * GET /audit/stats?start_date=2024-01-01
   */
  @Get('stats')
  async getStats(@Query() filter: AuditLogFilter): Promise<AuditLogStats> {
    return this.auditLogService.getStats(filter);
  }

  /**
   * Rollback a change
   *
   * @example
   * POST /audit/rollback
   * {
   *   "audit_log_id": "123e4567-e89b-12d3-a456-426614174000",
   *   "rolled_back_by": "user-123",
   *   "reason": "Accidental deletion"
   * }
   */
  @Post('rollback')
  @HttpCode(HttpStatus.OK)
  async rollback(@Body() options: RollbackOptions): Promise<AuditLogEntry> {
    return this.auditLogService.rollback(options);
  }

  /**
   * Archive old logs
   *
   * @example
   * POST /audit/archive
   * {
   *   "before_date": "2024-01-01"
   * }
   */
  @Post('archive')
  @HttpCode(HttpStatus.OK)
  async archive(
    @Body('before_date') beforeDate: string,
  ): Promise<{ archived_count: number }> {
    const date = new Date(beforeDate);
    const count = await this.auditLogService.archiveOldLogs(date);
    return { archived_count: count };
  }

  /**
   * Export audit logs
   *
   * @example
   * GET /audit/export?entity_type=users&format=json
   */
  @Get('export')
  async export(@Query() filter: AuditLogFilter): Promise<string> {
    return this.auditLogService.exportLogs(filter);
  }
}
`;
  }

  /**
   * Generate audit entity for TypeORM
   */
  generateEntity(): string {
    return `import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { AuditAction, AuditStatus, ChangeDetail } from './audit-log.interface';

/**
 * AuditLog Entity
 *
 * Database model for audit trail
 */
@Entity('audit_logs')
@Index(['entity_type', 'entity_id'])
@Index(['user_id'])
@Index(['action'])
@Index(['created_at'])
@Index(['status'])
export class AuditLogEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  // Action details
  @Column({
    type: 'varchar',
    length: 20,
  })
  action: AuditAction;

  @Column({
    type: 'varchar',
    length: 100,
  })
  @Index()
  entity_type: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  @Index()
  entity_id?: string;

  // User tracking
  @Column({
    type: 'uuid',
  })
  @Index()
  user_id: string;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  user_name?: string;

  @Column({
    type: 'varchar',
    length: 45,
    nullable: true,
  })
  user_ip?: string;

  @Column({
    type: 'text',
    nullable: true,
  })
  user_agent?: string;

  // Change tracking
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  old_values?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  new_values?: Record<string, any>;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  changes?: ChangeDetail[];

  // Request context
  @Column({
    type: 'varchar',
    length: 500,
    nullable: true,
  })
  endpoint?: string;

  @Column({
    type: 'varchar',
    length: 10,
    nullable: true,
  })
  method?: string;

  @Column({
    type: 'varchar',
    length: 20,
    default: 'SUCCESS',
  })
  status: AuditStatus;

  @Column({
    type: 'text',
    nullable: true,
  })
  error_message?: string;

  // Metadata
  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata?: Record<string, any>;

  @Column({
    type: 'simple-array',
    nullable: true,
  })
  tags?: string[];

  // Timestamps
  @CreateDateColumn()
  created_at: Date;

  // Rollback support
  @Column({
    type: 'boolean',
    default: false,
  })
  @Index()
  is_rolled_back?: boolean;

  @Column({
    type: 'timestamp',
    nullable: true,
  })
  rolled_back_at?: Date;

  @Column({
    type: 'uuid',
    nullable: true,
  })
  rolled_back_by?: string;
}
`;
  }

  /**
   * Generate README for audit module
   */
  generateReadme(options: AuditModuleOptions): string {
    const { moduleName } = options;
    const className = this.toClassName(moduleName);

    return `# ${className} Audit Module

Complete audit trail system for tracking all CRUD operations.

## Features

- ✅ Automatic CRUD operation logging
- ✅ Change tracking (old values → new values)
- ✅ Rollback capability
- ✅ User activity monitoring
- ✅ Compliance features (archive, export)
- ✅ Sensitive data redaction
- ✅ Advanced filtering and search

## Installation

\`\`\`typescript
import { ${className}AuditModule } from './${moduleName}-audit.module';

@Module({
  imports: [
    ${className}AuditModule,
  ],
})
export class AppModule {}
\`\`\`

## Usage

### Automatic Logging with Decorator

\`\`\`typescript
import { AuditLog } from './audit-log.decorator';

@Injectable()
export class UsersService {
  constructor(private readonly auditLogService: AuditLogService) {}

  @AuditLog({
    action: 'CREATE',
    entityType: 'users',
    entityIdParam: 'return',
    newValuesParam: 'return',
  })
  async create(dto: CreateUserDto): Promise<User> {
    // Your create logic
    return this.usersRepository.save(dto);
  }

  @AuditLog({
    action: 'UPDATE',
    entityType: 'users',
    entityIdParam: 'id',
    oldValuesParam: (params) => this.findOne(params[0]),
    newValuesParam: 1,
  })
  async update(id: string, dto: UpdateUserDto): Promise<User> {
    // Your update logic
    return this.usersRepository.save({ id, ...dto });
  }

  @AuditLog({
    action: 'DELETE',
    entityType: 'users',
    entityIdParam: 0,
    oldValuesParam: (params) => this.findOne(params[0]),
  })
  async delete(id: string): Promise<void> {
    // Your delete logic
    await this.usersRepository.delete(id);
  }
}
\`\`\`

### Manual Logging

\`\`\`typescript
await this.auditLogService.log({
  action: 'UPDATE',
  entity_type: 'users',
  entity_id: user.id,
  user_id: currentUser.id,
  user_name: currentUser.name,
  old_values: oldUser,
  new_values: updatedUser,
  tags: ['critical', 'user-management'],
});
\`\`\`

### Query Audit Logs

\`\`\`typescript
// Get all changes to a specific entity
const history = await auditLogService.getEntityHistory('users', 'user-123');

// Get user activity
const activity = await auditLogService.getUserActivity(
  'user-123',
  new Date('2024-01-01'),
  new Date('2024-12-31'),
);

// Filter logs
const logs = await auditLogService.find({
  action: 'DELETE',
  entity_type: 'users',
  start_date: new Date('2024-01-01'),
  tags: ['critical'],
});
\`\`\`

### Rollback Changes

\`\`\`typescript
// Rollback a change
await auditLogService.rollback({
  audit_log_id: 'log-id-here',
  rolled_back_by: 'admin-user-id',
  reason: 'Accidental deletion',
});
\`\`\`

### Get Statistics

\`\`\`typescript
const stats = await auditLogService.getStats({
  start_date: new Date('2024-01-01'),
  end_date: new Date('2024-12-31'),
});

console.log(stats);
// {
//   total_logs: 1000,
//   by_action: { CREATE: 300, UPDATE: 500, DELETE: 200 },
//   by_entity: { users: 600, products: 400 },
//   by_user: { 'user-1': 500, 'user-2': 500 },
//   failed_count: 50,
//   rolled_back_count: 10,
// }
\`\`\`

### Archive Old Logs

\`\`\`typescript
// Archive logs older than 90 days
const beforeDate = new Date();
beforeDate.setDate(beforeDate.getDate() - 90);

const archivedCount = await auditLogService.archiveOldLogs(beforeDate);
console.log(\`Archived \${archivedCount} logs\`);
\`\`\`

## Configuration

Edit \`audit.config.ts\`:

\`\`\`typescript
export const auditConfig: AuditLogConfig = {
  enabled: true,
  log_reads: false, // Set to true to log SELECT queries
  log_successful_only: false, // Log both success and failures
  excluded_entities: ['sessions', 'refresh_tokens'],
  excluded_fields: ['password', 'token', 'secret'],
  retention_days: 90,
  anonymize_pii: false,
};
\`\`\`

## API Endpoints

If using the controller:

- \`GET /audit\` - Query audit logs
- \`GET /audit/:id\` - Get specific log
- \`GET /audit/entity/:type/:id\` - Get entity history
- \`GET /audit/user/:userId\` - Get user activity
- \`GET /audit/stats\` - Get statistics
- \`POST /audit/rollback\` - Rollback a change
- \`POST /audit/archive\` - Archive old logs
- \`GET /audit/export\` - Export logs as JSON

## Database Schema

Run the appropriate schema for your database:

- PostgreSQL: \`libs/generator/src/audit/schemas/postgresql-audit.sql\`
- MySQL: \`libs/generator/src/audit/schemas/mysql-audit.sql\`

## Best Practices

1. **Sensitive Data**: Always configure \`excluded_fields\` to prevent logging passwords, tokens, etc.
2. **Performance**: Don't enable \`log_reads\` in production unless necessary
3. **Retention**: Set appropriate \`retention_days\` and run archive jobs regularly
4. **Rollback**: Test rollback procedures before production use
5. **Access Control**: Restrict audit endpoints to admin/auditor roles only

## Compliance

This audit system supports compliance requirements for:

- SOC 2
- GDPR (with PII anonymization)
- HIPAA
- ISO 27001
- PCI DSS

## License

MIT
`;
  }

  /**
   * Convert module name to class name
   */
  private toClassName(name: string): string {
    return name
      .split('-')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
      .join('');
  }
}

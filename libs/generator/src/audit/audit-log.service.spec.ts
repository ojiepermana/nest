import { Test, TestingModule } from '@nestjs/testing';
import { AuditLogService } from './audit-log.service';
import {
  AuditLogEntry,
  AuditAction,
  CreateAuditLogDto,
  AuditLogFilter,
  RollbackOptions,
} from './audit-log.interface';

describe('AuditLogService', () => {
  let service: AuditLogService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [AuditLogService],
    }).compile();

    service = module.get<AuditLogService>(AuditLogService);
  });

  afterEach(() => {
    // Clear logs after each test
    (service as any).logs = [];
  });

  describe('configure', () => {
    it('should update configuration', () => {
      service.configure({
        enabled: false,
        log_reads: true,
      });

      const config = (service as any).config;
      expect(config.enabled).toBe(false);
      expect(config.log_reads).toBe(true);
    });

    it('should merge with existing config', () => {
      service.configure({ log_reads: true });
      const config = (service as any).config;

      expect(config.enabled).toBe(true); // Original value
      expect(config.log_reads).toBe(true); // Updated value
    });
  });

  describe('log', () => {
    it('should create audit log entry', async () => {
      const dto: CreateAuditLogDto = {
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
        user_name: 'Admin User',
        new_values: { name: 'John Doe', email: 'john@example.com' },
      };

      const result = await service.log(dto);

      expect(result).toBeDefined();
      expect(result.id).toBeDefined();
      expect(result.action).toBe('CREATE');
      expect(result.entity_type).toBe('users');
      expect(result.entity_id).toBe('user-123');
      expect(result.user_id).toBe('admin-1');
      expect(result.status).toBe('SUCCESS');
      expect(result.created_at).toBeInstanceOf(Date);
    });

    it('should calculate changes when old and new values provided', async () => {
      const dto: CreateAuditLogDto = {
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
        old_values: {
          name: 'John Doe',
          email: 'john@example.com',
          role: 'user',
        },
        new_values: {
          name: 'John Smith',
          email: 'john@example.com',
          role: 'admin',
        },
      };

      const result = await service.log(dto);

      expect(result.changes).toBeDefined();
      expect(result.changes).toHaveLength(2); // name and role changed

      const nameChange = result.changes?.find((c) => c.field === 'name');
      expect(nameChange?.old_value).toBe('John Doe');
      expect(nameChange?.new_value).toBe('John Smith');

      const roleChange = result.changes?.find((c) => c.field === 'role');
      expect(roleChange?.old_value).toBe('user');
      expect(roleChange?.new_value).toBe('admin');
    });

    it('should redact sensitive fields', async () => {
      const dto: CreateAuditLogDto = {
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
        new_values: {
          name: 'John Doe',
          email: 'john@example.com',
          password: 'secret123',
          token: 'abc-def-ghi',
        },
      };

      const result = await service.log(dto);

      expect(result.new_values?.password).toBe('[REDACTED]');
      expect(result.new_values?.token).toBe('[REDACTED]');
      expect(result.new_values?.name).toBe('John Doe');
      expect(result.new_values?.email).toBe('john@example.com');
    });

    it('should throw error when audit logging is disabled', async () => {
      service.configure({ enabled: false });

      const dto: CreateAuditLogDto = {
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
      };

      await expect(service.log(dto)).rejects.toThrow('Audit logging is disabled');
    });

    it('should throw error when logging READ and log_reads is false', async () => {
      service.configure({ log_reads: false });

      const dto: CreateAuditLogDto = {
        action: 'READ',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
      };

      await expect(service.log(dto)).rejects.toThrow('Read operations are not logged');
    });

    it('should set default status to SUCCESS', async () => {
      const dto: CreateAuditLogDto = {
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
      };

      const result = await service.log(dto);
      expect(result.status).toBe('SUCCESS');
    });

    it('should use provided status', async () => {
      const dto: CreateAuditLogDto = {
        action: 'DELETE',
        entity_type: 'users',
        entity_id: 'user-123',
        user_id: 'admin-1',
        status: 'FAILED',
        error_message: 'User not found',
      };

      const result = await service.log(dto);
      expect(result.status).toBe('FAILED');
      expect(result.error_message).toBe('User not found');
    });
  });

  describe('find', () => {
    beforeEach(async () => {
      // Create sample logs
      await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'DELETE',
        entity_type: 'products',
        entity_id: 'product-1',
        user_id: 'admin-2',
      });

      await service.log({
        action: 'CREATE',
        entity_type: 'products',
        entity_id: 'product-2',
        user_id: 'admin-1',
        tags: ['important'],
      });
    });

    it('should return all logs when no filter provided', async () => {
      const result = await service.find({});
      expect(result).toHaveLength(4);
    });

    it('should filter by entity_type', async () => {
      const result = await service.find({ entity_type: 'users' });
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.entity_type === 'users')).toBe(true);
    });

    it('should filter by entity_id', async () => {
      const result = await service.find({ entity_id: 'user-1' });
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.entity_id === 'user-1')).toBe(true);
    });

    it('should filter by user_id', async () => {
      const result = await service.find({ user_id: 'admin-1' });
      expect(result).toHaveLength(3);
      expect(result.every((log) => log.user_id === 'admin-1')).toBe(true);
    });

    it('should filter by action (single)', async () => {
      const result = await service.find({ action: 'CREATE' });
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.action === 'CREATE')).toBe(true);
    });

    it('should filter by action (array)', async () => {
      const result = await service.find({ action: ['CREATE', 'UPDATE'] });
      expect(result).toHaveLength(3);
    });

    it('should filter by status', async () => {
      await service.log({
        action: 'DELETE',
        entity_type: 'users',
        entity_id: 'user-2',
        user_id: 'admin-1',
        status: 'FAILED',
      });

      const result = await service.find({ status: 'FAILED' });
      expect(result).toHaveLength(1);
      expect(result[0].status).toBe('FAILED');
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const result = await service.find({
        start_date: yesterday,
        end_date: tomorrow,
      });

      expect(result.length).toBeGreaterThan(0);
    });

    it('should filter by tags', async () => {
      const result = await service.find({ tags: ['important'] });
      expect(result).toHaveLength(1);
      expect(result[0].tags).toContain('important');
    });

    it('should sort by created_at DESC (newest first)', async () => {
      const result = await service.find({});

      for (let i = 0; i < result.length - 1; i++) {
        expect(result[i].created_at.getTime()).toBeGreaterThanOrEqual(
          result[i + 1].created_at.getTime(),
        );
      }
    });

    it('should apply pagination with limit', async () => {
      const result = await service.find({ limit: 2 });
      expect(result).toHaveLength(2);
    });

    it('should apply pagination with offset', async () => {
      const allLogs = await service.find({});
      const result = await service.find({ offset: 2 });

      expect(result).toHaveLength(2);
      expect(result[0].id).toBe(allLogs[2].id);
    });
  });

  describe('findById', () => {
    it('should return log by ID', async () => {
      const created = await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      const result = await service.findById(created.id);
      expect(result).toBeDefined();
      expect(result?.id).toBe(created.id);
    });

    it('should return null for non-existent ID', async () => {
      const result = await service.findById('non-existent-id');
      expect(result).toBeNull();
    });
  });

  describe('getEntityHistory', () => {
    beforeEach(async () => {
      await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-2',
        user_id: 'admin-1',
      });
    });

    it('should return all changes for specific entity', async () => {
      const result = await service.getEntityHistory('users', 'user-1');

      expect(result).toHaveLength(2);
      expect(result.every((log) => log.entity_id === 'user-1')).toBe(true);
    });

    it('should respect limit parameter', async () => {
      const result = await service.getEntityHistory('users', 'user-1', 1);
      expect(result).toHaveLength(1);
    });
  });

  describe('getUserActivity', () => {
    beforeEach(async () => {
      const now = new Date();
      const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      // Manually set created_at for testing
      const log1 = await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });
      log1.created_at = yesterday;

      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'DELETE',
        entity_type: 'products',
        entity_id: 'product-1',
        user_id: 'admin-2',
      });
    });

    it('should return all activity for user', async () => {
      const result = await service.getUserActivity('admin-1');
      expect(result).toHaveLength(2);
      expect(result.every((log) => log.user_id === 'admin-1')).toBe(true);
    });

    it('should filter by date range', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const result = await service.getUserActivity('admin-1', hourAgo);
      expect(result).toHaveLength(1); // Only the UPDATE log from now
    });
  });

  describe('rollback', () => {
    it('should rollback a change', async () => {
      const created = await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
        old_values: { name: 'John', role: 'user' },
        new_values: { name: 'Jane', role: 'admin' },
      });

      const options: RollbackOptions = {
        audit_log_id: created.id,
        rolled_back_by: 'super-admin',
        reason: 'Accidental change',
      };

      const result = await service.rollback(options);

      expect(result.is_rolled_back).toBe(true);
      expect(result.rolled_back_at).toBeInstanceOf(Date);
      expect(result.rolled_back_by).toBe('super-admin');

      // Check RESTORE log was created
      const logs = await service.find({ action: 'RESTORE' });
      expect(logs).toHaveLength(1);
      expect(logs[0].old_values).toEqual(created.new_values);
      expect(logs[0].new_values).toEqual(created.old_values);
    });

    it('should throw error if log not found', async () => {
      const options: RollbackOptions = {
        audit_log_id: 'non-existent',
        rolled_back_by: 'admin',
      };

      await expect(service.rollback(options)).rejects.toThrow('Audit log not found');
    });

    it('should throw error if already rolled back', async () => {
      const created = await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
        old_values: { name: 'John' },
        new_values: { name: 'Jane' },
      });

      const options: RollbackOptions = {
        audit_log_id: created.id,
        rolled_back_by: 'admin',
      };

      await service.rollback(options);

      // Try to rollback again
      await expect(service.rollback(options)).rejects.toThrow(
        'This change has already been rolled back',
      );
    });

    it('should throw error if no old values available', async () => {
      const created = await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
        new_values: { name: 'John' },
      });

      const options: RollbackOptions = {
        audit_log_id: created.id,
        rolled_back_by: 'admin',
      };

      await expect(service.rollback(options)).rejects.toThrow(
        'Cannot rollback: no previous state available',
      );
    });

    it('should support validate-only mode', async () => {
      const created = await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
        old_values: { name: 'John' },
        new_values: { name: 'Jane' },
      });

      const options: RollbackOptions = {
        audit_log_id: created.id,
        rolled_back_by: 'admin',
        validate: true,
      };

      const result = await service.rollback(options);

      // Should return log without actually rolling back
      expect(result.is_rolled_back).toBeUndefined();
      expect(result.rolled_back_at).toBeUndefined();
    });
  });

  describe('getStats', () => {
    beforeEach(async () => {
      // Create diverse logs
      await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'CREATE',
        entity_type: 'products',
        entity_id: 'product-1',
        user_id: 'admin-1',
      });

      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-2',
      });

      await service.log({
        action: 'DELETE',
        entity_type: 'products',
        entity_id: 'product-1',
        user_id: 'admin-1',
        status: 'FAILED',
      });

      const log = await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-2',
        user_id: 'admin-1',
        old_values: { name: 'Old' },
        new_values: { name: 'New' },
      });

      // Rollback one
      await service.rollback({
        audit_log_id: log.id,
        rolled_back_by: 'admin-1',
      });
    });

    it('should return comprehensive statistics', async () => {
      const stats = await service.getStats();

      expect(stats.total_logs).toBe(6); // 5 original + 1 RESTORE from rollback
      expect(stats.failed_count).toBe(1);
      expect(stats.rolled_back_count).toBe(1);
    });

    it('should count by action', async () => {
      const stats = await service.getStats();

      expect(stats.by_action.CREATE).toBe(2);
      expect(stats.by_action.UPDATE).toBe(2);
      expect(stats.by_action.DELETE).toBe(1);
      expect(stats.by_action.RESTORE).toBe(1);
    });

    it('should count by entity', async () => {
      const stats = await service.getStats();

      expect(stats.by_entity.users).toBe(4);
      expect(stats.by_entity.products).toBe(2);
    });

    it('should count by user', async () => {
      const stats = await service.getStats();

      expect(stats.by_user['admin-1']).toBe(5);
      expect(stats.by_user['admin-2']).toBe(1);
    });

    it('should count by status', async () => {
      const stats = await service.getStats();

      expect(stats.by_status.SUCCESS).toBe(5);
      expect(stats.by_status.FAILED).toBe(1);
    });

    it('should filter stats by date range', async () => {
      const now = new Date();
      const hourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const stats = await service.getStats({
        start_date: hourAgo,
      });

      expect(stats.total_logs).toBeGreaterThan(0);
    });
  });

  describe('archiveOldLogs', () => {
    beforeEach(async () => {
      const now = new Date();
      const old = new Date(now.getTime() - 100 * 24 * 60 * 60 * 1000); // 100 days ago

      // Create old log
      const oldLog = await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });
      oldLog.created_at = old;

      // Create recent log
      await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });
    });

    it('should archive old logs', async () => {
      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - 90);

      const archivedCount = await service.archiveOldLogs(beforeDate);

      expect(archivedCount).toBe(1);

      // Check remaining logs
      const remaining = await service.find({});
      expect(remaining).toHaveLength(1);
    });

    it('should not archive rolled back logs', async () => {
      const log = await service.log({
        action: 'UPDATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
        old_values: { name: 'Old' },
        new_values: { name: 'New' },
      });

      // Make it old
      const old = new Date();
      old.setDate(old.getDate() - 100);
      log.created_at = old;

      // Rollback it
      await service.rollback({
        audit_log_id: log.id,
        rolled_back_by: 'admin',
      });

      const beforeDate = new Date();
      beforeDate.setDate(beforeDate.getDate() - 90);

      await service.archiveOldLogs(beforeDate);

      // Rolled back log should still exist
      const found = await service.findById(log.id);
      expect(found).toBeDefined();
    });
  });

  describe('exportLogs', () => {
    beforeEach(async () => {
      await service.log({
        action: 'CREATE',
        entity_type: 'users',
        entity_id: 'user-1',
        user_id: 'admin-1',
      });
    });

    it('should export logs as JSON string', async () => {
      const result = await service.exportLogs({});

      expect(typeof result).toBe('string');

      const parsed = JSON.parse(result);
      expect(Array.isArray(parsed)).toBe(true);
      expect(parsed.length).toBeGreaterThan(0);
    });

    it('should export filtered logs', async () => {
      await service.log({
        action: 'UPDATE',
        entity_type: 'products',
        entity_id: 'product-1',
        user_id: 'admin-1',
      });

      const result = await service.exportLogs({
        entity_type: 'users',
      });

      const parsed = JSON.parse(result);
      expect(parsed).toHaveLength(1);
      expect(parsed[0].entity_type).toBe('users');
    });
  });
});

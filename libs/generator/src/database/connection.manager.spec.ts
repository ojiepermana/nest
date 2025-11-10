/**
 * Connection Manager Tests - Database Version Validation
 */

import { DatabaseConnectionManager } from './connection.manager';
import type { DatabaseConfig } from '../interfaces/generator.interface';

describe('DatabaseConnectionManager - Version Validation', () => {
  let mockPgPool: any;
  let mockMysqlPool: any;

  beforeEach(() => {
    // Mock PostgreSQL pool
    mockPgPool = {
      connect: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn(),
      }),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
      totalCount: 10,
      idleCount: 5,
      waitingCount: 0,
    };

    // Mock MySQL pool
    mockMysqlPool = {
      getConnection: jest.fn().mockResolvedValue({
        query: jest.fn(),
        release: jest.fn(),
      }),
      query: jest.fn(),
      end: jest.fn(),
      on: jest.fn(),
    };
  });

  describe('PostgreSQL Version Validation', () => {
    it('should validate PostgreSQL 18.1 as compatible', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      // Mock version query response
      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: '18.1' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('18.1');
      expect(result.minimumVersion).toBe('18.0.0');
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate PostgreSQL 20.0 as compatible', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: '20.0' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('20.0');
      expect(result.warnings).toHaveLength(0);
    });

    it('should detect PostgreSQL 16.2 as incompatible', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: '16.2' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.version).toBe('16.2');
      expect(result.minimumVersion).toBe('18.0.0');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('PostgreSQL 16.2 detected');
      expect(result.warnings.some((w) => w.includes('UUID v7'))).toBe(true);
    });

    it('should detect PostgreSQL 15.0 as incompatible', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: '15.0' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes('15.0 detected'))).toBe(true);
    });

    it('should handle PostgreSQL version with Ubuntu string', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: '18.1 (Ubuntu 18.1-1.pgdg22.04+1)' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toContain('18.1');
    });

    it('should handle unparseable PostgreSQL version', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [{ version: 'unknown-format' }],
        rowCount: 1,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Could not parse'))).toBe(true);
    });
  });

  describe('MySQL Version Validation', () => {
    it('should validate MySQL 8.0.35 as compatible', async () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).mysqlPool = mockMysqlPool;

      mockMysqlPool.query.mockResolvedValueOnce([
        [{ version: '8.0.35' }],
        [],
      ]);

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('8.0.35');
      expect(result.minimumVersion).toBe('8.0.0');
      expect(result.warnings).toHaveLength(0);
    });

    it('should validate MySQL 8.4.0 as compatible', async () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).mysqlPool = mockMysqlPool;

      mockMysqlPool.query.mockResolvedValueOnce([
        [{ version: '8.4.0' }],
        [],
      ]);

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toBe('8.4.0');
    });

    it('should detect MySQL 5.7 as incompatible', async () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).mysqlPool = mockMysqlPool;

      mockMysqlPool.query.mockResolvedValueOnce([
        [{ version: '5.7.40' }],
        [],
      ]);

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.version).toBe('5.7.40');
      expect(result.minimumVersion).toBe('8.0.0');
      expect(result.warnings.length).toBeGreaterThan(0);
      expect(result.warnings[0]).toContain('MySQL 5.7 detected');
      expect(result.warnings.some((w) => w.includes('JSON functions'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('Window functions'))).toBe(true);
      expect(result.warnings.some((w) => w.includes('CTE'))).toBe(true);
    });

    it('should handle MySQL version with Ubuntu string', async () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).mysqlPool = mockMysqlPool;

      mockMysqlPool.query.mockResolvedValueOnce([
        [{ version: '8.0.35-0ubuntu0.22.04.1' }],
        [],
      ]);

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(true);
      expect(result.version).toContain('8.0.35');
    });

    it('should handle unparseable MySQL version', async () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).mysqlPool = mockMysqlPool;

      mockMysqlPool.query.mockResolvedValueOnce([
        [{ version: 'unknown-format' }],
        [],
      ]);

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.warnings.some((w) => w.includes('Could not parse'))).toBe(true);
    });
  });

  describe('Error Handling', () => {
    it('should handle query errors gracefully', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockRejectedValueOnce(new Error('Connection failed'));

      const result = await manager.validateDatabaseVersion();

      expect(result.valid).toBe(false);
      expect(result.version).toBe('Unknown');
      expect(result.warnings.some((w) => w.includes('Could not determine'))).toBe(true);
    });

    it('should handle missing version in response', async () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'testdb',
        username: 'test',
        password: 'test',
      };

      const manager = new DatabaseConnectionManager(config);
      (manager as any).pgPool = mockPgPool;

      mockPgPool.query.mockResolvedValueOnce({
        rows: [],
        rowCount: 0,
      });

      const result = await manager.validateDatabaseVersion();

      expect(result.version).toBe('Unknown');
      expect(result.warnings.some((w) => w.includes('Could not parse'))).toBe(true);
    });
  });
});

import { DatabaseConnectionManager } from '../database/connection.manager';
import { DatabaseConfig } from '../interfaces/generator.interface';

describe('DatabaseConnectionManager', () => {
  describe('constructor', () => {
    it('should create instance with PostgreSQL config', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(manager).toBeInstanceOf(DatabaseConnectionManager);
      expect(manager.getDatabaseType()).toBe('postgresql');
      expect(manager.isConnected()).toBe(false);
    });

    it('should create instance with MySQL config', () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test_db',
        username: 'test_user',
        password: 'test_pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(manager).toBeInstanceOf(DatabaseConnectionManager);
      expect(manager.getDatabaseType()).toBe('mysql');
      expect(manager.isConnected()).toBe(false);
    });
  });

  describe('convertPlaceholders', () => {
    it('should convert PostgreSQL placeholders to MySQL placeholders', () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);

      // Access private method through type assertion for testing
      const converted = (manager as any).convertPlaceholders(
        'SELECT * FROM users WHERE id = $1 AND status = $2',
      );

      expect(converted).toBe('SELECT * FROM users WHERE id = ? AND status = ?');
    });

    it('should handle multiple placeholders', () => {
      const config: DatabaseConfig = {
        type: 'mysql',
        host: 'localhost',
        port: 3306,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);

      const converted = (manager as any).convertPlaceholders(
        'INSERT INTO users (name, email, age) VALUES ($1, $2, $3)',
      );

      expect(converted).toBe(
        'INSERT INTO users (name, email, age) VALUES (?, ?, ?)',
      );
    });
  });

  describe('getPoolStats', () => {
    it('should return default stats when not connected', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);
      const stats = manager.getPoolStats();

      expect(stats).toEqual({
        totalCount: 0,
        idleCount: 0,
        waitingCount: 0,
      });
    });
  });

  // Note: Actual connection tests would require a real database
  // These would be integration tests, not unit tests

  describe('connection methods (unit)', () => {
    it('should have connect method', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(typeof manager.connect).toBe('function');
    });

    it('should have disconnect method', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(typeof manager.disconnect).toBe('function');
    });

    it('should have testConnection method', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(typeof manager.testConnection).toBe('function');
    });

    it('should have query method', () => {
      const config: DatabaseConfig = {
        type: 'postgresql',
        host: 'localhost',
        port: 5432,
        database: 'test',
        username: 'user',
        password: 'pass',
      };

      const manager = new DatabaseConnectionManager(config);
      expect(typeof manager.query).toBe('function');
    });
  });
});

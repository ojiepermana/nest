/**
 * Database Setup Service Tests
 */

import { DatabaseSetupService } from './setup.service';
import { DatabaseConnectionManager } from './connection.manager';

describe('DatabaseSetupService', () => {
  let service: DatabaseSetupService;
  let mockConnection: jest.Mocked<DatabaseConnectionManager>;

  beforeEach(() => {
    mockConnection = {
      getDatabaseType: jest.fn().mockReturnValue('postgresql'),
      query: jest.fn(),
    } as any;

    service = new DatabaseSetupService(mockConnection);
  });

  describe('checkSchemaExists', () => {
    it('should return true when schema exists (PostgreSQL)', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      const result = await service.checkSchemaExists('meta');

      expect(result).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.schemata'),
        ['meta'],
      );
    });

    it('should return false when schema does not exist (PostgreSQL)', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ exists: false }],
        rowCount: 1,
      });

      const result = await service.checkSchemaExists('meta');

      expect(result).toBe(false);
    });

    it('should check schema existence for MySQL', async () => {
      mockConnection.getDatabaseType.mockReturnValue('mysql');
      mockConnection.query.mockResolvedValue({
        rows: [{ schema_name: 'meta' }],
        rowCount: 1,
      });

      const result = await service.checkSchemaExists('meta');

      expect(result).toBe(true);
    });
  });

  describe('checkTableExists', () => {
    it('should return true when table exists (PostgreSQL)', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      const result = await service.checkTableExists('meta', 'table_metadata');

      expect(result).toBe(true);
      expect(mockConnection.query).toHaveBeenCalledWith(
        expect.stringContaining('information_schema.tables'),
        ['meta', 'table_metadata'],
      );
    });

    it('should return false when table does not exist (PostgreSQL)', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ exists: false }],
        rowCount: 1,
      });

      const result = await service.checkTableExists('meta', 'nonexistent');

      expect(result).toBe(false);
    });

    it('should check table existence for MySQL', async () => {
      mockConnection.getDatabaseType.mockReturnValue('mysql');
      mockConnection.query.mockResolvedValue({
        rows: [],
        rowCount: 0,
      });

      const result = await service.checkTableExists('meta', 'table_metadata');

      expect(result).toBe(false);
    });
  });

  describe('splitSQLStatements', () => {
    it('should split SQL by semicolons', () => {
      const sql = 'CREATE TABLE test (id INT); SELECT 1; INSERT INTO test VALUES (1);';
      const statements = (service as any).splitSQLStatements(sql);

      expect(statements).toHaveLength(3);
      expect(statements[0]).toContain('CREATE TABLE');
      expect(statements[1]).toContain('SELECT 1');
      expect(statements[2]).toContain('INSERT INTO');
    });

    it('should ignore semicolons in strings', () => {
      const sql = "INSERT INTO test VALUES ('hello;world'); SELECT 1;";
      const statements = (service as any).splitSQLStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain("'hello;world'");
      expect(statements[1]).toContain('SELECT 1');
    });

    it('should remove comments', () => {
      const sql = '-- This is a comment\nSELECT 1; -- Another comment\nSELECT 2;';
      const statements = (service as any).splitSQLStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0]).not.toContain('comment');
    });

    it('should handle empty statements', () => {
      const sql = 'SELECT 1;; ; SELECT 2;';
      const statements = (service as any).splitSQLStatements(sql);

      expect(statements).toHaveLength(2);
      expect(statements[0]).toContain('SELECT 1');
      expect(statements[1]).toContain('SELECT 2');
    });
  });

  describe('validateSchema', () => {
    it('should return valid when all required components exist', async () => {
      // Mock schema exists
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      // Mock tables exist
      mockConnection.query
        .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }) // table_metadata
        .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }) // column_metadata
        .mockResolvedValueOnce({ rows: [{ exists: true }], rowCount: 1 }); // generated_files

      // Mock column checks
      mockConnection.query
        .mockResolvedValueOnce({
          rows: [
            { column_name: 'id' },
            { column_name: 'schema_name' },
            { column_name: 'table_name' },
            { column_name: 'has_soft_delete' },
          ],
          rowCount: 4,
        })
        .mockResolvedValueOnce({
          rows: [
            { column_name: 'id' },
            { column_name: 'table_metadata_id' },
            { column_name: 'column_name' },
            { column_name: 'data_type' },
          ],
          rowCount: 4,
        });

      const result = await service.validateSchema('meta');

      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should return invalid when schema does not exist', async () => {
      mockConnection.query.mockResolvedValue({
        rows: [{ exists: false }],
        rowCount: 1,
      });

      const result = await service.validateSchema('meta');

      expect(result.valid).toBe(false);
      expect(result.errors).toContain('Schema "meta" does not exist');
    });

    it('should return invalid when required table is missing', async () => {
      // Schema exists
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      // table_metadata exists
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ exists: true }],
        rowCount: 1,
      });

      // column_metadata missing
      mockConnection.query.mockResolvedValueOnce({
        rows: [{ exists: false }],
        rowCount: 1,
      });

      const result = await service.validateSchema('meta');

      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });
});

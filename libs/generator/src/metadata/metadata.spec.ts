/**
 * Metadata Service & Repository Unit Tests
 */

import { MetadataRepository } from './metadata.repository';
import { MetadataService } from './metadata.service';
import type { DatabaseConnectionManager } from '../database/connection.manager';
import type { IDatabaseDialect } from '../interfaces/base.interface';
import type {
  TableMetadata,
  ColumnMetadata,
  GeneratedFile,
} from '../interfaces/generator.interface';

// Mock database connection
const mockConnection = {
  query: jest.fn(),
} as unknown as DatabaseConnectionManager;

// Mock dialect
const mockDialect: IDatabaseDialect = {
  quoteIdentifier: (name: string) => `"${name}"`,
  mapDataType: (type: string) => type.toUpperCase(),
  generateUUID: () => 'uuid_generate_v7()',
  buildPagination: (page: number, limit: number) => `LIMIT ${limit} OFFSET ${(page - 1) * limit}`,
  buildLike: (column: string, value: string) => `${column} ILIKE ${value}`,
  jsonExtract: (column: string, path: string) => `${column}->>'${path}'`,
  arrayContains: (column: string, value: string) => `${column} @> ARRAY['${value}']`,
  getParameterPlaceholder: (index: number) => `$${index}`,
};

describe('MetadataRepository', () => {
  let repository: MetadataRepository;

  beforeEach(() => {
    repository = new MetadataRepository(mockConnection, mockDialect);
    jest.clearAllMocks();
  });

  describe('getTableMetadata', () => {
    it('should fetch table metadata by schema and table name', async () => {
      const mockTable: TableMetadata = {
        id: '123',
        schema_name: 'public',
        table_name: 'users',
        has_soft_delete: true,
        has_created_by: true,
        primary_key_column: 'id',
        primary_key_type: 'uuid',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [mockTable],
      });

      const result = await repository.getTableMetadata('public', 'users');

      expect(result).toEqual(mockTable);
      expect(mockConnection.query).toHaveBeenCalledWith(expect.stringContaining('SELECT *'), [
        'public',
        'users',
      ]);
    });

    it('should return null if table not found', async () => {
      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await repository.getTableMetadata('public', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('getAllTableMetadata', () => {
    it('should fetch all active table metadata', async () => {
      const mockTables: TableMetadata[] = [
        {
          id: '1',
          schema_name: 'public',
          table_name: 'users',
          has_soft_delete: true,
          has_created_by: true,
          primary_key_column: 'id',
          primary_key_type: 'uuid',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
        {
          id: '2',
          schema_name: 'public',
          table_name: 'posts',
          has_soft_delete: false,
          has_created_by: true,
          primary_key_column: 'id',
          primary_key_type: 'uuid',
          status: 'active',
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
      ];

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: mockTables,
      });

      const result = await repository.getAllTableMetadata();

      expect(result).toEqual(mockTables);
      expect(result).toHaveLength(2);
    });
  });

  describe('getColumnsByTableId', () => {
    it('should fetch columns for a table', async () => {
      const mockColumns: ColumnMetadata[] = [
        {
          id: '1',
          table_id: '123',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          is_filterable: false,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
        {
          id: '2',
          table_id: '123',
          column_name: 'email',
          data_type: 'varchar',
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          is_filterable: true,
          is_searchable: true,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
      ];

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: mockColumns,
      });

      const result = await repository.getColumnsByTableId('123');

      expect(result).toEqual(mockColumns);
      expect(result).toHaveLength(2);
    });
  });

  describe('getForeignKeyColumns', () => {
    it('should fetch only foreign key columns', async () => {
      const mockColumns: ColumnMetadata[] = [
        {
          id: '1',
          table_id: '123',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          is_filterable: false,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
        {
          id: '2',
          table_id: '123',
          column_name: 'user_id',
          data_type: 'uuid',
          is_nullable: false,
          is_unique: false,
          is_primary_key: false,
          ref_schema: 'public',
          ref_table: 'users',
          ref_column: 'id',
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
      ];

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: mockColumns,
      });

      const result = await repository.getForeignKeyColumns('123');

      expect(result).toHaveLength(1);
      expect(result[0].column_name).toBe('user_id');
      expect(result[0].ref_table).toBe('users');
    });
  });

  describe('saveGeneratedFile', () => {
    it('should save generated file and return with id', async () => {
      const mockFile: GeneratedFile = {
        id: 'file-123',
        table_id: '123',
        file_type: 'dto',
        file_path: '/src/users/dto/create-user.dto.ts',
        file_name: 'create-user.dto.ts',
        checksum: 'abc123',
        last_generated_at: new Date(),
        created_at: new Date(),
        updated_at: new Date(),
      };

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [mockFile],
      });

      const result = await repository.saveGeneratedFile({
        table_id: '123',
        file_type: 'dto',
        file_path: '/src/users/dto/create-user.dto.ts',
        file_name: 'create-user.dto.ts',
        checksum: 'abc123',
        last_generated_at: new Date(),
      });

      expect(result).toEqual(mockFile);
      expect(mockConnection.query).toHaveBeenCalled();
    });
  });

  describe('getFilterableColumns', () => {
    it('should return only filterable columns', async () => {
      const mockColumns: ColumnMetadata[] = [
        {
          id: '1',
          table_id: '123',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          is_filterable: false,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
        {
          id: '2',
          table_id: '123',
          column_name: 'email',
          data_type: 'varchar',
          is_nullable: false,
          is_unique: true,
          is_primary_key: false,
          is_filterable: true,
          is_searchable: true,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 2,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
      ];

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: mockColumns,
      });

      const result = await repository.getFilterableColumns('123');

      expect(result).toHaveLength(1);
      expect(result[0].column_name).toBe('email');
    });
  });
});

describe('MetadataService', () => {
  let service: MetadataService;

  beforeEach(() => {
    service = new MetadataService(mockConnection, mockDialect, 1000); // 1 second cache
    jest.clearAllMocks();
  });

  describe('caching', () => {
    it('should cache table metadata', async () => {
      const mockTable: TableMetadata = {
        id: '123',
        schema_name: 'public',
        table_name: 'users',
        has_soft_delete: true,
        has_created_by: true,
        primary_key_column: 'id',
        primary_key_type: 'uuid',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [mockTable],
      });

      // First call - should query database
      const result1 = await service.getTableMetadata('public', 'users');
      expect(mockConnection.query).toHaveBeenCalledTimes(1);

      // Second call - should use cache
      const result2 = await service.getTableMetadata('public', 'users');
      expect(mockConnection.query).toHaveBeenCalledTimes(1); // Still 1, not 2

      expect(result1).toEqual(result2);
    });

    it('should invalidate cache when requested', async () => {
      const mockTable: TableMetadata = {
        id: '123',
        schema_name: 'public',
        table_name: 'users',
        has_soft_delete: true,
        has_created_by: true,
        primary_key_column: 'id',
        primary_key_type: 'uuid',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [mockTable],
      });

      await service.getTableMetadata('public', 'users');
      service.invalidateCache();
      await service.getTableMetadata('public', 'users');

      expect(mockConnection.query).toHaveBeenCalledTimes(2);
    });
  });

  describe('getCompleteTableConfig', () => {
    it('should fetch table, columns, and foreign keys together', async () => {
      const mockTable: TableMetadata = {
        id: '123',
        schema_name: 'public',
        table_name: 'users',
        has_soft_delete: true,
        has_created_by: true,
        primary_key_column: 'id',
        primary_key_type: 'uuid',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      const mockColumns: ColumnMetadata[] = [
        {
          id: '1',
          table_id: '123',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_unique: true,
          is_primary_key: true,
          is_filterable: false,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 1,
          created_at: new Date(),
          updated_at: new Date(),
          created_by: 'admin',
        },
      ];

      (mockConnection.query as jest.Mock)
        .mockResolvedValueOnce({ rows: [mockTable] })
        .mockResolvedValueOnce({ rows: mockColumns })
        .mockResolvedValueOnce({ rows: [] });

      const result = await service.getCompleteTableConfig('public', 'users');

      expect(result).not.toBeNull();
      expect(result?.table).toEqual(mockTable);
      expect(result?.columns).toEqual(mockColumns);
      expect(result?.foreignKeys).toEqual([]);
    });

    it('should return null if table not found', async () => {
      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await service.getCompleteTableConfig('public', 'nonexistent');

      expect(result).toBeNull();
    });
  });

  describe('hasFeature', () => {
    it('should check if table has soft delete', async () => {
      const mockTable: TableMetadata = {
        id: '123',
        schema_name: 'public',
        table_name: 'users',
        has_soft_delete: true,
        has_created_by: true,
        primary_key_column: 'id',
        primary_key_type: 'uuid',
        status: 'active',
        created_at: new Date(),
        updated_at: new Date(),
        created_by: 'admin',
      };

      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [mockTable],
      });

      const result = await service.hasFeature('public', 'users', 'soft_delete');

      expect(result).toBe(true);
    });

    it('should return false for non-existent table', async () => {
      (mockConnection.query as jest.Mock).mockResolvedValue({
        rows: [],
      });

      const result = await service.hasFeature('public', 'nonexistent', 'soft_delete');

      expect(result).toBe(false);
    });
  });

  describe('getCacheStats', () => {
    it('should return cache statistics', () => {
      const stats = service.getCacheStats();

      expect(stats).toHaveProperty('size');
      expect(stats).toHaveProperty('keys');
      expect(stats).toHaveProperty('ttl');
      expect(stats.ttl).toBe(1000);
    });
  });
});

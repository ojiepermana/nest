/**
 * Entity Generator Tests
 *
 * Tests for TypeORM entity generation
 */

import { EntityGenerator } from './entity.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

describe('EntityGenerator', () => {
  let mockTableMetadata: TableMetadata;
  let mockColumns: ColumnMetadata[];

  beforeEach(() => {
    mockTableMetadata = {
      table_name: 'users',
      schema_name: 'public',
    } as TableMetadata;

    mockColumns = [
      {
        column_name: 'id',
        data_type: 'integer',
        is_nullable: false,
        is_primary_key: true,
        is_unique: false,
        is_filterable: true,
        is_searchable: false,
        is_required: true,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 1,
        default_value: 'nextval(users_id_seq)',
      } as ColumnMetadata,
      {
        column_name: 'email',
        data_type: 'varchar',
        is_nullable: false,
        is_primary_key: false,
        is_unique: true,
        is_filterable: true,
        is_searchable: true,
        is_required: true,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 2,
        max_length: 255,
      } as ColumnMetadata,
      {
        column_name: 'name',
        data_type: 'varchar',
        is_nullable: true,
        is_primary_key: false,
        is_unique: false,
        is_filterable: true,
        is_searchable: true,
        is_required: false,
        display_in_list: true,
        display_in_form: true,
        display_in_detail: true,
        column_order: 3,
        max_length: 100,
      } as ColumnMetadata,
    ];
  });

  describe('Basic Entity Generation', () => {
    it('should generate basic entity class', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Entity('users')");
      expect(result).toContain('export class Users {');
    });

    it('should use custom entity name if provided', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        entityName: 'CustomUser',
      });

      const result = generator.generate();

      expect(result).toContain('export class CustomUser {');
    });

    it('should include schema in entity decorator if non-public', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        schema: 'custom_schema',
      });

      const result = generator.generate();

      expect(result).toContain("@Entity('users', { schema: 'custom_schema' })");
    });
  });

  describe('Import Generation', () => {
    it('should generate correct basic imports', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('import { ');
      expect(result).toContain('Entity');
      expect(result).toContain('Column');
      expect(result).toContain('PrimaryGeneratedColumn');
    });

    it('should include Index import when unique columns exist', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('Index');
    });

    it('should include timestamp decorators import when timestamp columns exist', () => {
      const columnsWithTimestamps = [
        ...mockColumns,
        {
          column_name: 'created_at',
          data_type: 'timestamp',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 10,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithTimestamps, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('CreateDateColumn');
    });

    it('should include DeleteDateColumn when soft delete enabled', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSoftDelete: true,
      });

      const result = generator.generate();

      expect(result).toContain('DeleteDateColumn');
    });
  });

  describe('Primary Key Generation', () => {
    it('should generate @PrimaryGeneratedColumn for auto-increment ID', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@PrimaryGeneratedColumn()');
      expect(result).toContain('id: number;');
    });

    it('should generate @PrimaryGeneratedColumn with uuid strategy', () => {
      const columnsWithUuid = [
        {
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_primary_key: true,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 1,
          default_value: 'uuid_generate_v4()',
        } as ColumnMetadata,
        ...mockColumns.slice(1),
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithUuid, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@PrimaryGeneratedColumn('uuid')");
      expect(result).toContain('id: string;');
    });

    it('should generate @PrimaryColumn for non-auto-increment PK', () => {
      const columnsWithManualPk = [
        {
          column_name: 'user_code',
          data_type: 'varchar',
          is_nullable: false,
          is_primary_key: true,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 1,
          max_length: 20,
        } as ColumnMetadata,
        ...mockColumns.slice(1),
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithManualPk, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@PrimaryColumn');
      expect(result).toContain('userCode: string;');
    });
  });

  describe('Column Generation', () => {
    it('should generate @Column decorator with correct properties', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@Column');
      expect(result).toContain('email: string;');
      expect(result).toContain('name?: string;');
    });

    it('should include column name in decorator if different from property', () => {
      const columnsWithSnakeCase = [
        {
          column_name: 'first_name',
          data_type: 'varchar',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: true,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 1,
          max_length: 50,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithSnakeCase, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("name: 'first_name'");
      expect(result).toContain('firstName: string;');
    });

    it('should include unique: true for unique columns', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('unique: true');
    });

    it('should include nullable: true for nullable columns', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('nullable: true');
    });

    it('should include length for varchar columns', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('length: 255');
      expect(result).toContain('length: 100');
    });
  });

  describe('Timestamp Columns', () => {
    it('should generate @CreateDateColumn for created_at', () => {
      const columnsWithTimestamps = [
        ...mockColumns,
        {
          column_name: 'created_at',
          data_type: 'timestamp',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 10,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithTimestamps, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@CreateDateColumn');
      expect(result).toContain("name: 'created_at'");
      expect(result).toContain('createdAt: Date;');
    });

    it('should generate @UpdateDateColumn for updated_at', () => {
      const columnsWithTimestamps = [
        ...mockColumns,
        {
          column_name: 'updated_at',
          data_type: 'timestamp',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 11,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithTimestamps, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@UpdateDateColumn');
      expect(result).toContain("name: 'updated_at'");
      expect(result).toContain('updatedAt: Date;');
    });
  });

  describe('Soft Delete', () => {
    it('should generate @DeleteDateColumn when soft delete enabled', () => {
      const columnsWithSoftDelete = [
        ...mockColumns,
        {
          column_name: 'deleted_at',
          data_type: 'timestamp',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_filterable: false,
          is_searchable: false,
          is_required: false,
          display_in_list: false,
          display_in_form: false,
          display_in_detail: false,
          column_order: 12,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithSoftDelete, {
        tableName: 'users',
        enableSoftDelete: true,
      });

      const result = generator.generate();

      expect(result).toContain('@DeleteDateColumn');
      expect(result).toContain('deletedAt?: Date;');
    });
  });

  describe('Unique Indexes', () => {
    it('should generate @Index decorator for unique columns', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Index('email_unique'");
      expect(result).toContain("['email']");
      expect(result).toContain('unique: true');
    });
  });

  describe('Type Mapping', () => {
    it('should map integer types to number', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('id: number;');
    });

    it('should map varchar types to string', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('email: string;');
      expect(result).toContain('name?: string;');
    });

    it('should map timestamp types to Date', () => {
      const columnsWithTimestamp = [
        ...mockColumns,
        {
          column_name: 'last_login',
          data_type: 'timestamp',
          is_nullable: true,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: false,
          display_in_list: true,
          display_in_form: false,
          display_in_detail: true,
          column_order: 4,
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithTimestamp, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('lastLogin?: Date;');
    });

    it('should map boolean types correctly', () => {
      const columnsWithBoolean = [
        ...mockColumns,
        {
          column_name: 'is_active',
          data_type: 'boolean',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: false,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 4,
          default_value: 'true',
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithBoolean, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('isActive: boolean;');
    });
  });

  describe('Default Values', () => {
    it('should include default values for primitive types', () => {
      const columnsWithDefaults = [
        ...mockColumns,
        {
          column_name: 'role',
          data_type: 'varchar',
          is_nullable: false,
          is_primary_key: false,
          is_unique: false,
          is_filterable: true,
          is_searchable: true,
          is_required: true,
          display_in_list: true,
          display_in_form: true,
          display_in_detail: true,
          column_order: 4,
          default_value: "'user'",
        } as ColumnMetadata,
      ];

      const generator = new EntityGenerator(mockTableMetadata, columnsWithDefaults, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("default: 'user'");
    });

    it('should not include database function defaults', () => {
      const generator = new EntityGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      // Should not include nextval, now(), etc
      expect(result).not.toContain('default: nextval');
    });
  });
});

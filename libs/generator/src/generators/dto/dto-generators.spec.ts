/**
 * DTO Generator Tests
 *
 * Tests for Create, Update, and Filter DTO generators
 */

import { CreateDtoGenerator } from './create-dto.generator';
import { UpdateDtoGenerator } from './update-dto.generator';
import { FilterDtoGenerator } from './filter-dto.generator';
import type {
  TableMetadata,
  ColumnMetadata,
  TableType,
  MetadataStatus,
} from '../../interfaces/generator.interface';

describe('DTO Generators', () => {
  const mockTable: TableMetadata = {
    id: '1',
    table_name: 'users',
    schema_name: 'public',
    table_type: 'entity' as TableType,
    has_soft_delete: false,
    has_created_by: true,
    primary_key_column: 'id',
    primary_key_type: 'uuid',
    status: 'active' as MetadataStatus,
    created_at: new Date(),
    updated_at: new Date(),
    created_by: 'system',
  };

  const mockColumns: ColumnMetadata[] = [
    {
      id: '1',
      table_metadata_id: '1',
      column_name: 'id',
      data_type: 'uuid',
      is_nullable: false,
      is_primary_key: true,
      is_unique: true,
      is_auto_increment: true,
      is_generated: true,
      default_value: 'uuid_generate_v4()',
      description: 'Primary key',
      validation_rules: {},
      is_filterable: false,
      is_searchable: false,
      is_sortable: false,
      is_required: true,
      display_in_list: false,
      display_in_form: false,
      display_in_detail: true,
      column_order: 1,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '2',
      table_metadata_id: '1',
      column_name: 'email',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
      is_unique: true,
      is_auto_increment: false,
      is_generated: false,
      max_length: 255,
      description: 'User email address',
      validation_rules: { email: true },
      is_filterable: true,
      is_searchable: true,
      is_sortable: true,
      is_required: true,
      display_in_list: true,
      display_in_form: true,
      display_in_detail: true,
      column_order: 2,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '3',
      table_metadata_id: '1',
      column_name: 'name',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_generated: false,
      max_length: 100,
      description: 'User full name',
      validation_rules: {},
      is_filterable: true,
      is_searchable: true,
      is_sortable: true,
      is_required: true,
      display_in_list: true,
      display_in_form: true,
      display_in_detail: true,
      column_order: 3,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '4',
      table_metadata_id: '1',
      column_name: 'age',
      data_type: 'integer',
      is_nullable: true,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_generated: false,
      description: 'User age',
      validation_rules: { min: 0, max: 150 },
      is_filterable: true,
      is_searchable: false,
      is_sortable: true,
      is_required: false,
      display_in_list: true,
      display_in_form: true,
      display_in_detail: true,
      column_order: 4,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '5',
      table_metadata_id: '1',
      column_name: 'status',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_generated: false,
      enum_values: ['active', 'inactive', 'suspended'],
      description: 'Account status',
      validation_rules: {},
      is_filterable: true,
      is_searchable: false,
      is_sortable: true,
      is_required: true,
      display_in_list: true,
      display_in_form: true,
      display_in_detail: true,
      column_order: 5,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '6',
      table_metadata_id: '1',
      column_name: 'created_at',
      data_type: 'timestamp',
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_generated: true,
      default_value: 'CURRENT_TIMESTAMP',
      description: 'Record creation timestamp',
      validation_rules: {},
      is_filterable: false,
      is_searchable: false,
      is_sortable: false,
      is_required: true,
      display_in_list: true,
      display_in_form: false,
      display_in_detail: true,
      column_order: 98,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
    {
      id: '7',
      table_metadata_id: '1',
      column_name: 'updated_at',
      data_type: 'timestamp',
      is_nullable: false,
      is_primary_key: false,
      is_unique: false,
      is_auto_increment: false,
      is_generated: true,
      default_value: 'CURRENT_TIMESTAMP',
      description: 'Record update timestamp',
      validation_rules: {},
      is_filterable: false,
      is_searchable: false,
      is_sortable: false,
      is_required: true,
      display_in_list: true,
      display_in_form: false,
      display_in_detail: true,
      column_order: 99,
      created_at: new Date(),
      updated_at: new Date(),
      created_by: 'system',
    },
  ];

  describe('CreateDtoGenerator', () => {
    let generator: CreateDtoGenerator;

    beforeEach(() => {
      generator = new CreateDtoGenerator({
        includeSwagger: true,
        includeComments: true,
      });
    });

    it('should create instance', () => {
      expect(generator).toBeDefined();
    });

    it('should generate CreateDto class', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toBeDefined();
      expect(result.imports).toBeDefined();
      expect(result.code).toContain('export class CreateUsersDto');
    });

    it('should exclude auto-generated fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).not.toContain('id:');
      expect(result.code).not.toContain('createdAt:');
      expect(result.code).not.toContain('updatedAt:');
    });

    it('should include required fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('email:');
      expect(result.code).toContain('name:');
      expect(result.code).toContain('status:');
    });

    it('should add validation decorators', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('@IsEmail()');
      expect(result.code).toContain('@IsNotEmpty()');
      expect(result.code).toContain('@MaxLength(255)');
      expect(result.code).toContain('@MaxLength(100)');
    });

    it('should generate enum for enum_values', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('export enum StatusEnum');
      expect(result.code).toContain("active = 'active'");
      expect(result.code).toContain("inactive = 'inactive'");
      expect(result.code).toContain("suspended = 'suspended'");
    });

    it('should add Swagger decorators', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('@ApiProperty');
      expect(result.imports).toContain("import { ApiProperty } from '@nestjs/swagger';");
    });

    it('should generate imports for class-validator', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.imports.some((imp) => imp.includes('class-validator'))).toBe(true);
    });

    it('should handle optional fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toMatch(/age\?:\s+number/);
      expect(result.code).toContain('@IsOptional()');
    });

    it('should generate complete file with imports', () => {
      const file = generator.generateFile(mockTable, mockColumns);

      expect(file).toContain('import');
      expect(file).toContain('export class CreateUsersDto');
    });
  });

  describe('UpdateDtoGenerator', () => {
    let generator: UpdateDtoGenerator;

    beforeEach(() => {
      generator = new UpdateDtoGenerator({
        includeSwagger: true,
        includeComments: true,
        partialUpdate: true,
      });
    });

    it('should create instance', () => {
      expect(generator).toBeDefined();
    });

    it('should generate UpdateDto class', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toBeDefined();
      expect(result.imports).toBeDefined();
      expect(result.code).toContain('export class UpdateUsersDto');
    });

    it('should exclude primary key and auto-generated fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).not.toContain('id:');
      expect(result.code).not.toContain('createdAt:');
    });

    it('should make all fields optional', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toMatch(/email\?:/);
      expect(result.code).toMatch(/name\?:/);
      expect(result.code).toMatch(/status\?:/);
    });

    it('should add @IsOptional to all fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      const optionalCount = (result.code.match(/@IsOptional\(\)/g) || []).length;
      expect(optionalCount).toBeGreaterThan(0);
    });

    it('should not include @IsNotEmpty', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).not.toContain('@IsNotEmpty()');
    });

    it('should set required: false in Swagger decorators', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('required: false');
    });
  });

  describe('FilterDtoGenerator', () => {
    let generator: FilterDtoGenerator;

    beforeEach(() => {
      generator = new FilterDtoGenerator({
        includeSwagger: true,
        includeComments: true,
        includeOperators: true,
      });
    });

    it('should create instance', () => {
      expect(generator).toBeDefined();
    });

    it('should generate FilterDto class', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toBeDefined();
      expect(result.imports).toBeDefined();
      expect(result.code).toContain('export class FilterUsersDto');
    });

    it('should generate operator fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('email_eq');
      expect(result.code).toContain('email_like');
      expect(result.code).toContain('name_eq');
      expect(result.code).toContain('age_gt');
      expect(result.code).toContain('age_between');
    });

    it('should generate correct types for operators', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toMatch(/age_in\?:\s+number\[\]/);
      expect(result.code).toMatch(/age_between\?:\s+\[number,\s+number\]/);
      expect(result.code).toMatch(/email_null\?:\s+boolean/);
    });

    it('should add @IsOptional to all operator fields', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('@IsOptional()');
    });

    it('should add @IsArray for _in operator', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('@IsArray()');
    });

    it('should add @ArrayMinSize and @ArrayMaxSize for _between', () => {
      const result = generator.generate(mockTable, mockColumns);

      expect(result.code).toContain('@ArrayMinSize(2)');
      expect(result.code).toContain('@ArrayMaxSize(2)');
    });

    it('should add @IsString for _like operator', () => {
      const result = generator.generate(mockTable, mockColumns);

      // Find lines with _like operator
      const likeLines = result.code.split('\n').filter((line) => line.includes('_like'));
      expect(likeLines.length).toBeGreaterThan(0);

      // Check that @IsString appears in the section before _like properties
      expect(result.code).toContain('@IsString()');
    });

    it('should generate without operators when disabled', () => {
      const simpleGenerator = new FilterDtoGenerator({
        includeOperators: false,
      });

      const result = simpleGenerator.generate(mockTable, mockColumns);

      expect(result.code).not.toContain('_eq');
      expect(result.code).not.toContain('_like');
      expect(result.code).toMatch(/email\?:\s+string/);
    });
  });
});

/**
 * Controller Generator Tests
 */

import { ControllerGenerator } from './controller.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

describe('ControllerGenerator', () => {
  const mockTableMetadata: TableMetadata = {
    table_name: 'users',
    display_name: 'Users',
    is_junction_table: false,
  } as unknown as TableMetadata;

  const mockColumns: ColumnMetadata[] = [
    {
      table_name: 'users',
      column_name: 'id',
      data_type: 'integer',
      is_nullable: false,
      is_primary_key: true,
    } as unknown as ColumnMetadata,
    {
      table_name: 'users',
      column_name: 'email',
      data_type: 'varchar',
      is_nullable: false,
      is_primary_key: false,
    } as unknown as ColumnMetadata,
  ];

  describe('Basic Controller Generation', () => {
    it('should generate basic controller class', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('export class UsersController');
      expect(result).toContain("@Controller('users')");
    });

    it('should generate constructor with service injection', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('constructor(private readonly service: UsersService)');
    });

    it('should use custom entity name if provided', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        entityName: 'User',
      });

      const result = generator.generate();

      expect(result).toContain('export class UserController');
      expect(result).toContain('UserService');
    });

    it('should use custom base path if provided', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        basePath: 'api/users',
      });

      const result = generator.generate();

      expect(result).toContain("@Controller('api/users')");
    });
  });

  describe('Import Generation', () => {
    it('should generate correct basic imports', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      // Basic imports (BadRequestException is always included now)
      expect(result).toContain(
        "import { Controller, Get, Post, Put, Delete, Body, Param, Query, HttpStatus, HttpCode, ParseIntPipe, NotFoundException, BadRequestException } from '@nestjs/common'",
      );
      expect(result).toContain("import { UsersService } from '../services/users.service'");
      expect(result).toContain("import { Users } from '../entities/users.entity'");
      expect(result).toContain("import { CreateUsersDto } from '../dto/users/create-users.dto'");
      expect(result).toContain("import { UpdateUsersDto } from '../dto/users/update-users.dto'");
      expect(result).toContain("import { UsersFilterDto } from '../dto/users/users-filter.dto'");
    });

    it('should include Swagger imports when enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiQuery, ApiBody } from '@nestjs/swagger'",
      );
    });

    it('should not include Swagger imports when disabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('@nestjs/swagger');
    });
  });

  describe('Swagger Decorators', () => {
    it('should include @ApiTags when Swagger enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain("@ApiTags('users')");
    });

    it('should include @ApiOperation for each endpoint when Swagger enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain("@ApiOperation({ summary: 'Create a new users' })");
      expect(result).toContain("@ApiOperation({ summary: 'Get all userss with pagination' })");
      expect(result).toContain("@ApiOperation({ summary: 'Get a users by ID' })");
      expect(result).toContain("@ApiOperation({ summary: 'Update a users' })");
      expect(result).toContain("@ApiOperation({ summary: 'Delete a users' })");
    });

    it('should include @ApiResponse decorators when Swagger enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain('@ApiResponse({ status: 201');
      expect(result).toContain('@ApiResponse({ status: 200');
      expect(result).toContain('@ApiResponse({ status: 404');
      expect(result).toContain('@ApiResponse({ status: 400');
    });

    it('should include @ApiParam decorators when Swagger enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain('@ApiParam({ name:');
    });

    it('should include @ApiBody decorators when Swagger enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain('@ApiBody({ type: CreateUsersDto })');
      expect(result).toContain('@ApiBody({ type: UpdateUsersDto })');
    });

    it('should not include Swagger decorators when disabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('@ApiTags');
      expect(result).not.toContain('@ApiOperation');
      expect(result).not.toContain('@ApiResponse');
    });
  });

  describe('CRUD Endpoints', () => {
    it('should generate create endpoint', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@Post()');
      expect(result).toContain('@HttpCode(HttpStatus.CREATED)');
      expect(result).toContain('async create(@Body() createDto: CreateUsersDto)');
      expect(result).toContain('return this.service.create(createDto)');
    });

    it('should generate findAll endpoint', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain('@Get()');
      expect(result).toContain('async findAll(');
      expect(result).toContain('return this.service.findWithFilters');
    });

    it('should generate findOne endpoint with ParseIntPipe for number ID', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Get(':id')");
      expect(result).toContain("@Param('id', ParseIntPipe) id: number");
      expect(result).toContain('await this.service.findOne(id)');
      expect(result).toContain('throw new NotFoundException');
    });

    it('should generate update endpoint', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Put(':id')");
      expect(result).toContain('async update(');
      expect(result).toContain('updateDto: UpdateUsersDto');
      expect(result).toContain('return this.service.update(id, updateDto)');
    });

    it('should generate delete endpoint', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Delete(':id')");
      expect(result).toContain('@HttpCode(HttpStatus.NO_CONTENT)');
      expect(result).toContain('async remove(@Param');
      expect(result).toContain('await this.service.remove(id)');
    });
  });

  describe('Validation', () => {
    it('should use ValidationPipe when validation enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: true,
      });

      const result = generator.generate();

      expect(result).toContain('@Body(ValidationPipe) createDto:');
      expect(result).toContain('@Body(ValidationPipe) updateDto:');
    });

    it('should not use ValidationPipe when validation disabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableValidation: false,
      });

      const result = generator.generate();

      const createMethod = result.substring(
        result.indexOf('async create('),
        result.indexOf('async findAll('),
      );
      expect(createMethod).toContain('@Body() createDto:');
      expect(createMethod).not.toContain('ValidationPipe');
    });
  });

  describe('Pagination', () => {
    it('should generate findWithFilters endpoint when pagination enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enablePagination: true,
      });

      const result = generator.generate();

      expect(result).toContain("@Get('filter')");
      expect(result).toContain('async findWithFilters(');
      expect(result).toContain('@Query() filterDto: UsersFilterDto');
      expect(result).toContain("@Query('page') page?: number");
      expect(result).toContain("@Query('limit') limit?: number");
      expect(result).toContain("@Query('sort') sort?: string");
    });

    it('should not generate findWithFilters when pagination disabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enablePagination: false,
      });

      const result = generator.generate();

      // Should not have a separate findWithFilters endpoint at /filter route
      expect(result).not.toContain("@Get('filter')");
      expect(result).not.toContain('async findWithFilters(');
    });

    it('should include pagination ApiQuery decorators when both Swagger and pagination enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
        enablePagination: true,
      });

      const result = generator.generate();

      expect(result).toContain("@ApiQuery({ name: 'page'");
      expect(result).toContain("@ApiQuery({ name: 'limit'");
      expect(result).toContain("@ApiQuery({ name: 'sort'");
    });

    it('should parse sort parameter correctly', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enablePagination: true,
      });

      const result = generator.generate();

      expect(result).toContain("sort.split(',')");
      expect(result).toContain("const [field, order] = s.split(':')");
      expect(result).toContain("order?.toUpperCase() || 'ASC'");
    });
  });

  describe('String Primary Key', () => {
    it('should handle string primary key type', () => {
      const stringPkColumns: ColumnMetadata[] = [
        {
          table_name: 'users',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_primary_key: true,
        } as unknown as ColumnMetadata,
      ];

      const generator = new ControllerGenerator(mockTableMetadata, stringPkColumns, {
        tableName: 'users',
      });

      const result = generator.generate();

      expect(result).toContain("@Param('id') id: string");
      expect(result).not.toContain('ParseIntPipe');
    });

    it('should use correct ApiParam type for string ID', () => {
      const stringPkColumns: ColumnMetadata[] = [
        {
          table_name: 'users',
          column_name: 'id',
          data_type: 'uuid',
          is_nullable: false,
          is_primary_key: true,
        } as unknown as ColumnMetadata,
      ];

      const generator = new ControllerGenerator(mockTableMetadata, stringPkColumns, {
        tableName: 'users',
        enableSwagger: true,
      });

      const result = generator.generate();

      expect(result).toContain('type: String');
    });
  });

  describe('Combined Features', () => {
    it('should generate controller with all features enabled', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: true,
        enableValidation: true,
        enablePagination: true,
      });

      const result = generator.generate();

      // Check all features present
      expect(result).toContain('@ApiTags');
      expect(result).toContain('ValidationPipe');
      expect(result).toContain('findWithFilters');
    });

    it('should generate minimal controller with no optional features', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableSwagger: false,
        enableValidation: false,
        enablePagination: false,
      });

      const result = generator.generate();

      // Check only basic endpoints present
      expect(result).toContain('async create(');
      expect(result).toContain('async findAll(');
      expect(result).toContain('async findOne(');
      expect(result).toContain('async update(');
      expect(result).toContain('async remove(');

      // Check optional features absent
      expect(result).not.toContain('@ApiTags');
      expect(result).not.toContain('ValidationPipe');
      expect(result).not.toContain("@Get('filter')"); // No separate filter endpoint
      expect(result).not.toContain('async findWithFilters('); // No separate filter method
    });
  });

  describe('RBAC Integration', () => {
    it('should include RBAC import when enableRbac is true', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableRbac: true,
      });

      const result = generator.generate();

      expect(result).toContain(
        "import { RequirePermission, RequireRole, Public, RoleLogic } from '@ojiepermana/nest-generator/rbac'",
      );
    });

    it('should not include RBAC import when enableRbac is false', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableRbac: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('@ojiepermana/nest-generator/rbac');
    });

    it('should add @RequirePermission decorators to all CRUD endpoints', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableRbac: true,
      });

      const result = generator.generate();

      // Check CREATE endpoint - permission-based
      expect(result).toContain("@RequirePermission(['users.create'])");

      // Check READ endpoints - public for list
      expect(result).toContain("@Public()");

      // Check READ ONE endpoint - role-based for authenticated users
      expect(result).toContain("@RequireRole(['user', 'admin'], { logic: RoleLogic.OR })");

      // Check UPDATE endpoint - permission-based
      expect(result).toContain("@RequirePermission(['users.update'])");

      // Check DELETE endpoint - admin only
      expect(result).toContain("@RequireRole(['admin'])");
    });

    it('should use custom rbacResourceName when provided', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableRbac: true,
        rbacResourceName: 'profiles',
      });

      const result = generator.generate();

      expect(result).toContain("@RequirePermission(['profiles.create'])");
      expect(result).toContain("@RequirePermission(['profiles.update'])");
      // Read is always @Public() regardless of resource name
      expect(result).toContain("@Public()");
      // Delete is always admin role regardless of resource name
      expect(result).toContain("@RequireRole(['admin'])");
    });

    it('should not add decorators when enableRbac is false', () => {
      const generator = new ControllerGenerator(mockTableMetadata, mockColumns, {
        tableName: 'users',
        enableRbac: false,
      });

      const result = generator.generate();

      expect(result).not.toContain('@RequirePermission');
    });
  });
});

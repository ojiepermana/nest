/**
 * Controller Generator
 *
 * Generates NestJS REST controllers with Swagger documentation
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import { FileUploadGenerator } from '../features/file-upload.generator';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface ControllerGeneratorOptions {
  tableName: string;
  entityName?: string;
  basePath?: string;
  enableSwagger?: boolean;
  enableValidation?: boolean;
  enablePagination?: boolean;
  enableFileUpload?: boolean;
  storageProvider?: 'local' | 's3' | 'gcs' | 'azure';
  customEndpoints?: string[];
  enableRbac?: boolean;
  rbacResourceName?: string; // e.g., 'users', 'posts'
}

export class ControllerGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ControllerGeneratorOptions,
  ) {}

  /**
   * Generate controller class
   */
  generate(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const controllerName = `${entityName}Controller`;
    const serviceName = `${entityName}Service`;
    const basePath = this.options.basePath || this.toKebabCase(entityName);

    const imports = this.generateImports(entityName, serviceName);
    const classDeclaration = this.generateClassDeclaration(controllerName, basePath);
    const constructor = this.generateConstructor(serviceName);
    const crudEndpoints = this.generateCRUDEndpoints(entityName, serviceName);
    const fileUploadEndpoints = this.generateFileUploadEndpoints();

    return `${imports}

${classDeclaration}
${constructor}
${crudEndpoints}${fileUploadEndpoints}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(entityName: string, serviceName: string): string {
    // Build NestJS common imports dynamically
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');
    const needsParseIntPipe = pkType === 'number';

    const commonImports = [
      'Controller',
      'Get',
      'Post',
      'Put',
      'Delete',
      'Body',
      'Param',
      'Query',
      'HttpStatus',
      'HttpCode',
    ];

    if (needsParseIntPipe) {
      commonImports.push('ParseIntPipe');
    }

    if (this.options.enableValidation) {
      commonImports.push('ValidationPipe');
    }

    commonImports.push('NotFoundException', 'BadRequestException');

    // Add file upload imports if needed
    if (this.options.enableFileUpload && this.hasFileUploadColumns()) {
      commonImports.push('UseInterceptors', 'UploadedFile', 'UploadedFiles');
    }

    const imports = [
      `import { ${commonImports.join(', ')} } from '@nestjs/common';`,
      `import { ${serviceName} } from '../services/${this.toKebabCase(entityName)}.service';`,
      `import { ${entityName} } from '../entities/${this.toKebabCase(entityName)}.entity';`,
      `import { Create${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${entityName}FilterDto } from '../dto/${this.toKebabCase(entityName)}/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

    // Add file upload imports
    if (this.options.enableFileUpload && this.hasFileUploadColumns()) {
      imports.push("import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';");
      imports.push("import { StorageService } from '../services/storage.service';");
    }

    if (this.options.enableSwagger) {
      const swaggerImports = [
        'ApiTags',
        'ApiOperation',
        'ApiResponse',
        'ApiParam',
        'ApiQuery',
        'ApiBody',
      ];

      if (this.options.enableFileUpload && this.hasFileUploadColumns()) {
        swaggerImports.push('ApiConsumes');
      }

      imports.push(`import { ${swaggerImports.join(', ')} } from '@nestjs/swagger';`);
    }

    // Add RBAC imports
    if (this.options.enableRbac) {
      imports.push(
        "import { RequirePermission, RequireRole, Public, RoleLogic } from '@ojiepermana/nest-generator/rbac';",
      );
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(controllerName: string, basePath: string): string {
    const decorators = [`@Controller('${basePath}')`];

    if (this.options.enableSwagger) {
      decorators.unshift(`@ApiTags('${basePath}')`);
    }

    return `${decorators.join('\n')}
export class ${controllerName} {`;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(serviceName: string): string {
    const params = [`private readonly service: ${serviceName}`];

    if (this.options.enableFileUpload && this.hasFileUploadColumns()) {
      params.push('private readonly storageService: StorageService');
    }

    return `  constructor(${params.join(', ')}) {}
`;
  }

  /**
   * Generate CRUD endpoints
   */
  private generateCRUDEndpoints(entityName: string, serviceName: string): string {
    const camelName = toCamelCase(entityName);
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    let endpoints = '';

    // CREATE endpoint
    endpoints += this.generateCreateEndpoint(entityName, camelName);

    // FIND ALL endpoint
    endpoints += this.generateFindAllEndpoint(entityName, camelName);

    // FIND WITH FILTERS endpoint
    if (this.options.enablePagination) {
      endpoints += this.generateFindWithFiltersEndpoint(entityName, camelName);
    }

    // FIND ONE endpoint
    endpoints += this.generateFindOneEndpoint(entityName, camelName, pkType);

    // UPDATE endpoint
    endpoints += this.generateUpdateEndpoint(entityName, camelName, pkType);

    // DELETE endpoint
    endpoints += this.generateDeleteEndpoint(entityName, camelName, pkType);

    return endpoints;
  }

  /**
   * Generate CREATE endpoint
   */
  private generateCreateEndpoint(entityName: string, camelName: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Create a new ${camelName}' })
  @ApiResponse({ status: 201, description: 'The ${camelName} has been successfully created.', type: ${entityName} })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiBody({ type: Create${entityName}Dto })`;
    }

    // Add RBAC decorator
    if (this.options.enableRbac) {
      endpoint += `\n${this.generateRbacDecorator('create')}`;
    }

    endpoint += `  @Post()
  @HttpCode(HttpStatus.CREATED)`;

    if (this.options.enableValidation) {
      endpoint += `
  async create(@Body(ValidationPipe) createDto: Create${entityName}Dto): Promise<${entityName}> {`;
    } else {
      endpoint += `
  async create(@Body() createDto: Create${entityName}Dto): Promise<${entityName}> {`;
    }

    endpoint += `
    return this.service.create(createDto);
  }
`;

    return endpoint;
  }

  /**
   * Generate FIND ALL endpoint
   */
  private generateFindAllEndpoint(entityName: string, camelName: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Get all ${camelName}s with pagination' })
  @ApiResponse({ status: 200, description: 'Return all ${camelName}s with pagination.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort field and order (e.g., name:ASC)' })`;
    }

    // Add RBAC decorator
    if (this.options.enableRbac) {
      endpoint += `\n${this.generateRbacDecorator('read')}`;
    }

    endpoint += `  @Get()
  async findAll(
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: ${entityName}[]; total: number; page: number; limit: number }> {
    const sortOptions = sort
      ? sort.split(',').map((s) => {
          const [field, order] = s.split(':');
          return { field, order: (order?.toUpperCase() || 'ASC') as 'ASC' | 'DESC' };
        })
      : undefined;

    return this.service.findWithFilters({}, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sortOptions,
    });
  }
`;

    return endpoint;
  }

  /**
   * Generate FIND WITH FILTERS endpoint
   */
  private generateFindWithFiltersEndpoint(entityName: string, camelName: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Get ${camelName}s with filters and pagination' })
  @ApiResponse({ status: 200, description: 'Return filtered ${camelName}s with pagination.' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number (default: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Items per page (default: 20, max: 100)' })
  @ApiQuery({ name: 'sort', required: false, type: String, description: 'Sort field and order (e.g., name:ASC)' })`;
    }

    endpoint += `
  @Get('filter')
  async findWithFilters(
    @Query() filterDto: ${entityName}FilterDto,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('sort') sort?: string,
  ): Promise<{ data: ${entityName}[]; total: number; page: number; limit: number }> {
    const sortOptions = sort
      ? sort.split(',').map((s) => {
          const [field, order] = s.split(':');
          return { field, order: (order?.toUpperCase() || 'ASC') as 'ASC' | 'DESC' };
        })
      : undefined;

    return this.service.findWithFilters(filterDto, {
      page: page ? Number(page) : undefined,
      limit: limit ? Number(limit) : undefined,
      sort: sortOptions,
    });
  }
`;

    return endpoint;
  }

  /**
   * Generate FIND ONE endpoint
   */
  private generateFindOneEndpoint(entityName: string, camelName: string, pkType: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Get a ${camelName} by ID' })
  @ApiResponse({ status: 200, description: 'Return the ${camelName}.', type: ${entityName} })
  @ApiResponse({ status: 404, description: '${entityName} not found.' })
  @ApiParam({ name: 'id', type: ${pkType === 'number' ? 'Number' : 'String'}, description: '${entityName} ID' })`;
    }

    // Add RBAC decorator
    if (this.options.enableRbac) {
      endpoint += `\n${this.generateRbacDecorator('read-one')}`;
    }

    endpoint += `  @Get(':id')`;

    if (pkType === 'number') {
      endpoint += `
  async findOne(@Param('id', ParseIntPipe) id: ${pkType}): Promise<${entityName}> {`;
    } else {
      endpoint += `
  async findOne(@Param('id') id: ${pkType}): Promise<${entityName}> {`;
    }

    endpoint += `
    const ${camelName} = await this.service.findOne(id);
    if (!${camelName}) {
      throw new NotFoundException(\`${entityName} with ID \${id} not found\`);
    }
    return ${camelName};
  }
`;

    return endpoint;
  }

  /**
   * Generate UPDATE endpoint
   */
  private generateUpdateEndpoint(entityName: string, camelName: string, pkType: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Update a ${camelName}' })
  @ApiResponse({ status: 200, description: 'The ${camelName} has been successfully updated.', type: ${entityName} })
  @ApiResponse({ status: 404, description: '${entityName} not found.' })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiParam({ name: 'id', type: ${pkType === 'number' ? 'Number' : 'String'}, description: '${entityName} ID' })
  @ApiBody({ type: Update${entityName}Dto })`;
    }

    // Add RBAC decorator
    if (this.options.enableRbac) {
      endpoint += `\n${this.generateRbacDecorator('update')}`;
    }

    endpoint += `  @Put(':id')`;

    if (pkType === 'number') {
      if (this.options.enableValidation) {
        endpoint += `
  async update(
    @Param('id', ParseIntPipe) id: ${pkType},
    @Body(ValidationPipe) updateDto: Update${entityName}Dto,
  ): Promise<${entityName}> {`;
      } else {
        endpoint += `
  async update(
    @Param('id', ParseIntPipe) id: ${pkType},
    @Body() updateDto: Update${entityName}Dto,
  ): Promise<${entityName}> {`;
      }
    } else {
      if (this.options.enableValidation) {
        endpoint += `
  async update(
    @Param('id') id: ${pkType},
    @Body(ValidationPipe) updateDto: Update${entityName}Dto,
  ): Promise<${entityName}> {`;
      } else {
        endpoint += `
  async update(
    @Param('id') id: ${pkType},
    @Body() updateDto: Update${entityName}Dto,
  ): Promise<${entityName}> {`;
      }
    }

    endpoint += `
    return this.service.update(id, updateDto);
  }
`;

    return endpoint;
  }

  /**
   * Generate DELETE endpoint
   */
  private generateDeleteEndpoint(entityName: string, camelName: string, pkType: string): string {
    let endpoint = '';

    if (this.options.enableSwagger) {
      endpoint += `
  @ApiOperation({ summary: 'Delete a ${camelName}' })
  @ApiResponse({ status: 204, description: 'The ${camelName} has been successfully deleted.' })
  @ApiResponse({ status: 404, description: '${entityName} not found.' })
  @ApiParam({ name: 'id', type: ${pkType === 'number' ? 'Number' : 'String'}, description: '${entityName} ID' })`;
    }

    // Add RBAC decorator
    if (this.options.enableRbac) {
      endpoint += `\n${this.generateRbacDecorator('delete')}`;
    }

    endpoint += `  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)`;

    if (pkType === 'number') {
      endpoint += `
  async remove(@Param('id', ParseIntPipe) id: ${pkType}): Promise<void> {`;
    } else {
      endpoint += `
  async remove(@Param('id') id: ${pkType}): Promise<void> {`;
    }

    endpoint += `
    await this.service.remove(id);
  }
`;

    return endpoint;
  }

  /**
   * Generate file upload endpoints
   */
  private generateFileUploadEndpoints(): string {
    if (!this.options.enableFileUpload) {
      return '';
    }

    const fileUploadGenerator = new FileUploadGenerator(this.tableMetadata, this.columns, {
      tableName: this.options.tableName,
      entityName: this.options.entityName,
      storageProvider: this.options.storageProvider || 'local',
      enableValidation: this.options.enableValidation,
      enableSwagger: this.options.enableSwagger,
    });

    if (!fileUploadGenerator.hasFileUploadColumns()) {
      return '';
    }

    return '\n\n' + fileUploadGenerator.generateUploadEndpoints();
  }

  /**
   * Check if any columns have file upload enabled
   * Uses same detection logic as FileUploadGenerator
   */
  private hasFileUploadColumns(): boolean {
    return this.columns.some((col) => {
      // Check explicit flag
      if (col.is_file_upload === true) {
        return true;
      }

      // Check column name patterns
      const columnName = col.column_name.toLowerCase();
      const filePatterns = [
        /_file$/, // ends with _file
        /^file_/, // starts with file_
        /file_path/, // contains file_path
        /file_url/, // contains file_url
        /_attachment$/, // ends with _attachment
        /^attachment_/, // starts with attachment_
        /^image_/, // starts with image_
        /^photo_/, // starts with photo_
        /^avatar/, // starts with avatar
        /^document_/, // starts with document_
        /^media_/, // starts with media_
        /_media$/, // ends with _media
      ];

      return filePatterns.some((pattern) => pattern.test(columnName));
    });
  }

  /**
   * Get primary key column
   */
  private getPrimaryKeyColumn(): ColumnMetadata | undefined {
    return this.columns.find((col) => col.is_primary_key);
  }

  /**
   * Get TypeScript type from database type
   */
  private getTypeScriptType(dbType: string): string {
    const lowerType = dbType.toLowerCase();

    if (lowerType.includes('int') || lowerType.includes('serial') || lowerType.includes('number')) {
      return 'number';
    }

    if (
      lowerType.includes('varchar') ||
      lowerType.includes('text') ||
      lowerType.includes('char') ||
      lowerType.includes('uuid')
    ) {
      return 'string';
    }

    if (lowerType.includes('bool')) {
      return 'boolean';
    }

    if (lowerType.includes('date') || lowerType.includes('time')) {
      return 'Date';
    }

    return 'any';
  }

  /**
   * Convert to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Generate RBAC decorator for endpoint
   * Smart selection:
   * - findAll (read): @Public() - allow public access for list endpoints
   * - findOne (read-one): @RequireRole(['user', 'admin'], { logic: RoleLogic.OR }) - authenticated users
   * - create: @RequirePermission(['resource.create']) - permission-based
   * - update: @RequirePermission(['resource.update']) - permission-based
   * - delete: @RequireRole(['admin']) - admin only
   */
  private generateRbacDecorator(
    action: 'create' | 'read' | 'read-one' | 'update' | 'delete',
  ): string {
    if (!this.options.enableRbac) {
      return '';
    }

    const resourceName = this.options.rbacResourceName || this.options.tableName;

    switch (action) {
      case 'read':
        // Public endpoint for listing resources
        return `  @Public()\n`;

      case 'read-one':
        // Authenticated users can read individual resources
        return `  @RequireRole(['user', 'admin'], { logic: RoleLogic.OR })\n`;

      case 'create':
        // Permission-based for creating resources
        return `  @RequirePermission(['${resourceName}.create'])\n`;

      case 'update':
        // Permission-based for updating resources
        return `  @RequirePermission(['${resourceName}.update'])\n`;

      case 'delete':
        // Admin-only for deleting resources
        return `  @RequireRole(['admin'])\n`;

      default:
        return '';
    }
  }

  /**
   * Get resource name for RBAC permissions
   */
  private getRbacResourceName(): string {
    return this.options.rbacResourceName || this.options.tableName;
  }
}

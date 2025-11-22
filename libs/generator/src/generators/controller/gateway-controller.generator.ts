/**
 * Microservices Gateway Controller Generator
 *
 * Generates gateway controllers that proxy requests to microservices
 * Uses ClientProxy to send messages to service layer
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface GatewayControllerGeneratorOptions {
  tableName: string;
  schemaName: string; // Schema name for routing (e.g., 'entity', 'user')
  serviceName: string; // For @Inject - app name (e.g., 'entity', 'user')
  resourceName?: string; // For message patterns - table name (e.g., 'location', 'business-entity')
  serviceHost: string;
  servicePort: number;
  transport: 'TCP' | 'REDIS' | 'NATS' | 'MQTT' | 'RMQ';
  enableSwagger?: boolean;
  enableRateLimit?: boolean;
  enableRbac?: boolean;
  rbacResourceName?: string; // For permission namespacing
  enableFileUpload?: boolean; // Enable file upload endpoints
}

export class GatewayControllerGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: GatewayControllerGeneratorOptions,
  ) {}

  /**
   * Generate gateway controller class
   */
  generate(): string {
    const entityName = toPascalCase(this.options.tableName);
    const controllerName = `${entityName}Controller`;
    // basePath uses schema/table format for all controller types (REST, Gateway, Service)
    const basePath = `${this.toKebabCase(this.options.schemaName)}/${this.toKebabCase(entityName)}`;

    const imports = this.generateImports(entityName);
    const classDeclaration = this.generateClassDeclaration(controllerName, basePath);
    const constructor = this.generateConstructor();
    const endpoints = this.generateProxyEndpoints(entityName);

    return `${imports}

${classDeclaration}
${constructor}
${endpoints}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(entityName: string): string {
    const imports = [
      "import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject, UseInterceptors, UploadedFile, UploadedFiles, BadRequestException } from '@nestjs/common';",
      "import { ClientProxy } from '@nestjs/microservices';",
      "import { firstValueFrom } from 'rxjs';",
      "import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';",
      `import { Create${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${entityName}FilterDto } from '../dto/${this.toKebabCase(entityName)}/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

    if (this.options.enableSwagger) {
      imports.push(
        "import { ApiTags, ApiOperation, ApiResponse, ApiBody, ApiParam, ApiQuery, ApiConsumes } from '@nestjs/swagger';",
      );
    }

    if (this.options.enableRateLimit) {
      imports.push("import { Throttle } from '@nestjs/throttler';");
    }

    // Add RBAC imports
    if (this.options.enableRbac) {
      imports.push(
        "import { RequirePermission, RequireRole, Public, RoleLogic } from '@ojiepermana/nest-rbac';",
      );
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(controllerName: string, basePath: string): string {
    const decorators: string[] = [];

    if (this.options.enableSwagger) {
      decorators.push(`@ApiTags('${basePath}')`);
    }

    decorators.push(`@Controller('${basePath}')`);

    return `${decorators.join('\n')}
export class ${controllerName} {`;
  }

  /**
   * Generate constructor with ClientProxy injection
   */
  private generateConstructor(): string {
    return `  constructor(
    @Inject('${this.options.serviceName.toUpperCase()}_SERVICE')
    private readonly client: ClientProxy,
  ) {}
`;
  }

  /**
   * Generate proxy endpoints
   */
  private generateProxyEndpoints(entityName: string): string {
    // Use resourceName for message patterns (table name), or fallback to serviceName
    const resourceName = (this.options.resourceName || this.options.serviceName).toLowerCase();
    const camelName = toCamelCase(entityName);

    // Generate file upload endpoints if enabled
    const fileUploadEndpoints = this.options.enableFileUpload
      ? this.generateFileUploadEndpoints(entityName, resourceName)
      : '';

    const endpoints = `
  // GENERATED_ENDPOINT_START: findAll
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get all ${camelName}s', description: 'Retrieve a list of all ${camelName}s with optional filtering' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: 'Successfully retrieved list of ${camelName}s', type: [${entityName}FilterDto] })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiQuery({ name: 'page', required: false, type: Number, description: 'Page number for pagination' })` : ''}
  ${this.options.enableSwagger ? `@ApiQuery({ name: 'limit', required: false, type: Number, description: 'Number of items per page' })` : ''}
  ${this.options.enableRateLimit ? '@Throttle({ default: { limit: 100, ttl: 60000 } })' : ''}
${this.generateRbacDecorator('read')}  @Get()
  async findAll(@Query() filters: ${entityName}FilterDto) {
    return firstValueFrom(
      this.client.send('${resourceName}.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get yearly recap', description: 'Retrieve yearly statistics and recap data' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: 'Successfully retrieved recap data' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiQuery({ name: 'year', required: false, type: Number, description: 'Year for recap (defaults to current year)' })` : ''}
${this.generateRbacDecorator('read')}  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('${resourceName}.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get single ${camelName}', description: 'Retrieve a specific ${camelName} by ID' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: 'Successfully retrieved ${camelName}' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 404, description: '${entityName} not found' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiParam({ name: 'id', type: String, description: 'The ID of the ${camelName}' })` : ''}
${this.generateRbacDecorator('read-one')}  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('${resourceName}.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Create ${camelName}', description: 'Create a new ${camelName}' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 201, description: '${entityName} successfully created' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 400, description: 'Invalid input data' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiBody({ type: Create${entityName}Dto, description: 'Data for creating a new ${camelName}' })` : ''}
${this.generateRbacDecorator('create')}  @Post()
  async create(@Body() dto: Create${entityName}Dto) {
    return firstValueFrom(
      this.client.send('${resourceName}.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Update ${camelName}', description: 'Update an existing ${camelName}' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: '${entityName} successfully updated' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 400, description: 'Invalid input data' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 404, description: '${entityName} not found' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiParam({ name: 'id', type: String, description: 'The ID of the ${camelName} to update' })` : ''}
  ${this.options.enableSwagger ? `@ApiBody({ type: Update${entityName}Dto, description: 'Updated data for the ${camelName}' })` : ''}
${this.generateRbacDecorator('update')}  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Update${entityName}Dto,
  ) {
    return firstValueFrom(
      this.client.send('${resourceName}.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Delete ${camelName}', description: 'Delete a ${camelName} by ID' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: '${entityName} successfully deleted' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 404, description: '${entityName} not found' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 500, description: 'Internal server error' })` : ''}
  ${this.options.enableSwagger ? `@ApiParam({ name: 'id', type: String, description: 'The ID of the ${camelName} to delete' })` : ''}
${this.generateRbacDecorator('delete')}  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('${resourceName}.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

${fileUploadEndpoints}

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints
`;

    return endpoints;
  }

  /**
   * Convert string to kebab-case
   */
  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }

  /**
   * Generate RBAC decorator for gateway endpoint
   * Same logic as REST controller
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
   * Generate file upload endpoints for gateway
   */
  private generateFileUploadEndpoints(entityName: string, resourceName: string): string {
    const fileColumns = this.getFileUploadColumns();

    if (fileColumns.length === 0) {
      return '';
    }

    const endpoints = fileColumns
      .map((column) => {
        const fieldName = column.column_name;
        const camelFieldName = toCamelCase(fieldName);
        const pascalFieldName = toPascalCase(camelFieldName);

        return `
  // GENERATED_ENDPOINT_START: upload-${camelFieldName}
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Upload ${camelFieldName} file', description: 'Upload a file for ${camelFieldName}' })` : ''}
  ${this.options.enableSwagger ? `@ApiConsumes('multipart/form-data')` : ''}
  ${
    this.options.enableSwagger
      ? `@ApiBody({
    schema: {
      type: 'object',
      properties: {
        file: {
          type: 'string',
          format: 'binary',
        },
        entityId: {
          type: 'string',
          description: 'Entity ID to attach file to',
        },
      },
    },
  })`
      : ''
  }
  ${this.options.enableSwagger ? `@ApiResponse({ status: 201, description: 'File uploaded successfully' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 400, description: 'Invalid file or missing data' })` : ''}
${this.generateRbacDecorator('update')}  @Post('upload/${camelFieldName}')
  @UseInterceptors(FileInterceptor('file'))
  async upload${pascalFieldName}(
    @UploadedFile() file: Express.Multer.File,
    @Body('entityId') entityId: string,
  ): Promise<{ url: string; filename: string; size: number }> {
    if (!file) {
      throw new BadRequestException('No file provided');
    }

    return firstValueFrom(
      this.client.send('${resourceName}.upload${pascalFieldName}', {
        file: {
          originalname: file.originalname,
          mimetype: file.mimetype,
          size: file.size,
          buffer: file.buffer,
        },
        entityId,
      }),
    );
  }
  // GENERATED_ENDPOINT_END: upload-${camelFieldName}

  // GENERATED_ENDPOINT_START: delete-${camelFieldName}
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Delete ${camelFieldName} file', description: 'Delete the ${camelFieldName} file from entity' })` : ''}
  ${this.options.enableSwagger ? `@ApiParam({ name: 'id', type: String, description: 'Entity ID' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 200, description: 'File deleted successfully' })` : ''}
  ${this.options.enableSwagger ? `@ApiResponse({ status: 404, description: 'Entity or file not found' })` : ''}
${this.generateRbacDecorator('update')}  @Delete(':id/${camelFieldName}')
  async delete${pascalFieldName}(
    @Param('id') id: string,
  ): Promise<{ message: string }> {
    return firstValueFrom(
      this.client.send('${resourceName}.delete${pascalFieldName}', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: delete-${camelFieldName}`;
      })
      .join('\n');

    return endpoints;
  }

  /**
   * Get columns that have file upload enabled
   * Detects file columns by:
   * 1. Explicit flag: is_file_upload === true
   * 2. Column name patterns: *_file, file_path, file_url, *_attachment, image_*, photo_*, avatar_*, document_*
   */
  private getFileUploadColumns(): ColumnMetadata[] {
    return this.columns.filter((col) => {
      // Check explicit flag first
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
}

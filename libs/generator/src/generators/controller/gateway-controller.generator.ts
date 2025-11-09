/**
 * Microservices Gateway Controller Generator
 *
 * Generates gateway controllers that proxy requests to microservices
 * Uses ClientProxy to send messages to service layer
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface GatewayControllerGeneratorOptions {
  tableName: string;
  serviceName: string;
  serviceHost: string;
  servicePort: number;
  transport: 'TCP' | 'REDIS' | 'NATS' | 'MQTT' | 'RMQ';
  enableSwagger?: boolean;
  enableRateLimit?: boolean;
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
    const basePath = this.toKebabCase(entityName);

    const imports = this.generateImports(entityName);
    const classDeclaration = this.generateClassDeclaration(
      controllerName,
      basePath,
    );
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
      "import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';",
      "import { ClientProxy } from '@nestjs/microservices';",
      "import { firstValueFrom } from 'rxjs';",
      `import { Create${entityName}Dto } from './dto/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from './dto/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${entityName}FilterDto } from './dto/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

    if (this.options.enableSwagger) {
      imports.push(
        "import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';",
      );
    }

    if (this.options.enableRateLimit) {
      imports.push("import { Throttle } from '@nestjs/throttler';");
    }

    return imports.join('\n');
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(
    controllerName: string,
    basePath: string,
  ): string {
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
    const serviceName = this.options.serviceName.toLowerCase();
    const camelName = toCamelCase(entityName);

    const endpoints = `
  // GENERATED_ENDPOINT_START: findAll
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get all ${camelName}s' })` : ''}
  ${this.options.enableRateLimit ? '@Throttle({ default: { limit: 100, ttl: 60000 } })' : ''}
  @Get()
  async findAll(@Query() filters: ${entityName}FilterDto) {
    return firstValueFrom(
      this.client.send('${serviceName}.findAll', filters),
    );
  }
  // GENERATED_ENDPOINT_END: findAll

  // GENERATED_ENDPOINT_START: recap
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get yearly recap' })` : ''}
  @Get('recap')
  async getRecap(@Query() dto: any) {
    return firstValueFrom(
      this.client.send('${serviceName}.getRecap', dto),
    );
  }
  // GENERATED_ENDPOINT_END: recap

  // GENERATED_ENDPOINT_START: findOne
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Get single ${camelName}' })` : ''}
  @Get(':id')
  async findOne(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('${serviceName}.findOne', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: findOne

  // GENERATED_ENDPOINT_START: create
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Create ${camelName}' })` : ''}
  @Post()
  async create(@Body() dto: Create${entityName}Dto) {
    return firstValueFrom(
      this.client.send('${serviceName}.create', dto),
    );
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Update ${camelName}' })` : ''}
  @Put(':id')
  async update(
    @Param('id') id: string,
    @Body() dto: Update${entityName}Dto,
  ) {
    return firstValueFrom(
      this.client.send('${serviceName}.update', { id, ...dto }),
    );
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  ${this.options.enableSwagger ? `@ApiOperation({ summary: 'Delete ${camelName}' })` : ''}
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return firstValueFrom(
      this.client.send('${serviceName}.remove', { id }),
    );
  }
  // GENERATED_ENDPOINT_END: remove

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
}

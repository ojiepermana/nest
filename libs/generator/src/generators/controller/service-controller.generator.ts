/**
 * Microservices Service Controller Generator
 *
 * Generates service controllers that handle message patterns
 * Uses @MessagePattern and @EventPattern decorators
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface ServiceControllerGeneratorOptions {
  tableName: string;
  serviceName: string;
  enableEvents?: boolean;
  enableRbac?: boolean;
  rbacResourceName?: string; // For permission namespacing
}

export class ServiceControllerGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ServiceControllerGeneratorOptions,
  ) {}

  /**
   * Generate service controller class
   */
  generate(): string {
    const entityName = toPascalCase(this.options.tableName);
    const controllerName = `${entityName}Controller`;
    const serviceName = `${entityName}Service`;

    const imports = this.generateImports(entityName, serviceName);
    const classDeclaration = this.generateClassDeclaration(controllerName);
    const constructor = this.generateConstructor(serviceName);
    const messagePatterns = this.generateMessagePatterns(entityName);
    const eventPatterns = this.options.enableEvents ? this.generateEventPatterns(entityName) : '';

    return `${imports}

${classDeclaration}
${constructor}
${messagePatterns}
${eventPatterns}
}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(entityName: string, serviceName: string): string {
    const imports = [
      "import { Controller } from '@nestjs/common';",
      "import { MessagePattern, Payload } from '@nestjs/microservices';",
      `import { ${serviceName} } from '../services/${this.toKebabCase(entityName)}.service';`,
      `import { Create${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/${this.toKebabCase(entityName)}/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${entityName}FilterDto } from '../dto/${this.toKebabCase(entityName)}/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

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
  private generateClassDeclaration(controllerName: string): string {
    return `@Controller()
export class ${controllerName} {`;
  }

  /**
   * Generate constructor
   */
  private generateConstructor(serviceName: string): string {
    return `  constructor(private readonly service: ${serviceName}) {}
`;
  }

  /**
   * Generate message pattern handlers
   */
  private generateMessagePatterns(entityName: string): string {
    const serviceName = this.options.serviceName.toLowerCase();
    const camelName = toCamelCase(entityName);

    return `
  // GENERATED_HANDLER_START: findAll
${this.generateRbacDecorator('read')}  @MessagePattern('${serviceName}.findAll')
  async findAll(@Payload() filters: ${entityName}FilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
${this.generateRbacDecorator('read-one')}  @MessagePattern('${serviceName}.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
${this.generateRbacDecorator('create')}  @MessagePattern('${serviceName}.create')
  async create(@Payload() dto: Create${entityName}Dto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
${this.generateRbacDecorator('update')}  @MessagePattern('${serviceName}.update')
  async update(@Payload() data: { id: string } & Update${entityName}Dto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
${this.generateRbacDecorator('delete')}  @MessagePattern('${serviceName}.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message pattern handlers here
  // CUSTOM_HANDLER_END: custom-handlers
`;
  }

  /**
   * Generate event pattern handlers (optional)
   */
  private generateEventPatterns(entityName: string): string {
    const serviceName = this.options.serviceName.toLowerCase();

    return `
  // GENERATED_EVENT_START: created
  @EventPattern('${serviceName}.created')
  async handleCreated(@Payload() data: any, @Ctx() context: RmqContext) {
    // Handle ${serviceName} created event
    console.log(\`${entityName} created:\`, data);
    
    // Acknowledge message if using RabbitMQ
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
  // GENERATED_EVENT_END: created

  // GENERATED_EVENT_START: updated
  @EventPattern('${serviceName}.updated')
  async handleUpdated(@Payload() data: any, @Ctx() context: RmqContext) {
    // Handle ${serviceName} updated event
    console.log(\`${entityName} updated:\`, data);
    
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
  // GENERATED_EVENT_END: updated

  // GENERATED_EVENT_START: deleted
  @EventPattern('${serviceName}.deleted')
  async handleDeleted(@Payload() data: any, @Ctx() context: RmqContext) {
    // Handle ${serviceName} deleted event
    console.log(\`${entityName} deleted:\`, data);
    
    const channel = context.getChannelRef();
    const originalMsg = context.getMessage();
    channel.ack(originalMsg);
  }
  // GENERATED_EVENT_END: deleted

  // CUSTOM_EVENT_START: custom-events
  // Add your custom event pattern handlers here
  // CUSTOM_EVENT_END: custom-events
`;
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
   * Generate RBAC decorator for message pattern
   * Same logic as REST controller but for microservices
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
}

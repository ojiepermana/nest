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
      "import { MessagePattern, Payload, EventPattern, Ctx, RmqContext } from '@nestjs/microservices';",
      `import { ${serviceName} } from '../services/${this.toKebabCase(entityName)}.service';`,
      `import { Create${entityName}Dto } from '../dto/create-${this.toKebabCase(entityName)}.dto';`,
      `import { Update${entityName}Dto } from '../dto/update-${this.toKebabCase(entityName)}.dto';`,
      `import { ${entityName}FilterDto } from '../dto/${this.toKebabCase(entityName)}-filter.dto';`,
    ];

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
  @MessagePattern('${serviceName}.findAll')
  async findAll(@Payload() filters: ${entityName}FilterDto) {
    return this.service.findAll();
  }
  // GENERATED_HANDLER_END: findAll

  // GENERATED_HANDLER_START: findOne
  @MessagePattern('${serviceName}.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: findOne

  // GENERATED_HANDLER_START: create
  @MessagePattern('${serviceName}.create')
  async create(@Payload() dto: Create${entityName}Dto) {
    return this.service.create(dto);
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('${serviceName}.update')
  async update(@Payload() data: { id: string } & Update${entityName}Dto) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('${serviceName}.remove')
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
}

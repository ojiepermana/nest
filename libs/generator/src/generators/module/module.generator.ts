/**
 * Module Generator
 *
 * Generates NestJS modules that wire together controllers, services, and repositories
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface ModuleGeneratorOptions {
  tableName: string;
  entityName?: string;
  includeController?: boolean;
  includeService?: boolean;
  includeRepository?: boolean;
  enableCaching?: boolean;
  enableAuditLog?: boolean;
  customProviders?: string[];
  customImports?: string[];
  customExports?: string[];
  useTypeORM?: boolean; // Add option to use TypeORM or plain SQL
  architecture?: 'standalone' | 'monorepo' | 'microservices';
  isGateway?: boolean;
  serviceName?: string;
}

export class ModuleGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ModuleGeneratorOptions,
  ) {}

  /**
   * Generate module class
   */
  generate(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const moduleName = `${entityName}Module`;

    const imports = this.generateImports(entityName);
    const moduleDecorator = this.generateModuleDecorator(entityName);
    const classDeclaration = this.generateClassDeclaration(moduleName);

    return `${imports}

${moduleDecorator}
${classDeclaration}
`;
  }

  /**
   * Generate imports
   */
  private generateImports(entityName: string): string {
    const imports: string[] = [];

    // NestJS common imports
    imports.push("import { Module } from '@nestjs/common';");

    // ClientsModule import for microservices gateway
    if (this.options.architecture === 'microservices' && this.options.isGateway) {
      imports.push("import { ClientsModule, Transport } from '@nestjs/microservices';");
    }

    // TypeORM import if repository enabled AND using TypeORM
    if (
      this.options.useTypeORM !== false &&
      this.options.includeRepository !== false &&
      this.options.includeService !== false
    ) {
      imports.push("import { TypeOrmModule } from '@nestjs/typeorm';");
    }

    // CacheModule import if caching enabled
    if (this.options.enableCaching) {
      imports.push("import { CacheModule } from '@nestjs/cache-manager';");
    }

    // Entity import (not needed for plain SQL repositories)
    if (this.options.useTypeORM !== false) {
      imports.push(
        `import { ${entityName} } from './entities/${this.toKebabCase(entityName)}.entity';`,
      );
    }

    // Controller import
    if (this.options.includeController !== false) {
      imports.push(
        `import { ${entityName}Controller } from './controllers/${this.toKebabCase(entityName)}.controller';`,
      );
    }

    // Service import (not needed for gateway in microservices)
    if (
      this.options.includeService !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      imports.push(
        `import { ${entityName}Service } from './services/${this.toKebabCase(entityName)}.service';`,
      );
    }

    // Repository import (not needed for gateway in microservices)
    if (
      this.options.includeRepository !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      imports.push(
        `import { ${entityName}Repository } from './repositories/${this.toKebabCase(entityName)}.repository';`,
      );
    }

    // Audit module import
    if (this.options.enableAuditLog) {
      imports.push("import { AuditModule } from '@ojiepermana/nest-generator/audit';");
    }

    return imports.join('\n');
  }

  /**
   * Generate @Module decorator
   */
  private generateModuleDecorator(entityName: string): string {
    const moduleConfig: string[] = [];

    // Imports array
    const moduleImports = this.generateModuleImports(entityName);
    if (moduleImports.length > 0) {
      moduleConfig.push(`  imports: [${moduleImports.join(', ')}]`);
    }

    // Controllers array
    const controllers = this.generateControllers(entityName);
    if (controllers.length > 0) {
      moduleConfig.push(`  controllers: [${controllers.join(', ')}]`);
    }

    // Providers array
    const providers = this.generateProviders(entityName);
    if (providers.length > 0) {
      moduleConfig.push(`  providers: [${providers.join(', ')}]`);
    }

    // Exports array
    const moduleExports = this.generateExports(entityName);
    if (moduleExports.length > 0) {
      moduleConfig.push(`  exports: [${moduleExports.join(', ')}]`);
    }

    return `@Module({
${moduleConfig.join(',\n')}
})`;
  }

  /**
   * Generate module imports
   */
  private generateModuleImports(entityName: string): string[] {
    const imports: string[] = [];

    // ClientsModule for microservices gateway
    if (this.options.architecture === 'microservices' && this.options.isGateway) {
      const serviceName = this.options.serviceName || this.toKebabCase(entityName);
      const serviceNameUpper = serviceName.toUpperCase().replace(/-/g, '_');
      imports.push(`
    ClientsModule.register([
      {
        name: '${serviceNameUpper}_SERVICE',
        transport: Transport.TCP,
        options: {
          host: process.env.${serviceNameUpper}_SERVICE_HOST || 'localhost',
          port: parseInt(process.env.${serviceNameUpper}_SERVICE_PORT || '3001'),
        },
      },
    ])`);
    }

    // TypeOrmModule.forFeature if repository enabled AND using TypeORM
    if (
      this.options.useTypeORM !== false &&
      this.options.includeRepository !== false &&
      this.options.includeService !== false
    ) {
      imports.push(`TypeOrmModule.forFeature([${entityName}])`);
    }

    // CacheModule if caching enabled
    if (this.options.enableCaching) {
      imports.push('CacheModule.register()');
    }

    // AuditModule if audit logging enabled
    if (this.options.enableAuditLog) {
      imports.push('AuditModule');
    }

    // Custom imports
    if (this.options.customImports) {
      imports.push(...this.options.customImports);
    }

    return imports;
  }

  /**
   * Generate controllers array
   */
  private generateControllers(entityName: string): string[] {
    const controllers: string[] = [];

    if (this.options.includeController !== false) {
      controllers.push(`${entityName}Controller`);
    }

    return controllers;
  }

  /**
   * Generate providers array
   */
  private generateProviders(entityName: string): string[] {
    const providers: string[] = [];

    // Service (not needed for gateway in microservices)
    if (
      this.options.includeService !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      providers.push(`${entityName}Service`);
    }

    // Repository (not needed for gateway in microservices)
    if (
      this.options.includeRepository !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      providers.push(`${entityName}Repository`);
    }

    // Custom providers
    if (this.options.customProviders) {
      providers.push(...this.options.customProviders);
    }

    return providers;
  }

  /**
   * Generate exports array
   */
  private generateExports(entityName: string): string[] {
    const exports: string[] = [];

    // Export service for use in other modules (not needed for gateway in microservices)
    if (
      this.options.includeService !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      exports.push(`${entityName}Service`);
    }

    // Export repository for use in other modules (not needed for gateway in microservices)
    if (
      this.options.includeRepository !== false &&
      !(this.options.architecture === 'microservices' && this.options.isGateway)
    ) {
      exports.push(`${entityName}Repository`);
    }

    // Custom exports
    if (this.options.customExports) {
      exports.push(...this.options.customExports);
    }

    return exports;
  }

  /**
   * Generate class declaration
   */
  private generateClassDeclaration(moduleName: string): string {
    return `export class ${moduleName} {}`;
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

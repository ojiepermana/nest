/**
 * Module Generator
 *
 * Generates NestJS modules that wire together controllers, services, and repositories
 */

import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type {
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

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
    const entityName =
      this.options.entityName || toPascalCase(this.options.tableName);
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

    // TypeORM import if repository enabled
    if (
      this.options.includeRepository !== false &&
      this.options.includeService !== false
    ) {
      imports.push("import { TypeOrmModule } from '@nestjs/typeorm';");
    }

    // CacheModule import if caching enabled
    if (this.options.enableCaching) {
      imports.push("import { CacheModule } from '@nestjs/cache-manager';");
    }

    // Entity import
    imports.push(
      `import { ${entityName} } from './entities/${this.toKebabCase(entityName)}.entity';`,
    );

    // Controller import
    if (this.options.includeController !== false) {
      imports.push(
        `import { ${entityName}Controller } from './controllers/${this.toKebabCase(entityName)}.controller';`,
      );
    }

    // Service import
    if (this.options.includeService !== false) {
      imports.push(
        `import { ${entityName}Service } from './services/${this.toKebabCase(entityName)}.service';`,
      );
    }

    // Repository import
    if (this.options.includeRepository !== false) {
      imports.push(
        `import { ${entityName}Repository } from './repositories/${this.toKebabCase(entityName)}.repository';`,
      );
    }

    // Audit module import
    if (this.options.enableAuditLog) {
      imports.push("import { AuditModule } from '../audit/audit.module';");
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

    // TypeOrmModule.forFeature if repository enabled
    if (
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

    // Service
    if (this.options.includeService !== false) {
      providers.push(`${entityName}Service`);
    }

    // Repository
    if (this.options.includeRepository !== false) {
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

    // Export service for use in other modules
    if (this.options.includeService !== false) {
      exports.push(`${entityName}Service`);
    }

    // Export repository for use in other modules
    if (this.options.includeRepository !== false) {
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

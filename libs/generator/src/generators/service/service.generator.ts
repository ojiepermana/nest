/**
 * Service Generator
 *
 * Generates NestJS service classes with business logic layer
 */

import { Project, Scope, StructureKind } from 'ts-morph';
import { toPascalCase, toCamelCase } from '../../utils/string.util';
import type { TableMetadata, ColumnMetadata } from '../../interfaces/generator.interface';

export interface ServiceGeneratorOptions {
  tableName: string;
  entityName?: string;
  enableCaching?: boolean;
  enableErrorHandling?: boolean;
  enableTransactions?: boolean;
  enableValidation?: boolean;
  enableAuditLog?: boolean;
  customMethods?: string[];
}

export class ServiceGenerator {
  constructor(
    private tableMetadata: TableMetadata,
    private columns: ColumnMetadata[],
    private options: ServiceGeneratorOptions,
  ) {}

  /**
   * Generate service class
   */
  generate(): string {
    const entityName = this.options.entityName || toPascalCase(this.options.tableName);
    const serviceName = `${entityName}Service`;
    const repositoryName = `${entityName}Repository`;
    const filterDtoName = `${entityName}FilterDto`;
    const camelName = toCamelCase(entityName);
    const kebabName = this.toKebabCase(entityName);

    const project = new Project();
    const sourceFile = project.createSourceFile(`${serviceName}.ts`, '', { overwrite: true });

    // Add Imports
    sourceFile.addImportDeclaration({
      moduleSpecifier: '@nestjs/common',
      namedImports: [
        'Injectable',
        'NotFoundException',
        'BadRequestException',
        'ConflictException',
        'Inject',
      ],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: `../repositories/${kebabName}.repository`,
      namedImports: [repositoryName],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: `../entities/${kebabName}.entity`,
      namedImports: [entityName],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: `../dto/${kebabName}/create-${kebabName}.dto`,
      namedImports: [`Create${entityName}Dto`],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: `../dto/${kebabName}/update-${kebabName}.dto`,
      namedImports: [`Update${entityName}Dto`],
    });

    sourceFile.addImportDeclaration({
      moduleSpecifier: `../dto/${kebabName}/${kebabName}-filter.dto`,
      namedImports: [filterDtoName],
    });

    if (this.options.enableCaching) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@nestjs/cache-manager',
        namedImports: ['CACHE_MANAGER'],
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'cache-manager',
        namedImports: ['Cache'],
        isTypeOnly: true,
      });
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@ojiepermana/nest-generator/decorators',
        namedImports: ['InvalidateCache'],
      });
    }

    if (this.options.enableAuditLog) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: '@ojiepermana/nest-generator/decorators',
        namedImports: ['AuditLog'],
      });
    }

    if (this.options.enableTransactions) {
      sourceFile.addImportDeclaration({
        moduleSpecifier: 'typeorm',
        namedImports: ['DataSource'],
      });
    }

    // Create Class
    const classDecl = sourceFile.addClass({
      name: serviceName,
      isExported: true,
      decorators: [{ name: 'Injectable', arguments: [] }],
    });

    // Constructor
    const ctor = classDecl.addConstructor();
    ctor.addParameter({
      name: 'repository',
      type: repositoryName,
      scope: Scope.Private,
      isReadonly: true,
    });

    if (this.options.enableCaching) {
      ctor.addParameter({
        name: 'cacheManager',
        type: 'Cache',
        scope: Scope.Private,
        isReadonly: true,
        decorators: [{ name: 'Inject', arguments: ['CACHE_MANAGER'] }],
      });
    }

    if (this.options.enableTransactions) {
      ctor.addParameter({
        name: 'dataSource',
        type: 'DataSource',
        scope: Scope.Private,
        isReadonly: true,
      });
    }

    // Methods
    this.addCreateMethod(classDecl, entityName, camelName);
    this.addFindAllMethod(classDecl, entityName, camelName);
    this.addFindOneMethod(classDecl, entityName, camelName);
    this.addUpdateMethod(classDecl, entityName, camelName);
    this.addRemoveMethod(classDecl, entityName, camelName);
    this.addFilterMethod(classDecl, entityName, filterDtoName);

    return sourceFile.getFullText();
  }

  private addCreateMethod(classDecl: any, entityName: string, camelName: string) {
    const method = classDecl.addMethod({
      name: 'create',
      isAsync: true,
      returnType: `Promise<${entityName}>`,
      parameters: [{ name: 'createDto', type: `Create${entityName}Dto` }],
    });

    if (this.options.enableAuditLog) {
      method.addDecorator({
        name: 'AuditLog',
        arguments: [`{ action: 'CREATE', resource: '${entityName}' }`],
      });
    }

    if (this.options.enableCaching) {
      method.addDecorator({
        name: 'InvalidateCache',
        arguments: [`{ key: '${camelName}' }`],
      });
    }

    method.setBodyText((writer) => {
      if (this.options.enableValidation) {
        // TODO: Move to class-validator
        // writer.writeLine('await this.validateUniqueConstraints(createDto);');
      }
      writer.writeLine(`return this.repository.create(createDto);`);
    });
  }

  private addFindAllMethod(classDecl: any, entityName: string, camelName: string) {
    const method = classDecl.addMethod({
      name: 'findAll',
      isAsync: true,
      returnType: `Promise<${entityName}[]>`,
    });

    // Caching for read operations is complex to do via simple decorator without interceptor logic
    // For now, we keep it simple or assume a @Cacheable decorator exists (not implemented yet)

    method.setBodyText(`return this.repository.findAll();`);
  }

  private addFindOneMethod(classDecl: any, entityName: string, camelName: string) {
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    const method = classDecl.addMethod({
      name: 'findOne',
      isAsync: true,
      returnType: `Promise<${entityName}>`,
      parameters: [{ name: 'id', type: pkType }],
    });

    method.setBodyText((writer) => {
      writer.writeLine(`const ${camelName} = await this.repository.findOne(id);`);
      if (this.options.enableErrorHandling) {
        writer.writeLine(`if (!${camelName}) {`);
        writer.writeLine(
          `  throw new NotFoundException(\`${entityName} with ID \${id} not found\`);`,
        );
        writer.writeLine(`}`);
      }
      writer.writeLine(`return ${camelName};`);
    });
  }

  private addUpdateMethod(classDecl: any, entityName: string, camelName: string) {
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    const method = classDecl.addMethod({
      name: 'update',
      isAsync: true,
      returnType: `Promise<${entityName}>`,
      parameters: [
        { name: 'id', type: pkType },
        { name: 'updateDto', type: `Update${entityName}Dto` },
      ],
    });

    if (this.options.enableAuditLog) {
      method.addDecorator({
        name: 'AuditLog',
        arguments: [`{ action: 'UPDATE', resource: '${entityName}' }`],
      });
    }

    if (this.options.enableCaching) {
      method.addDecorator({
        name: 'InvalidateCache',
        arguments: [`{ key: '${camelName}' }`],
      });
    }

    method.setBodyText((writer) => {
      if (this.options.enableErrorHandling) {
        writer.writeLine(`await this.findOne(id);`);
      }
      writer.writeLine(`return this.repository.update(id, updateDto);`);
    });
  }

  private addRemoveMethod(classDecl: any, entityName: string, camelName: string) {
    const pkColumn = this.getPrimaryKeyColumn();
    const pkType = this.getTypeScriptType(pkColumn?.data_type || 'integer');

    const method = classDecl.addMethod({
      name: 'remove',
      isAsync: true,
      returnType: `Promise<void>`,
      parameters: [{ name: 'id', type: pkType }],
    });

    if (this.options.enableAuditLog) {
      method.addDecorator({
        name: 'AuditLog',
        arguments: [`{ action: 'DELETE', resource: '${entityName}' }`],
      });
    }

    if (this.options.enableCaching) {
      method.addDecorator({
        name: 'InvalidateCache',
        arguments: [`{ key: '${camelName}' }`],
      });
    }

    method.setBodyText((writer) => {
      if (this.options.enableErrorHandling) {
        writer.writeLine(`await this.findOne(id);`);
      }
      writer.writeLine(`await this.repository.delete(id);`);
    });
  }

  private addFilterMethod(classDecl: any, entityName: string, filterDtoName: string) {
    classDecl.addMethod({
      name: 'findWithFilters',
      isAsync: true,
      returnType: `Promise<{ data: ${entityName}[]; total: number; page: number; limit: number }>`,
      parameters: [
        { name: 'filterDto', type: filterDtoName },
        {
          name: 'options',
          type: `{ page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> }`,
          hasQuestionToken: true,
        },
      ],
      statements: [
        `const { data, total } = await this.repository.findWithFilters(filterDto, options);`,
        `return {`,
        `  data,`,
        `  total,`,
        `  page: options?.page || 1,`,
        `  limit: options?.limit || 20,`,
        `};`,
      ],
    });
  }

  private getPrimaryKeyColumn(): ColumnMetadata | undefined {
    return this.columns.find((col) => col.is_primary_key);
  }

  private getTypeScriptType(dbType: string): string {
    const lowerType = dbType.toLowerCase();
    if (lowerType.includes('int') || lowerType.includes('serial') || lowerType.includes('number'))
      return 'number';
    if (lowerType.includes('bool')) return 'boolean';
    if (lowerType.includes('date') || lowerType.includes('time')) return 'Date';
    return 'string';
  }

  private toKebabCase(str: string): string {
    return str
      .replace(/([a-z])([A-Z])/g, '$1-$2')
      .replace(/[\s_]+/g, '-')
      .toLowerCase();
  }
}

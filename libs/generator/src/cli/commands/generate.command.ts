/**
 * Generate Command
 *
 * Orchestrates all generators to create a complete CRUD module:
 * 1. Fetches table metadata from database
 * 2. Generates Entity (TypeORM model)
 * 3. Generates DTOs (Create, Update, Filter)
 * 4. Generates Repository (data access layer)
 * 5. Generates Service (business logic)
 * 6. Generates Controller (REST API)
 * 7. Generates Module (wires everything together)
 * 8. Creates directory structure and writes files
 */

import inquirer from 'inquirer';
import { writeFileSync, existsSync, mkdirSync, readFileSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.util';
import { DatabaseConnectionManager } from '../../database/connection.manager';
import { MetadataRepository } from '../../metadata/metadata.repository';
import { DialectFactory } from '../../database/dialects';
import { EntityGenerator } from '../../generators/entity/entity.generator';
import { CreateDtoGenerator } from '../../generators/dto/create-dto.generator';
import { UpdateDtoGenerator } from '../../generators/dto/update-dto.generator';
import { FilterDtoGenerator } from '../../generators/dto/filter-dto.generator';
import { RepositoryGenerator } from '../../generators/repository/repository.generator';
import { ServiceGenerator } from '../../generators/service/service.generator';
import { ControllerGenerator } from '../../generators/controller/controller.generator';
import { ModuleGenerator } from '../../generators/module/module.generator';
import { toPascalCase } from '../../utils/string.util';
import type {
  GeneratorConfig,
  TableMetadata,
  ColumnMetadata,
} from '../../interfaces/generator.interface';

export interface GenerateCommandOptions {
  tableName?: string;
  outputPath?: string;
  features?: {
    swagger?: boolean;
    caching?: boolean;
    validation?: boolean;
    pagination?: boolean;
    auditLog?: boolean;
    softDelete?: boolean;
    fileUpload?: boolean;
    rbac?: boolean;
  };
  skipPrompts?: boolean;
  // CLI flags
  enableAudit?: boolean;
  storageProvider?: 'local' | 's3' | 'gcs' | 'azure';
  enableRbac?: boolean;
  rbacDefaultPermissions?: string[]; // e.g., ['read', 'create', 'update', 'delete']
}

export class GenerateCommand {
  private config?: GeneratorConfig;
  private dbManager?: DatabaseConnectionManager;
  private metadataRepo?: MetadataRepository;

  async execute(options: GenerateCommandOptions = {}): Promise<void> {
    Logger.section('🏗️  NestJS CRUD Generator');

    // Step 1: Load configuration
    this.loadConfig();

    // Step 2: Connect to database
    await this.connectDatabase();

    // Step 3: Prompt for table or use provided
    const tableName = await this.promptTableName(options.tableName);

    // Step 4: Fetch metadata
    const { tableMetadata, columns } = await this.fetchMetadata(tableName);

    // Step 5: Prompt for features or use provided
    const features = await this.promptFeatures(options.features, options.skipPrompts);

    // Step 6: Prompt for output path or use provided
    const outputPath = await this.promptOutputPath(options.outputPath, options.skipPrompts);

    // Step 7: Generate all files
    this.generateFiles(tableMetadata, columns, features, outputPath);

    // Step 8: Auto-register module to app.module.ts
    const moduleName = this.toModuleName(tableName.split('.').pop() || tableName);
    const moduleClassName = `${this.toPascalCase(moduleName)}Module`;
    this.registerModuleToApp(outputPath, moduleName, moduleClassName);

    // Step 9: Summary
    Logger.success('\n✅ Generation complete!');
    Logger.info(`\n📁 Files created in: ${outputPath}`);
    Logger.info('\n📝 Next steps:');
    Logger.info('   1. Module auto-registered to app.module.ts ✓');
    Logger.info('   2. Run migrations if needed');
    Logger.info('   3. Start your application');

    await this.cleanup();
  }

  /**
   * Load generator configuration
   */
  private loadConfig(): void {
    const configPath = join(process.cwd(), 'generator.config.json');

    if (!existsSync(configPath)) {
      Logger.error('❌ generator.config.json not found!');
      Logger.info('💡 Run `npx nest-generator init` first to initialize.');
      process.exit(1);
    }

    const configContent = readFileSync(configPath, 'utf-8');
    this.config = JSON.parse(configContent) as GeneratorConfig;
    Logger.info('✓ Configuration loaded');
  }

  /**
   * Connect to database
   */
  private async connectDatabase(): Promise<void> {
    if (!this.config?.database) {
      throw new Error('Database configuration not found');
    }

    this.dbManager = new DatabaseConnectionManager(this.config.database);
    await this.dbManager.connect();

    const dialect = DialectFactory.create(this.config.database.type);
    this.metadataRepo = new MetadataRepository(this.dbManager, dialect);
    Logger.info('✓ Database connected');
  }

  /**
   * Prompt for table name
   */
  private async promptTableName(providedTableName?: string): Promise<string> {
    if (providedTableName) {
      return providedTableName;
    }

    if (!this.metadataRepo) {
      throw new Error('Metadata repository not initialized');
    }

    // Fetch all tables
    const tables = await this.metadataRepo.getAllTableMetadata();
    const tableNames = tables.map((t) => t.table_name);

    if (tableNames.length === 0) {
      Logger.error('❌ No tables found in database');
      process.exit(1);
    }

    const { tableName } = await inquirer.prompt<{ tableName: string }>([
      {
        type: 'list',
        name: 'tableName',
        message: 'Select table to generate CRUD module for:',
        choices: tableNames,
      },
    ]);

    return tableName;
  }

  /**
   * Fetch table metadata and columns
   */
  private async fetchMetadata(
    tableInput: string,
  ): Promise<{ tableMetadata: TableMetadata; columns: ColumnMetadata[] }> {
    if (!this.metadataRepo || !this.config) {
      throw new Error('Metadata repository not initialized');
    }

    // Parse schema.table format
    let schema: string;
    let tableName: string;

    if (tableInput.includes('.')) {
      [schema, tableName] = tableInput.split('.');
    } else {
      schema = this.config.database.schema || 'public';
      tableName = tableInput;
    }

    Logger.info(`\n📊 Fetching metadata for table: ${schema}.${tableName}`);

    const tableMetadata = await this.metadataRepo.getTableMetadata(schema, tableName);
    if (!tableMetadata) {
      Logger.error(`❌ Table metadata not found for: ${schema}.${tableName}`);
      Logger.info(`💡 Make sure metadata exists in meta.table_metadata table`);
      process.exit(1);
    }

    const columns = await this.metadataRepo.getColumnsByTableId(tableMetadata.id);
    if (columns.length === 0) {
      Logger.error(`❌ No columns found for table: ${schema}.${tableName}`);
      process.exit(1);
    }

    Logger.info(`   ✓ Found ${columns.length} columns`);
    Logger.info(`   ✓ Primary key: ${tableMetadata.primary_key_column}`);

    return { tableMetadata, columns };
  }

  /**
   * Prompt for features
   */
  private async promptFeatures(
    providedFeatures?: GenerateCommandOptions['features'],
    skipPrompts?: boolean,
  ): Promise<Required<NonNullable<GenerateCommandOptions['features']>>> {
    if (skipPrompts && providedFeatures) {
      return {
        swagger: providedFeatures.swagger ?? true,
        caching: providedFeatures.caching ?? false,
        validation: providedFeatures.validation ?? true,
        pagination: providedFeatures.pagination ?? true,
        auditLog: providedFeatures.auditLog ?? false,
        softDelete: providedFeatures.softDelete ?? false,
        fileUpload: providedFeatures.fileUpload ?? false,
        rbac: providedFeatures.rbac ?? false,
      };
    }

    const answers = await inquirer.prompt<
      Required<NonNullable<GenerateCommandOptions['features']>>
    >([
      {
        type: 'confirm',
        name: 'swagger',
        message: 'Enable Swagger/OpenAPI documentation?',
        default: this.config?.features?.swagger ?? true,
      },
      {
        type: 'confirm',
        name: 'validation',
        message: 'Enable DTO validation?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'pagination',
        message: 'Enable pagination support?',
        default: true,
      },
      {
        type: 'confirm',
        name: 'caching',
        message: 'Enable caching?',
        default: this.config?.features?.caching ?? false,
      },
      {
        type: 'confirm',
        name: 'auditLog',
        message: '🔍 Enable audit logging? (tracks all CREATE/UPDATE/DELETE operations)',
        default: this.config?.features?.audit ?? false,
      },
      {
        type: 'confirm',
        name: 'softDelete',
        message: 'Enable soft delete?',
        default: false,
      },
      {
        type: 'confirm',
        name: 'fileUpload',
        message: '📁 Enable file upload? (auto-detects file columns)',
        default: this.config?.features?.fileUpload ?? false,
      },
      {
        type: 'confirm',
        name: 'rbac',
        message: '🔐 Enable RBAC? (role-based access control with permissions)',
        default: this.config?.features?.rbac ?? false,
      },
    ]);

    return answers;
  }

  /**
   * Prompt for output path
   */
  private async promptOutputPath(providedPath?: string, skipPrompts?: boolean): Promise<string> {
    if (providedPath) {
      return providedPath;
    }

    if (skipPrompts) {
      return join(process.cwd(), 'src');
    }

    const { outputPath } = await inquirer.prompt<{ outputPath: string }>([
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output directory:',
        default: 'src',
      },
    ]);

    return join(process.cwd(), outputPath);
  }

  /**
   * Generate all files
   */
  private generateFiles(
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
    features: Required<NonNullable<GenerateCommandOptions['features']>>,
    outputPath: string,
  ): void {
    const tableName = tableMetadata.table_name;
    const entityName = toPascalCase(tableName);
    const moduleName = this.toKebabCase(tableName);

    Logger.info('\n🔨 Generating files...');

    // Create directory structure
    const moduleDir = join(outputPath, moduleName);
    this.ensureDirectory(moduleDir);
    this.ensureDirectory(join(moduleDir, 'entities'));
    this.ensureDirectory(join(moduleDir, 'dto'));
    this.ensureDirectory(join(moduleDir, 'repositories'));
    this.ensureDirectory(join(moduleDir, 'services'));
    this.ensureDirectory(join(moduleDir, 'controllers'));

    // 1. Generate Entity
    Logger.info('   ⏳ Generating entity...');
    const entityGenerator = new EntityGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      schema: this.config?.database.schema,
      enableSoftDelete: features.softDelete,
      useTypeORM: false, // Use plain TypeScript classes instead of TypeORM
    });
    const entityCode = entityGenerator.generate();
    this.writeFile(join(moduleDir, 'entities', `${moduleName}.entity.ts`), entityCode);
    Logger.info('   ✓ Entity generated');

    // 2. Generate DTOs
    Logger.info('   ⏳ Generating DTOs...');
    const createDtoGenerator = new CreateDtoGenerator({
      includeSwagger: features.swagger,
      includeComments: true,
    });
    const createDtoResult = createDtoGenerator.generate(tableMetadata, columns);
    const createDtoCode = [...createDtoResult.imports, '', createDtoResult.code].join('\n');
    this.writeFile(join(moduleDir, 'dto', `create-${moduleName}.dto.ts`), createDtoCode);

    const updateDtoGenerator = new UpdateDtoGenerator({
      includeSwagger: features.swagger,
      includeComments: true,
    });
    const updateDtoResult = updateDtoGenerator.generate(tableMetadata, columns);
    const updateDtoCode = [...updateDtoResult.imports, '', updateDtoResult.code].join('\n');
    this.writeFile(join(moduleDir, 'dto', `update-${moduleName}.dto.ts`), updateDtoCode);

    const filterDtoGenerator = new FilterDtoGenerator({
      includeSwagger: features.swagger,
      includeComments: true,
    });
    const filterDtoResult = filterDtoGenerator.generate(tableMetadata, columns);
    const filterDtoCode = [...filterDtoResult.imports, '', filterDtoResult.code].join('\n');
    this.writeFile(join(moduleDir, 'dto', `${moduleName}-filter.dto.ts`), filterDtoCode);
    Logger.info('   ✓ DTOs generated (Create, Update, Filter)');

    // 3. Generate Repository
    Logger.info('   ⏳ Generating repository...');
    const repositoryGenerator = new RepositoryGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      useTypeORM: false,
    });
    const repositoryCode = repositoryGenerator.generate();
    this.writeFile(join(moduleDir, 'repositories', `${moduleName}.repository.ts`), repositoryCode);
    Logger.info('   ✓ Repository generated');

    // 4. Generate Service
    Logger.info('   ⏳ Generating service...');
    const serviceGenerator = new ServiceGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      enableCaching: features.caching,
      enableValidation: features.validation,
      enableAuditLog: features.auditLog,
      enableTransactions: false, // Disable for plain SQL (no TypeORM DataSource)
    });
    const serviceCode = serviceGenerator.generate();
    this.writeFile(join(moduleDir, 'services', `${moduleName}.service.ts`), serviceCode);
    Logger.info('   ✓ Service generated');

    // 5. Generate Controller
    Logger.info('   ⏳ Generating controller...');
    const controllerGenerator = new ControllerGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      enableSwagger: features.swagger,
      enableValidation: features.validation,
      enablePagination: features.pagination,
      enableFileUpload: features.fileUpload,
      storageProvider:
        (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'gcs' | 'azure') || 'local',
    });
    const controllerCode = controllerGenerator.generate();
    this.writeFile(join(moduleDir, 'controllers', `${moduleName}.controller.ts`), controllerCode);
    Logger.info('   ✓ Controller generated');

    // 6. Generate Module
    Logger.info('   ⏳ Generating module...');
    const moduleGenerator = new ModuleGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      enableCaching: features.caching,
      enableAuditLog: features.auditLog,
      useTypeORM: false,
    });
    const moduleCode = moduleGenerator.generate();
    this.writeFile(join(moduleDir, `${moduleName}.module.ts`), moduleCode);
    Logger.info('   ✓ Module generated');

    // 7. Generate barrel export (index.ts)
    Logger.info('   ⏳ Generating barrel exports...');
    const indexCode = this.generateIndexFile(entityName, moduleName);
    this.writeFile(join(moduleDir, 'index.ts'), indexCode);
    Logger.info('   ✓ Index file generated');
  }

  /**
   * Generate index.ts barrel export
   */
  private generateIndexFile(entityName: string, moduleName: string): string {
    return `/**
 * ${entityName} Module
 * 
 * Auto-generated barrel export
 */

export * from './${moduleName}.module';
export * from './entities/${moduleName}.entity';
export * from './dto/create-${moduleName}.dto';
export * from './dto/update-${moduleName}.dto';
export * from './dto/${moduleName}-filter.dto';
export * from './repositories/${moduleName}.repository';
export * from './services/${moduleName}.service';
export * from './controllers/${moduleName}.controller';
`;
  }

  /**
   * Ensure directory exists
   */
  private ensureDirectory(dir: string): void {
    if (!existsSync(dir)) {
      mkdirSync(dir, { recursive: true });
    }
  }

  /**
   * Write file with logging
   */
  private writeFile(filePath: string, content: string): void {
    writeFileSync(filePath, content, 'utf-8');
  }

  /**
   * Register generated module to app.module.ts
   */
  private registerModuleToApp(
    outputPath: string,
    moduleName: string,
    moduleClassName: string,
  ): void {
    try {
      const appModulePath = join(outputPath, 'app.module.ts');

      if (!existsSync(appModulePath)) {
        Logger.warn('⚠ app.module.ts not found, skipping auto-registration');
        return;
      }

      let appModuleContent = readFileSync(appModulePath, 'utf-8');

      // Check if already imported
      if (appModuleContent.includes(`from './${moduleName}/${moduleName}.module'`)) {
        Logger.info('   ℹ Module already registered in app.module.ts');
        return;
      }

      // Add import statement after last import
      const lastImportMatch = appModuleContent.match(/import.*from.*['"];?\n(?!import)/);
      if (lastImportMatch && lastImportMatch.index !== undefined) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        const importStatement = `import { ${moduleClassName} } from './${moduleName}/${moduleName}.module';\n`;
        appModuleContent =
          appModuleContent.slice(0, insertPos) +
          importStatement +
          appModuleContent.slice(insertPos);
      }

      // Add to imports array
      const importsMatch = appModuleContent.match(/imports:\s*\[([^\]]*)\]/s);
      if (importsMatch) {
        const importsContent = importsMatch[1];

        // Extract indentation from existing imports
        const indentMatch = importsContent.match(/\n(\s+)/);
        const indent = indentMatch ? indentMatch[1] : '    ';

        // Clean up trailing whitespace and commas
        let cleanedImports = importsContent.trimEnd();
        if (cleanedImports.endsWith(',')) {
          cleanedImports = cleanedImports.slice(0, -1).trimEnd();
        }

        // Add new module with proper formatting and closing bracket on new line
        const newImports = cleanedImports
          ? `${cleanedImports},\n${indent}${moduleClassName},\n  `
          : `\n${indent}${moduleClassName},\n  `;

        appModuleContent = appModuleContent.replace(
          /imports:\s*\[([^\]]*)\]/s,
          `imports: [${newImports}]`,
        );
      }

      writeFileSync(appModulePath, appModuleContent, 'utf-8');
      Logger.success(`   ✓ Module registered to app.module.ts`);
    } catch (error) {
      Logger.error(`   ✗ Failed to register module: ${(error as Error).message}`);
      Logger.warn('   ℹ Please manually add the module to app.module.ts');
    }
  }

  /**
   * Convert table name to module name (kebab-case)
   */
  private toModuleName(tableName: string): string {
    return this.toKebabCase(tableName);
  }

  /**
   * Convert to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_.]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Cleanup resources
   */
  private async cleanup(): Promise<void> {
    if (this.dbManager) {
      await this.dbManager.disconnect();
    }
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

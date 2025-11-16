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
import { GatewayControllerGenerator } from '../../generators/controller/gateway-controller.generator';
import { ServiceControllerGenerator } from '../../generators/controller/service-controller.generator';
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
  appName?: string;
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
  all?: boolean; // Enable all features
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

    // If --all flag is used, automatically skip prompts
    const skipPrompts = options.skipPrompts || options.all;

    // Step 5: Prompt for features or use provided
    const features = await this.promptFeatures(options.features, skipPrompts, options.all);

    // Step 6: Prompt for output path or use provided (with app name if specified)
    const outputPath = await this.promptOutputPath(
      options.outputPath,
      skipPrompts,
      options.appName,
    );

    // Step 7: Generate all files
    this.generateFiles(tableMetadata, columns, features, outputPath);

    // Step 8: Auto-register module to app.module.ts
    const moduleName = this.toModuleName(tableName.split('.').pop() || tableName);
    const moduleClassName = `${this.toPascalCase(moduleName)}Module`;
    this.registerModuleToApp(outputPath, moduleName, moduleClassName);

    // Step 9: Auto-configure Swagger if enabled
    if (features.swagger) {
      this.configureSwagger(outputPath, tableName, moduleName);
    }

    // Step 10: Auto-register RbacModule if RBAC is enabled
    if (features.rbac) {
      this.registerRbacModule(outputPath);
    }

    // Step 11: Summary
    Logger.success('\n✅ Generation complete!');
    Logger.info(`\n📁 Files created in: ${outputPath}`);
    Logger.info('\n📝 Next steps:');
    Logger.info('   1. Module auto-registered to app.module.ts ✓');
    if (features.swagger) {
      Logger.info('   2. Swagger configured in main.ts ✓');
      Logger.info('   3. Access Swagger UI at: http://localhost:3000/api');
      Logger.info('   4. Run migrations if needed');
      Logger.info('   5. Start your application');
    } else {
      Logger.info('   2. Run migrations if needed');
      Logger.info('   3. Start your application');
    }

    await this.cleanup();
  }

  /**
   * Load generator configuration
   */
  private loadConfig(): void {
    // Try to find config in current directory first, then walk up to project root
    let configPath = join(process.cwd(), 'generator.config.json');

    if (!existsSync(configPath)) {
      // Try to find project root
      const projectRoot = this.findProjectRoot();
      configPath = join(projectRoot, 'generator.config.json');

      if (!existsSync(configPath)) {
        Logger.error('❌ generator.config.json not found!');
        Logger.info('💡 Run `npx nest-generator init` first to initialize.');
        process.exit(1);
      }
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const rawConfig = JSON.parse(configContent) as GeneratorConfig;

    // Resolve environment variables in config
    this.config = this.resolveEnvVariables(rawConfig);
    Logger.info('✓ Configuration loaded');
  }

  /**
   * Find project root by looking for package.json
   * Same logic as init command
   */
  private findProjectRoot(): string {
    let currentDir = process.cwd();
    const maxDepth = 10;
    let depth = 0;

    while (depth < maxDepth) {
      const packageJsonPath = join(currentDir, 'package.json');

      if (existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, 'utf-8'));

        if (packageJson.workspaces || existsSync(join(currentDir, 'apps'))) {
          return currentDir;
        }

        const parentDir = join(currentDir, '..');
        if (!existsSync(join(parentDir, 'apps'))) {
          return currentDir;
        }
      }

      const parentDir = join(currentDir, '..');
      if (parentDir === currentDir) {
        break;
      }
      currentDir = parentDir;
      depth++;
    }

    return process.cwd();
  }

  /**
   * Resolve environment variables in configuration
   */
  private resolveEnvVariables(config: GeneratorConfig): GeneratorConfig {
    const resolved = { ...config };

    if (config.database) {
      resolved.database = {
        ...config.database,
        host: this.resolveEnvValue(config.database.host as string),
        port: parseInt(this.resolveEnvValue(config.database.port?.toString() || '5432')),
        database: this.resolveEnvValue(config.database.database as string),
        username: this.resolveEnvValue(config.database.username as string),
        password: this.resolveEnvValue(config.database.password as string),
        ssl: this.resolveEnvValue(config.database.ssl?.toString() || 'false') === 'true',
        pool: {
          ...config.database.pool,
          min: parseInt(this.resolveEnvValue(config.database.pool?.min?.toString() || '2')),
          max: parseInt(this.resolveEnvValue(config.database.pool?.max?.toString() || '10')),
        },
      };
    }

    return resolved;
  }

  /**
   * Resolve single environment variable value
   */
  private resolveEnvValue(value: string): string {
    // Check if value is an environment variable placeholder like ${DB_HOST}
    const envVarMatch = value.match(/^\$\{(.+)\}$/);

    if (envVarMatch) {
      const envVarName = envVarMatch[1];
      const envValue = process.env[envVarName];

      if (!envValue) {
        Logger.error(`❌ Environment variable ${envVarName} is not set!`);
        Logger.info('💡 Make sure .env file is loaded or set the environment variable.');
        process.exit(1);
      }

      return envValue;
    }

    // Return as-is if not an env variable placeholder
    return value;
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
    enableAll?: boolean,
  ): Promise<Required<NonNullable<GenerateCommandOptions['features']>>> {
    // If --all flag is provided, enable all features
    if (enableAll) {
      return {
        swagger: true,
        caching: true,
        validation: true,
        pagination: true,
        auditLog: true,
        softDelete: true,
        fileUpload: true,
        rbac: true,
      };
    }

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
  private async promptOutputPath(
    providedPath?: string,
    skipPrompts?: boolean,
    appName?: string,
  ): Promise<string> {
    if (providedPath) {
      return providedPath;
    }

    // Determine default output path based on architecture and app name
    const defaultPath = this.getDefaultOutputPath(appName);

    if (skipPrompts) {
      return defaultPath;
    }

    const { outputPath } = await inquirer.prompt<{ outputPath: string }>([
      {
        type: 'input',
        name: 'outputPath',
        message: 'Output directory:',
        default: defaultPath.replace(process.cwd() + '/', ''), // Show relative path
      },
    ]);

    return join(process.cwd(), outputPath);
  }

  /**
   * Get default output path based on architecture
   */
  private getDefaultOutputPath(appName?: string): string {
    const architecture = this.config?.architecture || 'standalone';
    const cwd = process.cwd();
    const projectRoot = this.findProjectRoot();

    switch (architecture) {
      case 'standalone':
        // If in project root, use apps/standalone/src
        if (cwd === projectRoot && existsSync(join(projectRoot, 'apps/standalone/src'))) {
          return join(projectRoot, 'apps/standalone/src');
        }
        // If already in standalone app directory, use src
        return join(cwd, 'src');

      case 'monorepo':
        // If app name is provided via --app flag, use it
        if (appName) {
          const appPath = join(projectRoot, 'apps/monorepo', appName, 'src');
          if (existsSync(join(projectRoot, 'apps/monorepo', appName))) {
            return appPath;
          }
          Logger.error(`❌ App '${appName}' not found in apps/monorepo/`);
          process.exit(1);
        }

        // Detect which app we're in by checking current directory path
        const relativePath = cwd.replace(projectRoot, '');

        // If in apps/monorepo/[app-name], use src in current directory
        if (relativePath.includes('apps/monorepo/')) {
          return join(cwd, 'src');
        }

        // If in project root, cannot auto-detect app
        if (cwd === projectRoot) {
          Logger.warn(
            '⚠️  Running from project root. Please use --app flag or cd into the app directory.',
          );
          Logger.info('   Example: nest-generator generate table --app=user');
          Logger.info('   Or:      cd apps/monorepo/user && nest-generator generate table');
          process.exit(1);
        }

        // Default to src in current directory
        return join(cwd, 'src');

      case 'microservices':
        // If app name is provided via --app flag, use it
        if (appName) {
          const servicePath = join(projectRoot, 'apps/microservices', appName, 'src');
          if (existsSync(join(projectRoot, 'apps/microservices', appName))) {
            return servicePath;
          }
          Logger.error(`❌ Service '${appName}' not found in apps/microservices/`);
          process.exit(1);
        }

        // Same logic as monorepo
        const microservicePath = cwd.replace(projectRoot, '');

        if (microservicePath.includes('apps/microservices/')) {
          return join(cwd, 'src');
        }

        if (cwd === projectRoot) {
          Logger.warn(
            '⚠️  Running from project root. Please use --app flag or cd into the service directory.',
          );
          Logger.info('   Example: nest-generator generate table --app=user');
          Logger.info('   Or:      cd apps/microservices/user && nest-generator generate table');
          process.exit(1);
        }

        return join(cwd, 'src');

      default:
        return join(cwd, 'src');
    }
  }

  /**
   * Detect if current app is a gateway in microservices architecture
   */
  private detectIsGateway(outputPath: string, appName?: string): boolean {
    const architecture = this.config?.architecture || 'standalone';

    // Only relevant for microservices architecture
    if (architecture !== 'microservices') {
      return false;
    }

    const projectRoot = this.findProjectRoot();
    const cwd = process.cwd();

    // Check if app name contains 'gateway'
    if (appName && appName.toLowerCase().includes('gateway')) {
      return true;
    }

    // Check if output path contains 'gateway'
    if (outputPath.toLowerCase().includes('gateway')) {
      return true;
    }

    // Check if current directory is in gateway app
    const relativePath = cwd.replace(projectRoot, '');
    if (relativePath.includes('apps/microservices/gateway')) {
      return true;
    }

    return false;
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
    const schema = tableMetadata.schema_name;
    const entityName = toPascalCase(tableName);
    const moduleName = this.toKebabCase(tableName);

    // Determine basePath for controller based on architecture
    // For standalone: use schema/table (e.g., /entity/location)
    // For monorepo/microservices: use just table name
    const basePath =
      schema && schema !== 'public' ? `${this.toKebabCase(schema)}/${moduleName}` : moduleName;

    Logger.info('\n🔨 Generating files...');

    // Create directory structure
    const moduleDir = join(outputPath, moduleName);
    this.ensureDirectory(moduleDir);
    this.ensureDirectory(join(moduleDir, 'entities'));
    this.ensureDirectory(join(moduleDir, 'dto'));
    this.ensureDirectory(join(moduleDir, 'dto', moduleName)); // DTO subdirectory per table
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
    this.writeFile(
      join(moduleDir, 'dto', moduleName, `create-${moduleName}.dto.ts`),
      createDtoCode,
    );

    const updateDtoGenerator = new UpdateDtoGenerator({
      includeSwagger: features.swagger,
      includeComments: true,
    });
    const updateDtoResult = updateDtoGenerator.generate(tableMetadata, columns);
    const updateDtoCode = [...updateDtoResult.imports, '', updateDtoResult.code].join('\n');
    this.writeFile(
      join(moduleDir, 'dto', moduleName, `update-${moduleName}.dto.ts`),
      updateDtoCode,
    );

    const filterDtoGenerator = new FilterDtoGenerator({
      includeSwagger: features.swagger,
      includeComments: true,
    });
    const filterDtoResult = filterDtoGenerator.generate(tableMetadata, columns);
    const filterDtoCode = [...filterDtoResult.imports, '', filterDtoResult.code].join('\n');
    this.writeFile(
      join(moduleDir, 'dto', moduleName, `${moduleName}-filter.dto.ts`),
      filterDtoCode,
    );
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

    const architecture = this.config?.architecture || 'standalone';
    const isGateway = this.detectIsGateway(outputPath);

    let controllerCode: string;

    if (architecture === 'microservices' && isGateway) {
      // Generate Gateway Controller (uses ClientProxy)
      Logger.info('   🌐 Detected gateway app - generating gateway controller');
      const gatewayGenerator = new GatewayControllerGenerator(tableMetadata, columns, {
        tableName,
        serviceName: moduleName,
        serviceHost: process.env.SERVICE_HOST || 'localhost',
        servicePort: parseInt(process.env.SERVICE_PORT || '3001'),
        transport:
          (process.env.TRANSPORT_TYPE as 'TCP' | 'REDIS' | 'NATS' | 'MQTT' | 'RMQ') || 'TCP',
        enableSwagger: features.swagger,
        enableRateLimit: false,
      });
      controllerCode = gatewayGenerator.generate();
    } else if (architecture === 'microservices' && !isGateway) {
      // Generate Service Controller (uses @MessagePattern)
      Logger.info('   🔧 Detected service app - generating service controller');
      const serviceControllerGenerator = new ServiceControllerGenerator(tableMetadata, columns, {
        tableName,
        serviceName: moduleName,
        enableEvents: false,
      });
      controllerCode = serviceControllerGenerator.generate();
    } else {
      // Generate standard REST Controller
      Logger.info('   🎯 Generating standard REST controller');
      const controllerGenerator = new ControllerGenerator(tableMetadata, columns, {
        tableName,
        entityName,
        basePath, // Use schema/table format for standalone apps
        enableSwagger: features.swagger,
        enableValidation: features.validation,
        enablePagination: features.pagination,
        enableFileUpload: features.fileUpload,
        enableRbac: features.rbac,
        rbacResourceName: moduleName, // Use module name as resource (e.g., 'entity', 'location')
        storageProvider:
          (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'gcs' | 'azure') || 'local',
      });
      controllerCode = controllerGenerator.generate();
    }

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
      architecture,
      isGateway,
      serviceName: moduleName,
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
export * from './dto/${moduleName}/create-${moduleName}.dto';
export * from './dto/${moduleName}/update-${moduleName}.dto';
export * from './dto/${moduleName}/${moduleName}-filter.dto';
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
   * Configure Swagger in main.ts
   */
  private configureSwagger(outputPath: string, tableName: string, moduleName: string): void {
    try {
      // main.ts is in the parent directory of outputPath (which is typically 'src')
      const mainTsPath = join(outputPath, 'main.ts');

      if (!existsSync(mainTsPath)) {
        Logger.warn('⚠ main.ts not found, skipping Swagger configuration');
        return;
      }

      let mainContent = readFileSync(mainTsPath, 'utf-8');

      // Check if Swagger already configured
      if (mainContent.includes('SwaggerModule')) {
        // Add tag if not already present
        const tagPattern = new RegExp(`\\.addTag\\(['"]${moduleName}['"]`);
        if (!tagPattern.test(mainContent)) {
          // Find the last .addTag() line and add new tag after it
          const lastTagMatch = mainContent.match(/\.addTag\([^)]+\)/g);
          if (lastTagMatch) {
            const lastTag = lastTagMatch[lastTagMatch.length - 1];
            const lastTagIndex = mainContent.lastIndexOf(lastTag);
            const insertPos = lastTagIndex + lastTag.length;
            const newTag = `\n    .addTag('${moduleName}', '${this.toPascalCase(moduleName)} CRUD operations')`;
            mainContent = mainContent.slice(0, insertPos) + newTag + mainContent.slice(insertPos);

            writeFileSync(mainTsPath, mainContent, 'utf-8');
            Logger.success('   ✓ Swagger tag added to main.ts');
          } else {
            Logger.info('   ℹ Swagger configured in main.ts');
          }
        } else {
          Logger.info('   ℹ Swagger tag already exists in main.ts');
        }
        return;
      }

      // Add Swagger imports
      const lastImportMatch = mainContent.match(/import.*from.*['"];?\n(?!import)/);
      if (lastImportMatch && lastImportMatch.index !== undefined) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        const swaggerImports = `import { ValidationPipe } from '@nestjs/common';\nimport { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';\n`;
        mainContent =
          mainContent.slice(0, insertPos) + swaggerImports + mainContent.slice(insertPos);
      }

      // Add Swagger configuration before app.listen()
      const listenMatch = mainContent.match(/await app\.listen\(/);
      if (listenMatch && listenMatch.index !== undefined) {
        const swaggerConfig = `
  // Enable validation globally
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));

  // Swagger/OpenAPI configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated CRUD API documentation')
    .setVersion('1.0')
    .addTag('${moduleName}', '${this.toPascalCase(moduleName)} CRUD operations')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api', app, document);

  `;

        mainContent =
          mainContent.slice(0, listenMatch.index) +
          swaggerConfig +
          mainContent.slice(listenMatch.index);
      }

      // Update console.log to include Swagger URL
      mainContent = mainContent.replace(
        /console\.log\(`Application is running on: http:\/\/localhost:\$\{port\}`\);/,
        `console.log(\`Application is running on: http://localhost:\${port}\`);\n  console.log(\`Swagger documentation: http://localhost:\${port}/api\`);`,
      );

      writeFileSync(mainTsPath, mainContent, 'utf-8');
      Logger.success(`   ✓ Swagger configured in main.ts`);
    } catch (error) {
      Logger.error(`   ✗ Failed to configure Swagger: ${(error as Error).message}`);
      Logger.warn('   ℹ Please manually add Swagger configuration to main.ts');
    }
  }

  /**
   * Register RbacModule to app.module.ts if not already registered
   */
  private registerRbacModule(outputPath: string): void {
    try {
      const appModulePath = join(outputPath, 'app.module.ts');

      if (!existsSync(appModulePath)) {
        Logger.warn('⚠ app.module.ts not found, skipping RBAC registration');
        return;
      }

      let appModuleContent = readFileSync(appModulePath, 'utf-8');

      // Check if RbacModule already imported
      if (appModuleContent.includes('RBACModule') || appModuleContent.includes('RbacModule')) {
        Logger.info('   ℹ RbacModule already registered in app.module.ts');
        return;
      }

      // Add import statement after last import
      const lastImportMatch = appModuleContent.match(/import.*from.*['"];?\n(?!import)/);
      if (lastImportMatch && lastImportMatch.index !== undefined) {
        const insertPos = lastImportMatch.index + lastImportMatch[0].length;
        const importStatement = `import { RBACModule } from '@ojiepermana/nest-generator/rbac';\n`;
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

        // Add RBACModule with proper formatting
        const newImports = cleanedImports
          ? `${cleanedImports},\n${indent}RBACModule,\n  `
          : `\n${indent}RBACModule,\n  `;

        appModuleContent = appModuleContent.replace(
          /imports:\s*\[([^\]]*)\]/s,
          `imports: [${newImports}]`,
        );
      }

      writeFileSync(appModulePath, appModuleContent, 'utf-8');
      Logger.success('   ✓ RbacModule registered to app.module.ts');
    } catch (error) {
      Logger.error(`   ✗ Failed to register RbacModule: ${(error as Error).message}`);
      Logger.warn('   ℹ Please manually add RbacModule to app.module.ts imports');
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

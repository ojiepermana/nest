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
import { writeFileSync, existsSync, mkdirSync, readFileSync, readdirSync } from 'fs';
import { join, basename, dirname } from 'path';
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
import { StorageServiceGenerator } from '../../generators/features/storage-service.generator';
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

    // Auto-detect file columns
    const hasFileColumns = this.detectFileColumns(columns);
    if (hasFileColumns) {
      Logger.info('   📁 File upload columns detected - auto-enabling file upload feature');
    }

    // If --all flag is used, automatically skip prompts
    const skipPrompts = options.skipPrompts || options.all;

    // Step 5: Prompt for features or use provided
    const features = await this.promptFeatures(
      options.features,
      skipPrompts,
      options.all,
      hasFileColumns,
    );

    // Step 6: Prompt for output path or use provided (with app name if specified)
    const outputPath = await this.promptOutputPath(
      options.outputPath,
      skipPrompts,
      options.appName,
    );

    // Step 7: Generate all files
    this.generateFiles(tableMetadata, columns, features, outputPath, options.appName);

    // Extract module name for post-generation steps
    const moduleName = this.toModuleName(tableName.split('.').pop() || tableName);

    // Step 9: Auto-configure Swagger if enabled
    if (features.swagger) {
      // Skip Swagger for microservices (except gateway)
      const isGateway = options.appName === this.config?.microservices?.gatewayApp;
      const isMicroservice = this.config?.architecture === 'microservices';

      if (!isMicroservice || isGateway) {
        this.configureSwagger(outputPath, tableName, moduleName);
      } else {
        Logger.info('   ℹ Skipping Swagger (microservice uses MessagePattern, not HTTP)');
      }
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
    const projectRoot = this.findProjectRoot();
    const configDir = join(projectRoot, 'config', 'generator');

    // Try to detect which architecture config to use
    let configPath: string | undefined;
    const architectures = ['microservices', 'monorepo', 'standalone']; // Check microservices first

    // Check if any architecture-specific config exists
    for (const arch of architectures) {
      const archConfigPath = join(configDir, `${arch}.config.json`);
      if (existsSync(archConfigPath)) {
        // Verify the config matches the architecture by reading it
        try {
          const content = readFileSync(archConfigPath, 'utf-8');
          const config = JSON.parse(content);
          if (config.architecture === arch) {
            configPath = archConfigPath;
            break;
          }
        } catch {
          // If read/parse fails, skip this file
          continue;
        }
      }
    }

    // Fallback to old generator.config.json for backward compatibility
    if (!configPath) {
      const legacyConfigPath = join(projectRoot, 'generator.config.json');
      if (existsSync(legacyConfigPath)) {
        configPath = legacyConfigPath;
        Logger.warn(
          '⚠️  Using legacy generator.config.json. Consider running `npx nest-generator init` to migrate to new config structure.',
        );
      }
    }

    if (!configPath) {
      Logger.error('❌ No generator configuration found!');
      Logger.info('💡 Run `npx nest-generator init` first to initialize.');
      Logger.info(`   Expected config location: ${configDir}/{architecture}.config.json`);
      process.exit(1);
    }

    const configContent = readFileSync(configPath, 'utf-8');
    const rawConfig = JSON.parse(configContent) as GeneratorConfig;

    // Resolve environment variables in config
    this.config = this.resolveEnvVariables(rawConfig);
    Logger.info(`✓ Configuration loaded: ${basename(configPath)}`);
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
    hasFileColumns?: boolean,
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
        fileUpload: providedFeatures.fileUpload ?? hasFileColumns ?? false, // Auto-enable if file columns detected
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
        message: hasFileColumns
          ? '📁 Enable file upload? (✓ file columns detected)'
          : '📁 Enable file upload?',
        default: hasFileColumns ?? this.config?.features?.fileUpload ?? false,
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
          const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';
          const servicePath = join(projectRoot, servicesPath, appName, 'src');
          if (existsSync(join(projectRoot, servicesPath, appName))) {
            return servicePath;
          }
          Logger.error(`❌ Service '${appName}' not found in ${servicesPath}/`);
          process.exit(1);
        }

        // Same logic as monorepo
        const microservicePath = cwd.replace(projectRoot, '');
        const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';

        if (microservicePath.includes(`${servicesPath}/`)) {
          return join(cwd, 'src');
        }

        if (cwd === projectRoot) {
          const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';
          Logger.warn(
            '⚠️  Running from project root. Please use --app flag or cd into the service directory.',
          );
          Logger.info('   Example: nest-generator generate table --app=user');
          Logger.info(`   Or:      cd ${servicesPath}/user && nest-generator generate table`);
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
    const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';
    if (relativePath.includes(`${servicesPath}/gateway`)) {
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
    appName?: string,
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

    const architecture = this.config?.architecture || 'standalone';
    const isGateway = this.detectIsGateway(outputPath);

    // For microservices: Generate shared contracts first
    if (architecture === 'microservices' && !isGateway) {
      this.generateSharedContracts(tableMetadata, columns, moduleName, features);
    }

    // Create directory structure based on SCHEMA
    // Structure: src/{schema}/controllers/{table}.controller.ts
    const schemaName = this.toKebabCase(schema || 'default');
    const schemaDir = join(outputPath, schemaName);

    this.ensureDirectory(schemaDir);
    this.ensureDirectory(join(schemaDir, 'controllers'));
    this.ensureDirectory(join(schemaDir, 'entities'));
    this.ensureDirectory(join(schemaDir, 'dto'));
    this.ensureDirectory(join(schemaDir, 'dto', moduleName)); // DTO subdirectory per table
    this.ensureDirectory(join(schemaDir, 'repositories'));
    this.ensureDirectory(join(schemaDir, 'services'));

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
    this.writeFile(join(schemaDir, 'entities', `${moduleName}.entity.ts`), entityCode);
    Logger.info('   ✓ Entity generated');

    // 2. Generate DTOs
    Logger.info('   ⏳ Generating DTOs...');

    // For microservices service apps: Import from contracts instead of generating
    if (architecture === 'microservices' && !isGateway) {
      this.generateServiceDtosWithContracts(schemaDir, moduleName, tableMetadata, columns);
    } else {
      // Standalone, Monorepo, or Gateway: Generate DTOs directly
      const createDtoGenerator = new CreateDtoGenerator({
        includeSwagger: features.swagger,
        includeComments: true,
      });
      const createDtoResult = createDtoGenerator.generate(tableMetadata, columns);
      const createDtoCode = [...createDtoResult.imports, '', createDtoResult.code].join('\n');
      this.writeFile(
        join(schemaDir, 'dto', moduleName, `create-${moduleName}.dto.ts`),
        createDtoCode,
      );

      const updateDtoGenerator = new UpdateDtoGenerator({
        includeSwagger: features.swagger,
        includeComments: true,
      });
      const updateDtoResult = updateDtoGenerator.generate(tableMetadata, columns);
      const updateDtoCode = [...updateDtoResult.imports, '', updateDtoResult.code].join('\n');
      this.writeFile(
        join(schemaDir, 'dto', moduleName, `update-${moduleName}.dto.ts`),
        updateDtoCode,
      );

      const filterDtoGenerator = new FilterDtoGenerator({
        includeSwagger: features.swagger,
        includeComments: true,
      });
      const filterDtoResult = filterDtoGenerator.generate(tableMetadata, columns);
      const filterDtoCode = [...filterDtoResult.imports, '', filterDtoResult.code].join('\n');
      this.writeFile(
        join(schemaDir, 'dto', moduleName, `${moduleName}-filter.dto.ts`),
        filterDtoCode,
      );
    }

    Logger.info('   ✓ DTOs generated (Create, Update, Filter)');

    // 3. Generate Repository
    Logger.info('   ⏳ Generating repository...');
    const repositoryGenerator = new RepositoryGenerator(tableMetadata, columns, {
      tableName,
      entityName,
      useTypeORM: false,
    });
    const repositoryCode = repositoryGenerator.generate();
    this.writeFile(join(schemaDir, 'repositories', `${moduleName}.repository.ts`), repositoryCode);
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
    this.writeFile(join(schemaDir, 'services', `${moduleName}.service.ts`), serviceCode);
    Logger.info('   ✓ Service generated');

    // 4.5. Generate StorageService if file upload is enabled
    if (features.fileUpload && this.detectFileColumns(columns)) {
      Logger.info('   ⏳ Generating storage service...');
      this.generateStorageService(schemaDir, features);
      Logger.info('   ✓ Storage service generated');
    }

    // 5. Generate Controller
    Logger.info('   ⏳ Generating controller...');

    let controllerCode: string;

    if (architecture === 'microservices' && isGateway) {
      // Generate Gateway Controller (uses ClientProxy)
      Logger.info('   🌐 Detected gateway app - generating gateway controller');
      const gatewayGenerator = new GatewayControllerGenerator(tableMetadata, columns, {
        tableName,
        schemaName,
        serviceName: moduleName,
        serviceHost: process.env.SERVICE_HOST || 'localhost',
        servicePort: parseInt(process.env.SERVICE_PORT || '3001'),
        transport:
          (process.env.TRANSPORT_TYPE as 'TCP' | 'REDIS' | 'NATS' | 'MQTT' | 'RMQ') || 'TCP',
        enableSwagger: features.swagger,
        enableRateLimit: false,
        enableRbac: features.rbac,
        rbacResourceName: moduleName, // Use module name as resource
        enableFileUpload: features.fileUpload, // Enable file upload endpoints
      });
      controllerCode = gatewayGenerator.generate();
    } else if (architecture === 'microservices' && !isGateway) {
      // Generate Service Controller (uses @MessagePattern)
      Logger.info('   🔧 Detected service app - generating service controller');
      const serviceControllerGenerator = new ServiceControllerGenerator(tableMetadata, columns, {
        tableName,
        serviceName: moduleName,
        enableEvents: false,
        enableRbac: features.rbac,
        rbacResourceName: moduleName, // Use module name as resource
      });
      controllerCode = serviceControllerGenerator.generate();

      // Auto-generate Gateway Controller if gatewayApp is configured
      if (this.config?.microservices?.gatewayApp) {
        Logger.info('   🌐 Auto-generating gateway controller...');
        this.generateGatewayController(
          tableMetadata,
          columns,
          moduleName,
          tableName,
          features,
          basePath,
          schema || 'default',
          appName,
        );
      }
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

    this.writeFile(join(schemaDir, 'controllers', `${moduleName}.controller.ts`), controllerCode);
    Logger.info('   ✓ Controller generated');

    // 6. Update Schema Module (aggregates all tables in schema)
    Logger.info('   ⏳ Updating schema module...');
    this.generateOrUpdateSchemaModule(
      schemaDir,
      schemaName,
      moduleName,
      features,
      architecture,
      isGateway,
      appName, // Pass appName for gateway service config
    );
    Logger.info('   ✓ Schema module updated');

    // 7. Update barrel export (index.ts) at schema level
    Logger.info('   ⏳ Updating barrel exports...');
    this.generateOrUpdateSchemaIndex(schemaDir, schemaName, moduleName, isGateway);
    Logger.info('   ✓ Index file updated');

    // 8. Register schema module to app module (for service/standalone)
    if (!isGateway) {
      this.registerModuleToApp(outputPath, schemaName, architecture);
    }
  }

  /**
   * Generate or update schema-level module that aggregates all tables
   */
  private generateOrUpdateSchemaModule(
    schemaDir: string,
    schemaName: string,
    tableName: string,
    features: any,
    architecture: string,
    isGateway: boolean,
    appName?: string,
  ): void {
    const moduleFilePath = join(schemaDir, `${schemaName}.module.ts`);
    const pascalSchema = this.toPascalCase(schemaName);
    const pascalTable = this.toPascalCase(tableName);

    // Check if module already exists
    if (existsSync(moduleFilePath)) {
      // Update existing module - add new providers/controllers
      let moduleContent = readFileSync(moduleFilePath, 'utf-8');

      // Add controller import
      const controllerImport = `import { ${pascalTable}Controller } from './controllers/${tableName}.controller';`;
      if (!moduleContent.includes(controllerImport)) {
        const lastImportMatch = moduleContent.match(/^import .* from .*$/gm);
        if (lastImportMatch) {
          const lastImport = lastImportMatch[lastImportMatch.length - 1];
          moduleContent = moduleContent.replace(lastImport, `${lastImport}\n${controllerImport}`);
        }
      }

      // Only add service/repository imports for non-gateway
      if (!isGateway) {
        // Add service import
        const serviceImport = `import { ${pascalTable}Service } from './services/${tableName}.service';`;
        if (!moduleContent.includes(serviceImport)) {
          const controllerImportLine = moduleContent.indexOf(controllerImport);
          if (controllerImportLine !== -1) {
            moduleContent = moduleContent.replace(
              controllerImport,
              `${controllerImport}\n${serviceImport}`,
            );
          }
        }

        // Add repository import
        const repositoryImport = `import { ${pascalTable}Repository } from './repositories/${tableName}.repository';`;
        if (!moduleContent.includes(repositoryImport)) {
          const serviceImportLine = moduleContent.indexOf(serviceImport);
          if (serviceImportLine !== -1) {
            moduleContent = moduleContent.replace(
              serviceImport,
              `${serviceImport}\n${repositoryImport}`,
            );
          }
        }
      }

      // Add controller to controllers array
      const controllersMatch = moduleContent.match(/controllers:\s*\[([\s\S]*?)\]/);
      if (controllersMatch && !controllersMatch[1].includes(`${pascalTable}Controller`)) {
        moduleContent = moduleContent.replace(/controllers:\s*\[([\s\S]*?)\]/, (match, p1) => {
          const controllers = p1.trim();
          if (controllers) {
            return `controllers: [${controllers}, ${pascalTable}Controller]`;
          }
          return `controllers: [${pascalTable}Controller]`;
        });
      }

      // Only add providers/exports for non-gateway
      if (!isGateway) {
        // Add providers
        const providersMatch = moduleContent.match(/providers:\s*\[([\s\S]*?)\]/);
        if (providersMatch && !providersMatch[1].includes(`${pascalTable}Service`)) {
          moduleContent = moduleContent.replace(/providers:\s*\[([\s\S]*?)\]/, (match, p1) => {
            const providers = p1.trim();
            const newProviders = `${pascalTable}Service, ${pascalTable}Repository`;
            if (providers) {
              return `providers: [${providers}, ${newProviders}]`;
            }
            return `providers: [${newProviders}]`;
          });
        }

        // Add exports
        const exportsMatch = moduleContent.match(/exports:\s*\[([\s\S]*?)\]/);
        if (exportsMatch && !exportsMatch[1].includes(`${pascalTable}Service`)) {
          moduleContent = moduleContent.replace(/exports:\s*\[([\s\S]*?)\]/, (match, p1) => {
            const exports = p1.trim();
            const newExports = `${pascalTable}Service, ${pascalTable}Repository`;
            if (exports) {
              return `exports: [${exports}, ${newExports}]`;
            }
            return `exports: [${newExports}]`;
          });
        }
      }

      writeFileSync(moduleFilePath, moduleContent, 'utf-8');
      Logger.info(`   ✓ Added ${tableName} to existing ${schemaName}.module.ts`);
    } else {
      // Create new module
      const moduleCode = this.generateSchemaModuleCode(
        schemaName,
        tableName,
        features,
        architecture,
        isGateway,
        appName,
      );
      this.writeFile(moduleFilePath, moduleCode);
      Logger.info(`   ✓ Created new ${schemaName}.module.ts`);
    }
  }

  /**
   * Generate schema module code for first table
   */
  private generateSchemaModuleCode(
    schemaName: string,
    tableName: string,
    features: any,
    architecture: string,
    isGateway: boolean,
    appName?: string,
  ): string {
    const pascalSchema = this.toPascalCase(schemaName);
    const pascalTable = this.toPascalCase(tableName);

    // Get service config for gateway
    let serviceHost = 'localhost';
    let servicePort = 3001;
    let serviceName = schemaName;

    if (isGateway && appName) {
      serviceName = appName;
      const serviceConfig = this.config?.microservices?.services?.find(
        (s: any) => s.name === appName,
      );
      serviceHost = serviceConfig?.host || 'localhost';
      servicePort = serviceConfig?.port || 3001;
    }

    // Use ModuleGenerator to generate module code with features
    const moduleGenerator = new ModuleGenerator(
      { table_name: `${schemaName}.${tableName}` } as any,
      [],
      {
        tableName: `${schemaName}.${tableName}`,
        entityName: pascalSchema, // Use schema name as entity (e.g., "Entity" for entity schema)
        includeController: true,
        includeService: !isGateway,
        includeRepository: !isGateway,
        enableCaching: features.caching,
        enableAuditLog: features.auditLog,
        useTypeORM: false,
        architecture: architecture as 'standalone' | 'monorepo' | 'microservices',
        isGateway,
        serviceName,
        serviceHost,
        servicePort,
        customImports: [],
      },
    );

    return moduleGenerator.generate();
  }

  /**
   * Generate or update schema-level index.ts
   */
  private generateOrUpdateSchemaIndex(
    schemaDir: string,
    schemaName: string,
    tableName: string,
    isGateway: boolean = false,
  ): void {
    const indexFilePath = join(schemaDir, 'index.ts');
    const pascalTable = this.toPascalCase(tableName);

    // Gateway only exports DTOs and controllers (no entities/services/repositories)
    const exports = [
      `export * from './dto/${tableName}/create-${tableName}.dto';`,
      `export * from './dto/${tableName}/update-${tableName}.dto';`,
      `export * from './dto/${tableName}/${tableName}-filter.dto';`,
      `export * from './controllers/${tableName}.controller';`,
    ];

    // Service/standalone exports full stack
    if (!isGateway) {
      exports.push(
        `export * from './entities/${tableName}.entity';`,
        `export * from './services/${tableName}.service';`,
        `export * from './repositories/${tableName}.repository';`,
      );
    }

    if (existsSync(indexFilePath)) {
      // Update existing index
      let indexContent = readFileSync(indexFilePath, 'utf-8');

      exports.forEach((exportLine) => {
        if (!indexContent.includes(exportLine)) {
          indexContent += `${exportLine}\n`;
        }
      });

      // Add module export if not exists
      const moduleExport = `export * from './${schemaName}.module';`;
      if (!indexContent.includes(moduleExport)) {
        indexContent += `${moduleExport}\n`;
      }

      writeFileSync(indexFilePath, indexContent, 'utf-8');
    } else {
      // Create new index
      const indexCode = `// ${this.toPascalCase(schemaName)} Schema - Barrel Exports
${exports.join('\n')}
export * from './${schemaName}.module';
`;
      this.writeFile(indexFilePath, indexCode);
    }
  }

  /**
   * Generate or update contracts schema-level index.ts
   */
  private generateOrUpdateContractsIndex(
    contractsSchemaDir: string,
    schemaName: string,
    tableName: string,
  ): void {
    const indexFilePath = join(contractsSchemaDir, 'index.ts');

    const exports = [
      `export * from './dto/${tableName}/create-${tableName}.dto';`,
      `export * from './dto/${tableName}/update-${tableName}.dto';`,
      `export * from './dto/${tableName}/${tableName}-filter.dto';`,
    ];

    if (existsSync(indexFilePath)) {
      // Update existing index
      let indexContent = readFileSync(indexFilePath, 'utf-8');

      exports.forEach((exportLine) => {
        if (!indexContent.includes(exportLine)) {
          indexContent += `${exportLine}\n`;
        }
      });

      writeFileSync(indexFilePath, indexContent, 'utf-8');
    } else {
      // Create new index
      const indexCode = `// ${this.toPascalCase(schemaName)} Contracts - Shared DTOs for Microservices
${exports.join('\n')}
`;
      this.writeFile(indexFilePath, indexCode);
    }
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
   * Register schema module to gateway module (app.module.ts or gateway.module.ts)
   */
  private registerModuleToGateway(gatewayDir: string, schemaName: string): void {
    try {
      const srcDir = join(gatewayDir, 'src');

      // Try to find gateway module file
      let gatewayModulePath = join(srcDir, 'gateway.module.ts');
      let moduleFilename = 'gateway.module.ts';

      // If gateway.module.ts not found, try app.module.ts
      if (!existsSync(gatewayModulePath)) {
        gatewayModulePath = join(srcDir, 'app.module.ts');
        moduleFilename = 'app.module.ts';
      }

      // If still not found, search for any *.module.ts in src directory
      if (!existsSync(gatewayModulePath)) {
        const files = readdirSync(srcDir);
        const moduleFiles = files.filter(
          (file) =>
            file.endsWith('.module.ts') &&
            file !== 'app.module.ts' &&
            file !== `${schemaName}.module.ts`,
        );

        if (moduleFiles.length > 0) {
          moduleFilename = moduleFiles[0];
          gatewayModulePath = join(srcDir, moduleFilename);
        } else {
          Logger.warn(`   ⚠ No module file found in ${srcDir}, skipping auto-registration`);
          return;
        }
      }

      let moduleContent = readFileSync(gatewayModulePath, 'utf-8');
      const pascalSchema = this.toPascalCase(schemaName);
      const moduleImport = `import { ${pascalSchema}Module } from './${schemaName}/${schemaName}.module';`;

      // Check if already imported
      if (moduleContent.includes(moduleImport)) {
        return; // Already registered
      }

      // Add import after last import statement
      const lastImportMatch = moduleContent.match(/^import .* from .*$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        moduleContent = moduleContent.replace(lastImport, `${lastImport}\n${moduleImport}`);
      }

      // Add to imports array with proper formatting
      const importsMatch = moduleContent.match(/imports:\s*\[([^\]]*)\]/s);
      if (importsMatch && !importsMatch[1].includes(`${pascalSchema}Module`)) {
        const currentImports = importsMatch[1];

        // If empty array, just add the module
        if (!currentImports.trim()) {
          moduleContent = moduleContent.replace(
            /imports:\s*\[([^\]]*)\]/s,
            `imports: [\n    ${pascalSchema}Module,\n  ]`,
          );
        } else {
          // Add at the beginning of imports array with proper indent
          moduleContent = moduleContent.replace(
            /imports:\s*\[/,
            `imports: [\n    ${pascalSchema}Module,`,
          );
        }
      }

      writeFileSync(gatewayModulePath, moduleContent, 'utf-8');
      Logger.info(`   ✓ Registered ${pascalSchema}Module to ${moduleFilename}`);
    } catch (error) {
      Logger.warn(`   ⚠ Failed to register to gateway module: ${(error as Error).message}`);
    }
  }

  /**
   * Register service client to gateway module's ClientsModule
   * Bug Fix #1 & #3: Proper array formatting and auto-register service client
   */
  private registerServiceClientToGateway(gatewayDir: string, serviceName: string): void {
    try {
      const srcDir = join(gatewayDir, 'src');

      // Find gateway module file
      let gatewayModulePath = join(srcDir, 'gateway.module.ts');
      if (!existsSync(gatewayModulePath)) {
        gatewayModulePath = join(srcDir, 'app.module.ts');
      }
      if (!existsSync(gatewayModulePath)) {
        Logger.warn('   ⚠ Gateway module not found, skipping service client registration');
        return;
      }

      let moduleContent = readFileSync(gatewayModulePath, 'utf-8');
      const serviceConstant = `${serviceName.toUpperCase()}_SERVICE`;

      // Check if service client already registered
      if (moduleContent.includes(serviceConstant)) {
        Logger.info(`   ℹ ${serviceConstant} already registered`);
        return;
      }

      // Add ClientsModule and Transport imports if not present
      if (!moduleContent.includes("from '@nestjs/microservices'")) {
        const lastImportMatch = moduleContent.match(/^import .* from .*$/gm);
        if (lastImportMatch) {
          const lastImport = lastImportMatch[lastImportMatch.length - 1];
          const microservicesImport = `import { ClientsModule, Transport } from '@nestjs/microservices';`;
          moduleContent = moduleContent.replace(
            lastImport,
            `${lastImport}\n${microservicesImport}`,
          );
        }
      }

      // Get service config from microservices.services
      const serviceConfig = this.config?.microservices?.services?.find(
        (s: any) => s.name === serviceName,
      );
      const serviceHost = serviceConfig?.host || 'localhost';
      const servicePort = serviceConfig?.port || 3001;

      // Build service client registration
      const clientConfig = `    ClientsModule.register([
      {
        name: '${serviceConstant}',
        transport: Transport.TCP,
        options: {
          host: process.env.${serviceConstant}_HOST || '${serviceHost}',
          port: parseInt(process.env.${serviceConstant}_PORT || '${servicePort}'),
        },
      },
    ])`;

      // Fix Bug #1: Add as separate item in imports array, not concatenated
      const importsMatch = moduleContent.match(/imports:\s*\[([^\]]*)\]/s);
      if (importsMatch) {
        const currentImports = importsMatch[1].trim();

        // Check if ClientsModule.register already exists
        if (currentImports.includes('ClientsModule.register')) {
          Logger.info('   ℹ ClientsModule already configured, skipping');
          return;
        }

        let newImports;
        if (currentImports) {
          // Re-format existing imports to multi-line with proper indentation
          const existingModules = currentImports
            .split(',')
            .map((m) => m.trim())
            .filter((m) => m);
          const formattedExisting = existingModules.map((m) => `    ${m}`).join(',\n');
          newImports = `imports: [\n${formattedExisting},\n${clientConfig},\n  ]`;
        } else {
          newImports = `imports: [\n${clientConfig},\n  ]`;
        }

        moduleContent = moduleContent.replace(/imports:\s*\[([^\]]*)\]/s, newImports);
        writeFileSync(gatewayModulePath, moduleContent, 'utf-8');
        Logger.info(`   ✓ Registered ${serviceConstant} to ClientsModule`);
      }
    } catch (error) {
      Logger.warn(`   ⚠ Failed to register service client: ${(error as Error).message}`);
    }
  }

  /**
   * Add environment variables to gateway .env file
   * Bug Fix #4: Auto-append environment variables
   */
  private addGatewayEnvironmentVariables(gatewayDir: string, serviceName: string): void {
    try {
      const envPath = join(gatewayDir, '.env');
      const serviceConstant = serviceName.toUpperCase();
      const envVarHost = `${serviceConstant}_SERVICE_HOST`;
      const envVarPort = `${serviceConstant}_SERVICE_PORT`;

      let envContent = '';
      if (existsSync(envPath)) {
        envContent = readFileSync(envPath, 'utf-8');
      }

      // Check if variables already exist
      if (envContent.includes(envVarHost) && envContent.includes(envVarPort)) {
        return; // Already configured
      }

      // Append environment variables
      const newEnvVars = `\n# ${serviceName.charAt(0).toUpperCase() + serviceName.slice(1)} Service Configuration\n${envVarHost}=localhost\n${envVarPort}=3001\n`;

      envContent += newEnvVars;
      writeFileSync(envPath, envContent, 'utf-8');
      Logger.info(`   ✓ Added ${serviceName} service environment variables to .env`);
    } catch (error) {
      Logger.warn(`   ⚠ Failed to add environment variables: ${(error as Error).message}`);
    }
  }

  /**
   * Register generated module to app.module.ts (schema-based)
   */
  private registerModuleToApp(outputPath: string, schemaName: string, architecture: string): void {
    try {
      // Determine app module filename based on architecture
      let appModuleFilename = 'app.module.ts';
      if (architecture === 'microservices') {
        // For microservices, look for service-specific module (e.g., user-service.module.ts)
        const appDir = basename(dirname(outputPath));
        appModuleFilename = `${appDir}-service.module.ts`;
      }

      let appModulePath = join(outputPath, appModuleFilename);

      // If default not found, search for any *.module.ts in the output path (excluding schema modules)
      if (!existsSync(appModulePath)) {
        const files = readdirSync(outputPath);
        const moduleFiles = files.filter(
          (file) =>
            file.endsWith('.module.ts') &&
            file !== 'app.module.ts' &&
            file !== `${schemaName}.module.ts`,
        );

        if (moduleFiles.length > 0) {
          // Use the first module file found (e.g., standalone.module.ts, user.module.ts)
          appModuleFilename = moduleFiles[0];
          appModulePath = join(outputPath, appModuleFilename);
        } else {
          Logger.warn(`⚠ ${appModuleFilename} not found, skipping auto-registration`);
          Logger.warn(`⚠ app.module.ts not found, skipping auto-registration`);
          return;
        }
      }

      let appModuleContent = readFileSync(appModulePath, 'utf-8');
      const pascalSchema = this.toPascalCase(schemaName);
      const moduleImport = `import { ${pascalSchema}Module } from './${schemaName}/${schemaName}.module';`;

      // Check if already imported
      if (appModuleContent.includes(moduleImport)) {
        return; // Already registered
      }

      // Add import statement after last import
      const lastImportMatch = appModuleContent.match(/^import .* from .*$/gm);
      if (lastImportMatch) {
        const lastImport = lastImportMatch[lastImportMatch.length - 1];
        appModuleContent = appModuleContent.replace(lastImport, `${lastImport}\n${moduleImport}`);
      }

      // Add to imports array
      const importsMatch = appModuleContent.match(/imports:\s*\[([\s\S]*?)\]/);
      if (importsMatch && !importsMatch[1].includes(`${pascalSchema}Module`)) {
        appModuleContent = appModuleContent.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
          const imports = p1.trim();
          if (imports) {
            return `imports: [${imports}, ${pascalSchema}Module]`;
          }
          return `imports: [${pascalSchema}Module]`;
        });
      }

      writeFileSync(appModulePath, appModuleContent, 'utf-8');
      Logger.info(`   ✓ Registered ${pascalSchema}Module to ${appModuleFilename}`);
    } catch (error) {
      Logger.warn(`   ⚠ Failed to register module: ${(error as Error).message}`);
    }
  }

  /**
   * Register generated module to app.module.ts (legacy per-table method)
   */
  private registerModuleToAppLegacy(
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

      // Add Swagger imports (check if not already present)
      if (!mainContent.includes("from '@nestjs/swagger'")) {
        const lastImportMatch = mainContent.match(/import.*from.*['"];?\n(?!import)/);
        if (lastImportMatch && lastImportMatch.index !== undefined) {
          const insertPos = lastImportMatch.index + lastImportMatch[0].length;
          const swaggerImports = `import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';\n`;
          mainContent =
            mainContent.slice(0, insertPos) + swaggerImports + mainContent.slice(insertPos);
        }
      }

      // Add ValidationPipe import if not present
      if (
        !mainContent.includes('ValidationPipe') &&
        !mainContent.includes("from '@nestjs/common'")
      ) {
        const lastImportMatch = mainContent.match(/import.*from.*['"];?\n(?!import)/);
        if (lastImportMatch && lastImportMatch.index !== undefined) {
          const insertPos = lastImportMatch.index + lastImportMatch[0].length;
          const validationImport = `import { ValidationPipe } from '@nestjs/common';\n`;
          mainContent =
            mainContent.slice(0, insertPos) + validationImport + mainContent.slice(insertPos);
        }
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
      // Try to find root module file (app.module.ts or *-service.module.ts)
      let appModulePath = join(outputPath, 'app.module.ts');

      if (!existsSync(appModulePath)) {
        // For microservices, look for *-service.module.ts or *-app.module.ts
        const files = readdirSync(outputPath).filter(
          (f) => f.endsWith('-service.module.ts') || f.endsWith('-app.module.ts'),
        );

        if (files.length > 0) {
          appModulePath = join(outputPath, files[0]);
        } else {
          // Silently skip if no root module found (RBAC is optional feature)
          return;
        }
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
        const importStatement = `import { RBACModule } from '@ojiepermana/nest-rbac';\n`;
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
   * Auto-generate Gateway Controller in gateway app with schema-based structure
   * Called when generating service controller in microservices architecture
   */
  private generateGatewayController(
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
    moduleName: string,
    tableName: string,
    features: any,
    basePath: string,
    schema: string,
    appName?: string,
  ): void {
    try {
      const projectRoot = this.findProjectRoot();
      const gatewayAppPath = this.config?.microservices?.gatewayApp;

      if (!gatewayAppPath) {
        Logger.warn('   ⚠ gatewayApp not configured in generator.config.json');
        return;
      }

      // Resolve gateway path
      const gatewayDir = join(projectRoot, gatewayAppPath);
      if (!existsSync(gatewayDir)) {
        Logger.warn(`   ⚠ Gateway app not found at: ${gatewayDir}`);
        return;
      }

      // Create gateway SCHEMA directory (not table directory)
      const schemaName = this.toKebabCase(schema);
      const gatewaySchemaDir = join(gatewayDir, 'src', schemaName);
      this.ensureDirectory(gatewaySchemaDir);
      this.ensureDirectory(join(gatewaySchemaDir, 'controllers'));
      this.ensureDirectory(join(gatewaySchemaDir, 'dto'));
      this.ensureDirectory(join(gatewaySchemaDir, 'dto', moduleName));

      // Generate Gateway Controller
      // Use appName for service injection (e.g., 'entity' -> ENTITY_SERVICE)
      // If no appName, extract from schema (e.g., 'entity.location' -> 'entity')
      const serviceNameForInjection = appName || schema.split('.')[0] || moduleName;

      // Get service config from microservices.services
      const serviceConfig = this.config?.microservices?.services?.find(
        (s: any) => s.name === serviceNameForInjection,
      );
      const serviceHost = serviceConfig?.host || 'localhost';
      const servicePort = serviceConfig?.port || 3001;
      const serviceTransport = (serviceConfig?.transport || 'TCP') as
        | 'TCP'
        | 'REDIS'
        | 'NATS'
        | 'MQTT'
        | 'RMQ';

      const gatewayGenerator = new GatewayControllerGenerator(tableMetadata, columns, {
        tableName,
        schemaName,
        serviceName: serviceNameForInjection, // For @Inject('ENTITY_SERVICE')
        resourceName: moduleName, // For message patterns (location, business-entity, etc.)
        serviceHost,
        servicePort,
        transport: serviceTransport,
        enableSwagger: features.swagger,
        enableRateLimit: false,
        enableRbac: features.rbac,
        rbacResourceName: moduleName, // Use module name as resource
        enableFileUpload: features.fileUpload, // Enable file upload endpoints
      });
      const gatewayControllerCode = gatewayGenerator.generate();
      this.writeFile(
        join(gatewaySchemaDir, 'controllers', `${moduleName}.controller.ts`),
        gatewayControllerCode,
      );

      // Generate DTOs in gateway that extend from contracts (with Swagger)
      this.ensureDirectory(join(gatewaySchemaDir, 'dto', moduleName));
      this.generateGatewayDtosWithContracts(
        join(gatewaySchemaDir, 'dto', moduleName),
        moduleName,
        tableMetadata,
        columns,
        features.swagger,
      );

      // Generate/Update Gateway Schema Module
      this.generateOrUpdateSchemaModule(
        gatewaySchemaDir,
        schemaName,
        moduleName,
        features,
        'microservices',
        true,
        serviceNameForInjection, // Pass appName for service config
      );

      // Generate/Update barrel export for gateway schema
      this.generateOrUpdateSchemaIndex(gatewaySchemaDir, schemaName, moduleName, true);

      // Register schema module to gateway.module.ts
      this.registerModuleToGateway(gatewayDir, schemaName);

      // Register service client to gateway module if not exists
      this.registerServiceClientToGateway(gatewayDir, serviceNameForInjection);

      // Add environment variables to gateway .env if not exists
      this.addGatewayEnvironmentVariables(gatewayDir, serviceNameForInjection);

      Logger.success(`   ✓ Gateway controller generated at: ${gatewayAppPath}/src/${schemaName}`);
    } catch (error) {
      Logger.error(`   ✗ Failed to generate gateway controller: ${(error as Error).message}`);
      Logger.warn('   ℹ You can manually generate gateway controller with --app=gateway');
    }
  }

  /**
   * Generate barrel export for gateway module (only DTOs and Module)
   */
  private generateGatewayIndexFile(moduleName: string): string {
    return `// Gateway Module - Barrel Exports
export * from './dto/${moduleName}/create-${moduleName}.dto';
export * from './dto/${moduleName}/update-${moduleName}.dto';
export * from './dto/${moduleName}/${moduleName}-filter.dto';
export * from './controllers/${moduleName}.controller';
export * from './${moduleName}.module';
`;
  }

  /**
   * Generate shared contracts for microservices (organized by schema)
   */
  private generateSharedContracts(
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
    moduleName: string,
    features: any,
  ): void {
    try {
      const projectRoot = this.findProjectRoot();
      const schema = tableMetadata.schema_name || 'default';
      const schemaName = this.toKebabCase(schema);
      const contractsSchemaDir = join(projectRoot, 'libs', 'contracts', schemaName);

      Logger.info('   📝 Generating shared contracts...');

      // Create contracts directory structure (per schema)
      this.ensureDirectory(join(contractsSchemaDir, 'dto', moduleName));
      this.ensureDirectory(join(contractsSchemaDir, 'interfaces'));

      // Generate base DTOs in contracts (without Swagger decorators)
      const createDtoGenerator = new CreateDtoGenerator({
        includeSwagger: false, // Base contracts don't need Swagger
        includeComments: true,
      });
      const createDtoResult = createDtoGenerator.generate(tableMetadata, columns);
      const createDtoCode = [...createDtoResult.imports, '', createDtoResult.code].join('\n');
      this.writeFile(
        join(contractsSchemaDir, 'dto', moduleName, `create-${moduleName}.dto.ts`),
        createDtoCode,
      );

      const updateDtoGenerator = new UpdateDtoGenerator({
        includeSwagger: false,
        includeComments: true,
      });
      const updateDtoResult = updateDtoGenerator.generate(tableMetadata, columns);
      const updateDtoCode = [...updateDtoResult.imports, '', updateDtoResult.code].join('\n');
      this.writeFile(
        join(contractsSchemaDir, 'dto', moduleName, `update-${moduleName}.dto.ts`),
        updateDtoCode,
      );

      const filterDtoGenerator = new FilterDtoGenerator({
        includeSwagger: false,
        includeComments: true,
      });
      const filterDtoResult = filterDtoGenerator.generate(tableMetadata, columns);
      const filterDtoCode = [...filterDtoResult.imports, '', filterDtoResult.code].join('\n');
      this.writeFile(
        join(contractsSchemaDir, 'dto', moduleName, `${moduleName}-filter.dto.ts`),
        filterDtoCode,
      );

      // Generate/Update barrel export for contracts schema
      this.generateOrUpdateContractsIndex(contractsSchemaDir, schemaName, moduleName);

      Logger.success(`   ✓ Shared contracts generated at: libs/contracts/${schemaName}`);
    } catch (error) {
      Logger.error(`   ✗ Failed to generate shared contracts: ${(error as Error).message}`);
      Logger.warn('   ℹ Falling back to local DTOs');
    }
  }

  /**
   * Generate service DTOs that extend from shared contracts
   */
  private generateServiceDtosWithContracts(
    moduleDir: string,
    moduleName: string,
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
  ): void {
    const entityName = this.toPascalCase(moduleName);
    const dtoDir = join(moduleDir, 'dto', moduleName);
    const schema = tableMetadata.schema_name || 'default';
    const schemaName = this.toKebabCase(schema);

    // Generate DTOs that extend from contracts (using schema-based path)
    const createDtoCode = `import { Create${entityName}Dto } from '@app/contracts/${schemaName}';

/**
 * Service-specific Create DTO
 * Extends base contract with internal validation
 */
export class Create${entityName}InternalDto extends Create${entityName}Dto {
  // Add service-specific fields here if needed
  // Example:
  // @IsUUID()
  // tenantId?: string;
}

// Re-export base contract for compatibility
export { Create${entityName}Dto };
`;

    const updateDtoCode = `import { Update${entityName}Dto } from '@app/contracts/${schemaName}';

/**
 * Service-specific Update DTO
 * Extends base contract with internal validation
 */
export class Update${entityName}InternalDto extends Update${entityName}Dto {
  // Add service-specific fields here if needed
}

// Re-export base contract for compatibility
export { Update${entityName}Dto };
`;

    const filterDtoCode = `import { ${entityName}FilterDto } from '@app/contracts/${schemaName}';

/**
 * Service-specific Filter DTO
 * Extends base contract with internal validation
 */
export class ${entityName}FilterInternalDto extends ${entityName}FilterDto {
  // Add service-specific filters here if needed
}

// Re-export base contract for compatibility
export { ${entityName}FilterDto };
`;

    this.writeFile(join(dtoDir, `create-${moduleName}.dto.ts`), createDtoCode);
    this.writeFile(join(dtoDir, `update-${moduleName}.dto.ts`), updateDtoCode);
    this.writeFile(join(dtoDir, `${moduleName}-filter.dto.ts`), filterDtoCode);

    Logger.info('   ✓ Service DTOs generated (extends from contracts)');
  }

  /**
   * Generate gateway DTOs that extend from shared contracts with Swagger
   */
  private generateGatewayDtosWithContracts(
    dtoDir: string,
    moduleName: string,
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
    enableSwagger: boolean,
  ): void {
    const entityName = this.toPascalCase(moduleName);
    const schema = tableMetadata.schema_name || 'default';
    const schemaName = this.toKebabCase(schema);
    const swaggerImport = enableSwagger
      ? "import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';\n"
      : '';

    // Generate Create DTO with Swagger decorators (using schema-based path)
    const createDtoCode = `${swaggerImport}import { Create${entityName}Dto } from '@app/contracts/${schemaName}';
import { IsString, IsOptional } from 'class-validator';

/**
 * Gateway Create DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class Create${entityName}RequestDto extends Create${entityName}Dto {
  // Override properties to add Swagger decorators if needed
  // Example:
  // @ApiProperty({ example: 'Example value' })
  // @IsString()
  // name: string;
}

// Re-export base contract for compatibility
export { Create${entityName}Dto };
`;

    const updateDtoCode = `${swaggerImport}import { Update${entityName}Dto } from '@app/contracts/${schemaName}';

/**
 * Gateway Update DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class Update${entityName}RequestDto extends Update${entityName}Dto {
  // Override properties to add Swagger decorators if needed
}

// Re-export base contract for compatibility
export { Update${entityName}Dto };
`;

    const filterDtoCode = `${swaggerImport}import { ${entityName}FilterDto } from '@app/contracts/${schemaName}';

/**
 * Gateway Filter DTO
 * Extends base contract with HTTP-specific validation and Swagger
 */
export class ${entityName}FilterRequestDto extends ${entityName}FilterDto {
  // Override properties to add Swagger decorators if needed
}

// Re-export base contract for compatibility
export { ${entityName}FilterDto };
`;

    this.writeFile(join(dtoDir, `create-${moduleName}.dto.ts`), createDtoCode);
    this.writeFile(join(dtoDir, `update-${moduleName}.dto.ts`), updateDtoCode);
    this.writeFile(join(dtoDir, `${moduleName}-filter.dto.ts`), filterDtoCode);

    Logger.info('   ✓ Gateway DTOs generated (extends from contracts with Swagger)');
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

  /**
   * Detect if table has file upload columns by column naming patterns
   */
  private detectFileColumns(columns: ColumnMetadata[]): boolean {
    return columns.some((col) => {
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
   * Generate StorageService for file uploads
   */
  private generateStorageService(
    schemaDir: string,
    features: Required<NonNullable<GenerateCommandOptions['features']>>,
  ): void {
    const storageProvider =
      (process.env.STORAGE_PROVIDER as 'local' | 's3' | 'gcs' | 'azure') || 'local';

    const storageGenerator = new StorageServiceGenerator({
      provider: storageProvider,
      tableName: 'storage',
    });

    const storageCode = storageGenerator.generate();
    this.writeFile(join(schemaDir, 'services', 'storage.service.ts'), storageCode);

    // Generate .env.example with storage configuration
    const projectRoot = this.findProjectRoot();
    const envExamplePath = join(projectRoot, '.env.example');
    const envDocs = storageGenerator.generateEnvDocs();

    // Append to .env.example if exists, otherwise create
    if (existsSync(envExamplePath)) {
      const existingContent = readFileSync(envExamplePath, 'utf-8');
      if (!existingContent.includes('# Storage Service Configuration')) {
        writeFileSync(envExamplePath, `${existingContent}\n\n${envDocs}\n`, 'utf-8');
        Logger.info(`   ✓ Updated .env.example with storage configuration`);
      }
    } else {
      writeFileSync(envExamplePath, `${envDocs}\n`, 'utf-8');
      Logger.info(`   ✓ Created .env.example with storage configuration`);
    }
  }
}

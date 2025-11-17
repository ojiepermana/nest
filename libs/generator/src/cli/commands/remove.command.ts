/**
 * Remove Command
 *
 * Removes generated CRUD files and updates modules for schema-based architecture
 * Supports: standalone, monorepo, microservices
 */

import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.util';

export interface RemoveCommandOptions {
  table?: string;
  app?: string;
  force?: boolean;
}

export class RemoveCommand {
  private config: any;

  /**
   * Execute remove command
   */
  async execute(table: string, options: RemoveCommandOptions = {}): Promise<void> {
    Logger.info('🗑️  Remove Generated CRUD Files\n');

    // Load configuration
    this.config = this.loadConfig();

    // Parse table name (schema.table format)
    const [schema, tableName] = table.includes('.') ? table.split('.') : ['public', table];
    const schemaName = this.toKebabCase(schema);
    const moduleName = this.toKebabCase(tableName);

    Logger.info(`📊 Removing: ${schema}.${tableName}`);
    Logger.info(`   Schema: ${schemaName}`);
    Logger.info(`   Table: ${moduleName}\n`);

    const architecture = this.config?.architecture || 'standalone';
    const appName = options.app;

    if (architecture === 'microservices') {
      await this.removeMicroservicesFiles(schemaName, moduleName, appName);
    } else if (architecture === 'monorepo') {
      await this.removeMonorepoFiles(schemaName, moduleName, appName);
    } else {
      await this.removeStandaloneFiles(schemaName, moduleName);
    }

    Logger.success('\n✅ Remove completed!');
  }

  /**
   * Remove files for microservices architecture
   */
  private async removeMicroservicesFiles(
    schemaName: string,
    moduleName: string,
    appName?: string,
  ): Promise<void> {
    const serviceName = appName || schemaName;
    const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';
    const gatewayAppPath = this.config?.microservices?.gatewayApp || 'apps/microservices/gateway';

    // 1. Remove from service app
    const servicePath = join(process.cwd(), servicesPath, serviceName, 'src', schemaName);
    if (existsSync(servicePath)) {
      Logger.info('🔧 Removing from service app...');
      this.removeTableFiles(servicePath, moduleName);
      this.updateSchemaModule(servicePath, schemaName, moduleName, false);
      Logger.success('   ✓ Service files removed');
    }

    // 2. Remove from gateway app
    const gatewayPath = join(process.cwd(), gatewayAppPath, 'src', schemaName);
    if (existsSync(gatewayPath)) {
      Logger.info('🌐 Removing from gateway app...');
      this.removeTableFilesFromGateway(gatewayPath, moduleName);
      this.updateSchemaModule(gatewayPath, schemaName, moduleName, true);
      Logger.success('   ✓ Gateway files removed');
    }

    // 3. Remove from contracts
    const contractsPath = join(process.cwd(), 'libs/contracts', schemaName);
    if (existsSync(contractsPath)) {
      Logger.info('📝 Removing contracts...');
      this.removeContractFiles(contractsPath, moduleName);
      Logger.success('   ✓ Contract files removed');
    }

    // 4. Check if schema is empty and remove if needed
    this.cleanupEmptySchema(servicePath, schemaName, serviceName);
    this.cleanupEmptySchema(gatewayPath, schemaName, gatewayAppPath);
    this.cleanupEmptyContractsSchema(contractsPath, schemaName);
  }

  /**
   * Remove files for monorepo architecture
   */
  private async removeMonorepoFiles(
    schemaName: string,
    moduleName: string,
    appName?: string,
  ): Promise<void> {
    const appsPath = this.config?.monorepo?.appsPath || 'apps/monorepo';
    const targetApp = appName || schemaName;

    const appPath = join(process.cwd(), appsPath, targetApp, 'src', schemaName);
    if (existsSync(appPath)) {
      Logger.info(`🔧 Removing from ${targetApp} app...`);
      this.removeTableFiles(appPath, moduleName);
      this.updateSchemaModule(appPath, schemaName, moduleName, false);
      Logger.success('   ✓ Files removed');

      this.cleanupEmptySchema(appPath, schemaName, targetApp);
    } else {
      Logger.warn(`   ⚠ Path not found: ${appPath}`);
    }
  }

  /**
   * Remove files for standalone architecture
   */
  private async removeStandaloneFiles(schemaName: string, moduleName: string): Promise<void> {
    const srcPath = join(process.cwd(), 'src', schemaName);
    if (existsSync(srcPath)) {
      Logger.info('🔧 Removing files...');
      this.removeTableFiles(srcPath, moduleName);
      this.updateSchemaModule(srcPath, schemaName, moduleName, false);
      Logger.success('   ✓ Files removed');

      this.cleanupEmptySchema(srcPath, schemaName, 'standalone');
    } else {
      Logger.warn(`   ⚠ Path not found: ${srcPath}`);
    }
  }

  /**
   * Remove table-specific files (service/standalone)
   */
  private removeTableFiles(schemaPath: string, moduleName: string): void {
    const filesToRemove = [
      join(schemaPath, 'controllers', `${moduleName}.controller.ts`),
      join(schemaPath, 'services', `${moduleName}.service.ts`),
      join(schemaPath, 'repositories', `${moduleName}.repository.ts`),
      join(schemaPath, 'entities', `${moduleName}.entity.ts`),
      join(schemaPath, 'dto', moduleName),
    ];

    filesToRemove.forEach((path) => {
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
        Logger.info(`   ✓ Deleted ${path.split('/').slice(-2).join('/')}`);
      }
    });
  }

  /**
   * Remove table-specific files from gateway (only controllers and DTOs)
   */
  private removeTableFilesFromGateway(gatewayPath: string, moduleName: string): void {
    const filesToRemove = [
      join(gatewayPath, 'controllers', `${moduleName}.controller.ts`),
      join(gatewayPath, 'dto', moduleName),
    ];

    filesToRemove.forEach((path) => {
      if (existsSync(path)) {
        rmSync(path, { recursive: true, force: true });
        Logger.info(`   ✓ Deleted ${path.split('/').slice(-2).join('/')}`);
      }
    });
  }

  /**
   * Remove contract files
   */
  private removeContractFiles(contractsPath: string, moduleName: string): void {
    const dtoPath = join(contractsPath, 'dto', moduleName);
    if (existsSync(dtoPath)) {
      rmSync(dtoPath, { recursive: true, force: true });
      Logger.info(`   ✓ Deleted dto/${moduleName}`);
    }

    // Update contracts index.ts
    const indexPath = join(contractsPath, 'index.ts');
    if (existsSync(indexPath)) {
      let content = readFileSync(indexPath, 'utf-8');
      const exportsToRemove = [
        `export * from './dto/${moduleName}/create-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/update-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/${moduleName}-filter.dto';`,
      ];

      exportsToRemove.forEach((exp) => {
        content = content.replace(new RegExp(`${exp}\\n?`, 'g'), '');
      });

      writeFileSync(indexPath, content, 'utf-8');
    }
  }

  /**
   * Update schema module to remove table references
   */
  private updateSchemaModule(
    schemaPath: string,
    schemaName: string,
    moduleName: string,
    isGateway: boolean,
  ): void {
    const moduleFile = join(schemaPath, `${schemaName}.module.ts`);
    if (!existsSync(moduleFile)) {
      return;
    }

    let content = readFileSync(moduleFile, 'utf-8');
    const pascalTable = this.toPascalCase(moduleName);

    // Remove imports
    const importsToRemove = [
      `import { ${pascalTable}Controller } from './controllers/${moduleName}.controller';`,
    ];

    if (!isGateway) {
      importsToRemove.push(
        `import { ${pascalTable}Service } from './services/${moduleName}.service';`,
        `import { ${pascalTable}Repository } from './repositories/${moduleName}.repository';`,
      );
    }

    importsToRemove.forEach((imp) => {
      content = content.replace(new RegExp(`${imp}\\n?`, 'g'), '');
    });

    // Remove from controllers array
    content = this.removeFromArray(content, 'controllers', `${pascalTable}Controller`);

    // Remove from providers array (service/standalone only)
    if (!isGateway) {
      content = this.removeFromArray(content, 'providers', `${pascalTable}Service`);
      content = this.removeFromArray(content, 'providers', `${pascalTable}Repository`);
      content = this.removeFromArray(content, 'exports', `${pascalTable}Service`);
      content = this.removeFromArray(content, 'exports', `${pascalTable}Repository`);
    }

    writeFileSync(moduleFile, content, 'utf-8');
    Logger.info(`   ✓ Updated ${schemaName}.module.ts`);

    // Update index.ts barrel exports
    this.updateBarrelExports(schemaPath, moduleName, isGateway);
  }

  /**
   * Update barrel exports (index.ts) to remove table references
   */
  private updateBarrelExports(schemaPath: string, moduleName: string, isGateway: boolean): void {
    const indexPath = join(schemaPath, 'index.ts');
    if (!existsSync(indexPath)) {
      return;
    }

    let indexContent = readFileSync(indexPath, 'utf-8');
    const exportsToRemove: string[] = [];

    // Gateway only exports controllers and DTOs
    if (isGateway) {
      exportsToRemove.push(
        `export * from './dto/${moduleName}/create-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/update-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/${moduleName}-filter.dto';`,
        `export * from './controllers/${moduleName}.controller';`,
      );
    } else {
      // Service/standalone exports everything
      exportsToRemove.push(
        `export * from './dto/${moduleName}/create-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/update-${moduleName}.dto';`,
        `export * from './dto/${moduleName}/${moduleName}-filter.dto';`,
        `export * from './entities/${moduleName}.entity';`,
        `export * from './controllers/${moduleName}.controller';`,
        `export * from './services/${moduleName}.service';`,
        `export * from './repositories/${moduleName}.repository';`,
      );
    }

    exportsToRemove.forEach((exp) => {
      const escaped = exp.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
      indexContent = indexContent.replace(new RegExp(`${escaped}\\s*\\n?`, 'g'), '');
    });

    // Clean up multiple empty lines
    indexContent = indexContent.replace(/\n{3,}/g, '\n\n');

    writeFileSync(indexPath, indexContent, 'utf-8');
    Logger.info(`   ✓ Updated index.ts`);
  }

  /**
   * Cleanup empty schema directory and module
   */
  private cleanupEmptySchema(schemaPath: string, schemaName: string, appName: string): void {
    if (!existsSync(schemaPath)) {
      return;
    }

    // Check if schema module is empty (no controllers and no providers)
    const moduleFile = join(schemaPath, `${schemaName}.module.ts`);
    if (existsSync(moduleFile)) {
      const content = readFileSync(moduleFile, 'utf-8');
      const hasControllers = !content.match(/controllers:\s*\[\s*\]/);
      const hasProviders = !content.match(/providers:\s*\[\s*\]/);

      // Schema is empty if both arrays are empty
      if (!hasControllers && !hasProviders) {
        // Schema is empty, remove entire schema directory
        Logger.info(`🧹 Removing empty schema directory: ${schemaName}`);
        rmSync(schemaPath, { recursive: true, force: true });
        Logger.success(`   ✓ Removed ${schemaName}/ directory`);

        // Remove schema module from app module
        this.removeSchemaModuleFromApp(appName, schemaName);
      }
    }
  }

  /**
   * Cleanup empty contracts schema
   */
  private cleanupEmptyContractsSchema(contractsPath: string, schemaName: string): void {
    if (!existsSync(contractsPath)) {
      return;
    }

    const dtoDir = join(contractsPath, 'dto');
    if (!existsSync(dtoDir) || readdirSync(dtoDir).length === 0) {
      Logger.info(`🧹 Removing empty contracts schema: ${schemaName}`);
      rmSync(contractsPath, { recursive: true, force: true });
      Logger.success(`   ✓ Removed contracts/${schemaName}/ directory`);
    }
  }

  /**
   * Remove schema module from app module
   */
  private removeSchemaModuleFromApp(appName: string, schemaName: string): void {
    const architecture = this.config?.architecture;
    let appModulePath: string;

    if (architecture === 'microservices') {
      const servicesPath = this.config?.microservices?.servicesPath || 'apps/microservices';
      const isGateway = appName === this.config?.microservices?.gatewayApp;

      if (isGateway) {
        appModulePath = join(process.cwd(), servicesPath, appName, 'src', 'gateway.module.ts');
      } else {
        // Find service root module (*-service.module.ts)
        const srcDir = join(process.cwd(), servicesPath, appName, 'src');
        const files = existsSync(srcDir)
          ? readdirSync(srcDir).filter((f) => f.endsWith('-service.module.ts'))
          : [];
        if (files.length > 0) {
          appModulePath = join(srcDir, files[0]);
        } else {
          return;
        }
      }
    } else if (architecture === 'monorepo') {
      const appsPath = this.config?.monorepo?.appsPath || 'apps/monorepo';
      appModulePath = join(process.cwd(), appsPath, appName, 'src', 'app.module.ts');
    } else {
      appModulePath = join(process.cwd(), 'src', 'app.module.ts');
    }

    if (!existsSync(appModulePath)) {
      return;
    }

    let content = readFileSync(appModulePath, 'utf-8');
    const pascalSchema = this.toPascalCase(schemaName);

    // Remove import
    const importLine = `import { ${pascalSchema}Module } from './${schemaName}/${schemaName}.module';`;
    const escaped = importLine.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    content = content.replace(new RegExp(`${escaped}\\s*\\n?`, 'g'), '');

    // Remove from imports array
    content = this.removeFromArray(content, 'imports', `${pascalSchema}Module`);

    writeFileSync(appModulePath, content, 'utf-8');
    Logger.info(`   ✓ Removed ${pascalSchema}Module from ${appModulePath.split('/').pop()}`);
  }

  /**
   * Load generator configuration
   */
  private loadConfig(): any {
    const configPaths = [
      join(process.cwd(), 'config/generator/microservices.config.json'),
      join(process.cwd(), 'config/generator/monorepo.config.json'),
      join(process.cwd(), 'config/generator/standalone.config.json'),
      join(process.cwd(), 'nest-generator.config.json'),
    ];

    for (const configPath of configPaths) {
      if (existsSync(configPath)) {
        return JSON.parse(readFileSync(configPath, 'utf-8'));
      }
    }

    return null;
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
   * Convert string to PascalCase
   */
  private toPascalCase(str: string): string {
    return str
      .split(/[-_\s]/)
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join('');
  }

  /**
   * Escape special regex characters
   */
  private escapeRegex(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  /**
   * Remove item from array in code (controllers, providers, exports)
   */
  private removeFromArray(content: string, arrayName: string, itemName: string): string {
    // Match: arrayName: [item1, item2, itemToRemove, item3]
    const arrayPattern = new RegExp(`(${arrayName}\\s*:\\s*\\[)([^\\]]*)(\\])`, 'gs');

    return content.replace(arrayPattern, (match, before, items, after) => {
      // Split items by comma, trim, and filter
      const itemList = items
        .split(',')
        .map((i: string) => i.trim())
        .filter((i: string) => i && i !== itemName);

      // Reconstruct array
      if (itemList.length === 0) {
        return `${before}${after}`;
      }
      return `${before}\n    ${itemList.join(',\n    ')},\n  ${after}`;
    });
  }
}

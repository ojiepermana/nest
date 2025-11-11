/**
 * Delete Command
 *
 * Deletes generated CRUD module and cleans up from parent module
 */

import { existsSync, readFileSync, writeFileSync, rmSync, readdirSync } from 'fs';
import { join } from 'path';
import { Logger } from '../../utils/logger.util';
import inquirer from 'inquirer';

export interface DeleteCommandOptions {
  moduleName?: string;
  skipPrompts?: boolean;
  force?: boolean;
}

export class DeleteCommand {
  /**
   * Execute delete command
   */
  async execute(options: DeleteCommandOptions = {}): Promise<void> {
    Logger.info('🗑️  Delete CRUD Module\n');

    // Step 1: Prompt for module name or use provided
    const moduleName = await this.promptModuleName(options.moduleName, options.skipPrompts);

    // Step 2: Confirm deletion
    const confirmed = await this.confirmDeletion(moduleName, options.force, options.skipPrompts);
    if (!confirmed) {
      Logger.info('Deletion cancelled');
      return;
    }

    // Step 3: Find module directory
    const moduleDir = this.findModuleDirectory(moduleName);
    if (!moduleDir) {
      Logger.error(`❌ Module '${moduleName}' not found`);
      return;
    }

    // Step 4: Delete module files
    this.deleteModuleFiles(moduleDir, moduleName);

    // Step 5: Remove from app.module.ts
    this.removeFromAppModule(moduleName);

    // Step 6: Summary
    Logger.success(`\n✅ Module '${moduleName}' deleted successfully!`);
  }

  /**
   * Prompt for module name
   */
  private async promptModuleName(providedName?: string, skipPrompts?: boolean): Promise<string> {
    if (providedName) {
      return providedName;
    }

    if (skipPrompts) {
      Logger.error('❌ Module name is required when using --skip-prompts');
      process.exit(1);
    }

    const srcDir = join(process.cwd(), 'src');
    const modules = this.findModulesInDirectory(srcDir);

    if (modules.length === 0) {
      Logger.error('❌ No modules found in src/ directory');
      process.exit(1);
    }

    const { moduleName } = await inquirer.prompt<{ moduleName: string }>([
      {
        type: 'list',
        name: 'moduleName',
        message: 'Select module to delete:',
        choices: modules,
      },
    ]);

    return moduleName;
  }

  /**
   * Find modules in directory
   */
  private findModulesInDirectory(dir: string): string[] {
    if (!existsSync(dir)) {
      return [];
    }

    const modules: string[] = [];

    const entries = readdirSync(dir, { withFileTypes: true });
    for (const entry of entries) {
      if (entry.isDirectory() && entry.name) {
        const moduleFile = join(dir, entry.name, `${entry.name}.module.ts`);
        if (existsSync(moduleFile)) {
          modules.push(entry.name);
        }
      }
    }

    return modules;
  }

  /**
   * Confirm deletion
   */
  private async confirmDeletion(
    moduleName: string,
    force?: boolean,
    skipPrompts?: boolean,
  ): Promise<boolean> {
    if (force) {
      return true;
    }

    if (skipPrompts) {
      Logger.warn('⚠ Use --force to skip confirmation when using --skip-prompts');
      return false;
    }

    const { confirmed } = await inquirer.prompt<{ confirmed: boolean }>([
      {
        type: 'confirm',
        name: 'confirmed',
        message: `⚠️  Are you sure you want to delete module '${moduleName}'? This cannot be undone.`,
        default: false,
      },
    ]);

    return confirmed;
  }

  /**
   * Find module directory
   */
  private findModuleDirectory(moduleName: string): string | null {
    const possiblePaths = [
      join(process.cwd(), 'src', moduleName),
      join(process.cwd(), 'src', 'modules', moduleName),
      join(process.cwd(), moduleName),
    ];

    for (const path of possiblePaths) {
      if (existsSync(path)) {
        return path;
      }
    }

    return null;
  }

  /**
   * Delete module files
   */
  private deleteModuleFiles(moduleDir: string, moduleName: string): void {
    try {
      Logger.info(`\n🗑️  Deleting module files...`);
      Logger.info(`   📁 ${moduleDir}`);

      // Delete directory recursively
      rmSync(moduleDir, { recursive: true, force: true });

      Logger.success(`   ✓ Module files deleted`);
    } catch (error) {
      Logger.error(`   ✗ Failed to delete files: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Remove module from app.module.ts
   */
  private removeFromAppModule(moduleName: string): void {
    try {
      const appModulePath = join(process.cwd(), 'src', 'app.module.ts');

      if (!existsSync(appModulePath)) {
        Logger.warn('   ⚠ app.module.ts not found, skipping cleanup');
        return;
      }

      Logger.info('\n🧹 Cleaning up app.module.ts...');

      let appModuleContent = readFileSync(appModulePath, 'utf-8');
      const originalContent = appModuleContent;

      // Remove import statement
      const moduleClassName = this.toPascalCase(moduleName) + 'Module';
      const importPattern = new RegExp(
        `import\\s*{\\s*${moduleClassName}\\s*}\\s*from\\s*['"].*${moduleName}.*['"];?\\n?`,
        'g',
      );
      appModuleContent = appModuleContent.replace(importPattern, '');

      // Remove from imports array
      const importsPatterns = [
        new RegExp(`\\s*${moduleClassName},?\\s*\\n`, 'g'),
        new RegExp(`,\\s*${moduleClassName}\\s*`, 'g'),
        new RegExp(`${moduleClassName},?`, 'g'),
      ];

      for (const pattern of importsPatterns) {
        appModuleContent = appModuleContent.replace(pattern, '');
      }

      // Clean up empty lines
      appModuleContent = appModuleContent.replace(/\n\n\n+/g, '\n\n');

      if (appModuleContent !== originalContent) {
        writeFileSync(appModulePath, appModuleContent, 'utf-8');
        Logger.success('   ✓ Module removed from app.module.ts');
      } else {
        Logger.info('   ℹ Module not found in app.module.ts');
      }
    } catch (error) {
      Logger.error(`   ✗ Failed to clean up app.module.ts: ${(error as Error).message}`);
      Logger.warn('   ℹ Please manually remove the module from app.module.ts');
    }
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
}

#!/usr/bin/env node

/**
 * NestJS Generator CLI
 *
 * Main entry point for the command-line interface.
 * Provides commands: init, generate, sync, check, list, remove
 */

import { config as dotenvConfig } from 'dotenv';
import { Command } from 'commander';
import { InitCommand } from './commands/init.command';
import { GenerateCommand } from './commands/generate.command';
import { DeleteCommand } from './commands/delete.command';
import { RemoveCommand } from './commands/remove.command';
import { Logger } from '../utils/logger.util';
import { join } from 'path';
import { existsSync } from 'fs';

/**
 * Find and load .env file from project root
 */
function loadEnvironment(): void {
  let currentDir = process.cwd();
  const root = '/';

  // Walk up directory tree to find .env file
  while (currentDir !== root) {
    const envPath = join(currentDir, '.env');
    if (existsSync(envPath)) {
      dotenvConfig({ path: envPath });
      return;
    }

    // Check for workspace markers (nest-cli.json, package.json with workspaces)
    const nestCliPath = join(currentDir, 'nest-cli.json');
    const packageJsonPath = join(currentDir, 'package.json');

    if (existsSync(nestCliPath) || existsSync(packageJsonPath)) {
      const envPath = join(currentDir, '.env');
      if (existsSync(envPath)) {
        dotenvConfig({ path: envPath });
        return;
      }
    }

    currentDir = join(currentDir, '..');
  }

  // Fallback to current directory
  dotenvConfig();
}

// Load environment variables from .env file at project root
loadEnvironment();

const program = new Command();

program
  .name('nest-generator')
  .description('NestJS CRUD Generator - Generate production-ready modules from database metadata')
  .version('1.0.5');

// Init command
program
  .command('init')
  .description('Initialize generator configuration and setup database schema')
  .option('--architecture <type>', 'Architecture type (standalone, monorepo, microservices)')
  .option('--skip-prompts', 'Skip interactive prompts (use with --architecture)')
  .action(async (options: any) => {
    try {
      const initCommand = new InitCommand();
      await initCommand.execute(options);
    } catch (error) {
      Logger.error('Init command failed', error as Error);
      process.exit(1);
    }
  });

// Generate command
program
  .command('generate <table>')
  .description('Generate CRUD module from metadata (format: schema.table)')
  .option('--output <path>', 'Output directory path')
  .option('--app <name>', 'App name for monorepo/microservices (e.g., user, order)')
  .option('--prefix <path>', 'Custom prefix for output folder and URL (e.g., entity/location)')
  .option('--skip-prompts', 'Skip interactive prompts')
  .option(
    '--all',
    'Enable all features (swagger, caching, audit, validation, pagination, softDelete, fileUpload, rbac)',
  )
  .option('--features.swagger', 'Enable Swagger documentation')
  .option('--features.caching', 'Enable caching')
  .option('--features.audit', 'Enable audit logging')
  .option('--features.fileUpload', 'Enable file upload')
  .option('--features.rbac', 'Enable RBAC')
  .option('--storageProvider <provider>', 'Storage provider (local, s3, gcs, azure)')
  .action(async (table: string, options: any) => {
    try {
      const generateCommand = new GenerateCommand();
      await generateCommand.execute({
        tableName: table,
        outputPath: options.output,
        appName: options.app,
        prefix: options.prefix,
        skipPrompts: options.skipPrompts,
        all: options.all,
        features: {
          swagger: options['features.swagger'],
          caching: options['features.caching'],
          auditLog: options['features.audit'],
          fileUpload: options['features.fileUpload'],
          rbac: options['features.rbac'],
        },
        storageProvider: options.storageProvider,
      });
    } catch (error) {
      Logger.error('Generate command failed', error as Error);
      process.exit(1);
    }
  });

// Sync command (placeholder for Task 21)
program
  .command('sync')
  .description('Regenerate all modules based on current metadata')
  .action(async () => {
    Logger.warn('Sync command not implemented yet (Task 21)');
  });

// Check command (placeholder for Task 21)
program
  .command('check')
  .description('Check for metadata changes and detect outdated modules')
  .action(async () => {
    Logger.warn('Check command not implemented yet (Task 21)');
  });

// List command (placeholder for Task 21)
program
  .command('list')
  .description('List all generated modules')
  .action(async () => {
    Logger.warn('List command not implemented yet (Task 21)');
  });

// Delete command
program
  .command('delete [module]')
  .description('Delete generated CRUD module and clean up from app.module.ts')
  .option('--skip-prompts', 'Skip interactive prompts')
  .option('--force', 'Skip confirmation prompt')
  .action(async (module: string | undefined, options: any) => {
    try {
      const deleteCommand = new DeleteCommand();
      await deleteCommand.execute({
        moduleName: module,
        skipPrompts: options.skipPrompts,
        force: options.force,
      });
    } catch (error) {
      Logger.error('Delete command failed', error as Error);
      process.exit(1);
    }
  });

// Remove command (schema-based)
program
  .command('remove <table>')
  .description('Remove generated CRUD files from schema-based structure (format: schema.table)')
  .option('--app <name>', 'App name for monorepo/microservices')
  .option('--force', 'Skip confirmation prompt')
  .action(async (table: string, options: any) => {
    try {
      const removeCommand = new RemoveCommand();
      await removeCommand.execute(table, {
        app: options.app,
        force: options.force,
      });
    } catch (error) {
      Logger.error('Remove command failed', error as Error);
      process.exit(1);
    }
  });

// Parse command-line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

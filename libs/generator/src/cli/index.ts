#!/usr/bin/env node

/**
 * NestJS Generator CLI
 *
 * Main entry point for the command-line interface.
 * Provides commands: init, generate, sync, check, list, remove
 */

import { Command } from 'commander';
import { InitCommand } from './commands/init.command';
import { GenerateCommand } from './commands/generate.command';
import { Logger } from '../utils/logger.util';

const program = new Command();

program
  .name('nest-generator')
  .description('NestJS CRUD Generator - Generate production-ready modules from database metadata')
  .version('1.0.5');

// Init command
program
  .command('init')
  .description('Initialize generator configuration and setup database schema')
  .action(async () => {
    try {
      const initCommand = new InitCommand();
      await initCommand.execute();
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
  .option('--skip-prompts', 'Skip interactive prompts')
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
        skipPrompts: options.skipPrompts,
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

// Remove command (placeholder for Task 21)
program
  .command('remove <table>')
  .description('Remove generated module (format: schema.table)')
  .action(async (table: string) => {
    Logger.warn('Remove command not implemented yet (Task 21)');
    Logger.info(`Would remove module for: ${table}`);
  });

// Parse command-line arguments
program.parse(process.argv);

// Show help if no command provided
if (!process.argv.slice(2).length) {
  program.outputHelp();
}

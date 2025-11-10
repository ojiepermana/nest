/**
 * Search CLI Command
 *
 * CLI command to add search integration to existing modules
 */

import { Command } from 'commander';
import * as inquirer from 'inquirer';
import { SearchGeneratorOptions } from '../../search/generators/search.generator';
import { MetadataService } from '../../metadata/metadata.service';
import { Logger } from '../../utils/logger.util';
import * as fs from 'fs';
import * as path from 'path';

/**
 * Add search integration command
 */
export function addSearchCommand(program: Command) {
  program
    .command('add-search <table>')
    .description('Add search integration to an existing module')
    .option('-s, --schema <schema>', 'Schema name', 'public')
    .option(
      '-d, --driver <driver>',
      'Search driver (elasticsearch|algolia|meilisearch|database)',
      'database',
    )
    .option('--index-name <name>', 'Custom index name')
    .option('--no-full-text', 'Disable full-text search')
    .option('--no-filters', 'Disable filters')
    .option('--no-facets', 'Disable facets')
    .option('--suggestions', 'Enable suggestions/autocomplete')
    .option('--similar', 'Enable similar/more-like-this')
    .option('--auto-sync', 'Enable auto-sync on CRUD operations')
    .option('-o, --output <dir>', 'Output directory', './src/modules')
    .action(async (table: string, options: any) => {
      try {
        Logger.info(`Adding search integration to ${table}...`);

        // Validate driver
        const validDrivers = ['elasticsearch', 'algolia', 'meilisearch', 'database'];
        if (!validDrivers.includes(String(options.driver))) {
          Logger.error(
            `Invalid driver: ${options.driver}. Valid options: ${validDrivers.join(', ')}`,
          );
          process.exit(1);
        }

        // Interactive mode if no schema provided
        let schema = options.schema;
        if (!schema) {
          const answers = await inquirer.prompt([
            {
              type: 'input',
              name: 'schema',
              message: 'Schema name:',
              default: 'public',
            },
          ]);
          schema = answers.schema;
        }

        // Build generator options
        const genOptions: SearchGeneratorOptions = {
          schema,
          table,
          driver: options.driver,
          indexName: options.indexName,
          enableFullText: options.fullText !== false,
          enableFilters: options.filters !== false,
          enableFacets: options.facets !== false,
          enableSuggestions: options.suggestions === true,
          enableSimilar: options.similar === true,
          autoSync: options.autoSync === true,
        };

        // Initialize generator
        // NOTE: This requires proper initialization with connection and dialect
        // TODO: Implement proper dependency injection for MetadataService
        Logger.warn(
          'Search command is currently not implemented - requires database connection setup',
        );
        Logger.info(
          'Please use the SearchGenerator class directly with proper MetadataService instance',
        );
        process.exit(1);

        /* Commented out until proper DI is implemented
        const metadataService = new MetadataService();
        const generator = new SearchGenerator(metadataService);

        // Get metadata
        const columns = await metadataService.getColumnMetadata(schema, table);
        */

        /* Rest of the implementation commented out
        // Generate files
        const outputDir = path.join(process.cwd(), String(options.output), table);

        // 1. Generate search controller
        const searchController = generator.generateSearchController(genOptions);
        const searchControllerPath = path.join(outputDir, `${table}-search.controller.ts`);
        fs.writeFileSync(searchControllerPath, String(searchController));
        Logger.success(`✅ Created: ${searchControllerPath}`);

        // 2. Generate searchable entity decorator
        const searchableEntity = generator.generateSearchableEntity(genOptions, columns);
        const entityPath = path.join(outputDir, `${table}.entity.ts`);
        if (fs.existsSync(entityPath)) {
          Logger.info(`⚠️  Entity already exists. Add @Searchable decorator manually:`);
          console.log('\n' + searchableEntity + '\n');
        } else {
          fs.writeFileSync(entityPath, String(searchableEntity));
          Logger.success(`✅ Created: ${entityPath}`);
        }

        // 3. Generate auto-sync usage if enabled
        if (genOptions.autoSync) {
          const autoSyncCode = generator.generateAutoSyncUsage(genOptions);
          Logger.info(`⚠️  Add @AutoSync decorators to your controller:`);
          console.log('\n' + autoSyncCode + '\n');
        }

        // 4. Generate module with SearchModule import
        const moduleWithSearch = generator.generateModuleWithSearch(genOptions);
        const modulePath = path.join(outputDir, `${table}.module.ts`);
        if (fs.existsSync(modulePath)) {
          Logger.info(`⚠️  Module already exists. Update imports manually:`);
          console.log('\n' + moduleWithSearch + '\n');
        } else {
          fs.writeFileSync(modulePath, String(moduleWithSearch));
          Logger.success(`✅ Created: ${modulePath}`);
        }

        // 5. Generate search config
        const searchConfig = await generator.generateSearchConfig(genOptions);
        const configPath = path.join(outputDir, `${table}.search-config.ts`);
        fs.writeFileSync(configPath, String(searchConfig));
        Logger.success(`✅ Created: ${configPath}`);

        // Success message
        Logger.success(`\n🎉 Search integration added successfully!\n`);
        Logger.info(`Next steps:`);
        Logger.info(`1. Install search driver dependencies:`);
        if (options.driver === 'elasticsearch') {
          Logger.info(`   npm install @elastic/elasticsearch`);
        } else if (options.driver === 'algolia') {
          Logger.info(`   npm install algoliasearch`);
        } else if (options.driver === 'meilisearch') {
          Logger.info(`   npm install meilisearch`);
        } else {
          Logger.info(`   (No additional dependencies needed for database driver)`);
        }
        Logger.info(`2. Configure environment variables`);
        Logger.info(`3. Import ${table}.module.ts in your app.module.ts`);
        Logger.info(`4. Register searchable model in your service:`);
        Logger.info(
          `   searchService.registerSearchableModel('${table}', ${genOptions.indexName}Config);`,
        );

        process.exit(0);
        */
      } catch (error) {
        Logger.error(`Failed to add search integration: ${(error as Error).message}`);
        console.error(error);
        process.exit(1);
      }
    });
}

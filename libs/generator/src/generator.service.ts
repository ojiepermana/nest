import { Injectable, Logger } from '@nestjs/common';
import { createHash } from 'crypto';
import { existsSync, mkdirSync } from 'fs';
import { dirname, join, resolve } from 'path';
import {
  GenerateModuleOptions,
  GenerateModuleResult,
  GeneratedFile,
  getDefaultOutputPath,
  TableMetadata,
} from './types';
import { MetadataStoreManager } from './metadata-store';
import { mergeWithPreservedSections, normalizeWhitespace, readIfExists, writeFileSafely, kebabCase, pascalCase } from './utils';
import {
  buildDtoTemplate,
  buildIndexTemplate,
  buildModuleTemplate,
  buildQueryTemplate,
  buildRepositoryTemplate,
  buildServiceTemplate,
  buildControllerTemplate,
  buildTemplateContext,
} from './templates';
import { PgSchemaIntrospector } from './pg-introspector';

@Injectable()
export class GeneratorService {
  private readonly logger = new Logger(GeneratorService.name);

  async generateModule(options: GenerateModuleOptions): Promise<GenerateModuleResult> {
    const architecture = options.architecture ?? 'standalone';
    const moduleName = options.moduleName ?? kebabCase(options.table);
    const basePath = resolve(options.outputPath ?? process.cwd());
    const targetDirectory = getDefaultOutputPath(architecture, basePath, moduleName, options.app);
    const metadataFile = options.metadataFile ?? join(basePath, '.crud-generator', 'metadata.json');

    const metadata = await this.resolveMetadata(options);
    const context = buildTemplateContext(moduleName, metadata);

    const files = this.buildFiles(targetDirectory, context);
    const checksum = this.calculateChecksum(metadata);

    const metadataDir = dirname(metadataFile);
    if (!existsSync(metadataDir)) {
      mkdirSync(metadataDir, { recursive: true });
    }

    const storeManager = new MetadataStoreManager(metadataFile);
    const store = storeManager.load();
    const metadataKey = `${options.schema}.${options.table}`;
    const existingRecord = store[metadataKey];

    if (existingRecord && existingRecord.checksum !== checksum && !options.force) {
      throw new Error(
        `Schema changes detected for ${options.schema}.${options.table}. ` +
          'Review changes or pass { force: true } to regenerate.',
      );
    }

    const writtenFiles: string[] = [];
    const skippedFiles: string[] = [];

    if (!options.dryRun) {
      if (!existsSync(targetDirectory)) {
        mkdirSync(targetDirectory, { recursive: true });
      }

      for (const file of files) {
        const existing = readIfExists(file.filePath);
        const merged = mergeWithPreservedSections(normalizeWhitespace(file.content), existing);
        const normalized = normalizeWhitespace(merged);
        if (existing && normalizeWhitespace(existing) === normalized) {
          skippedFiles.push(file.filePath);
          continue;
        }

        writeFileSafely(file.filePath, normalized);
        writtenFiles.push(file.filePath);
      }

      store[metadataKey] = {
        checksum,
        metadata,
        generatedAt: existingRecord?.generatedAt ?? new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      storeManager.save(store);
      this.logger.log(`Generated module ${pascalCase(moduleName)} at ${targetDirectory}`);
    }

    return {
      moduleName,
      targetDirectory,
      checksum,
      metadata,
      files,
      writtenFiles,
      skippedFiles,
    };
  }

  private async resolveMetadata(options: GenerateModuleOptions): Promise<TableMetadata> {
    if (options.metadata) {
      return options.metadata;
    }

    if (!options.connection) {
      throw new Error('Either metadata or connection options must be provided.');
    }

    const introspector = new PgSchemaIntrospector({
      host: options.connection.host,
      port: options.connection.port,
      user: options.connection.user,
      password: options.connection.password,
      database: options.connection.database,
      ssl: options.connection.ssl,
    });

    try {
      return await introspector.getTableMetadata(options.schema, options.table);
    } finally {
      await introspector.close();
    }
  }

  private buildFiles(targetDirectory: string, context: ReturnType<typeof buildTemplateContext>): GeneratedFile[] {
    return [
      {
        filePath: join(targetDirectory, `${context.moduleName}.dto.ts`),
        content: buildDtoTemplate(context),
      },
      {
        filePath: join(targetDirectory, `${context.moduleName}.query.ts`),
        content: buildQueryTemplate(context),
      },
      {
        filePath: join(targetDirectory, `${context.moduleName}.repository.ts`),
        content: buildRepositoryTemplate(context),
      },
      {
        filePath: join(targetDirectory, `${context.moduleName}.service.ts`),
        content: buildServiceTemplate(context),
      },
      {
        filePath: join(targetDirectory, `${context.moduleName}.controller.ts`),
        content: buildControllerTemplate(context),
      },
      {
        filePath: join(targetDirectory, `${context.moduleName}.module.ts`),
        content: buildModuleTemplate(context),
      },
      {
        filePath: join(targetDirectory, 'index.ts'),
        content: buildIndexTemplate(context),
      },
    ];
  }

  private calculateChecksum(metadata: TableMetadata): string {
    return createHash('md5').update(JSON.stringify(metadata)).digest('hex');
  }
}

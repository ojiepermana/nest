import { join } from 'path';

export type ArchitectureType = 'standalone' | 'monorepo' | 'microservice';

export interface DatabaseConnectionOptions {
  name: string;
  host: string;
  port: number;
  database: string;
  user: string;
  password?: string;
  ssl?: boolean | Record<string, unknown>;
  schema?: string;
}

export interface ColumnDefinition {
  name: string;
  dbType: string;
  tsType: string;
  isNullable: boolean;
  isPrimaryKey: boolean;
  hasDefault: boolean;
  comment?: string;
  isGenerated?: boolean;
  enumValues?: string[];
}

export interface TableMetadata {
  schema: string;
  table: string;
  columns: ColumnDefinition[];
  primaryKey?: ColumnDefinition;
  uniqueColumns: string[];
  hasTimestamps: boolean;
}

export interface GenerateModuleOptions {
  connection?: DatabaseConnectionOptions;
  schema: string;
  table: string;
  moduleName?: string;
  architecture?: ArchitectureType;
  app?: string;
  outputPath?: string;
  dryRun?: boolean;
  force?: boolean;
  metadata?: TableMetadata;
  metadataFile?: string;
}

export interface GeneratedFile {
  filePath: string;
  content: string;
}

export interface GenerateModuleResult {
  moduleName: string;
  targetDirectory: string;
  checksum: string;
  metadata: TableMetadata;
  files: GeneratedFile[];
  writtenFiles: string[];
  skippedFiles: string[];
}

export const getDefaultOutputPath = (architecture: ArchitectureType, basePath: string, moduleName: string, app?: string): string => {
  switch (architecture) {
    case 'monorepo':
      if (!app) {
        throw new Error('`app` must be provided for monorepo architecture');
      }
      return join(basePath, 'apps', app, 'src', 'modules', moduleName);
    case 'microservice':
      if (!app) {
        throw new Error('`app` must be provided for microservice architecture');
      }
      return join(basePath, 'services', app, 'src', 'modules', moduleName);
    case 'standalone':
    default:
      return join(basePath, 'src', 'modules', moduleName);
  }
};

export interface MetadataStoreRecord {
  checksum: string;
  metadata: TableMetadata;
  generatedAt: string;
  updatedAt: string;
}

export type MetadataStore = Record<string, MetadataStoreRecord>;

export interface SchemaIntrospector {
  getTableMetadata(schema: string, table: string): Promise<TableMetadata>;
  close(): Promise<void>;
}

import {
  ArchitectureType,
  DatabaseType,
  TransportType,
  GeneratedFileType,
  TableType,
  MetadataStatus,
} from '../types/architecture.type';

// Re-export types for convenience
export type {
  ArchitectureType,
  DatabaseType,
  TransportType,
  GeneratedFileType,
  TableType,
  MetadataStatus,
};

/**
 * Database connection configuration
 */
export interface DatabaseConfig {
  type: DatabaseType;
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  schema?: string;
  ssl?: boolean;
  connectionTimeoutMillis?: number;
  maxConnections?: number;
  pool?: {
    min?: number;
    max?: number;
    idleTimeoutMillis?: number;
    connectionTimeoutMillis?: number;
  };
}

/**
 * Microservice configuration
 */
export interface MicroserviceConfig {
  name: string;
  transport: TransportType;
  host: string;
  port: number;
  options?: Record<string, any>;
}

/**
 * Generator configuration file structure
 */
export interface GeneratorConfig {
  architecture: ArchitectureType;
  database: DatabaseConfig;
  features?: {
    swagger?: boolean;
    caching?: boolean;
    fileUpload?: boolean;
    audit?: boolean;
    rbac?: boolean;
    search?: boolean;
    notifications?: boolean;
    export?: boolean;
  };
  microservices?: {
    gatewayApp?: string;
    services: MicroserviceConfig[];
  };
}

/**
 * Table metadata from database
 */
export interface TableMetadata {
  id: string;
  schema_name: string;
  table_name: string;
  table_type?: TableType;
  table_purpose?: string;
  has_soft_delete: boolean;
  has_created_by: boolean;
  primary_key_column: string;
  primary_key_type: string;
  is_partitioned?: boolean;
  partition_strategy?: string;
  partition_key?: string;
  model_class?: string;
  controller_class?: string;
  request_class?: string;
  resource_class?: string;
  status: MetadataStatus;
  cache_ttl?: number;
  cache_enabled?: boolean;
  throttle_limit?: number;
  throttle_ttl?: number;
  validation_rules?: Record<string, any>;
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
  deleted_at?: Date;
}

/**
 * Column metadata from database
 */
export interface ColumnMetadata {
  id: string;
  table_metadata_id: string;
  column_name: string;
  data_type: string;
  is_nullable: boolean;
  default_value?: string;
  is_unique: boolean;
  is_primary_key: boolean;
  // Foreign key fields
  ref_schema?: string;
  ref_table?: string;
  ref_column?: string;
  // Query features
  is_filterable: boolean;
  is_searchable: boolean;
  is_sortable?: boolean;
  // Validation
  validation_rules?: Record<string, any>;
  is_required: boolean;
  max_length?: number;
  min_value?: number;
  max_value?: number;
  enum_values?: any[];
  // UI/Display
  input_type?: string;
  display_in_list: boolean;
  display_in_form: boolean;
  display_in_detail: boolean;
  description?: string;
  column_order: number;
  // File upload
  is_file_upload?: boolean;
  file_upload_config?: Record<string, any>;
  // Swagger
  swagger_example?: string;
  swagger_description?: string;
  swagger_hidden?: boolean;
  // Audit
  created_at: Date;
  updated_at: Date;
  created_by: string;
  updated_by?: string;
  deleted_at?: Date;
}

/**
 * Generated file tracking
 */
export interface GeneratedFile {
  id: string;
  table_metadata_id: string;
  file_path: string;
  file_name: string;
  file_type: GeneratedFileType;
  checksum: string;
  last_generated_at: Date;
  has_custom_code?: boolean;
  created_at: Date;
  updated_at: Date;
}

/**
 * Filter operator configuration
 */
export interface FilterOperator {
  operator: string;
  sqlOperator: string;
  requiresValue: boolean;
  isArray: boolean;
  validator: (value: any) => boolean;
}

/**
 * Code generation context
 */
export interface GenerationContext {
  config: GeneratorConfig;
  tableMetadata: TableMetadata;
  columns: ColumnMetadata[];
  outputPath: string;
  isRegeneration: boolean;
}

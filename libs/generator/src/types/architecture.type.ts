/**
 * Supported project architectures
 */
export type ArchitectureType = 'standalone' | 'monorepo' | 'microservices';

/**
 * Supported database types
 */
export type DatabaseType = 'postgresql' | 'mysql';

/**
 * Supported transport types for microservices
 */
export type TransportType = 'TCP' | 'REDIS' | 'MQTT' | 'RMQ' | 'NATS';

/**
 * File types that can be generated
 */
export type GeneratedFileType =
  | 'dto'
  | 'query'
  | 'repository'
  | 'service'
  | 'controller'
  | 'module'
  | 'interface'
  | 'guard'
  | 'interceptor';

/**
 * Table types for categorization
 */
export type TableType = 'master' | 'transaction' | 'log' | 'entity' | 'other';

/**
 * Metadata status
 */
export type MetadataStatus = 'active' | 'inactive' | 'deprecated';

/**
 * Default configuration values
 */
export const DEFAULT_CONFIG = {
  VERSION: '1.0.0',
  METADATA_SCHEMA: 'meta',
  OUTPUT_PATH: 'src/modules',
  CACHE_TTL: 300,
  THROTTLE_LIMIT: 100,
  THROTTLE_TTL: 60000,
  DATABASE_PORT: {
    postgresql: 5432,
    mysql: 3306,
  },
} as const;

/**
 * Code generation markers for custom code preservation
 */
export const CODE_MARKERS = {
  CUSTOM_START: 'CUSTOM_CODE_START',
  CUSTOM_END: 'CUSTOM_CODE_END',
  GENERATED_START: 'GENERATED',
  GENERATED_END: 'GENERATED',
} as const;

/**
 * Filter operators supported by the generator
 */
export const FILTER_OPERATORS = {
  EQ: '_eq',
  NE: '_ne',
  GT: '_gt',
  LT: '_lt',
  GTE: '_gte',
  LTE: '_lte',
  LIKE: '_like',
  IN: '_in',
  NIN: '_nin',
  BETWEEN: '_between',
  NULL: '_null',
  NNULL: '_nnull',
} as const;

/**
 * SQL operators mapping
 */
export const SQL_OPERATORS = {
  [FILTER_OPERATORS.EQ]: '=',
  [FILTER_OPERATORS.NE]: '!=',
  [FILTER_OPERATORS.GT]: '>',
  [FILTER_OPERATORS.LT]: '<',
  [FILTER_OPERATORS.GTE]: '>=',
  [FILTER_OPERATORS.LTE]: '<=',
  [FILTER_OPERATORS.LIKE]: 'ILIKE',
  [FILTER_OPERATORS.IN]: 'IN',
  [FILTER_OPERATORS.NIN]: 'NOT IN',
  [FILTER_OPERATORS.BETWEEN]: 'BETWEEN',
  [FILTER_OPERATORS.NULL]: 'IS NULL',
  [FILTER_OPERATORS.NNULL]: 'IS NOT NULL',
} as const;

/**
 * Data type mappings
 */
export const DATA_TYPES = {
  STRING: ['varchar', 'text', 'char', 'string'],
  NUMBER: [
    'integer',
    'int',
    'bigint',
    'smallint',
    'decimal',
    'numeric',
    'float',
    'double',
  ],
  BOOLEAN: ['boolean', 'bool'],
  DATE: ['date', 'timestamp', 'datetime', 'time'],
  UUID: ['uuid'],
  JSON: ['json', 'jsonb'],
  ARRAY: ['array'],
} as const;

/**
 * Validation decorator mappings
 */
export const VALIDATION_DECORATORS = {
  STRING: '@IsString()',
  NUMBER: '@IsNumber()',
  INTEGER: '@IsInt()',
  BOOLEAN: '@IsBoolean()',
  DATE: '@IsDate()',
  UUID: '@IsUUID()',
  EMAIL: '@IsEmail()',
  URL: '@IsUrl()',
  PHONE: '@IsPhoneNumber()',
  ARRAY: '@IsArray()',
  OBJECT: '@IsObject()',
  ENUM: '@IsEnum',
  NOT_EMPTY: '@IsNotEmpty()',
  OPTIONAL: '@IsOptional()',
  MIN: '@Min',
  MAX: '@Max',
  MIN_LENGTH: '@MinLength',
  MAX_LENGTH: '@MaxLength',
  MATCHES: '@Matches',
} as const;

/**
 * System user ID for automated operations
 */
export const SYSTEM_USER_ID = '00000000-0000-0000-0000-000000000000';

/**
 * File extensions
 */
export const FILE_EXTENSIONS = {
  TYPESCRIPT: '.ts',
  JAVASCRIPT: '.js',
  JSON: '.json',
  SQL: '.sql',
} as const;

/**
 * Template paths (relative to generator lib)
 */
export const TEMPLATE_PATHS = {
  DTO: 'templates/dto.template.ts',
  QUERY: 'templates/query.template.ts',
  REPOSITORY: 'templates/repository.template.ts',
  SERVICE: 'templates/service.template.ts',
  CONTROLLER: 'templates/controller.template.ts',
  MODULE: 'templates/module.template.ts',
} as const;

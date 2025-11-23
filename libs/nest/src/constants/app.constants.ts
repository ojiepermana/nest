/**
 * Application-wide constants
 * Enterprise-grade configuration constants
 */
export const AppConstants = {
  /**
   * Application name
   */
  APP_NAME: 'NestJS Application',

  /**
   * Default pagination settings
   */
  PAGINATION: {
    DEFAULT_PAGE: 1,
    DEFAULT_LIMIT: 10,
    MAX_LIMIT: 100,
    MAX_PAGE: 10000,
  },

  /**
   * File upload constraints
   */
  FILE_UPLOAD: {
    MAX_SIZE: 10 * 1024 * 1024, // 10MB
    MAX_SIZE_TEXT: '10MB',
    ALLOWED_IMAGE_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'],
    ALLOWED_DOCUMENT_TYPES: [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ],
    ALLOWED_EXTENSIONS: {
      IMAGE: ['.jpg', '.jpeg', '.png', '.gif', '.webp'],
      DOCUMENT: ['.pdf', '.doc', '.docx'],
      SPREADSHEET: ['.xls', '.xlsx', '.csv'],
    },
  },

  /**
   * Cache TTL (Time To Live) in seconds
   */
  CACHE_TTL: {
    SHORT: 60, // 1 minute
    MEDIUM: 300, // 5 minutes
    LONG: 3600, // 1 hour
    DAY: 86400, // 24 hours
    WEEK: 604800, // 7 days
  },

  /**
   * Rate limiting
   */
  RATE_LIMIT: {
    TTL: 60, // 60 seconds
    LIMIT: 100, // 100 requests per TTL
    STRICT_TTL: 60,
    STRICT_LIMIT: 10,
  },

  /**
   * Date formats
   */
  DATE_FORMAT: {
    ISO: 'YYYY-MM-DDTHH:mm:ss.SSSZ',
    DATE_ONLY: 'YYYY-MM-DD',
    TIME_ONLY: 'HH:mm:ss',
    DATETIME: 'YYYY-MM-DD HH:mm:ss',
    DISPLAY: 'DD MMM YYYY',
    DISPLAY_DATETIME: 'DD MMM YYYY HH:mm',
  },

  /**
   * Validation constraints
   */
  VALIDATION: {
    EMAIL_MAX_LENGTH: 255,
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_MAX_LENGTH: 128,
    NAME_MIN_LENGTH: 2,
    NAME_MAX_LENGTH: 100,
    PHONE_MIN_LENGTH: 10,
    PHONE_MAX_LENGTH: 15,
    ADDRESS_MAX_LENGTH: 500,
    DESCRIPTION_MAX_LENGTH: 2000,
    URL_MAX_LENGTH: 2048,
  },

  /**
   * Regex patterns
   */
  REGEX: {
    EMAIL: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE: /^[\+]?[(]?[0-9]{3}[)]?[-\s\.]?[0-9]{3}[-\s\.]?[0-9]{4,6}$/,
    URL: /^(https?:\/\/)?([\da-z\.-]+)\.([a-z\.]{2,6})([\/\w \.-]*)*\/?$/,
    UUID: /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i,
    ALPHANUMERIC: /^[a-zA-Z0-9]+$/,
    ALPHA: /^[a-zA-Z]+$/,
    NUMERIC: /^[0-9]+$/,
  },

  /**
   * Security settings
   */
  SECURITY: {
    BCRYPT_ROUNDS: 10,
    JWT_EXPIRATION: '1d',
    REFRESH_TOKEN_EXPIRATION: '7d',
    PASSWORD_RESET_EXPIRATION: '1h',
    EMAIL_VERIFICATION_EXPIRATION: '24h',
  },

  /**
   * Default error codes
   */
  ERROR_CODES: {
    VALIDATION_ERROR: 'VALIDATION_ERROR',
    NOT_FOUND: 'NOT_FOUND',
    UNAUTHORIZED: 'UNAUTHORIZED',
    FORBIDDEN: 'FORBIDDEN',
    BAD_REQUEST: 'BAD_REQUEST',
    CONFLICT: 'CONFLICT',
    INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
    SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  },

  /**
   * API versioning
   */
  API: {
    VERSION: 'v1',
    PREFIX: 'api',
    DEFAULT_VERSION: '1',
  },

  /**
   * Logging levels
   */
  LOG_LEVELS: {
    ERROR: 'error',
    WARN: 'warn',
    INFO: 'info',
    DEBUG: 'debug',
    VERBOSE: 'verbose',
  },
} as const;

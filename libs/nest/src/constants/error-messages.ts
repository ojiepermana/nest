/**
 * Standard error messages used across the application
 * Enterprise-grade error messaging with i18n support ready
 */
export const ErrorMessages = {
  // Authentication & Authorization
  UNAUTHORIZED: 'Authentication required',
  INVALID_CREDENTIALS: 'Invalid email or password',
  TOKEN_EXPIRED: 'Authentication token has expired',
  TOKEN_INVALID: 'Invalid authentication token',
  FORBIDDEN: 'You do not have permission to access this resource',
  ACCOUNT_DISABLED: 'Your account has been disabled',
  ACCOUNT_NOT_VERIFIED: 'Please verify your email address',

  // Validation
  VALIDATION_FAILED: 'Validation failed',
  INVALID_INPUT: 'Invalid input data provided',
  REQUIRED_FIELD: (field: string) => `${field} is required`,
  INVALID_FORMAT: (field: string) => `Invalid ${field} format`,
  TOO_SHORT: (field: string, min: number) => `${field} must be at least ${min} characters`,
  TOO_LONG: (field: string, max: number) => `${field} cannot exceed ${max} characters`,
  OUT_OF_RANGE: (field: string, min: number, max: number) =>
    `${field} must be between ${min} and ${max}`,
  INVALID_EMAIL: 'Invalid email address',
  INVALID_PHONE: 'Invalid phone number',
  INVALID_URL: 'Invalid URL format',
  INVALID_DATE: 'Invalid date format',
  INVALID_UUID: 'Invalid UUID format',

  // Resources
  NOT_FOUND: 'Resource not found',
  RESOURCE_NOT_FOUND: (resource: string) => `${resource} not found`,
  ALREADY_EXISTS: 'Resource already exists',
  RESOURCE_ALREADY_EXISTS: (resource: string) => `${resource} already exists`,
  DUPLICATE_ENTRY: 'Duplicate entry detected',
  DUPLICATE_FIELD: (field: string) => `${field} already exists in the system`,

  // Operations
  CREATE_FAILED: 'Failed to create resource',
  UPDATE_FAILED: 'Failed to update resource',
  DELETE_FAILED: 'Failed to delete resource',
  OPERATION_FAILED: 'Operation failed',
  OPERATION_NOT_ALLOWED: 'This operation is not allowed',

  // Database
  DATABASE_ERROR: 'Database operation failed',
  CONNECTION_FAILED: 'Database connection failed',
  TRANSACTION_FAILED: 'Transaction failed',
  CONSTRAINT_VIOLATION: 'Database constraint violation',
  FOREIGN_KEY_VIOLATION: 'Cannot delete: resource is referenced by others',

  // File Upload
  FILE_REQUIRED: 'File is required',
  FILE_TOO_LARGE: (maxSize: string) => `File size exceeds maximum limit of ${maxSize}`,
  INVALID_FILE_TYPE: (allowedTypes: string[]) =>
    `Invalid file type. Allowed types: ${allowedTypes.join(', ')}`,
  FILE_UPLOAD_FAILED: 'File upload failed',
  FILE_NOT_FOUND: 'File not found',
  FILE_DELETE_FAILED: 'Failed to delete file',

  // Rate Limiting
  TOO_MANY_REQUESTS: 'Too many requests. Please try again later',
  RATE_LIMIT_EXCEEDED: 'Rate limit exceeded',

  // System
  INTERNAL_SERVER_ERROR: 'An unexpected error occurred',
  SERVICE_UNAVAILABLE: 'Service temporarily unavailable',
  MAINTENANCE_MODE: 'System is under maintenance',
  BAD_REQUEST: 'Bad request',
  TIMEOUT: 'Request timeout',

  // Pagination
  INVALID_PAGE: 'Invalid page number',
  INVALID_LIMIT: 'Invalid limit value',
  PAGE_OUT_OF_RANGE: 'Page number out of range',

  // Business Logic
  INSUFFICIENT_BALANCE: 'Insufficient balance',
  EXPIRED: 'This resource has expired',
  INACTIVE: 'This resource is inactive',
  LOCKED: 'This resource is locked',
  PROCESSING: 'This resource is being processed',

  // Custom Error Builder
  custom: (message: string) => message,
} as const;

/**
 * Success messages used across the application
 */
export const SuccessMessages = {
  // CRUD Operations
  CREATED: 'Resource created successfully',
  UPDATED: 'Resource updated successfully',
  DELETED: 'Resource deleted successfully',
  RETRIEVED: 'Resource retrieved successfully',

  // Authentication
  LOGIN_SUCCESS: 'Login successful',
  LOGOUT_SUCCESS: 'Logout successful',
  REGISTER_SUCCESS: 'Registration successful',
  PASSWORD_RESET: 'Password reset successfully',
  EMAIL_VERIFIED: 'Email verified successfully',

  // File Operations
  FILE_UPLOADED: 'File uploaded successfully',
  FILE_DELETED: 'File deleted successfully',

  // Generic
  SUCCESS: 'Operation completed successfully',
  SAVED: 'Changes saved successfully',

  // Custom Success Builder
  custom: (message: string) => message,
} as const;

/**
 * Standard API response wrapper interface
 * Provides consistent response structure across all endpoints
 */
export interface ApiResponse<T = any> {
  /**
   * HTTP status code
   */
  statusCode: number;

  /**
   * Human-readable message
   */
  message: string;

  /**
   * Response data (optional)
   */
  data?: T;

  /**
   * Error details (optional)
   */
  error?: ApiError;

  /**
   * Additional metadata (optional)
   */
  meta?: Record<string, any>;

  /**
   * Timestamp of response
   */
  timestamp: string;

  /**
   * Request path
   */
  path: string;
}

/**
 * API Error details
 */
export interface ApiError {
  /**
   * Error code (e.g., 'VALIDATION_ERROR', 'NOT_FOUND')
   */
  code: string;

  /**
   * Detailed error message
   */
  message: string;

  /**
   * Validation errors (for 422 responses)
   */
  validationErrors?: ValidationError[];

  /**
   * Stack trace (only in development)
   */
  stack?: string;

  /**
   * Additional error context
   */
  context?: Record<string, any>;
}

/**
 * Validation error detail
 */
export interface ValidationError {
  /**
   * Field name that failed validation
   */
  field: string;

  /**
   * Validation constraint that failed
   */
  constraint: string;

  /**
   * Error message for this field
   */
  message: string;

  /**
   * Value that failed validation
   */
  value?: any;
}

/**
 * Query options for filtering and sorting
 */
export interface QueryOptions {
  /**
   * Filters to apply
   */
  filters?: Record<string, any>;

  /**
   * Sort field and direction
   */
  sort?: SortOption[];

  /**
   * Pagination options
   */
  pagination?: {
    page: number;
    limit: number;
  };

  /**
   * Fields to include/exclude
   */
  select?: string[];

  /**
   * Relations to include
   */
  relations?: string[];
}

/**
 * Sort option
 */
export interface SortOption {
  /**
   * Field to sort by
   */
  field: string;

  /**
   * Sort direction
   */
  direction: 'ASC' | 'DESC';
}

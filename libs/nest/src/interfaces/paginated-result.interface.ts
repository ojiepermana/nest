/**
 * Paginated result interface for standardized API responses
 * Provides type-safe pagination metadata
 */
export interface PaginatedResult<T> {
  /**
   * Array of items for current page
   */
  data: T[];

  /**
   * Pagination metadata
   */
  meta: PaginationMeta;

  /**
   * Navigation links for pagination
   */
  links?: PaginationLinks;
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  /**
   * Current page number (1-indexed)
   */
  currentPage: number;

  /**
   * Number of items per page
   */
  perPage: number;

  /**
   * Total number of items across all pages
   */
  totalItems: number;

  /**
   * Total number of pages
   */
  totalPages: number;

  /**
   * Whether there is a previous page
   */
  hasPreviousPage: boolean;

  /**
   * Whether there is a next page
   */
  hasNextPage: boolean;

  /**
   * Index of first item on current page
   */
  firstItemIndex: number;

  /**
   * Index of last item on current page
   */
  lastItemIndex: number;
}

/**
 * Navigation links for pagination
 */
export interface PaginationLinks {
  /**
   * Link to first page
   */
  first?: string;

  /**
   * Link to previous page
   */
  previous?: string;

  /**
   * Link to current page
   */
  current: string;

  /**
   * Link to next page
   */
  next?: string;

  /**
   * Link to last page
   */
  last?: string;
}

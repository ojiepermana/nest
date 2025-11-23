import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  PaginatedResult,
  PaginationMeta,
  PaginationLinks,
} from '../interfaces/paginated-result.interface';
import { ApiResponse } from '../interfaces/api-response.interface';

/**
 * Standard API response wrapper DTO
 * Enterprise-grade response formatting with Swagger documentation
 */
export class ResponseDto<T = any> implements ApiResponse<T> {
  @ApiProperty({
    description: 'HTTP status code',
    example: 200,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Response message',
    example: 'Operation successful',
  })
  message: string;

  @ApiPropertyOptional({
    description: 'Response data',
  })
  data?: T;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  meta?: Record<string, any>;

  @ApiProperty({
    description: 'Response timestamp',
    example: '2025-01-23T12:00:00.000Z',
  })
  timestamp: string;

  @ApiProperty({
    description: 'Request path',
    example: '/api/users',
  })
  path: string;

  constructor(
    statusCode: number,
    message: string,
    data?: T,
    path: string = '',
    meta?: Record<string, any>,
  ) {
    this.statusCode = statusCode;
    this.message = message;
    this.data = data;
    this.path = path;
    this.meta = meta;
    this.timestamp = new Date().toISOString();
  }

  /**
   * Create success response
   */
  static success<T>(
    data: T,
    message: string = 'Success',
    path: string = '',
    meta?: Record<string, any>,
  ): ResponseDto<T> {
    return new ResponseDto(200, message, data, path, meta);
  }

  /**
   * Create created response
   */
  static created<T>(
    data: T,
    message: string = 'Resource created',
    path: string = '',
  ): ResponseDto<T> {
    return new ResponseDto(201, message, data, path);
  }

  /**
   * Create no content response
   */
  static noContent(message: string = 'No content', path: string = ''): ResponseDto<null> {
    return new ResponseDto(204, message, null, path);
  }

  /**
   * Create paginated response
   */
  static paginated<T>(
    items: T[],
    total: number,
    page: number,
    limit: number,
    path: string = '',
    baseUrl?: string,
  ): ResponseDto<PaginatedResult<T>> {
    const totalPages = Math.ceil(total / limit);
    const currentPage = Math.max(1, Math.min(page, totalPages));
    const firstItemIndex = total > 0 ? (currentPage - 1) * limit + 1 : 0;
    const lastItemIndex = Math.min(currentPage * limit, total);

    const meta: PaginationMeta = {
      currentPage,
      perPage: limit,
      totalItems: total,
      totalPages,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      firstItemIndex,
      lastItemIndex,
    };

    const links: PaginationLinks | undefined = baseUrl
      ? {
          first: `${baseUrl}?page=1&limit=${limit}`,
          previous:
            currentPage > 1 ? `${baseUrl}?page=${currentPage - 1}&limit=${limit}` : undefined,
          current: `${baseUrl}?page=${currentPage}&limit=${limit}`,
          next:
            currentPage < totalPages
              ? `${baseUrl}?page=${currentPage + 1}&limit=${limit}`
              : undefined,
          last: `${baseUrl}?page=${totalPages}&limit=${limit}`,
        }
      : undefined;

    const paginatedData: PaginatedResult<T> = {
      data: items,
      meta,
      links,
    };

    return new ResponseDto(200, 'Data retrieved successfully', paginatedData, path);
  }
}

/**
 * Error response DTO
 */
export class ErrorResponseDto extends ResponseDto<null> {
  @ApiProperty({
    description: 'Error details',
  })
  error: {
    code: string;
    message: string;
    validationErrors?: Array<{
      field: string;
      constraint: string;
      message: string;
    }>;
    stack?: string;
  };

  constructor(
    statusCode: number,
    message: string,
    errorCode: string,
    path: string = '',
    validationErrors?: any[],
    stack?: string,
  ) {
    super(statusCode, message, null, path);
    this.error = {
      code: errorCode,
      message,
      validationErrors,
      stack: process.env.NODE_ENV === 'development' ? stack : undefined,
    };
  }

  /**
   * Create validation error response
   */
  static validationError(errors: any[], path: string = ''): ErrorResponseDto {
    return new ErrorResponseDto(422, 'Validation failed', 'VALIDATION_ERROR', path, errors);
  }

  /**
   * Create not found error response
   */
  static notFound(message: string = 'Resource not found', path: string = ''): ErrorResponseDto {
    return new ErrorResponseDto(404, message, 'NOT_FOUND', path);
  }

  /**
   * Create bad request error response
   */
  static badRequest(message: string = 'Bad request', path: string = ''): ErrorResponseDto {
    return new ErrorResponseDto(400, message, 'BAD_REQUEST', path);
  }

  /**
   * Create unauthorized error response
   */
  static unauthorized(message: string = 'Unauthorized', path: string = ''): ErrorResponseDto {
    return new ErrorResponseDto(401, message, 'UNAUTHORIZED', path);
  }

  /**
   * Create forbidden error response
   */
  static forbidden(message: string = 'Forbidden', path: string = ''): ErrorResponseDto {
    return new ErrorResponseDto(403, message, 'FORBIDDEN', path);
  }

  /**
   * Create internal server error response
   */
  static internalError(
    message: string = 'Internal server error',
    path: string = '',
    stack?: string,
  ): ErrorResponseDto {
    return new ErrorResponseDto(500, message, 'INTERNAL_SERVER_ERROR', path, undefined, stack);
  }
}

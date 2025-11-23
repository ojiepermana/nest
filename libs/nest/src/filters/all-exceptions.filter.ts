import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../common/response.dto';

/**
 * Global exception filter for handling all exceptions
 * Enterprise-grade error handling with logging and formatting
 */
@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  private readonly logger = new Logger(AllExceptionsFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errorCode = 'INTERNAL_SERVER_ERROR';
    let validationErrors: any[] | undefined;
    let stack: string | undefined;

    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const exceptionResponse = exception.getResponse();

      if (typeof exceptionResponse === 'string') {
        message = exceptionResponse;
      } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
        const responseObj = exceptionResponse as any;
        message = responseObj.message || message;
        errorCode = responseObj.error || this.getErrorCodeFromStatus(status);
        validationErrors = responseObj.message?.[0]?.constraints
          ? this.formatValidationErrors(responseObj.message)
          : undefined;
      }

      stack = exception.stack;
    } else if (exception instanceof Error) {
      message = exception.message;
      stack = exception.stack;
      this.logger.error(`Unhandled exception: ${message}`, exception.stack, 'AllExceptionsFilter');
    } else {
      message = String(exception);
      this.logger.error(`Unknown exception type: ${message}`, '', 'AllExceptionsFilter');
    }

    const errorResponse = new ErrorResponseDto(
      status,
      message,
      errorCode,
      request.url,
      validationErrors,
      stack,
    );

    response.status(status).json(errorResponse);
  }

  /**
   * Get error code from HTTP status
   */
  private getErrorCodeFromStatus(status: number): string {
    const statusCodeMap: Record<number, string> = {
      400: 'BAD_REQUEST',
      401: 'UNAUTHORIZED',
      403: 'FORBIDDEN',
      404: 'NOT_FOUND',
      409: 'CONFLICT',
      422: 'VALIDATION_ERROR',
      429: 'TOO_MANY_REQUESTS',
      500: 'INTERNAL_SERVER_ERROR',
      503: 'SERVICE_UNAVAILABLE',
    };

    return statusCodeMap[status] || 'UNKNOWN_ERROR';
  }

  /**
   * Format class-validator validation errors
   */
  private formatValidationErrors(errors: any[]): any[] {
    return errors.map((error) => ({
      field: error.property,
      constraint: Object.keys(error.constraints || {})[0],
      message: Object.values(error.constraints || {})[0],
      value: error.value,
    }));
  }
}

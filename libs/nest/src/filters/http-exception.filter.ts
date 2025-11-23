import { ExceptionFilter, Catch, ArgumentsHost, HttpException, Logger } from '@nestjs/common';
import { Request, Response } from 'express';
import { ErrorResponseDto } from '../common/response.dto';

/**
 * HTTP exception filter for handling HttpException instances
 * Provides detailed error formatting with validation support
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    let message: string;
    let errorCode: string;
    let validationErrors: any[] | undefined;

    if (typeof exceptionResponse === 'string') {
      message = exceptionResponse;
      errorCode = this.getErrorCodeFromStatus(status);
    } else if (typeof exceptionResponse === 'object' && exceptionResponse !== null) {
      const responseObj = exceptionResponse as any;
      message = Array.isArray(responseObj.message)
        ? responseObj.message.join(', ')
        : responseObj.message || exception.message;
      errorCode = responseObj.error || this.getErrorCodeFromStatus(status);

      if (Array.isArray(responseObj.message) && typeof responseObj.message[0] === 'object') {
        validationErrors = this.formatValidationErrors(responseObj.message);
      }
    } else {
      message = exception.message;
      errorCode = this.getErrorCodeFromStatus(status);
    }

    this.logger.warn(`HTTP ${status} - ${errorCode}: ${message} - Path: ${request.url}`);

    const errorResponse = new ErrorResponseDto(
      status,
      message,
      errorCode,
      request.url,
      validationErrors,
      exception.stack,
    );

    response.status(status).json(errorResponse);
  }

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

    return statusCodeMap[status] || 'HTTP_EXCEPTION';
  }

  private formatValidationErrors(errors: any[]): any[] {
    return errors.map((error) => ({
      field: error.property,
      constraint: Object.keys(error.constraints || {})[0],
      message: Object.values(error.constraints || {})[0],
      value: error.value,
    }));
  }
}

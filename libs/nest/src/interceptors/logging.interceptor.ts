import { Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger } from '@nestjs/common';
import { Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { Request } from 'express';

/**
 * Logging interceptor for request/response logging
 * Logs method, URL, execution time, and status code
 */
@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP');

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest<Request>();
    const { method, url, ip } = request;
    const userAgent = request.get('user-agent') || '';
    const startTime = Date.now();

    this.logger.log(`→ ${method} ${url} - ${ip} - ${userAgent}`);

    return next.handle().pipe(
      tap({
        next: () => {
          const response = context.switchToHttp().getResponse();
          const { statusCode } = response;
          const executionTime = Date.now() - startTime;

          this.logger.log(`← ${method} ${url} ${statusCode} - ${executionTime}ms`);
        },
        error: (error) => {
          const executionTime = Date.now() - startTime;
          const statusCode = error.status || 500;

          this.logger.error(
            `← ${method} ${url} ${statusCode} - ${executionTime}ms - Error: ${error.message}`,
          );
        },
      }),
    );
  }
}

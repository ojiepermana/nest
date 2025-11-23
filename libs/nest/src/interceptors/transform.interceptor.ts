import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ResponseDto } from '../common/response.dto';

/**
 * Transform interceptor for automatic response wrapping
 * Wraps responses in ResponseDto unless already wrapped
 */
@Injectable()
export class TransformInterceptor<T> implements NestInterceptor<T, ResponseDto<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ResponseDto<T>> {
    const response = context.switchToHttp().getResponse();
    const statusCode = response.statusCode;

    return next.handle().pipe(
      map((data) => {
        if (data instanceof ResponseDto) {
          return data;
        }

        if (statusCode === 201) {
          return ResponseDto.created(data);
        }

        if (statusCode === 204 || data === null || data === undefined) {
          return ResponseDto.noContent();
        }

        return ResponseDto.success(data);
      }),
    );
  }
}

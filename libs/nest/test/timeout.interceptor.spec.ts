import { TimeoutInterceptor } from '../src/interceptors/timeout.interceptor';
import { RequestTimeoutException } from '@nestjs/common';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, delay, throwError } from 'rxjs';

describe('TimeoutInterceptor', () => {
  let interceptor: TimeoutInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;

  beforeEach(() => {
    mockExecutionContext = {} as any;
    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should allow requests within timeout', (done) => {
    interceptor = new TimeoutInterceptor(1000);
    mockCallHandler.handle = jest.fn().mockReturnValue(of('success').pipe(delay(100)));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe('success');
        done();
      },
    });
  });

  it('should throw RequestTimeoutException for slow requests', (done) => {
    interceptor = new TimeoutInterceptor(100);
    mockCallHandler.handle = jest.fn().mockReturnValue(of('slow').pipe(delay(200)));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (error) => {
        expect(error).toBeInstanceOf(RequestTimeoutException);
        expect(error.message).toContain('Request timeout after 100ms');
        done();
      },
    });
  });

  it('should use default timeout of 30000ms', () => {
    interceptor = new TimeoutInterceptor();
    expect(interceptor['timeoutMs']).toBe(30000);
  });

  it('should preserve other errors', (done) => {
    interceptor = new TimeoutInterceptor(1000);
    const customError = new Error('Custom error');
    mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => customError));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: (error) => {
        expect(error).toBe(customError);
        done();
      },
    });
  });
});

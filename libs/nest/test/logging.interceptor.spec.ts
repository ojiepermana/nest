import { LoggingInterceptor } from '../src/interceptors/logging.interceptor';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of, throwError } from 'rxjs';

describe('LoggingInterceptor', () => {
  let interceptor: LoggingInterceptor;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockRequest: any;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new LoggingInterceptor();

    mockRequest = {
      method: 'GET',
      url: '/api/test',
      ip: '127.0.0.1',
      get: jest.fn().mockReturnValue('Mozilla/5.0'),
    };

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: () => mockRequest,
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should log request and successful response', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        expect(logSpy).toHaveBeenCalledTimes(2);
        expect(logSpy).toHaveBeenNthCalledWith(1, expect.stringContaining('→ GET /api/test'));
        expect(logSpy).toHaveBeenNthCalledWith(2, expect.stringContaining('← GET /api/test 200'));
        done();
      },
    });
  });

  it('should log execution time', (done) => {
    mockCallHandler.handle = jest.fn().mockReturnValue(of({ data: 'test' }));

    const logSpy = jest.spyOn(interceptor['logger'], 'log');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: () => {
        const loggedMessage = logSpy.mock.calls[1][0];
        expect(loggedMessage).toMatch(/\d+ms/);
        done();
      },
    });
  });

  it('should log errors with status code', (done) => {
    const error = { message: 'Test error', status: 500 };
    mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

    const errorSpy = jest.spyOn(interceptor['logger'], 'error');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('← GET /api/test 500'));
        done();
      },
    });
  });

  it('should log errors without status code as 500', (done) => {
    const error = { message: 'Test error' };
    mockCallHandler.handle = jest.fn().mockReturnValue(throwError(() => error));

    const errorSpy = jest.spyOn(interceptor['logger'], 'error');

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      error: () => {
        expect(errorSpy).toHaveBeenCalledWith(expect.stringContaining('500'));
        done();
      },
    });
  });
});

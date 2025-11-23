import { TransformInterceptor } from '../src/interceptors/transform.interceptor';
import { ResponseDto } from '../src/common/response.dto';
import { ExecutionContext, CallHandler } from '@nestjs/common';
import { of } from 'rxjs';

describe('TransformInterceptor', () => {
  let interceptor: TransformInterceptor<any>;
  let mockExecutionContext: ExecutionContext;
  let mockCallHandler: CallHandler;
  let mockResponse: any;

  beforeEach(() => {
    interceptor = new TransformInterceptor();

    mockResponse = {
      statusCode: 200,
    };

    mockExecutionContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should wrap data in ResponseDto for 200 status', (done) => {
    const data = { id: 1, name: 'Test' };
    mockCallHandler.handle = jest.fn().mockReturnValue(of(data));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBeInstanceOf(ResponseDto);
        expect(result.statusCode).toBe(200);
        expect(result.data).toEqual(data);
        done();
      },
    });
  });

  it('should use ResponseDto.created() for 201 status', (done) => {
    const data = { id: 1, name: 'Created' };
    mockResponse.statusCode = 201;
    mockCallHandler.handle = jest.fn().mockReturnValue(of(data));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBeInstanceOf(ResponseDto);
        expect(result.statusCode).toBe(201);
        expect(result.message).toBe('Resource created');
        done();
      },
    });
  });

  it('should use ResponseDto.noContent() for 204 status', (done) => {
    mockResponse.statusCode = 204;
    mockCallHandler.handle = jest.fn().mockReturnValue(of(null));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBeInstanceOf(ResponseDto);
        expect(result.statusCode).toBe(204);
        expect(result.data).toBeNull();
        done();
      },
    });
  });

  it('should not double-wrap already wrapped responses', (done) => {
    const wrappedData = ResponseDto.success({ id: 1 });
    mockCallHandler.handle = jest.fn().mockReturnValue(of(wrappedData));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result).toBe(wrappedData);
        done();
      },
    });
  });

  it('should handle undefined data', (done) => {
    mockResponse.statusCode = 204;
    mockCallHandler.handle = jest.fn().mockReturnValue(of(undefined));

    interceptor.intercept(mockExecutionContext, mockCallHandler).subscribe({
      next: (result) => {
        expect(result.statusCode).toBe(204);
        expect(result.data).toBeNull();
        done();
      },
    });
  });
});

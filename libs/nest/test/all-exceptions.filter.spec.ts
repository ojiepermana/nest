import { AllExceptionsFilter } from '../src/filters/all-exceptions.filter';
import { HttpException, HttpStatus } from '@nestjs/common';
import { ArgumentsHost } from '@nestjs/common';

describe('AllExceptionsFilter', () => {
  let filter: AllExceptionsFilter;
  let mockResponse: any;
  let mockRequest: any;
  let mockHost: ArgumentsHost;

  beforeEach(() => {
    filter = new AllExceptionsFilter();

    mockResponse = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis(),
    };

    mockRequest = {
      url: '/api/test',
      method: 'GET',
    };

    mockHost = {
      switchToHttp: jest.fn().mockReturnValue({
        getResponse: () => mockResponse,
        getRequest: () => mockRequest,
      }),
    } as any;
  });

  it('should handle HttpException', () => {
    const exception = new HttpException('Test error', HttpStatus.BAD_REQUEST);

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.BAD_REQUEST);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Test error',
        path: '/api/test',
      }),
    );
  });

  it('should handle standard Error', () => {
    const exception = new Error('Standard error');

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Standard error',
      }),
    );
  });

  it('should handle unknown exception type', () => {
    const exception = 'Unknown error';

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.INTERNAL_SERVER_ERROR);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Unknown error',
      }),
    );
  });

  it('should format validation errors correctly', () => {
    const exception = new HttpException(
      {
        message: [
          {
            property: 'email',
            value: 'invalid',
            constraints: {
              isEmail: 'email must be an email',
            },
          },
        ],
        error: 'Validation Error',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );

    filter.catch(exception, mockHost);

    expect(mockResponse.status).toHaveBeenCalledWith(HttpStatus.UNPROCESSABLE_ENTITY);
    expect(mockResponse.json).toHaveBeenCalledWith(
      expect.objectContaining({
        statusCode: HttpStatus.UNPROCESSABLE_ENTITY,
        error: expect.objectContaining({
          validationErrors: expect.any(Array),
        }),
      }),
    );
  });

  it('should map HTTP status to error codes', () => {
    const testCases = [
      { status: 400, expectedCode: 'BAD_REQUEST' },
      { status: 401, expectedCode: 'UNAUTHORIZED' },
      { status: 403, expectedCode: 'FORBIDDEN' },
      { status: 404, expectedCode: 'NOT_FOUND' },
      { status: 422, expectedCode: 'VALIDATION_ERROR' },
      { status: 500, expectedCode: 'INTERNAL_SERVER_ERROR' },
    ];

    testCases.forEach(({ status, expectedCode }) => {
      const exception = new HttpException({ error: expectedCode, message: 'Test' }, status);
      filter.catch(exception, mockHost);

      expect(mockResponse.json).toHaveBeenCalledWith(
        expect.objectContaining({
          error: expect.objectContaining({
            code: expectedCode,
          }),
        }),
      );
    });
  });
});

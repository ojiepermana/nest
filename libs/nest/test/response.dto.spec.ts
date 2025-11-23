import { ResponseDto, ErrorResponseDto } from '../src/common/response.dto';
import { HttpStatus } from '../src/constants/http-status';

describe('ResponseDto', () => {
  describe('success()', () => {
    it('should create success response with data', () => {
      const data = { id: 1, name: 'Test' };
      const response = ResponseDto.success(data);

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.message).toBe('Success');
      expect(response.data).toEqual(data);
      expect(response.timestamp).toBeDefined();
    });

    it('should accept custom message', () => {
      const response = ResponseDto.success({ id: 1 }, 'Custom success');
      expect(response.message).toBe('Custom success');
    });

    it('should handle null data', () => {
      const response = ResponseDto.success(null);
      expect(response.data).toBeNull();
    });
  });

  describe('created()', () => {
    it('should create 201 response', () => {
      const data = { id: 1, name: 'Created' };
      const response = ResponseDto.created(data);

      expect(response.statusCode).toBe(HttpStatus.CREATED);
      expect(response.message).toBe('Resource created');
      expect(response.data).toEqual(data);
    });
  });

  describe('noContent()', () => {
    it('should create 204 response with no data', () => {
      const response = ResponseDto.noContent();

      expect(response.statusCode).toBe(HttpStatus.NO_CONTENT);
      expect(response.message).toBe('No content');
      expect(response.data).toBeNull();
    });
  });

  describe('paginated()', () => {
    it('should create paginated response with correct metadata', () => {
      const items = [
        { id: 1, name: 'Item 1' },
        { id: 2, name: 'Item 2' },
      ];
      const response = ResponseDto.paginated(items, 100, 1, 10, '/api/items', '/api/items');

      expect(response.statusCode).toBe(HttpStatus.OK);
      expect(response.data).toBeDefined();
      expect(response.data?.data).toEqual(items);
      expect(response.data?.meta).toBeDefined();
      expect(response.data?.meta?.currentPage).toBe(1);
      expect(response.data?.meta?.perPage).toBe(10);
      expect(response.data?.meta?.totalItems).toBe(100);
      expect(response.data?.meta?.totalPages).toBe(10);
    });

    it('should calculate totalPages correctly', () => {
      const response = ResponseDto.paginated([], 25, 1, 10, '/api/items', '/api/items');
      expect(response.data?.meta?.totalPages).toBe(3);
    });

    it('should set hasPreviousPage correctly', () => {
      const response1 = ResponseDto.paginated([], 100, 1, 10, '/api/items', '/api/items');
      expect(response1.data?.meta?.hasPreviousPage).toBe(false);

      const response2 = ResponseDto.paginated([], 100, 2, 10, '/api/items', '/api/items');
      expect(response2.data?.meta?.hasPreviousPage).toBe(true);
    });

    it('should set hasNextPage correctly', () => {
      const response1 = ResponseDto.paginated([], 100, 10, 10, '/api/items', '/api/items');
      expect(response1.data?.meta?.hasNextPage).toBe(false);

      const response2 = ResponseDto.paginated([], 100, 1, 10, '/api/items', '/api/items');
      expect(response2.data?.meta?.hasNextPage).toBe(true);
    });

    it('should calculate correct item indices', () => {
      const response = ResponseDto.paginated([], 100, 3, 10, '/api/items', '/api/items');
      expect(response.data?.meta?.firstItemIndex).toBe(21);
      expect(response.data?.meta?.lastItemIndex).toBe(30);
    });

    it('should generate correct HATEOAS links', () => {
      const response = ResponseDto.paginated([], 100, 3, 10, '/api/items', '/api/items');

      expect(response.data?.links?.first).toBe('/api/items?page=1&limit=10');
      expect(response.data?.links?.previous).toBe('/api/items?page=2&limit=10');
      expect(response.data?.links?.current).toBe('/api/items?page=3&limit=10');
      expect(response.data?.links?.next).toBe('/api/items?page=4&limit=10');
      expect(response.data?.links?.last).toBe('/api/items?page=10&limit=10');
    });

    it('should handle first page links correctly', () => {
      const response = ResponseDto.paginated([], 100, 1, 10, '/api/items', '/api/items');

      expect(response.data?.links?.previous).toBeUndefined();
      expect(response.data?.links?.next).toBe('/api/items?page=2&limit=10');
    });

    it('should handle last page links correctly', () => {
      const response = ResponseDto.paginated([], 100, 10, 10, '/api/items', '/api/items');

      expect(response.data?.links?.previous).toBe('/api/items?page=9&limit=10');
      expect(response.data?.links?.next).toBeUndefined();
    });

    it('should handle single page scenario', () => {
      const response = ResponseDto.paginated([], 5, 1, 10, '/api/items', '/api/items');

      expect(response.data?.meta?.totalPages).toBe(1);
      expect(response.data?.meta?.hasPreviousPage).toBe(false);
      expect(response.data?.meta?.hasNextPage).toBe(false);
      expect(response.data?.links?.previous).toBeUndefined();
      expect(response.data?.links?.next).toBeUndefined();
    });

    it('should handle empty results', () => {
      const response = ResponseDto.paginated([], 0, 1, 10, '/api/items', '/api/items');

      expect(response.data?.meta?.totalPages).toBe(0);
      expect(response.data?.meta?.totalItems).toBe(0);
      expect(response.data?.data).toEqual([]);
    });
  });
});

describe('ErrorResponseDto', () => {
  describe('validationError()', () => {
    it('should create validation error response', () => {
      const errors = [{ field: 'email', message: 'Invalid email', constraint: 'isEmail' }];
      const response = ErrorResponseDto.validationError(errors, '/api/users');

      expect(response.statusCode).toBe(HttpStatus.UNPROCESSABLE_ENTITY);
      expect(response.error).toBeDefined();
      expect(response.error?.validationErrors).toEqual(errors);
    });
  });

  describe('notFound()', () => {
    it('should create 404 response', () => {
      const response = ErrorResponseDto.notFound('User not found', '/api/users/123');

      expect(response.statusCode).toBe(HttpStatus.NOT_FOUND);
      expect(response.message).toBe('User not found');
      expect(response.error.code).toBe('NOT_FOUND');
    });
  });

  describe('badRequest()', () => {
    it('should create 400 response', () => {
      const response = ErrorResponseDto.badRequest('Invalid data', '/api/users');

      expect(response.statusCode).toBe(HttpStatus.BAD_REQUEST);
      expect(response.message).toBe('Invalid data');
    });
  });

  describe('unauthorized()', () => {
    it('should create 401 response', () => {
      const response = ErrorResponseDto.unauthorized('Unauthorized', '/api/protected');

      expect(response.statusCode).toBe(HttpStatus.UNAUTHORIZED);
      expect(response.message).toBe('Unauthorized');
    });
  });

  describe('forbidden()', () => {
    it('should create 403 response', () => {
      const response = ErrorResponseDto.forbidden('Forbidden', '/api/admin');

      expect(response.statusCode).toBe(HttpStatus.FORBIDDEN);
      expect(response.message).toBe('Forbidden');
    });
  });

  describe('internalError()', () => {
    it('should create 500 response', () => {
      const error = new Error('Database connection failed');
      const response = ErrorResponseDto.internalError(
        'Something went wrong',
        '/api/users',
        error.stack,
      );

      expect(response.statusCode).toBe(HttpStatus.INTERNAL_SERVER_ERROR);
      expect(response.message).toBe('Something went wrong');
    });

    it('should include stack trace in development', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';

      const error = new Error('Test error');
      const response = ErrorResponseDto.internalError('Error', '/api/test', error.stack);

      expect(response.error?.stack).toBeDefined();

      process.env.NODE_ENV = originalEnv;
    });

    it('should not include stack trace in production', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';

      const error = new Error('Test error');
      const response = ErrorResponseDto.internalError('Error', '/api/test', error.stack);

      expect(response.error?.stack).toBeUndefined();

      process.env.NODE_ENV = originalEnv;
    });
  });
});

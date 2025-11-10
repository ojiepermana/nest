/**
 * SearchSyncInterceptor Tests
 */

import { CallHandler, ExecutionContext } from '@nestjs/common';
import { of } from 'rxjs';
import { SearchSyncInterceptor } from './search-sync.interceptor';
import { SearchService } from '../search.service';

describe('SearchSyncInterceptor', () => {
  let interceptor: SearchSyncInterceptor;
  let mockSearchService: jest.Mocked<SearchService>;
  let mockContext: jest.Mocked<ExecutionContext>;
  let mockCallHandler: jest.Mocked<CallHandler>;

  beforeEach(() => {
    mockSearchService = {
      makeSearchable: jest.fn(),
      updateSearchable: jest.fn(),
      removeFromSearch: jest.fn(),
      importSearchable: jest.fn(),
    } as any;

    mockContext = {
      switchToHttp: jest.fn().mockReturnValue({
        getRequest: jest.fn().mockReturnValue({
          method: 'POST',
        }),
      }),
    } as any;

    mockCallHandler = {
      handle: jest.fn(),
    } as any;
  });

  it('should sync on POST (create)', (done) => {
    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      async: false,
    });

    const data = { id: '1', name: 'Product 1' };
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        // Note: sync is async, so we need to wait
        setTimeout(() => {
          expect(mockSearchService.makeSearchable).toHaveBeenCalledWith('Product', data, '1');
          done();
        }, 100);
      },
    });
  });

  it('should sync on PUT (update)', (done) => {
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      method: 'PUT',
    });

    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      async: false,
    });

    const data = { id: '1', name: 'Updated Product' };
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        setTimeout(() => {
          expect(mockSearchService.updateSearchable).toHaveBeenCalledWith('Product', data, '1');
          done();
        }, 100);
      },
    });
  });

  it('should sync on DELETE', (done) => {
    mockContext.switchToHttp().getRequest = jest.fn().mockReturnValue({
      method: 'DELETE',
    });

    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      async: false,
    });

    const data = { id: '1' };
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        setTimeout(() => {
          expect(mockSearchService.removeFromSearch).toHaveBeenCalledWith('Product', '1');
          done();
        }, 100);
      },
    });
  });

  it('should handle array data for bulk import', (done) => {
    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      async: false,
    });

    const data = [
      { id: '1', name: 'Product 1' },
      { id: '2', name: 'Product 2' },
    ];
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        setTimeout(() => {
          expect(mockSearchService.importSearchable).toHaveBeenCalledWith('Product', data, 'id');
          done();
        }, 100);
      },
    });
  });

  it('should skip sync if onCreate is disabled', (done) => {
    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      onCreate: false,
    });

    const data = { id: '1', name: 'Product 1' };
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        setTimeout(() => {
          expect(mockSearchService.makeSearchable).not.toHaveBeenCalled();
          done();
        }, 100);
      },
    });
  });

  it('should use custom idField', (done) => {
    interceptor = new SearchSyncInterceptor(mockSearchService, 'Product', {
      idField: 'productId',
      async: false,
    });

    const data = { productId: 'abc123', name: 'Product 1' };
    mockCallHandler.handle.mockReturnValue(of(data));

    interceptor.intercept(mockContext, mockCallHandler).subscribe({
      complete: () => {
        setTimeout(() => {
          expect(mockSearchService.makeSearchable).toHaveBeenCalledWith('Product', data, 'abc123');
          done();
        }, 100);
      },
    });
  });
});

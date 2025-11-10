/**
 * SearchService Tests
 *
 * Unit tests for SearchService
 */

import { Test, TestingModule } from '@nestjs/testing';
import { SearchService } from './search.service';
import { SEARCH_DRIVER } from './search.constants';
import type { ISearchDriver, SearchableConfig } from './interfaces/search.interface';

describe('SearchService', () => {
  let service: SearchService;
  let mockDriver: jest.Mocked<ISearchDriver>;

  beforeEach(async () => {
    // Create mock driver
    mockDriver = {
      index: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      bulk: jest.fn(),
      search: jest.fn(),
      suggest: jest.fn(),
      moreLikeThis: jest.fn(),
      count: jest.fn(),
      aggregate: jest.fn(),
      geoSearch: jest.fn(),
      createIndex: jest.fn(),
      deleteIndex: jest.fn(),
      updateIndexSettings: jest.fn(),
      addSynonyms: jest.fn(),
      getIndexStats: jest.fn(),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SearchService,
        {
          provide: SEARCH_DRIVER,
          useValue: mockDriver,
        },
      ],
    }).compile();

    service = module.get<SearchService>(SearchService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('registerSearchableModel', () => {
    it('should register a searchable model', () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name', 'description'],
        filterableFields: ['price', 'category'],
      };

      service.registerSearchableModel('Product', config);

      expect(mockDriver.createIndex).toHaveBeenCalledWith('products', config);
    });
  });

  describe('makeSearchable', () => {
    it('should index a document', async () => {
      const data = { id: '1', name: 'Product 1' };

      await service.makeSearchable('Product', data, '1');

      expect(mockDriver.index).toHaveBeenCalledWith('products', data, '1');
    });

    it('should throw error if model not registered', async () => {
      await expect(service.makeSearchable('Unknown', {}, '1')).rejects.toThrow(
        'Model Unknown is not registered as searchable',
      );
    });
  });

  describe('updateSearchable', () => {
    it('should update a document', async () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name'],
      };
      service.registerSearchableModel('Product', config);

      const data = { name: 'Updated Product' };

      await service.updateSearchable('Product', data, '1');

      expect(mockDriver.update).toHaveBeenCalledWith('products', data, '1');
    });
  });

  describe('removeFromSearch', () => {
    it('should delete a document', async () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name'],
      };
      service.registerSearchableModel('Product', config);

      await service.removeFromSearch('Product', '1');

      expect(mockDriver.delete).toHaveBeenCalledWith('products', '1');
    });
  });

  describe('search', () => {
    it('should search documents', async () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name', 'description'],
      };
      service.registerSearchableModel('Product', config);

      const mockResults = {
        hits: [{ id: '1', name: 'Product 1' }],
        total: 1,
        took: 10,
      };
      mockDriver.search.mockResolvedValue(mockResults);

      const results = await service.search('Product', 'test query');

      expect(mockDriver.search).toHaveBeenCalledWith('products', 'test query', expect.any(Object));
      expect(results).toEqual(mockResults);
    });
  });

  describe('importSearchable', () => {
    it('should bulk import documents', async () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name'],
      };
      service.registerSearchableModel('Product', config);

      const documents = [
        { id: '1', data: { name: 'Product 1' } },
        { id: '2', data: { name: 'Product 2' } },
      ];

      await service.importSearchable('Product', documents);

      expect(mockDriver.bulk).toHaveBeenCalledWith('products', 'index', documents);
    });
  });

  describe('queryBuilder', () => {
    it('should return a query builder instance', () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name'],
      };
      service.registerSearchableModel('Product', config);

      const builder = service.queryBuilder('Product');

      expect(builder).toBeDefined();
      expect(typeof builder.where).toBe('function');
      expect(typeof builder.limit).toBe('function');
      expect(typeof builder.get).toBe('function');
    });

    it('should execute query builder', async () => {
      const config: SearchableConfig = {
        indexName: 'products',
        searchableFields: ['name'],
        filterableFields: ['price', 'category'],
      };
      service.registerSearchableModel('Product', config);

      const mockResults = {
        hits: [{ id: '1', name: 'Product 1', price: 100 }],
        total: 1,
        took: 10,
      };
      mockDriver.search.mockResolvedValue(mockResults);

      const results = await service
        .queryBuilder('Product')
        .where('price', 'gte', 50)
        .where('category', 'eq', 'electronics')
        .limit(10)
        .get();

      expect(mockDriver.search).toHaveBeenCalled();
      expect(results).toEqual(mockResults);
    });
  });
});

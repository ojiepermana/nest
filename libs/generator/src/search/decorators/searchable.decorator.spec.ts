/**
 * Searchable Decorator Tests
 */

import { Searchable, getSearchableConfig, isSearchable } from './searchable.decorator';

describe('@Searchable Decorator', () => {
  it('should mark a class as searchable', () => {
    @Searchable({
      searchableFields: ['name', 'description'],
      filterableFields: ['price'],
    })
    class Product {
      id!: string;
      name!: string;
      description!: string;
      price!: number;
    }

    expect(isSearchable(Product)).toBe(true);
  });

  it('should store searchable configuration', () => {
    @Searchable({
      indexName: 'custom_products',
      searchableFields: ['name', 'description'],
      filterableFields: ['price', 'category'],
      facets: ['category'],
    })
    class Product {
      id!: string;
      name!: string;
    }

    const config = getSearchableConfig(Product);

    expect(config).toBeDefined();
    expect(config?.indexName).toBe('custom_products');
    expect(config?.searchableFields).toEqual(['name', 'description']);
    expect(config?.filterableFields).toEqual(['price', 'category']);
    expect(config?.facets).toEqual(['category']);
  });

  it('should auto-generate index name from class name', () => {
    @Searchable({
      searchableFields: ['name'],
    })
    class User {
      id!: string;
      name!: string;
    }

    const config = getSearchableConfig(User);

    expect(config?.indexName).toBe('users');
  });

  it('should return false for non-searchable class', () => {
    class NonSearchable {
      id!: string;
    }

    expect(isSearchable(NonSearchable)).toBe(false);
  });

  it('should return undefined config for non-searchable class', () => {
    class NonSearchable {
      id!: string;
    }

    const config = getSearchableConfig(NonSearchable);

    expect(config).toBeUndefined();
  });
});

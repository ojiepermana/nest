import { buildFilterQuery } from './filter-query';

describe('buildFilterQuery', () => {
  it('applies equality filters', () => {
    const result = buildFilterQuery('SELECT * FROM users', { username_eq: 'john' });
    expect(result.text).toContain('WHERE "username" = $1');
    expect(result.values).toEqual(['john']);
  });

  it('applies like filters and pagination', () => {
    const result = buildFilterQuery('SELECT * FROM users', {
      username_like: 'doe',
      _limit: 10,
      _page: 2,
      _sort: 'created_at',
      _order: 'desc',
    });

    expect(result.text).toContain('ILIKE');
    expect(result.text).toContain('ORDER BY "created_at" DESC');
    expect(result.text).toContain('LIMIT 10');
    expect(result.text).toContain('OFFSET 10');
    expect(result.values).toEqual(['%doe%']);
  });

  it('handles between and in operators', () => {
    const result = buildFilterQuery('SELECT * FROM users', {
      created_at_between: '2024-01-01,2024-12-31',
      status_in: ['active', 'inactive'],
    });

    expect(result.text).toContain('BETWEEN');
    expect(result.text).toContain('IN ($3, $4)');
    expect(result.values).toEqual(['2024-01-01', '2024-12-31', 'active', 'inactive']);
  });
});

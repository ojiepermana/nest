/**
 * Query Builder Tests
 */

import { QueryBuilder } from './query-builder';
import { QueryFilterOperator } from './query-types';

describe('QueryBuilder', () => {
  describe('PostgreSQL', () => {
    it('should create a query builder instance', () => {
      const builder = new QueryBuilder('users', 'postgresql');
      expect(builder).toBeDefined();
    });

    it('should create using static factory method', () => {
      const builder = QueryBuilder.create('users', 'postgresql', 'u');
      expect(builder).toBeDefined();
    });

    describe('SELECT queries', () => {
      it('should build simple SELECT query', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder.buildSelect();

        expect(query.sql).toBe('SELECT * FROM users');
        expect(query.params).toEqual({});
      });

      it('should build SELECT with specific columns', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder.select(['id', 'name', 'email']).buildSelect();

        expect(query.sql).toBe('SELECT id, name, email FROM users');
      });

      it('should build SELECT with table alias', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder.select(['u.id', 'u.name']).buildSelect();

        expect(query.sql).toBe('SELECT u.id, u.name FROM users u');
      });

      it('should build SELECT with WHERE condition', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('status', QueryFilterOperator.EQUALS, 'active')
          .buildSelect();

        expect(query.sql).toBe('SELECT * FROM users WHERE status = $param1');
        expect(query.params).toEqual({ param1: 'active' });
      });

      it('should build SELECT with multiple WHERE conditions', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('status', QueryFilterOperator.EQUALS, 'active')
          .andWhere('age', QueryFilterOperator.GREATER_THAN, 18)
          .buildSelect();

        expect(query.sql).toBe(
          'SELECT * FROM users WHERE status = $param1 AND age > $param2',
        );
        expect(query.params).toEqual({ param1: 'active', param2: 18 });
      });

      it('should build SELECT with filters from DTO', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const filterDto = {
          status_eq: 'active',
          age_gt: 18,
          name_like: 'John',
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain('status = $param1');
        expect(query.sql).toContain('age > $param2');
        expect(query.sql).toContain('name LIKE $param3');
        expect(query.params).toEqual({
          param1: 'active',
          param2: 18,
          param3: '%John%',
        });
      });

      it('should handle IN operator from DTO', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const filterDto = {
          status_in: ['active', 'pending', 'suspended'],
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain(
          'status IN ($param1_0, $param1_1, $param1_2)',
        );
        expect(query.params).toEqual({
          param1_0: 'active',
          param1_1: 'pending',
          param1_2: 'suspended',
        });
      });

      it('should handle BETWEEN operator from DTO', () => {
        const builder = new QueryBuilder('products', 'postgresql');
        const filterDto = {
          price_between: [100, 500],
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain(
          'price BETWEEN $param1_start AND $param1_end',
        );
        expect(query.params).toEqual({
          param1_start: 100,
          param1_end: 500,
        });
      });

      it('should handle IS NULL operator from DTO', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const filterDto = {
          deleted_at_null: true,
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain('deleted_at IS NULL');
      });

      it('should build SELECT with INNER JOIN', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .select(['u.id', 'u.name', 'p.title'])
          .innerJoin('posts', 'id', 'user_id', 'p')
          .buildSelect();

        expect(query.sql).toContain('INNER JOIN posts p ON u.id = p.user_id');
      });

      it('should build SELECT with LEFT JOIN', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .leftJoin('posts', 'id', 'user_id', 'p')
          .buildSelect();

        expect(query.sql).toContain('LEFT JOIN posts p ON u.id = p.user_id');
      });

      it('should build SELECT with multiple JOINs', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .leftJoin('posts', 'id', 'user_id', 'p')
          .leftJoin('comments', 'p.id', 'post_id', 'c')
          .buildSelect();

        expect(query.sql).toContain('LEFT JOIN posts p ON u.id = p.user_id');
        expect(query.sql).toContain('LEFT JOIN comments c ON p.id = c.post_id');
      });

      it('should build SELECT with ORDER BY', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .orderBy('created_at', 'DESC')
          .orderBy('name', 'ASC')
          .buildSelect();

        expect(query.sql).toContain('ORDER BY created_at DESC, name ASC');
      });

      it('should build SELECT with sort params', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const sortParams = [
          { field: 'created_at', direction: 'DESC' as const },
          { field: 'name', direction: 'ASC' as const },
        ];

        const query = builder.addSort(sortParams).buildSelect();

        expect(query.sql).toContain('ORDER BY created_at DESC, name ASC');
      });

      it('should build SELECT with pagination', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder.paginate({ page: 2, limit: 10 }).buildSelect();

        expect(query.sql).toContain('LIMIT 10 OFFSET 10');
      });

      it('should build SELECT with limit and offset', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder.limit(20, 40).buildSelect();

        expect(query.sql).toContain('LIMIT 20 OFFSET 40');
      });

      it('should enforce max limit of 100', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder.paginate({ page: 1, limit: 200 }).buildSelect();

        expect(query.sql).toContain('LIMIT 100');
      });

      it('should build SELECT with GROUP BY', () => {
        const builder = new QueryBuilder('orders', 'postgresql');
        const query = builder
          .select(['user_id', 'COUNT(*) as order_count'])
          .groupBy(['user_id'])
          .buildSelect();

        expect(query.sql).toContain('GROUP BY user_id');
      });

      it('should build SELECT with HAVING', () => {
        const builder = new QueryBuilder('orders', 'postgresql');
        const query = builder
          .select(['user_id', 'COUNT(*) as order_count'])
          .groupBy(['user_id'])
          .having('COUNT(*)', QueryFilterOperator.GREATER_THAN, 5)
          .buildSelect();

        expect(query.sql).toContain('HAVING COUNT(*) > $param1');
      });

      it('should build complex SELECT with all features', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .select(['u.id', 'u.name', 'COUNT(p.id) as post_count'])
          .leftJoin('posts', 'id', 'user_id', 'p')
          .where('u.status', QueryFilterOperator.EQUALS, 'active')
          .groupBy(['u.id', 'u.name'])
          .having('COUNT(p.id)', QueryFilterOperator.GREATER_THAN, 0)
          .orderBy('post_count', 'DESC')
          .paginate({ page: 1, limit: 20 })
          .buildSelect();

        expect(query.sql).toContain('SELECT u.id, u.name, COUNT(p.id)');
        expect(query.sql).toContain('LEFT JOIN posts p');
        expect(query.sql).toContain('WHERE u.status = $param1');
        expect(query.sql).toContain('GROUP BY u.id, u.name');
        expect(query.sql).toContain('HAVING COUNT(p.id) > $param2');
        expect(query.sql).toContain('ORDER BY u.post_count DESC');
        expect(query.sql).toContain('LIMIT 20 OFFSET 0');
      });

      it('should auto-qualify columns with table alias', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .where('status', QueryFilterOperator.EQUALS, 'active')
          .buildSelect();

        expect(query.sql).toContain('u.status = $param1');
      });

      it('should not double-qualify already qualified columns', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .where('u.status', QueryFilterOperator.EQUALS, 'active')
          .buildSelect();

        expect(query.sql).toContain('u.status = $param1');
        expect(query.sql).not.toContain('u.u.status');
      });
    });

    describe('COUNT queries', () => {
      it('should build COUNT query', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('status', QueryFilterOperator.EQUALS, 'active')
          .buildCount();

        expect(query.sql).toBe(
          'SELECT COUNT(*) as total FROM users WHERE status = $param1',
        );
      });

      it('should build COUNT query with JOINs', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');
        const query = builder
          .leftJoin('posts', 'id', 'user_id', 'p')
          .where('u.status', QueryFilterOperator.EQUALS, 'active')
          .buildCount();

        expect(query.sql).toContain('SELECT COUNT(*) as total FROM users u');
        expect(query.sql).toContain('LEFT JOIN posts p');
        expect(query.sql).toContain('WHERE u.status = $param1');
      });
    });

    describe('INSERT queries', () => {
      it('should build INSERT query', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
          age: 30,
        };

        const query = builder.buildInsert(data);

        expect(query.sql).toBe(
          'INSERT INTO users (name, email, age) VALUES ($param1, $param2, $param3)',
        );
        expect(query.params).toEqual({
          param1: 'John Doe',
          param2: 'john@example.com',
          param3: 30,
        });
      });

      it('should build INSERT with RETURNING clause', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const data = {
          name: 'John Doe',
          email: 'john@example.com',
        };

        const query = builder.buildInsert(data, ['id', 'created_at']);

        expect(query.sql).toContain('RETURNING id, created_at');
      });
    });

    describe('UPDATE queries', () => {
      it('should build UPDATE query', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const data = {
          name: 'Jane Doe',
          email: 'jane@example.com',
        };

        const query = builder
          .where('id', QueryFilterOperator.EQUALS, 1)
          .buildUpdate(data);

        expect(query.sql).toBe(
          'UPDATE users SET name = $param1, email = $param2 WHERE id = $param3',
        );
        expect(query.params).toEqual({
          param1: 'Jane Doe',
          param2: 'jane@example.com',
          param3: 1,
        });
      });

      it('should build UPDATE with RETURNING clause', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const data = { name: 'Updated Name' };

        const query = builder
          .where('id', QueryFilterOperator.EQUALS, 1)
          .buildUpdate(data, ['id', 'updated_at']);

        expect(query.sql).toContain('RETURNING id, updated_at');
      });
    });

    describe('DELETE queries', () => {
      it('should build DELETE query', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('id', QueryFilterOperator.EQUALS, 1)
          .buildDelete();

        expect(query.sql).toBe('DELETE FROM users WHERE id = $param1');
        expect(query.params).toEqual({ param1: 1 });
      });

      it('should build DELETE with multiple conditions', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('status', QueryFilterOperator.EQUALS, 'inactive')
          .where('last_login', QueryFilterOperator.IS_NULL, true)
          .buildDelete();

        expect(query.sql).toContain('status = $param1');
        expect(query.sql).toContain('last_login IS NULL');
      });

      it('should build DELETE with RETURNING clause', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const query = builder
          .where('id', QueryFilterOperator.EQUALS, 1)
          .buildDelete(['id', 'name']);

        expect(query.sql).toContain('RETURNING id, name');
      });
    });

    describe('Builder state management', () => {
      it('should reset builder state', () => {
        const builder = new QueryBuilder('users', 'postgresql');

        builder
          .where('status', QueryFilterOperator.EQUALS, 'active')
          .orderBy('name', 'ASC')
          .paginate({ page: 1, limit: 10 });

        const query1 = builder.buildSelect();
        expect(query1.sql).toContain('WHERE');
        expect(query1.sql).toContain('ORDER BY');
        expect(query1.sql).toContain('LIMIT');

        builder.reset();
        const query2 = builder.buildSelect();
        expect(query2.sql).toBe('SELECT * FROM users');
      });

      it('should allow method chaining', () => {
        const builder = new QueryBuilder('users', 'postgresql', 'u');

        const query = builder
          .select(['u.id', 'u.name'])
          .where('u.status', QueryFilterOperator.EQUALS, 'active')
          .orderBy('u.name', 'ASC')
          .paginate({ page: 1, limit: 10 })
          .buildSelect();

        expect(query.sql).toBeDefined();
      });
    });

    describe('Filter DTO integration', () => {
      it('should handle simple equality filters', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const filterDto = {
          status: 'active',
          role: 'admin',
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain('status = $param1');
        expect(query.sql).toContain('role = $param2');
      });

      it('should skip undefined and null values', () => {
        const builder = new QueryBuilder('users', 'postgresql');
        const filterDto = {
          status: 'active',
          name: undefined,
          email: null,
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain('status = $param1');
        expect(query.sql).not.toContain('name');
        expect(query.sql).not.toContain('email');
      });

      it('should handle all operator types from DTO', () => {
        const builder = new QueryBuilder('products', 'postgresql');
        const filterDto = {
          name_like: 'phone',
          price_gte: 100,
          stock_lte: 50,
          category_in: ['electronics', 'gadgets'],
          discount_between: [10, 30],
          featured_eq: true,
        };

        const query = builder.addFilters(filterDto).buildSelect();

        expect(query.sql).toContain('name LIKE');
        expect(query.sql).toContain('price >=');
        expect(query.sql).toContain('stock <=');
        expect(query.sql).toContain('category IN');
        expect(query.sql).toContain('discount BETWEEN');
        expect(query.sql).toContain('featured =');
      });
    });
  });

  describe('MySQL', () => {
    it('should use MySQL parameter placeholders', () => {
      const builder = new QueryBuilder('users', 'mysql');
      const query = builder
        .where('email', QueryFilterOperator.EQUALS, 'test@example.com')
        .buildSelect();

      expect(query.sql).toBe('SELECT * FROM users WHERE email = :param1');
      expect(query.params).toEqual({ param1: 'test@example.com' });
    });

    it('should not include RETURNING clause in INSERT', () => {
      const builder = new QueryBuilder('users', 'mysql');
      const data = { name: 'John' };

      const query = builder.buildInsert(data, ['id']);

      expect(query.sql).not.toContain('RETURNING');
    });
  });
});

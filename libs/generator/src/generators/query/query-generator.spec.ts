/**
 * Query Generator Tests
 */

import { QueryGenerator } from './query-generator';
import { QueryFilterOperator } from './query-types';
import type {
  SelectQueryOptions,
  InsertQueryOptions,
  UpdateQueryOptions,
  DeleteQueryOptions,
} from './query-types';

describe('QueryGenerator', () => {
  describe('PostgreSQL', () => {
    let generator: QueryGenerator;

    beforeEach(() => {
      generator = new QueryGenerator('postgresql');
    });

    describe('SELECT queries', () => {
      it('should generate simple SELECT query', () => {
        const options: SelectQueryOptions = {
          table: 'users',
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT * FROM users');
        expect(result.params).toEqual({});
      });

      it('should generate SELECT with specific columns', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          columns: ['id', 'name', 'email'],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT id, name, email FROM users');
      });

      it('should generate SELECT with table alias', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          alias: 'u',
          columns: ['u.id', 'u.name'],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT u.id, u.name FROM users u');
      });

      it('should generate SELECT with WHERE equals condition', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'email',
              operator: QueryFilterOperator.EQUALS,
              value: 'test@example.com',
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT * FROM users WHERE email = $param1');
        expect(result.params).toEqual({ param1: 'test@example.com' });
      });

      it('should generate SELECT with multiple WHERE conditions', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'status',
              operator: QueryFilterOperator.EQUALS,
              value: 'active',
            },
            {
              column: 'age',
              operator: QueryFilterOperator.GREATER_THAN,
              value: 18,
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT * FROM users WHERE status = $param1 AND age > $param2',
        );
        expect(result.params).toEqual({ param1: 'active', param2: 18 });
      });

      it('should generate SELECT with LIKE condition', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'name',
              operator: QueryFilterOperator.LIKE,
              value: 'John',
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT * FROM users WHERE name LIKE $param1');
        expect(result.params).toEqual({ param1: '%John%' });
      });

      it('should generate SELECT with IN condition', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'status',
              operator: QueryFilterOperator.IN,
              value: ['active', 'pending', 'suspended'],
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT * FROM users WHERE status IN ($param1_0, $param1_1, $param1_2)',
        );
        expect(result.params).toEqual({
          param1_0: 'active',
          param1_1: 'pending',
          param1_2: 'suspended',
        });
      });

      it('should generate SELECT with BETWEEN condition', () => {
        const options: SelectQueryOptions = {
          table: 'products',
          where: [
            {
              column: 'price',
              operator: QueryFilterOperator.BETWEEN,
              value: [100, 500],
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT * FROM products WHERE price BETWEEN $param1_start AND $param1_end',
        );
        expect(result.params).toEqual({
          param1_start: 100,
          param1_end: 500,
        });
      });

      it('should generate SELECT with IS NULL condition', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'deleted_at',
              operator: QueryFilterOperator.IS_NULL,
              value: true,
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT * FROM users WHERE deleted_at IS NULL');
      });

      it('should generate SELECT with IS NOT NULL condition', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'email_verified_at',
              operator: QueryFilterOperator.IS_NULL,
              value: false,
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT * FROM users WHERE email_verified_at IS NOT NULL',
        );
      });

      it('should generate SELECT with JOIN', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          alias: 'u',
          columns: ['u.id', 'u.name', 'p.title'],
          joins: [
            {
              type: 'INNER',
              table: 'posts',
              alias: 'p',
              on: {
                left: 'u.id',
                right: 'p.user_id',
              },
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT u.id, u.name, p.title FROM users u INNER JOIN posts p ON u.id = p.user_id',
        );
      });

      it('should generate SELECT with multiple JOINs', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          alias: 'u',
          joins: [
            {
              type: 'LEFT',
              table: 'posts',
              alias: 'p',
              on: {
                left: 'u.id',
                right: 'p.user_id',
              },
            },
            {
              type: 'LEFT',
              table: 'comments',
              alias: 'c',
              on: {
                left: 'p.id',
                right: 'c.post_id',
              },
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toContain('LEFT JOIN posts p ON u.id = p.user_id');
        expect(result.sql).toContain(
          'LEFT JOIN comments c ON p.id = c.post_id',
        );
      });

      it('should generate SELECT with ORDER BY', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          orderBy: [
            { column: 'created_at', order: 'DESC' },
            { column: 'name', order: 'ASC' },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT * FROM users ORDER BY created_at DESC, name ASC',
        );
      });

      it('should generate SELECT with pagination', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          pagination: {
            page: 2,
            limit: 10,
          },
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe('SELECT * FROM users LIMIT 10 OFFSET 10');
      });

      it('should generate SELECT with GROUP BY', () => {
        const options: SelectQueryOptions = {
          table: 'orders',
          columns: ['user_id', 'COUNT(*) as order_count'],
          groupBy: ['user_id'],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toBe(
          'SELECT user_id, COUNT(*) as order_count FROM orders GROUP BY user_id',
        );
      });

      it('should generate SELECT with HAVING', () => {
        const options: SelectQueryOptions = {
          table: 'orders',
          columns: ['user_id', 'COUNT(*) as order_count'],
          groupBy: ['user_id'],
          having: [
            {
              column: 'COUNT(*)',
              operator: QueryFilterOperator.GREATER_THAN,
              value: 5,
            },
          ],
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toContain('GROUP BY user_id');
        expect(result.sql).toContain('HAVING COUNT(*) > $param1');
      });

      it('should generate complex SELECT with all features', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          alias: 'u',
          columns: ['u.id', 'u.name', 'COUNT(p.id) as post_count'],
          joins: [
            {
              type: 'LEFT',
              table: 'posts',
              alias: 'p',
              on: {
                left: 'u.id',
                right: 'p.user_id',
              },
            },
          ],
          where: [
            {
              column: 'u.status',
              operator: QueryFilterOperator.EQUALS,
              value: 'active',
            },
          ],
          groupBy: ['u.id', 'u.name'],
          having: [
            {
              column: 'COUNT(p.id)',
              operator: QueryFilterOperator.GREATER_THAN,
              value: 0,
            },
          ],
          orderBy: [{ column: 'post_count', order: 'DESC' }],
          pagination: { page: 1, limit: 20 },
        };

        const result = generator.generateSelect(options);

        expect(result.sql).toContain('SELECT u.id, u.name, COUNT(p.id)');
        expect(result.sql).toContain('LEFT JOIN posts p');
        expect(result.sql).toContain('WHERE u.status = $param1');
        expect(result.sql).toContain('GROUP BY u.id, u.name');
        expect(result.sql).toContain('HAVING COUNT(p.id) > $param2');
        expect(result.sql).toContain('ORDER BY post_count DESC');
        expect(result.sql).toContain('LIMIT 20 OFFSET 0');
      });
    });

    describe('INSERT queries', () => {
      it('should generate INSERT query', () => {
        const options: InsertQueryOptions = {
          table: 'users',
          columns: ['name', 'email', 'age'],
          values: ['John Doe', 'john@example.com', 30],
        };

        const result = generator.generateInsert(options);

        expect(result.sql).toBe(
          'INSERT INTO users (name, email, age) VALUES ($param1, $param2, $param3)',
        );
        expect(result.params).toEqual({
          param1: 'John Doe',
          param2: 'john@example.com',
          param3: 30,
        });
      });

      it('should generate INSERT with RETURNING clause', () => {
        const options: InsertQueryOptions = {
          table: 'users',
          columns: ['name', 'email'],
          values: ['John Doe', 'john@example.com'],
          returning: ['id', 'created_at'],
        };

        const result = generator.generateInsert(options);

        expect(result.sql).toBe(
          'INSERT INTO users (name, email) VALUES ($param1, $param2) RETURNING id, created_at',
        );
      });
    });

    describe('UPDATE queries', () => {
      it('should generate UPDATE query', () => {
        const options: UpdateQueryOptions = {
          table: 'users',
          columns: ['name', 'email'],
          values: ['Jane Doe', 'jane@example.com'],
          where: [
            {
              column: 'id',
              operator: QueryFilterOperator.EQUALS,
              value: 1,
            },
          ],
        };

        const result = generator.generateUpdate(options);

        expect(result.sql).toBe(
          'UPDATE users SET name = $param1, email = $param2 WHERE id = $param3',
        );
        expect(result.params).toEqual({
          param1: 'Jane Doe',
          param2: 'jane@example.com',
          param3: 1,
        });
      });

      it('should generate UPDATE with RETURNING clause', () => {
        const options: UpdateQueryOptions = {
          table: 'users',
          columns: ['name'],
          values: ['Updated Name'],
          where: [
            {
              column: 'id',
              operator: QueryFilterOperator.EQUALS,
              value: 1,
            },
          ],
          returning: ['id', 'updated_at'],
        };

        const result = generator.generateUpdate(options);

        expect(result.sql).toContain('RETURNING id, updated_at');
      });
    });

    describe('DELETE queries', () => {
      it('should generate DELETE query', () => {
        const options: DeleteQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'id',
              operator: QueryFilterOperator.EQUALS,
              value: 1,
            },
          ],
        };

        const result = generator.generateDelete(options);

        expect(result.sql).toBe('DELETE FROM users WHERE id = $param1');
        expect(result.params).toEqual({ param1: 1 });
      });

      it('should generate DELETE with multiple conditions', () => {
        const options: DeleteQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'status',
              operator: QueryFilterOperator.EQUALS,
              value: 'inactive',
            },
            {
              column: 'last_login',
              operator: QueryFilterOperator.IS_NULL,
              value: true,
            },
          ],
        };

        const result = generator.generateDelete(options);

        expect(result.sql).toBe(
          'DELETE FROM users WHERE status = $param1 AND last_login IS NULL',
        );
      });

      it('should generate DELETE with RETURNING clause', () => {
        const options: DeleteQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'id',
              operator: QueryFilterOperator.EQUALS,
              value: 1,
            },
          ],
          returning: ['id', 'name'],
        };

        const result = generator.generateDelete(options);

        expect(result.sql).toContain('RETURNING id, name');
      });
    });

    describe('COUNT queries', () => {
      it('should generate count query', () => {
        const options: SelectQueryOptions = {
          table: 'users',
          where: [
            {
              column: 'status',
              operator: QueryFilterOperator.EQUALS,
              value: 'active',
            },
          ],
        };

        const result = generator.generateCount(options);

        expect(result.sql).toBe(
          'SELECT COUNT(*) as total FROM users WHERE status = $param1',
        );
        expect(result.params).toEqual({ param1: 'active' });
      });
    });
  });

  describe('MySQL', () => {
    let generator: QueryGenerator;

    beforeEach(() => {
      generator = new QueryGenerator('mysql');
    });

    it('should use MySQL parameter placeholders', () => {
      const options: SelectQueryOptions = {
        table: 'users',
        where: [
          {
            column: 'email',
            operator: QueryFilterOperator.EQUALS,
            value: 'test@example.com',
          },
        ],
      };

      const result = generator.generateSelect(options);

      expect(result.sql).toBe('SELECT * FROM users WHERE email = :param1');
      expect(result.params).toEqual({ param1: 'test@example.com' });
    });

    it('should not include RETURNING clause for INSERT', () => {
      const options: InsertQueryOptions = {
        table: 'users',
        columns: ['name'],
        values: ['John'],
        returning: ['id'],
      };

      const result = generator.generateInsert(options);

      expect(result.sql).not.toContain('RETURNING');
      expect(result.sql).toBe('INSERT INTO users (name) VALUES (:param1)');
    });
  });
});

/**
 * Database Dialects Unit Tests
 */

import { PostgresDialect } from './postgres.dialect';
import { MySQLDialect } from './mysql.dialect';
import { DialectFactory } from './index';

describe('PostgresDialect', () => {
  let dialect: PostgresDialect;

  beforeEach(() => {
    dialect = new PostgresDialect();
  });

  describe('quoteIdentifier', () => {
    it('should quote simple identifier', () => {
      expect(dialect.quoteIdentifier('users')).toBe('"users"');
    });

    it('should quote schema.table format', () => {
      expect(dialect.quoteIdentifier('public.users')).toBe('"public"."users"');
    });
  });

  describe('mapDataType', () => {
    it('should map generic string to VARCHAR', () => {
      expect(dialect.mapDataType('string')).toBe('VARCHAR');
    });

    it('should map text to TEXT', () => {
      expect(dialect.mapDataType('text')).toBe('TEXT');
    });

    it('should map integer types', () => {
      expect(dialect.mapDataType('int')).toBe('INTEGER');
      expect(dialect.mapDataType('bigint')).toBe('BIGINT');
    });

    it('should map boolean to BOOLEAN', () => {
      expect(dialect.mapDataType('boolean')).toBe('BOOLEAN');
    });

    it('should map date types', () => {
      expect(dialect.mapDataType('date')).toBe('DATE');
      expect(dialect.mapDataType('timestamp')).toBe('TIMESTAMP');
    });

    it('should map json to JSONB', () => {
      expect(dialect.mapDataType('json')).toBe('JSONB');
    });

    it('should map uuid to UUID', () => {
      expect(dialect.mapDataType('uuid')).toBe('UUID');
    });
  });

  describe('generateUUID', () => {
    it('should return PostgreSQL UUID function', () => {
      expect(dialect.generateUUID()).toBe('uuid_generate_v7()');
    });
  });

  describe('buildPagination', () => {
    it('should build correct LIMIT OFFSET clause', () => {
      expect(dialect.buildPagination(1, 10)).toBe('LIMIT 10 OFFSET 0');
      expect(dialect.buildPagination(2, 10)).toBe('LIMIT 10 OFFSET 10');
      expect(dialect.buildPagination(3, 20)).toBe('LIMIT 20 OFFSET 40');
    });
  });

  describe('buildLike', () => {
    it('should use ILIKE for PostgreSQL', () => {
      expect(dialect.buildLike('name', "'%john%'")).toBe("name ILIKE '%john%'");
    });
  });

  describe('JSON operations', () => {
    it('should extract JSON as text', () => {
      expect(dialect.jsonExtract('data', 'name')).toBe("data->>'name'");
    });
  });

  describe('Array operations', () => {
    it('should check array contains', () => {
      expect(dialect.arrayContains('tags', 'admin')).toBe(
        "tags @> ARRAY['admin']",
      );
    });
  });

  describe('getParameterPlaceholder', () => {
    it('should return numbered placeholders', () => {
      expect(dialect.getParameterPlaceholder(1)).toBe('$1');
      expect(dialect.getParameterPlaceholder(2)).toBe('$2');
      expect(dialect.getParameterPlaceholder(10)).toBe('$10');
    });
  });
});

describe('MySQLDialect', () => {
  let dialect: MySQLDialect;

  beforeEach(() => {
    dialect = new MySQLDialect();
  });

  describe('quoteIdentifier', () => {
    it('should quote simple identifier', () => {
      expect(dialect.quoteIdentifier('users')).toBe('`users`');
    });

    it('should quote schema.table format', () => {
      expect(dialect.quoteIdentifier('mydb.users')).toBe('`mydb`.`users`');
    });
  });

  describe('mapDataType', () => {
    it('should map generic string to VARCHAR', () => {
      expect(dialect.mapDataType('string')).toBe('VARCHAR');
    });

    it('should map integer types', () => {
      expect(dialect.mapDataType('int')).toBe('INT');
      expect(dialect.mapDataType('bigint')).toBe('BIGINT');
    });

    it('should map boolean to TINYINT(1)', () => {
      expect(dialect.mapDataType('boolean')).toBe('TINYINT(1)');
    });

    it('should map datetime to DATETIME', () => {
      expect(dialect.mapDataType('datetime')).toBe('DATETIME');
    });

    it('should map json to JSON', () => {
      expect(dialect.mapDataType('json')).toBe('JSON');
    });

    it('should map uuid to CHAR(36)', () => {
      expect(dialect.mapDataType('uuid')).toBe('CHAR(36)');
    });
  });

  describe('generateUUID', () => {
    it('should return MySQL UUID function', () => {
      expect(dialect.generateUUID()).toBe('UUID()');
    });
  });

  describe('buildPagination', () => {
    it('should build correct LIMIT OFFSET clause', () => {
      expect(dialect.buildPagination(1, 10)).toBe('LIMIT 10 OFFSET 0');
      expect(dialect.buildPagination(2, 10)).toBe('LIMIT 10 OFFSET 10');
    });
  });

  describe('buildLike', () => {
    it('should use LOWER with LIKE for case-insensitive', () => {
      expect(dialect.buildLike('name', "'%john%'")).toBe(
        "LOWER(name) LIKE LOWER('%john%')",
      );
    });
  });

  describe('JSON operations', () => {
    it('should extract JSON as text', () => {
      expect(dialect.jsonExtract('data', 'name')).toBe(
        "JSON_UNQUOTE(JSON_EXTRACT(data, '$.name'))",
      );
    });
  });

  describe('Array operations', () => {
    it('should check array contains with JSON', () => {
      expect(dialect.arrayContains('tags', 'admin')).toBe(
        'JSON_CONTAINS(tags, \'"admin"\')',
      );
    });
  });

  describe('getParameterPlaceholder', () => {
    it('should always return ?', () => {
      expect(dialect.getParameterPlaceholder(1)).toBe('?');
      expect(dialect.getParameterPlaceholder(2)).toBe('?');
      expect(dialect.getParameterPlaceholder(10)).toBe('?');
    });
  });
});

describe('DialectFactory', () => {
  it('should create PostgreSQL dialect', () => {
    const dialect = DialectFactory.create('postgresql');
    expect(dialect).toBeInstanceOf(PostgresDialect);
  });

  it('should create MySQL dialect', () => {
    const dialect = DialectFactory.create('mysql');
    expect(dialect).toBeInstanceOf(MySQLDialect);
  });

  it('should create dialect from config', () => {
    const pgDialect = DialectFactory.fromConfig({ type: 'postgresql' });
    expect(pgDialect).toBeInstanceOf(PostgresDialect);

    const mysqlDialect = DialectFactory.fromConfig({ type: 'mysql' });
    expect(mysqlDialect).toBeInstanceOf(MySQLDialect);
  });
});

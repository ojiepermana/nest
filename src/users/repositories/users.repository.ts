import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateUsersDto } from '../dto/create-users.dto';
import { UpdateUsersDto } from '../dto/update-users.dto';
import { UsersFilterDto } from '../dto/users-filter.dto';

@Injectable()
export class UsersRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new users
   */
  async create(dto: CreateUsersDto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "user"."users" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all userss
   */
  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM "user"."users" ORDER BY id`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one users by ID
   */
  async findOne(id: string): Promise<any | null> {
    const query = `SELECT * FROM "user"."users" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find userss with filters
   */
  async findWithFilters(filter: UsersFilterDto): Promise<any[]> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions from filter
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    const query = `SELECT * FROM "user"."users" ${whereClause} ORDER BY id`;
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update users
   */
  async update(id: string, dto: UpdateUsersDto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = `
      UPDATE "user"."users"
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete users
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM "user"."users" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count userss
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "user"."users"`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if users exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM "user"."users" WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

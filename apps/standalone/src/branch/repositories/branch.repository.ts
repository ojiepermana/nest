import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateBranchDto } from '../dto/branch/create-branch.dto';
import { UpdateBranchDto } from '../dto/branch/update-branch.dto';
import { BranchFilterDto } from '../dto/branch/branch-filter.dto';

@Injectable()
export class BranchRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new branch
   */
  async create(dto: CreateBranchDto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "company"."branch" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all branchs
   */
  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM "company"."branch" ORDER BY id`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one branch by ID
   */
  async findOne(id: string): Promise<any | null> {
    const query = `SELECT * FROM "company"."branch" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find branchs with filters
   */
  async findWithFilters(
    filter: BranchFilterDto,
    options?: { page?: number; limit?: number; sort?: Array<{ field: string; order: 'ASC' | 'DESC' }> },
  ): Promise<{ data: any[]; total: number }> {
    const conditions: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    // Build WHERE conditions from filter (skip pagination fields)
    const paginationFields = ['page', 'limit', 'sort'];
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && !paginationFields.includes(key)) {
        conditions.push(`${key} = $${paramIndex}`);
        values.push(value);
        paramIndex++;
      }
    });

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';
    
    // Get total count
    const countQuery = `SELECT COUNT(*) as total FROM "company"."branch" ${whereClause}`;
    const countResult = await this.pool.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total, 10);

    // Build ORDER BY clause
    let orderByClause = `ORDER BY id`;
    if (options?.sort && options.sort.length > 0) {
      const sortClauses = options.sort.map(s => `${s.field} ${s.order}`).join(', ');
      orderByClause = `ORDER BY ${sortClauses}`;
    }

    // Build pagination
    const page = options?.page || 1;
    const limit = Math.min(options?.limit || 20, 100); // Max 100 items per page
    const offset = (page - 1) * limit;

    // Get paginated data
    const dataQuery = `SELECT * FROM "company"."branch" ${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataValues = [...values, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Update branch
   */
  async update(id: string, dto: UpdateBranchDto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = `
      UPDATE "company"."branch"
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete branch
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM "company"."branch" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count branchs
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "company"."branch"`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if branch exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM "company"."branch" WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

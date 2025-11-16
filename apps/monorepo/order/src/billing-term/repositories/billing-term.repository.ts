import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateBillingTermDto } from '../dto/billing-term/create-billing-term.dto';
import { UpdateBillingTermDto } from '../dto/billing-term/update-billing-term.dto';
import { BillingTermFilterDto } from '../dto/billing-term/billing-term-filter.dto';

@Injectable()
export class BillingTermRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new billingterm
   */
  async create(dto: CreateBillingTermDto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "contract"."billing_term" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all billingterms
   */
  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM "contract"."billing_term" ORDER BY id`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one billingterm by ID
   */
  async findOne(id: string): Promise<any | null> {
    const query = `SELECT * FROM "contract"."billing_term" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find billingterms with filters
   */
  async findWithFilters(
    filter: BillingTermFilterDto,
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
    const countQuery = `SELECT COUNT(*) as total FROM "contract"."billing_term" ${whereClause}`;
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
    const dataQuery = `SELECT * FROM "contract"."billing_term" ${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataValues = [...values, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Update billingterm
   */
  async update(id: string, dto: UpdateBillingTermDto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = `
      UPDATE "contract"."billing_term"
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete billingterm
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM "contract"."billing_term" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count billingterms
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "contract"."billing_term"`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if billingterm exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM "contract"."billing_term" WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateLocationTypeDto } from '../dto/location-type/create-location-type.dto';
import { UpdateLocationTypeDto } from '../dto/location-type/update-location-type.dto';
import { LocationTypeFilterDto } from '../dto/location-type/location-type-filter.dto';

@Injectable()
export class LocationTypeRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new locationtype
   */
  async create(dto: CreateLocationTypeDto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "entity"."location_type" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all locationtypes
   */
  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM "entity"."location_type" ORDER BY id`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one locationtype by ID
   */
  async findOne(id: string): Promise<any | null> {
    const query = `SELECT * FROM "entity"."location_type" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find locationtypes with filters
   */
  async findWithFilters(
    filter: LocationTypeFilterDto,
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
    const countQuery = `SELECT COUNT(*) as total FROM "entity"."location_type" ${whereClause}`;
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
    const dataQuery = `SELECT * FROM "entity"."location_type" ${whereClause} ${orderByClause} LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    const dataValues = [...values, limit, offset];
    const dataResult = await this.pool.query(dataQuery, dataValues);

    return {
      data: dataResult.rows,
      total,
    };
  }

  /**
   * Update locationtype
   */
  async update(id: string, dto: UpdateLocationTypeDto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = `
      UPDATE "entity"."location_type"
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete locationtype
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM "entity"."location_type" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count locationtypes
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "entity"."location_type"`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if locationtype exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM "entity"."location_type" WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

import { Injectable, Inject } from '@nestjs/common';
import { Pool } from 'pg';
import { CreateEntityDto } from '../dto/create-entity.dto';
import { UpdateEntityDto } from '../dto/update-entity.dto';
import { EntityFilterDto } from '../dto/entity-filter.dto';

@Injectable()
export class EntityRepository {
  constructor(@Inject('DATABASE_POOL') private readonly pool: Pool) {}

  /**
   * Create a new entity
   */
  async create(dto: CreateEntityDto): Promise<any> {
    const columns = Object.keys(dto);
    const values = Object.values(dto);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');
    
    const query = `
      INSERT INTO "entity"."entity" (${columns.join(', ')})
      VALUES (${placeholders})
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0];
  }

  /**
   * Find all entitys
   */
  async findAll(): Promise<any[]> {
    const query = `SELECT * FROM "entity"."entity" ORDER BY id`;
    const result = await this.pool.query(query);
    return result.rows;
  }

  /**
   * Find one entity by ID
   */
  async findOne(id: string): Promise<any | null> {
    const query = `SELECT * FROM "entity"."entity" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return result.rows[0] || null;
  }

  /**
   * Find entitys with filters
   */
  async findWithFilters(filter: EntityFilterDto): Promise<any[]> {
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
    const query = `SELECT * FROM "entity"."entity" ${whereClause} ORDER BY id`;
    
    const result = await this.pool.query(query, values);
    return result.rows;
  }

  /**
   * Update entity
   */
  async update(id: string, dto: UpdateEntityDto): Promise<any | null> {
    const entries = Object.entries(dto).filter(([_, value]) => value !== undefined);
    if (entries.length === 0) return this.findOne(id);

    const setClauses = entries.map(([key], i) => `${key} = $${i + 1}`).join(', ');
    const values = [...entries.map(([_, value]) => value), id];
    
    const query = `
      UPDATE "entity"."entity"
      SET ${setClauses}
      WHERE id = $${values.length}
      RETURNING *
    `;
    
    const result = await this.pool.query(query, values);
    return result.rows[0] || null;
  }

  /**
   * Delete entity
   */
  async delete(id: string): Promise<boolean> {
    const query = `DELETE FROM "entity"."entity" WHERE id = $1`;
    const result = await this.pool.query(query, [id]);
    return (result.rowCount ?? 0) > 0;
  }

  /**
   * Count entitys
   */
  async count(): Promise<number> {
    const query = `SELECT COUNT(*) as count FROM "entity"."entity"`;
    const result = await this.pool.query(query);
    return parseInt(result.rows[0].count, 10);
  }

  /**
   * Check if entity exists
   */
  async exists(id: string): Promise<boolean> {
    const query = `SELECT 1 FROM "entity"."entity" WHERE id = $1 LIMIT 1`;
    const result = await this.pool.query(query, [id]);
    return result.rows.length > 0;
  }
}

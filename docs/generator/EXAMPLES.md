# Real-World Examples

Practical examples using **@ojiepermana/nest-generator** for common use cases.

## Table of Contents

- [Blog Platform](#blog-platform)
- [E-Commerce](#e-commerce)
- [SaaS Multi-Tenant](#saas-multi-tenant)
- [Healthcare System](#healthcare-system)
- [Social Media](#social-media)

---

## Blog Platform

Complete blog with posts, comments, tags, and user management.

### Metadata Setup

```sql
-- Tables: users, posts, comments, tags, post_tags

-- Users
INSERT INTO meta.table_metadata (schema_name, table_name, has_soft_delete, cache_enabled)
VALUES ('blog', 'users', true, true);

INSERT INTO meta.column_metadata (table_metadata_id, column_name, data_type, is_required, is_filterable)
VALUES
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'id', 'uuid', true, false),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'username', 'varchar', true, true),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'email', 'varchar', true, true),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'role', 'varchar', true, true);

-- Posts with file upload
INSERT INTO meta.table_metadata (schema_name, table_name, has_soft_delete, cache_enabled)
VALUES ('blog', 'posts', true, true);

INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type, is_file_upload, file_upload_config
) VALUES (
  (SELECT id FROM meta.table_metadata WHERE table_name = 'posts'),
  'featured_image',
  'varchar',
  true,
  '{"maxSize": 5242880, "mimeTypes": ["image/jpeg", "image/png"], "storage": "s3"}'::jsonb
);

-- Foreign key: posts.user_id → users.id
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type, ref_schema, ref_table, ref_column
) VALUES (
  (SELECT id FROM meta.table_metadata WHERE table_name = 'posts'),
  'user_id',
  'uuid',
  'blog',
  'users',
  'id'
);
```

### Generate Modules

```bash
nest-generator generate blog.users --features.rbac=true --features.audit=true
nest-generator generate blog.posts --features.fileUpload=true --storageProvider=s3
nest-generator generate blog.comments
nest-generator generate blog.tags
```

### Custom Business Logic

```typescript
// src/modules/posts/posts.service.ts
export class PostsService {
  // <generator:methods>
  // Generated CRUD methods
  // </generator:methods>

  // <custom:methods>
  async publish(id: string, userId: string) {
    const post = await this.findOne(id);
    
    // Check ownership or admin
    const isOwner = post.user_id === userId;
    const isAdmin = await this.rbacService.hasRole(userId, 'admin');
    
    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('Cannot publish this post');
    }

    return this.repository.update(id, { status: 'published', published_at: new Date() });
  }

  async getPopularPosts(limit = 10) {
    return this.repository.query(`
      SELECT p.*, COUNT(c.id) as comment_count
      FROM blog.posts p
      LEFT JOIN blog.comments c ON p.id = c.post_id
      WHERE p.status = 'published'
      GROUP BY p.id
      ORDER BY comment_count DESC
      LIMIT $1
    `, [limit]);
  }
  // </custom:methods>
}
```

---

## E-Commerce

Online store with products, orders, payments, and inventory.

### Metadata Setup

```sql
-- Products with multiple images
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type, is_file_upload, file_upload_config
) VALUES (
  (SELECT id FROM meta.table_metadata WHERE table_name = 'products'),
  'images',
  'varchar[]',
  true,
  '{"maxSize": 10485760, "maxCount": 5, "storage": "s3"}'::jsonb
);

-- Inventory tracking
INSERT INTO meta.table_metadata (schema_name, table_name, table_purpose)
VALUES ('shop', 'inventory', 'Real-time stock tracking with alerts');

-- Orders with audit trail
INSERT INTO meta.table_metadata (schema_name, table_name, cache_enabled)
VALUES ('shop', 'orders', false);  -- Don't cache orders!
```

### Generate Modules

```bash
nest-generator generate shop.products --features.fileUpload=true
nest-generator generate shop.orders --features.audit=true
nest-generator generate shop.payments --features.audit=true
nest-generator generate shop.inventory
```

### Custom Logic: Stock Management

```typescript
// src/modules/inventory/inventory.service.ts
@Injectable()
export class InventoryService {
  async reserveStock(productId: string, quantity: number, orderId: string) {
    const inventory = await this.findByProduct(productId);
    
    if (inventory.available_quantity < quantity) {
      throw new BadRequestException('Insufficient stock');
    }

    // Atomic update
    await this.repository.query(`
      UPDATE shop.inventory
      SET available_quantity = available_quantity - $1,
          reserved_quantity = reserved_quantity + $1,
          updated_at = NOW()
      WHERE product_id = $2 AND available_quantity >= $1
      RETURNING *
    `, [quantity, productId]);

    // Log for audit
    await this.auditLog.log({
      entityType: 'inventory.reservation',
      entityId: productId,
      action: 'RESERVE',
      metadata: { quantity, orderId },
    });
  }

  async releaseStock(productId: string, quantity: number, orderId: string) {
    await this.repository.query(`
      UPDATE shop.inventory
      SET reserved_quantity = reserved_quantity - $1,
          available_quantity = available_quantity + $1
      WHERE product_id = $2
    `, [quantity, productId]);
  }
}
```

---

## SaaS Multi-Tenant

Multi-tenant application with tenant isolation.

### Metadata Setup

```sql
-- Add tenant_id to all tables
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type, is_required, is_filterable
) SELECT
  id,
  'tenant_id',
  'uuid',
  true,
  true
FROM meta.table_metadata
WHERE schema_name = 'saas';

-- Row-level security
CREATE POLICY tenant_isolation ON saas.users
  USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### Tenant Middleware

```typescript
// src/middleware/tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const tenantId = req.headers['x-tenant-id'] as string;
    
    if (!tenantId) {
      throw new BadRequestException('Tenant ID required');
    }

    // Set tenant context
    req['tenantId'] = tenantId;
    next();
  }
}

// Apply to all routes
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*');
  }
}
```

### Tenant-Aware Repository

```typescript
@Injectable()
export class UsersRepository {
  async findAll(tenantId: string, filters: any) {
    return this.pool.query(`
      SELECT * FROM saas.users
      WHERE tenant_id = $1
        AND deleted_at IS NULL
    `, [tenantId]);
  }

  async create(data: any, tenantId: string) {
    return this.pool.query(`
      INSERT INTO saas.users (tenant_id, ...)
      VALUES ($1, ...)
      RETURNING *
    `, [tenantId, ...]);
  }
}
```

---

## Healthcare System

HIPAA-compliant patient management system.

### Metadata Setup

```sql
-- Sensitive data fields
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  validation_rules
) VALUES (
  (SELECT id FROM meta.table_metadata WHERE table_name = 'patients'),
  'ssn',
  'varchar',
  '{"encrypted": true, "pii": true, "hipaa": true}'::jsonb
);

-- Audit all patient access
INSERT INTO meta.table_metadata (schema_name, table_name, cache_enabled)
VALUES ('healthcare', 'patients', false);  -- Never cache patient data!
```

### Generate with Full Audit

```bash
nest-generator generate healthcare.patients --features.audit=true --features.rbac=true
nest-generator generate healthcare.appointments --features.audit=true
nest-generator generate healthcare.medical_records --features.audit=true --features.fileUpload=true
```

### Encryption Service

```typescript
import * as crypto from 'crypto';

@Injectable()
export class EncryptionService {
  private algorithm = 'aes-256-gcm';
  private key = Buffer.from(process.env.ENCRYPTION_KEY, 'hex');

  encrypt(text: string): { encrypted: string; iv: string; tag: string } {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(this.algorithm, this.key, iv);
    
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    return {
      encrypted,
      iv: iv.toString('hex'),
      tag: cipher.getAuthTag().toString('hex'),
    };
  }

  decrypt(encrypted: string, iv: string, tag: string): string {
    const decipher = crypto.createDecipheriv(
      this.algorithm,
      this.key,
      Buffer.from(iv, 'hex')
    );
    decipher.setAuthTag(Buffer.from(tag, 'hex'));
    
    let decrypted = decipher.update(encrypted, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    
    return decrypted;
  }
}
```

---

## Social Media

Social platform with posts, follows, likes, and real-time feeds.

### Metadata Setup

```sql
-- Self-referencing relationship (followers)
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type, ref_schema, ref_table, ref_column
) VALUES
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'follows'), 'follower_id', 'uuid', 'social', 'users', 'id'),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'follows'), 'following_id', 'uuid', 'social', 'users', 'id');

-- Posts with media
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, is_file_upload, file_upload_config
) VALUES (
  (SELECT id FROM meta.table_metadata WHERE table_name = 'posts'),
  'media',
  true,
  '{"maxSize": 52428800, "maxCount": 10, "mimeTypes": ["image/*", "video/*"]}'::jsonb
);
```

### Generate Modules

```bash
nest-generator generate social.users
nest-generator generate social.posts --features.fileUpload=true --storageProvider=s3
nest-generator generate social.follows
nest-generator generate social.likes
nest-generator generate social.comments
```

### Custom: News Feed

```typescript
@Injectable()
export class FeedService {
  async getUserFeed(userId: string, page = 1, limit = 20) {
    const offset = (page - 1) * limit;

    // Get posts from followed users + own posts
    return this.pool.query(`
      WITH following AS (
        SELECT following_id FROM social.follows WHERE follower_id = $1
      )
      SELECT
        p.*,
        u.username,
        u.avatar_url,
        COUNT(DISTINCT l.id) as like_count,
        COUNT(DISTINCT c.id) as comment_count,
        EXISTS(
          SELECT 1 FROM social.likes
          WHERE post_id = p.id AND user_id = $1
        ) as user_liked
      FROM social.posts p
      JOIN social.users u ON p.user_id = u.id
      LEFT JOIN social.likes l ON p.id = l.post_id
      LEFT JOIN social.comments c ON p.id = c.post_id
      WHERE p.user_id IN (SELECT following_id FROM following)
         OR p.user_id = $1
      GROUP BY p.id, u.id
      ORDER BY p.created_at DESC
      LIMIT $2 OFFSET $3
    `, [userId, limit, offset]);
  }

  async getTrendingPosts(hours = 24, limit = 10) {
    return this.pool.query(`
      SELECT
        p.*,
        COUNT(l.id) as engagement_score
      FROM social.posts p
      LEFT JOIN social.likes l ON p.id = l.post_id
      WHERE p.created_at > NOW() - INTERVAL '${hours} hours'
      GROUP BY p.id
      ORDER BY engagement_score DESC
      LIMIT $1
    `, [limit]);
  }
}
```

---

## More Examples

- **Full code**: Check [GitHub examples](https://github.com/ojiepermana/nest/tree/main/examples)
- **Video tutorials**: Coming soon
- **Templates**: Starter templates for common use cases

**Need help?** [Open an issue](https://github.com/ojiepermana/nest/issues)

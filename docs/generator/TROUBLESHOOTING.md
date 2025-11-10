# Troubleshooting Guide

Common issues and solutions when using **@ojiepermana/nest-generator**.

## Table of Contents

- [Installation Issues](#installation-issues)
- [Code Generation Issues](#code-generation-issues)
- [Database Issues](#database-issues)
- [Runtime Errors](#runtime-errors)
- [Feature-Specific Issues](#feature-specific-issues)
- [Performance Issues](#performance-issues)
- [Deployment Issues](#deployment-issues)

---

## Installation Issues

### ❌ npm install fails with "ERESOLVE unable to resolve dependency tree"

**Cause:** Peer dependency conflicts with NestJS version.

**Solution:**

```bash
# Use --legacy-peer-deps
npm install @ojiepermana/nest-generator --legacy-peer-deps

# Or use --force
npm install @ojiepermana/nest-generator --force

# Or upgrade NestJS to v11+
npm install @nestjs/core@^11.0.0 @nestjs/common@^11.0.0
```

### ❌ Warning: "Node.js version not compatible"

**Cause:** Node.js version < 24.0.0.

**Solution:**

```bash
# Install Node.js 24 with nvm
nvm install 24
nvm use 24

# Or download from nodejs.org
https://nodejs.org/en/download/
```

### ❌ Error: "npm version too old"

**Cause:** npm version < 11.0.0.

**Solution:**

```bash
# Update npm
npm install -g npm@latest

# Verify version
npm --version  # Should be >= 11.0.0
```

### ❌ PostgreSQL client not found

**Cause:** `pg` package not installed.

**Solution:**

```bash
npm install pg
```

### ❌ MySQL client not found

**Cause:** `mysql2` package not installed.

**Solution:**

```bash
npm install mysql2
```

---

## Code Generation Issues

### ❌ nest-generator: command not found

**Cause:** Package not installed globally or npm bin not in PATH.

**Solution:**

```bash
# Use npx
npx nest-generator generate users.profile

# Or install globally
npm install -g @ojiepermana/nest-generator
nest-generator generate users.profile

# Or add to package.json scripts
{
  "scripts": {
    "generate": "nest-generator generate"
  }
}
npm run generate users.profile
```

### ❌ Error: "Metadata not found for table"

**Cause:** Table not registered in `meta.table_metadata`.

**Solution:**

```sql
-- Check if table exists in metadata
SELECT * FROM meta.table_metadata 
WHERE schema_name = 'public' AND table_name = 'users';

-- If not found, add it
INSERT INTO meta.table_metadata (schema_name, table_name)
VALUES ('public', 'users');
```

### ❌ Error: "No columns found"

**Cause:** No column metadata defined.

**Solution:**

```sql
-- Add column metadata
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required
) VALUES
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'id', 'uuid', true),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'name', 'varchar', true);
```

### ❌ Generated code has TypeScript errors

**Cause:** Invalid metadata configuration or template issue.

**Solution:**

```bash
# Check TypeScript version (should be >= 5.0)
npm list typescript

# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Run build to see errors
npm run build
```

### ❌ Module already exists

**Cause:** Attempting to regenerate existing module.

**Solution:**

```bash
# Delete existing module first
rm -rf src/modules/users-profile

# Or use --force flag (if supported)
nest-generator generate users.profile --force

# Or use sync command to update
nest-generator sync users.profile
```

---

## Database Issues

### ❌ Connection refused / ECONNREFUSED

**Cause:** Database server not running or wrong connection details.

**Solution:**

```bash
# Check database is running
# PostgreSQL
pg_isready -h localhost -p 5432

# MySQL
mysqladmin -h localhost -p 3306 ping

# Verify connection details in .env
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=your_password
DB_DATABASE=myapp
```

### ❌ Authentication failed for user

**Cause:** Wrong username/password.

**Solution:**

```bash
# PostgreSQL: Reset password
sudo -u postgres psql
ALTER USER postgres WITH PASSWORD 'new_password';

# MySQL: Reset password
mysql -u root -p
ALTER USER 'root'@'localhost' IDENTIFIED BY 'new_password';

# Update .env
DB_PASSWORD=new_password
```

### ❌ Database does not exist

**Cause:** Database not created.

**Solution:**

```bash
# PostgreSQL
createdb myapp

# Or in psql
CREATE DATABASE myapp;

# MySQL
mysql -u root -p
CREATE DATABASE myapp;
```

### ❌ Permission denied for schema

**Cause:** User doesn't have permission on schema.

**Solution:**

```sql
-- PostgreSQL
GRANT ALL ON SCHEMA meta TO your_user;
GRANT ALL ON ALL TABLES IN SCHEMA meta TO your_user;

-- MySQL
GRANT ALL PRIVILEGES ON myapp.* TO 'your_user'@'localhost';
FLUSH PRIVILEGES;
```

### ❌ Metadata schema not found

**Cause:** Generator metadata tables not created.

**Solution:**

```bash
# Run init command
nest-generator init

# Or manually create schema
psql -U postgres -d myapp -f node_modules/@ojiepermana/nest-generator/schemas/postgresql.sql
```

---

## Runtime Errors

### ❌ Cannot find module '@nestjs/...'

**Cause:** NestJS dependencies not installed.

**Solution:**

```bash
npm install @nestjs/core @nestjs/common @nestjs/platform-express
```

### ❌ Circular dependency detected

**Cause:** Module imports create circular reference.

**Solution:**

```typescript
// Use forwardRef
import { Module, forwardRef } from '@nestjs/common';

@Module({
  imports: [forwardRef(() => OtherModule)],
})
export class MyModule {}
```

### ❌ ValidationPipe errors not working

**Cause:** class-validator decorators not applied or ValidationPipe not configured.

**Solution:**

```typescript
// In main.ts
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,
    forbidNonWhitelisted: true,
    transform: true,
  }));
  
  await app.listen(3000);
}
```

### ❌ CORS errors

**Cause:** CORS not enabled.

**Solution:**

```typescript
// In main.ts
app.enableCors({
  origin: ['http://localhost:3000', 'https://yourdomain.com'],
  credentials: true,
});
```

### ❌ 404 Not Found on valid endpoint

**Cause:** Global prefix or route not registered.

**Solution:**

```typescript
// Check global prefix
app.setGlobalPrefix('api'); // All routes now /api/*

// Verify module is imported
@Module({
  imports: [UsersModule], // ← Must be imported!
})
export class AppModule {}
```

---

## Feature-Specific Issues

### RBAC Issues

#### ❌ RbacGuard always returns 403

**Cause:** User not authenticated or no roles assigned.

**Solution:**

```typescript
// Ensure AuthGuard runs before RbacGuard
@UseGuards(AuthGuard, RbacGuard)
@Controller('users')

// Assign role to user
INSERT INTO rbac.user_roles (user_id, role_id)
VALUES ('user-id', (SELECT id FROM rbac.roles WHERE name = 'viewer'));
```

#### ❌ Permission check fails for admin

**Cause:** Super admin flag not working.

**Solution:**

```sql
-- Set is_super_admin = true
UPDATE rbac.roles SET is_super_admin = true WHERE name = 'admin';

-- Verify
SELECT * FROM rbac.roles WHERE name = 'admin';
```

### Audit Trail Issues

#### ❌ No audit logs created

**Cause:** AuditModule not imported or decorator missing.

**Solution:**

```typescript
// Ensure AuditModule is global
@Global()
@Module({...})
export class AuditModule {}

// Check decorator on service method
@AuditLog('users', 'create')
async create(dto: CreateDto) {}
```

#### ❌ Changes field is null

**Cause:** Old values not fetched before update.

**Solution:**

```typescript
@AuditLog('users', 'update')
async update(id: string, dto: UpdateDto) {
  const oldValues = await this.findOne(id); // ← Fetch first!
  return this.repository.update(id, dto);
}
```

### File Upload Issues

#### ❌ File too large error

**Cause:** File size exceeds limit.

**Solution:**

```typescript
// Increase limit
@UseInterceptors(FileInterceptor('file', {
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
}))

// Also update multer global config
import { NestExpressApplication } from '@nestjs/platform-express';
const app = await NestFactory.create<NestExpressApplication>(AppModule);
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));
```

#### ❌ AWS S3 upload fails

**Cause:** Invalid credentials or permissions.

**Solution:**

```bash
# Verify credentials
aws s3 ls s3://your-bucket

# Check IAM permissions (need s3:PutObject)
{
  "Effect": "Allow",
  "Action": ["s3:PutObject", "s3:GetObject", "s3:DeleteObject"],
  "Resource": "arn:aws:s3:::your-bucket/*"
}

# Update .env
AWS_ACCESS_KEY_ID=your_key
AWS_SECRET_ACCESS_KEY=your_secret
```

#### ❌ Invalid file type

**Cause:** MIME type validation.

**Solution:**

```typescript
// Allow specific types
fileFilter: (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new BadRequestException('Invalid file type'), false);
  }
}
```

### Caching Issues

#### ❌ Redis connection error

**Cause:** Redis server not running.

**Solution:**

```bash
# Start Redis
redis-server

# Or with Docker
docker run -d -p 6379:6379 redis:7

# Test connection
redis-cli ping  # Should return PONG
```

#### ❌ Cache not invalidating

**Cause:** Cache key strategy or TTL issue.

**Solution:**

```typescript
// Manual invalidation
await this.cacheManager.del(`users:${id}`);

// Or clear all
await this.cacheManager.reset();

// Check TTL
const ttl = await this.cacheManager.store.ttl(`users:${id}`);
```

---

## Performance Issues

### ❌ Slow queries

**Cause:** Missing indexes.

**Solution:**

```sql
-- Add indexes on filtered/searched columns
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_created_at ON users(created_at DESC);

-- For foreign keys
CREATE INDEX idx_posts_user_id ON posts(user_id);
```

### ❌ Memory leak

**Cause:** Database connections not closed or large result sets.

**Solution:**

```typescript
// Use pagination
const [data, total] = await this.repository.findAndCount({
  skip: (page - 1) * limit,
  take: limit,
});

// Stream large results
const stream = await this.repository.stream();
stream.on('data', (row) => {
  // Process row
});
```

### ❌ High CPU usage

**Cause:** Too many concurrent requests or inefficient queries.

**Solution:**

```typescript
// Add rate limiting
import { ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      ttl: 60,
      limit: 10,
    }),
  ],
})

// Use caching
@UseInterceptors(CacheInterceptor)
@Get()
async findAll() {}
```

---

## Deployment Issues

### ❌ Application crashes in production

**Cause:** Environment variables not set.

**Solution:**

```bash
# Check all required env vars
cat .env.example

# Set in production
export DB_HOST=prod-db.example.com
export DB_PASSWORD=prod_password
export REDIS_HOST=prod-redis.example.com

# Use PM2 for process management
pm2 start dist/main.js --name my-app
pm2 logs my-app
```

### ❌ Database migrations fail

**Cause:** Manual schema changes conflict.

**Solution:**

```bash
# Use migrations for all schema changes
npm run migration:generate -- -n AddUserTable
npm run migration:run

# Rollback if needed
npm run migration:revert
```

### ❌ Docker container exits immediately

**Cause:** Database not ready or wrong CMD.

**Solution:**

```dockerfile
# Wait for database
CMD ["sh", "-c", "sleep 10 && npm run start:prod"]

# Or use wait-for-it script
CMD ["./wait-for-it.sh", "db:5432", "--", "npm", "run", "start:prod"]
```

---

## Getting More Help

### Check Logs

```bash
# Application logs
tail -f logs/app.log

# PM2 logs
pm2 logs

# Docker logs
docker logs container-name
```

### Enable Debug Mode

```typescript
// In main.ts
const app = await NestFactory.create(AppModule, {
  logger: ['error', 'warn', 'debug', 'verbose'],
});
```

### Community Support

- **GitHub Issues**: [Report a bug](https://github.com/ojiepermana/nest/issues)
- **Stack Overflow**: Tag `nestjs` + `nest-generator`
- **Discord**: NestJS Discord server

### Reporting Bugs

Include:

1. Error message (full stack trace)
2. Generator version: `npm list @ojiepermana/nest-generator`
3. Node.js version: `node --version`
4. Database type and version
5. Minimal reproduction steps
6. Relevant code snippets

---

## Common Patterns & Best Practices

### Always Use Try-Catch

```typescript
@Post()
async create(@Body() dto: CreateDto) {
  try {
    return await this.service.create(dto);
  } catch (error) {
    this.logger.error('Failed to create user', error.stack);
    throw new InternalServerErrorException('Failed to create user');
  }
}
```

### Validate Environment Variables

```typescript
import { ConfigService } from '@nestjs/config';

constructor(private configService: ConfigService) {
  const dbHost = this.configService.get<string>('DB_HOST');
  if (!dbHost) {
    throw new Error('DB_HOST is not defined');
  }
}
```

### Use Health Checks

```typescript
import { HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Get('health')
@HealthCheck()
check() {
  return this.health.check([
    () => this.db.pingCheck('database'),
    () => this.redis.pingCheck('redis'),
  ]);
}
```

### Monitor Performance

```typescript
import { Logger } from '@nestjs/common';

@Injectable()
export class UsersService {
  private readonly logger = new Logger(UsersService.name);

  async findAll() {
    const start = Date.now();
    const result = await this.repository.find();
    const duration = Date.now() - start;
    
    this.logger.debug(`findAll took ${duration}ms`);
    
    return result;
  }
}
```

---

**Still having issues?** Check the [full documentation](./INDEX.md) or [open an issue](https://github.com/ojiepermana/nest/issues).

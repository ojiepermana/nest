# Microservices Quick Start Guide

Set up NestJS microservices architecture with **@ojiepermana/nest-generator** in **15 minutes**.

## Prerequisites

- Node.js 24+
- npm 11+
- NestJS 11+
- Database (PostgreSQL 18+ or MySQL 8+)
- Message transport (Redis/RabbitMQ/NATS) - optional, defaults to TCP

## Architecture Overview

```
┌─────────────────┐
│   API Gateway   │  ← HTTP REST endpoints
│   (Port 3000)   │
└────────┬────────┘
         │
         │ TCP/Redis/RabbitMQ/NATS
         │
    ┌────┴─────────────────────┐
    │                          │
┌───▼───────┐         ┌────────▼────┐
│  User     │         │   Post      │
│  Service  │         │   Service   │
│ (Port     │         │ (Port 3002) │
│  3001)    │         │             │
└───────────┘         └─────────────┘
    │                      │
    │                      │
┌───▼───────┐         ┌────▼────────┐
│  User DB  │         │   Post DB   │
└───────────┘         └─────────────┘
```

## Step 1: Initialize Project Structure (2 min)

```bash
# Create monorepo structure
mkdir my-microservices && cd my-microservices
npm init -y

# Install NestJS CLI
npm install -g @nestjs/cli

# Create apps directory
mkdir -p apps

# Create gateway
nest new apps/gateway --skip-git

# Create services
nest new apps/user-service --skip-git
nest new apps/post-service --skip-git
```

**Directory structure:**

```
my-microservices/
├── apps/
│   ├── gateway/
│   ├── user-service/
│   └── post-service/
└── package.json
```

## Step 2: Install Generator & Dependencies (2 min)

```bash
# Install generator
npm install @ojiepermana/nest-generator

# Install microservices packages
npm install @nestjs/microservices

# Install transport (choose one or more)
npm install ioredis  # For Redis transport
# OR
npm install amqplib amqp-connection-manager  # For RabbitMQ
# OR
npm install nats  # For NATS
```

## Step 3: Configure Generator (2 min)

```bash
# Initialize generator
npx nest-generator init

# Interactive prompts:
? Select architecture type: Microservices (Distributed)
? Database type: PostgreSQL
? Database host: localhost
? Database port: 5432
? Database username: postgres
? Database password: ****
? Database name: myapp
? Select gateway application: apps/gateway
? Transport layer: TCP (default) / Redis / RabbitMQ / NATS
```

This creates `generator.config.json`:

```json
{
  "architecture": "microservices",
  "gateway": "apps/gateway",
  "transport": "TCP",
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "username": "postgres",
    "database": "myapp"
  }
}
```

## Step 4: Setup Database Metadata (2 min)

```sql
-- Create metadata schema (if not exists)
CREATE SCHEMA IF NOT EXISTS meta;

-- Add table metadata
INSERT INTO meta.table_metadata (
  schema_name,
  table_name,
  architecture_type,
  microservice_name,
  microservice_port
) VALUES (
  'public',
  'users',
  'microservices',
  'user-service',
  3001
);

-- Add column metadata
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required,
  is_filterable
) VALUES
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'id', 'uuid', true, false),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'name', 'varchar', true, true),
  ((SELECT id FROM meta.table_metadata WHERE table_name = 'users'), 'email', 'varchar', true, true);
```

## Step 5: Generate Microservice Module (2 min)

```bash
# Generate user service module
npx nest-generator generate public.users

# Generator will:
# 1. Detect microservices architecture from metadata
# 2. Prompt: "Where to create service?" → apps/user-service
# 3. Create service module in apps/user-service/src/modules/users/
# 4. Create gateway proxy in apps/gateway/src/modules/users/
```

**Generated in `apps/user-service/`:**

```
src/modules/users/
├── users.controller.ts      # @MessagePattern handlers
├── users.service.ts         # Business logic
├── users.repository.ts      # Database access
├── dto/
│   ├── create-user.dto.ts
│   ├── update-user.dto.ts
│   └── filter-user.dto.ts
└── users.module.ts
```

**Generated in `apps/gateway/`:**

```
src/modules/users/
├── users.controller.ts      # REST endpoints (proxy)
└── users.module.ts          # ClientProxy config
```

## Step 6: Configure Transport (2 min)

**TCP (Default):**

`apps/user-service/src/main.ts`:

```typescript
import { NestFactory } from '@nestjs/core';
import { Transport, MicroserviceOptions } from '@nestjs/microservices';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.createMicroservice<MicroserviceOptions>(
    AppModule,
    {
      transport: Transport.TCP,
      options: {
        host: 'localhost',
        port: 3001,
      },
    },
  );
  
  await app.listen();
  console.log('User Service listening on port 3001');
}
bootstrap();
```

**Redis:**

```typescript
{
  transport: Transport.REDIS,
  options: {
    host: 'localhost',
    port: 6379,
    retryAttempts: 5,
    retryDelay: 1000,
  },
}
```

**RabbitMQ:**

```typescript
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'user_queue',
    queueOptions: {
      durable: true,
    },
  },
}
```

**NATS:**

```typescript
{
  transport: Transport.NATS,
  options: {
    servers: ['nats://localhost:4222'],
  },
}
```

## Step 7: Start Services (1 min)

```bash
# Terminal 1: Start gateway
cd apps/gateway && npm run start:dev

# Terminal 2: Start user service
cd apps/user-service && npm run start:dev

# Terminal 3: Start post service (if created)
cd apps/post-service && npm run start:dev
```

**Output:**

```
Gateway listening on port 3000
User Service listening on port 3001
Post Service listening on port 3002
```

## Step 8: Test Microservices (2 min)

```bash
# Create user via gateway
curl -X POST http://localhost:3000/users \
  -H "Content-Type: application/json" \
  -d '{
    "name": "John Doe",
    "email": "john@example.com"
  }'

# Response:
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@example.com",
  "created_at": "2024-11-10T10:30:00Z"
}

# Get all users
curl http://localhost:3000/users

# Get single user
curl http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000

# Update user
curl -X PUT http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "Jane Doe"}'

# Delete user
curl -X DELETE http://localhost:3000/users/550e8400-e29b-41d4-a716-446655440000
```

## Generated Code Structure

### Gateway Controller (REST → Message)

```typescript
// apps/gateway/src/modules/users/users.controller.ts
import { Controller, Get, Post, Put, Delete, Body, Param, Query, Inject } from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USER_SERVICE') private readonly client: ClientProxy,
  ) {}

  @Get()
  async findAll(@Query() filters: FilterUserDto) {
    return this.client.send('users.findAll', filters);
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.client.send('users.findOne', id);
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.client.send('users.create', dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.client.send('users.update', { id, dto });
  }

  @Delete(':id')
  async delete(@Param('id') id: string) {
    return this.client.send('users.delete', id);
  }
}
```

### Service Controller (Message Handlers)

```typescript
// apps/user-service/src/modules/users/users.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @MessagePattern('users.findAll')
  async findAll(@Payload() filters: FilterUserDto) {
    return this.service.findAll(filters);
  }

  @MessagePattern('users.findOne')
  async findOne(@Payload() id: string) {
    return this.service.findOne(id);
  }

  @MessagePattern('users.create')
  async create(@Payload() dto: CreateUserDto) {
    return this.service.create(dto);
  }

  @MessagePattern('users.update')
  async update(@Payload() data: { id: string; dto: UpdateUserDto }) {
    return this.service.update(data.id, data.dto);
  }

  @MessagePattern('users.delete')
  async delete(@Payload() id: string) {
    return this.service.delete(id);
  }
}
```

## Advanced Patterns

### 1. Event-Driven Communication

```typescript
// Service A: Emit event
@Injectable()
export class UsersService {
  constructor(
    @Inject('EVENT_BUS') private readonly eventBus: ClientProxy,
  ) {}

  async create(dto: CreateUserDto) {
    const user = await this.repository.create(dto);
    
    // Emit event
    this.eventBus.emit('user.created', user);
    
    return user;
  }
}

// Service B: Listen to event
@Controller()
export class NotificationsController {
  @EventPattern('user.created')
  async handleUserCreated(@Payload() user: User) {
    await this.sendWelcomeEmail(user);
  }
}
```

### 2. Request-Response with Timeout

```typescript
@Get(':id')
async findOne(@Param('id') id: string) {
  return this.client
    .send('users.findOne', id)
    .pipe(timeout(5000)) // 5 second timeout
    .toPromise();
}
```

### 3. Error Handling

```typescript
// In service
@MessagePattern('users.findOne')
async findOne(@Payload() id: string) {
  const user = await this.service.findOne(id);
  
  if (!user) {
    throw new RpcException({
      statusCode: 404,
      message: 'User not found',
    });
  }
  
  return user;
}

// In gateway
@Get(':id')
async findOne(@Param('id') id: string) {
  try {
    return await this.client.send('users.findOne', id).toPromise();
  } catch (error) {
    if (error.statusCode === 404) {
      throw new NotFoundException(error.message);
    }
    throw new InternalServerErrorException('Service unavailable');
  }
}
```

### 4. Service Discovery (with Consul/Eureka)

```typescript
// Service registration
import { Transport } from '@nestjs/microservices';
import * as consul from 'consul';

async function bootstrap() {
  const consulClient = new consul();
  
  // Register service
  await consulClient.agent.service.register({
    name: 'user-service',
    port: 3001,
    check: {
      http: 'http://localhost:3001/health',
      interval: '10s',
    },
  });

  const app = await NestFactory.createMicroservice(AppModule, {
    transport: Transport.TCP,
    options: { port: 3001 },
  });
  
  await app.listen();
}
```

## Load Balancing

### Multiple Service Instances

```bash
# Start multiple instances
PORT=3001 npm run start user-service
PORT=3002 npm run start user-service
PORT=3003 npm run start user-service
```

### Gateway Load Balancer

```typescript
// apps/gateway/src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001, // Use load balancer port (nginx/haproxy)
        },
      },
    ]),
  ],
})
export class UsersModule {}
```

## Monitoring & Health Checks

```typescript
// apps/user-service/src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import { HealthCheck, HealthCheckService, TypeOrmHealthIndicator } from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
    ]);
  }
}
```

## Troubleshooting

### ❌ Gateway cannot connect to service

**Check:**

1. Service is running: `lsof -i :3001`
2. Firewall allows connection
3. Correct host/port in gateway config
4. Transport matches (TCP/Redis/RabbitMQ)

### ❌ Timeout errors

**Solution:** Increase timeout:

```typescript
this.client.send('pattern', data).pipe(timeout(10000)) // 10 sec
```

### ❌ Message not received

**Check:**

1. Pattern name matches exactly: `'users.findAll'`
2. Service controller has `@MessagePattern()`
3. Gateway uses `client.send()` not `client.emit()`

### ❌ RabbitMQ connection refused

**Solution:** Start RabbitMQ:

```bash
docker run -d --name rabbitmq -p 5672:5672 -p 15672:15672 rabbitmq:3-management
```

## Next Steps

- **API Gateway**: Add authentication, rate limiting, CORS
- **Service Mesh**: Istio, Linkerd for advanced routing
- **Distributed Tracing**: Jaeger, Zipkin integration
- **Circuit Breaker**: Resilience4j, Hystrix patterns
- **Message Queue**: Add RabbitMQ/Kafka for async processing
- **Caching**: Redis cache at gateway level
- **Documentation**: Swagger docs per service

## Quick Reference

```typescript
// Gateway: Send message (wait for response)
this.client.send('pattern', payload)

// Gateway: Emit event (fire and forget)
this.client.emit('event', payload)

// Service: Handle message
@MessagePattern('pattern')

// Service: Handle event
@EventPattern('event')

// Service: Throw error
throw new RpcException({ statusCode: 400, message: 'Error' })
```

**Transport Options:**
- TCP: Simple, fast, no external dependency
- Redis: Pub/Sub, requires Redis server
- RabbitMQ: Robust, message persistence, requires RabbitMQ
- NATS: Lightweight, high performance, requires NATS server

**Total Time: ~15 minutes** ✅

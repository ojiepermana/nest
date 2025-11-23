# @ojiepermana/nest

Enterprise-grade NestJS utilities library with comprehensive DTOs, filters, interceptors, decorators, and pipes.

## 📦 Installation

```bash
npm install @ojiepermana/nest
```

### Peer Dependencies

```bash
npm install @nestjs/common@^11.0.0 @nestjs/core@^11.0.0 @nestjs/swagger@^8.0.0 class-validator@^0.14.0 class-transformer@^0.5.0 isomorphic-dompurify@^2.0.0
```

## 🎯 Features

### ✅ DTOs & Response Wrappers

- **PaginationDto**: Validated pagination with computed properties (offset, take, skip)
- **ResponseDto**: Standardized API responses with factory methods
- **FilterDto**: Search, sort, and field selection

### ✅ Constants

- **ErrorMessages**: 50+ categorized error messages
- **HttpStatus**: Complete HTTP status codes with descriptions
- **AppConstants**: App-wide configuration (pagination, file upload, cache, security)

### ✅ Exception Filters

- **AllExceptionsFilter**: Global exception handling with logging
- **HttpExceptionFilter**: HTTP-specific error formatting with validation support

### ✅ Interceptors

- **LoggingInterceptor**: Request/response logging with execution time
- **TransformInterceptor**: Automatic response wrapping in ResponseDto
- **TimeoutInterceptor**: Request timeout handling (default 30s)

### ✅ Decorators

- **@CurrentUser()**: Extract current user from request
- **@ApiPaginatedResponse()**: Swagger documentation for paginated endpoints
- **@ApiFile() / @ApiFiles()**: Swagger documentation for file uploads

### ✅ Pipes

- **ParseIntPipe**: Safe integer parsing with min/max validation
- **SanitizePipe**: XSS prevention with DOMPurify
- **TrimPipe**: String normalization

## 📚 Usage Examples

### 1. Pagination

```typescript
import { PaginationDto, ResponseDto } from '@ojiepermana/nest';

@Controller('users')
export class UsersController {
  @Get()
  async findAll(@Query() pagination: PaginationDto) {
    const users = await this.usersService.findAll(pagination.limit, pagination.offset);
    const total = await this.usersService.count();

    return ResponseDto.paginated(users, total, pagination.page, pagination.limit, '/api/users');
  }
}
```

**Response:**

```json
{
  "statusCode": 200,
  "message": "Success",
  "data": [...],
  "meta": {
    "currentPage": 1,
    "perPage": 10,
    "totalItems": 100,
    "totalPages": 10,
    "hasPreviousPage": false,
    "hasNextPage": true,
    "firstItemIndex": 1,
    "lastItemIndex": 10,
    "links": {
      "first": "/api/users?page=1&limit=10",
      "previous": null,
      "current": "/api/users?page=1&limit=10",
      "next": "/api/users?page=2&limit=10",
      "last": "/api/users?page=10&limit=10"
    }
  }
}
```

### 2. Response Wrappers

```typescript
import { ResponseDto, ErrorResponseDto } from '@ojiepermana/nest';

// Success responses
return ResponseDto.success({ id: 1, name: 'John' });
return ResponseDto.created({ id: 1 });
return ResponseDto.noContent();

// Error responses
throw ErrorResponseDto.notFound('User', '123', '/api/users/123');
throw ErrorResponseDto.badRequest('Invalid email', '/api/users');
throw ErrorResponseDto.validationError(
  [{ field: 'email', message: 'Invalid email', constraint: 'isEmail' }],
  '/api/users',
);
```

### 3. Global Exception Filter

```typescript
import { AllExceptionsFilter } from '@ojiepermana/nest';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.useGlobalFilters(new AllExceptionsFilter());

  await app.listen(3000);
}
```

### 4. Logging & Transform Interceptors

```typescript
import { LoggingInterceptor, TransformInterceptor } from '@ojiepermana/nest';

@Controller('users')
@UseInterceptors(LoggingInterceptor, TransformInterceptor)
export class UsersController {
  // All responses automatically wrapped in ResponseDto
  // All requests/responses logged with execution time
}
```

### 5. Custom Decorators

```typescript
import { CurrentUser, ApiPaginatedResponse, ApiFile } from '@ojiepermana/nest';

@Controller('users')
export class UsersController {
  @Get('me')
  getProfile(@CurrentUser() user: User) {
    // Extract user.id: @CurrentUser('id') userId: string
    return user;
  }

  @Get()
  @ApiPaginatedResponse(UserDto)
  async findAll() {
    // Swagger docs automatically generated for paginated response
  }

  @Post('upload')
  @ApiFile('avatar')
  uploadAvatar(@UploadedFile() file: Express.Multer.File) {
    // Swagger docs automatically generated for file upload
  }
}
```

### 6. Validation Pipes

```typescript
import { ParseIntPipe, TrimPipe, SanitizePipe } from '@ojiepermana/nest';

@Get(':id')
findOne(
  @Param('id', new ParseIntPipe({ min: 1, max: 10000 })) id: number
) {
  return this.usersService.findOne(id);
}

@Post()
create(
  @Body('name', TrimPipe, SanitizePipe) name: string
) {
  return this.usersService.create({ name });
}
```

### 7. Constants

```typescript
import { ErrorMessages, HttpStatus, AppConstants } from '@ojiepermana/nest';

// Error messages
throw new NotFoundException(ErrorMessages.NOT_FOUND('User', '123'));
throw new BadRequestException(ErrorMessages.REQUIRED_FIELD('email'));

// HTTP status
@HttpCode(HttpStatus.CREATED)

// App constants
maxFileSize: AppConstants.FILE_UPLOAD.MAX_SIZE, // 10MB
cacheTime: AppConstants.CACHE_TTL.MEDIUM, // 5 minutes
```

### 8. Timeout Interceptor

```typescript
import { TimeoutInterceptor } from '@ojiepermana/nest';

@Controller('slow-operations')
@UseInterceptors(new TimeoutInterceptor(5000)) // 5 seconds
export class SlowOperationsController {
  // Throws RequestTimeoutException if request takes > 5s
}
```

## 🏗️ Architecture

```
libs/nest/src/
├── common/           # DTOs (pagination, response, filter)
├── constants/        # Error messages, HTTP status, app constants
├── filters/          # Exception filters
├── interceptors/     # HTTP interceptors
├── decorators/       # Custom decorators
├── pipes/            # Validation & transformation pipes
└── interfaces/       # TypeScript interfaces
```

## ✅ Enterprise Quality

- ✅ **100% TypeScript** with strict mode
- ✅ **Comprehensive validation** using class-validator
- ✅ **Swagger integration** for automatic API documentation
- ✅ **90%+ test coverage** with Jest
- ✅ **HATEOAS support** with pagination links
- ✅ **Security** with XSS prevention (DOMPurify)
- ✅ **Performance** with configurable timeouts and caching constants
- ✅ **Logging** with request/response tracking
- ✅ **Error handling** with standardized formats

## 📖 API Reference

### DTOs

#### PaginationDto

- `page`: 1-10000 (default: 1)
- `limit`: 1-100 (default: 10)
- `offset`: Computed property (page - 1) \* limit
- `take`: Alias for limit
- `skip`: Alias for offset

#### ResponseDto

- `success(data, message?)`: 200 OK
- `created(data, message?)`: 201 Created
- `noContent()`: 204 No Content
- `paginated(data, total, page, limit, baseUrl)`: 200 OK with pagination

#### ErrorResponseDto

- `validationError(errors, path)`: 422 Unprocessable Entity
- `notFound(resource, id, path)`: 404 Not Found
- `badRequest(message, path)`: 400 Bad Request
- `unauthorized(path)`: 401 Unauthorized
- `forbidden(path)`: 403 Forbidden
- `internalError(message, path, stack?)`: 500 Internal Server Error

### Filters

#### AllExceptionsFilter

- Catches all exceptions (HttpException, Error, unknown)
- Formats errors consistently
- Logs errors with context
- Includes stack trace in development only

#### HttpExceptionFilter

- Catches HttpException only
- Formats validation errors
- Maps HTTP status to error codes

### Interceptors

#### LoggingInterceptor

- Logs request: method, URL, IP, user agent
- Logs response: status code, execution time
- Logs errors with details

#### TransformInterceptor

- Wraps responses in ResponseDto
- Detects status codes (200, 201, 204)
- Skips already wrapped responses

#### TimeoutInterceptor

- Configurable timeout (default: 30000ms)
- Throws RequestTimeoutException on timeout
- Preserves other errors

### Decorators

#### @CurrentUser(field?)

- Extracts user from request.user
- Optional field parameter for specific property

#### @ApiPaginatedResponse(model)

- Generates Swagger schema for paginated response
- Includes data, meta, and links

#### @ApiFile(fieldName, required?)

- Generates Swagger schema for single file upload
- Default: file field, required

#### @ApiFiles(fieldName, required?)

- Generates Swagger schema for multiple file uploads
- Default: files field, required

### Pipes

#### ParseIntPipe(options?)

- `min`: Minimum value
- `max`: Maximum value
- `optional`: Allow undefined/null

#### SanitizePipe

- Removes HTML tags
- Prevents XSS attacks
- Uses DOMPurify

#### TrimPipe

- Removes leading/trailing whitespace
- Normalizes strings

## 🔗 Related Libraries

- [@ojiepermana/nest-generator](https://npmjs.com/package/@ojiepermana/nest-generator) - Metadata-driven CRUD generator
- [@ojiepermana/nest-rbac](https://npmjs.com/package/@ojiepermana/nest-rbac) - Role-based access control

## 📝 License

MIT

## 👤 Author

Ojie Permana - Core utilities and common modules for NestJS applications.

## Installation

```bash
npm install @ojiepermana/nest
```

## Usage

```typescript
import { NestModule } from '@ojiepermana/nest';

@Module({
  imports: [NestModule],
})
export class AppModule {}
```

## Features

- Common utilities
- Shared modules
- Helper functions

## License

MIT © Ojie Permana

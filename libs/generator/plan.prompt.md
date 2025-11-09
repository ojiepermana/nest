# NestJS Generator Library - Development Plan

## Project Overview

A powerful code generator library for NestJS applications that creates production-ready CRUD modules from database metadata. Supports multiple architectures (standalone, monorepo, microservices), multiple databases (PostgreSQL, MySQL), and preserves custom code during regeneration.

---

## Features

### Core Features

- ✅ **No ORM** - Uses native database drivers for better control and performance
- ✅ **Multi-Connection Support** - Handle multiple database connections simultaneously
- ✅ **Automatic Setup** - One command to create required database schema and tables
- ✅ **Safe Updates** - Regenerate code without overwriting custom modifications
- ✅ **Dynamic Filtering** - Advanced query filters via URL parameters (\_eq, \_like, \_in, \_between, etc.)
- ✅ **SQL Separation** - All queries stored in separate \*.query.ts files
- ✅ **Type Safety** - Full TypeScript support with generated DTOs
- ✅ **Schema Tracking** - Automatic change detection with checksums
- ✅ **CLI Tools** - Generate, sync, and check modules via command line
- ✅ **Multi-Architecture Support** - Works with standalone, monorepo, and microservice architectures
- ✅ **Microservice Gateway** - Automatic gateway selection and event-driven communication

### Advanced Features

- ✅ **Auto Swagger/OpenAPI** - Generate API documentation with examples and schemas
- ✅ **Export Functionality** - Export data to CSV/Excel/PDF with custom columns
- ✅ **Caching Layer** - Redis integration with auto-invalidation on mutations
- ✅ **Rate Limiting** - Throttle protection with configurable limits per endpoint
- ✅ **Audit Trail** - Complete activity logging with rollback capabilities
- ✅ **File Upload** - Multi-file upload with validation and cloud storage support
- ✅ **Search Integration** - Elasticsearch/Algolia for full-text and fuzzy search
- ✅ **RBAC & Permissions** - Role-based access control with field-level permissions
- ✅ **Notification System** - Email/SMS/Push notifications with queue management

---

## Architecture Support

### 1. Standalone Application

Single NestJS application with all modules in one codebase.

**Structure:**

```
src/
  modules/
    users/
      users.dto.ts
      users.query.ts
      users.repository.ts
      users.service.ts
      users.controller.ts
      users.module.ts
```

**Generated Endpoints:**

All CRUD endpoints are available directly in the application.

| Method | Endpoint       | Description                               | Request Body    | Response         |
| ------ | -------------- | ----------------------------------------- | --------------- | ---------------- |
| GET    | `/users`       | Get all users with filtering & pagination | Query params    | `User[]`         |
| GET    | `/users/recap` | Get yearly recap with grouping            | Query params    | `RecapResult[]`  |
| GET    | `/users/:id`   | Get single user by ID                     | -               | `User`           |
| POST   | `/users`       | Create new user                           | `CreateUserDto` | `User`           |
| PUT    | `/users/:id`   | Update existing user                      | `UpdateUserDto` | `User`           |
| DELETE | `/users/:id`   | Soft delete user                          | -               | `{ id: string }` |

**Special Endpoints:**

#### 1. List Users - `/users` (Default CRUD)

Standard list endpoint with filtering, pagination, and sorting.

```bash
GET /users?username_like=john&page=1&limit=20
```

#### 2. Yearly Recap - `/users/recap`

Generate aggregated data grouped by specified fields with monthly breakdown.

**Query Parameters:**

- `year` (required) - Target year (e.g., 2024)
- `group_by` (optional) - Comma-separated field names (max 2 fields)
  - 1 field: Simple grouping (default)
  - 2 fields: Hierarchical grouping (main + sub)
- Additional filters from metadata

**Response Format:**

**Single Field Grouping:**

```typescript
// GET /users/recap?year=2024&group_by=department

[
  {
    main: 'Engineering', // Main group value
    jan: 5,
    feb: 7,
    mar: 6, // Monthly counts
    apr: 8,
    may: 9,
    jun: 10,
    jul: 12,
    aug: 11,
    sep: 9,
    oct: 10,
    nov: 8,
    dec: 7,
    total: 102, // Yearly total
  },
  {
    main: 'Sales',
    jan: 3,
    feb: 4,
    mar: 5,
    apr: 6,
    may: 5,
    jun: 7,
    jul: 8,
    aug: 6,
    sep: 5,
    oct: 7,
    nov: 6,
    dec: 5,
    total: 67,
  },
  {
    main: 'Marketing',
    jan: 2,
    feb: 3,
    mar: 4,
    apr: 3,
    may: 4,
    jun: 5,
    jul: 4,
    aug: 5,
    sep: 6,
    oct: 5,
    nov: 4,
    dec: 3,
    total: 48,
  },
];
```

**Two Fields Grouping:**

```typescript
// GET /users/recap?year=2024&group_by=department,role

[
  {
    main: 'Engineering', // Main group (field1)
    sub: 'Senior Developer', // Sub group (field2)
    jan: 2,
    feb: 3,
    mar: 2,
    apr: 4,
    may: 3,
    jun: 4,
    jul: 5,
    aug: 4,
    sep: 3,
    oct: 4,
    nov: 3,
    dec: 2,
    total: 39,
  },
  {
    main: 'Engineering',
    sub: 'Junior Developer',
    jan: 3,
    feb: 4,
    mar: 4,
    apr: 4,
    may: 6,
    jun: 6,
    jul: 7,
    aug: 7,
    sep: 6,
    oct: 6,
    nov: 5,
    dec: 5,
    total: 63,
  },
  {
    main: 'Sales',
    sub: 'Account Manager',
    jan: 2,
    feb: 2,
    mar: 3,
    apr: 4,
    may: 3,
    jun: 4,
    jul: 5,
    aug: 4,
    sep: 3,
    oct: 4,
    nov: 3,
    dec: 3,
    total: 40,
  },
  {
    main: 'Sales',
    sub: 'Sales Representative',
    jan: 1,
    feb: 2,
    mar: 2,
    apr: 2,
    may: 2,
    jun: 3,
    jul: 3,
    aug: 2,
    sep: 2,
    oct: 3,
    nov: 3,
    dec: 2,
    total: 27,
  },
];
```

**Example Usage:**

```bash
# List users with filters
GET http://localhost:3000/users?username_like=john&is_active_eq=true&page=1&limit=20

# Get specific user
GET http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000

# Create user
POST http://localhost:3000/users
Content-Type: application/json
{
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true
}

# Update user
PUT http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000
Content-Type: application/json
{
  "full_name": "John Smith"
}

# Delete user
DELETE http://localhost:3000/users/123e4567-e89b-12d3-a456-426614174000

# Yearly recap with single field grouping
GET http://localhost:3000/users/recap?year=2024&group_by=department

# Yearly recap with two fields grouping
GET http://localhost:3000/users/recap?year=2024&group_by=department,role

# Recap with additional filters
GET http://localhost:3000/users/recap?year=2024&group_by=department&is_active_eq=true
```

**Recap Implementation Details:**

**DTO for Recap:**

```typescript
// users.dto.ts

import {
  IsOptional,
  IsString,
  IsInt,
  Min,
  Max,
  Matches,
} from 'class-validator';
import { Type } from 'class-transformer';

export class UserRecapDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  year: number;

  @IsOptional()
  @IsString()
  @Matches(/^[a-z_]+(?:,[a-z_]+)?$/, {
    message:
      'group_by must be 1 or 2 comma-separated field names (e.g., "department" or "department,role")',
  })
  group_by?: string = 'department'; // Default to single field

  // Additional filters (same as UserFilterDto)
  @IsOptional()
  @IsString()
  is_active_eq?: string;
}

export interface RecapResult {
  main: string;
  sub?: string;
  jan: number;
  feb: number;
  mar: number;
  apr: number;
  may: number;
  jun: number;
  jul: number;
  aug: number;
  sep: number;
  oct: number;
  nov: number;
  dec: number;
  total: number;
}
```

**SQL Query for Recap:**

```typescript
// users.query.ts

export const UsersQueries = {
  // ... existing queries ...

  // GENERATED_QUERY_START: recap-single-field
  recapSingleField: `
    SELECT 
      {{field1}} as main,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 1 THEN 1 END) as jan,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 2 THEN 1 END) as feb,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 3 THEN 1 END) as mar,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 4 THEN 1 END) as apr,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 5 THEN 1 END) as may,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 6 THEN 1 END) as jun,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 7 THEN 1 END) as jul,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 8 THEN 1 END) as aug,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 9 THEN 1 END) as sep,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 10 THEN 1 END) as oct,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 11 THEN 1 END) as nov,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 12 THEN 1 END) as dec,
      COUNT(*) as total
    FROM user.users
    WHERE EXTRACT(YEAR FROM created_at) = $1
      AND deleted_at IS NULL
      {{additional_filters}}
    GROUP BY {{field1}}
    ORDER BY total DESC, main ASC
  `,
  // GENERATED_QUERY_END: recap-single-field

  // GENERATED_QUERY_START: recap-two-fields
  recapTwoFields: `
    SELECT 
      {{field1}} as main,
      {{field2}} as sub,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 1 THEN 1 END) as jan,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 2 THEN 1 END) as feb,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 3 THEN 1 END) as mar,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 4 THEN 1 END) as apr,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 5 THEN 1 END) as may,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 6 THEN 1 END) as jun,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 7 THEN 1 END) as jul,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 8 THEN 1 END) as aug,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 9 THEN 1 END) as sep,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 10 THEN 1 END) as oct,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 11 THEN 1 END) as nov,
      COUNT(CASE WHEN EXTRACT(MONTH FROM created_at) = 12 THEN 1 END) as dec,
      COUNT(*) as total
    FROM user.users
    WHERE EXTRACT(YEAR FROM created_at) = $1
      AND deleted_at IS NULL
      {{additional_filters}}
    GROUP BY {{field1}}, {{field2}}
    ORDER BY main ASC, sub ASC
  `,
  // GENERATED_QUERY_END: recap-two-fields

  // CUSTOM_QUERY_START: custom-queries
  // Add your custom queries here
  // CUSTOM_QUERY_END: custom-queries
};
```

**Repository Method:**

```typescript
// users.repository.ts

// GENERATED_METHOD_START: recap
async getYearlyRecap(
  year: number,
  groupBy: string[],
  filters?: UserFilterDto
): Promise<RecapResult[]> {
  // Validate fields exist in metadata
  const validFields = ['department', 'role', 'status', 'region']; // From metadata
  const fields = groupBy.filter(f => validFields.includes(f));

  if (fields.length === 0) {
    throw new Error('Invalid group_by fields');
  }

  // Build query based on number of group fields
  let query: string;
  const params: any[] = [year];
  let paramIndex = 2;

  if (fields.length === 1) {
    query = UsersQueries.recapSingleField
      .replace(/\{\{field1\}\}/g, fields[0]);
  } else {
    query = UsersQueries.recapTwoFields
      .replace(/\{\{field1\}\}/g, fields[0])
      .replace(/\{\{field2\}\}/g, fields[1]);
  }

  // Apply additional filters
  let additionalFilters = '';
  if (filters) {
    const filterClauses: string[] = [];

    if (filters.is_active_eq !== undefined) {
      filterClauses.push(`AND is_active = $${paramIndex++}`);
      params.push(filters.is_active_eq === 'true');
    }

    if (filters.department_eq) {
      filterClauses.push(`AND department = $${paramIndex++}`);
      params.push(filters.department_eq);
    }

    additionalFilters = filterClauses.join(' ');
  }

  query = query.replace('{{additional_filters}}', additionalFilters);

  const result = await this.pool.query(query, params);
  return result.rows;
}
// GENERATED_METHOD_END: recap
```

**Service Method:**

```typescript
// users.service.ts

// GENERATED_METHOD_START: recap
async getYearlyRecap(dto: UserRecapDto): Promise<RecapResult[]> {
  const groupBy = dto.group_by ? dto.group_by.split(',').slice(0, 2) : ['department'];

  // Extract filters (excluding year and group_by)
  const { year, group_by, ...filters } = dto;

  return this.repository.getYearlyRecap(dto.year, groupBy, filters);
}
// GENERATED_METHOD_END: recap
```

**Controller Endpoint:**

```typescript
// users.controller.ts

// GENERATED_ENDPOINT_START: recap
@Get('recap')
async getYearlyRecap(@Query() dto: UserRecapDto) {
  return this.service.getYearlyRecap(dto);
}
// GENERATED_ENDPOINT_END: recap
```

**Usage Examples:**

```bash
# Single field grouping (default)
curl "http://localhost:3000/users/recap?year=2024"

# Single field grouping (explicit)
curl "http://localhost:3000/users/recap?year=2024&group_by=department"

# Two fields grouping
curl "http://localhost:3000/users/recap?year=2024&group_by=department,role"

# With additional filters
curl "http://localhost:3000/users/recap?year=2024&group_by=department&is_active_eq=true"

# Multiple filters
curl "http://localhost:3000/users/recap?year=2024&group_by=role,region&department_eq=Engineering&is_active_eq=true"
```

**Response Examples:**

```json
// Single field: GET /users/recap?year=2024&group_by=department
[
  {
    "main": "Engineering",
    "jan": 5, "feb": 7, "mar": 6, "apr": 8, "may": 9, "jun": 10,
    "jul": 12, "aug": 11, "sep": 9, "oct": 10, "nov": 8, "dec": 7,
    "total": 102
  },
  {
    "main": "Sales",
    "jan": 3, "feb": 4, "mar": 5, "apr": 6, "may": 5, "jun": 7,
    "jul": 8, "aug": 6, "sep": 5, "oct": 7, "nov": 6, "dec": 5,
    "total": 67
  }
]

// Two fields: GET /users/recap?year=2024&group_by=department,role
[
  {
    "main": "Engineering",
    "sub": "Junior Developer",
    "jan": 3, "feb": 4, "mar": 4, "apr": 4, "may": 6, "jun": 6,
    "jul": 7, "aug": 7, "sep": 6, "oct": 6, "nov": 5, "dec": 5,
    "total": 63
  },
  {
    "main": "Engineering",
    "sub": "Senior Developer",
    "jan": 2, "feb": 3, "mar": 2, "apr": 4, "may": 3, "jun": 4,
    "jul": 5, "aug": 4, "sep": 3, "oct": 4, "nov": 3, "dec": 2,
    "total": 39
  },
  {
    "main": "Sales",
    "sub": "Account Manager",
    "jan": 2, "feb": 2, "mar": 3, "apr": 4, "may": 3, "jun": 4,
    "jul": 5, "aug": 4, "sep": 3, "oct": 4, "nov": 3, "dec": 3,
    "total": 40
  }
]
```

**Visual Representation:**

The recap data can be easily visualized in tables or charts:

**Single Field Recap Table:**

```
Department    | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total
--------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|------
Engineering   |  5  |  7  |  6  |  8  |  9  | 10  | 12  | 11  |  9  | 10  |  8  |  7  | 102
Sales         |  3  |  4  |  5  |  6  |  5  |  7  |  8  |  6  |  5  |  7  |  6  |  5  |  67
Marketing     |  2  |  3  |  4  |  3  |  4  |  5  |  4  |  5  |  6  |  5  |  4  |  3  |  48
```

**Two Fields Recap Table:**

```
Department    | Role              | Jan | Feb | Mar | Apr | May | Jun | Jul | Aug | Sep | Oct | Nov | Dec | Total
--------------|-------------------|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|-----|------
Engineering   | Junior Developer  |  3  |  4  |  4  |  4  |  6  |  6  |  7  |  7  |  6  |  6  |  5  |  5  |  63
Engineering   | Senior Developer  |  2  |  3  |  2  |  4  |  3  |  4  |  5  |  4  |  3  |  4  |  3  |  2  |  39
Sales         | Account Manager   |  2  |  2  |  3  |  4  |  3  |  4  |  5  |  4  |  3  |  4  |  3  |  3  |  40
Sales         | Sales Rep         |  1  |  2  |  2  |  2  |  2  |  3  |  3  |  2  |  2  |  3  |  3  |  2  |  27
```

**Advanced Usage Scenarios:**

```bash
# 1. Department growth tracking
GET /users/recap?year=2024&group_by=department

# 2. Role distribution by department
GET /users/recap?year=2024&group_by=department,role

# 3. Regional analysis
GET /users/recap?year=2024&group_by=region,status

# 4. Active users only
GET /users/recap?year=2024&group_by=department&is_active_eq=true

# 5. Specific department analysis
GET /users/recap?year=2024&group_by=role&department_eq=Engineering

# 6. Multi-year comparison (call multiple times)
GET /users/recap?year=2023&group_by=department
GET /users/recap?year=2024&group_by=department

# 7. Status tracking
GET /users/recap?year=2024&group_by=status

# 8. Geographic + role analysis
GET /users/recap?year=2024&group_by=region,role&is_active_eq=true
```

**Frontend Integration Example:**

```typescript
// React/Angular/Vue component
async function fetchUserRecap(year: number, groupBy: string[]) {
  const params = new URLSearchParams({
    year: year.toString(),
    group_by: groupBy.join(','),
  });

  const response = await fetch(`/users/recap?${params}`);
  const data: RecapResult[] = await response.json();

  // Transform for chart library (Chart.js, ApexCharts, etc.)
  return {
    categories: data.map((d) =>
      groupBy.length === 1 ? d.main : `${d.main} - ${d.sub}`,
    ),
    series: [
      { name: 'Jan', data: data.map((d) => d.jan) },
      { name: 'Feb', data: data.map((d) => d.feb) },
      { name: 'Mar', data: data.map((d) => d.mar) },
      { name: 'Apr', data: data.map((d) => d.apr) },
      { name: 'May', data: data.map((d) => d.may) },
      { name: 'Jun', data: data.map((d) => d.jun) },
      { name: 'Jul', data: data.map((d) => d.jul) },
      { name: 'Aug', data: data.map((d) => d.aug) },
      { name: 'Sep', data: data.map((d) => d.sep) },
      { name: 'Oct', data: data.map((d) => d.oct) },
      { name: 'Nov', data: data.map((d) => d.nov) },
      { name: 'Dec', data: data.map((d) => d.dec) },
    ],
  };
}

// Usage
const chartData = await fetchUserRecap(2024, ['department', 'role']);
```

**Excel Export Example:**

```typescript
// Export recap to Excel
import * as XLSX from 'xlsx';

async function exportRecapToExcel(year: number, groupBy: string[]) {
  const response = await fetch(
    `/users/recap?year=${year}&group_by=${groupBy.join(',')}`,
  );
  const data: RecapResult[] = await response.json();

  // Transform to Excel format
  const excelData = data.map((row) => ({
    [groupBy[0]]: row.main,
    ...(groupBy.length === 2 && { [groupBy[1]]: row.sub }),
    January: row.jan,
    February: row.feb,
    March: row.mar,
    April: row.apr,
    May: row.may,
    June: row.jun,
    July: row.jul,
    August: row.aug,
    September: row.sep,
    October: row.oct,
    November: row.nov,
    December: row.dec,
    Total: row.total,
  }));

  const ws = XLSX.utils.json_to_sheet(excelData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, `Recap ${year}`);
  XLSX.writeFile(wb, `user-recap-${year}.xlsx`);
}
```

**Query Parameters (Filtering):**

All filterable columns from metadata support these operators:

```bash
# String fields
?username_eq=john           # Exact match
?username_like=john         # Pattern match (ILIKE)
?email_in=john@test.com,jane@test.com  # In array

# Numeric fields
?age_gt=18                  # Greater than
?age_gte=18                 # Greater than or equal
?age_lt=65                  # Less than
?age_lte=65                 # Less than or equal
?age_between=18,65          # Between range

# Boolean fields
?is_active_eq=true          # Exact match

# Date fields
?created_at_gte=2024-01-01
?created_at_between=2024-01-01,2024-12-31

# Pagination
?page=1
?limit=20

# Sorting (future enhancement)
?sort=created_at
?order=DESC
```

---

### 2. Monorepo

Multiple applications sharing common libraries.

**Structure:**

```
apps/
  demo/
    src/
      modules/
        users/
          users.dto.ts
          users.query.ts
          users.repository.ts
          users.service.ts
          users.controller.ts
          users.module.ts
libs/
  common/
  shared/
```

**Generated Endpoints:**

Same as standalone architecture, but scoped to the specific application.

| Method | Endpoint       | Description                               | Request Body    | Response         |
| ------ | -------------- | ----------------------------------------- | --------------- | ---------------- |
| GET    | `/users`       | Get all users with filtering & pagination | Query params    | `User[]`         |
| GET    | `/users/recap` | Get yearly recap with grouping            | Query params    | `RecapResult[]`  |
| GET    | `/users/:id`   | Get single user by ID                     | -               | `User`           |
| POST   | `/users`       | Create new user                           | `CreateUserDto` | `User`           |
| PUT    | `/users/:id`   | Update existing user                      | `UpdateUserDto` | `User`           |
| DELETE | `/users/:id`   | Soft delete user                          | -               | `{ id: string }` |

| Method | Endpoint     | Description                               | Request Body    | Response         |
| ------ | ------------ | ----------------------------------------- | --------------- | ---------------- |
| GET    | `/users`     | Get all users with filtering & pagination | Query params    | `User[]`         |
| GET    | `/users/:id` | Get single user by ID                     | -               | `User`           |
| POST   | `/users`     | Create new user                           | `CreateUserDto` | `User`           |
| PUT    | `/users/:id` | Update existing user                      | `UpdateUserDto` | `User`           |
| DELETE | `/users/:id` | Soft delete user                          | -               | `{ id: string }` |

**Example Usage:**

```bash
# If app runs on port 3000
GET http://localhost:3000/users
GET http://localhost:3000/users/recap?year=2024&group_by=department

# If multiple apps in monorepo
# App 1 (admin)
GET http://localhost:3001/users
GET http://localhost:3001/users/recap?year=2024&group_by=department,role

# App 2 (api)
GET http://localhost:3002/users
GET http://localhost:3002/users/recap?year=2024&group_by=status
```

**Note:** The `/recap` endpoint is available in all monorepo apps with the same implementation as standalone.

**Shared Libraries:**

In monorepo, you can share DTOs and interfaces across apps:

```typescript
// libs/common/src/dtos/users.dto.ts
export { CreateUserDto, UpdateUserDto, UserFilterDto } from './generated';

// apps/admin/src/modules/users/users.controller.ts
import { CreateUserDto } from '@app/common';
```

---

### 3. Microservices

Distributed services with gateway pattern.

**Structure:**

```
apps/
  gateway/              # API Gateway (selected during init)
    src/
      modules/
        users/
          users.controller.ts  # REST endpoints (proxy)
          users.module.ts
  user-service/         # Domain service
    src/
      modules/
        users/
          users.dto.ts
          users.query.ts
          users.repository.ts
          users.service.ts
          users.controller.ts  # Message handlers
          users.module.ts
```

**Generated Endpoints:**

#### Gateway Layer (REST API)

The gateway exposes REST endpoints and proxies to microservices via message patterns.

| Method | Endpoint       | Description      | Proxies To       | Response         |
| ------ | -------------- | ---------------- | ---------------- | ---------------- |
| GET    | `/users`       | Get all users    | `users.findAll`  | `User[]`         |
| GET    | `/users/recap` | Get yearly recap | `users.getRecap` | `RecapResult[]`  |
| GET    | `/users/:id`   | Get single user  | `users.findOne`  | `User`           |
| POST   | `/users`       | Create new user  | `users.create`   | `User`           |
| PUT    | `/users/:id`   | Update user      | `users.update`   | `User`           |
| DELETE | `/users/:id`   | Delete user      | `users.remove`   | `{ id: string }` |

**Example Gateway Usage:**

```bash
# Client connects to gateway only
GET http://localhost:3000/users?username_like=john

# Recap endpoint via gateway
GET http://localhost:3000/users/recap?year=2024&group_by=department,role

# Gateway forwards to user-service
# Client receives response from user-service
```

#### Service Layer (Message Patterns)

Each microservice handles message patterns internally.

| Pattern          | Payload                       | Handler                      | Response         |
| ---------------- | ----------------------------- | ---------------------------- | ---------------- |
| `users.findAll`  | `{ filters, page, limit }`    | `UsersController.findAll()`  | `User[]`         |
| `users.getRecap` | `{ year, group_by, filters }` | `UsersController.getRecap()` | `RecapResult[]`  |
| `users.findOne`  | `{ id: string }`              | `UsersController.findOne()`  | `User`           |
| `users.create`   | `CreateUserDto`               | `UsersController.create()`   | `User`           |
| `users.update`   | `{ id, ...UpdateUserDto }`    | `UsersController.update()`   | `User`           |
| `users.remove`   | `{ id: string }`              | `UsersController.remove()`   | `{ id: string }` |

**Microservices Communication Flow:**

```
┌─────────────┐         ┌─────────────┐         ┌──────────────┐
│   Client    │         │   Gateway   │         │ User Service │
│  (Browser)  │         │   :3000     │         │   :3001      │
└──────┬──────┘         └──────┬──────┘         └──────┬───────┘
       │                       │                        │
       │ GET /users?page=1     │                        │
       │──────────────────────>│                        │
       │                       │                        │
       │                       │ users.findAll          │
       │                       │ { filters, page }      │
       │                       │───────────────────────>│
       │                       │                        │
       │                       │                        │ Execute Query
       │                       │                        │ (Database)
       │                       │                        │
       │                       │      User[]            │
       │                       │<───────────────────────│
       │                       │                        │
       │      User[]           │                        │
       │<──────────────────────│                        │
       │                       │                        │
```

**Gateway Configuration:**

```typescript
// apps/gateway/src/modules/users/users.module.ts
import { Module } from '@nestjs/common';
import { ClientsModule, Transport } from '@nestjs/microservices';
import { UsersController } from './users.controller';

@Module({
  imports: [
    ClientsModule.register([
      {
        name: 'USER_SERVICE',
        transport: Transport.TCP,
        options: {
          host: 'localhost',
          port: 3001,
        },
      },
    ]),
  ],
  controllers: [UsersController],
})
export class UsersModule {}
```

**Gateway Controller Example:**

```typescript
// apps/gateway/src/modules/users/users.controller.ts
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  CreateUserDto,
  UpdateUserDto,
  UserFilterDto,
  UserRecapDto,
} from './users.dto';

@Controller('users')
export class UsersController {
  constructor(
    @Inject('USER_SERVICE') private readonly userService: ClientProxy,
  ) {}

  @Get()
  async findAll(
    @Query() filters: UserFilterDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.userService.send('users.findAll', { filters, page, limit });
  }

  // GENERATED_ENDPOINT_START: recap
  @Get('recap')
  async getRecap(@Query() dto: UserRecapDto) {
    return this.userService.send('users.getRecap', dto);
  }
  // GENERATED_ENDPOINT_END: recap

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.userService.send('users.findOne', { id });
  }

  @Post()
  async create(@Body() dto: CreateUserDto) {
    return this.userService.send('users.create', dto);
  }

  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.userService.send('users.update', { id, ...dto });
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.userService.send('users.remove', { id });
  }
}
```

**Service Main File:**

```typescript
// apps/user-service/src/main.ts
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
  console.log('User Service is listening on port 3001');
}
bootstrap();
```

**Service Controller Example:**

```typescript
// apps/user-service/src/modules/users/users.controller.ts
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @MessagePattern('users.findAll')
  async findAll(@Payload() data: any) {
    const { filters, page, limit } = data;
    return this.service.findAll(filters, page, limit);
  }

  // GENERATED_HANDLER_START: recap
  @MessagePattern('users.getRecap')
  async getRecap(@Payload() dto: UserRecapDto) {
    return this.service.getYearlyRecap(dto);
  }
  // GENERATED_HANDLER_END: recap

  @MessagePattern('users.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }

  @MessagePattern('users.create')
  async create(@Payload() dto: CreateUserDto) {
    return this.service.create(dto, 'system');
  }

  @MessagePattern('users.update')
  async update(@Payload() data: any) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }

  @MessagePattern('users.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
}
```

**Multiple Services Configuration:**

```json
// generator.config.json
{
  "architecture": "microservices",
  "microservices": {
    "gatewayApp": "gateway",
    "transport": "TCP",
    "services": [
      {
        "name": "user-service",
        "schemas": ["user"],
        "port": 3001
      },
      {
        "name": "product-service",
        "schemas": ["product", "inventory"],
        "port": 3002
      },
      {
        "name": "order-service",
        "schemas": ["order", "payment"],
        "port": 3003
      }
    ]
  }
}
```

**Multi-Service Endpoints:**

```bash
# Gateway (port 3000)
GET http://localhost:3000/users          → user-service:3001
GET http://localhost:3000/products       → product-service:3002
GET http://localhost:3000/orders         → order-service:3003

# Each service handles its own domain
# Services communicate internally via TCP
# Client only knows about Gateway
```

**Transport Options:**

Generator supports multiple transport layers:

```typescript
// TCP (default)
{
  transport: Transport.TCP,
  options: { host: 'localhost', port: 3001 }
}

// Redis
{
  transport: Transport.REDIS,
  options: { host: 'localhost', port: 6379 }
}

// MQTT
{
  transport: Transport.MQTT,
  options: { url: 'mqtt://localhost:1883' }
}

// RabbitMQ
{
  transport: Transport.RMQ,
  options: {
    urls: ['amqp://localhost:5672'],
    queue: 'users_queue'
  }
}

// NATS
{
  transport: Transport.NATS,
  options: { servers: ['nats://localhost:4222'] }
}
```

**Event Patterns (Optional):**

Besides request-response, services can emit events:

```typescript
// user-service emits event
@MessagePattern('users.create')
async create(@Payload() dto: CreateUserDto) {
  const user = await this.service.create(dto, 'system');

  // Emit event to other services
  this.client.emit('user.created', user);

  return user;
}

// notification-service listens to event
@EventPattern('user.created')
async handleUserCreated(@Payload() user: any) {
  await this.emailService.sendWelcomeEmail(user.email);
}
```

**Recap Endpoint in Microservices:**

The recap endpoint works seamlessly in microservices:

1. **Gateway**: Exposes REST endpoint `/users/recap`
2. **Service**: Handles message pattern `users.getRecap`
3. **Database**: Executes aggregation query
4. **Response**: Returns through gateway to client

Communication flow:

```
Client → Gateway (REST) → User-Service (Message) → Database → Response
```

---

## Metadata Configuration for Recap

To enable the recap endpoint, certain columns in `column_metadata` must be properly configured.

### Required Metadata Settings

**Groupable Columns:**

Columns that can be used in `group_by` parameter should have:

```sql
-- Mark columns as groupable
UPDATE meta.column_metadata
SET
  is_filterable = true,        -- Must be filterable
  display_in_list = true,      -- Display in UI
  input_type = 'select'        -- UI hint (optional)
WHERE table_metadata_id = '<table_id>'
  AND column_name IN ('department', 'role', 'status', 'region');
```

**Date Column for Year Filter:**

The recap uses `created_at` by default, but can be configured:

```sql
-- Add metadata flag for date grouping
UPDATE meta.column_metadata
SET validation_rules = jsonb_build_object(
  'use_for_recap', true,
  'date_field', 'created_at'
)
WHERE table_metadata_id = '<table_id>'
  AND column_name = 'created_at';
```

### Example Metadata Setup

```sql
-- 1. Create table metadata
INSERT INTO meta.table_metadata (
  schema_name, table_name, table_purpose,
  has_soft_delete, created_by
) VALUES (
  'user', 'users', 'User management with yearly recap support',
  true, '00000000-0000-0000-0000-000000000000'
) RETURNING id;

-- Assuming returned id: 'abc123-...'

-- 2. Add groupable columns
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type,
  is_nullable, is_required, is_filterable, is_searchable,
  display_in_list, column_order, created_by
) VALUES
  -- Groupable field 1
  ('abc123-...', 'department', 'varchar', false, true, true, true, true, 1, '00000000-0000-0000-0000-000000000000'),

  -- Groupable field 2
  ('abc123-...', 'role', 'varchar', false, true, true, true, true, 2, '00000000-0000-0000-0000-000000000000'),

  -- Groupable field 3
  ('abc123-...', 'status', 'varchar', false, true, true, false, true, 3, '00000000-0000-0000-0000-000000000000'),

  -- Date field for year filtering
  ('abc123-...', 'created_at', 'timestamp', false, true, true, false, true, 10, '00000000-0000-0000-0000-000000000000');
```

### Validation Rules

The generator validates group_by fields against metadata:

```typescript
// Only columns with is_filterable = true can be grouped
const validGroupByFields = columns
  .filter((col) => col.is_filterable === true)
  .map((col) => col.column_name);

// User input
const requestedFields = ['department', 'role'];

// Validation
if (!requestedFields.every((f) => validGroupByFields.includes(f))) {
  throw new BadRequestException('Invalid group_by fields');
}
```

### Custom Recap Configuration

Add custom configuration to table metadata:

```sql
-- Add recap configuration to table metadata
UPDATE meta.table_metadata
SET validation_rules = jsonb_build_object(
  'recap', jsonb_build_object(
    'enabled', true,
    'default_group_by', 'department',
    'max_groups', 2,
    'groupable_fields', jsonb_build_array('department', 'role', 'status', 'region'),
    'date_field', 'created_at',
    'aggregate_function', 'COUNT'
  )
)
WHERE schema_name = 'user' AND table_name = 'users';
```

Generator reads this configuration:

```typescript
// libs/generator/src/generators/controller/recap.generator.ts

function generateRecapEndpoint(tableMetadata: TableMetadata): string {
  const recapConfig = tableMetadata.validation_rules?.recap;

  if (!recapConfig?.enabled) {
    return ''; // Skip recap endpoint
  }

  const groupableFields = recapConfig.groupable_fields || [];
  const dateField = recapConfig.date_field || 'created_at';
  const maxGroups = recapConfig.max_groups || 2;

  // Generate endpoint code...
}
```

---

## Database Support

### PostgreSQL

- Native `pg` driver
- UUID v7 support
- JSONB columns
- Advanced filtering

### MySQL

- Native `mysql2` driver
- Type mapping
- JSON columns
- Optimized queries

---

## Metadata Schema

The generator uses metadata tables to define the structure and behavior of generated modules.

### Table: `meta.table_metadata`

Stores information about each table to be generated.

```sql
CREATE TABLE "meta"."table_metadata" (
    "id" uuid NOT NULL DEFAULT uuidv7(),
    "schema_name" varchar(50) NOT NULL,
    "table_name" varchar(100) NOT NULL,
    "table_type" varchar(50),
    "table_purpose" text,
    "has_soft_delete" bool NOT NULL DEFAULT false,
    "has_created_by" bool NOT NULL DEFAULT true,
    "primary_key_column" varchar(50) NOT NULL DEFAULT 'id',
    "primary_key_type" varchar(50) NOT NULL DEFAULT 'UUID',
    "is_partitioned" bool NOT NULL DEFAULT false,
    "partition_strategy" varchar(50),
    "partition_key" varchar(50),
    "model_class" varchar(255),
    "controller_class" varchar(255),
    "request_class" varchar(255),
    "resource_class" varchar(255),
    "status" varchar(20) NOT NULL DEFAULT 'active',
    "cache_ttl" int4 DEFAULT 300,
    "cache_enabled" bool DEFAULT true,
    "throttle_limit" int4 DEFAULT 100,
    "throttle_ttl" int4 DEFAULT 60000,
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp,
    PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX table_metadata_schema_name_table_name_key
ON meta.table_metadata USING btree (schema_name, table_name);

CREATE INDEX idx_table_metadata_status
ON meta.table_metadata USING btree (status);

CREATE INDEX idx_table_metadata_created_at
ON meta.table_metadata USING btree (created_at);
```

**Field Analysis:**

| Field                | Type         | Purpose                                                         |
| -------------------- | ------------ | --------------------------------------------------------------- |
| `id`                 | UUID         | Primary key, auto-generated using UUID v7                       |
| `schema_name`        | VARCHAR(50)  | Database schema (e.g., 'user', 'product', 'master')             |
| `table_name`         | VARCHAR(100) | Actual table name in database                                   |
| `table_type`         | VARCHAR(50)  | Classification: 'master', 'transaction', 'log', etc.            |
| `table_purpose`      | TEXT         | Human-readable description of table purpose                     |
| `has_soft_delete`    | BOOLEAN      | Generate soft delete (deleted_at column) instead of hard delete |
| `has_created_by`     | BOOLEAN      | Include created_by tracking in generated code                   |
| `primary_key_column` | VARCHAR(50)  | Name of PK column (default: 'id')                               |
| `primary_key_type`   | VARCHAR(50)  | PK data type: 'UUID', 'BIGINT', 'INTEGER'                       |
| `is_partitioned`     | BOOLEAN      | Whether table uses partitioning                                 |
| `partition_strategy` | VARCHAR(50)  | Partition type: 'range', 'list', 'hash'                         |
| `partition_key`      | VARCHAR(50)  | Column used for partitioning                                    |
| `model_class`        | VARCHAR(255) | Override default model/entity class name                        |
| `controller_class`   | VARCHAR(255) | Override default controller class name                          |
| `request_class`      | VARCHAR(255) | Override default DTO/request class name                         |
| `resource_class`     | VARCHAR(255) | Override default resource/response class name                   |
| `status`             | VARCHAR(20)  | Metadata status: 'active', 'inactive', 'deprecated'             |
| `cache_ttl`          | INTEGER      | Cache time-to-live in seconds (default: 300)                    |
| `cache_enabled`      | BOOLEAN      | Enable/disable caching for this table                           |
| `throttle_limit`     | INTEGER      | Max requests per window (default: 100)                          |
| `throttle_ttl`       | INTEGER      | Throttle window in milliseconds (default: 60000)                |
| `created_at`         | TIMESTAMP    | When metadata was created                                       |
| `updated_at`         | TIMESTAMP    | Last metadata modification                                      |

### Table: `meta.column_metadata`

Defines columns for each table with validation and display rules.

```sql
CREATE TABLE "meta"."column_metadata" (
    "id" uuid NOT NULL DEFAULT uuidv7(),
    "table_metadata_id" uuid NOT NULL,
    "column_name" varchar(100) NOT NULL,
    "data_type" varchar(50) NOT NULL,
    "is_nullable" bool NOT NULL DEFAULT false,
    "default_value" text,
    "is_unique" bool NOT NULL DEFAULT false,
    "is_primary_key" bool NOT NULL DEFAULT false,

    -- Foreign Key Reference
    "ref_schema" varchar(50),
    "ref_table" varchar(100),
    "ref_column" varchar(100),

    -- Query Features
    "is_filterable" bool NOT NULL DEFAULT false,
    "is_searchable" bool NOT NULL DEFAULT false,

    -- Validation
    "validation_rules" jsonb,
    "is_required" bool NOT NULL DEFAULT false,
    "max_length" int4,
    "min_value" numeric,
    "max_value" numeric,
    "enum_values" jsonb,

    -- UI/Display
    "input_type" varchar(50),
    "display_in_list" bool NOT NULL DEFAULT true,
    "display_in_form" bool NOT NULL DEFAULT true,
    "display_in_detail" bool NOT NULL DEFAULT true,
    "description" text,
    "column_order" int4 NOT NULL DEFAULT 0,

    -- File Upload
    "is_file_upload" bool DEFAULT false,
    "file_upload_config" jsonb,

    -- Swagger/API Documentation
    "swagger_example" text,
    "swagger_description" text,
    "swagger_hidden" bool DEFAULT false,

    -- Audit
    "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" timestamp,

    CONSTRAINT "fk_column_metadata_table_id"
        FOREIGN KEY ("table_metadata_id")
        REFERENCES "meta"."table_metadata"("id")
        ON DELETE CASCADE ON UPDATE CASCADE,
    PRIMARY KEY ("id")
);

CREATE INDEX idx_column_metadata_table_id
ON meta.column_metadata USING btree (table_metadata_id);

CREATE INDEX idx_column_metadata_column_name
ON meta.column_metadata USING btree (column_name);

CREATE INDEX idx_column_metadata_is_filterable
ON meta.column_metadata USING btree (is_filterable) WHERE is_filterable = true;

CREATE INDEX idx_column_metadata_is_searchable
ON meta.column_metadata USING btree (is_searchable) WHERE is_searchable = true;
```

**Field Analysis:**

| Field                  | Type         | Purpose                                                        |
| ---------------------- | ------------ | -------------------------------------------------------------- |
| `id`                   | UUID         | Primary key, auto-generated                                    |
| `table_metadata_id`    | UUID         | Foreign key to table_metadata                                  |
| `column_name`          | VARCHAR(100) | Actual column name in database table                           |
| `data_type`            | VARCHAR(50)  | Database type: 'varchar', 'integer', 'uuid', 'timestamp', etc. |
| `is_nullable`          | BOOLEAN      | Whether NULL values are allowed                                |
| `default_value`        | TEXT         | Default value for column                                       |
| `is_unique`            | BOOLEAN      | Enforce unique constraint                                      |
| `is_primary_key`       | BOOLEAN      | Mark as primary key column                                     |
| **Foreign Key Fields** |              |                                                                |
| `ref_schema`           | VARCHAR(50)  | Referenced table schema for foreign keys                       |
| `ref_table`            | VARCHAR(100) | Referenced table name (triggers JOIN generation)               |
| `ref_column`           | VARCHAR(100) | Referenced column (usually 'id')                               |
| **Query Features**     |              |                                                                |
| `is_filterable`        | BOOLEAN      | Generate filter parameters (\_eq, \_like, \_in, etc.)          |
| `is_searchable`        | BOOLEAN      | Include in global search functionality                         |
| **Validation**         |              |                                                                |
| `validation_rules`     | JSONB        | JSON object with validation rules (see Validation section)     |
| `is_required`          | BOOLEAN      | Required field (generates `@IsNotEmpty()`)                     |
| `max_length`           | INTEGER      | Maximum string length (generates `@MaxLength()`)               |
| `min_value`            | NUMERIC      | Minimum numeric value (generates `@Min()`)                     |
| `max_value`            | NUMERIC      | Maximum numeric value (generates `@Max()`)                     |
| `enum_values`          | JSONB        | Array of allowed values (generates `@IsEnum()`)                |
| **UI/Display**         |              |                                                                |
| `input_type`           | VARCHAR(50)  | HTML input type: 'text', 'email', 'number', 'date', 'select'   |
| `display_in_list`      | BOOLEAN      | Include in list/index queries (SELECT clause)                  |
| `display_in_form`      | BOOLEAN      | Include in create/update forms (DTO)                           |
| `display_in_detail`    | BOOLEAN      | Include in detail/show queries                                 |
| `description`          | TEXT         | Column description for documentation                           |
| `column_order`         | INTEGER      | Display order in forms/lists                                   |
| **File Upload**        |              |                                                                |
| `is_file_upload`       | BOOLEAN      | Mark as file upload field                                      |
| `file_upload_config`   | JSONB        | Upload settings: `{ maxSize, mimeTypes, storage, bucket }`     |
| **Swagger/API Docs**   |              |                                                                |
| `swagger_example`      | TEXT         | Example value for API documentation                            |
| `swagger_description`  | TEXT         | Field description in Swagger UI                                |
| `swagger_hidden`       | BOOLEAN      | Hide from API documentation                                    |
| **Audit**              |              |                                                                |
| `created_at`           | TIMESTAMP    | Metadata creation time                                         |
| `updated_at`           | TIMESTAMP    | Last metadata update                                           |

**Validation Rules JSONB Structure:**

```json
{
  "pattern": "^[a-zA-Z0-9_]+$",
  "min_length": 3,
  "max_length": 50,
  "email": true,
  "phone": true,
  "url": true,
  "custom_validators": ["IsStrongPassword", "IsAlphanumeric"]
}
```

**File Upload Config JSONB Structure:**

```json
{
  "maxSize": 5242880,
  "mimeTypes": ["image/jpeg", "image/png", "image/gif"],
  "storage": "s3",
  "bucket": "user-avatars",
  "path": "uploads/avatars"
}
```

---

## CLI Commands

### Initialization

```bash
# Initialize generator configuration
nest-generator init

# Prompts:
# - Architecture type: standalone | monorepo | microservices
# - Database type: postgresql | mysql
# - Database connection details
# - For microservices: Select gateway app
# - Metadata schema setup (create if not exists)
```

**Initialization Process:**

The `init` command performs the following automated setup:

1. **Configuration File Creation**
   - Creates `generator.config.json` with user inputs
   - Updates or creates `.env` file with database credentials

2. **Database Connection Test**
   - Tests connection to database using provided credentials
   - Validates database exists and is accessible
   - Displays connection status and database info

3. **Automatic Metadata Schema Setup**
   - Checks if metadata schema (`meta`) exists
   - If not exists, creates schema automatically
   - Creates required metadata tables:
     - `meta.table_metadata`
     - `meta.column_metadata`
     - `meta.generated_files` (for checksum tracking)
   - Creates necessary indexes for performance
   - Inserts initial system data (if needed)

4. **User Table Validation** (for foreign keys)
   - Checks if `user.users` table exists (required for `created_by` FK)
   - If not exists, offers to:
     - Create basic users table
     - Skip (manual setup required)
     - Use different table for audit tracking

5. **Database Functions Setup** (PostgreSQL only)
   - Creates `uuidv7()` function if not exists
   - Creates audit trigger functions (optional)
   - Creates helper functions for metadata queries

6. **Verification & Summary**
   - Lists all created objects (schema, tables, indexes, functions)
   - Displays sample metadata insert queries
   - Shows next steps for user

**Generated files:**

- `generator.config.json` - Configuration file
- `.env` update - Database credentials
- Metadata schema and tables (automatically created)

**Example Init Flow:**

```bash
$ nest-generator init

🚀 NestJS Generator Initialization

? Select architecture type: (Use arrow keys)
❯ Standalone - Single application
  Monorepo - Multiple apps with shared libs
  Microservices - Distributed services with gateway

? Select database type: (Use arrow keys)
❯ PostgreSQL
  MySQL

? Database host: localhost
? Database port: 5432
? Database name: myapp
? Database username: postgres
? Database password: ••••••••

✓ Testing database connection...
✓ Connected to PostgreSQL 16.1

? Metadata schema not found. Create automatically? (Y/n) Y

⏳ Setting up metadata schema...
✓ Created schema: meta
✓ Created table: meta.table_metadata
✓ Created table: meta.column_metadata
✓ Created table: meta.generated_files
✓ Created index: table_metadata_schema_name_table_name_key
✓ Created index: idx_table_metadata_created_by
✓ Created function: uuidv7()

⚠ Warning: Table 'user.users' not found (required for audit tracking)

? Create basic users table? (Y/n) Y

✓ Created schema: user
✓ Created table: user.users
✓ Inserted system user (id: 00000000-0000-0000-0000-000000000000)

? Select gateway app (for microservices): gateway

✓ Configuration saved to: generator.config.json
✓ Environment updated: .env

📋 Setup Complete!

Next steps:
1. Populate metadata tables:
   INSERT INTO meta.table_metadata (schema_name, table_name, ...) VALUES (...);
   INSERT INTO meta.column_metadata (table_metadata_id, column_name, ...) VALUES (...);

2. Generate your first module:
   nest-generator generate <schema>.<table>

3. View generated files in: src/modules/

For help: nest-generator --help
```

### Module Generation

```bash
# Generate module from metadata
nest-generator generate <schema>.<table>

# Example:
nest-generator generate user.users
```

**Generated files (architecture-dependent):**

**Standalone/Monorepo:**

- `src/modules/users/users.dto.ts` - DTOs for create/update
- `src/modules/users/users.query.ts` - SQL queries
- `src/modules/users/users.repository.ts` - Database operations
- `src/modules/users/users.service.ts` - Business logic
- `src/modules/users/users.controller.ts` - REST endpoints
- `src/modules/users/users.module.ts` - NestJS module

**Microservices:**

Gateway app (`apps/gateway/`):

- `src/modules/users/users.controller.ts` - REST endpoints (proxies to service)
- `src/modules/users/users.module.ts` - Gateway module

Service app (`apps/user-service/`):

- `src/modules/users/users.dto.ts` - DTOs
- `src/modules/users/users.query.ts` - SQL queries
- `src/modules/users/users.repository.ts` - Database operations
- `src/modules/users/users.service.ts` - Business logic
- `src/modules/users/users.controller.ts` - Message pattern handlers
- `src/modules/users/users.module.ts` - Service module

### Other Commands

```bash
# Sync all modules (regenerate based on metadata)
nest-generator sync

# Check for metadata changes
nest-generator check

# List all generated modules
nest-generator list

# Remove generated module
nest-generator remove <schema>.<table>
```

---

## Code Generation Details

### 1. DTO Generation (`users.dto.ts`)

Generated from `column_metadata` with class-validator decorators.

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsUUID,
  MinLength,
  MaxLength,
  IsBoolean,
  IsNumber,
  Min,
  Max,
  IsEnum,
  IsArray,
} from 'class-validator';

export class CreateUserDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username: string;

  @IsEmail()
  email: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsBoolean()
  is_active: boolean;

  // CUSTOM_CODE_START: additional-properties
  // Add your custom properties here
  // CUSTOM_CODE_END: additional-properties
}

export class UpdateUserDto {
  @IsOptional()
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  username?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  full_name?: string;

  @IsOptional()
  @IsBoolean()
  is_active?: boolean;

  // CUSTOM_CODE_START: additional-update-properties
  // Add your custom properties here
  // CUSTOM_CODE_END: additional-update-properties
}

export class UserFilterDto {
  @IsOptional()
  @IsString()
  username_eq?: string;

  @IsOptional()
  @IsString()
  username_like?: string;

  @IsOptional()
  @IsString()
  email_eq?: string;

  // CUSTOM_CODE_START: additional-filters
  // Add your custom filters here
  // CUSTOM_CODE_END: additional-filters
}

// CUSTOM_CODE_START: additional-dtos
// Add your custom DTOs here
// CUSTOM_CODE_END: additional-dtos
```

**Validation mapping from metadata:**

All validation decorators are generated from `column_metadata` table fields:

**From Column Metadata Fields:**

- `is_required` → `@IsNotEmpty()`
- `max_length` → `@MaxLength(n)`
- `min_value` → `@Min(n)`
- `max_value` → `@Max(n)`
- `enum_values` → `@IsEnum(EnumType)`
- `is_nullable` → `@IsOptional()` (if true)
- `is_unique` → Unique validation (custom validator)
- `data_type` → Type-specific validators:
  - `varchar`, `text` → `@IsString()`
  - `int`, `bigint`, `numeric` → `@IsNumber()`
  - `bool` → `@IsBoolean()`
  - `uuid` → `@IsUUID()`
  - `timestamp`, `date` → `@IsDateString()`
  - `jsonb`, `json` → `@IsObject()` or `@IsArray()`

**From validation_rules Field (JSON/JSONB):**

The `validation_rules` field in `column_metadata` can contain custom validation configurations:

```sql
-- Example validation_rules in column_metadata
{
  "pattern": "^[A-Za-z0-9]+$",           -- Regex pattern
  "min_length": 3,                       -- Minimum string length
  "custom_validators": ["IsUnique"],     -- Custom validator names
  "email": true,                         -- Email validation
  "url": true,                           -- URL validation
  "phone": true,                         -- Phone validation
  "custom_message": "Invalid username"   -- Custom error message
}
```

**Validation Rules Generator:**

```typescript
// libs/generator/src/generators/dto/validator.mapper.ts

function generateValidators(column: ColumnMetadata): string[] {
  const validators: string[] = [];

  // 1. From direct column fields
  if (column.is_required && !column.is_nullable) {
    validators.push('@IsNotEmpty()');
  }

  if (column.is_nullable || !column.is_required) {
    validators.push('@IsOptional()');
  }

  if (column.max_length) {
    validators.push(`@MaxLength(${column.max_length})`);
  }

  if (column.min_value !== null) {
    validators.push(`@Min(${column.min_value})`);
  }

  if (column.max_value !== null) {
    validators.push(`@Max(${column.max_value})`);
  }

  if (column.enum_values) {
    const enumName = toPascalCase(column.column_name) + 'Enum';
    validators.push(`@IsEnum(${enumName})`);
  }

  // 2. From validation_rules JSON field
  if (column.validation_rules) {
    const rules =
      typeof column.validation_rules === 'string'
        ? JSON.parse(column.validation_rules)
        : column.validation_rules;

    // Pattern validation
    if (rules.pattern) {
      validators.push(
        `@Matches(/${rules.pattern}/, { message: '${rules.custom_message || 'Invalid format'}' })`,
      );
    }

    // Min length
    if (rules.min_length) {
      validators.push(`@MinLength(${rules.min_length})`);
    }

    // Email validation
    if (rules.email) {
      validators.push('@IsEmail()');
    }

    // URL validation
    if (rules.url) {
      validators.push('@IsUrl()');
    }

    // Phone validation
    if (rules.phone) {
      validators.push('@IsPhoneNumber()');
    }

    // Custom validators
    if (rules.custom_validators) {
      rules.custom_validators.forEach((validatorName: string) => {
        validators.push(`@${validatorName}()`);
      });
    }

    // Date range
    if (rules.min_date) {
      validators.push(`@MinDate(new Date('${rules.min_date}'))`);
    }

    if (rules.max_date) {
      validators.push(`@MaxDate(new Date('${rules.max_date}'))`);
    }

    // Array validation
    if (rules.array_min_size) {
      validators.push(`@ArrayMinSize(${rules.array_min_size})`);
    }

    if (rules.array_max_size) {
      validators.push(`@ArrayMaxSize(${rules.array_max_size})`);
    }
  }

  // 3. Type-based validators
  validators.push(getTypeValidator(column.data_type));

  return validators;
}

function getTypeValidator(dataType: string): string {
  const typeMap: Record<string, string> = {
    varchar: '@IsString()',
    text: '@IsString()',
    char: '@IsString()',
    int: '@IsInt()',
    integer: '@IsInt()',
    bigint: '@IsNumber()',
    numeric: '@IsNumber()',
    decimal: '@IsNumber()',
    float: '@IsNumber()',
    double: '@IsNumber()',
    bool: '@IsBoolean()',
    boolean: '@IsBoolean()',
    uuid: '@IsUUID()',
    timestamp: '@IsDateString()',
    date: '@IsDateString()',
    time: '@IsString()',
    jsonb: '@IsObject()',
    json: '@IsObject()',
  };

  return typeMap[dataType.toLowerCase()] || '@IsString()';
}
```

**Example Metadata with Validation Rules:**

```sql
-- Insert column with complex validation rules
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required,
  is_nullable,
  max_length,
  validation_rules,
  created_by
) VALUES (
  'abc123-...',
  'username',
  'varchar',
  true,
  false,
  50,
  '{
    "min_length": 3,
    "pattern": "^[a-zA-Z0-9_]+$",
    "custom_message": "Username must contain only letters, numbers, and underscores",
    "custom_validators": ["IsUnique"]
  }'::jsonb,
  '00000000-0000-0000-0000-000000000000'
);

-- Insert email column with validation
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_required,
  validation_rules,
  created_by
) VALUES (
  'abc123-...',
  'email',
  'varchar',
  true,
  '{
    "email": true,
    "custom_validators": ["IsUniqueEmail"]
  }'::jsonb,
  '00000000-0000-0000-0000-000000000000'
);

-- Insert phone column with validation
INSERT INTO meta.column_metadata (
  table_metadata_id,
  column_name,
  data_type,
  is_nullable,
  validation_rules,
  created_by
) VALUES (
  'abc123-...',
  'phone',
  'varchar',
  true,
  '{
    "phone": true,
    "pattern": "^\\+?[1-9]\\d{1,14}$",
    "custom_message": "Invalid phone number format"
  }'::jsonb,
  '00000000-0000-0000-0000-000000000000'
);
```

**Generated DTO with Validation Rules:**

```typescript
import {
  IsString,
  IsEmail,
  IsOptional,
  IsNotEmpty,
  MinLength,
  MaxLength,
  Matches,
  IsPhoneNumber,
} from 'class-validator';
import { IsUnique, IsUniqueEmail } from '../validators';

export class CreateUserDto {
  @IsNotEmpty()
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  @Matches(/^[a-zA-Z0-9_]+$/, {
    message: 'Username must contain only letters, numbers, and underscores',
  })
  @IsUnique('users', 'username')
  username: string;

  @IsNotEmpty()
  @IsEmail()
  @IsUniqueEmail()
  email: string;

  @IsOptional()
  @IsString()
  @IsPhoneNumber()
  @Matches(/^\+?[1-9]\d{1,14}$/, {
    message: 'Invalid phone number format',
  })
  phone?: string;
}
```

**Supported Validation Rules:**

| Rule Key            | Type    | Example        | Generates                  |
| ------------------- | ------- | -------------- | -------------------------- |
| `pattern`           | string  | `"^[A-Z]+$"`   | `@Matches(/^[A-Z]+$/)`     |
| `min_length`        | number  | `3`            | `@MinLength(3)`            |
| `email`             | boolean | `true`         | `@IsEmail()`               |
| `url`               | boolean | `true`         | `@IsUrl()`                 |
| `phone`             | boolean | `true`         | `@IsPhoneNumber()`         |
| `custom_validators` | array   | `["IsUnique"]` | `@IsUnique()`              |
| `custom_message`    | string  | `"Invalid"`    | Added to validator message |
| `min_date`          | string  | `"2024-01-01"` | `@MinDate(new Date(...))`  |
| `max_date`          | string  | `"2024-12-31"` | `@MaxDate(new Date(...))`  |
| `array_min_size`    | number  | `1`            | `@ArrayMinSize(1)`         |
| `array_max_size`    | number  | `10`           | `@ArrayMaxSize(10)`        |

### 2. Query Generation (`users.query.ts`)

All SQL queries in one file for easy maintenance. Queries are generated based on `column_metadata` configuration.

**Query Generation Rules:**

1. **SELECT columns**: Only columns with `display_in_list = true` or `display_in_detail = true`
2. **INSERT columns**: Only columns with `display_in_form = true` and not `is_primary_key`
3. **UPDATE columns**: Only columns with `display_in_form = true` and not `is_primary_key`
4. **WHERE filters**: Only columns with `is_filterable = true`
5. **SEARCH**: Only columns with `is_searchable = true`
6. **ORDER BY**: Determined by `column_order`

**Generated Query Example:**

```typescript
export const UsersQueries = {
  // GENERATED_QUERY_START: find-all
  // Generated from columns where display_in_list = true
  findAll: `
    SELECT 
      id, username, email, full_name, is_active,
      department, role, created_at, updated_at
    FROM user.users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `,
  // GENERATED_QUERY_END: find-all

  // GENERATED_QUERY_START: find-by-id
  // Generated from columns where display_in_detail = true
  findById: `
    SELECT 
      id, username, email, full_name, is_active,
      department, role, phone, address,
      created_at, updated_at, created_by
    FROM user.users
    WHERE id = $1 AND deleted_at IS NULL
  `,
  // GENERATED_QUERY_END: find-by-id

  // GENERATED_QUERY_START: create
  // Generated from columns where display_in_form = true AND is_primary_key = false
  create: `
    INSERT INTO user.users (
      username, email, full_name, is_active, 
      department, role, phone, address, created_by
    ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    RETURNING *
  `,
  // GENERATED_QUERY_END: create

  // GENERATED_QUERY_START: update
  // Generated from columns where display_in_form = true AND is_primary_key = false
  update: `
    UPDATE user.users 
    SET username = $1, email = $2, full_name = $3, 
        is_active = $4, department = $5, role = $6,
        phone = $7, address = $8, updated_at = CURRENT_TIMESTAMP
    WHERE id = $9 AND deleted_at IS NULL
    RETURNING *
  `,
  // GENERATED_QUERY_END: update

  // GENERATED_QUERY_START: soft-delete
  // Only generated if has_soft_delete = true in table_metadata
  softDelete: `
    UPDATE user.users 
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `,
  // GENERATED_QUERY_END: soft-delete

  // GENERATED_QUERY_START: hard-delete
  // Generated if has_soft_delete = false in table_metadata
  hardDelete: `
    DELETE FROM user.users 
    WHERE id = $1
    RETURNING id
  `,
  // GENERATED_QUERY_END: hard-delete

  // GENERATED_QUERY_START: search
  // Generated from columns where is_searchable = true
  search: `
    SELECT 
      id, username, email, full_name, department, role
    FROM user.users
    WHERE deleted_at IS NULL
      AND (
        username ILIKE $1 OR
        email ILIKE $1 OR
        full_name ILIKE $1 OR
        department ILIKE $1
      )
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,
  // GENERATED_QUERY_END: search

  // CUSTOM_QUERY_START: custom-queries
  // Add your custom queries here
  // CUSTOM_QUERY_END: custom-queries
};
```

**Query Generator Logic:**

```typescript
// libs/generator/src/generators/query/query.generator.ts

class QueryGenerator {
  generateQueries(
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    const queries: string[] = [];

    // 1. Generate SELECT columns for list view
    const listColumns = columns
      .filter((col) => col.display_in_list && !col.deleted_at)
      .sort((a, b) => a.column_order - b.column_order)
      .map((col) => col.column_name);

    // 2. Generate SELECT columns for detail view
    const detailColumns = columns
      .filter((col) => col.display_in_detail && !col.deleted_at)
      .sort((a, b) => a.column_order - b.column_order)
      .map((col) => col.column_name);

    // 3. Generate INSERT/UPDATE columns
    const formColumns = columns
      .filter(
        (col) =>
          col.display_in_form &&
          !col.is_primary_key &&
          !col.deleted_at &&
          !['created_at', 'updated_at', 'deleted_at'].includes(col.column_name),
      )
      .sort((a, b) => a.column_order - b.column_order);

    // 4. Generate searchable columns
    const searchableColumns = columns
      .filter((col) => col.is_searchable && !col.deleted_at)
      .map((col) => col.column_name);

    // 5. Build findAll query
    queries.push(`
  // GENERATED_QUERY_START: find-all
  findAll: \`
    SELECT 
      ${listColumns.join(', ')}
    FROM ${tableMetadata.schema_name}.${tableMetadata.table_name}
    WHERE ${tableMetadata.has_soft_delete ? 'deleted_at IS NULL' : '1=1'}
    ORDER BY ${this.getOrderByClause(columns)}
  \`,
  // GENERATED_QUERY_END: find-all
    `);

    // 6. Build findById query
    queries.push(`
  // GENERATED_QUERY_START: find-by-id
  findById: \`
    SELECT 
      ${detailColumns.join(', ')}
    FROM ${tableMetadata.schema_name}.${tableMetadata.table_name}
    WHERE ${tableMetadata.primary_key_column} = $1 
      ${tableMetadata.has_soft_delete ? 'AND deleted_at IS NULL' : ''}
  \`,
  // GENERATED_QUERY_END: find-by-id
    `);

    // 7. Build create query
    const insertColumns = formColumns.map((col) => col.column_name);
    if (tableMetadata.has_created_by) {
      insertColumns.push('created_by');
    }

    const placeholders = insertColumns.map((_, i) => `$${i + 1}`).join(', ');

    queries.push(`
  // GENERATED_QUERY_START: create
  create: \`
    INSERT INTO ${tableMetadata.schema_name}.${tableMetadata.table_name} (
      ${insertColumns.join(', ')}
    ) VALUES (${placeholders})
    RETURNING *
  \`,
  // GENERATED_QUERY_END: create
    `);

    // 8. Build update query
    const updateColumns = formColumns.map(
      (col, i) => `${col.column_name} = $${i + 1}`,
    );
    updateColumns.push('updated_at = CURRENT_TIMESTAMP');

    const updateParamIndex = formColumns.length + 1;

    queries.push(`
  // GENERATED_QUERY_START: update
  update: \`
    UPDATE ${tableMetadata.schema_name}.${tableMetadata.table_name}
    SET ${updateColumns.join(', ')}
    WHERE ${tableMetadata.primary_key_column} = $${updateParamIndex}
      ${tableMetadata.has_soft_delete ? 'AND deleted_at IS NULL' : ''}
    RETURNING *
  \`,
  // GENERATED_QUERY_END: update
    `);

    // 9. Build delete query (soft or hard)
    if (tableMetadata.has_soft_delete) {
      queries.push(`
  // GENERATED_QUERY_START: soft-delete
  softDelete: \`
    UPDATE ${tableMetadata.schema_name}.${tableMetadata.table_name}
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE ${tableMetadata.primary_key_column} = $1 AND deleted_at IS NULL
    RETURNING ${tableMetadata.primary_key_column}
  \`,
  // GENERATED_QUERY_END: soft-delete
      `);
    } else {
      queries.push(`
  // GENERATED_QUERY_START: hard-delete
  hardDelete: \`
    DELETE FROM ${tableMetadata.schema_name}.${tableMetadata.table_name}
    WHERE ${tableMetadata.primary_key_column} = $1
    RETURNING ${tableMetadata.primary_key_column}
  \`,
  // GENERATED_QUERY_END: hard-delete
      `);
    }

    // 10. Build search query if searchable columns exist
    if (searchableColumns.length > 0) {
      const searchConditions = searchableColumns
        .map((col) => `${col} ILIKE $1`)
        .join(' OR ');

      queries.push(`
  // GENERATED_QUERY_START: search
  search: \`
    SELECT 
      ${listColumns.join(', ')}
    FROM ${tableMetadata.schema_name}.${tableMetadata.table_name}
    WHERE ${tableMetadata.has_soft_delete ? 'deleted_at IS NULL AND' : ''} (
      ${searchConditions}
    )
    ORDER BY ${this.getOrderByClause(columns)}
    LIMIT $2 OFFSET $3
  \`,
  // GENERATED_QUERY_END: search
      `);
    }

    return `export const ${this.getPascalCase(tableMetadata.table_name)}Queries = {
${queries.join('\n')}

  // CUSTOM_QUERY_START: custom-queries
  // Add your custom queries here
  // CUSTOM_QUERY_END: custom-queries
};`;
  }

  private getOrderByClause(columns: ColumnMetadata[]): string {
    // Default order by created_at if exists, otherwise primary key
    const createdAtCol = columns.find(
      (col) => col.column_name === 'created_at',
    );
    if (createdAtCol) {
      return 'created_at DESC';
    }

    const primaryKey = columns.find((col) => col.is_primary_key);
    if (primaryKey) {
      return `${primaryKey.column_name} DESC`;
    }

    return columns[0]?.column_name || 'id';
  }
}
```

**Metadata-Driven Query Example:**

```sql
-- Metadata configuration determines query generation

-- Table metadata
INSERT INTO meta.table_metadata (
  schema_name, table_name, has_soft_delete, has_created_by,
  primary_key_column, created_by
) VALUES (
  'user', 'users', true, true, 'id',
  '00000000-0000-0000-0000-000000000000'
);

-- Column metadata (affects which columns appear in queries)
INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type,
  display_in_list,    -- Affects findAll SELECT
  display_in_form,    -- Affects INSERT/UPDATE
  display_in_detail,  -- Affects findById SELECT
  is_filterable,      -- Affects WHERE clauses
  is_searchable,      -- Affects search query
  column_order,       -- Affects column order
  created_by
) VALUES
  -- Primary key: always in SELECT, never in INSERT/UPDATE
  ('...', 'id', 'uuid', true, false, true, false, false, 0, '...'),

  -- Username: everywhere, filterable, searchable
  ('...', 'username', 'varchar', true, true, true, true, true, 1, '...'),

  -- Email: everywhere, filterable, searchable
  ('...', 'email', 'varchar', true, true, true, true, true, 2, '...'),

  -- Full name: in detail and form only, searchable
  ('...', 'full_name', 'varchar', false, true, true, false, true, 3, '...'),

  -- Department: everywhere, filterable
  ('...', 'department', 'varchar', true, true, true, true, false, 4, '...'),

  -- Internal notes: only in detail view
  ('...', 'internal_notes', 'text', false, false, true, false, false, 5, '...'),

  -- Created at: in list and detail, filterable (for date range)
  ('...', 'created_at', 'timestamp', true, false, true, true, false, 98, '...'),

  -- Updated at: in detail only
  ('...', 'updated_at', 'timestamp', false, false, true, false, false, 99, '...');
```

**Generated Queries Based on Above Metadata:**

```typescript
export const UsersQueries = {
  findAll: `
    SELECT id, username, email, department, created_at
    FROM user.users
    WHERE deleted_at IS NULL
    ORDER BY created_at DESC
  `,

  findById: `
    SELECT id, username, email, full_name, department, internal_notes,
           created_at, updated_at
    FROM user.users
    WHERE id = $1 AND deleted_at IS NULL
  `,

  create: `
    INSERT INTO user.users (
      username, email, full_name, department, created_by
    ) VALUES ($1, $2, $3, $4, $5)
    RETURNING *
  `,

  update: `
    UPDATE user.users
    SET username = $1, email = $2, full_name = $3, 
        department = $4, updated_at = CURRENT_TIMESTAMP
    WHERE id = $5 AND deleted_at IS NULL
    RETURNING *
  `,

  softDelete: `
    UPDATE user.users
    SET deleted_at = CURRENT_TIMESTAMP
    WHERE id = $1 AND deleted_at IS NULL
    RETURNING id
  `,

  search: `
    SELECT id, username, email, department, created_at
    FROM user.users
    WHERE deleted_at IS NULL AND (
      username ILIKE $1 OR
      email ILIKE $1 OR
      full_name ILIKE $1
    )
    ORDER BY created_at DESC
    LIMIT $2 OFFSET $3
  `,
};
```

---

## JOIN Query Generation with Foreign Keys

The generator automatically creates JOIN queries when columns have foreign key references defined in `column_metadata` (fields: `ref_schema`, `ref_table`, `ref_column`).

### Foreign Key Detection

**Metadata Configuration for Foreign Keys:**

```sql
-- Example: Users table with department and role foreign keys

INSERT INTO meta.column_metadata (
  table_metadata_id, column_name, data_type,
  is_nullable, is_required,
  -- Foreign key reference to departments table
  ref_schema, ref_table, ref_column,
  display_in_list, display_in_detail, display_in_form,
  is_filterable, column_order, created_by
) VALUES
  -- department_id with FK to departments table
  ('user-table-id', 'department_id', 'uuid', false, true,
   'master', 'departments', 'id',  -- FK definition
   true, true, true, true, 4, 'system-user-id'),

  -- role_id with FK to roles table
  ('user-table-id', 'role_id', 'uuid', true, false,
   'master', 'roles', 'id',  -- FK definition
   true, true, true, true, 5, 'system-user-id'),

  -- manager_id with self-referencing FK
  ('user-table-id', 'manager_id', 'uuid', true, false,
   'user', 'users', 'id',  -- Self-reference
   false, true, false, false, 6, 'system-user-id');
```

### JOIN Query Generation Rules

1. **Automatic JOIN Detection**: If `ref_schema`, `ref_table`, and `ref_column` are all set, generate JOIN
2. **JOIN Type**:
   - `is_nullable = false` → `INNER JOIN`
   - `is_nullable = true` → `LEFT JOIN`
3. **Alias Pattern**: `{ref_table}_alias` or `{ref_table}_on_{column_name}`
4. **Select Referenced Columns**: Automatically select common display columns from referenced table

### Enhanced Query Generator with JOINs

```typescript
// libs/generator/src/generators/query/join-query.generator.ts

interface JoinConfig {
  type: 'INNER' | 'LEFT';
  table: string;
  schema: string;
  alias: string;
  on: {
    localColumn: string;
    foreignColumn: string;
  };
  selectColumns: string[];
}

class JoinQueryGenerator {
  generateQueriesWithJoins(
    tableMetadata: TableMetadata,
    columns: ColumnMetadata[],
  ): string {
    // Detect foreign key columns
    const fkColumns = columns.filter(
      (col) => col.ref_schema && col.ref_table && col.ref_column,
    );

    // Build JOIN configurations
    const joins = this.buildJoinConfigs(fkColumns);

    // Generate queries with JOINs
    return this.generateQueries(tableMetadata, columns, joins);
  }

  private buildJoinConfigs(fkColumns: ColumnMetadata[]): JoinConfig[] {
    const joins: JoinConfig[] = [];
    const joinedTables = new Set<string>();

    for (const col of fkColumns) {
      const tableKey = `${col.ref_schema}.${col.ref_table}`;

      // Avoid duplicate joins to same table
      if (joinedTables.has(tableKey)) {
        // Use different alias for multiple joins to same table
        const alias = `${col.ref_table}_${col.column_name.replace('_id', '')}`;
        joins.push(this.createJoinConfig(col, alias));
      } else {
        const alias = col.ref_table;
        joins.push(this.createJoinConfig(col, alias));
        joinedTables.add(tableKey);
      }
    }

    return joins;
  }

  private createJoinConfig(col: ColumnMetadata, alias: string): JoinConfig {
    return {
      type: col.is_nullable ? 'LEFT' : 'INNER',
      table: col.ref_table!,
      schema: col.ref_schema!,
      alias: alias,
      on: {
        localColumn: col.column_name,
        foreignColumn: col.ref_column!,
      },
      selectColumns: this.getReferencedTableColumns(col.ref_table!),
    };
  }

  private getReferencedTableColumns(refTable: string): string[] {
    // Query metadata to get columns from referenced table
    // For now, use common display columns
    const commonColumns = ['id', 'name', 'code', 'title', 'description'];

    // In real implementation, query column_metadata for ref_table
    // and get columns where display_in_list = true
    return ['name']; // Simplified
  }

  private generateSelectWithJoins(
    mainTable: string,
    columns: ColumnMetadata[],
    joins: JoinConfig[],
  ): string {
    const selectParts: string[] = [];

    // Main table columns (non-FK columns or FK IDs if needed)
    const mainColumns = columns
      .filter((col) => col.display_in_list)
      .map((col) => {
        if (col.ref_table && !col.column_name.endsWith('_id')) {
          // Skip FK columns, we'll get data from join
          return null;
        }
        return `${mainTable}.${col.column_name}`;
      })
      .filter(Boolean);

    selectParts.push(...mainColumns);

    // Add referenced table columns with aliases
    for (const join of joins) {
      for (const refCol of join.selectColumns) {
        const fkColName = join.on.localColumn.replace('_id', '');
        selectParts.push(`${join.alias}.${refCol} AS ${fkColName}_${refCol}`);
      }
    }

    return selectParts.join(',\n      ');
  }

  private generateJoinClauses(mainTable: string, joins: JoinConfig[]): string {
    return joins
      .map(
        (join) => `
    ${join.type} JOIN ${join.schema}.${join.table} AS ${join.alias}
      ON ${mainTable}.${join.on.localColumn} = ${join.alias}.${join.on.foreignColumn}
      AND ${join.alias}.deleted_at IS NULL`,
      )
      .join('');
  }
}
```

### Generated Queries with JOINs

**Example 1: Users with Department and Role**

```sql
-- Metadata setup
-- users table has: department_id (FK to departments), role_id (FK to roles)

-- Column metadata
INSERT INTO meta.column_metadata VALUES
  ('...', 'department_id', 'uuid', false, true, 'master', 'departments', 'id', ...),
  ('...', 'role_id', 'uuid', true, false, 'master', 'roles', 'id', ...);
```

**Generated Query:**

```typescript
export const UsersQueries = {
  // GENERATED_QUERY_START: find-all-with-joins
  findAll: `
    SELECT 
      users.id,
      users.username,
      users.email,
      users.full_name,
      users.department_id,
      departments.name AS department_name,
      departments.code AS department_code,
      users.role_id,
      roles.name AS role_name,
      roles.code AS role_code,
      users.created_at,
      users.updated_at
    FROM user.users
    INNER JOIN master.departments
      ON users.department_id = departments.id
      AND departments.deleted_at IS NULL
    LEFT JOIN master.roles
      ON users.role_id = roles.id
      AND roles.deleted_at IS NULL
    WHERE users.deleted_at IS NULL
    ORDER BY users.created_at DESC
  `,
  // GENERATED_QUERY_END: find-all-with-joins

  // GENERATED_QUERY_START: find-by-id-with-joins
  findById: `
    SELECT 
      users.id,
      users.username,
      users.email,
      users.full_name,
      users.phone,
      users.address,
      users.department_id,
      departments.name AS department_name,
      departments.code AS department_code,
      departments.description AS department_description,
      users.role_id,
      roles.name AS role_name,
      roles.code AS role_code,
      roles.permissions AS role_permissions,
      users.manager_id,
      manager.username AS manager_username,
      manager.full_name AS manager_name,
      users.created_at,
      users.updated_at,
      users.created_by
    FROM user.users
    INNER JOIN master.departments
      ON users.department_id = departments.id
      AND departments.deleted_at IS NULL
    LEFT JOIN master.roles
      ON users.role_id = roles.id
      AND roles.deleted_at IS NULL
    LEFT JOIN user.users AS manager
      ON users.manager_id = manager.id
      AND manager.deleted_at IS NULL
    WHERE users.id = $1 
      AND users.deleted_at IS NULL
  `,
  // GENERATED_QUERY_END: find-by-id-with-joins
};
```

**Example 2: Orders with Customer, Product, and Status**

```sql
-- orders table with multiple foreign keys
INSERT INTO meta.column_metadata VALUES
  ('...', 'customer_id', 'uuid', false, true, 'customer', 'customers', 'id', ...),
  ('...', 'product_id', 'uuid', false, true, 'product', 'products', 'id', ...),
  ('...', 'status_id', 'uuid', false, true, 'master', 'order_statuses', 'id', ...),
  ('...', 'shipping_address_id', 'uuid', true, false, 'customer', 'addresses', 'id', ...);
```

**Generated Query:**

```typescript
export const OrdersQueries = {
  findAll: `
    SELECT 
      o.id,
      o.order_number,
      o.order_date,
      o.total_amount,
      o.customer_id,
      customers.name AS customer_name,
      customers.email AS customer_email,
      customers.phone AS customer_phone,
      orders.product_id,
      products.name AS product_name,
      products.sku AS product_sku,
      products.price AS product_price,
      orders.status_id,
      order_statuses.name AS status_name,
      order_statuses.code AS status_code,
      order_statuses.color AS status_color,
      orders.shipping_address_id,
      addresses.street AS shipping_street,
      addresses.city AS shipping_city,
      addresses.postal_code AS shipping_postal_code,
      orders.created_at
    FROM order.orders
    INNER JOIN customer.customers
      ON orders.customer_id = customers.id
      AND customers.deleted_at IS NULL
    INNER JOIN product.products
      ON orders.product_id = products.id
      AND products.deleted_at IS NULL
    INNER JOIN master.order_statuses
      ON orders.status_id = order_statuses.id
      AND order_statuses.deleted_at IS NULL
    LEFT JOIN customer.addresses
      ON orders.shipping_address_id = addresses.id
      AND addresses.deleted_at IS NULL
    WHERE orders.deleted_at IS NULL
    ORDER BY orders.created_at DESC
  `,
};
```

### Nested JOIN Support

For complex relationships, the generator supports nested JOINs:

```sql
-- Example: Users -> Department -> Division -> Company
INSERT INTO meta.column_metadata VALUES
  -- users.department_id -> departments
  ('users-table', 'department_id', 'uuid', false, true,
   'master', 'departments', 'id', ...),

  -- departments.division_id -> divisions (in departments metadata)
  ('dept-table', 'division_id', 'uuid', false, true,
   'master', 'divisions', 'id', ...),

  -- divisions.company_id -> companies (in divisions metadata)
  ('div-table', 'company_id', 'uuid', false, true,
   'master', 'companies', 'id', ...);
```

**Generated Query with Nested JOINs:**

```typescript
findAll: `
  SELECT
    users.id,
    users.username,
    users.email,
    departments.name AS department_name,
    divisions.name AS division_name,
    companies.name AS company_name,
    companies.code AS company_code
  FROM user.users
  INNER JOIN master.departments
    ON users.department_id = departments.id
  INNER JOIN master.divisions
    ON departments.division_id = divisions.id
  INNER JOIN master.companies
    ON divisions.company_id = companies.id
  WHERE users.deleted_at IS NULL
    AND departments.deleted_at IS NULL
    AND divisions.deleted_at IS NULL
    AND companies.deleted_at IS NULL
  ORDER BY users.created_at DESC
`,
```

### JOIN with Filters

Filters can be applied to both main table and joined tables:

```typescript
// GENERATED_METHOD_START: find-all-with-join-filters
async findAll(filters?: UserFilterDto, page = 1, limit = 10) {
  let query = `
    SELECT
      users.id, users.username, users.email,
      departments.name AS department_name,
      roles.name AS role_name
    FROM user.users
    INNER JOIN master.departments
      ON users.department_id = departments.id AND departments.deleted_at IS NULL
    LEFT JOIN master.roles
      ON users.role_id = roles.id AND roles.deleted_at IS NULL
    WHERE users.deleted_at IS NULL
  `;

  const params: any[] = [];
  let paramIndex = 1;
  const whereClauses: string[] = [];

  if (filters) {
    // Filter on main table
    if (filters.username_like) {
      whereClauses.push(`users.username ILIKE $${paramIndex++}`);
      params.push(`%${filters.username_like}%`);
    }

    if (filters.email_eq) {
      whereClauses.push(`users.email = $${paramIndex++}`);
      params.push(filters.email_eq);
    }

    // Filter on joined table (department)
    if (filters.department_name_like) {
      whereClauses.push(`departments.name ILIKE $${paramIndex++}`);
      params.push(`%${filters.department_name_like}%`);
    }

    if (filters.department_code_eq) {
      whereClauses.push(`departments.code = $${paramIndex++}`);
      params.push(filters.department_code_eq);
    }

    // Filter on joined table (role)
    if (filters.role_name_eq) {
      whereClauses.push(`roles.name = $${paramIndex++}`);
      params.push(filters.role_name_eq);
    }
  }

  if (whereClauses.length > 0) {
    query += ` AND ${whereClauses.join(' AND ')}`;
  }

  query += ` ORDER BY users.created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
  params.push(limit, (page - 1) * limit);

  const result = await this.pool.query(query, params);
  return result.rows;
}
// GENERATED_METHOD_END: find-all-with-join-filters
```

### DTO Generation with Foreign Keys

When foreign keys are detected, generate additional properties in DTOs:

```typescript
export class CreateUserDto {
  @IsString()
  @MinLength(3)
  username: string;

  @IsEmail()
  email: string;

  // Foreign key: department_id (required)
  @IsUUID()
  @IsNotEmpty()
  department_id: string;

  // Foreign key: role_id (optional)
  @IsUUID()
  @IsOptional()
  role_id?: string;

  // Foreign key: manager_id (optional, self-reference)
  @IsUUID()
  @IsOptional()
  manager_id?: string;
}

export class UserFilterDto {
  @IsOptional()
  @IsString()
  username_like?: string;

  // Filter on main table column
  @IsOptional()
  @IsUUID()
  department_id_eq?: string;

  // Filter on joined table column
  @IsOptional()
  @IsString()
  department_name_like?: string;

  @IsOptional()
  @IsString()
  department_code_eq?: string;

  @IsOptional()
  @IsString()
  role_name_eq?: string;
}

// Response DTO with joined data
export class UserResponseDto {
  id: string;
  username: string;
  email: string;

  // Foreign key ID
  department_id: string;

  // Joined department data
  department_name: string;
  department_code: string;

  // Optional foreign key
  role_id?: string;
  role_name?: string;
  role_code?: string;

  created_at: Date;
  updated_at: Date;
}
```

### Advanced JOIN Features

**1. Multiple JOINs to Same Table:**

```sql
-- users table with created_by and updated_by referencing users table
INSERT INTO meta.column_metadata VALUES
  ('...', 'created_by', 'uuid', false, true, 'user', 'users', 'id', ...),
  ('...', 'updated_by', 'uuid', true, false, 'user', 'users', 'id', ...);
```

Generated query uses different aliases:

```typescript
findById: `
  SELECT
    users.id, users.username,
    users.created_by,
    creator.username AS created_by_username,
    creator.full_name AS created_by_name,
    users.updated_by,
    updater.username AS updated_by_username,
    updater.full_name AS updated_by_name
  FROM user.users
  INNER JOIN user.users AS creator
    ON users.created_by = creator.id
  LEFT JOIN user.users AS updater
    ON users.updated_by = updater.id
  WHERE users.id = $1
`,
```

**2. Conditional JOINs:**

Based on metadata configuration, JOINs can be conditional:

```json
// In column_metadata.validation_rules
{
  "join_condition": "status = 'active'",
  "join_type": "LEFT"
}
```

**3. Performance Optimization:**

- Add indexes on foreign key columns
- Use EXISTS for filtering instead of JOIN when appropriate
- Implement JOIN caching for frequently accessed references

### Summary: JOIN Query Generation

✅ **Automatic Detection**: Based on `ref_schema`, `ref_table`, `ref_column`
✅ **Smart JOIN Type**: INNER for required, LEFT for optional
✅ **Nested JOINs**: Support multi-level relationships
✅ **Alias Management**: Handle multiple JOINs to same table
✅ **Filter Support**: Apply filters to both main and joined tables
✅ **DTO Integration**: Include foreign key fields and joined data
✅ **Performance**: Consider indexes and query optimization

Database access layer with filter support.

```typescript
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg'; // or mysql2/promise
import { UsersQueries } from './users.query';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './users.dto';

@Injectable()
export class UsersRepository {
  constructor(private readonly pool: Pool) {}

  // GENERATED_METHOD_START: find-all
  async findAll(filters?: UserFilterDto, page = 1, limit = 10) {
    let query = UsersQueries.findAll;
    const params: any[] = [];
    let paramIndex = 1;

    // Apply filters
    if (filters) {
      const whereClauses: string[] = ['deleted_at IS NULL'];

      // Equal filter
      if (filters.username_eq) {
        whereClauses.push(`username = $${paramIndex++}`);
        params.push(filters.username_eq);
      }

      // Like filter
      if (filters.username_like) {
        whereClauses.push(`username ILIKE $${paramIndex++}`);
        params.push(`%${filters.username_like}%`);
      }

      // More filter operators...

      query += ` WHERE ${whereClauses.join(' AND ')}`;
    }

    // Pagination
    query += ` ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex++}`;
    params.push(limit, (page - 1) * limit);

    const result = await this.pool.query(query, params);
    return result.rows;
  }
  // GENERATED_METHOD_END: find-all

  // GENERATED_METHOD_START: find-by-id
  async findById(id: string) {
    const result = await this.pool.query(UsersQueries.findById, [id]);
    return result.rows[0];
  }
  // GENERATED_METHOD_END: find-by-id

  // GENERATED_METHOD_START: create
  async create(dto: CreateUserDto, createdBy: string) {
    const { username, email, full_name, is_active } = dto;
    const result = await this.pool.query(UsersQueries.create, [
      username,
      email,
      full_name,
      is_active,
      createdBy,
    ]);
    return result.rows[0];
  }
  // GENERATED_METHOD_END: create

  // GENERATED_METHOD_START: update
  async update(id: string, dto: UpdateUserDto) {
    const { username, email, full_name, is_active } = dto;
    const result = await this.pool.query(UsersQueries.update, [
      username,
      email,
      full_name,
      is_active,
      id,
    ]);
    return result.rows[0];
  }
  // GENERATED_METHOD_END: update

  // GENERATED_METHOD_START: soft-delete
  async softDelete(id: string) {
    const result = await this.pool.query(UsersQueries.softDelete, [id]);
    return result.rows[0];
  }
  // GENERATED_METHOD_END: soft-delete

  // CUSTOM_METHOD_START: custom-methods
  // Add your custom methods here
  // CUSTOM_METHOD_END: custom-methods
}
```

### 4. Service Generation (`users.service.ts`)

Business logic layer.

```typescript
import { Injectable, NotFoundException } from '@nestjs/common';
import { UsersRepository } from './users.repository';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './users.dto';

@Injectable()
export class UsersService {
  constructor(private readonly repository: UsersRepository) {}

  // GENERATED_METHOD_START: find-all
  async findAll(filters?: UserFilterDto, page = 1, limit = 10) {
    return this.repository.findAll(filters, page, limit);
  }
  // GENERATED_METHOD_END: find-all

  // GENERATED_METHOD_START: find-one
  async findOne(id: string) {
    const user = await this.repository.findById(id);
    if (!user) {
      throw new NotFoundException(`User with ID ${id} not found`);
    }
    return user;
  }
  // GENERATED_METHOD_END: find-one

  // GENERATED_METHOD_START: create
  async create(dto: CreateUserDto, userId: string) {
    return this.repository.create(dto, userId);
  }
  // GENERATED_METHOD_END: create

  // GENERATED_METHOD_START: update
  async update(id: string, dto: UpdateUserDto) {
    await this.findOne(id); // Verify exists
    return this.repository.update(id, dto);
  }
  // GENERATED_METHOD_END: update

  // GENERATED_METHOD_START: remove
  async remove(id: string) {
    await this.findOne(id); // Verify exists
    return this.repository.softDelete(id);
  }
  // GENERATED_METHOD_END: remove

  // CUSTOM_METHOD_START: business-logic
  // Add your custom business logic here
  // CUSTOM_METHOD_END: business-logic
}
```

### 5. Controller Generation

#### Standalone/Monorepo (`users.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // GENERATED_ENDPOINT_START: find-all
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of users with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [CreateUserDto],
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } }) // 100 requests per minute
  async findAll(
    @Query() filters: UserFilterDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.service.findAll(filters, page, limit);
  }
  // GENERATED_ENDPOINT_END: find-all

  // GENERATED_ENDPOINT_START: find-one
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: CreateUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  async findOne(@Param('id') id: string) {
    return this.service.findOne(id);
  }
  // GENERATED_ENDPOINT_END: find-one

  // GENERATED_ENDPOINT_START: create
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Throttle({ default: { limit: 20, ttl: 60000 } }) // 20 creates per minute
  async create(@Body() dto: CreateUserDto) {
    // TODO: Get userId from auth context
    return this.service.create(dto, 'system');
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update user' })
  @ApiResponse({
    status: 200,
    description: 'User updated successfully',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.service.update(id, dto);
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete user (soft delete)' })
  @ApiResponse({ status: 200, description: 'User deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async remove(@Param('id') id: string) {
    return this.service.remove(id);
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints
}
```

#### Microservices Gateway (`apps/gateway/src/modules/users/users.controller.ts`)

```typescript
import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  Inject,
} from '@nestjs/common';
import { ClientProxy } from '@nestjs/microservices';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { CreateUserDto, UpdateUserDto, UserFilterDto } from './users.dto';

@ApiTags('users')
@Controller('users')
export class UsersController {
  constructor(@Inject('USER_SERVICE') private readonly client: ClientProxy) {}

  // GENERATED_ENDPOINT_START: find-all
  @Get()
  @ApiOperation({
    summary: 'Get all users',
    description: 'Retrieve paginated list of users with optional filters',
  })
  @ApiResponse({
    status: 200,
    description: 'Users retrieved successfully',
    type: [CreateUserDto],
  })
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  async findAll(
    @Query() filters: UserFilterDto,
    @Query('page') page = 1,
    @Query('limit') limit = 10,
  ) {
    return this.client.send('users.findAll', { filters, page, limit });
  }
  // GENERATED_ENDPOINT_END: find-all

  // GENERATED_ENDPOINT_START: find-one
  @Get(':id')
  @ApiOperation({ summary: 'Get user by ID' })
  @ApiResponse({ status: 200, description: 'User found', type: CreateUserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  @Throttle({ default: { limit: 200, ttl: 60000 } })
  async findOne(@Param('id') id: string) {
    return this.client.send('users.findOne', { id });
  }
  // GENERATED_ENDPOINT_END: find-one

  // GENERATED_ENDPOINT_START: create
  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create new user' })
  @ApiResponse({
    status: 201,
    description: 'User created successfully',
    type: CreateUserDto,
  })
  @ApiResponse({ status: 400, description: 'Invalid input data' })
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  async create(@Body() dto: CreateUserDto) {
    return this.client.send('users.create', dto);
  }
  // GENERATED_ENDPOINT_END: create

  // GENERATED_ENDPOINT_START: update
  @Put(':id')
  async update(@Param('id') id: string, @Body() dto: UpdateUserDto) {
    return this.client.send('users.update', { id, ...dto });
  }
  // GENERATED_ENDPOINT_END: update

  // GENERATED_ENDPOINT_START: remove
  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.client.send('users.remove', { id });
  }
  // GENERATED_ENDPOINT_END: remove

  // CUSTOM_ENDPOINT_START: custom-endpoints
  // Add your custom endpoints here
  // CUSTOM_ENDPOINT_END: custom-endpoints
}
```

#### Microservices Handler (`apps/user-service/src/modules/users/users.controller.ts`)

```typescript
import { Controller } from '@nestjs/common';
import { MessagePattern, Payload } from '@nestjs/microservices';
import { UsersService } from './users.service';
import { CreateUserDto, UpdateUserDto } from './users.dto';

@Controller()
export class UsersController {
  constructor(private readonly service: UsersService) {}

  // GENERATED_HANDLER_START: find-all
  @MessagePattern('users.findAll')
  async findAll(@Payload() data: any) {
    const { filters, page, limit } = data;
    return this.service.findAll(filters, page, limit);
  }
  // GENERATED_HANDLER_END: find-all

  // GENERATED_HANDLER_START: find-one
  @MessagePattern('users.findOne')
  async findOne(@Payload() data: { id: string }) {
    return this.service.findOne(data.id);
  }
  // GENERATED_HANDLER_END: find-one

  // GENERATED_HANDLER_START: create
  @MessagePattern('users.create')
  async create(@Payload() dto: CreateUserDto) {
    return this.service.create(dto, 'system');
  }
  // GENERATED_HANDLER_END: create

  // GENERATED_HANDLER_START: update
  @MessagePattern('users.update')
  async update(@Payload() data: any) {
    const { id, ...dto } = data;
    return this.service.update(id, dto);
  }
  // GENERATED_HANDLER_END: update

  // GENERATED_HANDLER_START: remove
  @MessagePattern('users.remove')
  async remove(@Payload() data: { id: string }) {
    return this.service.remove(data.id);
  }
  // GENERATED_HANDLER_END: remove

  // CUSTOM_HANDLER_START: custom-handlers
  // Add your custom message handlers here
  // CUSTOM_HANDLER_END: custom-handlers
}
```

### 6. Module Generation (`users.module.ts`)

```typescript
import { Module } from '@nestjs/common';
import { UsersController } from './users.controller';
import { UsersService } from './users.service';
import { UsersRepository } from './users.repository';

// GENERATED_MODULE_START
@Module({
  controllers: [UsersController],
  providers: [UsersService, UsersRepository],
  exports: [UsersService],
})
export class UsersModule {}
// GENERATED_MODULE_END

// CUSTOM_MODULE_START: module-config
// Add custom module configuration here
// CUSTOM_MODULE_END: module-config
```

---

## Custom Code Preservation

### Block Markers

The generator uses special comment markers to preserve custom code:

**Types of markers:**

1. `CUSTOM_CODE_START` / `CUSTOM_CODE_END` - User's custom code
2. `GENERATED_*_START` / `GENERATED_*_END` - Auto-generated code (can be overwritten)

**Regeneration algorithm:**

```typescript
function regenerateFile(existingContent: string, newContent: string): string {
  // 1. Extract all CUSTOM_CODE blocks from existing file
  const customBlocks = extractBlocks(existingContent, 'CUSTOM_CODE');

  // 2. Generate new content with placeholders
  let result = newContent;

  // 3. Inject custom blocks back into new content
  for (const block of customBlocks) {
    result = replaceBlock(result, block.marker, block.content);
  }

  // 4. Calculate checksum for change detection
  const checksum = calculateChecksum(result);

  return result;
}
```

### Table: `meta.generated_files`

Track file changes to detect manual modifications and manage regeneration.

```sql
CREATE TABLE "meta"."generated_files" (
  "id" uuid PRIMARY KEY DEFAULT uuidv7(),
  "table_metadata_id" uuid NOT NULL,
  "file_path" varchar(500) NOT NULL,
  "file_type" varchar(50) NOT NULL, -- dto, query, repository, service, controller, module
  "checksum" varchar(64) NOT NULL,
  "last_generated_at" timestamp NOT NULL,
  "has_custom_code" bool DEFAULT false,
  "created_at" timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" timestamp,
  FOREIGN KEY ("table_metadata_id") REFERENCES "meta"."table_metadata"("id") ON DELETE CASCADE
);

CREATE INDEX idx_generated_files_table_id
ON meta.generated_files USING btree (table_metadata_id);

CREATE UNIQUE INDEX idx_generated_files_path
ON meta.generated_files USING btree (file_path);

CREATE INDEX idx_generated_files_type
ON meta.generated_files USING btree (file_type);
```

**Field Analysis:**

| Field               | Type         | Purpose                                                      |
| ------------------- | ------------ | ------------------------------------------------------------ |
| `id`                | UUID         | Primary key                                                  |
| `table_metadata_id` | UUID         | Reference to source table metadata                           |
| `file_path`         | VARCHAR(500) | Absolute or relative path to generated file                  |
| `file_type`         | VARCHAR(50)  | File category: 'dto', 'query', 'repository', 'service', etc. |
| `checksum`          | VARCHAR(64)  | SHA-256 hash of file content for change detection            |
| `last_generated_at` | TIMESTAMP    | Last time file was generated/regenerated                     |
| `has_custom_code`   | BOOLEAN      | Whether file contains custom code blocks                     |
| `created_at`        | TIMESTAMP    | When file was first generated                                |
| `updated_at`        | TIMESTAMP    | Last update time                                             |

**Usage:**

- Compare `checksum` before regeneration to detect manual changes
- If checksum differs and `has_custom_code = true`, merge custom blocks
- Track regeneration history via `last_generated_at`

---

## Database Dialect System

**Multi-database compatibility layer for PostgreSQL and MySQL.**

### Architecture

```typescript
// GENERATED_DIALECT_INTERFACE_START
export interface DatabaseDialect {
  // Identifier quoting (table.column)
  quoteIdentifier(name: string): string;

  // Case-insensitive LIKE
  ilike(column: string, paramIndex: number): string;

  // Date/time functions
  extractYear(column: string, timezone?: string): string;
  extractMonth(column: string, timezone?: string): string;
  dateTrunc(
    unit: 'day' | 'month' | 'year',
    column: string,
    timezone?: string,
  ): string;

  // JSON operations
  jsonExtract(column: string, path: string): string;
  jsonContains(column: string, value: string): string;

  // Type casting
  castToTimestamp(value: string): string;
  castToUUID(value: string): string;

  // Upsert support
  buildUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
  ): string;

  // Limit/offset
  buildPagination(limit: number, offset: number): string;

  // Array operations
  arrayContains(column: string, value: string): string;
}
// GENERATED_DIALECT_INTERFACE_END
```

### PostgreSQL Dialect

```typescript
// GENERATED_POSTGRES_DIALECT_START
export class PostgresDialect implements DatabaseDialect {
  quoteIdentifier(name: string): string {
    // Split schema.table.column and quote each part
    return name
      .split('.')
      .map((part) => `"${part.replace(/"/g, '""')}"`)
      .join('.');
  }

  ilike(column: string, paramIndex: number): string {
    return `${this.quoteIdentifier(column)} ILIKE $${paramIndex}`;
  }

  extractYear(column: string, timezone = 'UTC'): string {
    return `EXTRACT(YEAR FROM ${this.quoteIdentifier(column)} AT TIME ZONE '${timezone}')`;
  }

  extractMonth(column: string, timezone = 'UTC'): string {
    return `EXTRACT(MONTH FROM ${this.quoteIdentifier(column)} AT TIME ZONE '${timezone}')`;
  }

  dateTrunc(unit: string, column: string, timezone = 'UTC'): string {
    return `DATE_TRUNC('${unit}', ${this.quoteIdentifier(column)} AT TIME ZONE '${timezone}')`;
  }

  jsonExtract(column: string, path: string): string {
    return `${this.quoteIdentifier(column)}->>'${path}'`;
  }

  jsonContains(column: string, value: string): string {
    return `${this.quoteIdentifier(column)} @> '${value}'::jsonb`;
  }

  castToTimestamp(value: string): string {
    return `$${value}::timestamp`;
  }

  castToUUID(value: string): string {
    return `$${value}::uuid`;
  }

  buildUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
  ): string {
    const quoted = columns.map((c) => this.quoteIdentifier(c));
    const params = columns.map((_, i) => `$${i + 1}`);
    const updates = columns
      .filter((c) => !conflictColumns.includes(c))
      .map(
        (c) =>
          `${this.quoteIdentifier(c)} = EXCLUDED.${this.quoteIdentifier(c)}`,
      )
      .join(', ');

    return `
      INSERT INTO ${this.quoteIdentifier(table)} (${quoted.join(', ')})
      VALUES (${params.join(', ')})
      ON CONFLICT (${conflictColumns.map((c) => this.quoteIdentifier(c)).join(', ')})
      DO UPDATE SET ${updates}
      RETURNING *
    `;
  }

  buildPagination(limit: number, offset: number): string {
    return `LIMIT $${limit} OFFSET $${offset}`;
  }

  arrayContains(column: string, value: string): string {
    return `$${value} = ANY(${this.quoteIdentifier(column)})`;
  }
}
// GENERATED_POSTGRES_DIALECT_END
```

### MySQL Dialect

```typescript
// GENERATED_MYSQL_DIALECT_START
export class MySQLDialect implements DatabaseDialect {
  quoteIdentifier(name: string): string {
    return name
      .split('.')
      .map((part) => `\`${part.replace(/`/g, '``')}\``)
      .join('.');
  }

  ilike(column: string, paramIndex: number): string {
    // MySQL doesn't have ILIKE, use LOWER() workaround
    return `LOWER(${this.quoteIdentifier(column)}) LIKE LOWER(?)`;
  }

  extractYear(column: string, timezone?: string): string {
    // MySQL doesn't support AT TIME ZONE, assume app handles timezone
    return `YEAR(${this.quoteIdentifier(column)})`;
  }

  extractMonth(column: string, timezone?: string): string {
    return `MONTH(${this.quoteIdentifier(column)})`;
  }

  dateTrunc(unit: string, column: string, timezone?: string): string {
    const formats = {
      day: '%Y-%m-%d',
      month: '%Y-%m-01',
      year: '%Y-01-01',
    };
    return `DATE_FORMAT(${this.quoteIdentifier(column)}, '${formats[unit]}')`;
  }

  jsonExtract(column: string, path: string): string {
    return `JSON_UNQUOTE(JSON_EXTRACT(${this.quoteIdentifier(column)}, '$.${path}'))`;
  }

  jsonContains(column: string, value: string): string {
    return `JSON_CONTAINS(${this.quoteIdentifier(column)}, '${value}')`;
  }

  castToTimestamp(value: string): string {
    return `CAST(? AS DATETIME)`; // MySQL uses ? for params
  }

  castToUUID(value: string): string {
    return `CAST(? AS CHAR(36))`;
  }

  buildUpsert(
    table: string,
    columns: string[],
    conflictColumns: string[],
  ): string {
    const quoted = columns.map((c) => this.quoteIdentifier(c));
    const params = columns.map(() => '?');
    const updates = columns
      .filter((c) => !conflictColumns.includes(c))
      .map(
        (c) =>
          `${this.quoteIdentifier(c)} = VALUES(${this.quoteIdentifier(c)})`,
      )
      .join(', ');

    return `
      INSERT INTO ${this.quoteIdentifier(table)} (${quoted.join(', ')})
      VALUES (${params.join(', ')})
      ON DUPLICATE KEY UPDATE ${updates}
    `;
  }

  buildPagination(limit: number, offset: number): string {
    return `LIMIT ? OFFSET ?`;
  }

  arrayContains(column: string, value: string): string {
    return `FIND_IN_SET(?, ${this.quoteIdentifier(column)})`;
  }
}
// GENERATED_MYSQL_DIALECT_END
```

### Dialect Factory

```typescript
// GENERATED_DIALECT_FACTORY_START
export class DialectFactory {
  static create(databaseType: 'postgresql' | 'mysql'): DatabaseDialect {
    switch (databaseType) {
      case 'postgresql':
        return new PostgresDialect();
      case 'mysql':
        return new MySQLDialect();
      default:
        throw new Error(`Unsupported database type: ${databaseType}`);
    }
  }
}
// GENERATED_DIALECT_FACTORY_END
```

### Usage in Generated Code

```typescript
// GENERATED_REPOSITORY_WITH_DIALECT_START
@Injectable()
export class UsersRepository {
  private dialect: DatabaseDialect;

  constructor(
    private readonly pool: Pool,
    @Inject('DATABASE_TYPE') databaseType: 'postgresql' | 'mysql',
  ) {
    this.dialect = DialectFactory.create(databaseType);
  }

  async findByUsername(username: string) {
    const query = `
      SELECT * FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE ${this.dialect.ilike('username', 1)}
        AND deleted_at IS NULL
    `;

    const result = await this.pool.query(query, [`%${username}%`]);
    return result.rows || result[0]; // Handle both PG and MySQL
  }
}
// GENERATED_REPOSITORY_WITH_DIALECT_END
```

---

## Generic Filter Compiler

**Auto-generate filter logic from column metadata.**

### Filter Compiler Architecture

```typescript
// GENERATED_FILTER_COMPILER_START
export interface FilterOperator {
  operator: string; // eq, ne, gt, like, in, between, etc.
  sqlTemplate: (
    dialect: DatabaseDialect,
    column: string,
    paramIndex: number,
  ) => string;
  paramCount: number; // 1 for most, 2 for between
  validator: (value: any) => boolean;
}

export class FilterCompiler {
  private operators: Map<string, FilterOperator>;

  constructor(private dialect: DatabaseDialect) {
    this.operators = new Map([
      [
        'eq',
        {
          operator: 'eq',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} = $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'ne',
        {
          operator: 'ne',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} != $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'gt',
        {
          operator: 'gt',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} > $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'gte',
        {
          operator: 'gte',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} >= $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'lt',
        {
          operator: 'lt',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} < $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'lte',
        {
          operator: 'lte',
          sqlTemplate: (d, col, idx) => `${d.quoteIdentifier(col)} <= $${idx}`,
          paramCount: 1,
          validator: (v) => v !== undefined && v !== null,
        },
      ],
      [
        'like',
        {
          operator: 'like',
          sqlTemplate: (d, col, idx) => d.ilike(col, idx),
          paramCount: 1,
          validator: (v) => typeof v === 'string',
        },
      ],
      [
        'in',
        {
          operator: 'in',
          sqlTemplate: (d, col, idx) =>
            `${d.quoteIdentifier(col)} = ANY($${idx})`,
          paramCount: 1,
          validator: (v) => Array.isArray(v) && v.length > 0,
        },
      ],
      [
        'nin',
        {
          operator: 'nin',
          sqlTemplate: (d, col, idx) =>
            `${d.quoteIdentifier(col)} != ALL($${idx})`,
          paramCount: 1,
          validator: (v) => Array.isArray(v) && v.length > 0,
        },
      ],
      [
        'between',
        {
          operator: 'between',
          sqlTemplate: (d, col, idx) =>
            `${d.quoteIdentifier(col)} BETWEEN $${idx} AND $${idx + 1}`,
          paramCount: 2,
          validator: (v) => Array.isArray(v) && v.length === 2,
        },
      ],
      [
        'null',
        {
          operator: 'null',
          sqlTemplate: (d, col) => `${d.quoteIdentifier(col)} IS NULL`,
          paramCount: 0,
          validator: (v) => v === true || v === 'true',
        },
      ],
      [
        'nnull',
        {
          operator: 'nnull',
          sqlTemplate: (d, col) => `${d.quoteIdentifier(col)} IS NOT NULL`,
          paramCount: 0,
          validator: (v) => v === true || v === 'true',
        },
      ],
    ]);
  }

  compile(
    filterDto: any,
    columns: ColumnMetadata[],
    startParamIndex = 1,
  ): { clauses: string[]; params: any[]; nextParamIndex: number } {
    const clauses: string[] = [];
    const params: any[] = [];
    let paramIndex = startParamIndex;

    const filterableColumns = columns.filter((c) => c.is_filterable);

    for (const column of filterableColumns) {
      const allowedOps = this.getAllowedOperators(column.data_type);

      for (const opName of allowedOps) {
        const filterKey = `${column.column_name}_${opName}`;
        const value = filterDto[filterKey];

        if (value === undefined || value === null) continue;

        const op = this.operators.get(opName);
        if (!op || !op.validator(value)) continue;

        const clause = op.sqlTemplate(
          this.dialect,
          column.column_name,
          paramIndex,
        );
        clauses.push(clause);

        if (op.paramCount === 1) {
          // Handle array values for IN/NIN
          if (opName === 'in' || opName === 'nin') {
            params.push(Array.isArray(value) ? value : value.split(','));
          } else if (opName === 'like') {
            params.push(`%${value}%`);
          } else {
            params.push(value);
          }
          paramIndex++;
        } else if (op.paramCount === 2) {
          // BETWEEN
          const [min, max] = Array.isArray(value) ? value : value.split(',');
          params.push(min, max);
          paramIndex += 2;
        }
        // op.paramCount === 0 means no params (NULL/NOT NULL)
      }
    }

    return { clauses, params, nextParamIndex: paramIndex };
  }

  private getAllowedOperators(dataType: string): string[] {
    const type = dataType.toLowerCase();

    if (
      type.includes('int') ||
      type.includes('numeric') ||
      type.includes('decimal')
    ) {
      return [
        'eq',
        'ne',
        'gt',
        'gte',
        'lt',
        'lte',
        'in',
        'nin',
        'between',
        'null',
        'nnull',
      ];
    }

    if (type.includes('char') || type.includes('text') || type === 'string') {
      return ['eq', 'ne', 'like', 'in', 'nin', 'null', 'nnull'];
    }

    if (type.includes('bool')) {
      return ['eq', 'ne'];
    }

    if (
      type.includes('date') ||
      type.includes('timestamp') ||
      type.includes('time')
    ) {
      return ['eq', 'ne', 'gt', 'gte', 'lt', 'lte', 'between', 'null', 'nnull'];
    }

    if (type.includes('uuid')) {
      return ['eq', 'ne', 'in', 'nin', 'null', 'nnull'];
    }

    // Default
    return ['eq', 'ne', 'null', 'nnull'];
  }
}
// GENERATED_FILTER_COMPILER_END
```

### Usage in Repository

```typescript
// GENERATED_REPOSITORY_WITH_FILTER_COMPILER_START
@Injectable()
export class UsersRepository {
  private filterCompiler: FilterCompiler;

  constructor(
    private readonly pool: Pool,
    private readonly dialect: DatabaseDialect,
    private readonly metadataService: MetadataService,
  ) {
    this.filterCompiler = new FilterCompiler(dialect);
  }

  async findAll(filters: UserFilterDto, page = 1, limit = 10) {
    const columns = await this.metadataService.getColumns('users');

    let query = `
      SELECT ${this.buildSelectClause(columns)}
      FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE deleted_at IS NULL
    `;

    const compiled = this.filterCompiler.compile(filters, columns, 1);

    if (compiled.clauses.length > 0) {
      query += ` AND ${compiled.clauses.join(' AND ')}`;
    }

    query += ` ORDER BY created_at DESC`;
    query += ` ${this.dialect.buildPagination(compiled.nextParamIndex, compiled.nextParamIndex + 1)}`;

    const params = [...compiled.params, limit, (page - 1) * limit];

    const result = await this.pool.query(query, params);
    return result.rows || result[0];
  }

  private buildSelectClause(columns: ColumnMetadata[]): string {
    return columns
      .filter((c) => c.display_in_list)
      .map((c) => this.dialect.quoteIdentifier(c.column_name))
      .join(', ');
  }
}
// GENERATED_REPOSITORY_WITH_FILTER_COMPILER_END
```

### Filter DTO Generator with Validation

```typescript
// GENERATED_FILTER_DTO_WITH_VALIDATION_START
export class UserFilterDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'john' })
  username_eq?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({ example: 'john' })
  username_like?: string;

  @IsOptional()
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsString({ each: true })
  @ApiPropertyOptional({ example: 'admin,user' })
  role_in?: string[];

  @IsOptional()
  @IsInt()
  @Type(() => Number)
  @ApiPropertyOptional({ example: 18 })
  age_gte?: number;

  @IsOptional()
  @IsBooleanString()
  @ApiPropertyOptional({ example: 'true' })
  is_active_eq?: string;

  @IsOptional()
  @IsDateString()
  @ApiPropertyOptional({ example: '2024-01-01' })
  created_at_gte?: string;

  @IsOptional()
  @Transform(({ value }) => value.split(','))
  @IsArray()
  @IsDateString({ each: true })
  @ArrayMinSize(2)
  @ArrayMaxSize(2)
  @ApiPropertyOptional({ example: '2024-01-01,2024-12-31' })
  created_at_between?: string[];
}
// GENERATED_FILTER_DTO_WITH_VALIDATION_END
```

---

## Filter Operators

Dynamic URL query parameters for advanced filtering.

### Supported Operators

| Operator   | Syntax                    | Description              | Example                                    |
| ---------- | ------------------------- | ------------------------ | ------------------------------------------ |
| `_eq`      | `field_eq=value`          | Equal to                 | `username_eq=john`                         |
| `_ne`      | `field_ne=value`          | Not equal to             | `status_ne=inactive`                       |
| `_gt`      | `field_gt=value`          | Greater than             | `age_gt=18`                                |
| `_lt`      | `field_lt=value`          | Less than                | `age_lt=65`                                |
| `_gte`     | `field_gte=value`         | Greater than or equal    | `price_gte=100`                            |
| `_lte`     | `field_lte=value`         | Less than or equal       | `price_lte=1000`                           |
| `_like`    | `field_like=value`        | Case-insensitive pattern | `email_like=gmail`                         |
| `_in`      | `field_in=val1,val2,val3` | In array                 | `role_in=admin,user`                       |
| `_nin`     | `field_nin=val1,val2`     | Not in array             | `status_nin=deleted,banned`                |
| `_between` | `field_between=min,max`   | Between two values       | `created_at_between=2024-01-01,2024-12-31` |
| `_null`    | `field_null=true`         | Is NULL                  | `deleted_at_null=true`                     |
| `_nnull`   | `field_nnull=true`        | Is NOT NULL              | `email_nnull=true`                         |

### Filter Generation Logic

Only generate filters for columns where `is_filterable = true` in metadata.

```typescript
// Example usage
GET /users?username_like=john&age_gte=18&role_in=admin,moderator&page=1&limit=20
```

### Filter DTO Generator

```typescript
function generateFilterDto(columns: ColumnMetadata[]): string {
  const filterableColumns = columns.filter((c) => c.is_filterable);

  let dto = 'export class UserFilterDto {\n';

  for (const col of filterableColumns) {
    const operators = getOperatorsForType(col.data_type);

    for (const op of operators) {
      dto += `  @IsOptional()\n`;
      dto += `  ${col.column_name}_${op}?: ${getTypeScriptType(col.data_type)};\n\n`;
    }
  }

  dto += '  // CUSTOM_CODE_START: additional-filters\n';
  dto += '  // CUSTOM_CODE_END: additional-filters\n';
  dto += '}\n';

  return dto;
}

function getOperatorsForType(dataType: string): string[] {
  const numericOps = [
    'eq',
    'ne',
    'gt',
    'lt',
    'gte',
    'lte',
    'in',
    'nin',
    'between',
  ];
  const stringOps = ['eq', 'ne', 'like', 'in', 'nin'];
  const boolOps = ['eq', 'ne'];
  const dateOps = ['eq', 'ne', 'gt', 'lt', 'gte', 'lte', 'between'];

  if (['int', 'bigint', 'numeric', 'decimal'].includes(dataType)) {
    return numericOps;
  }
  if (['varchar', 'text', 'char'].includes(dataType)) {
    return stringOps;
  }
  if (dataType === 'bool') {
    return boolOps;
  }
  if (['timestamp', 'date', 'time'].includes(dataType)) {
    return dateOps;
  }

  return ['eq', 'ne'];
}
```

---

## Security Best Practices

**SQL injection prevention and secure query building.**

### Identifier Validation & Whitelisting

```typescript
// GENERATED_SECURITY_VALIDATOR_START
export class SecurityValidator {
  private static readonly IDENTIFIER_PATTERN = /^[a-zA-Z_][a-zA-Z0-9_]*$/;
  private static readonly MAX_IDENTIFIER_LENGTH = 63; // PostgreSQL limit

  /**
   * Validate identifier against allowed list
   * Prevents SQL injection through dynamic identifiers
   */
  static validateIdentifier(
    identifier: string,
    allowedIdentifiers: string[],
    context: string,
  ): string {
    if (!identifier) {
      throw new BadRequestException(`${context}: identifier is required`);
    }

    if (!this.IDENTIFIER_PATTERN.test(identifier)) {
      throw new BadRequestException(
        `${context}: identifier contains invalid characters`,
      );
    }

    if (identifier.length > this.MAX_IDENTIFIER_LENGTH) {
      throw new BadRequestException(
        `${context}: identifier exceeds maximum length`,
      );
    }

    if (!allowedIdentifiers.includes(identifier)) {
      throw new BadRequestException(
        `${context}: '${identifier}' is not an allowed field`,
      );
    }

    return identifier;
  }

  /**
   * Validate multiple identifiers (e.g., for group_by)
   */
  static validateIdentifiers(
    identifiers: string[],
    allowedIdentifiers: string[],
    context: string,
    maxCount = 2,
  ): string[] {
    if (!Array.isArray(identifiers) || identifiers.length === 0) {
      throw new BadRequestException(
        `${context}: at least one identifier required`,
      );
    }

    if (identifiers.length > maxCount) {
      throw new BadRequestException(
        `${context}: maximum ${maxCount} identifiers allowed`,
      );
    }

    return identifiers.map((id) =>
      this.validateIdentifier(id, allowedIdentifiers, context),
    );
  }

  /**
   * Sanitize input to prevent injection attacks
   */
  static sanitizeValue(value: any, dataType: string): any {
    if (value === null || value === undefined) {
      return null;
    }

    switch (dataType.toLowerCase()) {
      case 'integer':
      case 'bigint':
      case 'smallint':
        const intVal = parseInt(value, 10);
        if (isNaN(intVal)) {
          throw new BadRequestException(`Invalid integer value: ${value}`);
        }
        return intVal;

      case 'numeric':
      case 'decimal':
      case 'real':
      case 'double':
        const numVal = parseFloat(value);
        if (isNaN(numVal)) {
          throw new BadRequestException(`Invalid numeric value: ${value}`);
        }
        return numVal;

      case 'boolean':
        if (typeof value === 'boolean') return value;
        if (value === 'true' || value === '1') return true;
        if (value === 'false' || value === '0') return false;
        throw new BadRequestException(`Invalid boolean value: ${value}`);

      case 'uuid':
        const uuidPattern =
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
        if (!uuidPattern.test(value)) {
          throw new BadRequestException(`Invalid UUID value: ${value}`);
        }
        return value;

      case 'date':
      case 'timestamp':
        const date = new Date(value);
        if (isNaN(date.getTime())) {
          throw new BadRequestException(`Invalid date value: ${value}`);
        }
        return value; // Return as string, let database handle parsing

      default:
        // String types - trim and limit length
        if (typeof value !== 'string') {
          value = String(value);
        }
        return value.trim().substring(0, 10000); // Max 10KB string
    }
  }
}
// GENERATED_SECURITY_VALIDATOR_END
```

### Secure Recap Implementation

```typescript
// GENERATED_SECURE_RECAP_START
async recap(dto: UserRecapDto): Promise<RecapResult[]> {
  const columns = await this.metadataService.getColumns('users');

  // Get allowed fields for grouping (only filterable columns)
  const allowedFields = columns
    .filter(c => c.is_filterable)
    .map(c => c.column_name);

  // Validate and sanitize group_by fields
  const groupByFields = dto.group_by
    ? SecurityValidator.validateIdentifiers(
        dto.group_by.split(','),
        allowedFields,
        'group_by',
        2, // Max 2 fields
      )
    : ['department']; // Default

  // Validate year
  const year = parseInt(dto.year, 10);
  if (isNaN(year) || year < 2000 || year > 2100) {
    throw new BadRequestException('Invalid year');
  }

  // Validate timezone (prevent injection)
  const timezone = dto.timezone || 'UTC';
  if (!/^[A-Za-z/_]+$/.test(timezone)) {
    throw new BadRequestException('Invalid timezone');
  }

  // Build query with validated identifiers
  const field1 = this.dialect.quoteIdentifier(groupByFields[0]);
  const field2 = groupByFields[1] ? this.dialect.quoteIdentifier(groupByFields[1]) : null;

  // Compile additional filters securely
  const compiled = this.filterCompiler.compile(dto, columns, 1);

  let query: string;
  if (groupByFields.length === 1) {
    query = `
      SELECT
        ${field1} AS main,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth('created_at', timezone)} = 1) AS jan,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth('created_at', timezone)} = 2) AS feb,
        -- ... rest of months
        COUNT(*) AS total
      FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE ${this.dialect.extractYear('created_at', timezone)} = $${compiled.nextParamIndex}
        AND deleted_at IS NULL
        ${compiled.clauses.length > 0 ? 'AND ' + compiled.clauses.join(' AND ') : ''}
      GROUP BY ${field1}
      ORDER BY total DESC, main ASC
    `;
  } else {
    query = `
      SELECT
        ${field1} AS main,
        ${field2} AS sub,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth('created_at', timezone)} = 1) AS jan,
        -- ... rest
        COUNT(*) AS total
      FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE ${this.dialect.extractYear('created_at', timezone)} = $${compiled.nextParamIndex}
        AND deleted_at IS NULL
        ${compiled.clauses.length > 0 ? 'AND ' + compiled.clauses.join(' AND ') : ''}
      GROUP BY ${field1}, ${field2}
      ORDER BY main ASC, total DESC
    `;
  }

  const params = [...compiled.params, year];
  const result = await this.pool.query(query, params);

  return result.rows || result[0];
}
// GENERATED_SECURE_RECAP_END
```

### Parameterization Rules

**Always use parameterized queries for values:**

```typescript
// ✅ CORRECT - Parameterized
const query = `SELECT * FROM users WHERE username = $1 AND age > $2`;
const params = [username, minAge];

// ❌ WRONG - String interpolation
const query = `SELECT * FROM users WHERE username = '${username}'`;

// ✅ CORRECT - Identifier from whitelist + quoting
const allowedFields = ['username', 'email', 'age'];
const field = SecurityValidator.validateIdentifier(
  userInput,
  allowedFields,
  'sort',
);
const query = `SELECT * FROM users ORDER BY ${dialect.quoteIdentifier(field)}`;

// ❌ WRONG - Raw identifier
const query = `SELECT * FROM users ORDER BY ${userInput}`;
```

### Rate Limiting by IP

```typescript
// GENERATED_IP_THROTTLE_START
import { ThrottlerGuard } from '@nestjs/throttler';
import { Injectable } from '@nestjs/common';

@Injectable()
export class IpThrottlerGuard extends ThrottlerGuard {
  protected async getTracker(req: Record<string, any>): Promise<string> {
    // Get real IP from headers (behind proxy)
    return req.ips.length > 0
      ? req.ips[0]
      : req.ip || req.connection.remoteAddress;
  }

  protected async handleRequest(
    context: ExecutionContext,
    limit: number,
    ttl: number,
  ): Promise<boolean> {
    const request = context.switchToHttp().getRequest();
    const tracker = await this.getTracker(request);

    // Log throttle attempts
    const key = this.generateKey(context, tracker);
    const { totalHits } = await this.storageService.increment(key, ttl);

    if (totalHits > limit) {
      this.logger.warn(`Rate limit exceeded for IP: ${tracker}`);
      throw new ThrottlerException();
    }

    return true;
  }
}
// GENERATED_IP_THROTTLE_END
```

### Input Validation Layer

```typescript
// GENERATED_INPUT_VALIDATION_START
import {
  ValidatorConstraint,
  ValidatorConstraintInterface,
  ValidationArguments,
} from 'class-validator';

@ValidatorConstraint({ name: 'isSafeString', async: false })
export class IsSafeStringConstraint implements ValidatorConstraintInterface {
  validate(text: string, args: ValidationArguments) {
    if (!text) return true; // @IsOptional handles this

    // Check for SQL injection patterns
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(--|;|\/\*|\*\/)/,
      /('|")\s*(OR|AND)\s*('|")\s*=\s*('|")/i,
    ];

    for (const pattern of sqlPatterns) {
      if (pattern.test(text)) {
        return false;
      }
    }

    return true;
  }

  defaultMessage(args: ValidationArguments) {
    return 'Input contains potentially unsafe characters';
  }
}

export function IsSafeString(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      constraints: [],
      validator: IsSafeStringConstraint,
    });
  };
}
// GENERATED_INPUT_VALIDATION_END
```

---

## Configuration File

### `generator.config.json`

Generated by `nest-generator init` command.

```json
{
  "version": "1.0.0",
  "architecture": "microservices",
  "database": {
    "type": "postgresql",
    "host": "localhost",
    "port": 5432,
    "database": "myapp",
    "username": "postgres",
    "password": "password",
    "schema": "meta"
  },
  "microservices": {
    "gatewayApp": "gateway",
    "transport": "TCP",
    "services": [
      {
        "name": "user-service",
        "schemas": ["user"],
        "port": 3001
      },
      {
        "name": "product-service",
        "schemas": ["product", "inventory"],
        "port": 3002
      }
    ]
  },
  "paths": {
    "apps": "apps",
    "libs": "libs",
    "modules": "src/modules"
  },
  "codeGeneration": {
    "preserveCustomCode": true,
    "trackChecksums": true,
    "autoImports": true,
    "formatting": {
      "useTabs": false,
      "tabWidth": 2,
      "singleQuote": true,
      "semi": true
    }
  },
  "features": {
    "softDelete": true,
    "audit": true,
    "pagination": true,
    "filtering": true,
    "sorting": true
  }
}
```

---

## Database Setup Automation

The generator includes comprehensive database setup automation during the `init` command. This ensures a smooth onboarding experience without manual SQL execution.

### Setup Process

#### 1. Connection Validation

```typescript
// Connection test service
class DatabaseSetupService {
  async testConnection(config: DatabaseConfig): Promise<boolean> {
    try {
      const pool = this.createPool(config);
      const result = await pool.query('SELECT version()');
      console.log(`✓ Connected to ${config.type} ${result.rows[0].version}`);
      return true;
    } catch (error) {
      console.error(`✗ Connection failed: ${error.message}`);
      return false;
    }
  }
}
```

#### 2. Schema Detection & Creation

```typescript
async checkAndCreateSchema(schemaName: string = 'meta'): Promise<void> {
  // Check if schema exists
  const schemaExists = await this.schemaExists(schemaName);

  if (!schemaExists) {
    console.log(`⏳ Creating schema: ${schemaName}...`);
    await this.createSchema(schemaName);
    console.log(`✓ Created schema: ${schemaName}`);
  } else {
    console.log(`✓ Schema exists: ${schemaName}`);
  }
}
```

#### 3. Metadata Tables Creation

**PostgreSQL Setup SQL:**

```sql
-- ============================================
-- METADATA SCHEMA SETUP (PostgreSQL)
-- ============================================

-- Create meta schema
CREATE SCHEMA IF NOT EXISTS meta;

-- Create UUID v7 function (if not exists)
CREATE OR REPLACE FUNCTION uuidv7() RETURNS uuid AS $$
DECLARE
  unix_ts_ms BIGINT;
  uuid_bytes BYTEA;
BEGIN
  unix_ts_ms = (EXTRACT(EPOCH FROM CLOCK_TIMESTAMP()) * 1000)::BIGINT;
  uuid_bytes = SET_BYTE(SET_BYTE('\x00000000000000000000000000000000'::BYTEA,
    0, (unix_ts_ms >> 40)::INT),
    1, ((unix_ts_ms >> 32) & 255)::INT);
  uuid_bytes = SET_BYTE(uuid_bytes, 2, ((unix_ts_ms >> 24) & 255)::INT);
  uuid_bytes = SET_BYTE(uuid_bytes, 3, ((unix_ts_ms >> 16) & 255)::INT);
  uuid_bytes = SET_BYTE(uuid_bytes, 4, ((unix_ts_ms >> 8) & 255)::INT);
  uuid_bytes = SET_BYTE(uuid_bytes, 5, (unix_ts_ms & 255)::INT);
  uuid_bytes = SET_BYTE(uuid_bytes, 6, (GET_BYTE(gen_random_bytes(1), 0) & 15) | 112);
  uuid_bytes = SET_BYTE(uuid_bytes, 8, (GET_BYTE(gen_random_bytes(1), 0) & 63) | 128);
  RETURN ENCODE(uuid_bytes || gen_random_bytes(8), 'hex')::UUID;
END;
$$ LANGUAGE plpgsql VOLATILE;

-- Table: meta.table_metadata
CREATE TABLE IF NOT EXISTS meta.table_metadata (
    id uuid NOT NULL DEFAULT uuidv7(),
    schema_name varchar(50) NOT NULL,
    table_name varchar(100) NOT NULL,
    table_type varchar(50),
    table_purpose text,
    has_soft_delete boolean NOT NULL DEFAULT false,
    has_created_by boolean NOT NULL DEFAULT true,
    primary_key_column varchar(50) NOT NULL DEFAULT 'id',
    primary_key_type varchar(50) NOT NULL DEFAULT 'UUID',
    is_partitioned boolean NOT NULL DEFAULT false,
    partition_strategy varchar(50),
    partition_key varchar(50),
    model_class varchar(255),
    controller_class varchar(255),
    request_class varchar(255),
    resource_class varchar(255),
    status varchar(20) NOT NULL DEFAULT 'active',
    cache_ttl integer DEFAULT 300,
    cache_enabled boolean DEFAULT true,
    throttle_limit integer DEFAULT 100,
    throttle_ttl integer DEFAULT 60000,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp,
    CONSTRAINT pk_table_metadata PRIMARY KEY (id)
);

-- Table: meta.column_metadata
CREATE TABLE IF NOT EXISTS meta.column_metadata (
    id uuid NOT NULL DEFAULT uuidv7(),
    table_metadata_id uuid NOT NULL,
    column_name varchar(100) NOT NULL,
    data_type varchar(50) NOT NULL,
    is_nullable boolean NOT NULL DEFAULT false,
    default_value text,
    is_unique boolean NOT NULL DEFAULT false,
    is_primary_key boolean NOT NULL DEFAULT false,

    -- Foreign Key Reference
    ref_schema varchar(50),
    ref_table varchar(100),
    ref_column varchar(100),

    -- Query Features
    is_filterable boolean NOT NULL DEFAULT false,
    is_searchable boolean NOT NULL DEFAULT false,

    -- Validation
    validation_rules jsonb,
    is_required boolean NOT NULL DEFAULT false,
    max_length integer,
    min_value numeric,
    max_value numeric,
    enum_values jsonb,

    -- UI/Display
    input_type varchar(50),
    display_in_list boolean NOT NULL DEFAULT true,
    display_in_form boolean NOT NULL DEFAULT true,
    display_in_detail boolean NOT NULL DEFAULT true,
    description text,
    column_order integer NOT NULL DEFAULT 0,

    -- File Upload
    is_file_upload boolean DEFAULT false,
    file_upload_config jsonb,

    -- Swagger/API Documentation
    swagger_example text,
    swagger_description text,
    swagger_hidden boolean DEFAULT false,

    -- Audit
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp,

    CONSTRAINT pk_column_metadata PRIMARY KEY (id),
    CONSTRAINT fk_column_metadata_table_id
        FOREIGN KEY (table_metadata_id)
        REFERENCES meta.table_metadata(id)
        ON DELETE CASCADE ON UPDATE CASCADE
);

-- Table: meta.generated_files (for checksum tracking)
CREATE TABLE IF NOT EXISTS meta.generated_files (
    id uuid NOT NULL DEFAULT uuidv7(),
    table_metadata_id uuid NOT NULL,
    file_path varchar(500) NOT NULL,
    file_type varchar(50) NOT NULL,
    checksum varchar(64) NOT NULL,
    last_generated_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    has_custom_code boolean DEFAULT false,
    custom_blocks jsonb,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp,

    CONSTRAINT pk_generated_files PRIMARY KEY (id),
    CONSTRAINT fk_generated_files_table_id
        FOREIGN KEY (table_metadata_id)
        REFERENCES meta.table_metadata(id)
        ON DELETE CASCADE
);

-- Indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_table_metadata_schema_table
    ON meta.table_metadata (schema_name, table_name);

CREATE INDEX IF NOT EXISTS idx_table_metadata_created_by
    ON meta.table_metadata (created_by);

CREATE INDEX IF NOT EXISTS idx_table_metadata_status
    ON meta.table_metadata (status);

CREATE INDEX IF NOT EXISTS idx_column_metadata_table_id
    ON meta.column_metadata (table_metadata_id);

CREATE INDEX IF NOT EXISTS idx_column_metadata_filterable
    ON meta.column_metadata (is_filterable) WHERE is_filterable = true;

CREATE INDEX IF NOT EXISTS idx_column_metadata_searchable
    ON meta.column_metadata (is_searchable) WHERE is_searchable = true;

CREATE INDEX IF NOT EXISTS idx_generated_files_table_id
    ON meta.generated_files (table_metadata_id);

CREATE UNIQUE INDEX IF NOT EXISTS idx_generated_files_path
    ON meta.generated_files (file_path);
```

**MySQL Setup SQL:**

```sql
-- ============================================
-- METADATA SCHEMA SETUP (MySQL)
-- ============================================

-- Create meta schema (database)
CREATE DATABASE IF NOT EXISTS meta;
USE meta;

-- Table: table_metadata
CREATE TABLE IF NOT EXISTS table_metadata (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    schema_name VARCHAR(50) NOT NULL,
    table_name VARCHAR(100) NOT NULL,
    table_type VARCHAR(50),
    table_purpose TEXT,
    has_soft_delete BOOLEAN NOT NULL DEFAULT false,
    has_created_by BOOLEAN NOT NULL DEFAULT true,
    primary_key_column VARCHAR(50) NOT NULL DEFAULT 'id',
    primary_key_type VARCHAR(50) NOT NULL DEFAULT 'UUID',
    is_partitioned BOOLEAN NOT NULL DEFAULT false,
    partition_strategy VARCHAR(50),
    partition_key VARCHAR(50),
    model_class VARCHAR(255),
    controller_class VARCHAR(255),
    request_class VARCHAR(255),
    resource_class VARCHAR(255),
    status VARCHAR(20) NOT NULL DEFAULT 'active',
    cache_ttl INT DEFAULT 300,
    cache_enabled BOOLEAN DEFAULT true,
    throttle_limit INT DEFAULT 100,
    throttle_ttl INT DEFAULT 60000,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    PRIMARY KEY (id),
    UNIQUE KEY idx_schema_table (schema_name, table_name),
    KEY idx_status (status)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: column_metadata
CREATE TABLE IF NOT EXISTS column_metadata (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    table_metadata_id CHAR(36) NOT NULL,
    column_name VARCHAR(100) NOT NULL,
    data_type VARCHAR(50) NOT NULL,
    is_nullable BOOLEAN NOT NULL DEFAULT false,
    default_value TEXT,
    is_unique BOOLEAN NOT NULL DEFAULT false,
    is_primary_key BOOLEAN NOT NULL DEFAULT false,

    -- Foreign Key Reference
    ref_schema VARCHAR(50),
    ref_table VARCHAR(100),
    ref_column VARCHAR(100),

    -- Query Features
    is_filterable BOOLEAN NOT NULL DEFAULT false,
    is_searchable BOOLEAN NOT NULL DEFAULT false,

    -- Validation
    validation_rules JSON,
    is_required BOOLEAN NOT NULL DEFAULT false,
    max_length INT,
    min_value DECIMAL(10,2),
    max_value DECIMAL(10,2),
    enum_values JSON,

    -- UI/Display
    input_type VARCHAR(50),
    display_in_list BOOLEAN NOT NULL DEFAULT true,
    display_in_form BOOLEAN NOT NULL DEFAULT true,
    display_in_detail BOOLEAN NOT NULL DEFAULT true,
    description TEXT,
    column_order INT NOT NULL DEFAULT 0,

    -- File Upload
    is_file_upload BOOLEAN DEFAULT false,
    file_upload_config JSON,

    -- Swagger/API Documentation
    swagger_example TEXT,
    swagger_description TEXT,
    swagger_hidden BOOLEAN DEFAULT false,

    -- Audit
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    KEY idx_table_id (table_metadata_id),
    KEY idx_filterable (is_filterable),
    KEY idx_searchable (is_searchable),
    CONSTRAINT fk_column_metadata_table_id
        FOREIGN KEY (table_metadata_id)
        REFERENCES table_metadata(id)
        ON DELETE CASCADE ON UPDATE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Table: generated_files
CREATE TABLE IF NOT EXISTS generated_files (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    table_metadata_id CHAR(36) NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    checksum VARCHAR(64) NOT NULL,
    last_generated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    has_custom_code BOOLEAN DEFAULT false,
    custom_blocks JSON,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,

    PRIMARY KEY (id),
    UNIQUE KEY idx_file_path (file_path),
    KEY idx_table_id (table_metadata_id),
    CONSTRAINT fk_generated_files_table_id
        FOREIGN KEY (table_metadata_id)
        REFERENCES table_metadata(id)
        ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

#### 4. User Table Setup (Optional)

If the `user.users` table doesn't exist, the init command offers to create it:

```sql
-- PostgreSQL
CREATE SCHEMA IF NOT EXISTS "user";

CREATE TABLE IF NOT EXISTS "user".users (
    id uuid NOT NULL DEFAULT uuidv7(),
    username varchar(100) NOT NULL,
    email varchar(255) NOT NULL,
    password_hash varchar(255),
    full_name varchar(255),
    is_active boolean NOT NULL DEFAULT true,
    is_system boolean NOT NULL DEFAULT false,
    created_at timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at timestamp,
    deleted_at timestamp,
    CONSTRAINT pk_users PRIMARY KEY (id),
    CONSTRAINT uq_users_username UNIQUE (username),
    CONSTRAINT uq_users_email UNIQUE (email)
);

-- Insert system user for automated operations
INSERT INTO "user".users (id, username, email, full_name, is_system)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'system@generator.local',
    'System User',
    true
)
ON CONFLICT (id) DO NOTHING;
```

```sql
-- MySQL
CREATE DATABASE IF NOT EXISTS user;
USE user;

CREATE TABLE IF NOT EXISTS users (
    id CHAR(36) NOT NULL DEFAULT (UUID()),
    username VARCHAR(100) NOT NULL,
    email VARCHAR(255) NOT NULL,
    password_hash VARCHAR(255),
    full_name VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    is_system BOOLEAN NOT NULL DEFAULT false,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NULL ON UPDATE CURRENT_TIMESTAMP,
    deleted_at TIMESTAMP NULL,
    PRIMARY KEY (id),
    UNIQUE KEY uq_username (username),
    UNIQUE KEY uq_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert system user
INSERT IGNORE INTO users (id, username, email, full_name, is_system)
VALUES (
    '00000000-0000-0000-0000-000000000000',
    'system',
    'system@generator.local',
    'System User',
    true
);
```

#### 5. Helper Functions & Views

**PostgreSQL Helper Views:**

```sql
-- View: Metadata summary
CREATE OR REPLACE VIEW meta.v_table_summary AS
SELECT
    tm.id,
    tm.schema_name,
    tm.table_name,
    tm.table_purpose,
    COUNT(cm.id) as column_count,
    COUNT(CASE WHEN cm.is_filterable THEN 1 END) as filterable_count,
    COUNT(CASE WHEN cm.is_searchable THEN 1 END) as searchable_count,
    tm.status,
    tm.created_at
FROM meta.table_metadata tm
LEFT JOIN meta.column_metadata cm ON tm.id = cm.table_metadata_id
WHERE tm.deleted_at IS NULL AND cm.deleted_at IS NULL
GROUP BY tm.id, tm.schema_name, tm.table_name, tm.table_purpose, tm.status, tm.created_at
ORDER BY tm.schema_name, tm.table_name;

-- Function: Get table metadata with columns
CREATE OR REPLACE FUNCTION meta.get_table_config(p_schema varchar, p_table varchar)
RETURNS TABLE (
    table_id uuid,
    schema_name varchar,
    table_name varchar,
    primary_key_column varchar,
    primary_key_type varchar,
    has_soft_delete boolean,
    columns jsonb
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        tm.id,
        tm.schema_name,
        tm.table_name,
        tm.primary_key_column,
        tm.primary_key_type,
        tm.has_soft_delete,
        jsonb_agg(
            jsonb_build_object(
                'name', cm.column_name,
                'type', cm.data_type,
                'nullable', cm.is_nullable,
                'filterable', cm.is_filterable,
                'searchable', cm.is_searchable,
                'required', cm.is_required,
                'max_length', cm.max_length,
                'enum_values', cm.enum_values
            ) ORDER BY cm.column_order
        ) as columns
    FROM meta.table_metadata tm
    INNER JOIN meta.column_metadata cm ON tm.id = cm.table_metadata_id
    WHERE tm.schema_name = p_schema
      AND tm.table_name = p_table
      AND tm.deleted_at IS NULL
      AND cm.deleted_at IS NULL
    GROUP BY tm.id, tm.schema_name, tm.table_name, tm.primary_key_column,
             tm.primary_key_type, tm.has_soft_delete;
END;
$$ LANGUAGE plpgsql;
```

#### 6. Sample Metadata Insert

The init command also provides sample INSERT statements for quick start:

```sql
-- Example: Insert metadata for a products table
INSERT INTO meta.table_metadata (
    schema_name, table_name, table_type, table_purpose,
    has_soft_delete, primary_key_column, primary_key_type,
    created_by
) VALUES (
    'product', 'products', 'entity', 'Product catalog management',
    true, 'id', 'UUID',
    '00000000-0000-0000-0000-000000000000'
) RETURNING id;

-- Assuming the returned id is 'abc123...'
INSERT INTO meta.column_metadata (
    table_metadata_id, column_name, data_type, is_nullable,
    is_required, is_filterable, is_searchable,
    max_length, column_order, created_by
) VALUES
    ('abc123...', 'name', 'varchar', false, true, true, true, 200, 1, '00000000-0000-0000-0000-000000000000'),
    ('abc123...', 'description', 'text', true, false, false, true, null, 2, '00000000-0000-0000-0000-000000000000'),
    ('abc123...', 'price', 'numeric', false, true, true, false, null, 3, '00000000-0000-0000-0000-000000000000'),
    ('abc123...', 'category_id', 'uuid', true, false, true, false, null, 4, '00000000-0000-0000-0000-000000000000'),
    ('abc123...', 'is_active', 'bool', false, false, true, false, null, 5, '00000000-0000-0000-0000-000000000000');
```

### Implementation Code

```typescript
// libs/generator/src/core/database/setup.service.ts

import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as mysql from 'mysql2/promise';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class DatabaseSetupService {
  private sqlScriptsPath = path.join(__dirname, '../../scripts/sql');

  async runFullSetup(config: DatabaseConfig): Promise<SetupResult> {
    const steps: SetupStep[] = [];

    try {
      // 1. Test connection
      steps.push(await this.testConnection(config));

      // 2. Create schema
      steps.push(await this.createSchema(config, 'meta'));

      // 3. Create functions (PostgreSQL only)
      if (config.type === 'postgresql') {
        steps.push(await this.createFunctions(config));
      }

      // 4. Create metadata tables
      steps.push(await this.createMetadataTables(config));

      // 5. Create indexes
      steps.push(await this.createIndexes(config));

      // 6. Check/Create user schema
      steps.push(await this.setupUserSchema(config));

      // 7. Create helper views/functions
      steps.push(await this.createHelpers(config));

      return {
        success: true,
        steps,
        message: 'Database setup completed successfully',
      };
    } catch (error) {
      return {
        success: false,
        steps,
        error: error.message,
      };
    }
  }

  private async executeSQL(config: DatabaseConfig, sql: string): Promise<void> {
    if (config.type === 'postgresql') {
      const pool = new Pool(config);
      await pool.query(sql);
      await pool.end();
    } else {
      const connection = await mysql.createConnection(config);
      await connection.query(sql);
      await connection.end();
    }
  }

  private async createMetadataTables(
    config: DatabaseConfig,
  ): Promise<SetupStep> {
    const sqlFile =
      config.type === 'postgresql'
        ? 'postgresql/01_metadata_tables.sql'
        : 'mysql/01_metadata_tables.sql';

    const sql = fs.readFileSync(
      path.join(this.sqlScriptsPath, sqlFile),
      'utf-8',
    );

    await this.executeSQL(config, sql);

    return {
      name: 'Create Metadata Tables',
      status: 'success',
      message: 'Created table_metadata, column_metadata, generated_files',
    };
  }

  async checkExistingSetup(config: DatabaseConfig): Promise<SetupStatus> {
    try {
      const pool =
        config.type === 'postgresql'
          ? new Pool(config)
          : await mysql.createPool(config);

      // Check if meta schema exists
      const schemaQuery =
        config.type === 'postgresql'
          ? `SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'meta'`
          : `SELECT SCHEMA_NAME FROM information_schema.SCHEMATA WHERE SCHEMA_NAME = 'meta'`;

      const schemaResult = await pool.query(schemaQuery);
      const schemaExists =
        schemaResult.rows?.length > 0 || schemaResult[0]?.length > 0;

      if (!schemaExists) {
        return {
          isSetup: false,
          missingComponents: ['meta schema', 'metadata tables'],
        };
      }

      // Check if tables exist
      const tablesQuery =
        config.type === 'postgresql'
          ? `SELECT table_name FROM information_schema.tables 
           WHERE table_schema = 'meta' 
           AND table_name IN ('table_metadata', 'column_metadata', 'generated_files')`
          : `SELECT TABLE_NAME FROM information_schema.TABLES 
           WHERE TABLE_SCHEMA = 'meta' 
           AND TABLE_NAME IN ('table_metadata', 'column_metadata', 'generated_files')`;

      const tablesResult = await pool.query(tablesQuery);
      const tableCount =
        tablesResult.rows?.length || tablesResult[0]?.length || 0;

      if (tableCount < 3) {
        return {
          isSetup: false,
          missingComponents: ['Some metadata tables missing'],
        };
      }

      return {
        isSetup: true,
        message: 'Database is fully configured',
      };
    } catch (error) {
      return {
        isSetup: false,
        error: error.message,
      };
    }
  }
}
```

### CLI Integration

```typescript
// libs/generator/src/cli/commands/init.command.ts

import { Command } from 'commander';
import inquirer from 'inquirer';
import chalk from 'chalk';
import ora from 'ora';

export class InitCommand {
  async execute() {
    console.log(chalk.bold.cyan('\n🚀 NestJS Generator Initialization\n'));

    // Collect configuration
    const answers = await inquirer.prompt([
      {
        type: 'list',
        name: 'architecture',
        message: 'Select architecture type:',
        choices: [
          { name: 'Standalone - Single application', value: 'standalone' },
          {
            name: 'Monorepo - Multiple apps with shared libs',
            value: 'monorepo',
          },
          {
            name: 'Microservices - Distributed services with gateway',
            value: 'microservices',
          },
        ],
      },
      {
        type: 'list',
        name: 'database',
        message: 'Select database type:',
        choices: ['PostgreSQL', 'MySQL'],
      },
      {
        type: 'input',
        name: 'host',
        message: 'Database host:',
        default: 'localhost',
      },
      {
        type: 'input',
        name: 'port',
        message: 'Database port:',
        default: (answers: any) =>
          answers.database === 'PostgreSQL' ? '5432' : '3306',
      },
      {
        type: 'input',
        name: 'dbName',
        message: 'Database name:',
        validate: (input) => input.length > 0 || 'Database name is required',
      },
      {
        type: 'input',
        name: 'username',
        message: 'Database username:',
        default: 'postgres',
      },
      {
        type: 'password',
        name: 'password',
        message: 'Database password:',
        mask: '•',
      },
    ]);

    // Test connection
    const spinner = ora('Testing database connection...').start();
    const setupService = new DatabaseSetupService();

    const connected = await setupService.testConnection(answers);
    if (!connected) {
      spinner.fail('Connection failed');
      return;
    }
    spinner.succeed('Connected to database');

    // Check existing setup
    const status = await setupService.checkExistingSetup(answers);

    if (status.isSetup) {
      console.log(chalk.green('✓ Metadata schema already configured'));
      const { proceed } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'proceed',
          message: 'Metadata schema exists. Skip database setup?',
          default: true,
        },
      ]);

      if (proceed) {
        await this.saveConfig(answers);
        return;
      }
    }

    // Confirm setup
    const { confirmSetup } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirmSetup',
        message: 'Create metadata schema and tables automatically?',
        default: true,
      },
    ]);

    if (confirmSetup) {
      const setupSpinner = ora('Setting up metadata schema...').start();
      const result = await setupService.runFullSetup(answers);

      if (result.success) {
        setupSpinner.succeed('Metadata schema setup complete');

        // Display what was created
        console.log(chalk.green('\n✓ Created components:'));
        result.steps.forEach((step) => {
          console.log(chalk.gray(`  • ${step.message}`));
        });
      } else {
        setupSpinner.fail('Setup failed: ' + result.error);
        return;
      }
    }

    // Save configuration
    await this.saveConfig(answers);

    // Show next steps
    this.showNextSteps(answers);
  }

  private showNextSteps(config: any) {
    console.log(chalk.bold.cyan('\n📋 Setup Complete!\n'));
    console.log(chalk.white('Next steps:'));
    console.log(chalk.gray('1. Populate metadata tables:'));
    console.log(
      chalk.yellow('   INSERT INTO meta.table_metadata (...) VALUES (...);'),
    );
    console.log(chalk.gray('\n2. Generate your first module:'));
    console.log(chalk.yellow('   nest-generator generate <schema>.<table>'));
    console.log(chalk.gray('\n3. View generated files in: src/modules/'));
    console.log(chalk.gray('\nFor help: nest-generator --help\n'));
  }
}
```

---

## Advanced Features Implementation

### 1. Swagger/OpenAPI Documentation

**Auto-generate API documentation with full schema support.**

#### Metadata Configuration

Add swagger configuration to `column_metadata`:

```sql
ALTER TABLE meta.column_metadata
ADD COLUMN swagger_example TEXT,
ADD COLUMN swagger_description TEXT,
ADD COLUMN swagger_hidden BOOLEAN DEFAULT FALSE;

-- Example metadata
UPDATE meta.column_metadata
SET swagger_example = 'john.doe@example.com',
    swagger_description = 'User email address (must be unique)'
WHERE table_id = 'users-table' AND column_name = 'email';
```

#### Generated DTO with Swagger

```typescript
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEmail, IsString, MinLength, MaxLength } from 'class-validator';

export class CreateUserDto {
  @ApiProperty({
    description: 'Username (must be unique)',
    example: 'johndoe',
    minLength: 3,
    maxLength: 50,
  })
  @IsString()
  @MinLength(3)
  @MaxLength(50)
  username: string;

  @ApiProperty({
    description: 'User email address (must be unique)',
    example: 'john.doe@example.com',
    format: 'email',
  })
  @IsEmail()
  email: string;

  @ApiPropertyOptional({
    description: 'User department',
    example: '550e8400-e29b-41d4-a716-446655440000',
    format: 'uuid',
  })
  @IsOptional()
  @IsUUID()
  department_id?: string;
}
```

#### Main.ts Configuration

```typescript
// GENERATED_SWAGGER_START
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // Swagger configuration
  const config = new DocumentBuilder()
    .setTitle('API Documentation')
    .setDescription('Auto-generated API documentation from metadata')
    .setVersion('1.0')
    .addBearerAuth()
    .addTag('users', 'User management endpoints')
    .addTag('products', 'Product management endpoints')
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api/docs', app, document);

  await app.listen(3000);
}
// GENERATED_SWAGGER_END
```

#### Microservices Gateway Swagger

For microservices, Swagger is generated **only in the gateway**:

```typescript
// apps/gateway/src/main.ts
// GENERATED_SWAGGER_START
const config = new DocumentBuilder()
  .setTitle('Microservices API Gateway')
  .setDescription('Gateway documentation for all microservices')
  .setVersion('1.0')
  .addBearerAuth()
  .addServer('http://localhost:3000', 'Development')
  .addServer('https://api.example.com', 'Production')
  .build();
// GENERATED_SWAGGER_END
```

### 2. Export Functionality

**Export data to CSV, Excel, or PDF formats.**

#### Export Endpoints

```typescript
// GENERATED_ENDPOINT_START: export
@Get('export')
@ApiOperation({ summary: 'Export users data' })
@ApiQuery({ name: 'format', enum: ['csv', 'excel', 'pdf'] })
@ApiQuery({ name: 'columns', required: false, description: 'Comma-separated column names' })
@Throttle({ default: { limit: 10, ttl: 60000 } }) // 10 exports per minute
async export(
  @Query('format') format: 'csv' | 'excel' | 'pdf',
  @Query('columns') columns?: string,
  @Query() filters?: UserFilterDto,
  @Res() res: Response,
) {
  return this.service.export(format, filters, columns, res);
}
// GENERATED_ENDPOINT_END: export
```

#### Export Service

```typescript
// GENERATED_METHOD_START: export
async export(
  format: 'csv' | 'excel' | 'pdf',
  filters?: UserFilterDto,
  columns?: string,
  res: Response,
) {
  const data = await this.repository.findAll(filters, 1, 10000); // Max 10k records

  const selectedColumns = columns
    ? columns.split(',')
    : ['id', 'username', 'email', 'created_at']; // Default columns from metadata

  switch (format) {
    case 'csv':
      return this.exportToCsv(data, selectedColumns, res);
    case 'excel':
      return this.exportToExcel(data, selectedColumns, res);
    case 'pdf':
      return this.exportToPdf(data, selectedColumns, res);
  }
}

private async exportToCsv(data: any[], columns: string[], res: Response) {
  const { Parser } = require('json2csv');
  const parser = new Parser({ fields: columns });
  const csv = parser.parse(data);

  res.header('Content-Type', 'text/csv');
  res.header('Content-Disposition', `attachment; filename=users_${Date.now()}.csv`);
  return res.send(csv);
}

private async exportToExcel(data: any[], columns: string[], res: Response) {
  const ExcelJS = require('exceljs');
  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Users');

  worksheet.columns = columns.map(col => ({ header: col, key: col }));
  worksheet.addRows(data);

  res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  res.header('Content-Disposition', `attachment; filename=users_${Date.now()}.xlsx`);

  await workbook.xlsx.write(res);
  res.end();
}

private async exportToPdf(data: any[], columns: string[], res: Response) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();

  res.header('Content-Type', 'application/pdf');
  res.header('Content-Disposition', `attachment; filename=users_${Date.now()}.pdf`);

  doc.pipe(res);
  doc.fontSize(16).text('Users Export', { align: 'center' });
  doc.moveDown();

  data.forEach((row, index) => {
    doc.fontSize(10).text(JSON.stringify(row, null, 2));
    if (index < data.length - 1) doc.moveDown();
  });

  doc.end();
}
// GENERATED_METHOD_END: export
```

#### Dependencies

```json
{
  "dependencies": {
    "json2csv": "^6.0.0",
    "exceljs": "^4.3.0",
    "pdfkit": "^0.13.0"
  }
}
```

### 3. Caching Layer

**Redis-based caching with automatic invalidation.**

#### Cache Module Setup

```typescript
// GENERATED_CACHE_MODULE_START
import { Module } from '@nestjs/common';
import { CacheModule } from '@nestjs/cache-manager';
import { redisStore } from 'cache-manager-redis-store';

@Module({
  imports: [
    CacheModule.register({
      isGlobal: true,
      store: redisStore,
      host: process.env.REDIS_HOST || 'localhost',
      port: process.env.REDIS_PORT || 6379,
      ttl: 300, // 5 minutes default
    }),
  ],
})
export class AppCacheModule {}
// GENERATED_CACHE_MODULE_END
```

#### Cached Repository Methods

```typescript
import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';

@Injectable()
export class UsersRepository {
  constructor(
    private readonly pool: Pool,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  // GENERATED_METHOD_START: find-all-cached
  async findAll(filters?: UserFilterDto, page = 1, limit = 10) {
    const cacheKey = `users:list:${JSON.stringify({ filters, page, limit })}`;

    // Try cache first
    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    // Query database
    const result = await this.pool.query(UsersQueries.findAll, [
      limit,
      (page - 1) * limit,
    ]);

    // Cache result for 5 minutes
    await this.cacheManager.set(cacheKey, result.rows, 300000);

    return result.rows;
  }
  // GENERATED_METHOD_END: find-all-cached

  // GENERATED_METHOD_START: find-by-id-cached
  async findById(id: string) {
    const cacheKey = `users:detail:${id}`;

    const cached = await this.cacheManager.get(cacheKey);
    if (cached) return cached;

    const result = await this.pool.query(UsersQueries.findById, [id]);

    if (result.rows[0]) {
      await this.cacheManager.set(cacheKey, result.rows[0], 600000); // 10 minutes
    }

    return result.rows[0];
  }
  // GENERATED_METHOD_END: find-by-id-cached

  // GENERATED_METHOD_START: create-with-cache-invalidation
  async create(dto: CreateUserDto, userId: string) {
    const result = await this.pool.query(UsersQueries.create, [
      dto.username,
      dto.email,
      userId,
    ]);

    // Invalidate list cache
    await this.invalidateListCache();

    return result.rows[0];
  }
  // GENERATED_METHOD_END: create-with-cache-invalidation

  // GENERATED_METHOD_START: update-with-cache-invalidation
  async update(id: string, dto: UpdateUserDto) {
    const result = await this.pool.query(UsersQueries.update, [
      dto.username,
      dto.email,
      id,
    ]);

    // Invalidate specific cache and list cache
    await this.cacheManager.del(`users:detail:${id}`);
    await this.invalidateListCache();

    return result.rows[0];
  }
  // GENERATED_METHOD_END: update-with-cache-invalidation

  // GENERATED_METHOD_START: delete-with-cache-invalidation
  async softDelete(id: string) {
    const result = await this.pool.query(UsersQueries.softDelete, [id]);

    // Invalidate specific cache and list cache
    await this.cacheManager.del(`users:detail:${id}`);
    await this.invalidateListCache();

    return result.rows[0];
  }
  // GENERATED_METHOD_END: delete-with-cache-invalidation

  // GENERATED_METHOD_START: invalidate-list-cache
  private async invalidateListCache() {
    const keys = await this.cacheManager.store.keys('users:list:*');
    await Promise.all(keys.map((key) => this.cacheManager.del(key)));
  }
  // GENERATED_METHOD_END: invalidate-list-cache
}
```

#### Cache Configuration in Metadata

```sql
ALTER TABLE meta.table_metadata
ADD COLUMN cache_ttl INTEGER DEFAULT 300, -- seconds
ADD COLUMN cache_enabled BOOLEAN DEFAULT TRUE;

UPDATE meta.table_metadata
SET cache_ttl = 600, cache_enabled = TRUE
WHERE table_name = 'users';
```

### 4. Rate Limiting & Throttling

**Protect endpoints from abuse with configurable rate limits.**

#### Throttler Module Setup

```typescript
// GENERATED_THROTTLER_MODULE_START
import { Module } from '@nestjs/common';
import { ThrottlerModule } from '@nestjs/throttler';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        name: 'default',
        ttl: 60000, // 60 seconds
        limit: 100, // 100 requests
      },
      {
        name: 'strict',
        ttl: 60000,
        limit: 10, // For sensitive operations
      },
    ]),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppThrottlerModule {}
// GENERATED_THROTTLER_MODULE_END
```

#### Per-Endpoint Throttling

Throttling configuration is added to metadata:

```sql
ALTER TABLE meta.table_metadata
ADD COLUMN throttle_limit INTEGER DEFAULT 100,
ADD COLUMN throttle_ttl INTEGER DEFAULT 60000;

-- Example: Stricter limits for user creation
INSERT INTO meta.endpoint_throttle VALUES
  ('users', 'create', 20, 60000),   -- 20 per minute
  ('users', 'update', 50, 60000),   -- 50 per minute
  ('users', 'delete', 30, 60000),   -- 30 per minute
  ('users', 'findAll', 100, 60000); -- 100 per minute
```

Generated controller applies these limits (see Controller section above with `@Throttle()` decorators).

### 5. Audit Trail System

**Complete activity logging with rollback capabilities.**

#### Audit Schema

```sql
-- GENERATED_AUDIT_SCHEMA_START
CREATE SCHEMA IF NOT EXISTS audit;

CREATE TABLE audit.activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  table_name VARCHAR(100) NOT NULL,
  record_id UUID NOT NULL,
  action VARCHAR(20) NOT NULL, -- INSERT, UPDATE, DELETE
  old_data JSONB,
  new_data JSONB,
  changed_fields TEXT[],
  user_id UUID NOT NULL,
  user_ip VARCHAR(45),
  user_agent TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_audit_table_record (table_name, record_id),
  INDEX idx_audit_user (user_id),
  INDEX idx_audit_created_at (created_at)
);

CREATE TABLE audit.rollback_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  activity_log_id UUID REFERENCES audit.activity_logs(id),
  rolled_back_by UUID NOT NULL,
  rolled_back_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  success BOOLEAN DEFAULT TRUE,
  error_message TEXT
);
// GENERATED_AUDIT_SCHEMA_END
```

#### Audit Service

```typescript
// GENERATED_AUDIT_SERVICE_START
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class AuditService {
  constructor(private readonly pool: Pool) {}

  async logActivity(params: {
    tableName: string;
    recordId: string;
    action: 'INSERT' | 'UPDATE' | 'DELETE';
    oldData?: any;
    newData?: any;
    userId: string;
    userIp?: string;
    userAgent?: string;
  }) {
    const changedFields = this.getChangedFields(params.oldData, params.newData);

    const query = `
      INSERT INTO audit.activity_logs 
        (table_name, record_id, action, old_data, new_data, changed_fields, user_id, user_ip, user_agent)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
      RETURNING *
    `;

    const result = await this.pool.query(query, [
      params.tableName,
      params.recordId,
      params.action,
      JSON.stringify(params.oldData),
      JSON.stringify(params.newData),
      changedFields,
      params.userId,
      params.userIp,
      params.userAgent,
    ]);

    return result.rows[0];
  }

  async getActivityLogs(tableName: string, recordId: string) {
    const query = `
      SELECT * FROM audit.activity_logs
      WHERE table_name = $1 AND record_id = $2
      ORDER BY created_at DESC
    `;

    const result = await this.pool.query(query, [tableName, recordId]);
    return result.rows;
  }

  async rollback(activityLogId: string, userId: string) {
    const activityLog = await this.getActivityLog(activityLogId);

    if (!activityLog) {
      throw new Error('Activity log not found');
    }

    try {
      // Restore old data
      const restoreQuery = this.buildRestoreQuery(
        activityLog.table_name,
        activityLog.record_id,
        activityLog.old_data,
      );

      await this.pool.query(restoreQuery);

      // Log rollback
      await this.pool.query(
        `INSERT INTO audit.rollback_history (activity_log_id, rolled_back_by, success)
         VALUES ($1, $2, TRUE)`,
        [activityLogId, userId],
      );

      return { success: true };
    } catch (error) {
      await this.pool.query(
        `INSERT INTO audit.rollback_history (activity_log_id, rolled_back_by, success, error_message)
         VALUES ($1, $2, FALSE, $3)`,
        [activityLogId, userId, error.message],
      );

      throw error;
    }
  }

  private getChangedFields(oldData: any, newData: any): string[] {
    if (!oldData || !newData) return [];

    return Object.keys(newData).filter(
      (key) => JSON.stringify(oldData[key]) !== JSON.stringify(newData[key]),
    );
  }

  private buildRestoreQuery(
    tableName: string,
    recordId: string,
    oldData: any,
  ): string {
    const columns = Object.keys(oldData);
    const values = Object.values(oldData);

    const setClause = columns.map((col, i) => `${col} = $${i + 1}`).join(', ');

    return `UPDATE ${tableName} SET ${setClause} WHERE id = '${recordId}'`;
  }

  private async getActivityLog(id: string) {
    const result = await this.pool.query(
      'SELECT * FROM audit.activity_logs WHERE id = $1',
      [id],
    );
    return result.rows[0];
  }
}
// GENERATED_AUDIT_SERVICE_END
```

#### Integrated with Repository

```typescript
// GENERATED_METHOD_START: create-with-audit
async create(dto: CreateUserDto, userId: string, req?: Request) {
  const result = await this.pool.query(UsersQueries.create, [
    dto.username,
    dto.email,
    userId,
  ]);

  const newRecord = result.rows[0];

  // Log activity
  await this.auditService.logActivity({
    tableName: 'users',
    recordId: newRecord.id,
    action: 'INSERT',
    newData: newRecord,
    userId,
    userIp: req?.ip,
    userAgent: req?.headers['user-agent'],
  });

  return newRecord;
}
// GENERATED_METHOD_END: create-with-audit

// GENERATED_METHOD_START: update-with-audit
async update(id: string, dto: UpdateUserDto, userId: string, req?: Request) {
  // Get old data first
  const oldData = await this.findById(id);

  const result = await this.pool.query(UsersQueries.update, [
    dto.username,
    dto.email,
    id,
  ]);

  const newData = result.rows[0];

  // Log activity
  await this.auditService.logActivity({
    tableName: 'users',
    recordId: id,
    action: 'UPDATE',
    oldData,
    newData,
    userId,
    userIp: req?.ip,
    userAgent: req?.headers['user-agent'],
  });

  return newData;
}
// GENERATED_METHOD_END: update-with-audit
```

#### Audit Endpoints

```typescript
// GENERATED_ENDPOINT_START: audit-logs
@Get(':id/audit')
@ApiOperation({ summary: 'Get audit logs for user' })
@ApiBearerAuth()
async getAuditLogs(@Param('id') id: string) {
  return this.auditService.getActivityLogs('users', id);
}

@Post('audit/:logId/rollback')
@ApiOperation({ summary: 'Rollback to previous state' })
@ApiBearerAuth()
async rollback(@Param('logId') logId: string, @Request() req) {
  return this.auditService.rollback(logId, req.user.id);
}
// GENERATED_ENDPOINT_END: audit-logs
```

### 6. File Upload Handler

**Multi-file upload with validation and cloud storage support.**

#### Upload Metadata Configuration

```sql
ALTER TABLE meta.column_metadata
ADD COLUMN is_file_upload BOOLEAN DEFAULT FALSE,
ADD COLUMN file_upload_config JSONB; -- { "maxSize": 5242880, "mimeTypes": ["image/jpeg", "image/png"], "storage": "s3" }

UPDATE meta.column_metadata
SET is_file_upload = TRUE,
    file_upload_config = '{
      "maxSize": 5242880,
      "mimeTypes": ["image/jpeg", "image/png", "image/gif"],
      "storage": "s3",
      "bucket": "user-avatars"
    }'::jsonb
WHERE table_id = 'users-table' AND column_name = 'avatar_url';
```

#### File Upload Interceptor

```typescript
// GENERATED_FILE_UPLOAD_INTERCEPTOR_START
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
  BadRequestException,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname } from 'path';

@Injectable()
export class FileUploadInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const config = this.getFileConfig(); // From metadata

    // Validate file size
    if (request.file && request.file.size > config.maxSize) {
      throw new BadRequestException(
        `File size exceeds ${config.maxSize} bytes`,
      );
    }

    // Validate MIME type
    if (request.file && !config.mimeTypes.includes(request.file.mimetype)) {
      throw new BadRequestException(
        `File type ${request.file.mimetype} not allowed`,
      );
    }

    return next.handle();
  }

  private getFileConfig() {
    // Read from metadata
    return {
      maxSize: 5242880, // 5MB
      mimeTypes: ['image/jpeg', 'image/png', 'image/gif'],
    };
  }
}
// GENERATED_FILE_UPLOAD_INTERCEPTOR_END
```

#### Upload Endpoint

```typescript
// GENERATED_ENDPOINT_START: file-upload
@Post('upload')
@ApiOperation({ summary: 'Upload user avatar' })
@ApiConsumes('multipart/form-data')
@ApiBody({
  schema: {
    type: 'object',
    properties: {
      file: {
        type: 'string',
        format: 'binary',
      },
    },
  },
})
@UseInterceptors(
  FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        cb(null, `${file.fieldname}-${uniqueSuffix}${extname(file.originalname)}`);
      },
    }),
    limits: { fileSize: 5242880 }, // 5MB
    fileFilter: (req, file, cb) => {
      if (!file.mimetype.match(/\/(jpg|jpeg|png|gif)$/)) {
        return cb(new BadRequestException('Only image files allowed'), false);
      }
      cb(null, true);
    },
  }),
)
async uploadFile(@UploadedFile() file: Express.Multer.File) {
  return {
    filename: file.filename,
    path: file.path,
    size: file.size,
    mimetype: file.mimetype,
  };
}

@Post('upload-multiple')
@ApiOperation({ summary: 'Upload multiple files' })
@UseInterceptors(FilesInterceptor('files', 10)) // Max 10 files
async uploadMultipleFiles(@UploadedFiles() files: Express.Multer.File[]) {
  return files.map(file => ({
    filename: file.filename,
    path: file.path,
    size: file.size,
  }));
}
// GENERATED_ENDPOINT_END: file-upload
```

#### S3 Upload Service

```typescript
// GENERATED_S3_SERVICE_START
import { Injectable } from '@nestjs/common';
import { S3 } from 'aws-sdk';

@Injectable()
export class S3UploadService {
  private s3: S3;

  constructor() {
    this.s3 = new S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
  }

  async uploadFile(file: Express.Multer.File, bucket: string): Promise<string> {
    const params = {
      Bucket: bucket,
      Key: `${Date.now()}-${file.originalname}`,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    };

    const result = await this.s3.upload(params).promise();
    return result.Location;
  }

  async deleteFile(fileUrl: string, bucket: string): Promise<void> {
    const key = fileUrl.split('/').pop();

    await this.s3
      .deleteObject({
        Bucket: bucket,
        Key: key,
      })
      .promise();
  }
}
// GENERATED_S3_SERVICE_END
```

### 7. Search Engine Integration

**Elasticsearch/Algolia for advanced search capabilities.**

#### Elasticsearch Configuration

```typescript
// GENERATED_ELASTICSEARCH_MODULE_START
import { Module } from '@nestjs/common';
import { ElasticsearchModule } from '@nestjs/elasticsearch';

@Module({
  imports: [
    ElasticsearchModule.register({
      node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200',
      auth: {
        username: process.env.ELASTICSEARCH_USERNAME,
        password: process.env.ELASTICSEARCH_PASSWORD,
      },
    }),
  ],
})
export class SearchModule {}
// GENERATED_ELASTICSEARCH_MODULE_END
```

#### Search Service

```typescript
// GENERATED_SEARCH_SERVICE_START
import { Injectable } from '@nestjs/common';
import { ElasticsearchService } from '@nestjs/elasticsearch';

@Injectable()
export class UsersSearchService {
  private readonly index = 'users';

  constructor(private readonly elasticsearchService: ElasticsearchService) {}

  async indexUser(user: any) {
    return this.elasticsearchService.index({
      index: this.index,
      id: user.id,
      document: {
        username: user.username,
        email: user.email,
        full_name: user.full_name,
        department: user.department_name,
        created_at: user.created_at,
      },
    });
  }

  async search(query: string, page = 1, limit = 10) {
    const { body } = await this.elasticsearchService.search({
      index: this.index,
      from: (page - 1) * limit,
      size: limit,
      body: {
        query: {
          multi_match: {
            query,
            fields: ['username^3', 'email^2', 'full_name^2', 'department'],
            fuzziness: 'AUTO',
          },
        },
        highlight: {
          fields: {
            username: {},
            email: {},
            full_name: {},
          },
        },
      },
    });

    return {
      total: body.hits.total.value,
      results: body.hits.hits.map((hit: any) => ({
        ...hit._source,
        score: hit._score,
        highlights: hit.highlight,
      })),
    };
  }

  async autocomplete(query: string, limit = 5) {
    const { body } = await this.elasticsearchService.search({
      index: this.index,
      size: limit,
      body: {
        query: {
          bool: {
            should: [
              {
                match_phrase_prefix: {
                  username: {
                    query,
                    boost: 3,
                  },
                },
              },
              {
                match_phrase_prefix: {
                  email: query,
                },
              },
            ],
          },
        },
      },
    });

    return body.hits.hits.map((hit: any) => hit._source);
  }

  async deleteUser(userId: string) {
    return this.elasticsearchService.delete({
      index: this.index,
      id: userId,
    });
  }
}
// GENERATED_SEARCH_SERVICE_END
```

#### Search Endpoints

```typescript
// GENERATED_ENDPOINT_START: search
@Get('search')
@ApiOperation({ summary: 'Full-text search users' })
@ApiQuery({ name: 'q', description: 'Search query' })
@Throttle({ default: { limit: 50, ttl: 60000 } })
async search(
  @Query('q') query: string,
  @Query('page') page = 1,
  @Query('limit') limit = 10,
) {
  return this.searchService.search(query, page, limit);
}

@Get('autocomplete')
@ApiOperation({ summary: 'Search autocomplete' })
@ApiQuery({ name: 'q', description: 'Search query' })
@Throttle({ default: { limit: 100, ttl: 60000 } })
async autocomplete(@Query('q') query: string) {
  return this.searchService.autocomplete(query);
}
// GENERATED_ENDPOINT_END: search
```

#### Auto-Sync with Elasticsearch

```typescript
// Update create method to auto-index
async create(dto: CreateUserDto, userId: string) {
  const result = await this.repository.create(dto, userId);

  // Index to Elasticsearch
  await this.searchService.indexUser(result);

  return result;
}

// Update delete method to remove from index
async remove(id: string) {
  const result = await this.repository.softDelete(id);

  // Remove from Elasticsearch
  await this.searchService.deleteUser(id);

  return result;
}
```

### 8. Permission & RBAC Generator

**Role-based access control with field-level permissions.**

#### Permission Schema

```sql
-- GENERATED_RBAC_SCHEMA_START
CREATE SCHEMA IF NOT EXISTS rbac;

CREATE TABLE rbac.roles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  name VARCHAR(50) UNIQUE NOT NULL,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rbac.permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  resource VARCHAR(50) NOT NULL, -- 'users', 'products', etc.
  action VARCHAR(20) NOT NULL,   -- 'read', 'create', 'update', 'delete'
  code VARCHAR(100) UNIQUE NOT NULL, -- 'users:read', 'users:create'
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE rbac.role_permissions (
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES rbac.permissions(id) ON DELETE CASCADE,
  PRIMARY KEY (role_id, permission_id)
);

CREATE TABLE rbac.user_roles (
  user_id UUID NOT NULL,
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  assigned_by UUID NOT NULL,
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, role_id)
);

CREATE TABLE rbac.field_permissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  role_id UUID REFERENCES rbac.roles(id) ON DELETE CASCADE,
  resource VARCHAR(50) NOT NULL,
  field_name VARCHAR(50) NOT NULL,
  can_read BOOLEAN DEFAULT FALSE,
  can_write BOOLEAN DEFAULT FALSE,
  UNIQUE (role_id, resource, field_name)
);
// GENERATED_RBAC_SCHEMA_END
```

#### Permission Decorator

```typescript
// GENERATED_PERMISSION_DECORATOR_START
import { SetMetadata } from '@nestjs/common';

export const PERMISSIONS_KEY = 'permissions';
export const RequirePermission = (...permissions: string[]) =>
  SetMetadata(PERMISSIONS_KEY, permissions);
// GENERATED_PERMISSION_DECORATOR_END
```

#### Permission Guard

```typescript
// GENERATED_PERMISSION_GUARD_START
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './permissions.decorator';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private permissionService: PermissionService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );

    if (!requiredPermissions) {
      return true;
    }

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user) {
      return false;
    }

    const userPermissions = await this.permissionService.getUserPermissions(
      user.id,
    );

    return requiredPermissions.every((permission) =>
      userPermissions.includes(permission),
    );
  }
}
// GENERATED_PERMISSION_GUARD_END
```

#### Permission Service

```typescript
// GENERATED_PERMISSION_SERVICE_START
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';

@Injectable()
export class PermissionService {
  constructor(private readonly pool: Pool) {}

  async getUserPermissions(userId: string): Promise<string[]> {
    const query = `
      SELECT DISTINCT p.code
      FROM rbac.permissions p
      INNER JOIN rbac.role_permissions rp ON p.id = rp.permission_id
      INNER JOIN rbac.user_roles ur ON rp.role_id = ur.role_id
      WHERE ur.user_id = $1
    `;

    const result = await this.pool.query(query, [userId]);
    return result.rows.map((row) => row.code);
  }

  async getUserFieldPermissions(
    userId: string,
    resource: string,
  ): Promise<{ field: string; canRead: boolean; canWrite: boolean }[]> {
    const query = `
      SELECT fp.field_name, fp.can_read, fp.can_write
      FROM rbac.field_permissions fp
      INNER JOIN rbac.user_roles ur ON fp.role_id = ur.role_id
      WHERE ur.user_id = $1 AND fp.resource = $2
    `;

    const result = await this.pool.query(query, [userId, resource]);
    return result.rows.map((row) => ({
      field: row.field_name,
      canRead: row.can_read,
      canWrite: row.can_write,
    }));
  }

  async filterFields(
    userId: string,
    resource: string,
    data: any,
    action: 'read' | 'write',
  ) {
    const fieldPermissions = await this.getUserFieldPermissions(
      userId,
      resource,
    );

    const allowedFields = fieldPermissions
      .filter((fp) => (action === 'read' ? fp.canRead : fp.canWrite))
      .map((fp) => fp.field);

    // Filter data object
    const filtered = {};
    for (const key of Object.keys(data)) {
      if (allowedFields.includes(key)) {
        filtered[key] = data[key];
      }
    }

    return filtered;
  }
}
// GENERATED_PERMISSION_SERVICE_END
```

#### Protected Endpoints

```typescript
// GENERATED_ENDPOINT_START: protected-endpoints
@Post()
@ApiBearerAuth()
@RequirePermission('users:create')
@UseGuards(PermissionsGuard)
@ApiOperation({ summary: 'Create new user (requires users:create permission)' })
async create(@Body() dto: CreateUserDto, @Request() req) {
  // Filter writable fields based on user permissions
  const filteredDto = await this.permissionService.filterFields(
    req.user.id,
    'users',
    dto,
    'write',
  );

  return this.service.create(filteredDto, req.user.id);
}

@Put(':id')
@ApiBearerAuth()
@RequirePermission('users:update')
@UseGuards(PermissionsGuard)
@ApiOperation({ summary: 'Update user (requires users:update permission)' })
async update(@Param('id') id: string, @Body() dto: UpdateUserDto, @Request() req) {
  const filteredDto = await this.permissionService.filterFields(
    req.user.id,
    'users',
    dto,
    'write',
  );

  return this.service.update(id, filteredDto);
}

@Get(':id')
@ApiBearerAuth()
@RequirePermission('users:read')
@UseGuards(PermissionsGuard)
@ApiOperation({ summary: 'Get user (requires users:read permission)' })
async findOne(@Param('id') id: string, @Request() req) {
  const user = await this.service.findOne(id);

  // Filter readable fields
  return this.permissionService.filterFields(req.user.id, 'users', user, 'read');
}
// GENERATED_ENDPOINT_END: protected-endpoints
```

### 9. Notification System

**Email/SMS/Push notification with queue management.**

#### Notification Schema

```sql
-- GENERATED_NOTIFICATION_SCHEMA_START
CREATE SCHEMA IF NOT EXISTS notifications;

CREATE TABLE notifications.templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name VARCHAR(200) NOT NULL,
  channel VARCHAR(20) NOT NULL, -- 'email', 'sms', 'push'
  subject TEXT,
  body TEXT NOT NULL,
  variables JSONB, -- {"user_name": "string", "order_id": "string"}
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE notifications.queue (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v7(),
  template_id UUID REFERENCES notifications.templates(id),
  channel VARCHAR(20) NOT NULL,
  recipient VARCHAR(255) NOT NULL, -- email, phone, or device token
  subject TEXT,
  body TEXT NOT NULL,
  data JSONB,
  status VARCHAR(20) DEFAULT 'pending', -- pending, sent, failed
  attempts INTEGER DEFAULT 0,
  max_attempts INTEGER DEFAULT 3,
  error_message TEXT,
  scheduled_at TIMESTAMP,
  sent_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

  INDEX idx_notification_status (status),
  INDEX idx_notification_scheduled (scheduled_at)
);

CREATE TABLE notifications.user_preferences (
  user_id UUID NOT NULL,
  channel VARCHAR(20) NOT NULL,
  event_type VARCHAR(100) NOT NULL, -- 'user_created', 'order_placed', etc.
  enabled BOOLEAN DEFAULT TRUE,
  PRIMARY KEY (user_id, channel, event_type)
);
// GENERATED_NOTIFICATION_SCHEMA_END
```

#### Notification Service

```typescript
// GENERATED_NOTIFICATION_SERVICE_START
import { Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import * as nodemailer from 'nodemailer';
import * as twilio from 'twilio';

@Injectable()
export class NotificationService {
  private emailTransporter: nodemailer.Transporter;
  private smsClient: twilio.Twilio;

  constructor(private readonly pool: Pool) {
    // Email setup
    this.emailTransporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: parseInt(process.env.SMTP_PORT),
      secure: true,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    // SMS setup (Twilio)
    this.smsClient = twilio(
      process.env.TWILIO_ACCOUNT_SID,
      process.env.TWILIO_AUTH_TOKEN,
    );
  }

  async sendNotification(params: {
    templateCode: string;
    recipient: string;
    channel: 'email' | 'sms' | 'push';
    data?: Record<string, any>;
    scheduledAt?: Date;
  }) {
    // Get template
    const template = await this.getTemplate(params.templateCode);

    if (!template || !template.is_active) {
      throw new Error(`Template ${params.templateCode} not found or inactive`);
    }

    // Check user preferences
    const canSend = await this.checkUserPreference(
      params.recipient,
      params.channel,
      params.templateCode,
    );

    if (!canSend) {
      return { status: 'skipped', reason: 'User preference disabled' };
    }

    // Replace variables in template
    const body = this.replaceVariables(template.body, params.data);
    const subject = template.subject
      ? this.replaceVariables(template.subject, params.data)
      : null;

    // Queue notification
    const queueId = await this.queueNotification({
      templateId: template.id,
      channel: params.channel,
      recipient: params.recipient,
      subject,
      body,
      data: params.data,
      scheduledAt: params.scheduledAt,
    });

    // Send immediately if not scheduled
    if (!params.scheduledAt) {
      await this.processNotification(queueId);
    }

    return { queueId, status: 'queued' };
  }

  async processNotification(queueId: string) {
    const notification = await this.getQueuedNotification(queueId);

    if (!notification) {
      throw new Error('Notification not found');
    }

    try {
      switch (notification.channel) {
        case 'email':
          await this.sendEmail(notification);
          break;
        case 'sms':
          await this.sendSMS(notification);
          break;
        case 'push':
          await this.sendPushNotification(notification);
          break;
      }

      // Mark as sent
      await this.pool.query(
        `UPDATE notifications.queue 
         SET status = 'sent', sent_at = CURRENT_TIMESTAMP 
         WHERE id = $1`,
        [queueId],
      );

      return { status: 'sent' };
    } catch (error) {
      // Increment attempts and mark as failed if max attempts reached
      await this.pool.query(
        `UPDATE notifications.queue 
         SET attempts = attempts + 1,
             status = CASE WHEN attempts + 1 >= max_attempts THEN 'failed' ELSE 'pending' END,
             error_message = $1
         WHERE id = $2`,
        [error.message, queueId],
      );

      throw error;
    }
  }

  private async sendEmail(notification: any) {
    await this.emailTransporter.sendMail({
      from: process.env.SMTP_FROM,
      to: notification.recipient,
      subject: notification.subject,
      html: notification.body,
    });
  }

  private async sendSMS(notification: any) {
    await this.smsClient.messages.create({
      body: notification.body,
      from: process.env.TWILIO_PHONE_NUMBER,
      to: notification.recipient,
    });
  }

  private async sendPushNotification(notification: any) {
    // Implement Firebase Cloud Messaging or similar
    // Example with FCM:
    // await admin.messaging().send({
    //   token: notification.recipient,
    //   notification: {
    //     title: notification.subject,
    //     body: notification.body,
    //   },
    //   data: notification.data,
    // });
  }

  private async getTemplate(code: string) {
    const result = await this.pool.query(
      'SELECT * FROM notifications.templates WHERE code = $1 AND is_active = TRUE',
      [code],
    );
    return result.rows[0];
  }

  private async checkUserPreference(
    recipient: string,
    channel: string,
    eventType: string,
  ): Promise<boolean> {
    const result = await this.pool.query(
      `SELECT enabled FROM notifications.user_preferences 
       WHERE user_id = (SELECT id FROM user.users WHERE email = $1)
       AND channel = $2 AND event_type = $3`,
      [recipient, channel, eventType],
    );

    return result.rows.length === 0 || result.rows[0].enabled;
  }

  private async queueNotification(params: any): Promise<string> {
    const result = await this.pool.query(
      `INSERT INTO notifications.queue 
        (template_id, channel, recipient, subject, body, data, scheduled_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id`,
      [
        params.templateId,
        params.channel,
        params.recipient,
        params.subject,
        params.body,
        JSON.stringify(params.data),
        params.scheduledAt,
      ],
    );

    return result.rows[0].id;
  }

  private async getQueuedNotification(id: string) {
    const result = await this.pool.query(
      'SELECT * FROM notifications.queue WHERE id = $1',
      [id],
    );
    return result.rows[0];
  }

  private replaceVariables(
    template: string,
    data: Record<string, any>,
  ): string {
    let result = template;

    for (const [key, value] of Object.entries(data || {})) {
      result = result.replace(new RegExp(`{{${key}}}`, 'g'), String(value));
    }

    return result;
  }

  async processQueue() {
    // Process pending notifications (can be called by cron job)
    const result = await this.pool.query(
      `SELECT id FROM notifications.queue 
       WHERE status = 'pending' 
       AND (scheduled_at IS NULL OR scheduled_at <= CURRENT_TIMESTAMP)
       AND attempts < max_attempts
       LIMIT 100`,
    );

    for (const row of result.rows) {
      try {
        await this.processNotification(row.id);
      } catch (error) {
        console.error(`Failed to process notification ${row.id}:`, error);
      }
    }
  }
}
// GENERATED_NOTIFICATION_SERVICE_END
```

#### Event-Driven Notifications

```typescript
// GENERATED_EVENT_NOTIFICATION_START
import { Injectable } from '@nestjs/common';
import { OnEvent } from '@nestjs/event-emitter';

@Injectable()
export class NotificationListener {
  constructor(private readonly notificationService: NotificationService) {}

  @OnEvent('user.created')
  async handleUserCreated(payload: { user: any }) {
    await this.notificationService.sendNotification({
      templateCode: 'user_welcome',
      recipient: payload.user.email,
      channel: 'email',
      data: {
        user_name: payload.user.username,
        user_email: payload.user.email,
      },
    });
  }

  @OnEvent('user.updated')
  async handleUserUpdated(payload: { user: any; changes: string[] }) {
    // Send notification about profile update
    await this.notificationService.sendNotification({
      templateCode: 'user_profile_updated',
      recipient: payload.user.email,
      channel: 'email',
      data: {
        user_name: payload.user.username,
        changed_fields: payload.changes.join(', '),
      },
    });
  }

  @OnEvent('user.deleted')
  async handleUserDeleted(payload: { user: any }) {
    await this.notificationService.sendNotification({
      templateCode: 'user_account_deleted',
      recipient: payload.user.email,
      channel: 'email',
      data: {
        user_name: payload.user.username,
      },
    });
  }
}
// GENERATED_EVENT_NOTIFICATION_END
```

#### Emit Events from Service

```typescript
// Update service methods to emit events
async create(dto: CreateUserDto, userId: string) {
  const result = await this.repository.create(dto, userId);

  // Emit event
  this.eventEmitter.emit('user.created', { user: result });

  return result;
}

async update(id: string, dto: UpdateUserDto) {
  const oldData = await this.findOne(id);
  const result = await this.repository.update(id, dto);

  const changes = Object.keys(dto);
  this.eventEmitter.emit('user.updated', { user: result, changes });

  return result;
}
```

---

## Advanced Pagination Strategies

**Support both offset and cursor-based pagination for scalability.**

### Cursor/Keyset Pagination

```typescript
// GENERATED_CURSOR_PAGINATION_START
export class CursorPaginationDto {
  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    description: 'Cursor for next page (base64 encoded)',
    example: 'eyJjcmVhdGVkX2F0IjoiMjAyNC0wMS0wMVQwMDowMDowMFoiLCJpZCI6IjEyMyJ9',
  })
  cursor?: string;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ description: 'Page size', default: 20 })
  limit?: number = 20;

  @IsOptional()
  @IsEnum(['asc', 'desc'])
  @ApiPropertyOptional({ description: 'Sort direction', default: 'desc' })
  direction?: 'asc' | 'desc' = 'desc';
}

interface DecodedCursor {
  created_at: string;
  id: string;
}

export class PaginationHelper {
  /**
   * Encode cursor from last record
   */
  static encodeCursor(record: { created_at: Date; id: string }): string {
    const cursor: DecodedCursor = {
      created_at: record.created_at.toISOString(),
      id: record.id,
    };
    return Buffer.from(JSON.stringify(cursor)).toString('base64');
  }

  /**
   * Decode cursor to get position
   */
  static decodeCursor(cursor: string): DecodedCursor | null {
    try {
      const decoded = Buffer.from(cursor, 'base64').toString('utf-8');
      return JSON.parse(decoded);
    } catch {
      throw new BadRequestException('Invalid cursor');
    }
  }

  /**
   * Build keyset WHERE clause
   */
  static buildKeysetClause(
    cursor: DecodedCursor | null,
    direction: 'asc' | 'desc',
    dialect: DatabaseDialect,
  ): { clause: string; params: any[] } {
    if (!cursor) {
      return { clause: '', params: [] };
    }

    const op = direction === 'desc' ? '<' : '>';
    const createdAt = dialect.quoteIdentifier('created_at');
    const id = dialect.quoteIdentifier('id');

    // Use tuple comparison for proper pagination
    const clause = `(${createdAt}, ${id}) ${op} ($1, $2)`;
    const params = [cursor.created_at, cursor.id];

    return { clause, params };
  }
}

// Usage in repository
async findAllCursor(
  filters: UserFilterDto,
  pagination: CursorPaginationDto,
): Promise<{ data: User[]; nextCursor: string | null; hasMore: boolean }> {
  const columns = await this.metadataService.getColumns('users');
  const { limit, direction, cursor } = pagination;

  // Compile filters
  const compiled = this.filterCompiler.compile(filters, columns, 1);

  // Decode cursor
  const decodedCursor = cursor ? PaginationHelper.decodeCursor(cursor) : null;
  const keysetClause = PaginationHelper.buildKeysetClause(
    decodedCursor,
    direction,
    this.dialect,
  );

  // Build query
  let query = `
    SELECT ${this.buildSelectClause(columns)}
    FROM ${this.dialect.quoteIdentifier('user.users')}
    WHERE deleted_at IS NULL
  `;

  let paramIndex = 1;
  const params: any[] = [];

  // Add keyset clause
  if (keysetClause.clause) {
    query += ` AND ${keysetClause.clause}`;
    params.push(...keysetClause.params);
    paramIndex += keysetClause.params.length;
  }

  // Add filters
  if (compiled.clauses.length > 0) {
    // Adjust param indices in compiled clauses
    const adjustedClauses = compiled.clauses.map(clause =>
      clause.replace(/\$(\d+)/g, (_, num) => `$${parseInt(num) + paramIndex - 1}`),
    );
    query += ` AND ${adjustedClauses.join(' AND ')}`;
    params.push(...compiled.params);
    paramIndex += compiled.params.length;
  }

  // Order and limit (fetch +1 to check hasMore)
  query += `
    ORDER BY ${this.dialect.quoteIdentifier('created_at')} ${direction.toUpperCase()},
             ${this.dialect.quoteIdentifier('id')} ${direction.toUpperCase()}
    LIMIT $${paramIndex}
  `;
  params.push(limit + 1);

  const result = await this.pool.query(query, params);
  const rows = result.rows || result[0];

  const hasMore = rows.length > limit;
  const data = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore && data.length > 0
    ? PaginationHelper.encodeCursor(data[data.length - 1])
    : null;

  return { data, nextCursor, hasMore };
}
// GENERATED_CURSOR_PAGINATION_END
```

### Offset Pagination (Backward Compatible)

```typescript
// GENERATED_OFFSET_PAGINATION_START
export class OffsetPaginationDto {
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  @ApiPropertyOptional({ default: 1 })
  page?: number = 1;

  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  @Type(() => Number)
  @ApiPropertyOptional({ default: 20 })
  limit?: number = 20;
}

async findAllOffset(
  filters: UserFilterDto,
  pagination: OffsetPaginationDto,
): Promise<{ data: User[]; total: number; page: number; pageCount: number }> {
  const { page, limit } = pagination;
  const offset = (page - 1) * limit;

  // Get total count
  const countQuery = `
    SELECT COUNT(*) as total
    FROM ${this.dialect.quoteIdentifier('user.users')}
    WHERE deleted_at IS NULL
  `;
  const countResult = await this.pool.query(countQuery);
  const total = parseInt(countResult.rows[0]?.total || countResult[0][0]?.total || 0);

  // Get data
  const compiled = this.filterCompiler.compile(filters, columns, 1);

  let query = `
    SELECT ${this.buildSelectClause(columns)}
    FROM ${this.dialect.quoteIdentifier('user.users')}
    WHERE deleted_at IS NULL
  `;

  if (compiled.clauses.length > 0) {
    query += ` AND ${compiled.clauses.join(' AND ')}`;
  }

  query += ` ORDER BY created_at DESC`;
  query += ` LIMIT $${compiled.nextParamIndex} OFFSET $${compiled.nextParamIndex + 1}`;

  const params = [...compiled.params, limit, offset];
  const result = await this.pool.query(query, params);

  return {
    data: result.rows || result[0],
    total,
    page,
    pageCount: Math.ceil(total / limit),
  };
}
// GENERATED_OFFSET_PAGINATION_END
```

### Hybrid Pagination Endpoint

```typescript
// GENERATED_HYBRID_PAGINATION_ENDPOINT_START
@Get()
@ApiOperation({ summary: 'Get all users with pagination' })
@ApiQuery({ name: 'cursor', required: false, description: 'Use cursor pagination' })
@ApiQuery({ name: 'page', required: false, description: 'Use offset pagination' })
async findAll(
  @Query() filters: UserFilterDto,
  @Query() cursorPagination: CursorPaginationDto,
  @Query() offsetPagination: OffsetPaginationDto,
) {
  // Use cursor if provided, otherwise offset
  if (cursorPagination.cursor !== undefined || offsetPagination.page === undefined) {
    return this.service.findAllCursor(filters, cursorPagination);
  } else {
    return this.service.findAllOffset(filters, offsetPagination);
  }
}
// GENERATED_HYBRID_PAGINATION_ENDPOINT_END
```

---

## Timezone Support for Aggregations

**Handle timezone-aware date aggregations.**

### Metadata Extension

```sql
-- Add timezone config to table_metadata
ALTER TABLE meta.table_metadata
ADD COLUMN default_timezone VARCHAR(50) DEFAULT 'UTC',
ADD COLUMN date_aggregation_field VARCHAR(100) DEFAULT 'created_at';

-- Example
UPDATE meta.table_metadata
SET default_timezone = 'Asia/Jakarta',
    date_aggregation_field = 'created_at'
WHERE table_name = 'users';
```

### Timezone-Aware Recap

```typescript
// GENERATED_TIMEZONE_RECAP_START
export class RecapQueryDto {
  @IsInt()
  @Min(2000)
  @Max(2100)
  @Type(() => Number)
  @ApiProperty({ example: 2024 })
  year: number;

  @IsOptional()
  @IsString()
  @Matches(/^[A-Za-z/_]+$/, { message: 'Invalid timezone format' })
  @ApiPropertyOptional({
    example: 'Asia/Jakarta',
    description: 'IANA timezone name',
    default: 'UTC',
  })
  timezone?: string = 'UTC';

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'department,role',
    description: 'Comma-separated fields to group by (max 2)',
  })
  group_by?: string;

  @IsOptional()
  @IsString()
  @ApiPropertyOptional({
    example: 'created_at',
    description: 'Date field for aggregation',
    default: 'created_at',
  })
  date_field?: string = 'created_at';
}

async recap(dto: RecapQueryDto): Promise<RecapResult[]> {
  const metadata = await this.metadataService.getTableMetadata('users');
  const columns = await this.metadataService.getColumns('users');

  // Validate timezone
  const timezone = dto.timezone || metadata.default_timezone || 'UTC';
  if (!/^[A-Za-z/_]+$/.test(timezone)) {
    throw new BadRequestException('Invalid timezone');
  }

  // Validate date field
  const dateField = dto.date_field || metadata.date_aggregation_field || 'created_at';
  const dateColumn = columns.find(c => c.column_name === dateField);
  if (!dateColumn || !['timestamp', 'date', 'timestamptz'].includes(dateColumn.data_type)) {
    throw new BadRequestException('Invalid date field');
  }

  // Validate and sanitize group_by
  const groupByFields = dto.group_by
    ? SecurityValidator.validateIdentifiers(
        dto.group_by.split(','),
        columns.filter(c => c.is_filterable).map(c => c.column_name),
        'group_by',
        2,
      )
    : ['department'];

  // Build timezone-aware query
  const field1 = this.dialect.quoteIdentifier(groupByFields[0]);
  const field2 = groupByFields[1] ? this.dialect.quoteIdentifier(groupByFields[1]) : null;
  const dateCol = this.dialect.quoteIdentifier(dateField);

  let query: string;
  if (groupByFields.length === 1) {
    query = `
      SELECT
        ${field1} AS main,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 1) AS jan,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 2) AS feb,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 3) AS mar,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 4) AS apr,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 5) AS may,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 6) AS jun,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 7) AS jul,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 8) AS aug,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 9) AS sep,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 10) AS oct,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 11) AS nov,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 12) AS dec,
        COUNT(*) AS total
      FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE ${this.dialect.extractYear(dateCol, timezone)} = $1
        AND deleted_at IS NULL
      GROUP BY ${field1}
      ORDER BY total DESC, main ASC
    `;
  } else {
    query = `
      SELECT
        ${field1} AS main,
        ${field2} AS sub,
        COUNT(*) FILTER (WHERE ${this.dialect.extractMonth(dateCol, timezone)} = 1) AS jan,
        -- ... other months
        COUNT(*) AS total
      FROM ${this.dialect.quoteIdentifier('user.users')}
      WHERE ${this.dialect.extractYear(dateCol, timezone)} = $1
        AND deleted_at IS NULL
      GROUP BY ${field1}, ${field2}
      ORDER BY main ASC, total DESC
    `;
  }

  const result = await this.pool.query(query, [dto.year]);
  return result.rows || result[0];
}
// GENERATED_TIMEZONE_RECAP_END
```

### MySQL Timezone Handling

```typescript
// MySQL doesn't support AT TIME ZONE, use CONVERT_TZ
extractMonth(column: string, timezone = 'UTC'): string {
  // Convert from UTC to target timezone
  return `MONTH(CONVERT_TZ(${this.quoteIdentifier(column)}, 'UTC', '${timezone}'))`;
}

extractYear(column: string, timezone = 'UTC'): string {
  return `YEAR(CONVERT_TZ(${this.quoteIdentifier(column)}, 'UTC', '${timezone}'))`;
}
```

---

## API Contract Extensions

**Modern HTTP patterns for robust APIs.**

### PATCH - Partial Update Support

```typescript
// GENERATED_PATCH_ENDPOINT_START
export class PatchUserDto extends PartialType(UpdateUserDto) {}

@Patch(':id')
@ApiBearerAuth()
@ApiOperation({ summary: 'Partially update user' })
@ApiResponse({ status: 200, description: 'User updated', type: CreateUserDto })
@ApiResponse({ status: 404, description: 'User not found' })
async partialUpdate(
  @Param('id') id: string,
  @Body() dto: PatchUserDto,
  @Request() req,
) {
  // Only update provided fields
  const existingUser = await this.service.findOne(id);
  const merged = { ...existingUser, ...dto };
  return this.service.update(id, merged);
}
// GENERATED_PATCH_ENDPOINT_END
```

### Bulk Operations

```typescript
// GENERATED_BULK_OPERATIONS_START
export class BulkCreateDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateUserDto)
  @ArrayMinSize(1)
  @ArrayMaxSize(1000) // Limit to prevent abuse
  @ApiProperty({ type: [CreateUserDto] })
  items: CreateUserDto[];
}

@Post('bulk')
@ApiBearerAuth()
@ApiOperation({ summary: 'Bulk create users' })
@Throttle({ default: { limit: 5, ttl: 60000 } }) // Stricter limit
async bulkCreate(@Body() dto: BulkCreateDto, @Request() req) {
  return this.service.bulkCreate(dto.items, req.user.id);
}

@Put('bulk')
@ApiBearerAuth()
@ApiOperation({ summary: 'Bulk update users' })
async bulkUpdate(@Body() dto: BulkUpdateDto, @Request() req) {
  return this.service.bulkUpdate(dto.items, req.user.id);
}

@Delete('bulk')
@ApiBearerAuth()
@ApiOperation({ summary: 'Bulk delete users' })
async bulkDelete(@Body() dto: BulkDeleteDto, @Request() req) {
  return this.service.bulkDelete(dto.ids, req.user.id);
}

// Service implementation with transaction
async bulkCreate(items: CreateUserDto[], userId: string) {
  const client = await this.pool.connect();
  try {
    await client.query('BEGIN');
    const results = [];
    for (const item of items) {
      const result = await client.query(UsersQueries.create, [
        item.username,
        item.email,
        userId,
      ]);
      results.push(result.rows[0]);
    }
    await client.query('COMMIT');
    return results;
  } catch (error) {
    await client.query('ROLLBACK');
    throw error;
  } finally {
    client.release();
  }
}
// GENERATED_BULK_OPERATIONS_END
```

### Idempotency Keys

```typescript
// GENERATED_IDEMPOTENCY_START
@Injectable()
export class IdempotencyService {
  constructor(
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {}

  async checkIdempotency(
    key: string,
    operation: () => Promise<any>,
    ttl = 86400, // 24 hours
  ): Promise<any> {
    // Check if result exists
    const cached = await this.cacheManager.get(`idempotency:${key}`);
    if (cached) {
      return cached;
    }

    // Execute operation
    const result = await operation();

    // Cache result
    await this.cacheManager.set(`idempotency:${key}`, result, ttl * 1000);

    return result;
  }
}

// Usage in controller
@Post()
@ApiBearerAuth()
@ApiOperation({ summary: 'Create user (idempotent)' })
@ApiHeader({ name: 'Idempotency-Key', required: false })
async create(
  @Body() dto: CreateUserDto,
  @Headers('idempotency-key') idempotencyKey?: string,
  @Request() req?,
) {
  if (idempotencyKey) {
    return this.idempotencyService.checkIdempotency(
      idempotencyKey,
      () => this.service.create(dto, req.user.id),
    );
  }
  return this.service.create(dto, req.user.id);
}
// GENERATED_IDEMPOTENCY_END
```

### ETag & Conditional Requests

```typescript
// GENERATED_ETAG_SUPPORT_START
@Injectable()
export class ETagService {
  generateETag(data: any): string {
    const hash = createHash('sha256');
    hash.update(JSON.stringify(data));
    return `"${hash.digest('hex').substring(0, 16)}"`;
  }

  matches(etag: string, ifNoneMatch?: string): boolean {
    if (!ifNoneMatch) return false;
    return ifNoneMatch === etag || ifNoneMatch === '*';
  }
}

@Get(':id')
@ApiOperation({ summary: 'Get user with ETag support' })
@ApiHeader({ name: 'If-None-Match', required: false })
async findOne(
  @Param('id') id: string,
  @Headers('if-none-match') ifNoneMatch?: string,
  @Res({ passthrough: true }) res?: Response,
) {
  const user = await this.service.findOne(id);
  const etag = this.etagService.generateETag(user);

  if (this.etagService.matches(etag, ifNoneMatch)) {
    res.status(304); // Not Modified
    return;
  }

  res.setHeader('ETag', etag);
  res.setHeader('Cache-Control', 'max-age=60, must-revalidate');
  return user;
}

@Put(':id')
@ApiHeader({ name: 'If-Match', required: false })
async update(
  @Param('id') id: string,
  @Body() dto: UpdateUserDto,
  @Headers('if-match') ifMatch?: string,
) {
  const existing = await this.service.findOne(id);
  const currentETag = this.etagService.generateETag(existing);

  if (ifMatch && !this.etagService.matches(currentETag, ifMatch)) {
    throw new PreconditionFailedException('Resource has been modified');
  }

  return this.service.update(id, dto);
}
// GENERATED_ETAG_SUPPORT_END
```

---

## Microservices Reliability Patterns

**Enterprise-grade microservices patterns.**

### Outbox Pattern for Transactional Events

```typescript
// GENERATED_OUTBOX_PATTERN_START
// Schema
CREATE TABLE IF NOT EXISTS event.outbox (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  aggregate_type varchar(100) NOT NULL,
  aggregate_id uuid NOT NULL,
  event_type varchar(100) NOT NULL,
  payload jsonb NOT NULL,
  published boolean DEFAULT false,
  published_at timestamp,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_outbox_published (published, created_at)
);

// Service
@Injectable()
export class OutboxService {
  constructor(private readonly pool: Pool) {}

  async createWithEvent(
    dto: CreateUserDto,
    userId: string,
  ): Promise<User> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');

      // 1. Create user
      const userResult = await client.query(UsersQueries.create, [
        dto.username,
        dto.email,
        userId,
      ]);
      const user = userResult.rows[0];

      // 2. Insert outbox event
      await client.query(
        `INSERT INTO event.outbox
         (aggregate_type, aggregate_id, event_type, payload)
         VALUES ($1, $2, $3, $4)`,
        [
          'User',
          user.id,
          'UserCreated',
          JSON.stringify({ user, metadata: { createdBy: userId } }),
        ],
      );

      await client.query('COMMIT');
      return user;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

// Outbox Publisher (runs in background)
@Injectable()
export class OutboxPublisher {
  constructor(
    private readonly pool: Pool,
    @Inject('EVENT_BUS') private readonly eventBus: ClientProxy,
  ) {}

  @Cron('*/10 * * * * *') // Every 10 seconds
  async publishPendingEvents() {
    const result = await this.pool.query(
      `SELECT * FROM event.outbox
       WHERE published = false
       ORDER BY created_at ASC
       LIMIT 100`,
    );

    for (const event of result.rows) {
      try {
        await this.eventBus.emit(event.event_type, event.payload).toPromise();

        await this.pool.query(
          `UPDATE event.outbox
           SET published = true, published_at = CURRENT_TIMESTAMP
           WHERE id = $1`,
          [event.id],
        );
      } catch (error) {
        this.logger.error(`Failed to publish event ${event.id}`, error);
      }
    }
  }
}
// GENERATED_OUTBOX_PATTERN_END
```

### SAGA Pattern for Distributed Transactions

```typescript
// GENERATED_SAGA_PATTERN_START
export enum SagaStatus {
  PENDING = 'pending',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
  FAILED = 'failed',
  COMPENSATING = 'compensating',
  COMPENSATED = 'compensated',
}

CREATE TABLE IF NOT EXISTS saga.instances (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  saga_type varchar(100) NOT NULL,
  status varchar(20) NOT NULL DEFAULT 'pending',
  current_step integer DEFAULT 0,
  data jsonb NOT NULL,
  error text,
  created_at timestamp DEFAULT CURRENT_TIMESTAMP,
  updated_at timestamp DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS saga.steps (
  id uuid PRIMARY KEY DEFAULT uuidv7(),
  saga_id uuid REFERENCES saga.instances(id),
  step_number integer NOT NULL,
  step_name varchar(100) NOT NULL,
  status varchar(20) NOT NULL,
  request jsonb,
  response jsonb,
  error text,
  started_at timestamp,
  completed_at timestamp
);

@Injectable()
export class SagaOrchestrator {
  async executeOrderSaga(orderId: string, customerId: string, productId: string, amount: number) {
    const sagaId = uuidv7();

    // Create saga instance
    await this.createSaga(sagaId, 'CreateOrder', {
      orderId,
      customerId,
      productId,
      amount,
    });

    try {
      // Step 1: Reserve inventory
      await this.executeStep(sagaId, 1, 'ReserveInventory', async () => {
        return this.inventoryService.reserve(productId, 1);
      });

      // Step 2: Charge customer
      await this.executeStep(sagaId, 2, 'ChargeCustomer', async () => {
        return this.paymentService.charge(customerId, amount);
      });

      // Step 3: Create order
      await this.executeStep(sagaId, 3, 'CreateOrder', async () => {
        return this.orderService.create(orderId, customerId, productId);
      });

      await this.completeSaga(sagaId);
    } catch (error) {
      await this.compensateSaga(sagaId);
      throw error;
    }
  }

  private async compensateSaga(sagaId: string) {
    await this.updateSagaStatus(sagaId, SagaStatus.COMPENSATING);

    const steps = await this.getCompletedSteps(sagaId);

    // Compensate in reverse order
    for (const step of steps.reverse()) {
      try {
        await this.compensateStep(step);
      } catch (error) {
        this.logger.error(`Compensation failed for step ${step.step_name}`, error);
      }
    }

    await this.updateSagaStatus(sagaId, SagaStatus.COMPENSATED);
  }

  private async compensateStep(step: any) {
    switch (step.step_name) {
      case 'ReserveInventory':
        await this.inventoryService.release(step.request.productId);
        break;
      case 'ChargeCustomer':
        await this.paymentService.refund(step.response.transactionId);
        break;
      case 'CreateOrder':
        await this.orderService.cancel(step.request.orderId);
        break;
    }
  }
}
// GENERATED_SAGA_PATTERN_END
```

### Correlation ID & Distributed Tracing

```typescript
// GENERATED_CORRELATION_ID_START
@Injectable()
export class CorrelationIdMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    const correlationId = req.headers['x-correlation-id'] as string || uuidv4();
    req['correlationId'] = correlationId;
    res.setHeader('X-Correlation-ID', correlationId);
    next();
  }
}

// Inject correlation ID into all microservice calls
@Injectable()
export class CorrelationIdInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const correlationId = request.correlationId;

    // Add to RPC metadata
    if (context.getType() === 'rpc') {
      const data = context.switchToRpc().getData();
      data.metadata = { ...data.metadata, correlationId };
    }

    return next.handle();
  }
}

// Usage in microservice
@MessagePattern('users.create')
async handleCreate(@Payload() data: any, @Ctx() context: RmqContext) {
  const correlationId = data.metadata?.correlationId;

  this.logger.log({
    message: 'Creating user',
    correlationId,
    data: data.payload,
  });

  const result = await this.service.create(data.payload);

  // Emit event with correlation ID
  this.eventBus.emit('users.created', {
    ...result,
    metadata: { correlationId },
  });

  return result;
}
// GENERATED_CORRELATION_ID_END
```

---

## Observability & Monitoring

**Production-ready observability stack.**

### OpenTelemetry Integration

```typescript
// GENERATED_OPENTELEMETRY_START
import { NodeSDK } from '@opentelemetry/sdk-node';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { JaegerExporter } from '@opentelemetry/exporter-jaeger';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';

const sdk = new NodeSDK({
  traceExporter: new JaegerExporter({
    endpoint:
      process.env.JAEGER_ENDPOINT || 'http://localhost:14268/api/traces',
  }),
  metricReader: new PrometheusExporter({ port: 9464 }),
  instrumentations: [getNodeAutoInstrumentations()],
});

sdk.start();

// Auto-instrumented traces for HTTP, gRPC, DB calls
// GENERATED_OPENTELEMETRY_END
```

### Health & Readiness Endpoints

```typescript
// GENERATED_HEALTH_ENDPOINTS_START
import {
  HealthCheckService,
  HttpHealthIndicator,
  TypeOrmHealthIndicator,
} from '@nestjs/terminus';

@Controller('health')
export class HealthController {
  constructor(
    private health: HealthCheckService,
    private http: HttpHealthIndicator,
    private db: TypeOrmHealthIndicator,
  ) {}

  @Get()
  @HealthCheck()
  check() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      () => this.http.pingCheck('external-api', 'https://api.example.com'),
    ]);
  }

  @Get('ready')
  @HealthCheck()
  ready() {
    return this.health.check([
      () => this.db.pingCheck('database'),
      // Add other critical dependencies
    ]);
  }

  @Get('live')
  liveness() {
    return { status: 'ok', timestamp: new Date().toISOString() };
  }
}
// GENERATED_HEALTH_ENDPOINTS_END
```

### Prometheus Metrics

```typescript
// GENERATED_PROMETHEUS_METRICS_START
import {
  makeCounterProvider,
  makeHistogramProvider,
} from '@willsoto/nestjs-prometheus';

@Module({
  providers: [
    makeCounterProvider({
      name: 'http_requests_total',
      help: 'Total HTTP requests',
      labelNames: ['method', 'path', 'status'],
    }),
    makeHistogramProvider({
      name: 'http_request_duration_seconds',
      help: 'HTTP request duration',
      labelNames: ['method', 'path'],
    }),
  ],
})
export class MetricsModule {}

@Injectable()
export class MetricsInterceptor implements NestInterceptor {
  constructor(
    @InjectMetric('http_requests_total') private counter: Counter,
    @InjectMetric('http_request_duration_seconds') private histogram: Histogram,
  ) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const { method, path } = request;

    return next.handle().pipe(
      tap(() => {
        const duration = (Date.now() - start) / 1000;
        const response = context.switchToHttp().getResponse();

        this.counter.inc({ method, path, status: response.statusCode });
        this.histogram.observe({ method, path }, duration);
      }),
    );
  }
}
// GENERATED_PROMETHEUS_METRICS_END
```

### Structured Logging with Pino

```typescript
// GENERATED_PINO_LOGGER_START
import { Logger } from 'nestjs-pino';

@Module({
  imports: [
    LoggerModule.forRoot({
      pinoHttp: {
        level: process.env.LOG_LEVEL || 'info',
        transport: process.env.NODE_ENV !== 'production'
          ? { target: 'pino-pretty' }
          : undefined,
        customProps: (req, res) => ({
          correlationId: req.correlationId,
          userId: req.user?.id,
        }),
        serializers: {
          req: (req) => ({
            id: req.id,
            method: req.method,
            url: req.url,
            correlationId: req.correlationId,
          }),
        },
      },
    }),
  ],
})

// Usage
this.logger.log({
  msg: 'User created',
  userId: user.id,
  correlationId,
  duration: Date.now() - start,
});
// GENERATED_PINO_LOGGER_END
```

---

## Developer Experience (DX) Enhancements

**Tools to improve generator usability.**

### Dry-Run Mode

```typescript
// GENERATED_DRY_RUN_START
nest-generator generate user.users --dry-run

// Output:
✓ Analyzing metadata for user.users
✓ Generating files (dry-run mode)

Files to be created/updated:
  CREATE   src/modules/users/users.dto.ts
  CREATE   src/modules/users/users.query.ts
  UPDATE   src/modules/users/users.repository.ts (custom code detected)
  CREATE   src/modules/users/users.service.ts
  CREATE   src/modules/users/users.controller.ts
  CREATE   src/modules/users/users.module.ts

Changes preview:
  + 245 lines added
  - 12 lines removed
  ~ 8 lines modified

Run without --dry-run to apply changes.
// GENERATED_DRY_RUN_END
```

### Diff Preview

```typescript
// GENERATED_DIFF_PREVIEW_START
nest-generator generate user.users --diff

// Shows git-style diff
diff --git a/src/modules/users/users.repository.ts b/src/modules/users/users.repository.ts
index 1234567..abcdefg 100644
--- a/src/modules/users/users.repository.ts
+++ b/src/modules/users/users.repository.ts
@@ -10,6 +10,12 @@ export class UsersRepository {
   // GENERATED_METHOD_START: find-all
   async findAll(filters?: UserFilterDto, page = 1, limit = 10) {
+    const compiled = this.filterCompiler.compile(filters, columns, 1);
+
     let query = `SELECT * FROM users WHERE deleted_at IS NULL`;
+    if (compiled.clauses.length > 0) {
+      query += ` AND ${compiled.clauses.join(' AND ')}`;
+    }
   }
   // GENERATED_METHOD_END: find-all
// GENERATED_DIFF_PREVIEW_END
```

### Auto-Formatter Integration

```typescript
// GENERATED_AUTO_FORMAT_START
// generator.service.ts
import * as prettier from 'prettier';

async generateFile(template: string, data: any, outputPath: string) {
  let content = this.renderTemplate(template, data);

  // Auto-format with Prettier
  const prettierConfig = await prettier.resolveConfig(process.cwd());
  content = prettier.format(content, {
    ...prettierConfig,
    parser: 'typescript',
  });

  // Lint with ESLint (auto-fix)
  const { ESLint } = require('eslint');
  const eslint = new ESLint({ fix: true });
  const results = await eslint.lintText(content, { filePath: outputPath });
  content = results[0].output || content;

  await fs.writeFile(outputPath, content);
}
// GENERATED_AUTO_FORMAT_END
```

### Snapshot Testing for Templates

```typescript
// GENERATED_SNAPSHOT_TESTS_START
// tests/templates/dto.template.spec.ts
describe('DTO Template Generator', () => {
  it('should generate correct DTO with filters', () => {
    const metadata = {
      tableName: 'users',
      columns: [
        { name: 'username', type: 'string', isFilterable: true },
        { name: 'age', type: 'number', isFilterable: true },
      ],
    };

    const result = dtoGenerator.generate(metadata);

    expect(result).toMatchSnapshot();
  });

  it('should preserve custom code blocks', () => {
    const existing = `
      export class UserDto {
        // GENERATED_START
        username: string;
        // GENERATED_END

        // CUSTOM_START
        get fullName() { return this.username; }
        // CUSTOM_END
      }
    `;

    const result = dtoGenerator.regenerate(metadata, existing);

    expect(result).toContain('get fullName()');
    expect(result).toMatchSnapshot();
  });
});
// GENERATED_SNAPSHOT_TESTS_END
```

### Plugin System

```typescript
// GENERATED_PLUGIN_SYSTEM_START
export interface GeneratorPlugin {
  name: string;
  version: string;
  hooks: {
    beforeGenerate?: (context: GeneratorContext) => Promise<void>;
    afterGenerate?: (context: GeneratorContext, files: GeneratedFile[]) => Promise<void>;
    transformTemplate?: (template: string, data: any) => string;
    customEndpoints?: (metadata: TableMetadata) => EndpointDefinition[];
  };
}

// Example plugin
export class RecapPlugin implements GeneratorPlugin {
  name = 'recap-plugin';
  version = '1.0.0';

  hooks = {
    customEndpoints: (metadata: TableMetadata) => {
      if (!metadata.has_created_at) return [];

      return [
        {
          method: 'GET',
          path: '/recap',
          handler: 'recap',
          dto: 'RecapQueryDto',
        },
      ];
    },
  };
}

// Usage
nest-generator generate user.users --plugin=recap --plugin=graphql
// GENERATED_PLUGIN_SYSTEM_END
```

---

## Multi-Tenancy Support

**Schema-based and row-level tenant isolation.**

### Schema-per-Tenant

```typescript
// GENERATED_SCHEMA_PER_TENANT_START
@Injectable()
export class TenantService {
  private tenantSchemas = new Map<string, string>();

  async getTenantSchema(tenantId: string): string {
    if (!this.tenantSchemas.has(tenantId)) {
      const result = await this.pool.query(
        `SELECT schema_name FROM tenants WHERE id = $1`,
        [tenantId],
      );
      if (!result.rows[0]) {
        throw new NotFoundException('Tenant not found');
      }
      this.tenantSchemas.set(tenantId, result.rows[0].schema_name);
    }
    return this.tenantSchemas.get(tenantId);
  }

  async createTenantSchema(tenantId: string, schemaName: string) {
    await this.pool.query(`CREATE SCHEMA IF NOT EXISTS "${schemaName}"`);
    await this.pool.query(
      `INSERT INTO tenants (id, schema_name) VALUES ($1, $2)`,
      [tenantId, schemaName],
    );

    // Copy structure from template schema
    await this.copySchemaStructure('template', schemaName);
  }
}

@Injectable()
export class TenantInterceptor implements NestInterceptor {
  constructor(private tenantService: TenantService) {}

  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (!tenantId) {
      throw new BadRequestException('Tenant ID required');
    }

    const schema = await this.tenantService.getTenantSchema(tenantId);
    request['tenantSchema'] = schema;

    return next.handle();
  }
}

// Usage in repository
async findAll(filters: UserFilterDto, tenantSchema: string) {
  const query = `
    SELECT * FROM ${this.dialect.quoteIdentifier(`${tenantSchema}.users`)}
    WHERE deleted_at IS NULL
  `;
  const result = await this.pool.query(query);
  return result.rows;
}
// GENERATED_SCHEMA_PER_TENANT_END
```

### Row-Level Security (RLS)

```typescript
// GENERATED_RLS_START
-- Enable RLS on table
ALTER TABLE user.users ENABLE ROW LEVEL SECURITY;

-- Create policy
CREATE POLICY tenant_isolation_policy ON user.users
  USING (tenant_id = current_setting('app.tenant_id')::uuid);

-- Set tenant context before each query
@Injectable()
export class RLSInterceptor implements NestInterceptor {
  async intercept(context: ExecutionContext, next: CallHandler) {
    const request = context.switchToHttp().getRequest();
    const tenantId = request.headers['x-tenant-id'];

    if (tenantId) {
      await this.pool.query(`SET app.tenant_id = '${tenantId}'`);
    }

    return next.handle().pipe(
      finalize(() => {
        // Reset after query
        this.pool.query(`RESET app.tenant_id`).catch(() => {});
      }),
    );
  }
}
// GENERATED_RLS_END
```

---

## Performance Optimizations

**Production-scale performance patterns.**

### Read/Write Split

```typescript
// GENERATED_READ_WRITE_SPLIT_START
@Injectable()
export class DatabaseService {
  private writePool: Pool;
  private readPools: Pool[];
  private readPoolIndex = 0;

  constructor() {
    this.writePool = new Pool({
      host: process.env.DB_WRITE_HOST,
      port: parseInt(process.env.DB_WRITE_PORT),
      // ... primary config
    });

    this.readPools = [
      new Pool({
        host: process.env.DB_READ_HOST_1,
        port: parseInt(process.env.DB_READ_PORT_1),
        // ... replica 1 config
      }),
      new Pool({
        host: process.env.DB_READ_HOST_2,
        port: parseInt(process.env.DB_READ_PORT_2),
        // ... replica 2 config
      }),
    ];
  }

  getWritePool(): Pool {
    return this.writePool;
  }

  getReadPool(): Pool {
    // Round-robin load balancing
    const pool = this.readPools[this.readPoolIndex];
    this.readPoolIndex = (this.readPoolIndex + 1) % this.readPools.length;
    return pool;
  }
}

// Usage
async findAll(filters: UserFilterDto) {
  const pool = this.dbService.getReadPool(); // Use replica
  const result = await pool.query(query, params);
  return result.rows;
}

async create(dto: CreateUserDto) {
  const pool = this.dbService.getWritePool(); // Use primary
  const result = await pool.query(query, params);
  return result.rows[0];
}
// GENERATED_READ_WRITE_SPLIT_END
```

### Connection Pooling Best Practices

```typescript
// GENERATED_CONNECTION_POOLING_START
const pool = new Pool({
  host: process.env.DB_HOST,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,

  // Connection pool settings
  min: 5, // Minimum connections
  max: 20, // Maximum connections
  idleTimeoutMillis: 30000, // Close idle connections after 30s
  connectionTimeoutMillis: 2000, // Timeout for new connections

  // Keep-alive
  keepAlive: true,
  keepAliveInitialDelayMillis: 10000,
});

// Monitor pool
pool.on('connect', () => {
  this.logger.log('New database connection established');
});

pool.on('remove', () => {
  this.logger.log('Database connection removed from pool');
});

pool.on('error', (err) => {
  this.logger.error('Unexpected pool error', err);
});
// GENERATED_CONNECTION_POOLING_END
```

### Query Optimization & Index Recommendations

```typescript
// GENERATED_INDEX_RECOMMENDATIONS_START
export class IndexAnalyzer {
  /**
   * Analyze queries and suggest indexes
   */
  async analyzeAndSuggest(tableName: string): Promise<string[]> {
    const metadata = await this.metadataService.getTableMetadata(tableName);
    const columns = await this.metadataService.getColumns(tableName);

    const suggestions: string[] = [];

    // 1. Filterable columns
    const filterableColumns = columns.filter(c => c.is_filterable);
    for (const col of filterableColumns) {
      suggestions.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_${col.column_name}
         ON ${metadata.schema_name}.${tableName} (${col.column_name});`
      );
    }

    // 2. Foreign keys
    const fkColumns = columns.filter(c => c.ref_table);
    for (const col of fkColumns) {
      suggestions.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_${col.column_name}_fk
         ON ${metadata.schema_name}.${tableName} (${col.column_name});`
      );
    }

    // 3. Soft delete (partial index)
    if (metadata.has_soft_delete) {
      suggestions.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_not_deleted
         ON ${metadata.schema_name}.${tableName} (id)
         WHERE deleted_at IS NULL;`
      );
    }

    // 4. Composite indexes for common queries
    if (metadata.date_aggregation_field) {
      suggestions.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_${metadata.date_aggregation_field}_agg
         ON ${metadata.schema_name}.${tableName} (${metadata.date_aggregation_field})
         WHERE deleted_at IS NULL;`
      );
    }

    // 5. Recap queries (composite)
    const recapFields = filterableColumns.slice(0, 2).map(c => c.column_name);
    if (recapFields.length > 0 && metadata.date_aggregation_field) {
      suggestions.push(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_recap
         ON ${metadata.schema_name}.${tableName} (${recapFields.join(', ')}, ${metadata.date_aggregation_field})
         WHERE deleted_at IS NULL;`
      );
    }

    return suggestions;
  }
}

// CLI command
nest-generator indexes user.users --apply

// Output:
✓ Analyzing query patterns for user.users
✓ Generated 8 index recommendations

Suggested indexes:
  1. idx_users_username (filterable column)
  2. idx_users_email (filterable column)
  3. idx_users_department_id_fk (foreign key)
  4. idx_users_not_deleted (soft delete optimization)
  5. idx_users_created_at_agg (date aggregation)
  6. idx_users_recap (recap query optimization)

Apply these indexes? (y/N): y
✓ Created 6 indexes
// GENERATED_INDEX_RECOMMENDATIONS_END
```

---

## Implementation Roadmap

**Progressive development plan from infrastructure to production deployment.**

### Phase 0: Infrastructure & Enterprise Patterns (PRIORITY 1) ✅ COMPLETED

Critical architecture patterns added to support production-scale applications.

- [x] **Database Dialect System** ✅ DOCUMENTED
  - [x] PostgreSQL dialect (ILIKE, EXTRACT, UUID, quoteIdentifier)
  - [x] MySQL dialect (LIKE+LOWER, MONTH/DATE_FORMAT, backtick quoting)
  - [x] DialectFactory pattern for runtime selection
  - [x] SafeIdentifier utility for SQL injection prevention
  - [x] Cross-database date function abstraction

- [x] **Security Best Practices** ✅ DOCUMENTED
  - [x] Parameterized query enforcement (never string concatenation)
  - [x] Identifier whitelisting and validation
  - [x] JSONB field validation for validation_rules
  - [x] Input sanitization utilities
  - [x] SQL injection prevention patterns

- [x] **Generic Filter Compiler** ✅ DOCUMENTED
  - [x] Metadata-driven filter generation
  - [x] Type-aware operator mapping (12 operators)
  - [x] Auto-generate FilterDto from column_metadata
  - [x] Parameter binding with dialect support
  - [x] Complex filter combinations (AND/OR)

- [x] **Advanced Pagination Strategies** ✅ DOCUMENTED
  - [x] Offset pagination (backward compatible)
  - [x] Cursor/keyset pagination (scalable for large datasets)
  - [x] Hybrid pagination DTO supporting both methods
  - [x] PaginationHelper utilities (encode/decode cursor)
  - [x] Tuple comparison for proper ordering

- [x] **API Contract Extensions** ✅ DOCUMENTED
  - [x] PATCH endpoints (partial updates with PartialType)
  - [x] Bulk operations (create/update/delete with transactions)
  - [x] Idempotency-Key support with Redis deduplication
  - [x] ETag/If-Match/If-None-Match conditional requests
  - [x] Proper error contracts (code, message, details, traceId)
  - [x] File upload patterns (pre-signed URLs, antivirus, size limits)

- [x] **Microservices Patterns** ✅ DOCUMENTED
  - [x] Outbox pattern for transactional event publishing
  - [x] SAGA orchestration with compensation logic
  - [x] Correlation ID propagation across services
  - [x] Distributed tracing integration
  - [x] Message broker integration (RabbitMQ/Kafka)

- [x] **Observability Stack** ✅ DOCUMENTED
  - [x] OpenTelemetry integration (traces, metrics, logs)
  - [x] Prometheus metrics exporter
  - [x] Health/readiness/liveness endpoints
  - [x] Structured logging with Pino
  - [x] Correlation ID in all logs

- [x] **DX Enhancements** ✅ DOCUMENTED
  - [x] Dry-run mode (preview without applying)
  - [x] Diff preview (git-style changes)
  - [x] Auto-formatting (Prettier + ESLint)
  - [x] Snapshot testing for templates
  - [x] Plugin system for extensibility

- [x] **Multi-Tenancy Support** ✅ DOCUMENTED
  - [x] Schema-per-tenant pattern
  - [x] Row-level security (RLS) with PostgreSQL policies
  - [x] Tenant isolation guards and interceptors
  - [x] Automatic tenant context injection

- [x] **Performance Optimizations** ✅ DOCUMENTED
  - [x] Read/write connection split
  - [x] Connection pooling best practices
  - [x] Index recommendations analyzer
  - [x] Query optimization suggestions
  - [x] Partial index for soft delete

### Phase 1: Core Foundation

- [ ] Project structure setup
- [ ] CLI command framework (Commander.js)
- [ ] Configuration management
- [ ] Database connection abstraction (PostgreSQL + MySQL)
- [ ] **Automated metadata schema creation scripts**
- [ ] **Database setup service with SQL execution**
- [ ] **Connection testing and validation**
- [ ] **Implement database dialect classes (PostgresDialect, MySQLDialect)**
- [ ] **Implement SafeIdentifier utility**

### Phase 2: Architecture Detection

- [ ] Detect project type (standalone/monorepo/microservices)
- [ ] Parse `nest-cli.json` for structure
- [ ] Identify apps and libs directories
- [ ] Gateway selection for microservices

### Phase 3: Metadata Reading

- [ ] Connect to metadata database
- [ ] Query `table_metadata` and `column_metadata`
- [ ] Build internal representation
- [ ] Validate metadata integrity
- [ ] **Load column_metadata for filter compilation**

### Phase 4: Code Generation Engine

- [ ] Template engine setup (Handlebars/EJS)
- [ ] DTO generator with class-validator
- [ ] **Implement FilterCompiler for auto-generated filters**
- [ ] **Query generator with dialect-aware SQL**
- [ ] **Repository generator with parameterized queries**
- [ ] Service generator
- [ ] Controller generator (REST/MessagePattern)
- [ ] Module generator
- [ ] **Generate PATCH endpoints alongside POST/PUT**
- [ ] **Generate bulk operation endpoints**

### Phase 5: Custom Code Preservation

- [ ] Block marker parser
- [ ] Extract custom code from existing files
- [ ] Merge algorithm implementation
- [ ] Checksum calculation and storage
- [ ] Conflict detection

### Phase 6: Filter System

- [ ] **Implement metadata-driven FilterCompiler**
- [ ] Filter operator parser
- [ ] Dynamic query builder with dialect support
- [ ] Filter DTO auto-generation from column_metadata
- [ ] URL parameter mapping
- [ ] Type-specific operator selection
- [ ] **JOIN query generation from foreign keys**

### Phase 7: CLI Commands

- [ ] `init` - Initialize configuration
- [ ] `generate` - Generate single module
- [ ] `sync` - Regenerate all modules
- [ ] `check` - Check for changes
- [ ] `list` - List generated modules
- [ ] `remove` - Remove module
- [ ] **`indexes` - Analyze and suggest indexes**
- [ ] **`--dry-run` flag support**
- [ ] **`--diff` flag support**

### Phase 8: Testing & Documentation

- [ ] Unit tests for generators
- [ ] Integration tests with sample project
- [ ] CLI command tests
- [ ] **Snapshot tests for template output**
- [ ] User documentation
- [ ] API documentation
- [ ] Migration guide
- [ ] **Security best practices guide**
- [ ] **Performance optimization guide**

### Phase 9: Advanced Features (Priority High)

- [ ] **Swagger/OpenAPI Documentation**
  - [ ] Auto-generate `@ApiProperty()` decorators with examples
  - [ ] Generate Swagger config in main.ts
  - [ ] Gateway-only Swagger for microservices
  - [ ] API documentation UI at `/api/docs`
- [ ] **Export Functionality**
  - [ ] CSV export with json2csv
  - [ ] Excel export with ExcelJS
  - [ ] PDF export with pdfkit
  - [ ] Custom column selection
  - [ ] Filtered exports
- [ ] **Caching Layer**
  - [ ] Redis integration with cache-manager
  - [ ] Auto-cache on read operations
  - [ ] Auto-invalidation on mutations
  - [ ] Configurable TTL per table
  - [ ] Cache warming strategies

### Phase 10: Advanced Features (Priority Medium)

- [ ] **Rate Limiting & Throttling**
  - [ ] ThrottlerModule setup
  - [ ] Per-endpoint rate limits from metadata
  - [ ] IP-based throttling
  - [ ] Custom throttle decorators
- [ ] **Audit Trail System**
  - [ ] Audit schema creation (activity_logs, rollback_history)
  - [ ] Auto-log create/update/delete operations
  - [ ] Track who, when, what changed
  - [ ] Rollback/restore endpoints
  - [ ] Audit log viewing endpoints
- [ ] **File Upload Handler**
  - [ ] Multer integration
  - [ ] File validation (size, type, MIME)
  - [ ] Local storage support
  - [ ] S3/GCS cloud storage integration
  - [ ] Multiple file upload support
- [ ] **Search Engine Integration**
  - [ ] Elasticsearch/Algolia setup
  - [ ] Auto-index on create/update
  - [ ] Auto-remove from index on delete
  - [ ] Full-text search endpoints
  - [ ] Fuzzy search support
  - [ ] Autocomplete endpoints
- [ ] **Permission & RBAC**
  - [ ] RBAC schema (roles, permissions, user_roles)
  - [ ] Permission decorators (`@RequirePermission()`)
  - [ ] Permission guards
  - [ ] Field-level permissions
  - [ ] Dynamic permission checking
- [ ] **Notification System**
  - [ ] Notification schema (templates, queue, preferences)
  - [ ] Email integration (Nodemailer)
  - [ ] SMS integration (Twilio)
  - [ ] Push notification support
  - [ ] Template variable replacement
  - [ ] Event-driven notifications
  - [ ] Queue processing with retry logic

### Phase 11: Additional Features

- [ ] Transaction support
- [ ] Bulk operations (bulk insert, update, delete)
- [ ] Import functionality (CSV/Excel to database)
- [ ] GraphQL resolver generation
- [ ] WebSocket/Real-time support
- [ ] Multi-tenancy support
- [ ] Webhook generator

### Phase 12: Polish & Release

- [ ] Error handling improvements
- [ ] Performance optimization
- [ ] Code quality (ESLint, Prettier)
- [ ] CI/CD setup
- [ ] npm package publishing
- [ ] Example projects

---

## Technical Stack

### Dependencies

```json
{
  "dependencies": {
    "@nestjs/common": "^10.0.0",
    "@nestjs/core": "^10.0.0",
    "@nestjs/microservices": "^10.0.0",
    "@nestjs/swagger": "^7.1.0",
    "@nestjs/throttler": "^5.0.0",
    "@nestjs/cache-manager": "^2.1.0",
    "@nestjs/elasticsearch": "^10.0.0",
    "@nestjs/event-emitter": "^2.0.0",
    "class-validator": "^0.14.0",
    "class-transformer": "^0.5.1",
    "pg": "^8.11.0",
    "mysql2": "^3.6.0",
    "commander": "^11.0.0",
    "inquirer": "^9.2.0",
    "handlebars": "^4.7.8",
    "chalk": "^5.3.0",
    "ora": "^7.0.1",
    "cache-manager": "^5.2.0",
    "cache-manager-redis-store": "^3.0.0",
    "json2csv": "^6.0.0",
    "exceljs": "^4.3.0",
    "pdfkit": "^0.13.0",
    "nodemailer": "^6.9.0",
    "twilio": "^4.18.0",
    "aws-sdk": "^2.1479.0",
    "multer": "^1.4.5-lts.1"
  },
  "devDependencies": {
    "@types/node": "^20.0.0",
    "@types/pg": "^8.10.0",
    "@types/multer": "^1.4.9",
    "@types/nodemailer": "^6.4.13",
    "typescript": "^5.0.0"
  }
}
```

### File Structure

```
libs/generator/
  src/
    cli/
      commands/
        init.command.ts
        generate.command.ts
        sync.command.ts
        check.command.ts
      index.ts
    core/
      config/
        config.service.ts
        config.interface.ts
      database/
        connection.service.ts
        metadata.service.ts
        query-builder.service.ts
      architecture/
        detector.service.ts
        path-resolver.service.ts
    generators/
      dto/
        dto.generator.ts
        validator.mapper.ts
      query/
        query.generator.ts
        filter.builder.ts
      repository/
        repository.generator.ts
      service/
        service.generator.ts
      controller/
        rest-controller.generator.ts
        microservice-controller.generator.ts
      module/
        module.generator.ts
    templates/
      dto.template.hbs
      query.template.hbs
      repository.template.hbs
      service.template.hbs
      controller-rest.template.hbs
      controller-gateway.template.hbs
      controller-handler.template.hbs
      module.template.hbs
    utils/
      file.service.ts
      block-parser.service.ts
      checksum.service.ts
      formatter.service.ts
    index.ts
    generator.module.ts
```

---

## Example Workflows

### Workflow 1: Fresh Project Setup

```bash
# 1. Install library
npm install @ojiepermana/nest-generator

# 2. Initialize
nest-generator init
# Select: microservices, postgresql, gateway app

# 3. Library creates metadata tables
# Check: meta.table_metadata and meta.column_metadata exist

# 4. Populate metadata (manually or via admin UI)
INSERT INTO meta.table_metadata (schema_name, table_name, ...) VALUES ('user', 'users', ...);
INSERT INTO meta.column_metadata (table_metadata_id, column_name, ...) VALUES (...);

# 5. Generate module
nest-generator generate user.users

# 6. Files created in apps/gateway and apps/user-service
```

### Workflow 2: Add Custom Code

```typescript
// apps/user-service/src/modules/users/users.service.ts

// CUSTOM_METHOD_START: business-logic
async findByEmail(email: string) {
  return this.repository.findByEmail(email);
}

async updatePassword(id: string, newPassword: string) {
  // Custom business logic
  const hashedPassword = await bcrypt.hash(newPassword, 10);
  return this.repository.updatePassword(id, hashedPassword);
}
// CUSTOM_METHOD_END: business-logic
```

### Workflow 3: Regenerate After Metadata Change

```bash
# 1. Update metadata (add new column)
UPDATE meta.column_metadata
SET is_filterable = true
WHERE table_metadata_id = '...' AND column_name = 'department';

# 2. Regenerate
nest-generator generate user.users

# 3. Custom code preserved, new filters added automatically
# Check: department_eq, department_like, etc. in DTO
```

### Workflow 4: Multi-Service Generation

```bash
# Generate all modules for user-service
nest-generator sync --service=user-service

# Generate all modules across all services
nest-generator sync --all
```

---

## API Examples

### REST API (Standalone/Monorepo/Gateway)

```bash
# Get all users with filters
GET /users?username_like=john&age_gte=18&role_in=admin,user&page=1&limit=20

# Get single user
GET /users/123e4567-e89b-12d3-a456-426614174000

# Create user
POST /users
{
  "username": "johndoe",
  "email": "john@example.com",
  "full_name": "John Doe",
  "is_active": true
}

# Update user
PUT /users/123e4567-e89b-12d3-a456-426614174000
{
  "full_name": "John Smith"
}

# Delete user (soft delete)
DELETE /users/123e4567-e89b-12d3-a456-426614174000
```

### Microservices Message Patterns

```typescript
// Gateway sends
this.client.send('users.findAll', {
  filters: { username_like: 'john' },
  page: 1,
  limit: 20
});

// Service handles
@MessagePattern('users.findAll')
async findAll(@Payload() data: any) {
  return this.service.findAll(data.filters, data.page, data.limit);
}
```

---

## Testing Strategy

### Unit Tests

```typescript
describe('DtoGenerator', () => {
  it('should generate CreateDto with validators', () => {
    const columns = [...];
    const result = generator.generateCreateDto(columns);
    expect(result).toContain('@IsString()');
    expect(result).toContain('@MaxLength(100)');
  });
});

describe('FilterBuilder', () => {
  it('should build WHERE clause for _like operator', () => {
    const filters = { username_like: 'john' };
    const result = builder.buildWhere(filters);
    expect(result.sql).toContain('username ILIKE $1');
    expect(result.params).toEqual(['%john%']);
  });
});
```

### Integration Tests

```typescript
describe('Module Generation', () => {
  it('should generate all files for standalone architecture', async () => {
    await generator.generate('user.users');

    expect(fs.existsSync('src/modules/users/users.dto.ts')).toBe(true);
    expect(fs.existsSync('src/modules/users/users.query.ts')).toBe(true);
    expect(fs.existsSync('src/modules/users/users.repository.ts')).toBe(true);
    expect(fs.existsSync('src/modules/users/users.service.ts')).toBe(true);
    expect(fs.existsSync('src/modules/users/users.controller.ts')).toBe(true);
    expect(fs.existsSync('src/modules/users/users.module.ts')).toBe(true);
  });
});
```

---

## Security Considerations

1. **SQL Injection Prevention**
   - Use parameterized queries exclusively
   - Validate all filter inputs
   - Sanitize dynamic query building

2. **Metadata Validation**
   - Validate table/column names against SQL injection
   - Restrict metadata access to authorized users
   - Audit metadata changes

3. **Generated Code**
   - Add TODO comments for authentication
   - Generate guards placeholders
   - Include rate limiting recommendations

---

## Performance Optimization

1. **Query Optimization**
   - Generate indexes based on filterable columns
   - Use EXPLAIN ANALYZE suggestions
   - Implement query result caching

2. **Code Generation**
   - Cache metadata queries
   - Parallel file generation
   - Incremental builds (only changed tables)

3. **Runtime**
   - Connection pooling
   - Prepared statements
   - Batch operations support

---

## Future Enhancements

### Implemented Advanced Features ✅

- [x] Swagger/OpenAPI auto-generation
- [x] Export functionality (CSV, Excel, PDF)
- [x] Redis caching layer
- [x] Rate limiting & throttling
- [x] Audit trail system with rollback
- [x] File upload handler with cloud storage
- [x] Elasticsearch/Algolia integration
- [x] RBAC & permission system
- [x] Notification system (Email/SMS/Push)

### Future Considerations

- [ ] Visual metadata editor (web UI)
- [ ] Database schema introspection (auto-populate metadata)
- [ ] Migration generator from metadata changes
- [ ] GraphQL resolver generation (separate module)
- [ ] Real-time subscriptions (WebSocket/SSE)
- [ ] Multi-tenancy support (tenant isolation)
- [ ] Webhook outgoing events
- [ ] API versioning support
- [ ] Data masking for sensitive fields
- [ ] Custom template support
- [ ] Plugin system

---

## Success Metrics

1. **Developer Experience**
   - Time to generate first module: < 5 minutes
   - Time to add new field: < 30 seconds (update metadata + regenerate)
   - Custom code preservation: 100% success rate

2. **Code Quality**
   - Type safety: Full TypeScript coverage
   - Test coverage: > 80%
   - ESLint compliance: 100%

3. **Performance**
   - Generation speed: < 2 seconds per module
   - Query performance: < 100ms for filtered lists
   - Memory usage: < 100MB during generation

---

## Support & Documentation

### Documentation Structure

1. **Getting Started**
   - Installation
   - First module generation
   - Understanding metadata

2. **Architecture Guides**
   - Standalone setup
   - Monorepo setup
   - Microservices setup

3. **Advanced Topics**
   - Custom code patterns
   - Filter operators
   - Performance tuning
   - Troubleshooting

4. **API Reference**
   - CLI commands
   - Configuration options
   - Metadata schema
   - Generated code structure

5. **Examples**
   - Sample projects
   - Common patterns
   - Migration guides

---

## Conclusion

This library aims to significantly reduce boilerplate code in NestJS applications while maintaining flexibility and code quality. By leveraging database metadata and intelligent code generation, developers can focus on business logic rather than repetitive CRUD operations.

The preservation of custom code ensures that generated modules can evolve with the project, making this a sustainable solution for long-term development.

---

**Version:** 1.0.0  
**Last Updated:** 2025-11-09  
**Status:** Planning Phase

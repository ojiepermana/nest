# NestJS Generator - Feature Overview

**Package**: `@ojiepermana/nest-generator`

- **Version**: 1.1.3+
- **Last updated**: 16 November 2025
- **Automated tests**: 707 / 740 passing (95.5%)
- **Feature score vs. prompt**: 119 / 100 (see [Feature Scoring](./FEATURE_SCORING.md))
- **Compilation errors**: 0 (all architectures tested)

Use this document to understand current capabilities, locate implementation details, and identify roadmap items for the generator.

## Table of Contents

1. [Feature Matrix](#feature-matrix)
2. [Core Generators](#core-generators)
3. [Advanced Capabilities](#advanced-capabilities)
4. [Architecture Support](#architecture-support)
5. [Workflow & CLI](#workflow--cli)
6. [Quality & Testing](#quality--testing)
7. [Roadmap & Open Items](#roadmap--open-items)

## Feature Matrix

| Category             | Capability                                                                                  | Status   | Key Implementation                                                                         |
| -------------------- | ------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------ |
| Generators           | Entity, DTO (create/update/filter), Repository, Service, Controller, Module, barrel exports | Complete | `libs/generator/src/generators/*`                                                          |
| Runtime              | Metadata-driven CRUD, pagination, filtering operators, sorting                              | Complete | `generators/service/service.generator.ts`, `generators/repository/repository.generator.ts` |
| Validation & Swagger | class-validator DTOs, automatic pipes, OpenAPI decorators                                   | Complete | `generators/dto/*.generator.ts`, `generators/controller/controller.generator.ts`           |
| Audit Trail          | Change capture, diffing, metadata tables, auto wiring                                       | Complete | `libs/generator/src/audit/**`                                                              |
| RBAC                 | Permission decorators, module auto-registration, metadata seeding (92 tests)                | Complete | `libs/generator/src/rbac/**`                                                               |
| File Upload          | Multi-provider storage (local, S3, GCS, Azure) with generated helpers (40 tests)            | Complete | `generators/features/file-upload.generator.ts`                                             |
| Caching              | Redis cache service, decorators, invalidation strategy                                      | Complete | `libs/generator/src/cache/**`                                                              |
| Search               | Configurable driver abstractions (Elasticsearch, Algolia, Meilisearch, SQL fallback)        | Complete | `libs/generator/src/search/**`                                                             |
| Export               | CSV/Excel/PDF endpoint scaffolding (manual enable)                                          | Optional | `generators/features/export.generator.ts`                                                  |
| Microservices        | Gateway (HTTP + ClientProxy) & Service (@MessagePattern) controllers                        | Complete | `generators/controller/gateway-controller.generator.ts`, `service-controller.generator.ts` |
| CLI                  | `init`, `generate` with `--app` flag, `delete`, architecture auto-detection                 | Complete | `libs/generator/src/cli/**`                                                                |

Legend: Complete = shipped - Optional = manual enablement

## Core Generators

### Entity Generator

- Emits plain TypeScript classes that mirror metadata columns (no ORM dependency)
- Handles soft delete columns, defaults, enums, and database type mapping
- Source: `generators/entity/entity.generator.ts`

### DTO Generators

- Produce `Create`, `Update`, and `Filter` DTOs with class-validator + Swagger decorators
- Filter DTO supports 12 operators (`_eq`, `_between`, `_like`, etc.) and ignores pagination keys
- Sources: `generators/dto/create-dto.generator.ts`, `update-dto.generator.ts`, `filter-dto.generator.ts`

### Repository Generator

- Builds parameterised SQL for PostgreSQL and MySQL using metadata-provided schema
- Supports pagination, sorting, JOIN detection, recap/analytics queries, and caching hooks
- Source: `generators/repository/repository.generator.ts`

### Service Generator

- Wraps repository calls and applies audit logging, caching, RBAC guards, and transactions
- Exposes `findWithFilters`, `findOne`, `create`, `update`, `remove`, recap helpers, and statistics
- Source: `generators/service/service.generator.ts`

### Controller Generator

- REST endpoints (`POST`, `GET`, `GET /filter`, `GET :id`, `PUT`, `DELETE`) with optional RBAC decorators
- **Microservices**: Detects architecture and generates either HTTP controllers or @MessagePattern handlers
- Adds Swagger metadata, DTO validation pipes, and pagination parameters automatically
- Sources: `generators/controller/controller.generator.ts`, `gateway-controller.generator.ts`, `service-controller.generator.ts`

### Module Generator

- Wires providers, feature modules (Audit, Cache, RBAC, Storage), and exports services
- Adjusts imports based on architecture (standalone, monorepo, microservices)
- Source: `generators/module/module.generator.ts`

### Test Generator

- Generates Jest unit tests for services and repositories with mocks and snapshots
- Helps maintain >=99% coverage target after regeneration
- Source: `generators/tests/tests.generator.ts`

## Advanced Capabilities

### Audit Trail

- Metadata tables (`audit_event`, `audit_change`, `audit_actor`) created during `init`
- Generated repositories/services call `AuditLogService` when `--features.audit` is enabled
- Key files: `libs/generator/src/audit/audit.module.ts`, `libs/generator/src/audit/services/*`

### RBAC

- Permission decorators (`@RequirePermission('resource.action')`) emitted on controllers when enabled
- Generator auto-registers `RbacModule` and seeds resource-based permissions
- Key files: `libs/generator/src/rbac/**`, `generators/controller/controller.generator.ts`

### File Upload

- Detects metadata columns flagged with `is_file_upload` and generates storage services & interceptors
- Supports Local, S3, GCS, and Azure providers plus optional image processing hooks
- Key file: `generators/features/file-upload.generator.ts`

### Caching

- Redis-backed cache service implements `ICacheService` with key builders and pattern invalidation
- Services and repositories use cache helpers when `--features.caching` is enabled
- Key files: `libs/generator/src/cache/cache.interface.ts`, `libs/generator/src/cache/redis-cache.service.ts`

### Search

- Pluggable drivers (Elasticsearch, Algolia, Meilisearch, SQL) with shared DTOs and mappers
- Provides generated search service scaffolding and sync jobs
- Key directory: `libs/generator/src/search/`

### Export (Optional)

- Experimental generator for CSV/Excel/PDF endpoints; requires manual integration and testing
- Use when custom exports are needed beyond standard CRUD responses

### Microservices

- **Auto-detection**: Determines if app is gateway or service based on directory structure
- **Gateway Controllers**: HTTP endpoints with `ClientProxy` to forward requests to microservices
- **Service Controllers**: `@MessagePattern` handlers for TCP/gRPC communication
- **Transports**: Supports TCP, gRPC, Redis, RabbitMQ, Kafka, NATS
- **0 Compilation Errors**: Fully tested with all three architectures (standalone, monorepo, microservices)
- Key files: `generators/controller/gateway-controller.generator.ts`, `service-controller.generator.ts`, `core/architecture.service.ts`
- Key file: `generators/features/export.generator.ts`

## Architecture Support

The generator reads `architecture` from `generator.config.json` (`standalone`, `monorepo`, or `microservices`) and adapts the output structure. Auto-detection also works based on directory structure.

| Architecture  | Behaviour                                                             | Implementation Notes                                                                                 |
| ------------- | --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------- |
| Standalone    | Modules under `src/modules/<resource>` with REST controllers          | Default mode; base path includes schema/table                                                        |
| Monorepo      | Multi-app layout with shared libs, each app has own modules           | Shares providers via barrels; same REST controllers; use `--app=<name>` flag                         |
| Microservices | Gateway (HTTP + ClientProxy) vs Service (@MessagePattern) controllers | **Fully tested with 0 errors**; uses TCP/gRPC transports; see `generators/controller/*.generator.ts` |

**Microservices Details:**

- **Gateway**: Generates HTTP REST endpoints with `ClientProxy` to forward requests to microservices
- **Service**: Generates `@MessagePattern` handlers for inter-service communication
- **Auto-detection**: Analyzes directory structure to determine if app is gateway or service
- **CLI Flag**: Use `--app=<name>` to target specific service (e.g., `--app=user`, `--app=gateway`)

Supporting types reside in `libs/generator/src/types/architecture.type.ts`. Selection is handled during `nest-generator init` and respected by generators via `ArchitectureService`.

## Workflow & CLI

| Command                                  | Purpose                                                                   | Notes                                                                        |
| ---------------------------------------- | ------------------------------------------------------------------------- | ---------------------------------------------------------------------------- |
| `nest-generator init`                    | Creates `generator.config.json`, prepares metadata schema, seeds defaults | Prompts for architecture, database, cache, audit options                     |
| `nest-generator generate <schema.table>` | Generates full module and registers it in `app.module.ts`                 | Flags: `--features.*`, `--app=<name>`, `--storageProvider`, `--skip-prompts` |
| `nest-generator delete <module>`         | Removes generated module and cleans references                            | Supports `--skip-prompts` and `--force`                                      |

**Key flags:**

- `--app=<name>`: Target specific app in monorepo/microservices (e.g., `--app=user`, `--app=gateway`)
- `--features.audit=<bool>`: Enable audit trail
- `--features.rbac=<bool>`: Enable RBAC
- `--features.fileUpload=<bool>`: Enable file uploads
- `--features.cache=<bool>`: Enable Redis caching
- `--storageProvider=<type>`: Choose storage (local, s3, gcs, azure)

`GenerateCommand` (`libs/generator/src/cli/commands/generate.command.ts`) maps CLI flags to the `features` object and orchestrates metadata fetch, file generation, and module registration.

## Quality & Testing

- **Test Coverage**: 707/740 tests passing (95.5%)
- **Compilation Errors**: 0 across all architectures (standalone, monorepo, microservices)
- **RBAC Tests**: 92 passing tests
- **File Upload Tests**: 40 passing tests
- Unit tests live under `libs/generator/src/**/*.spec.ts` and `libs/generator/test/`
- Custom code preservation via `core/code-merge.service.ts` safeguards `CUSTOM_CODE` blocks
- File checksums stored in `meta.generated_files` prevent accidental overwrites
- Integration targets: PostgreSQL 18+, MySQL 8+, Node.js 24+, NestJS 11

For full scoring and enterprise checklists see [Feature Scoring](./FEATURE_SCORING.md) and [Enterprise Quality](./ENTERPRISE_QUALITY.md).

## Roadmap & Open Items

- Implement `sync`, `check`, and `list` CLI commands with regression tests
- Promote export generator to a supported feature flag with documentation
- Add quickstart for search drivers and automate driver install hints
- Extend audit trail with contextual metadata (user agent, IP, geo) as future enhancement
- Continue trimming manual setup for file upload dependencies (scaffold install hints)

Keep this document in sync with the library. When new features ship, update the matrix, sections, and roadmap accordingly.

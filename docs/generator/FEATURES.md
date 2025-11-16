# NestJS Generator - Feature Overview

**Package**: `@ojiepermana/nest-generator`

- **Version**: 1.1.2
- **Last updated**: 12 November 2025
- **Automated tests**: 579 / 585 passing (~99%)
- **Feature score vs. prompt**: 119 / 100 (see [Feature Scoring](./FEATURE_SCORING.md))

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
| RBAC                 | Permission decorators, module auto-registration, metadata seeding                           | Complete | `libs/generator/src/rbac/**`                                                               |
| File Upload          | Multi-provider storage (local, S3, GCS, Azure) with generated helpers                       | Complete | `generators/features/file-upload.generator.ts`                                             |
| Caching              | Redis cache service, decorators, invalidation strategy                                      | Complete | `libs/generator/src/cache/**`                                                              |
| Search               | Configurable driver abstractions (Elasticsearch, Algolia, Meilisearch, SQL fallback)        | Complete | `libs/generator/src/search/**`                                                             |
| Export               | CSV/Excel/PDF endpoint scaffolding (manual enable)                                          | Optional | `generators/features/export.generator.ts`                                                  |
| CLI                  | `init`, `generate`, `delete`, placeholders for `sync`, `check`, `list`                      | Mixed    | `libs/generator/src/cli/**`                                                                |

Legend: Complete = shipped - Optional = manual enablement - Mixed = partially implemented/planned

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
- Adds Swagger metadata, DTO validation pipes, and pagination parameters automatically
- Source: `generators/controller/controller.generator.ts`

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
- Key file: `generators/features/export.generator.ts`

## Architecture Support

The generator reads `architecture` from `generator.config.json` (`standalone`, `monorepo`, or `microservices`) and adapts the output structure.

| Architecture  | Behaviour                                                   | Implementation Notes                                                                                |
| ------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------- |
| Standalone    | Modules under `src/<resource>` with REST controllers        | Default mode; base path includes schema/table                                                       |
| Monorepo      | Supports multi-app layout with shared libs                  | Shares providers via barrels; same REST controllers                                                 |
| Microservices | Splits gateway vs. service controllers and message patterns | Uses `@MessagePattern` + `ClientProxy`; see `generators/controller/service-controller.generator.ts` |

Supporting types reside in `libs/generator/src/types/architecture.type.ts`. Selection is handled during `nest-generator init` and respected by generators via `GeneratorService`.

## Workflow & CLI

| Command                                  | Purpose                                                                   | Notes                                                                 |
| ---------------------------------------- | ------------------------------------------------------------------------- | --------------------------------------------------------------------- |
| `nest-generator init`                    | Creates `generator.config.json`, prepares metadata schema, seeds defaults | Prompts for architecture, database, cache, audit options              |
| `nest-generator generate <schema.table>` | Generates full module and registers it in `app.module.ts`                 | Flags: `--features.*`, `--all`, `--storageProvider`, `--skip-prompts` |
| `nest-generator delete <module>`         | Removes generated module and cleans references                            | Supports `--skip-prompts` and `--force`                               |
| `nest-generator sync`                    | Planned metadata resync of all modules                                    | Currently prints placeholder warning (Task 21)                        |
| `nest-generator check`                   | Planned drift detection                                                   | Placeholder                                                           |
| `nest-generator list`                    | Planned module listing                                                    | Placeholder                                                           |

`GenerateCommand` (`libs/generator/src/cli/commands/generate.command.ts`) maps CLI flags to the `features` object and orchestrates metadata fetch, file generation, and module registration.

## Quality & Testing

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

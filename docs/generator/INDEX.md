# @ojiepermana/nest-generator Documentation

NestJS metadata-driven CRUD generator with audit, caching, RBAC, and file upload support. Use this index as the navigation hub for every guide inside `docs/generator/`.

## Start Here

- [Quick Start Guide](./QUICKSTART.md) – Generate the first module in five minutes
- [Requirements](./REQUIREMENTS.md) – Node, npm, database, and tooling checklist
- [Installation](../../libs/generator/README.md#installation) – Add the generator to a project

## Feature Guides

- [Features Overview](./FEATURES.md) – Generator capabilities and status matrix
- [Audit Trail](./audit/AUDIT_GUIDE.md) – Metadata, tables, and query hooks
- [RBAC Guide](./rbac/RBAC_GUIDE.md) – Role, permission, and decorator usage
- [File Upload Guide](./FILE_UPLOAD.md) – Storage providers, validation, and generated helpers
- [Caching Guide](./CACHING.md) – Redis integration and cache invalidation flows

## Quick Paths by Goal

- Ship CRUD fast → [Quick Start](./QUICKSTART.md)
- Secure endpoints → [RBAC Guide](./rbac/RBAC_GUIDE.md)
- Track changes → [Audit Guide](./audit/AUDIT_GUIDE.md)
- Handle files → [File Upload](./FILE_UPLOAD.md)
- Improve performance → [Caching](./CACHING.md)
- Plan architecture → [Features · Architecture Support](./FEATURES.md#architecture-support)

## Architecture & Data

- [Database Guide](./DATABASE.md) – PostgreSQL and MySQL configuration
- [Metadata Schemas](./database/SCHEMAS.md) – `meta.*` schema layout
- [Recommended Schemas](./RECOMMENDED_SCHEMAS.md) – Table patterns that work best
- [Migration Guide](./MIGRATION.md) – Upgrade steps between releases

## Quality, Operations, and Examples

- [Feature Scoring](./FEATURE_SCORING.md) – Compliance scoring vs. prompt specification
- [Enterprise Quality](./ENTERPRISE_QUALITY.md) – Hardening checklist
- [Best Practices](./BEST_PRACTICES.md) – Production considerations
- [Examples](./EXAMPLES.md) – Real-world module scenarios
- [Troubleshooting](./TROUBLESHOOTING.md) – Common errors and fixes

## Quickstart Series

- [RBAC Quickstart](./quickstart/RBAC_QUICKSTART.md) – Role-based access control in 10 minutes
- [Audit Quickstart](./quickstart/AUDIT_QUICKSTART.md) – Track all changes automatically
- [Upload Quickstart](./quickstart/UPLOAD_QUICKSTART.md) – File uploads with S3/GCS/Azure
- [Microservices Quickstart](./quickstart/MICROSERVICES_QUICKSTART.md) – Gateway + Services architecture ✨ NEW!

## Reference & History

- Project CLI contract → `libs/generator/src/cli`
- Generator sources → `libs/generator/src/generators`
- Archived notes → `docs/generator/archive/`
- Original specification → [archive/specs/prompt.md](./archive/specs/prompt.md)

## Contributing to the Docs

1. Place new `.md` files inside the appropriate subdirectory (`docs/generator/...`).
2. Add a link in this index and cross-link related guides.
3. Keep instructions aligned with current generator behavior (check `libs/generator/src`).
4. Document new features and update the feature matrix after shipping changes.

## Support & Links

- [Open issues](https://github.com/ojiepermana/nest/issues)
- [Package](https://www.npmjs.com/package/@ojiepermana/nest-generator)
- License: MIT © Ojie Permana

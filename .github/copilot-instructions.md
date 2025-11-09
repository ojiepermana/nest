# NestJS Publishable Libraries Monorepo

This is a NestJS monorepo for developing and publishing scoped npm packages (`@ojiepermana/nest-generator` and `@ojiepermana/nest`).

## Architecture

**Monorepo Structure:**

- Root project: Main NestJS application in `src/` (for development/testing)
- Libraries: Two publishable libraries in `libs/` directory
  - `libs/generator/` → `@ojiepermana/nest-generator` - Code generator utilities
  - `libs/nest/` → `@ojiepermana/nest` - Core utilities and common modules

**Build System:**

- Uses NestJS CLI with monorepo configuration (`nest-cli.json`)
- Build output goes to `dist/libs/{library}/` at root, then copied to `libs/{library}/dist/` for publishing
- Each library has independent `package.json` with scope `@ojiepermana/`
- TypeScript path mapping enables cross-library imports during development

## Critical Workflows

### Building Libraries

```bash
# Build single library
npm run build:generator  # or npm run build:nest

# Build all libraries (required before publishing)
npm run build:all-libs
```

**Important:** The build process outputs to `dist/libs/` at root. Publishing scripts automatically copy to `libs/{library}/dist/` before npm publish.

### Publishing to npm

**Interactive (recommended):**

```bash
./scripts/publish-libs.sh
```

This script: checks npm auth, validates git status, builds library, copies dist files, and publishes.

**Manual:**

```bash
npm run publish:all-libs  # builds then publishes both libraries
```

### Version Management

```bash
./scripts/version-bump.sh  # Interactive version bump (patch/minor/major)
```

Bump versions in library `package.json` files only (not root). Then commit, push, and publish.

## Project-Specific Conventions

**Package Configuration:**

- All libraries use `publishConfig.access: "public"` for scoped packages
- `files` array in `package.json` explicitly includes `dist/**/*.js`, `dist/**/*.d.ts`, and `README.md`
- Peer dependencies (not dependencies) for `@nestjs/*`, `reflect-metadata`, and `rxjs`

**Build Configuration (`nest-cli.json`):**

- Each library has `webpack: false` (different from root app which uses webpack)
- `entryFile: "index"` points to `src/index.ts` in each library
- Libraries use individual `tsconfig.lib.json` that extend root config

**TypeScript Path Mapping:**
Both development imports and Jest tests use path aliases:

```typescript
import { GeneratorModule } from '@ojiepermana/nest-generator';
import { NestModule } from '@ojiepermana/nest';
```

Configured in root `tsconfig.json` paths and `jest.moduleNameMapper`.

**Distribution Pattern:**

- Root builds to: `dist/libs/{library}/`
- Publish scripts copy to: `libs/{library}/dist/` (this is what gets published)
- `.npmignore` or `files` array controls what goes to npm

## Testing

Jest configuration in root `package.json` with:

- `roots` pointing to both `src/` and `libs/`
- Module name mapper for library path aliases
- Test files: `*.spec.ts` pattern

## Development Tips

**Local Testing:**
Before publishing, link locally with `npm link` from `libs/{library}/` directory.

**Pre-Publish Checklist:**
See `CHECKLIST.md` for complete verification steps including:

- Build succeeds without errors
- TypeScript declarations generate properly
- Package contents verification with `npm pack --dry-run`

**Documentation:**

- `QUICK-PUBLISH.md` - Fast reference for publishing
- `PUBLISHING.md` - Complete guide with troubleshooting
- `LIBRARIES.md` - Library-specific documentation

## Common Issues

**Build Output Location:**
Libraries must be built from root using npm scripts, not `nest build` directly in library folders. The scripts handle copying dist to the correct location for publishing.

**Scope Publishing:**
First-time publish of `@ojiepermana/*` packages requires npm authentication and public access config.

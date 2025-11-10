# 📦 Publishing Guide

Panduan untuk mempublish library `@ojiepermana/nest-generator` dan `@ojiepermana/nest` ke npm registry.

## Prerequisites

### 1. Akun npm

Pastikan Anda sudah memiliki akun di [npmjs.com](https://www.npmjs.com/)

### 2. Login ke npm

```bash
npm login
```

Masukkan username, password, dan email Anda.

### 3. Verifikasi login

```bash
npm whoami
```

## Publishing Libraries

### Metode 1: Menggunakan Script Otomatis (Recommended)

```bash
# Publish dengan script interaktif
./scripts/publish-libs.sh
```

Script ini akan:

- ✅ Cek npm authentication
- ✅ Cek git status
- ✅ Build library
- ✅ Publish ke npm
- ✅ Tampilkan link npm package

### Metode 2: Manual per Library

**Publish @ojiepermana/nest-generator:**

```bash
npm run build:generator
cd libs/generator
npm publish
cd ../..
```

**Publish @ojiepermana/nest:**

```bash
npm run build:nest
cd libs/nest
npm publish
cd ../..
```

**Publish kedua library:**

```bash
npm run publish:all-libs
```

## Version Management

### Bump Version

Gunakan script untuk bump version:

```bash
./scripts/version-bump.sh
```

Atau manual:

```bash
# Patch version (1.0.0 -> 1.0.1)
cd libs/generator && npm version patch && cd ../..

# Minor version (1.0.0 -> 1.1.0)
cd libs/generator && npm version minor && cd ../..

# Major version (1.0.0 -> 2.0.0)
cd libs/generator && npm version major && cd ../..
```

### Version Workflow

1. **Bump version**

   ```bash
   ./scripts/version-bump.sh
   ```

2. **Commit changes**

   ```bash
   git add .
   git commit -m "chore: bump version to x.x.x"
   git push
   ```

3. **Publish**

   ```bash
   ./scripts/publish-libs.sh
   ```

## Published Packages

### @ojiepermana/nest-generator

**npm:** <https://www.npmjs.com/package/@ojiepermana/nest-generator>

**Install:**

```bash
npm install @ojiepermana/nest-generator
```

**Usage:**

```typescript
import { GeneratorModule } from '@ojiepermana/nest-generator';

@Module({
  imports: [GeneratorModule],
})
export class AppModule {}
```

### @ojiepermana/nest

**npm:** <https://www.npmjs.com/package/@ojiepermana/nest>

**Install:**

```bash
npm install @ojiepermana/nest
```

**Usage:**

```typescript
import { NestModule } from '@ojiepermana/nest';

@Module({
  imports: [NestModule],
})
export class AppModule {}
```

## Unpublish Package (Emergency Only)

⚠️ **Warning:** Unpublishing is permanent and can break dependent projects!

```bash
# Unpublish specific version
npm unpublish @ojiepermana/nest-generator@1.0.0

# Unpublish entire package (only within 72 hours)
npm unpublish @ojiepermana/nest-generator --force
```

## Troubleshooting

### Error: "You do not have permission to publish"

Pastikan:

1. Anda sudah login: `npm whoami`
2. Package name menggunakan scope yang Anda miliki (`@ojiepermana`)
3. `publishConfig.access` di package.json diset ke `"public"`

### Error: "Package already exists"

Jika package sudah ada:

1. Bump version terlebih dahulu
2. Atau gunakan nama yang berbeda

### Error: "You must verify your email"

Verifikasi email Anda di npm:

1. Buka <https://www.npmjs.com/>
2. Login
3. Verify email

## Best Practices

1. ✅ Selalu bump version sebelum publish
2. ✅ Test library secara lokal dulu
3. ✅ Update CHANGELOG.md
4. ✅ Commit changes sebelum publish
5. ✅ Tag release di git
6. ✅ Gunakan semantic versioning (semver)

## Package Configuration

Kedua package sudah dikonfigurasi dengan:

```json
{
  "name": "@ojiepermana/nest-generator",
  "version": "1.0.0",
  "publishConfig": {
    "access": "public"
  },
  "files": ["dist", "README.md"]
}
```

File yang akan di-publish:

- ✅ `dist/` - Compiled code
- ✅ `README.md` - Documentation
- ❌ `src/` - Source code (excluded)
- ❌ `*.spec.ts` - Test files (excluded via .npmignore)

## Scripts Available

| Script                      | Description                         |
| --------------------------- | ----------------------------------- |
| `npm run build:generator`   | Build @ojiepermana/nest-generator   |
| `npm run build:nest`        | Build @ojiepermana/nest             |
| `npm run build:all-libs`    | Build semua library                 |
| `npm run publish:generator` | Publish @ojiepermana/nest-generator |
| `npm run publish:nest`      | Publish @ojiepermana/nest           |
| `npm run publish:all-libs`  | Build & publish semua library       |
| `./scripts/publish-libs.sh` | Interactive publish script          |
| `./scripts/version-bump.sh` | Interactive version bump script     |

## Support

Jika ada masalah:

1. Check [npm documentation](https://docs.npmjs.com/)
2. Buka issue di GitHub repository
3. Contact: Ojie Permana

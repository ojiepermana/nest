# 📋 Pre-Publish Checklist

Checklist sebelum publish library ke npm.

## ✅ Configuration Check

### Package.json Configuration
- [x] `name` menggunakan scope `@ojiepermana/`
- [x] `version` sudah benar
- [x] `description` sudah jelas
- [x] `author` sudah diisi
- [x] `license` sudah diset (MIT)
- [x] `repository` sudah ditambahkan
- [x] `homepage` sudah ditambahkan
- [x] `keywords` sudah ditambahkan
- [x] `publishConfig.access: "public"` sudah diset
- [x] `files` array sudah ditambahkan

### Build Configuration
- [x] Library bisa di-build tanpa error
- [x] `dist/` folder tergenerate dengan benar
- [x] TypeScript declarations (`.d.ts`) tergenerate
- [x] `.npmignore` sudah dibuat

### Documentation
- [x] README.md untuk setiap library
- [x] Installation instructions
- [x] Usage examples
- [x] License information

## 🚀 Pre-Publish Steps

### 1. Verifikasi Build
```bash
npm run build:all-libs
```

Expected output:
- ✅ `libs/generator/dist/` ada
- ✅ `libs/nest/dist/` ada
- ✅ No build errors

### 2. Test Locally (Optional)
```bash
# Link library secara lokal
cd libs/generator
npm link
cd ../..

# Test di project lain
cd /path/to/test-project
npm link @ojiepermana/nest-generator
```

### 3. Check Package Contents
```bash
# Lihat apa yang akan di-publish
cd libs/generator
npm pack --dry-run

cd ../nest
npm pack --dry-run
```

### 4. Login to npm
```bash
npm whoami
# Jika belum login:
# npm login
```

### 5. Publish
```bash
# Interactive
./scripts/publish-libs.sh

# Or manual
npm run publish:all-libs
```

## 📝 Post-Publish Verification

### Verifikasi di npm
1. Cek di browser:
   - https://www.npmjs.com/package/@ojiepermana/nest-generator
   - https://www.npmjs.com/package/@ojiepermana/nest

2. Test install:
```bash
mkdir test-install
cd test-install
npm init -y
npm install @ojiepermana/nest-generator
npm install @ojiepermana/nest
```

3. Verifikasi version:
```bash
npm view @ojiepermana/nest-generator version
npm view @ojiepermana/nest version
```

## 🔄 Re-Publish Workflow

Untuk publish versi baru:

1. **Bump version**
   ```bash
   ./scripts/version-bump.sh
   ```

2. **Commit changes**
   ```bash
   git add .
   git commit -m "chore: release v1.0.x"
   git push
   ```

3. **Tag release** (Optional but recommended)
   ```bash
   git tag -a v1.0.0 -m "Release v1.0.0"
   git push origin v1.0.0
   ```

4. **Publish**
   ```bash
   ./scripts/publish-libs.sh
   ```

## ⚠️ Common Issues

### Issue: "You do not have permission to publish"
**Solution:**
- Pastikan logged in: `npm whoami`
- Pastikan scope `@ojiepermana` adalah milik Anda
- Atau create organization di npm

### Issue: "Package name too similar to existing package"
**Solution:**
- Gunakan nama yang lebih spesifik
- Atau tambahkan suffix/prefix

### Issue: "You must verify your email"
**Solution:**
- Login ke npmjs.com
- Verify email address

### Issue: "Package version already exists"
**Solution:**
- Bump version terlebih dahulu
- Tidak bisa overwrite version yang sudah published

## 📊 Package Info Summary

### @ojiepermana/nest-generator
```json
{
  "name": "@ojiepermana/nest-generator",
  "version": "1.0.0",
  "repository": "https://github.com/ojiepermana/nest",
  "directory": "libs/generator"
}
```

### @ojiepermana/nest
```json
{
  "name": "@ojiepermana/nest",
  "version": "1.0.0",
  "repository": "https://github.com/ojiepermana/nest",
  "directory": "libs/nest"
}
```

## 🎯 Ready to Publish?

Jika semua checklist sudah ✅, jalankan:

```bash
./scripts/publish-libs.sh
```

Good luck! 🚀

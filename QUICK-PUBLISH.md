# 🚀 Quick Publish Guide

## Langkah Cepat untuk Publish ke npm

### 1️⃣ Login ke npm (First time only)

```bash
npm login
```

### 2️⃣ Build Library

```bash
npm run build:all-libs
```

### 3️⃣ Publish dengan Script

```bash
./scripts/publish-libs.sh
```

Script akan menampilkan menu:
- Pilih library yang ingin di-publish (1, 2, atau 3)
- Script akan otomatis build dan publish

### ✅ Selesai!

Packages Anda sudah public di npm:
- **@ojiepermana/nest-generator** - https://npmjs.com/package/@ojiepermana/nest-generator
- **@ojiepermana/nest** - https://npmjs.com/package/@ojiepermana/nest

## Update & Re-publish

### 1️⃣ Bump Version

```bash
./scripts/version-bump.sh
```

### 2️⃣ Commit Changes

```bash
git add .
git commit -m "chore: release v1.0.x"
git push
```

### 3️⃣ Publish

```bash
./scripts/publish-libs.sh
```

---

📖 **Dokumentasi lengkap:** Lihat [PUBLISHING.md](./PUBLISHING.md)

# Generator Configuration

## 📍 Configuration File Location

Generator konfigurasi sekarang terpisah berdasarkan arsitektur di folder `config/generator/`:

```
config/
└── generator/
    ├── standalone.config.json      # For standalone apps
    ├── monorepo.config.json        # For monorepo apps
    └── microservices.config.json   # For microservices apps
```

## 🚀 Initialization

Ketika menjalankan `nest-generator init`, file konfigurasi akan otomatis dibuat sesuai arsitektur:

### Standalone

```bash
npx nest-generator init --architecture=standalone
# Creates: config/generator/standalone.config.json
```

### Monorepo

```bash
npx nest-generator init --architecture=monorepo
# Creates: config/generator/monorepo.config.json
```

### Microservices

```bash
npx nest-generator init --architecture=microservices
# Creates: config/generator/microservices.config.json
```

## 📋 Configuration Structure

### Standalone Configuration

```json
{
  "architecture": "standalone",
  "database": {
    "type": "postgresql",
    "host": "${DB_HOST}",
    "port": "${DB_PORT}",
    "database": "${DB_DATABASE}",
    "username": "${DB_USERNAME}",
    "password": "${DB_PASSWORD}",
    "ssl": "${DB_SSL}",
    "pool": {
      "min": "${DB_POOL_MIN}",
      "max": "${DB_POOL_MAX}",
      "idleTimeoutMillis": 30000,
      "connectionTimeoutMillis": 2000
    }
  },
  "features": {
    "swagger": true,
    "caching": false,
    "fileUpload": false,
    "export": true,
    "search": false,
    "audit": true,
    "rbac": false,
    "notifications": false
  }
}
```

### Monorepo Configuration

```json
{
  "architecture": "monorepo",
  "database": {
    // Same as standalone
  },
  "features": {
    // Same as standalone
  }
}
```

### Microservices Configuration

```json
{
  "architecture": "microservices",
  "database": {
    // Same as standalone
  },
  "features": {
    // Same as standalone
  },
  "microservices": {
    "gatewayApp": "gateway",
    "servicesPath": "apps/microservices",
    "services": [
      {
        "name": "entity",
        "port": 3004
      },
      {
        "name": "user",
        "port": 3001
      }
    ]
  }
}
```

## 🔄 Auto-Detection

Generator akan otomatis mendeteksi file konfigurasi yang sesuai:

1. Cek `config/generator/standalone.config.json`
2. Cek `config/generator/monorepo.config.json`
3. Cek `config/generator/microservices.config.json`
4. Fallback ke `generator.config.json` (legacy) jika ada

## 🔐 Environment Variables

Kredensial database disimpan di `.env`, bukan di file konfigurasi:

```env
# Database Configuration
DB_TYPE=postgresql
DB_HOST=localhost
DB_PORT=5432
DB_DATABASE=myapp
DB_USERNAME=postgres
DB_PASSWORD=secret
DB_SSL=false

# Connection Pool
DB_POOL_MIN=2
DB_POOL_MAX=10
```

## 📝 Notes

- **Security**: Password tidak pernah disimpan di file konfigurasi
- **Environment Variables**: Gunakan format `${VAR_NAME}` di konfigurasi
- **Legacy Support**: File `generator.config.json` di root masih didukung
- **Migration**: Jalankan `npx nest-generator init` untuk migrate ke struktur baru

## ✅ Best Practices

1. **Commit config files**: File di `config/generator/` aman untuk di-commit
2. **DO NOT commit .env**: Jangan commit file `.env` ke repository
3. **Use environment variables**: Selalu gunakan environment variables untuk kredensial
4. **Separate per architecture**: Gunakan file terpisah untuk setiap arsitektur

## 🔧 Troubleshooting

### Configuration not found

```bash
❌ No generator configuration found!
💡 Run `npx nest-generator init` first to initialize.
   Expected config location: config/generator/{architecture}.config.json
```

**Solution**: Jalankan `npx nest-generator init` untuk membuat file konfigurasi

### Using legacy config

```bash
⚠️  Using legacy generator.config.json. Consider running `npx nest-generator init` to migrate to new config structure.
```

**Solution**: Migrate dengan menjalankan:

```bash
# Backup old config
cp generator.config.json generator.config.json.bak

# Run init to create new config
npx nest-generator init

# Delete old config after verification
rm generator.config.json.bak
```

# NestJS Libraries Monorepo

Monorepo untuk library NestJS dengan 2 library utama:

## Libraries

### 1. @ojiepermana/nest-generator

Library untuk code generator dan template management.

**Lokasi:** `libs/generator`

**Build:**

```bash
npm run build:generator
```

### 2. @ojiepermana/nest

Library core untuk utilities dan shared modules.

**Lokasi:** `libs/nest`

**Build:**

```bash
npm run build:nest
```

## Development

### Setup

```bash
npm install
```

### Build semua library

```bash
npm run build:all-libs
```

### Build specific library

```bash
npm run build:generator
npm run build:nest
```

### Testing

```bash
npm test
```

### Linting

```bash
npm run lint
```

### Format code

```bash
npm run format
```

## Import dalam project

Setelah build, Anda bisa import library dengan:

```typescript
// Import dari @ojiepermana/nest-generator
import { GeneratorModule, GeneratorService } from '@ojiepermana/nest-generator';

// Import dari @ojiepermana/nest
import { NestModule, NestService } from '@ojiepermana/nest';
```

## Publishing

### Publish @ojiepermana/nest-generator

```bash
cd libs/generator
npm publish
```

### Publish @ojiepermana/nest

```bash
cd libs/nest
npm publish
```

## Struktur Project

```
nest/
├── libs/
│   ├── generator/           # @ojiepermana/nest-generator
│   │   ├── src/
│   │   ├── package.json
│   │   ├── tsconfig.lib.json
│   │   └── README.md
│   └── nest/               # @ojiepermana/nest
│       ├── src/
│       ├── package.json
│       ├── tsconfig.lib.json
│       └── README.md
├── src/                    # Main application
├── scripts/
│   └── nest-update.sh     # Update script
├── package.json
└── nest-cli.json
```

## Update Dependencies

Gunakan script untuk update semua dependencies:

```bash
./scripts/nest-update.sh
```

## License

MIT

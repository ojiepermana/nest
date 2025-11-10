# Installation Policy

## Dev Dependency Only

`@ojiepermana/nest-generator` is a **development tool** and must be installed as a dev dependency.

### ✅ Correct Installation

```bash
npm install --save-dev @ojiepermana/nest-generator
```

### ❌ Incorrect Installation

```bash
npm install @ojiepermana/nest-generator  # Will fail!
```

## Why Dev Dependency?

1. **Not needed in production**: The generator creates code files during development, not runtime
2. **Reduces production bundle size**: Development tools shouldn't be in production dependencies
3. **Security**: Limits exposure of development tools in production environments
4. **Best practices**: Follows npm/Node.js ecosystem conventions for CLI tools

## What Happens If You Try?

If you attempt to install as a regular dependency, you'll see:

```
⚠️  @ojiepermana/nest-generator should be installed as a dev dependency.
   Use: npm install --save-dev @ojiepermana/nest-generator
```

The installation will be blocked to prevent accidental production dependency.

## Usage After Installation

Once installed as dev dependency, use the CLI:

```bash
# Initialize
npx nest-generator init

# Generate code
npx nest-generator generate users

# Add search
npx nest-generator add-search products --driver=elasticsearch
```

## Package Managers

All major package managers are supported:

```bash
# npm
npm install --save-dev @ojiepermana/nest-generator

# Yarn
yarn add --dev @ojiepermana/nest-generator

# pnpm
pnpm add --save-dev @ojiepermana/nest-generator
```

## CI/CD Environments

In CI/CD pipelines, dev dependencies are typically installed automatically:

```bash
npm ci  # Installs all dependencies including devDependencies
```

No special configuration needed.

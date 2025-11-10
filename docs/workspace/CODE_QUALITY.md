# Code Quality & Formatting Guide

This repository uses automated tools to maintain consistent code quality and formatting.

## 🎨 Prettier (Code Formatter)

**Configuration:** `.prettierrc`

Automatically formats TypeScript, JavaScript, JSON, and Markdown files.

### Settings

- Single quotes for strings
- Trailing commas for better diffs
- Print width: 100 characters (120 for Markdown)
- 2-space indentation
- Preserve prose wrapping in Markdown

### Usage

```bash
# Format all files
npm run format

# Check formatting without changes
npm run format:check

# Auto-format on save in VS Code (recommended)
# Install: Prettier - Code formatter extension
# Enable: "Format on Save" in VS Code settings
```

## 📝 Markdownlint (Markdown Linter)

**Configuration:** `.markdownlintrc` / `.markdownlint.json`

Ensures Markdown files follow best practices while allowing flexibility for documentation.

### Disabled Rules

We intentionally disable these rules for better documentation:

- **MD033** (no-inline-html) - Allow HTML for badges, centered images, TypeScript types
- **MD041** (first-line-heading) - Allow centered headers with logos
- **MD014** (commands-show-output) - Allow `$` prefix in shell examples
- **MD026** (no-trailing-punctuation) - Allow `!` in headings for excitement
- **MD029** (ol-prefix) - Flexible list numbering (not just 1,2,3...)
- **MD040** (fenced-code-language) - Allow blank code blocks for examples
- **MD051** (link-fragments) - Allow special characters in anchor links
- **MD036** (no-emphasis-as-heading) - Allow bold text as pseudo-headings

### Enabled Rules

- **MD024** (no-duplicate-heading) - Only check sibling headings
- **MD022** (blanks-around-headings) - Require blank lines around headings
- **MD032** (blanks-around-lists) - Require blank lines around lists
- **MD031** (blanks-around-fences) - Require blank lines around code blocks
- **MD019** (no-multiple-space-atx) - Single space after `#` in headings

### Usage

```bash
# Lint all Markdown files
npm run lint:md

# Auto-fix Markdown issues
npm run lint:md:fix
```

## 🔍 ESLint (TypeScript/JavaScript Linter)

**Configuration:** `eslint.config.mjs`

Enforces code quality rules for TypeScript and JavaScript.

### Usage

```bash
# Lint and auto-fix
npm run lint

# Lint without fixing
npx eslint "{src,apps,libs,test}/**/*.ts"
```

## 📋 Pre-commit Checklist

Before committing code:

1. ✅ Run `npm run format` - Format all files
2. ✅ Run `npm run lint` - Fix ESLint errors
3. ✅ Run `npm run lint:md:fix` - Fix Markdown issues
4. ✅ Run `npm test` - Ensure tests pass

## 🚀 CI/CD Integration

These commands can be integrated into CI/CD pipelines:

```yaml
# GitHub Actions example
- name: Check formatting
  run: npm run format:check

- name: Lint code
  run: npm run lint

- name: Lint Markdown
  run: npm run lint:md

- name: Run tests
  run: npm test
```

## 📦 Installed Tools

| Tool             | Version | Purpose                       |
| ---------------- | ------- | ----------------------------- |
| Prettier         | Latest  | Code formatting               |
| markdownlint-cli | Latest  | Markdown linting              |
| ESLint           | Latest  | TypeScript/JavaScript linting |

## 🔧 VS Code Setup (Recommended)

### Required Extensions

1. **Prettier - Code formatter** (`esbenp.prettier-vscode`)
2. **ESLint** (`dbaeumer.vscode-eslint`)
3. **markdownlint** (`DavidAnson.vscode-markdownlint`)

### Recommended Settings

Add to `.vscode/settings.json`:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "markdownlint.config": {
    "extends": ".markdownlintrc"
  }
}
```

## ❓ Troubleshooting

### VS Code not picking up config changes

1. Reload VS Code window: `Cmd+Shift+P` → "Developer: Reload Window"
2. Clear VS Code cache: Close VS Code, delete workspace storage
3. Check extension settings: Ensure extensions are enabled for workspace

### Prettier not formatting

1. Check file is not in `.prettierignore`
2. Verify Prettier extension is installed
3. Check default formatter: `Cmd+Shift+P` → "Format Document With..." → Choose Prettier

### Markdownlint showing errors for valid syntax

1. Check `.markdownlintrc` is being used
2. Create `.markdownlint.json` if CLI tool prefers JSON
3. Add specific rules to disable problematic checks

## 📚 Documentation

- [Prettier Docs](https://prettier.io/docs/en/)
- [Markdownlint Rules](https://github.com/DavidAnson/markdownlint/blob/main/doc/Rules.md)
- [ESLint Rules](https://eslint.org/docs/latest/rules/)

## 🎯 Quick Reference

```bash
# Daily workflow
npm run format && npm run lint && npm test

# Before commit
npm run format:check && npm run lint:md && npm test

# Fix everything
npm run format && npm run lint && npm run lint:md:fix
```

---

**Note:** The goal is **consistency** and **readability**, not perfection. Rules are configured to support real-world documentation while maintaining quality.

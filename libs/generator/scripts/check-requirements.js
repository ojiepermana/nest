#!/usr/bin/env node

/**
 * Check system requirements for @ojiepermana/nest-generator
 * This script runs during npm install to warn about incompatible versions
 */

const { execSync } = require('child_process');
const path = require('path');
const fs = require('fs');

// Try to load chalk, fallback to plain text if not available
let chalk;
try {
  chalk = require('chalk');
} catch (e) {
  // Fallback: create a chalk-like object without colors
  chalk = new Proxy(
    {},
    {
      get: () => (text) => text,
    },
  );
}

const REQUIREMENTS = {
  node: '24.0.0',
  npm: '11.0.0',
  nestjs: '11.0.0',
};

function parseVersion(version) {
  return version
    .replace(/[^\d.]/g, '')
    .split('.')
    .map(Number);
}

function compareVersions(current, required) {
  const curr = parseVersion(current);
  const req = parseVersion(required);

  for (let i = 0; i < 3; i++) {
    if (curr[i] > req[i]) return 1;
    if (curr[i] < req[i]) return -1;
  }
  return 0;
}

function checkNodeVersion() {
  const currentVersion = process.version;
  const comparison = compareVersions(currentVersion, REQUIREMENTS.node);

  if (comparison < 0) {
    console.log('\n' + chalk.yellow('⚠️  WARNING: Node.js version requirement not met!'));
    console.log(chalk.red(`   Current: ${currentVersion}`));
    console.log(chalk.green(`   Required: ${REQUIREMENTS.node}+`));
    console.log(chalk.yellow('   Some features may not work correctly.\n'));
    return false;
  }

  console.log(chalk.green(`✓ Node.js ${currentVersion} (Required: ${REQUIREMENTS.node}+)`));
  return true;
}

function checkNpmVersion() {
  try {
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    const comparison = compareVersions(npmVersion, REQUIREMENTS.npm);

    if (comparison < 0) {
      console.log(chalk.yellow(`⚠️  WARNING: npm version requirement not met!`));
      console.log(chalk.red(`   Current: ${npmVersion}`));
      console.log(chalk.green(`   Required: ${REQUIREMENTS.npm}+`));
      console.log(chalk.yellow('   Consider updating npm: npm install -g npm@latest\n'));
      return false;
    }

    console.log(chalk.green(`✓ npm ${npmVersion} (Required: ${REQUIREMENTS.npm}+)`));
    return true;
  } catch (error) {
    console.log(chalk.yellow('⚠️  Could not determine npm version'));
    return true;
  }
}

function checkNestJSVersion() {
  try {
    // Try to find package.json in parent directories
    let currentDir = path.resolve(__dirname, '../../..');
    let packageJsonPath;

    // Search up to 3 levels
    for (let i = 0; i < 3; i++) {
      const testPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(testPath)) {
        packageJsonPath = testPath;
        break;
      }
      currentDir = path.resolve(currentDir, '..');
    }

    if (!packageJsonPath) {
      console.log(chalk.dim('ℹ  NestJS version check skipped (package.json not found)'));
      return true;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const nestVersion =
      packageJson.dependencies?.['@nestjs/core'] ||
      packageJson.devDependencies?.['@nestjs/core'] ||
      packageJson.peerDependencies?.['@nestjs/core'];

    if (!nestVersion) {
      console.log(chalk.yellow('⚠️  NestJS not detected in your project'));
      console.log(chalk.yellow(`   Required: NestJS ${REQUIREMENTS.nestjs}+`));
      console.log(chalk.yellow('   Install with: npm install @nestjs/core @nestjs/common\n'));
      return false;
    }

    const version = nestVersion.replace(/[\^~>=<]/g, '');
    const comparison = compareVersions(version, REQUIREMENTS.nestjs);

    if (comparison < 0) {
      console.log(chalk.yellow('⚠️  WARNING: NestJS version requirement not met!'));
      console.log(chalk.red(`   Current: ${nestVersion}`));
      console.log(chalk.green(`   Required: ${REQUIREMENTS.nestjs}+`));
      console.log(
        chalk.yellow('   Update with: npm install @nestjs/core@latest @nestjs/common@latest\n'),
      );
      return false;
    }

    console.log(chalk.green(`✓ NestJS ${nestVersion} (Required: ${REQUIREMENTS.nestjs}+)`));
    return true;
  } catch (error) {
    console.log(chalk.dim('ℹ  NestJS version check skipped (not in project dependencies yet)'));
    return true;
  }
}

function checkDatabaseDrivers() {
  try {
    // Try to find package.json in parent directories
    let currentDir = path.resolve(__dirname, '../../..');
    let packageJsonPath;

    for (let i = 0; i < 3; i++) {
      const testPath = path.join(currentDir, 'package.json');
      if (fs.existsSync(testPath)) {
        packageJsonPath = testPath;
        break;
      }
      currentDir = path.resolve(currentDir, '..');
    }

    if (!packageJsonPath) {
      console.log(chalk.dim('ℹ  Database driver check skipped'));
      return true;
    }

    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const hasPg = packageJson.dependencies?.pg || packageJson.devDependencies?.pg;
    const hasMysql = packageJson.dependencies?.mysql2 || packageJson.devDependencies?.mysql2;

    if (!hasPg && !hasMysql) {
      console.log(chalk.yellow('\n⚠️  WARNING: No database driver detected!'));
      console.log(chalk.yellow('   Required: pg (PostgreSQL 18+) OR mysql2 (MySQL 8+)'));
      console.log(chalk.yellow('   Install with:'));
      console.log(chalk.dim('     npm install pg         # For PostgreSQL'));
      console.log(chalk.dim('     npm install mysql2     # For MySQL\n'));
      return false;
    }

    if (hasPg) {
      console.log(chalk.green('✓ PostgreSQL driver (pg) detected'));
    }
    if (hasMysql) {
      console.log(chalk.green('✓ MySQL driver (mysql2) detected'));
    }

    return true;
  } catch (error) {
    console.log(chalk.dim('ℹ  Database driver check skipped'));
    return true;
  }
}

function main() {
  console.log('\n' + chalk.bold.cyan('🔍 Checking @ojiepermana/nest-generator requirements...\n'));

  const results = {
    node: checkNodeVersion(),
    npm: checkNpmVersion(),
    nestjs: checkNestJSVersion(),
    database: checkDatabaseDrivers(),
  };

  const allPassed = Object.values(results).every((r) => r === true);

  if (!allPassed) {
    console.log('\n' + chalk.yellow('━'.repeat(60)));
    console.log(chalk.yellow.bold('⚠️  Some requirements are not met!'));
    console.log(chalk.yellow('   Installation will continue, but you may encounter issues.'));
    console.log(chalk.yellow('   Please review the warnings above.\n'));
    console.log(
      chalk.dim(
        '   Documentation: https://github.com/ojiepermana/nest/tree/main/libs/generator#readme',
      ),
    );
    console.log(chalk.yellow('━'.repeat(60) + '\n'));
  } else {
    console.log('\n' + chalk.green('━'.repeat(60)));
    console.log(chalk.green.bold("✓ All requirements met! You're ready to go."));
    console.log(chalk.green('━'.repeat(60) + '\n'));
  }
}

// Run checks
main();

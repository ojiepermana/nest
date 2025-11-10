#!/usr/bin/env node

/**
 * Auto-initialize generator with config from .env
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Read .env file
const envPath = path.join(__dirname, '..', '.env');
if (!fs.existsSync(envPath)) {
  console.error('❌ .env file not found. Please create it first.');
  process.exit(1);
}

const envContent = fs.readFileSync(envPath, 'utf-8');
const envVars = {};
envContent.split('\n').forEach(line => {
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    envVars[match[1]] = match[2];
  }
});

console.log('📋 Database Configuration from .env:');
console.log(`   Type: PostgreSQL`);
console.log(`   Host: ${envVars.DB_HOST || '127.0.0.1'}`);
console.log(`   Port: ${envVars.DB_PORT || '5432'}`);
console.log(`   Database: ${envVars.DB_DATABASE || 'best'}`);
console.log(`   Username: ${envVars.DB_USERNAME || 'root'}`);
console.log('');

// Create config file for generator
const config = {
  architecture: 'standalone',
  database: {
    type: 'postgresql',
    host: envVars.DB_HOST || '127.0.0.1',
    port: parseInt(envVars.DB_PORT || '5432'),
    username: envVars.DB_USERNAME || 'root',
    password: envVars.DB_PASSWORD || '',
    database: envVars.DB_DATABASE || 'best',
    ssl: false
  }
};

const configPath = path.join(__dirname, '..', 'generator.config.json');
fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

console.log('✅ Created generator.config.json');
console.log('');
console.log('🚀 Now you can run generator commands:');
console.log('   nest-generator init    - Setup metadata schema');
console.log('   nest-generator generate schema.table');
console.log('');

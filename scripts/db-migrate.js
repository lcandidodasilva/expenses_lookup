/**
 * Database migration script for production
 * 
 * This script handles Prisma migrations for the production database
 * Run with: node scripts/db-migrate.js
 */

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

// Ensure we're using production environment variables
process.env.NODE_ENV = 'production';

// Load environment variables from .env.production
require('dotenv').config({ path: path.resolve(process.cwd(), '.env.production') });

console.log('Starting database migration for production...');

// Create a backup before migration
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const backupDir = path.resolve(process.cwd(), 'backups');

// Ensure backup directory exists
if (!fs.existsSync(backupDir)) {
  fs.mkdirSync(backupDir, { recursive: true });
}

// Run Prisma migration
const runMigration = () => {
  console.log('Running migration...');
  exec('npx prisma migrate deploy', (error, stdout, stderr) => {
    if (error) {
      console.error(`Migration error: ${error.message}`);
      return;
    }
    if (stderr) {
      console.error(`Migration stderr: ${stderr}`);
      return;
    }
    console.log(`Migration completed successfully: ${stdout}`);
  });
};

// Skip backup for now since we need DB credentials for pg_dump
// In a real setup, you would implement proper database backup here
runMigration(); 
/**
 * Database Setup Script
 * Initializes the PostgreSQL database and runs migrations
 */

const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Database configuration
const config = {
  user: process.env.DB_USER || 'postgres',
  host: process.env.DB_HOST || 'localhost',
  database: process.env.DB_NAME || 'social_sports_betting',
  password: process.env.DB_PASSWORD || 'postgres',
  port: process.env.DB_PORT || 5432,
};

// Create a pool for running migrations
const pool = new Pool(config);

/**
 * Run a SQL migration file
 */
async function runMigration(migrationFile) {
  const filePath = path.join(__dirname, 'migrations', migrationFile);
  const sql = fs.readFileSync(filePath, 'utf8');

  console.log(`Running migration: ${migrationFile}`);

  try {
    await pool.query(sql);
    console.log(`✓ Migration ${migrationFile} completed successfully`);
    return true;
  } catch (error) {
    console.error(`✗ Migration ${migrationFile} failed:`, error.message);
    throw error;
  }
}

/**
 * Check if database exists
 */
async function checkDatabase() {
  const adminPool = new Pool({
    ...config,
    database: 'postgres', // Connect to default database
  });

  try {
    const result = await adminPool.query(
      'SELECT 1 FROM pg_database WHERE datname = $1',
      [config.database]
    );

    await adminPool.end();
    return result.rows.length > 0;
  } catch (error) {
    await adminPool.end();
    throw error;
  }
}

/**
 * Create database if it doesn't exist
 */
async function createDatabase() {
  const adminPool = new Pool({
    ...config,
    database: 'postgres',
  });

  try {
    console.log(`Creating database: ${config.database}`);
    await adminPool.query(`CREATE DATABASE ${config.database}`);
    console.log(`✓ Database ${config.database} created successfully`);
    await adminPool.end();
  } catch (error) {
    await adminPool.end();
    throw error;
  }
}

/**
 * Main setup function
 */
async function setup() {
  console.log('='.repeat(50));
  console.log('Social Sports Betting Platform - Database Setup');
  console.log('='.repeat(50));
  console.log();

  try {
    // Check if database exists
    const dbExists = await checkDatabase();

    if (!dbExists) {
      await createDatabase();
    } else {
      console.log(`✓ Database ${config.database} already exists`);
    }

    console.log();
    console.log('Running migrations...');
    console.log('-'.repeat(50));

    // Get all migration files
    const migrationsDir = path.join(__dirname, 'migrations');
    const migrationFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    if (migrationFiles.length === 0) {
      console.log('No migration files found');
      return;
    }

    // Run each migration
    for (const file of migrationFiles) {
      await runMigration(file);
    }

    console.log();
    console.log('='.repeat(50));
    console.log('✓ Database setup completed successfully!');
    console.log('='.repeat(50));
  } catch (error) {
    console.error();
    console.error('='.repeat(50));
    console.error('✗ Database setup failed');
    console.error('='.repeat(50));
    console.error('Error:', error.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

/**
 * Reset database (drop and recreate)
 */
async function reset() {
  console.log('='.repeat(50));
  console.log('WARNING: Resetting database (all data will be lost)');
  console.log('='.repeat(50));
  console.log();

  const adminPool = new Pool({
    ...config,
    database: 'postgres',
  });

  try {
    // Drop database if exists
    console.log(`Dropping database: ${config.database}`);
    await adminPool.query(`DROP DATABASE IF EXISTS ${config.database}`);
    console.log(`✓ Database ${config.database} dropped`);

    await adminPool.end();

    // Run setup
    await setup();
  } catch (error) {
    await adminPool.end();
    console.error('✗ Database reset failed:', error.message);
    process.exit(1);
  }
}

// CLI handling
const command = process.argv[2];

if (command === 'reset') {
  reset();
} else {
  setup();
}

module.exports = { setup, reset, runMigration };

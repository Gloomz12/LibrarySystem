/**
 * Database setup script
 * Run: node db/setup.js
 *
 * Creates the database, tables, and seeds initial data.
 * Safe to run multiple times (uses IF NOT EXISTS / INSERT IGNORE).
 */

require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function setup() {
  // Connect without specifying a database first
  const conn = await mysql.createConnection({
    host:     process.env.DB_HOST     || 'localhost',
    port:     parseInt(process.env.DB_PORT || '3306'),
    user:     process.env.DB_USER     || 'root',
    password: process.env.DB_PASSWORD || '',
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  try {
    // Run schema
    console.log('📋 Running schema...');
    const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
    await conn.query(schema);
    console.log('✅ Schema applied');

    // Run seed
    console.log('🌱 Running seed data...');
    const seed = fs.readFileSync(path.join(__dirname, 'seed.sql'), 'utf8');
    await conn.query(seed);
    console.log('✅ Seed data inserted');

    console.log('\n🎉 Database setup complete!');
    console.log('   You can now start the server with: npm run dev');
  } catch (err) {
    if (err.code === 'ER_DUP_ENTRY') {
      console.log('ℹ️  Seed data already exists (duplicate entries skipped)');
    } else {
      console.error('❌ Setup error:', err.message);
      process.exit(1);
    }
  } finally {
    await conn.end();
  }
}

setup();

/**
 * Load demo data for AI model demonstration.
 * Run: node db/load-demo.js
 *
 * Safe to run multiple times — uses INSERT IGNORE throughout.
 */
require('dotenv').config();
const mysql = require('mysql2/promise');
const fs    = require('fs');
const path  = require('path');

async function loadDemo() {
  const conn = await mysql.createConnection({
    host:               process.env.DB_HOST     || '127.0.0.1',
    port:               parseInt(process.env.DB_PORT || '3306'),
    user:               process.env.DB_USER     || 'root',
    password:           process.env.DB_PASSWORD || '',
    database:           process.env.DB_NAME     || 'library_system',
    multipleStatements: true,
  });

  console.log('✅ Connected to MySQL');

  try {
    // Split SQL into individual statements and run each separately
    // so we can handle results cleanly
    const sql = fs.readFileSync(path.join(__dirname, 'demo-data.sql'), 'utf8');

    // Strip comments and split on semicolons
    const statements = sql
      .split('\n')
      .filter(line => !line.trim().startsWith('--') && line.trim() !== '')
      .join('\n')
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    let inserted = 0, updated = 0, selectResults = [];

    for (const stmt of statements) {
      const upper = stmt.toUpperCase().trimStart();
      if (upper.startsWith('SELECT')) {
        const [rows] = await conn.execute(stmt);
        selectResults.push(rows);
      } else if (upper.startsWith('INSERT') || upper.startsWith('UPDATE')) {
        const [result] = await conn.execute(stmt);
        if (upper.startsWith('INSERT')) inserted += result.affectedRows || 0;
        if (upper.startsWith('UPDATE')) updated  += result.affectedRows || 0;
      }
    }

    console.log(`\n📊 Results:`);
    console.log(`   Rows inserted: ${inserted}`);
    console.log(`   Rows updated:  ${updated}`);

    // Print SELECT verification results
    if (selectResults.length > 0) {
      console.log('\n📋 Verification:');
      for (const rows of selectResults) {
        if (!rows || rows.length === 0) continue;
        const first = rows[0];
        if (first.info !== undefined) {
          // Single-row info queries
          rows.forEach(r => {
            const val = r.count !== undefined ? r.count
                      : r.on_time !== undefined ? `${r.on_time} on-time, ${r.overdue} overdue`
                      : JSON.stringify(r);
            console.log(`   ${r.info} ${val}`);
          });
        }
      }
    }

    console.log('\n🎉 Demo data loaded successfully!');
    console.log('\n📌 What to do next:');
    console.log('   1. Restart the backend:  npm run dev');
    console.log('   2. Open Analytics → AI Performance → click "Re-evaluate"');
    console.log('   3. The overdue model should now show real Accuracy/Precision/Recall/F1/AUC');
    console.log('   4. The recommendation engine should show Precision@K and Catalog Coverage');
    console.log('\n👤 Demo student login: maria.santos@university.edu / Student@123');

  } catch (err) {
    console.error('❌ Error loading demo data:', err.message);
    if (err.sql) console.error('   SQL:', err.sql.substring(0, 120));
    process.exit(1);
  } finally {
    await conn.end();
  }
}

loadDemo();

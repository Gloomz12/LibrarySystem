require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const pool = require('../db/connection');
const { recalculateActiveFines, getFineConfig } = require('../services/fines');

async function fix() {
  const config = await getFineConfig();
  console.log(`Fine config: ${config.currency_symbol}${config.rate_per_day}/day, grace=${config.grace_period}d, max=${config.currency_symbol}${config.max_fine}`);

  // Recalculate fine_amount on all overdue active loans
  const count = await recalculateActiveFines();
  console.log(`Recalculated fines for ${count} overdue loan(s)`);

  // Sync user fines balance = sum of their active overdue fine_amounts
  const [overdueLoans] = await pool.execute(`
    SELECT t.user_id, SUM(t.fine_amount) AS total_fine
    FROM transactions t
    WHERE t.type='borrow' AND t.status='approved' AND t.returned_at IS NULL
      AND t.due_date < CURDATE() AND t.fine_amount > 0
    GROUP BY t.user_id
  `);

  // Reset all demo users fines to 0 first, then set overdue ones
  await pool.execute("UPDATE users SET fines=0.00 WHERE id LIKE 'd-usr-%'");

  for (const row of overdueLoans) {
    await pool.execute('UPDATE users SET fines=? WHERE id=?', [row.total_fine, row.user_id]);
    console.log(`  User ${row.user_id} -> fines: ${config.currency_symbol}${row.total_fine}`);
  }

  // Show final state of all active loans
  const [loans] = await pool.execute(`
    SELECT t.id, u.name, u.return_rate, t.due_date,
           DATEDIFF(CURDATE(), t.due_date) AS days_late,
           t.fine_amount, u.fines AS user_total_fines
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE t.type='borrow' AND t.status='approved' AND t.returned_at IS NULL
    ORDER BY t.due_date ASC
  `);

  console.log('\nActive loans summary:');
  console.log('Name'.padEnd(22) + 'Due Date'.padEnd(14) + 'Days Late'.padEnd(12) + 'Loan Fine'.padEnd(12) + 'Return Rate');
  console.log('-'.repeat(70));
  loans.forEach(l => {
    const late = parseInt(l.days_late);
    const status = late > 0 ? `${late}d OVERDUE` : `${Math.abs(late)}d remaining`;
    console.log(
      l.name.padEnd(22) +
      String(l.due_date).split('T')[0].padEnd(14) +
      status.padEnd(12) +
      `${config.currency_symbol}${parseFloat(l.fine_amount).toFixed(2)}`.padEnd(12) +
      `${l.return_rate}%`
    );
  });

  process.exit(0);
}

fix().catch(e => { console.error('Error:', e.message); process.exit(1); });

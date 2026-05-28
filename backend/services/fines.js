'use strict';
const pool = require('../db/connection');

/**
 * Get the current fine configuration.
 */
async function getFineConfig() {
  const [[config]] = await pool.execute('SELECT * FROM fine_config WHERE id = 1');
  return config || { rate_per_day: 5.00, grace_period: 0, max_fine: 500.00, currency_symbol: '₱' };
}

/**
 * Calculate fine for a loan.
 * @param {string} dueDate     - 'YYYY-MM-DD'
 * @param {string} returnedAt  - ISO datetime string (or null = today)
 * @returns {number} fine amount
 */
async function calculateFine(dueDate, returnedAt = null) {
  const config = await getFineConfig();
  const due    = new Date(dueDate);
  const ret    = returnedAt ? new Date(returnedAt) : new Date();

  // Normalize to midnight to count whole days
  due.setHours(0, 0, 0, 0);
  ret.setHours(0, 0, 0, 0);

  const daysLate = Math.floor((ret - due) / (1000 * 60 * 60 * 24));
  const effectiveDays = Math.max(0, daysLate - config.grace_period);
  const fine = Math.min(effectiveDays * parseFloat(config.rate_per_day), parseFloat(config.max_fine));
  return parseFloat(fine.toFixed(2));
}

/**
 * Apply fine to a user when a return is confirmed.
 * Also updates the transaction's fine_amount.
 * @param {object} conn        - mysql2 connection (within a transaction)
 * @param {string} transactionId
 * @param {string} userId
 * @param {string} dueDate
 * @param {string} returnedAt
 */
async function applyFineOnReturn(conn, transactionId, userId, dueDate, returnedAt) {
  const fine = await calculateFine(dueDate, returnedAt);

  if (fine > 0) {
    // Record fine on the transaction
    await conn.execute(
      'UPDATE transactions SET fine_amount = ? WHERE id = ?',
      [fine, transactionId]
    );
    // Add to user's total fines
    await conn.execute(
      'UPDATE users SET fines = fines + ? WHERE id = ?',
      [fine, userId]
    );
  }

  return fine;
}

/**
 * Recalculate and update fines for all currently overdue active loans.
 * Called periodically or on demand.
 */
async function recalculateActiveFines() {
  const config = await getFineConfig();
  const [loans] = await pool.execute(`
    SELECT t.id, t.user_id, t.due_date
    FROM transactions t
    WHERE t.type = 'borrow' AND t.status = 'approved'
      AND t.returned_at IS NULL
      AND t.due_date < CURDATE()
  `);

  for (const loan of loans) {
    const fine = await calculateFine(loan.due_date, null);
    await pool.execute(
      'UPDATE transactions SET fine_amount = ? WHERE id = ?',
      [fine, loan.id]
    );
  }

  return loans.length;
}

module.exports = { getFineConfig, calculateFine, applyFineOnReturn, recalculateActiveFines };

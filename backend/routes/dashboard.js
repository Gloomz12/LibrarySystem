const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');
const { getOverduePredictions } = require('../services/recommendations');

// ── GET /api/dashboard/admin ──────────────────────────────────────────────────
router.get('/admin', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [[bookStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total_books,
         SUM(CASE WHEN status = 'available' THEN 1 ELSE 0 END) AS available,
         SUM(CASE WHEN status = 'borrowed'  THEN 1 ELSE 0 END) AS borrowed
       FROM books`
    );

    const [[userStats]] = await pool.execute(
      `SELECT COUNT(*) AS total_students FROM users WHERE role = 'student' AND is_active = 1`
    );

    const [[txStats]] = await pool.execute(
      `SELECT
         COUNT(*) AS total,
         SUM(CASE WHEN type = 'borrow' THEN 1 ELSE 0 END) AS borrows,
         SUM(CASE WHEN type = 'return' THEN 1 ELSE 0 END) AS returns
       FROM transactions
       WHERE status IN ('approved','completed')`
    );

    const [[pendingStats]] = await pool.execute(
      `SELECT COUNT(*) AS pending_count
       FROM transactions
       WHERE status = 'pending' AND type IN ('borrow_request','return_request')`
    );

    // Genre distribution
    const [genreStats] = await pool.execute(
      `SELECT g.name, COUNT(bg.book_id) AS count
       FROM genres g
       JOIN book_genres bg ON bg.genre_id = g.id
       GROUP BY g.id, g.name
       ORDER BY count DESC
       LIMIT 10`
    );

    // Overdue predictions
    const overduePredictions = await getOverduePredictions();
    const overdueAlerts = overduePredictions.filter(p => p.riskTier === 'high risk').length;

    res.json({
      stats: {
        totalBooks:      bookStats.total_books,
        availableBooks:  bookStats.available,
        borrowedBooks:   bookStats.borrowed,
        totalStudents:   userStats.total_students,
        totalTransactions: txStats.total,
        borrows:         txStats.borrows,
        returns:         txStats.returns,
        pendingRequests: pendingStats.pending_count,
        overdueAlerts,
      },
      genreDistribution: genreStats,
      overduePredictions: overduePredictions.slice(0, 10),
    });
  } catch (err) {
    console.error('Admin dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/dashboard/student ────────────────────────────────────────────────
router.get('/student', authenticate, authorize('student'), async (req, res) => {
  const userId = req.user.id;

  try {
    // Active loans
    const [activeLoans] = await pool.execute(
      `SELECT t.id AS transaction_id, t.book_id, t.due_date,
              b.title, b.author, b.code, b.bg_banner, b.rating,
              DATEDIFF(t.due_date, CURDATE()) AS days_remaining
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = ? AND t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL
       ORDER BY t.due_date ASC`,
      [userId]
    );

    // Pending requests
    const [pendingRequests] = await pool.execute(
      `SELECT t.id AS transaction_id, t.book_id, t.type, t.created_at,
              b.title, b.author, b.code, b.bg_banner
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = ? AND t.status = 'pending'
       ORDER BY t.created_at DESC`,
      [userId]
    );

    // Due soon (within 3 days)
    const dueSoon = activeLoans.filter(l => l.days_remaining >= 0 && l.days_remaining <= 3);

    // Fines
    const [[fineRow]] = await pool.execute(
      'SELECT fines FROM users WHERE id = ?', [userId]
    );

    res.json({
      stats: {
        borrowed:        activeLoans.length,
        pendingRequests: pendingRequests.length,
        dueSoon:         dueSoon.length,
        fines:           parseFloat(fineRow.fines).toFixed(2),
      },
      activeLoans,
      pendingRequests,
    });
  } catch (err) {
    console.error('Student dashboard error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

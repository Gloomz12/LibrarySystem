const express = require('express');
const router  = express.Router();
const pool    = require('../db/connection');
const { authenticate, authorize } = require('../middleware/auth');
const { getRecommendationMetrics, getOverdueModelMetrics, clearModelCache, loadTrainingData } = require('../services/aiEngine');

// All analytics endpoints are admin-only
router.use(authenticate, authorize('admin'));

// ── GET /api/analytics/overview ───────────────────────────────────────────────
router.get('/overview', async (req, res) => {
  try {
    const [[books]]   = await pool.execute(`SELECT COUNT(*) AS total, SUM(status='borrowed') AS borrowed, SUM(status='available') AS available FROM books`);
    const [[users]]   = await pool.execute(`SELECT COUNT(*) AS total FROM users WHERE role='student' AND is_active=1`);
    const [[txStats]] = await pool.execute(`
      SELECT
        COUNT(*) AS total,
        SUM(type='borrow'  AND status='approved')   AS active_borrows,
        SUM(type='return'  AND status='completed')  AS completed_returns,
        SUM(status='pending')                        AS pending,
        SUM(type='borrow'  AND status='approved'
            AND returned_at IS NULL
            AND due_date < CURDATE())                AS overdue_count
      FROM transactions`);

    const [[avgLoan]] = await pool.execute(`
      SELECT AVG(DATEDIFF(COALESCE(returned_at, NOW()), created_at)) AS avg_days
      FROM transactions WHERE type='borrow' AND status='approved'`);

    res.json({
      books:   { total: books.total, borrowed: books.borrowed, available: books.available },
      users:   { total: users.total },
      transactions: {
        total:            txStats.total,
        activeBorrows:    txStats.active_borrows,
        completedReturns: txStats.completed_returns,
        pending:          txStats.pending,
        overdueCount:     txStats.overdue_count,
      },
      avgLoanDurationDays: parseFloat(parseFloat(avgLoan.avg_days || 0).toFixed(1)),
    });
  } catch (err) {
    console.error('Analytics overview error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/borrows-over-time ──────────────────────────────────────
router.get('/borrows-over-time', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT
        DATE_FORMAT(created_at, '%Y-%m') AS month,
        SUM(type='borrow') AS borrows,
        SUM(type='return') AS returns
      FROM transactions
      WHERE status IN ('approved','completed')
        AND created_at >= DATE_SUB(NOW(), INTERVAL 12 MONTH)
      GROUP BY month
      ORDER BY month ASC`);
    res.json(rows);
  } catch (err) {
    console.error('Borrows over time error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/top-books ──────────────────────────────────────────────
router.get('/top-books', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT b.id, b.title, b.author, b.code, b.bg_banner,
             COUNT(t.id) AS borrow_count
      FROM books b
      JOIN transactions t ON t.book_id = b.id
      WHERE t.type = 'borrow' AND t.status = 'approved'
      GROUP BY b.id
      ORDER BY borrow_count DESC
      LIMIT 10`);
    res.json(rows);
  } catch (err) {
    console.error('Top books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/genre-distribution ─────────────────────────────────────
router.get('/genre-distribution', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT g.name, COUNT(bg.book_id) AS book_count,
             COUNT(t.id) AS borrow_count
      FROM genres g
      LEFT JOIN book_genres bg ON bg.genre_id = g.id
      LEFT JOIN transactions t ON t.book_id = bg.book_id
        AND t.type = 'borrow' AND t.status = 'approved'
      GROUP BY g.id, g.name
      ORDER BY borrow_count DESC, book_count DESC`);
    res.json(rows);
  } catch (err) {
    console.error('Genre distribution error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/user-activity ──────────────────────────────────────────
router.get('/user-activity', async (req, res) => {
  try {
    const [rows] = await pool.execute(`
      SELECT u.id, u.name, u.student_id, u.return_rate,
             COUNT(DISTINCT CASE WHEN t.type='borrow' AND t.status='approved' AND t.returned_at IS NULL THEN t.id END) AS active_loans,
             COUNT(DISTINCT CASE WHEN t.type='borrow' AND t.status='approved' THEN t.id END) AS total_borrows,
             COUNT(DISTINCT rh.book_id) AS books_read,
             u.fines
      FROM users u
      LEFT JOIN transactions t ON t.user_id = u.id
      LEFT JOIN reading_history rh ON rh.user_id = u.id
      WHERE u.role = 'student' AND u.is_active = 1
      GROUP BY u.id
      ORDER BY total_borrows DESC`);
    res.json(rows);
  } catch (err) {
    console.error('User activity error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/analytics/ai-metrics ─────────────────────────────────────────────
// Returns both model evaluation reports
router.get('/ai-metrics', async (req, res) => {
  try {
    const [recMetrics, overdueMetrics] = await Promise.all([
      getRecommendationMetrics(),
      getOverdueModelMetrics(),
    ]);
    res.json({ recommendations: recMetrics, overduePrediction: overdueMetrics });
  } catch (err) {
    console.error('AI metrics error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/analytics/clear-model-cache ─────────────────────────────────────
// Force-retrain the overdue model on next request
router.post('/clear-model-cache', (req, res) => {
  clearModelCache();
  res.json({ message: 'Model cache cleared. Model will retrain on next prediction request.' });
});

// ── GET /api/analytics/debug-training ─────────────────────────────────────────
// Shows raw training data so you can verify what the model sees
router.get('/debug-training', async (req, res) => {
  try {
    const rows = await loadTrainingData();
    const labels = rows.map(r => ({
      id:            r.id,
      due_date:      r.due_date,
      returned_at:   r.returned_at,
      days_late:     parseInt(r.days_late),
      days_remaining:parseInt(r.days_remaining),
      loan_duration: parseInt(r.loan_duration),
      return_rate:   parseFloat(r.return_rate),
      overdue_count: parseInt(r.overdue_count),
      active_loans:  parseInt(r.active_loans),
      label:         parseInt(r.days_late) > 0 ? 'overdue' : 'on-time',
    }));
    res.json({
      totalSamples: rows.length,
      overdueCount: labels.filter(l => l.label === 'overdue').length,
      onTimeCount:  labels.filter(l => l.label === 'on-time').length,
      samples: labels,
    });
  } catch (err) {
    console.error('Debug training error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

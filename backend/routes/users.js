const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const { body, param } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// ── GET /api/users ────────────────────────────────────────────────────────────
// Admin only: list all users
router.get('/', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.student_id, u.name, u.email, u.role,
              u.return_rate, u.fines, u.is_active, u.created_at,
              COUNT(DISTINCT CASE WHEN t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL THEN t.id END) AS active_loans,
              COUNT(DISTINCT rh.book_id) AS history_count
       FROM users u
       LEFT JOIN transactions t ON t.user_id = u.id
       LEFT JOIN reading_history rh ON rh.user_id = u.id
       WHERE u.role = 'student'
       GROUP BY u.id
       ORDER BY u.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get users error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/users/:id ────────────────────────────────────────────────────────
// Admin: any user. Student: own profile only.
router.get('/:id', authenticate, async (req, res) => {
  const targetId = req.params.id === 'me' ? req.user.id : req.params.id;

  if (req.user.role === 'student' && targetId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT u.id, u.student_id, u.name, u.email, u.role,
              u.return_rate, u.fines, u.is_active, u.created_at,
              COUNT(DISTINCT CASE WHEN t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL THEN t.id END) AS active_loans,
              COUNT(DISTINCT rh.book_id) AS history_count
       FROM users u
       LEFT JOIN transactions t ON t.user_id = u.id
       LEFT JOIN reading_history rh ON rh.user_id = u.id
       WHERE u.id = ?
       GROUP BY u.id`,
      [targetId]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }

    // Compute risk tier
    const user = rows[0];
    user.riskTier = user.return_rate >= 80 ? 'low risk' : 'high risk';

    res.json(user);
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/users/:id/active-loans ──────────────────────────────────────────
router.get('/:id/active-loans', authenticate, async (req, res) => {
  const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
  if (req.user.role === 'student' && targetId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT t.id AS transaction_id, t.book_id, t.due_date, t.created_at AS borrowed_at,
              b.title, b.author, b.code, b.bg_banner, b.rating,
              DATEDIFF(t.due_date, CURDATE()) AS days_remaining
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       WHERE t.user_id = ? AND t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL
       ORDER BY t.due_date ASC`,
      [targetId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get active loans error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/users/:id/reading-history ───────────────────────────────────────
router.get('/:id/reading-history', authenticate, async (req, res) => {
  const targetId = req.params.id === 'me' ? req.user.id : req.params.id;
  if (req.user.role === 'student' && targetId !== req.user.id) {
    return res.status(403).json({ error: 'Access denied' });
  }

  try {
    const [rows] = await pool.execute(
      `SELECT rh.book_id, rh.read_at,
              b.title, b.author, b.code, b.bg_banner, b.rating, b.status
       FROM reading_history rh
       JOIN books b ON b.id = rh.book_id
       WHERE rh.user_id = ?
       ORDER BY rh.read_at DESC`,
      [targetId]
    );
    res.json(rows);
  } catch (err) {
    console.error('Get reading history error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/users ───────────────────────────────────────────────────────────
// Admin: create a new user
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('name').notEmpty().trim().withMessage('Name required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 8 }).withMessage('Password must be at least 8 characters'),
    body('role').isIn(['admin','student']).withMessage('Role must be admin or student'),
    body('studentId').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { name, email, password, role, studentId } = req.body;

    try {
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: 'Email already registered' });
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      await pool.execute(
        `INSERT INTO users (id, student_id, name, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [userId, studentId || null, name, email, passwordHash, role]
      );

      const [newUser] = await pool.execute(
        'SELECT id, student_id, name, email, role, return_rate, fines, created_at FROM users WHERE id = ?',
        [userId]
      );
      res.status(201).json(newUser[0]);
    } catch (err) {
      console.error('Create user error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── PUT /api/users/:id ────────────────────────────────────────────────────────
// Admin: update any user. Student: update own profile (limited fields).
router.put(
  '/:id',
  authenticate,
  [
    body('name').optional().notEmpty().trim(),
    body('email').optional().isEmail().normalizeEmail(),
    body('password').optional().isLength({ min: 8 }),
    body('isActive').optional().isBoolean(),
  ],
  validate,
  async (req, res) => {
    const targetId = req.params.id;

    if (req.user.role === 'student' && targetId !== req.user.id) {
      return res.status(403).json({ error: 'Access denied' });
    }

    const { name, email, password, isActive } = req.body;

    try {
      const updates = [];
      const values  = [];

      if (name  !== undefined) { updates.push('name = ?');  values.push(name); }
      if (email !== undefined) { updates.push('email = ?'); values.push(email); }
      if (password !== undefined) {
        const hash = await bcrypt.hash(password, 12);
        updates.push('password_hash = ?');
        values.push(hash);
      }
      // Only admin can toggle active status
      if (isActive !== undefined && req.user.role === 'admin') {
        updates.push('is_active = ?');
        values.push(isActive);
      }

      if (updates.length === 0) {
        return res.status(400).json({ error: 'No fields to update' });
      }

      await pool.execute(
        `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
        [...values, targetId]
      );

      const [updated] = await pool.execute(
        'SELECT id, student_id, name, email, role, return_rate, fines, is_active FROM users WHERE id = ?',
        [targetId]
      );
      res.json(updated[0]);
    } catch (err) {
      console.error('Update user error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'Email already in use' });
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;

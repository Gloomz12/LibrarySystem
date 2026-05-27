const express = require('express');
const router  = express.Router();
const { body, query } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// ── GET /api/transactions ─────────────────────────────────────────────────────
// Admin: all transactions. Student: own transactions only.
router.get(
  '/',
  authenticate,
  [
    query('type').optional().isIn(['borrow_request','borrow','return_request','return','overdue']),
    query('status').optional().isIn(['pending','approved','declined','completed','cancelled']),
    query('userId').optional(),
    query('sort').optional().isIn(['newest','oldest']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    const { type, status, userId, sort = 'newest', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      const whereClauses = [];
      const params = [];

      // Students can only see their own transactions
      if (req.user.role === 'student') {
        whereClauses.push('t.user_id = ?');
        params.push(req.user.id);
      } else if (userId) {
        whereClauses.push('t.user_id = ?');
        params.push(userId);
      }

      if (type) {
        whereClauses.push('t.type = ?');
        params.push(type);
      }
      if (status) {
        whereClauses.push('t.status = ?');
        params.push(status);
      }

      const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';
      const order = sort === 'oldest' ? 'ASC' : 'DESC';

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM transactions t ${where}`, params
      );
      const total = countRows[0].total;

      const [rows] = await pool.execute(
        `SELECT t.id, t.book_id, t.user_id, t.type, t.status,
                t.due_date, t.returned_at, t.fine_amount, t.notes,
                t.created_at, t.updated_at,
                b.title, b.author, b.code, b.bg_banner,
                u.name AS borrower_name, u.student_id AS borrower_student_id,
                u.email AS borrower_email
         FROM transactions t
         JOIN books b ON b.id = t.book_id
         JOIN users u ON u.id = t.user_id
         ${where}
         ORDER BY t.created_at ${order}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      res.json({
        transactions: rows,
        pagination: {
          total,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error('Get transactions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/transactions/pending ─────────────────────────────────────────────
// Admin only: all pending borrow/return requests
router.get('/pending', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT t.id AS transaction_id, t.book_id, t.user_id, t.type, t.status,
              t.due_date, t.created_at,
              b.title, b.author, b.code, b.bg_banner,
              u.name AS borrower_name, u.student_id AS borrower_student_id,
              u.email AS borrower_email, u.fines AS borrower_fines
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       JOIN users u ON u.id = t.user_id
       WHERE t.status = 'pending' AND t.type IN ('borrow_request','return_request')
       ORDER BY t.created_at ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get pending error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/transactions/borrow-request ─────────────────────────────────────
// Student: request to borrow a book
router.post(
  '/borrow-request',
  authenticate,
  authorize('student'),
  [body('bookId').notEmpty().withMessage('Book ID required')],
  validate,
  async (req, res) => {
    const { bookId } = req.body;
    const userId = req.user.id;

    try {
      // Check book exists and is available
      const [bookRows] = await pool.execute(
        'SELECT id, title, status FROM books WHERE id = ?', [bookId]
      );
      if (bookRows.length === 0) {
        return res.status(404).json({ error: 'Book not found' });
      }
      if (bookRows[0].status !== 'available') {
        return res.status(409).json({ error: 'Book is not available for borrowing' });
      }

      // Check no existing pending request from this user for this book
      const [existingRows] = await pool.execute(
        `SELECT id FROM transactions
         WHERE book_id = ? AND user_id = ? AND status = 'pending' AND type = 'borrow_request'`,
        [bookId, userId]
      );
      if (existingRows.length > 0) {
        return res.status(409).json({ error: 'You already have a pending borrow request for this book' });
      }

      const txId = uuidv4();
      await pool.execute(
        `INSERT INTO transactions (id, book_id, user_id, type, status)
         VALUES (?, ?, ?, 'borrow_request', 'pending')`,
        [txId, bookId, userId]
      );

      const [newTx] = await pool.execute(
        `SELECT t.*, b.title, b.author, b.code, b.bg_banner
         FROM transactions t JOIN books b ON b.id = t.book_id
         WHERE t.id = ?`,
        [txId]
      );

      res.status(201).json(newTx[0]);
    } catch (err) {
      console.error('Borrow request error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── POST /api/transactions/return-request ─────────────────────────────────────
// Student: request to return a book
router.post(
  '/return-request',
  authenticate,
  authorize('student'),
  [body('transactionId').notEmpty().withMessage('Transaction ID required')],
  validate,
  async (req, res) => {
    const { transactionId } = req.body;
    const userId = req.user.id;

    try {
      // Verify the borrow transaction belongs to this user and is active
      const [txRows] = await pool.execute(
        `SELECT t.id, t.book_id, t.status, t.type
         FROM transactions t
         WHERE t.id = ? AND t.user_id = ? AND t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL`,
        [transactionId, userId]
      );
      if (txRows.length === 0) {
        return res.status(404).json({ error: 'Active loan not found' });
      }

      // Check no existing pending return request
      const [existingReturn] = await pool.execute(
        `SELECT id FROM transactions
         WHERE book_id = ? AND user_id = ? AND type = 'return_request' AND status = 'pending'`,
        [txRows[0].book_id, userId]
      );
      if (existingReturn.length > 0) {
        return res.status(409).json({ error: 'Return request already pending' });
      }

      const returnTxId = uuidv4();
      await pool.execute(
        `INSERT INTO transactions (id, book_id, user_id, type, status, notes)
         VALUES (?, ?, ?, 'return_request', 'pending', ?)`,
        [returnTxId, txRows[0].book_id, userId, `Linked to borrow tx: ${transactionId}`]
      );

      const [newTx] = await pool.execute(
        `SELECT t.*, b.title, b.author, b.code, b.bg_banner
         FROM transactions t JOIN books b ON b.id = t.book_id
         WHERE t.id = ?`,
        [returnTxId]
      );

      res.status(201).json(newTx[0]);
    } catch (err) {
      console.error('Return request error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── POST /api/transactions/:id/cancel ─────────────────────────────────────────
// Student: cancel their own pending request
router.post('/:id/cancel', authenticate, authorize('student'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT id, user_id, status FROM transactions WHERE id = ?`,
      [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (rows[0].user_id !== req.user.id) {
      return res.status(403).json({ error: 'Not your transaction' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ error: 'Only pending requests can be cancelled' });
    }
    await pool.execute(
      `UPDATE transactions SET status = 'cancelled' WHERE id = ?`,
      [req.params.id]
    );
    res.json({ message: 'Request cancelled' });
  } catch (err) {
    console.error('Cancel request error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/transactions/:id/approve ────────────────────────────────────────
// Admin: approve a borrow or return request
router.post(
  '/:id/approve',
  authenticate,
  authorize('admin'),
  [body('dueDate').optional().isISO8601().withMessage('Invalid date format')],
  validate,
  async (req, res) => {
    const { dueDate } = req.body;
    const conn = await pool.getConnection();

    try {
      await conn.beginTransaction();

      const [txRows] = await conn.execute(
        `SELECT t.id, t.book_id, t.user_id, t.type, t.status
         FROM transactions t WHERE t.id = ?`,
        [req.params.id]
      );
      if (txRows.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Transaction not found' });
      }

      const tx = txRows[0];
      if (tx.status !== 'pending') {
        await conn.rollback();
        return res.status(409).json({ error: 'Transaction is not pending' });
      }

      if (tx.type === 'borrow_request') {
        // Verify book is still available
        const [bookRows] = await conn.execute(
          'SELECT status FROM books WHERE id = ?', [tx.book_id]
        );
        if (bookRows[0].status !== 'available') {
          await conn.rollback();
          return res.status(409).json({ error: 'Book is no longer available' });
        }

        // Calculate due date: 30 days from now if not provided
        const due = dueDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
          .toISOString().split('T')[0];

        // Convert borrow_request → borrow (approved)
        await conn.execute(
          `UPDATE transactions SET type = 'borrow', status = 'approved', due_date = ? WHERE id = ?`,
          [due, tx.id]
        );

        // Mark book as borrowed
        await conn.execute(
          `UPDATE books SET status = 'borrowed' WHERE id = ?`, [tx.book_id]
        );

        // Add to reading history
        await conn.execute(
          `INSERT IGNORE INTO reading_history (id, user_id, book_id)
           VALUES (?, ?, ?)`,
          [uuidv4(), tx.user_id, tx.book_id]
        );

      } else if (tx.type === 'return_request') {
        // Mark the original borrow as returned
        await conn.execute(
          `UPDATE transactions
           SET status = 'completed', returned_at = NOW(), type = 'return'
           WHERE book_id = ? AND user_id = ? AND type = 'borrow' AND status = 'approved' AND returned_at IS NULL`,
          [tx.book_id, tx.user_id]
        );

        // Mark this return_request as completed
        await conn.execute(
          `UPDATE transactions SET status = 'completed', type = 'return', returned_at = NOW() WHERE id = ?`,
          [tx.id]
        );

        // Mark book as available
        await conn.execute(
          `UPDATE books SET status = 'available' WHERE id = ?`, [tx.book_id]
        );

        // Recalculate user return rate
        const [rateRows] = await conn.execute(
          `SELECT
             COUNT(*) AS total,
             SUM(CASE WHEN returned_at <= due_date OR due_date IS NULL THEN 1 ELSE 0 END) AS on_time
           FROM transactions
           WHERE user_id = ? AND type = 'return' AND status = 'completed'`,
          [tx.user_id]
        );
        if (rateRows[0].total > 0) {
          const rate = (rateRows[0].on_time / rateRows[0].total) * 100;
          await conn.execute(
            'UPDATE users SET return_rate = ? WHERE id = ?',
            [rate.toFixed(2), tx.user_id]
          );
        }
      } else {
        await conn.rollback();
        return res.status(400).json({ error: 'Transaction type cannot be approved' });
      }

      await conn.commit();
      res.json({ message: 'Transaction approved successfully' });
    } catch (err) {
      await conn.rollback();
      console.error('Approve transaction error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  }
);

// ── POST /api/transactions/:id/decline ────────────────────────────────────────
// Admin: decline a pending request
router.post('/:id/decline', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, status FROM transactions WHERE id = ?', [req.params.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    if (rows[0].status !== 'pending') {
      return res.status(409).json({ error: 'Transaction is not pending' });
    }
    await pool.execute(
      `UPDATE transactions SET status = 'declined' WHERE id = ?`, [req.params.id]
    );
    res.json({ message: 'Transaction declined' });
  } catch (err) {
    console.error('Decline transaction error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

const express = require('express');
const router  = express.Router();
const { body, param } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// GET /api/ratings/book/:bookId — get all ratings + average for a book
router.get('/book/:bookId', authenticate, async (req, res) => {
  try {
    const [[stats]] = await pool.execute(
      `SELECT COUNT(*) AS count, ROUND(AVG(rating), 1) AS average
       FROM book_ratings WHERE book_id = ?`,
      [req.params.bookId]
    );

    // Check if current user has rated this book
    let userRating = null;
    if (req.user.role === 'student') {
      const [rows] = await pool.execute(
        'SELECT rating FROM book_ratings WHERE book_id = ? AND user_id = ?',
        [req.params.bookId, req.user.id]
      );
      if (rows.length > 0) userRating = rows[0].rating;
    }

    res.json({
      bookId:     req.params.bookId,
      count:      stats.count,
      average:    stats.average || null,
      userRating,
    });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/ratings — student: rate a book they've read
router.post('/',
  authenticate,
  authorize('student'),
  [
    body('bookId').notEmpty().withMessage('Book ID required'),
    body('rating').isInt({ min: 1, max: 5 }).withMessage('Rating must be 1-5'),
  ],
  validate,
  async (req, res) => {
    const { bookId, rating } = req.body;
    const userId = req.user.id;

    try {
      // Verify user has actually borrowed this book (in reading history)
      const [histRows] = await pool.execute(
        'SELECT id FROM reading_history WHERE user_id = ? AND book_id = ?',
        [userId, bookId]
      );
      if (histRows.length === 0) {
        return res.status(403).json({ error: 'You can only rate books you have borrowed' });
      }

      // Upsert rating
      await pool.execute(
        `INSERT INTO book_ratings (id, book_id, user_id, rating)
         VALUES (?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE rating = VALUES(rating)`,
        [uuidv4(), bookId, userId, rating]
      );

      // Recalculate and update the book's average rating
      const [[avg]] = await pool.execute(
        'SELECT ROUND(AVG(rating), 1) AS average FROM book_ratings WHERE book_id = ?',
        [bookId]
      );
      if (avg.average !== null) {
        await pool.execute('UPDATE books SET rating = ? WHERE id = ?', [avg.average, bookId]);
      }

      res.json({ message: 'Rating saved', bookId, rating, newAverage: avg.average });
    } catch (err) {
      console.error('Rating error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// DELETE /api/ratings/:bookId — student: remove their rating
router.delete('/:bookId', authenticate, authorize('student'), async (req, res) => {
  try {
    await pool.execute(
      'DELETE FROM book_ratings WHERE book_id = ? AND user_id = ?',
      [req.params.bookId, req.user.id]
    );

    // Recalculate average (or reset to seed value if no ratings left)
    const [[avg]] = await pool.execute(
      'SELECT ROUND(AVG(rating), 1) AS average, COUNT(*) AS count FROM book_ratings WHERE book_id = ?',
      [req.params.bookId]
    );
    if (avg.count > 0) {
      await pool.execute('UPDATE books SET rating = ? WHERE id = ?', [avg.average, req.params.bookId]);
    }

    res.json({ message: 'Rating removed' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

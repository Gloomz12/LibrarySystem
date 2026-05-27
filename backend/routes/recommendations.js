const express = require('express');
const router  = express.Router();
const { query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { getRecommendations, getOverduePredictions } = require('../services/recommendations');

// ── GET /api/recommendations ──────────────────────────────────────────────────
// Returns personalized recommendations for the authenticated user
router.get(
  '/',
  authenticate,
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  validate,
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    const userId = req.user.id;

    try {
      const recommendations = await getRecommendations(userId, limit);
      res.json(recommendations);
    } catch (err) {
      console.error('Recommendations error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/recommendations/user/:userId ─────────────────────────────────────
// Admin: get recommendations for a specific user
router.get(
  '/user/:userId',
  authenticate,
  authorize('admin'),
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  validate,
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;

    try {
      const recommendations = await getRecommendations(req.params.userId, limit);
      res.json(recommendations);
    } catch (err) {
      console.error('Recommendations error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/recommendations/overdue-predictions ──────────────────────────────
// Admin only: AI-powered overdue risk predictions
router.get(
  '/overdue-predictions',
  authenticate,
  authorize('admin'),
  async (req, res) => {
    try {
      const predictions = await getOverduePredictions();
      res.json(predictions);
    } catch (err) {
      console.error('Overdue predictions error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/recommendations/similar/:bookId ──────────────────────────────────
// Returns books similar to a given book (for BookDetails page)
router.get('/similar/:bookId', authenticate, async (req, res) => {
  const pool = require('../db/connection');
  const limit = parseInt(req.query.limit) || 4;

  try {
    // Get the source book's genres and tags
    const [genreRows] = await pool.execute(
      `SELECT g.name FROM genres g
       JOIN book_genres bg ON bg.genre_id = g.id
       WHERE bg.book_id = ?`,
      [req.params.bookId]
    );
    const [tagRows] = await pool.execute(
      `SELECT t.name FROM tags t
       JOIN book_tags bt ON bt.tag_id = t.id
       WHERE bt.book_id = ?`,
      [req.params.bookId]
    );

    const genres = genreRows.map(r => r.name);
    const tags   = tagRows.map(r => r.name);

    if (genres.length === 0 && tags.length === 0) {
      return res.json([]);
    }

    // Build score expression safely — only include genre/tag sub-queries if data exists
    const genrePlaceholders = genres.length > 0 ? genres.map(() => '?').join(',') : null;
    const tagPlaceholders   = tags.length   > 0 ? tags.map(() => '?').join(',')   : null;

    const genreScore = genrePlaceholders
      ? `(SELECT COUNT(*) FROM book_genres bg2 JOIN genres g2 ON g2.id = bg2.genre_id WHERE bg2.book_id = b.id AND g2.name IN (${genrePlaceholders})) * 2`
      : '0';
    const tagScore = tagPlaceholders
      ? `(SELECT COUNT(*) FROM book_tags bt2 JOIN tags t2 ON t2.id = bt2.tag_id WHERE bt2.book_id = b.id AND t2.name IN (${tagPlaceholders}))`
      : '0';

    const sqlQuery = `
      SELECT DISTINCT b.id, b.code, b.title, b.author, b.rating, b.bg_banner, b.status,
        (${genreScore} + ${tagScore}) AS similarity_score
      FROM books b
      WHERE b.id != ?
      HAVING similarity_score > 0
      ORDER BY similarity_score DESC, b.rating DESC
      LIMIT ?
    `;

    const params = [
      ...(genres.length > 0 ? genres : []),
      ...(tags.length   > 0 ? tags   : []),
      req.params.bookId,
      limit,
    ];
    const [similar] = await pool.execute(sqlQuery, params);

    // Enrich with genres
    const enriched = await Promise.all(similar.map(async (book) => {
      const [bg] = await pool.execute(
        `SELECT g.name FROM genres g JOIN book_genres bg ON bg.genre_id = g.id WHERE bg.book_id = ?`,
        [book.id]
      );
      return { ...book, genres: bg.map(r => r.name) };
    }));

    res.json(enriched);
  } catch (err) {
    console.error('Similar books error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

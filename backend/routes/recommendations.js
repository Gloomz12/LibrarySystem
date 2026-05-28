const express = require('express');
const router  = express.Router();
const { query } = require('express-validator');
const { authenticate, authorize } = require('../middleware/auth');
const validate = require('../middleware/validate');
const {
  getRecommendations,
  getOverduePredictions,
  getSimilarBooks,
} = require('../services/aiEngine');

// GET /api/recommendations — personalized for authenticated user
router.get('/',
  authenticate,
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  validate,
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    try {
      const recs = await getRecommendations(req.user.id, limit);
      res.json(recs);
    } catch (err) {
      console.error('Recommendations error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/recommendations/user/:userId — admin: recs for a specific user
router.get('/user/:userId',
  authenticate,
  authorize('admin'),
  [query('limit').optional().isInt({ min: 1, max: 20 })],
  validate,
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 6;
    try {
      const recs = await getRecommendations(req.params.userId, limit);
      res.json(recs);
    } catch (err) {
      console.error('Recommendations error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// GET /api/recommendations/overdue-predictions — admin: risk predictions
router.get('/overdue-predictions',
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

// GET /api/recommendations/similar/:bookId — books similar to a given book
router.get('/similar/:bookId',
  authenticate,
  async (req, res) => {
    const limit = parseInt(req.query.limit) || 4;
    try {
      const similar = await getSimilarBooks(req.params.bookId, limit);
      res.json(similar);
    } catch (err) {
      console.error('Similar books error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;

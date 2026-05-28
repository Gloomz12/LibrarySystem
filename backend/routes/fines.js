const express = require('express');
const router  = express.Router();
const { body } = require('express-validator');
const pool     = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');
const { getFineConfig, calculateFine, recalculateActiveFines } = require('../services/fines');

// GET /api/fines/config — get current fine settings (all authenticated)
router.get('/config', authenticate, async (req, res) => {
  try {
    const config = await getFineConfig();
    res.json(config);
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// PUT /api/fines/config — admin: update fine settings
router.put('/config',
  authenticate,
  authorize('admin'),
  [
    body('ratePerDay').isFloat({ min: 0 }).withMessage('Rate must be a positive number'),
    body('gracePeriod').isInt({ min: 0, max: 30 }).withMessage('Grace period must be 0-30 days'),
    body('maxFine').isFloat({ min: 0 }).withMessage('Max fine must be a positive number'),
    body('currencySymbol').optional().trim().isLength({ max: 5 }),
  ],
  validate,
  async (req, res) => {
    const { ratePerDay, gracePeriod, maxFine, currencySymbol } = req.body;
    try {
      await pool.execute(
        `UPDATE fine_config SET rate_per_day=?, grace_period=?, max_fine=?, currency_symbol=? WHERE id=1`,
        [ratePerDay, gracePeriod, maxFine, currencySymbol || '₱']
      );
      const config = await getFineConfig();
      res.json(config);
    } catch (err) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// POST /api/fines/recalculate — admin: recalculate fines for all overdue active loans
router.post('/recalculate', authenticate, authorize('admin'), async (req, res) => {
  try {
    const count = await recalculateActiveFines();
    res.json({ message: `Recalculated fines for ${count} overdue loan(s)` });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /api/fines/waive/:userId — admin: waive all fines for a user
router.post('/waive/:userId', authenticate, authorize('admin'), async (req, res) => {
  try {
    await pool.execute('UPDATE users SET fines = 0.00 WHERE id = ?', [req.params.userId]);
    res.json({ message: 'Fines waived successfully' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /api/fines/preview — preview fine for a given due date (admin)
router.get('/preview', authenticate, authorize('admin'), async (req, res) => {
  const { dueDate, returnDate } = req.query;
  if (!dueDate) return res.status(400).json({ error: 'dueDate required' });
  try {
    const fine = await calculateFine(dueDate, returnDate || null);
    const config = await getFineConfig();
    res.json({ fine, currency: config.currency_symbol, dueDate, returnDate: returnDate || 'today' });
  } catch (err) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

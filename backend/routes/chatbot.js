const express  = require('express');
const router   = express.Router();
const { body } = require('express-validator');
const { authenticate } = require('../middleware/auth');
const validate = require('../middleware/validate');
const { processMessage } = require('../services/chatbot');
const rateLimit = require('express-rate-limit');

// Stricter rate limit for chat — 60 messages per minute per user
const chatLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 60,
  keyGenerator: (req) => req.user?.id || req.ip,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many messages. Please slow down.' },
});

// POST /api/chat
router.post('/',
  authenticate,
  chatLimiter,
  [body('message').notEmpty().trim().isLength({ max: 500 }).withMessage('Message must be 1-500 characters')],
  validate,
  async (req, res) => {
    try {
      const response = await processMessage(req.body.message, req.user);
      res.json({
        ...response,
        timestamp: new Date().toISOString(),
      });
    } catch (err) {
      console.error('Chat error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

module.exports = router;

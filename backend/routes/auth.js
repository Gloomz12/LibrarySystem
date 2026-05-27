const express = require('express');
const router  = express.Router();
const bcrypt  = require('bcryptjs');
const jwt     = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { body } = require('express-validator');
const pool    = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate } = require('../middleware/auth');

// ── helpers ──────────────────────────────────────────────────────────────────

function signAccessToken(user) {
  return jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.JWT_ACCESS_EXPIRES || '15m' }
  );
}

function signRefreshToken(user) {
  return jwt.sign(
    { id: user.id },
    process.env.JWT_REFRESH_SECRET,
    { expiresIn: process.env.JWT_REFRESH_EXPIRES || '7d' }
  );
}

async function storeRefreshToken(userId, rawToken) {
  const hash = await bcrypt.hash(rawToken, 10);
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days
  await pool.execute(
    'INSERT INTO refresh_tokens (id, user_id, token_hash, expires_at) VALUES (?, ?, ?, ?)',
    [uuidv4(), userId, hash, expiresAt]
  );
}

// ── POST /api/auth/register ───────────────────────────────────────────────────
// Public: self-registration for students only
router.post(
  '/register',
  [
    body('name').notEmpty().trim().withMessage('Full name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email is required'),
    body('password')
      .isLength({ min: 8 }).withMessage('Password must be at least 8 characters')
      .matches(/[A-Z]/).withMessage('Password must contain at least one uppercase letter')
      .matches(/[0-9]/).withMessage('Password must contain at least one number'),
    body('studentId').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { name, email, password, studentId } = req.body;

    try {
      // Check email not already taken
      const [existing] = await pool.execute(
        'SELECT id FROM users WHERE email = ?', [email]
      );
      if (existing.length > 0) {
        return res.status(409).json({ error: 'An account with this email already exists' });
      }

      // Check studentId not already taken (if provided)
      if (studentId) {
        const [existingSid] = await pool.execute(
          'SELECT id FROM users WHERE student_id = ?', [studentId]
        );
        if (existingSid.length > 0) {
          return res.status(409).json({ error: 'This student ID is already registered' });
        }
      }

      const passwordHash = await bcrypt.hash(password, 12);
      const userId = uuidv4();

      await pool.execute(
        `INSERT INTO users (id, student_id, name, email, password_hash, role)
         VALUES (?, ?, ?, ?, ?, 'student')`,
        [userId, studentId || null, name, email, passwordHash]
      );

      // Auto-login after registration
      const [newUser] = await pool.execute(
        'SELECT id, name, email, role, student_id, fines, return_rate, is_active FROM users WHERE id = ?',
        [userId]
      );

      const accessToken  = signAccessToken(newUser[0]);
      const refreshToken = signRefreshToken(newUser[0]);
      await storeRefreshToken(userId, refreshToken);

      res.status(201).json({
        accessToken,
        refreshToken,
        user: newUser[0],
      });
    } catch (err) {
      console.error('Register error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── POST /api/auth/login ──────────────────────────────────────────────────────
router.post(
  '/login',
  [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password required'),
  ],
  validate,
  async (req, res) => {
    const { email, password } = req.body;

    try {
      const [rows] = await pool.execute(
        'SELECT id, name, email, password_hash, role, student_id, fines, return_rate, is_active FROM users WHERE email = ?',
        [email]
      );

      if (rows.length === 0) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const user = rows[0];

      if (!user.is_active) {
        return res.status(403).json({ error: 'Account is deactivated' });
      }

      const passwordMatch = await bcrypt.compare(password, user.password_hash);
      if (!passwordMatch) {
        return res.status(401).json({ error: 'Invalid email or password' });
      }

      const accessToken  = signAccessToken(user);
      const refreshToken = signRefreshToken(user);
      await storeRefreshToken(user.id, refreshToken);

      // Never send password_hash to client
      const { password_hash, ...safeUser } = user;

      res.json({
        accessToken,
        refreshToken,
        user: safeUser,
      });
    } catch (err) {
      console.error('Login error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── POST /api/auth/refresh ────────────────────────────────────────────────────
router.post('/refresh', async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    return res.status(401).json({ error: 'Refresh token required' });
  }

  try {
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET);

    // Find stored tokens for this user
    const [rows] = await pool.execute(
      'SELECT id, token_hash FROM refresh_tokens WHERE user_id = ? AND expires_at > NOW()',
      [decoded.id]
    );

    // Check if any stored token matches
    let matchedTokenId = null;
    for (const row of rows) {
      const match = await bcrypt.compare(refreshToken, row.token_hash);
      if (match) { matchedTokenId = row.id; break; }
    }

    if (!matchedTokenId) {
      return res.status(401).json({ error: 'Invalid or expired refresh token' });
    }

    // Rotate: delete old, issue new
    await pool.execute('DELETE FROM refresh_tokens WHERE id = ?', [matchedTokenId]);

    const [userRows] = await pool.execute(
      'SELECT id, name, role FROM users WHERE id = ?',
      [decoded.id]
    );
    if (userRows.length === 0) {
      return res.status(401).json({ error: 'User not found' });
    }

    const user = userRows[0];
    const newAccessToken  = signAccessToken(user);
    const newRefreshToken = signRefreshToken(user);
    await storeRefreshToken(user.id, newRefreshToken);

    res.json({ accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (err) {
    return res.status(401).json({ error: 'Invalid refresh token' });
  }
});

// ── POST /api/auth/logout ─────────────────────────────────────────────────────
router.post('/logout', authenticate, async (req, res) => {
  const { refreshToken } = req.body;

  try {
    if (refreshToken) {
      // Find and delete the matching refresh token
      const [rows] = await pool.execute(
        'SELECT id, token_hash FROM refresh_tokens WHERE user_id = ?',
        [req.user.id]
      );
      for (const row of rows) {
        const match = await bcrypt.compare(refreshToken, row.token_hash);
        if (match) {
          await pool.execute('DELETE FROM refresh_tokens WHERE id = ?', [row.id]);
          break;
        }
      }
    }
    res.json({ message: 'Logged out successfully' });
  } catch (err) {
    console.error('Logout error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/auth/me ──────────────────────────────────────────────────────────
router.get('/me', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      'SELECT id, student_id, name, email, role, return_rate, fines, created_at FROM users WHERE id = ?',
      [req.user.id]
    );
    if (rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    res.json(rows[0]);
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

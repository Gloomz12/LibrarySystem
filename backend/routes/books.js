const express = require('express');
const router  = express.Router();
const { body, query, param } = require('express-validator');
const { v4: uuidv4 } = require('uuid');
const pool     = require('../db/connection');
const validate = require('../middleware/validate');
const { authenticate, authorize } = require('../middleware/auth');

// ── helpers ───────────────────────────────────────────────────────────────────

async function enrichBook(book, conn) {
  const db = conn || pool;
  const [genres] = await db.execute(
    `SELECT g.name FROM genres g
     JOIN book_genres bg ON bg.genre_id = g.id
     WHERE bg.book_id = ?`,
    [book.id]
  );
  const [tags] = await db.execute(
    `SELECT t.name FROM tags t
     JOIN book_tags bt ON bt.tag_id = t.id
     WHERE bt.book_id = ?`,
    [book.id]
  );
  return {
    ...book,
    genres: genres.map(g => g.name),
    tags:   tags.map(t => t.name),
  };
}

async function enrichBooks(books) {
  return Promise.all(books.map(b => enrichBook(b)));
}

// ── GET /api/books ────────────────────────────────────────────────────────────
router.get(
  '/',
  authenticate,
  [
    query('search').optional().trim(),
    query('genre').optional().trim(),
    query('status').optional().isIn(['available','borrowed']),
    query('sort').optional().isIn(['title','author','rating','year']),
    query('page').optional().isInt({ min: 1 }),
    query('limit').optional().isInt({ min: 1, max: 100 }),
  ],
  validate,
  async (req, res) => {
    const { search, genre, status, sort = 'title', page = 1, limit = 50 } = req.query;
    const offset = (parseInt(page) - 1) * parseInt(limit);

    try {
      let whereClauses = [];
      let params = [];

      if (search) {
        whereClauses.push('(b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?)');
        const like = `%${search}%`;
        params.push(like, like, like);
      }
      if (status) {
        whereClauses.push('b.status = ?');
        params.push(status);
      }
      if (genre) {
        whereClauses.push('EXISTS (SELECT 1 FROM book_genres bg JOIN genres g ON g.id = bg.genre_id WHERE bg.book_id = b.id AND g.name = ?)');
        params.push(genre);
      }

      const where = whereClauses.length ? 'WHERE ' + whereClauses.join(' AND ') : '';

      const orderMap = {
        title:  'b.title ASC',
        author: 'b.author ASC',
        rating: 'b.rating DESC',
        year:   'b.year DESC',
      };
      const orderBy = orderMap[sort] || 'b.title ASC';

      const [countRows] = await pool.execute(
        `SELECT COUNT(*) AS total FROM books b ${where}`,
        params
      );
      const total = countRows[0].total;

      const [books] = await pool.execute(
        `SELECT b.id, b.code, b.title, b.author, b.isbn, b.year, b.pages,
                b.rating, b.bg_banner, b.status, b.description,
                b.author_bio, b.author_meta
         FROM books b
         ${where}
         ORDER BY ${orderBy}
         LIMIT ? OFFSET ?`,
        [...params, parseInt(limit), offset]
      );

      const enriched = await enrichBooks(books);

      res.json({
        books: enriched,
        pagination: {
          total,
          page:  parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      });
    } catch (err) {
      console.error('Get books error:', err);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ── GET /api/books/genres ─────────────────────────────────────────────────────
router.get('/genres', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT g.name, COUNT(bg.book_id) AS count
       FROM genres g
       LEFT JOIN book_genres bg ON bg.genre_id = g.id
       GROUP BY g.id, g.name
       ORDER BY count DESC, g.name ASC`
    );
    res.json(rows);
  } catch (err) {
    console.error('Get genres error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── GET /api/books/:id ────────────────────────────────────────────────────────
router.get('/:id', authenticate, async (req, res) => {
  try {
    const [rows] = await pool.execute(
      `SELECT b.id, b.code, b.title, b.author, b.isbn, b.year, b.pages,
              b.rating, b.bg_banner, b.status, b.description,
              b.author_bio, b.author_meta, b.created_at
       FROM books b WHERE b.id = ?`,
      [req.params.id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }

    const book = await enrichBook(rows[0]);

    // If borrowed, attach current borrower info
    if (book.status === 'borrowed') {
      const [loanRows] = await pool.execute(
        `SELECT u.name AS borrower_name, u.student_id AS borrower_student_id,
                t.due_date, t.id AS transaction_id
         FROM transactions t
         JOIN users u ON u.id = t.user_id
         WHERE t.book_id = ? AND t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL
         LIMIT 1`,
        [book.id]
      );
      if (loanRows.length > 0) {
        book.currentBorrower     = loanRows[0].borrower_name;
        book.borrowerStudentId   = loanRows[0].borrower_student_id;
        book.dueDate             = loanRows[0].due_date;
        book.activeTransactionId = loanRows[0].transaction_id;
      }
    }

    // Check if current user has a pending request for this book
    if (req.user.role === 'student') {
      const [pendingRows] = await pool.execute(
        `SELECT id, type FROM transactions
         WHERE book_id = ? AND user_id = ? AND status = 'pending'
         LIMIT 1`,
        [book.id, req.user.id]
      );
      book.userPendingRequest = pendingRows.length > 0 ? pendingRows[0] : null;
    }

    res.json(book);
  } catch (err) {
    console.error('Get book error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ── POST /api/books ───────────────────────────────────────────────────────────
router.post(
  '/',
  authenticate,
  authorize('admin'),
  [
    body('title').notEmpty().trim().withMessage('Title required'),
    body('author').notEmpty().trim().withMessage('Author required'),
    body('isbn').optional().trim(),
    body('year').optional().isInt({ min: 1000, max: 2100 }),
    body('pages').optional().isInt({ min: 1 }),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('description').optional().trim(),
    body('bgBanner').optional().matches(/^#[0-9A-Fa-f]{6}$/).withMessage('Invalid hex color'),
    body('genres').optional().isArray(),
    body('tags').optional().isArray(),
    body('code').optional().trim(),
    body('authorBio').optional().trim(),
    body('authorMeta').optional().trim(),
  ],
  validate,
  async (req, res) => {
    const { title, author, isbn, year, pages, rating, description, bgBanner,
            genres = [], tags = [], code, authorBio, authorMeta } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const bookId = uuidv4();
      const bookCode = code || title.substring(0, 2).toUpperCase();

      await conn.execute(
        `INSERT INTO books (id, code, title, author, isbn, year, pages, rating,
                            description, author_bio, author_meta, bg_banner)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [bookId, bookCode, title, author, isbn || null, year || null, pages || null,
         rating || 0, description || null, authorBio || null, authorMeta || null,
         bgBanner || '#44403C']
      );

      // Insert genres
      for (const genreName of genres) {
        const [gRows] = await conn.execute(
          'SELECT id FROM genres WHERE name = ?', [genreName]
        );
        let genreId;
        if (gRows.length === 0) {
          const [result] = await conn.execute(
            'INSERT INTO genres (name) VALUES (?)', [genreName]
          );
          genreId = result.insertId;
        } else {
          genreId = gRows[0].id;
        }
        await conn.execute(
          'INSERT IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)',
          [bookId, genreId]
        );
      }

      // Insert tags
      for (const tagName of tags) {
        const [tRows] = await conn.execute(
          'SELECT id FROM tags WHERE name = ?', [tagName]
        );
        let tagId;
        if (tRows.length === 0) {
          const [result] = await conn.execute(
            'INSERT INTO tags (name) VALUES (?)', [tagName]
          );
          tagId = result.insertId;
        } else {
          tagId = tRows[0].id;
        }
        await conn.execute(
          'INSERT IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)',
          [bookId, tagId]
        );
      }

      await conn.commit();

      const [newBook] = await pool.execute('SELECT * FROM books WHERE id = ?', [bookId]);
      const enriched = await enrichBook(newBook[0]);
      res.status(201).json(enriched);
    } catch (err) {
      await conn.rollback();
      console.error('Create book error:', err);
      if (err.code === 'ER_DUP_ENTRY') {
        return res.status(409).json({ error: 'ISBN already exists' });
      }
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  }
);

// ── PUT /api/books/:id ────────────────────────────────────────────────────────
router.put(
  '/:id',
  authenticate,
  authorize('admin'),
  [
    body('title').optional().notEmpty().trim(),
    body('author').optional().notEmpty().trim(),
    body('isbn').optional().trim(),
    body('year').optional().isInt({ min: 1000, max: 2100 }),
    body('pages').optional().isInt({ min: 1 }),
    body('rating').optional().isFloat({ min: 0, max: 5 }),
    body('description').optional().trim(),
    body('bgBanner').optional().matches(/^#[0-9A-Fa-f]{6}$/),
    body('genres').optional().isArray(),
    body('tags').optional().isArray(),
  ],
  validate,
  async (req, res) => {
    const { id } = req.params;
    const { title, author, isbn, year, pages, rating, description,
            bgBanner, genres, tags, code, authorBio, authorMeta } = req.body;

    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();

      const [existing] = await conn.execute('SELECT id FROM books WHERE id = ?', [id]);
      if (existing.length === 0) {
        await conn.rollback();
        return res.status(404).json({ error: 'Book not found' });
      }

      // Build dynamic update
      const updates = [];
      const values  = [];
      if (title       !== undefined) { updates.push('title = ?');       values.push(title); }
      if (author      !== undefined) { updates.push('author = ?');      values.push(author); }
      if (isbn        !== undefined) { updates.push('isbn = ?');        values.push(isbn); }
      if (year        !== undefined) { updates.push('year = ?');        values.push(year); }
      if (pages       !== undefined) { updates.push('pages = ?');       values.push(pages); }
      if (rating      !== undefined) { updates.push('rating = ?');      values.push(rating); }
      if (description !== undefined) { updates.push('description = ?'); values.push(description); }
      if (bgBanner    !== undefined) { updates.push('bg_banner = ?');   values.push(bgBanner); }
      if (code        !== undefined) { updates.push('code = ?');        values.push(code); }
      if (authorBio   !== undefined) { updates.push('author_bio = ?');  values.push(authorBio); }
      if (authorMeta  !== undefined) { updates.push('author_meta = ?'); values.push(authorMeta); }

      if (updates.length > 0) {
        await conn.execute(
          `UPDATE books SET ${updates.join(', ')} WHERE id = ?`,
          [...values, id]
        );
      }

      // Replace genres if provided
      if (genres !== undefined) {
        await conn.execute('DELETE FROM book_genres WHERE book_id = ?', [id]);
        for (const genreName of genres) {
          const [gRows] = await conn.execute('SELECT id FROM genres WHERE name = ?', [genreName]);
          let genreId;
          if (gRows.length === 0) {
            const [result] = await conn.execute('INSERT INTO genres (name) VALUES (?)', [genreName]);
            genreId = result.insertId;
          } else {
            genreId = gRows[0].id;
          }
          await conn.execute('INSERT IGNORE INTO book_genres (book_id, genre_id) VALUES (?, ?)', [id, genreId]);
        }
      }

      // Replace tags if provided
      if (tags !== undefined) {
        await conn.execute('DELETE FROM book_tags WHERE book_id = ?', [id]);
        for (const tagName of tags) {
          const [tRows] = await conn.execute('SELECT id FROM tags WHERE name = ?', [tagName]);
          let tagId;
          if (tRows.length === 0) {
            const [result] = await conn.execute('INSERT INTO tags (name) VALUES (?)', [tagName]);
            tagId = result.insertId;
          } else {
            tagId = tRows[0].id;
          }
          await conn.execute('INSERT IGNORE INTO book_tags (book_id, tag_id) VALUES (?, ?)', [id, tagId]);
        }
      }

      await conn.commit();

      const [updated] = await pool.execute('SELECT * FROM books WHERE id = ?', [id]);
      const enriched = await enrichBook(updated[0]);
      res.json(enriched);
    } catch (err) {
      await conn.rollback();
      console.error('Update book error:', err);
      res.status(500).json({ error: 'Internal server error' });
    } finally {
      conn.release();
    }
  }
);

// ── DELETE /api/books/:id ─────────────────────────────────────────────────────
router.delete('/:id', authenticate, authorize('admin'), async (req, res) => {
  try {
    const [rows] = await pool.execute('SELECT id, status FROM books WHERE id = ?', [req.params.id]);
    if (rows.length === 0) {
      return res.status(404).json({ error: 'Book not found' });
    }
    if (rows[0].status === 'borrowed') {
      return res.status(409).json({ error: 'Cannot delete a currently borrowed book' });
    }
    await pool.execute('DELETE FROM books WHERE id = ?', [req.params.id]);
    res.json({ message: 'Book deleted successfully' });
  } catch (err) {
    console.error('Delete book error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

module.exports = router;

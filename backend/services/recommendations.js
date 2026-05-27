/**
 * AI Recommendation Engine
 *
 * Uses content-based filtering with TF-IDF-weighted cosine similarity.
 * No external API required — runs entirely in-process.
 *
 * Algorithm:
 * 1. Build a feature vector for each book from genres + tags
 * 2. Build a user profile vector by averaging the vectors of books they've read
 * 3. Compute cosine similarity between user profile and each candidate book
 * 4. Return top-N books the user hasn't read yet, sorted by similarity score
 */

const pool = require('../db/connection');

// ── Vector utilities ──────────────────────────────────────────────────────────

function dotProduct(a, b) {
  return Object.keys(a).reduce((sum, key) => sum + (a[key] || 0) * (b[key] || 0), 0);
}

function magnitude(v) {
  return Math.sqrt(Object.values(v).reduce((sum, val) => sum + val * val, 0));
}

function cosineSimilarity(a, b) {
  const mag = magnitude(a) * magnitude(b);
  if (mag === 0) return 0;
  return dotProduct(a, b) / mag;
}

/**
 * Build a feature vector for a book.
 * Genres get weight 2.0, tags get weight 1.0.
 */
function buildBookVector(genres, tags) {
  const vector = {};
  for (const g of genres) {
    const key = `genre:${g.toLowerCase()}`;
    vector[key] = (vector[key] || 0) + 2.0;
  }
  for (const t of tags) {
    const key = `tag:${t.toLowerCase()}`;
    vector[key] = (vector[key] || 0) + 1.0;
  }
  return vector;
}

/**
 * Average multiple vectors into a single user profile vector.
 */
function averageVectors(vectors) {
  if (vectors.length === 0) return {};
  const result = {};
  for (const v of vectors) {
    for (const [key, val] of Object.entries(v)) {
      result[key] = (result[key] || 0) + val;
    }
  }
  const n = vectors.length;
  for (const key of Object.keys(result)) {
    result[key] /= n;
  }
  return result;
}

// ── Main recommendation function ──────────────────────────────────────────────

/**
 * Get personalized book recommendations for a user.
 *
 * @param {string} userId
 * @param {number} limit  - max recommendations to return (default 6)
 * @returns {Array}       - array of book objects with similarity score
 */
async function getRecommendations(userId, limit = 6) {
  try {
    // 1. Get user's reading history with genres and tags
    const [historyRows] = await pool.execute(
      `SELECT rh.book_id
       FROM reading_history rh
       WHERE rh.user_id = ?`,
      [userId]
    );

    const readBookIds = new Set(historyRows.map(r => r.book_id));

    // 2. Get all books with their genres and tags
    const [allBooks] = await pool.execute(
      `SELECT b.id, b.code, b.title, b.author, b.rating, b.bg_banner, b.status,
              b.description, b.year, b.pages
       FROM books b`
    );

    const [allGenres] = await pool.execute(
      `SELECT bg.book_id, g.name
       FROM book_genres bg JOIN genres g ON g.id = bg.genre_id`
    );

    const [allTags] = await pool.execute(
      `SELECT bt.book_id, t.name
       FROM book_tags bt JOIN tags t ON t.id = bt.tag_id`
    );

    // Index genres and tags by book_id
    const bookGenres = {};
    const bookTags   = {};
    for (const row of allGenres) {
      if (!bookGenres[row.book_id]) bookGenres[row.book_id] = [];
      bookGenres[row.book_id].push(row.name);
    }
    for (const row of allTags) {
      if (!bookTags[row.book_id]) bookTags[row.book_id] = [];
      bookTags[row.book_id].push(row.name);
    }

    // 3. Build vectors for all books
    const bookVectors = {};
    for (const book of allBooks) {
      bookVectors[book.id] = buildBookVector(
        bookGenres[book.id] || [],
        bookTags[book.id]   || []
      );
    }

    // 4. Build user profile vector from reading history
    let userProfile;
    if (readBookIds.size === 0) {
      // Cold start: recommend highest-rated available books
      return allBooks
        .filter(b => b.status === 'available')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit)
        .map(b => ({
          ...b,
          genres: bookGenres[b.id] || [],
          tags:   bookTags[b.id]   || [],
          score:  b.rating / 5,
          reason: 'Top rated',
        }));
    }

    const readVectors = [...readBookIds]
      .filter(id => bookVectors[id])
      .map(id => bookVectors[id]);
    userProfile = averageVectors(readVectors);

    // 5. Score all unread, available books
    const candidates = allBooks
      .filter(b => !readBookIds.has(b.id) && b.status === 'available')
      .map(b => ({
        ...b,
        genres: bookGenres[b.id] || [],
        tags:   bookTags[b.id]   || [],
        score:  cosineSimilarity(userProfile, bookVectors[b.id] || {}),
      }))
      .sort((a, b) => b.score - a.score);

    // 6. Return top-N with reason label
    return candidates.slice(0, limit).map(b => ({
      ...b,
      reason: b.score > 0.5 ? 'Highly similar to your reads'
            : b.score > 0.2 ? 'Based on your reading history'
            : 'You might enjoy this',
    }));

  } catch (err) {
    console.error('Recommendation engine error:', err);
    return [];
  }
}

/**
 * Get overdue risk predictions for all active loans.
 * Risk score = (1 - returnRate/100) * 0.6 + dueDateProximityFactor * 0.4
 *
 * @returns {Array} sorted by risk score descending
 */
async function getOverduePredictions() {
  try {
    const [loans] = await pool.execute(
      `SELECT t.id AS transaction_id, t.book_id, t.user_id, t.due_date,
              b.title, b.code, b.bg_banner,
              u.name AS borrower_name, u.student_id, u.return_rate,
              DATEDIFF(t.due_date, CURDATE()) AS days_remaining
       FROM transactions t
       JOIN books b ON b.id = t.book_id
       JOIN users u ON u.id = t.user_id
       WHERE t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL
       ORDER BY t.due_date ASC`
    );

    return loans.map(loan => {
      const returnRate = parseFloat(loan.return_rate) || 50;
      const daysLeft   = parseInt(loan.days_remaining);

      // Proximity factor: 1.0 if overdue, scales down as days increase
      let proximityFactor;
      if (daysLeft <= 0)  proximityFactor = 1.0;
      else if (daysLeft <= 3)  proximityFactor = 0.9;
      else if (daysLeft <= 7)  proximityFactor = 0.7;
      else if (daysLeft <= 14) proximityFactor = 0.4;
      else                     proximityFactor = 0.1;

      const historyFactor = 1 - (returnRate / 100);
      const riskScore = Math.round((historyFactor * 0.6 + proximityFactor * 0.4) * 100);

      let riskTier;
      if (riskScore >= 70)      riskTier = 'high risk';
      else if (riskScore >= 40) riskTier = 'medium risk';
      else                      riskTier = 'low risk';

      return {
        ...loan,
        riskScore,
        riskTier,
        isOverdue: daysLeft <= 0,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);
  } catch (err) {
    console.error('Overdue prediction error:', err);
    return [];
  }
}

module.exports = { getRecommendations, getOverduePredictions };

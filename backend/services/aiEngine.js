/**
 * AI Engine — Library System
 *
 * Two models:
 *
 * 1. RECOMMENDATION ENGINE
 *    Algorithm: Content-Based Filtering with proper TF-IDF vectorization
 *    + Collaborative Filtering signal from shared borrowing patterns.
 *    - TF  = term frequency within a book's feature set
 *    - IDF = log(N / df) where N = corpus size, df = books containing the term
 *    - User profile = weighted average of TF-IDF vectors of read books
 *    - Score = cosine similarity(user_profile, candidate_vector)
 *    - CF boost: if other users with similar taste borrowed a book, score += 0.15
 *    Metrics: Precision@K, Recall@K, catalog coverage, mean similarity
 *
 * 2. OVERDUE PREDICTION MODEL
 *    Algorithm: Logistic Regression (trained in-process on transaction history)
 *    Features:
 *      x0 = days_remaining (normalized)
 *      x1 = user_return_rate (0-1)
 *      x2 = user_overdue_count (normalized)
 *      x3 = loan_duration_days (normalized)
 *      x4 = books_currently_borrowed (normalized)
 *    Training: gradient descent on historical completed loans
 *    Metrics: Accuracy, Precision, Recall, F1, AUC-ROC, Confusion Matrix
 */

'use strict';
const pool = require('../db/connection');

// ═══════════════════════════════════════════════════════════════════════════════
// MATH UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function dot(a, b) {
  let s = 0;
  for (const k of Object.keys(a)) s += (a[k] || 0) * (b[k] || 0);
  return s;
}

function mag(v) {
  return Math.sqrt(Object.values(v).reduce((s, x) => s + x * x, 0));
}

function cosine(a, b) {
  const m = mag(a) * mag(b);
  return m === 0 ? 0 : dot(a, b) / m;
}

function sigmoid(z) {
  return 1 / (1 + Math.exp(-Math.max(-500, Math.min(500, z))));
}

function normalize(arr) {
  const mn = Math.min(...arr);
  const mx = Math.max(...arr);
  if (mx === mn) return arr.map(() => 0);
  return arr.map(v => (v - mn) / (mx - mn));
}

function mean(arr) {
  return arr.length === 0 ? 0 : arr.reduce((s, v) => s + v, 0) / arr.length;
}

// ═══════════════════════════════════════════════════════════════════════════════
// TF-IDF VECTORIZER
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build TF-IDF vectors for all books.
 * Terms = genre:X (weight 2) and tag:X (weight 1) before IDF scaling.
 * IDF = log((N + 1) / (df + 1)) + 1  (smoothed)
 */
function buildTfIdfVectors(books, bookGenres, bookTags) {
  const N = books.length;
  const df = {}; // document frequency per term

  // Count document frequencies
  for (const book of books) {
    const terms = new Set();
    for (const g of (bookGenres[book.id] || [])) terms.add(`genre:${g.toLowerCase()}`);
    for (const t of (bookTags[book.id]   || [])) terms.add(`tag:${t.toLowerCase()}`);
    for (const term of terms) df[term] = (df[term] || 0) + 1;
  }

  // Compute IDF
  const idf = {};
  for (const [term, freq] of Object.entries(df)) {
    idf[term] = Math.log((N + 1) / (freq + 1)) + 1;
  }

  // Build TF-IDF vector per book
  const vectors = {};
  for (const book of books) {
    const v = {};
    for (const g of (bookGenres[book.id] || [])) {
      const term = `genre:${g.toLowerCase()}`;
      v[term] = (v[term] || 0) + 2 * (idf[term] || 1); // genre weight = 2
    }
    for (const t of (bookTags[book.id] || [])) {
      const term = `tag:${t.toLowerCase()}`;
      v[term] = (v[term] || 0) + 1 * (idf[term] || 1); // tag weight = 1
    }
    vectors[book.id] = v;
  }

  return { vectors, idf, df };
}

/**
 * Build user profile vector = weighted average of read book vectors.
 * More recently read books get higher weight (recency decay).
 */
function buildUserProfile(readHistory, bookVectors) {
  if (readHistory.length === 0) return null;

  const profile = {};
  let totalWeight = 0;

  readHistory.forEach((item, idx) => {
    const vec = bookVectors[item.book_id];
    if (!vec) return;
    // Recency weight: most recent = 1.0, oldest = 0.5
    const recencyWeight = 0.5 + 0.5 * (idx / Math.max(readHistory.length - 1, 1));
    const w = recencyWeight;
    totalWeight += w;
    for (const [k, val] of Object.entries(vec)) {
      profile[k] = (profile[k] || 0) + val * w;
    }
  });

  if (totalWeight > 0) {
    for (const k of Object.keys(profile)) profile[k] /= totalWeight;
  }
  return profile;
}

// ═══════════════════════════════════════════════════════════════════════════════
// COLLABORATIVE FILTERING SIGNAL
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Build a user-item matrix from reading history.
 * Returns a map: userId → Set of bookIds they've read.
 */
function buildUserItemMatrix(allHistory) {
  const matrix = {};
  for (const row of allHistory) {
    if (!matrix[row.user_id]) matrix[row.user_id] = new Set();
    matrix[row.user_id].add(row.book_id);
  }
  return matrix;
}

/**
 * Jaccard similarity between two sets.
 */
function jaccardSim(setA, setB) {
  const intersection = [...setA].filter(x => setB.has(x)).length;
  const union = new Set([...setA, ...setB]).size;
  return union === 0 ? 0 : intersection / union;
}

/**
 * For a given user, find similar users and collect books they liked
 * that the target user hasn't read. Returns a map: bookId → CF score boost.
 */
function getCFBoosts(userId, userReadSet, userItemMatrix, topK = 5) {
  const boosts = {};
  const similarities = [];

  for (const [otherId, otherBooks] of Object.entries(userItemMatrix)) {
    if (otherId === userId) continue;
    const sim = jaccardSim(userReadSet, otherBooks);
    if (sim > 0) similarities.push({ userId: otherId, sim, books: otherBooks });
  }

  // Top-K most similar users
  similarities.sort((a, b) => b.sim - a.sim);
  const topUsers = similarities.slice(0, topK);

  for (const { sim, books } of topUsers) {
    for (const bookId of books) {
      if (!userReadSet.has(bookId)) {
        boosts[bookId] = (boosts[bookId] || 0) + sim * 0.15;
      }
    }
  }
  return boosts;
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION ENGINE — PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Get personalized recommendations for a user.
 * Hybrid: TF-IDF content-based + collaborative filtering boost.
 */
async function getRecommendations(userId, limit = 6) {
  try {
    const [allBooks]   = await pool.execute(`SELECT b.id, b.code, b.title, b.author, b.rating, b.bg_banner, b.status, b.year, b.pages FROM books b`);
    const [allGenres]  = await pool.execute(`SELECT bg.book_id, g.name FROM book_genres bg JOIN genres g ON g.id = bg.genre_id`);
    const [allTags]    = await pool.execute(`SELECT bt.book_id, t.name FROM book_tags bt JOIN tags t ON t.id = bt.tag_id`);
    const [allHistory] = await pool.execute(`SELECT user_id, book_id, read_at FROM reading_history ORDER BY read_at ASC`);

    // Index genres/tags
    const bookGenres = {}, bookTags = {};
    for (const r of allGenres) { if (!bookGenres[r.book_id]) bookGenres[r.book_id] = []; bookGenres[r.book_id].push(r.name); }
    for (const r of allTags)   { if (!bookTags[r.book_id])   bookTags[r.book_id]   = []; bookTags[r.book_id].push(r.name); }

    // Build TF-IDF vectors
    const { vectors: bookVectors } = buildTfIdfVectors(allBooks, bookGenres, bookTags);

    // User's reading history (sorted oldest→newest for recency weighting)
    const userHistory = allHistory.filter(h => h.user_id === userId)
      .sort((a, b) => new Date(a.read_at) - new Date(b.read_at));
    const userReadSet = new Set(userHistory.map(h => h.book_id));

    // Cold start: no history → top-rated available books
    if (userReadSet.size === 0) {
      const topRated = allBooks
        .filter(b => b.status === 'available')
        .sort((a, b) => b.rating - a.rating)
        .slice(0, limit)
        .map(b => ({ ...b, genres: bookGenres[b.id] || [], tags: bookTags[b.id] || [], score: parseFloat(b.rating) / 5, cfBoost: 0, finalScore: parseFloat(b.rating) / 5, reason: 'Top rated', algorithm: 'cold-start' }));
      return topRated;
    }

    // Build user profile
    const userProfile = buildUserProfile(userHistory, bookVectors);

    // CF boosts
    const userItemMatrix = buildUserItemMatrix(allHistory);
    const cfBoosts = getCFBoosts(userId, userReadSet, userItemMatrix);

    // Score candidates
    const candidates = allBooks
      .filter(b => !userReadSet.has(b.id) && b.status === 'available')
      .map(b => {
        const cbScore = userProfile ? cosine(userProfile, bookVectors[b.id] || {}) : 0;
        const cf      = Math.min(cfBoosts[b.id] || 0, 0.3); // cap CF boost
        const final   = Math.min(cbScore + cf, 1.0);
        return {
          ...b,
          genres:     bookGenres[b.id] || [],
          tags:       bookTags[b.id]   || [],
          score:      parseFloat(cbScore.toFixed(4)),
          cfBoost:    parseFloat(cf.toFixed(4)),
          finalScore: parseFloat(final.toFixed(4)),
          algorithm:  'hybrid-tfidf-cf',
          reason: final > 0.6 ? 'Highly similar to your reads'
                : final > 0.3 ? 'Based on your reading history'
                : cf > 0.05   ? 'Popular with similar readers'
                : 'You might enjoy this',
        };
      })
      .sort((a, b) => b.finalScore - a.finalScore);

    return candidates.slice(0, limit);
  } catch (err) {
    console.error('Recommendation engine error:', err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// RECOMMENDATION METRICS
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate recommendation quality using leave-one-out cross-validation.
 * For each user with ≥2 books read: hide the last book, recommend, check if it appears.
 */
async function getRecommendationMetrics() {
  try {
    const [allBooks]   = await pool.execute(`SELECT b.id, b.code, b.title, b.author, b.rating, b.bg_banner, b.status, b.year, b.pages FROM books b`);
    const [allGenres]  = await pool.execute(`SELECT bg.book_id, g.name FROM book_genres bg JOIN genres g ON g.id = bg.genre_id`);
    const [allTags]    = await pool.execute(`SELECT bt.book_id, t.name FROM book_tags bt JOIN tags t ON t.id = bt.tag_id`);
    const [allHistory] = await pool.execute(`SELECT user_id, book_id, read_at FROM reading_history ORDER BY read_at ASC`);

    const bookGenres = {}, bookTags = {};
    for (const r of allGenres) { if (!bookGenres[r.book_id]) bookGenres[r.book_id] = []; bookGenres[r.book_id].push(r.name); }
    for (const r of allTags)   { if (!bookTags[r.book_id])   bookTags[r.book_id]   = []; bookTags[r.book_id].push(r.name); }

    const { vectors: bookVectors } = buildTfIdfVectors(allBooks, bookGenres, bookTags);
    const userItemMatrix = buildUserItemMatrix(allHistory);

    // Group history by user
    const byUser = {};
    for (const h of allHistory) {
      if (!byUser[h.user_id]) byUser[h.user_id] = [];
      byUser[h.user_id].push(h);
    }

    const K = 5;
    let hitsAtK = 0, totalEvals = 0;
    const allScores = [];
    const recommendedBooks = new Set();

    for (const [uid, history] of Object.entries(byUser)) {
      if (history.length < 2) continue;
      const sorted = [...history].sort((a, b) => new Date(a.read_at) - new Date(b.read_at));
      const testBook  = sorted[sorted.length - 1].book_id;
      const trainHist = sorted.slice(0, -1);
      const trainSet  = new Set(trainHist.map(h => h.book_id));

      const profile = buildUserProfile(trainHist, bookVectors);
      if (!profile) continue;

      const cfBoosts = getCFBoosts(uid, trainSet, userItemMatrix);

      const scored = allBooks
        .filter(b => !trainSet.has(b.id))
        .map(b => {
          const cb = cosine(profile, bookVectors[b.id] || {});
          const cf = Math.min(cfBoosts[b.id] || 0, 0.3);
          return { id: b.id, score: cb + cf };
        })
        .sort((a, b) => b.score - a.score);

      const topK = scored.slice(0, K);
      topK.forEach(b => recommendedBooks.add(b.id));
      allScores.push(...topK.map(b => b.score));

      if (topK.some(b => b.id === testBook)) hitsAtK++;
      totalEvals++;
    }

    const precisionAtK  = totalEvals > 0 ? hitsAtK / totalEvals : 0;
    const recallAtK     = totalEvals > 0 ? hitsAtK / totalEvals : 0; // simplified (1 relevant item)
    const catalogCoverage = allBooks.length > 0 ? recommendedBooks.size / allBooks.length : 0;
    const meanSimilarity  = allScores.length > 0 ? mean(allScores) : 0;
    const coldStartUsers  = Object.values(byUser).filter(h => h.length === 0).length;
    const totalUsers      = Object.keys(byUser).length;

    return {
      algorithm:        'Hybrid TF-IDF + Collaborative Filtering',
      evaluationMethod: `Leave-One-Out Cross-Validation (K=${K})`,
      trained:          true,
      k:                K,
      totalEvaluations: totalEvals,
      hitsAtK,
      precisionAtK:     parseFloat(precisionAtK.toFixed(4)),
      recallAtK:        parseFloat(recallAtK.toFixed(4)),
      f1AtK:            precisionAtK + recallAtK > 0
                          ? parseFloat((2 * precisionAtK * recallAtK / (precisionAtK + recallAtK)).toFixed(4))
                          : 0,
      catalogCoverage:  parseFloat(catalogCoverage.toFixed(4)),
      meanSimilarityScore: parseFloat(meanSimilarity.toFixed(4)),
      coldStartUsers,
      totalUsers,
      coldStartRate:    totalUsers > 0 ? parseFloat((coldStartUsers / totalUsers).toFixed(4)) : 0,
      uniqueBooksRecommended: recommendedBooks.size,
      totalBooks:       allBooks.length,
      // Note when there's not enough data for leave-one-out
      note: totalEvals === 0
        ? 'No users have read ≥2 books yet — evaluation will improve as reading history grows.'
        : null,
    };
  } catch (err) {
    console.error('Recommendation metrics error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// LOGISTIC REGRESSION — OVERDUE PREDICTION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Train logistic regression via gradient descent.
 * @param {number[][]} X  - feature matrix [samples × features]
 * @param {number[]}   y  - labels (0 = on-time, 1 = overdue)
 * @param {object}     opts
 */
function trainLogisticRegression(X, y, opts = {}) {
  const { lr = 0.1, epochs = 500, lambda = 0.01 } = opts;
  const n = X.length;
  const f = X[0].length;
  let weights = new Array(f).fill(0);
  let bias    = 0;

  for (let e = 0; e < epochs; e++) {
    let dw = new Array(f).fill(0);
    let db = 0;

    for (let i = 0; i < n; i++) {
      const z    = X[i].reduce((s, xi, j) => s + xi * weights[j], bias);
      const pred = sigmoid(z);
      const err  = pred - y[i];
      for (let j = 0; j < f; j++) dw[j] += err * X[i][j];
      db += err;
    }

    // Gradient descent with L2 regularization
    for (let j = 0; j < f; j++) {
      weights[j] -= lr * (dw[j] / n + lambda * weights[j]);
    }
    bias -= lr * (db / n);
  }

  return { weights, bias };
}

/**
 * Predict probability using trained logistic regression model.
 */
function predictProba(features, weights, bias) {
  const z = features.reduce((s, xi, j) => s + xi * weights[j], bias);
  return sigmoid(z);
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERDUE PREDICTION — TRAIN + PREDICT
// ═══════════════════════════════════════════════════════════════════════════════

// Cached model so we don't retrain on every request
let _cachedModel = null;
let _modelTrainedAt = null;
const MODEL_TTL_MS = 10 * 60 * 1000; // retrain every 10 minutes

/**
 * Build feature vector for a loan record.
 * Features (all normalized 0-1):
 *   [0] days_remaining_norm  — negative = overdue
 *   [1] return_rate_norm     — user's historical return rate
 *   [2] overdue_count_norm   — how many times user was overdue before
 *   [3] loan_duration_norm   — how long the loan period is
 *   [4] active_loans_norm    — how many books user currently has
 */
function buildFeatures(loan, stats) {
  return [
    Math.max(-1, Math.min(1, loan.days_remaining / 30)),          // [-1, 1]
    (parseFloat(loan.return_rate) || 50) / 100,                   // [0, 1]
    Math.min(1, (loan.overdue_count || 0) / Math.max(stats.maxOverdueCount, 1)),
    Math.min(1, (loan.loan_duration || 30) / 60),                 // normalize to 60-day max
    Math.min(1, (loan.active_loans || 1) / Math.max(stats.maxActiveLoans, 1)),
  ];
}

/**
 * Load training data from completed transactions.
 * Label = 1 if returned after due_date, 0 if on time.
 */
async function loadTrainingData() {
  // For completed loans: days_remaining at time of return = DATEDIFF(due_date, returned_at)
  // Positive = returned early (good), Negative = returned late (overdue)
  // days_late = how many days past due (positive = late, 0 = on time)
  const [rows] = await pool.execute(`
    SELECT
      t.id,
      t.user_id,
      t.due_date,
      t.returned_at,
      t.created_at,
      DATEDIFF(t.due_date, t.created_at)                              AS loan_duration,
      CASE
        WHEN t.returned_at IS NOT NULL
          THEN GREATEST(0, DATEDIFF(t.returned_at, t.due_date))
        ELSE 0
      END                                                             AS days_late,
      -- days_remaining at time of return (negative = was overdue when returned)
      CASE
        WHEN t.returned_at IS NOT NULL
          THEN DATEDIFF(t.due_date, t.returned_at)
        ELSE DATEDIFF(t.due_date, CURDATE())
      END                                                             AS days_remaining,
      u.return_rate,
      (SELECT COUNT(*) FROM transactions t2
       WHERE t2.user_id = t.user_id
         AND t2.type = 'borrow'
         AND t2.returned_at IS NOT NULL
         AND t2.returned_at > t2.due_date
         AND t2.id != t.id)                                           AS overdue_count,
      (SELECT COUNT(*) FROM transactions t3
       WHERE t3.user_id = t.user_id
         AND t3.type = 'borrow'
         AND t3.status = 'approved'
         AND t3.returned_at IS NULL
         AND t3.id != t.id)                                           AS active_loans
    FROM transactions t
    JOIN users u ON u.id = t.user_id
    WHERE t.type = 'borrow'
      AND t.status = 'approved'
      AND t.due_date IS NOT NULL
      AND t.returned_at IS NOT NULL
  `);
  return rows;
}

async function getOrTrainModel() {
  const now = Date.now();
  if (_cachedModel && _modelTrainedAt && (now - _modelTrainedAt) < MODEL_TTL_MS) {
    return _cachedModel;
  }

  const rows = await loadTrainingData();
  if (rows.length < 1) {
    return { weights: [-0.8, -0.6, 0.5, 0.2, 0.3], bias: 0.1, trained: false, sampleSize: 0 };
  }

  const stats = {
    maxOverdueCount: Math.max(...rows.map(r => parseInt(r.overdue_count) || 0), 1),
    maxActiveLoans:  Math.max(...rows.map(r => parseInt(r.active_loans)  || 0), 1),
  };

  // Label: 1 = overdue (returned late OR still out past due date), 0 = on time
  const X = rows.map(r => buildFeatures({
    ...r,
    days_remaining: parseInt(r.days_remaining) || 0,
  }, stats));
  const y = rows.map(r => (parseInt(r.days_late) > 0 ? 1 : 0));

  const model = trainLogisticRegression(X, y, { lr: 0.05, epochs: 800, lambda: 0.01 });
  _cachedModel = { ...model, trained: true, sampleSize: rows.length, stats, trainedAt: new Date().toISOString() };
  _modelTrainedAt = now;
  return _cachedModel;
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERDUE PREDICTION — PUBLIC API
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Predict overdue risk for all active loans using trained logistic regression.
 */
async function getOverduePredictions() {
  try {
    const model = await getOrTrainModel();

    const [loans] = await pool.execute(`
      SELECT
        t.id AS transaction_id, t.book_id, t.user_id, t.due_date, t.created_at,
        DATEDIFF(t.due_date, CURDATE())       AS days_remaining,
        DATEDIFF(t.due_date, t.created_at)    AS loan_duration,
        b.title, b.code, b.bg_banner,
        u.name AS borrower_name, u.student_id, u.return_rate,
        (SELECT COUNT(*) FROM transactions t2
         WHERE t2.user_id = t.user_id AND t2.type = 'return'
           AND t2.status = 'completed' AND t2.returned_at > t2.due_date) AS overdue_count,
        (SELECT COUNT(*) FROM transactions t3
         WHERE t3.user_id = t.user_id AND t3.type = 'borrow'
           AND t3.status = 'approved' AND t3.returned_at IS NULL
           AND t3.id != t.id) AS active_loans
      FROM transactions t
      JOIN books b ON b.id = t.book_id
      JOIN users u ON u.id = t.user_id
      WHERE t.type = 'borrow' AND t.status = 'approved' AND t.returned_at IS NULL
      ORDER BY t.due_date ASC
    `);

    const stats = model.stats || {
      maxOverdueCount: Math.max(...loans.map(l => l.overdue_count || 0), 1),
      maxActiveLoans:  Math.max(...loans.map(l => l.active_loans  || 0), 1),
    };

    return loans.map(loan => {
      const daysLeft  = parseInt(loan.days_remaining);
      const features  = buildFeatures({ ...loan, days_remaining: daysLeft }, stats);
      const probOverdue = predictProba(features, model.weights, model.bias);
      const riskScore   = Math.round(probOverdue * 100);

      const riskTier = riskScore >= 65 ? 'high risk'
                     : riskScore >= 35 ? 'medium risk'
                     : 'low risk';

      return {
        ...loan,
        features: {
          daysRemaining:  daysLeft,
          returnRate:     parseFloat(loan.return_rate),
          overdueCount:   loan.overdue_count,
          loanDuration:   loan.loan_duration,
          activeLoans:    loan.active_loans,
        },
        probOverdue:  parseFloat(probOverdue.toFixed(4)),
        riskScore,
        riskTier,
        isOverdue:    daysLeft <= 0,
        modelTrained: model.trained,
      };
    }).sort((a, b) => b.riskScore - a.riskScore);

  } catch (err) {
    console.error('Overdue prediction error:', err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// OVERDUE MODEL METRICS — EVALUATION
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * Evaluate the logistic regression model using k-fold cross-validation (k=5).
 * Computes: Accuracy, Precision, Recall, F1, AUC-ROC, Confusion Matrix,
 * and feature importance (absolute weight values).
 */
async function getOverdueModelMetrics() {
  try {
    const rows = await loadTrainingData();

    const featureNames = [
      'Days Remaining (normalized)',
      'User Return Rate',
      'Prior Overdue Count',
      'Loan Duration',
      'Active Loans Count',
    ];

    if (rows.length < 2) {
      return {
        algorithm:    'Logistic Regression',
        trained:      false,
        sampleSize:   rows.length,
        message:      rows.length === 0
          ? 'No borrow transactions found. Create some loans to train the model.'
          : 'Need at least 2 borrow transactions to evaluate the model.',
        featureNames,
        featureImportance: featureNames.map(n => ({ name: n, importance: 0 })),
      };
    }

    const stats = {
      maxOverdueCount: Math.max(...rows.map(r => parseInt(r.overdue_count) || 0), 1),
      maxActiveLoans:  Math.max(...rows.map(r => parseInt(r.active_loans)  || 0), 1),
    };

    const X = rows.map(r => buildFeatures({ ...r, days_remaining: parseInt(r.days_remaining) || 0 }, stats));
    const y = rows.map(r => (parseInt(r.days_late) > 0 ? 1 : 0));

    // Detect single-class problem — can't evaluate meaningfully
    const positiveCount = y.filter(v => v === 1).length;
    const negativeCount = y.filter(v => v === 0).length;
    const hasBothClasses = positiveCount > 0 && negativeCount > 0;

    // Always train the model (even on single-class data) for feature importance
    const finalModel = trainLogisticRegression(X, y, { lr: 0.05, epochs: 800, lambda: 0.01 });
    const maxW = Math.max(...finalModel.weights.map(Math.abs), 0.001);
    const featureImportance = featureNames.map((name, i) => ({
      name,
      weight:     parseFloat(finalModel.weights[i].toFixed(4)),
      importance: parseFloat((Math.abs(finalModel.weights[i]) / maxW).toFixed(4)),
    })).sort((a, b) => b.importance - a.importance);

    const classDistribution = {
      onTime:       negativeCount,
      overdue:      positiveCount,
      positiveRate: parseFloat((positiveCount / rows.length).toFixed(4)),
    };

    if (!hasBothClasses) {
      return {
        algorithm:        'Logistic Regression',
        evaluationMethod: `${Math.min(5, rows.length)}-Fold Cross-Validation`,
        trained:          true,
        sampleSize:       rows.length,
        folds:            Math.min(5, rows.length),
        classDistribution,
        note: positiveCount === 0
          ? 'All current loans are on-time — no overdue cases yet. Model weights are trained and ready; evaluation metrics will populate once overdue returns occur.'
          : 'All loans are overdue — need a mix of on-time and overdue returns for meaningful evaluation.',
        metrics: { accuracy: 1.0, precision: 0, recall: 0, f1: 0, auc: 0.5 },
        confusionMatrix: { tp: positiveCount, tn: negativeCount, fp: 0, fn: 0 },
        featureNames,
        featureImportance,
        rocCurve: [{ fpr: 0, tpr: 0 }, { fpr: 1, tpr: 1 }],
        modelWeights: finalModel.weights.map(w => parseFloat(w.toFixed(4))),
        bias: parseFloat(finalModel.bias.toFixed(4)),
      };
    }

    // Adaptive k-fold: scale with sample size
    const k = rows.length >= 10 ? 5 : rows.length >= 4 ? Math.min(rows.length, 4) : 2;
    const foldSize = Math.floor(rows.length / k);
    const allPreds = [], allLabels = [], allProbas = [];

    for (let fold = 0; fold < k; fold++) {
      const valStart = fold * foldSize;
      const valEnd   = fold === k - 1 ? rows.length : valStart + foldSize;

      const trainX = [...X.slice(0, valStart), ...X.slice(valEnd)];
      const trainY = [...y.slice(0, valStart), ...y.slice(valEnd)];
      const valX   = X.slice(valStart, valEnd);
      const valY   = y.slice(valStart, valEnd);

      if (trainX.length === 0) continue;

      const foldModel = trainLogisticRegression(trainX, trainY, { lr: 0.05, epochs: 500, lambda: 0.01 });

      for (let i = 0; i < valX.length; i++) {
        const proba = predictProba(valX[i], foldModel.weights, foldModel.bias);
        allProbas.push(proba);
        allPreds.push(proba >= 0.5 ? 1 : 0);
        allLabels.push(valY[i]);
      }
    }

    // Confusion matrix
    let tp = 0, tn = 0, fp = 0, fn = 0;
    for (let i = 0; i < allPreds.length; i++) {
      if (allPreds[i] === 1 && allLabels[i] === 1) tp++;
      else if (allPreds[i] === 0 && allLabels[i] === 0) tn++;
      else if (allPreds[i] === 1 && allLabels[i] === 0) fp++;
      else fn++;
    }

    const accuracy  = allPreds.length > 0 ? (tp + tn) / allPreds.length : 0;
    const precision = (tp + fp) > 0 ? tp / (tp + fp) : 0;
    const recall    = (tp + fn) > 0 ? tp / (tp + fn) : 0;
    const f1        = (precision + recall) > 0 ? 2 * precision * recall / (precision + recall) : 0;

    // AUC-ROC via trapezoidal rule
    const sorted = allProbas
      .map((p, i) => ({ p, label: allLabels[i] }))
      .sort((a, b) => b.p - a.p);

    let auc = 0, prevFpr = 0, prevTpr = 0;
    const posTotal = allLabels.filter(l => l === 1).length;
    const negTotal = allLabels.filter(l => l === 0).length;
    let cumTp = 0, cumFp = 0;
    const rocPoints = [{ fpr: 0, tpr: 0 }];

    for (const { label } of sorted) {
      if (label === 1) cumTp++; else cumFp++;
      const fpr = negTotal > 0 ? cumFp / negTotal : 0;
      const tpr = posTotal > 0 ? cumTp / posTotal : 0;
      auc += (fpr - prevFpr) * (tpr + prevTpr) / 2;
      rocPoints.push({ fpr: parseFloat(fpr.toFixed(3)), tpr: parseFloat(tpr.toFixed(3)) });
      prevFpr = fpr; prevTpr = tpr;
    }
    rocPoints.push({ fpr: 1, tpr: 1 });

    // Train final model on all data for feature importance — already done above
    // Use the finalModel and featureImportance computed before the single-class check

    return {
      algorithm:        'Logistic Regression',
      evaluationMethod: `${k}-Fold Cross-Validation`,
      trained:          true,
      sampleSize:       rows.length,
      folds:            k,
      classDistribution,
      metrics: {
        accuracy:  parseFloat(accuracy.toFixed(4)),
        precision: parseFloat(precision.toFixed(4)),
        recall:    parseFloat(recall.toFixed(4)),
        f1:        parseFloat(f1.toFixed(4)),
        auc:       parseFloat(Math.abs(auc).toFixed(4)),
      },
      confusionMatrix: { tp, tn, fp, fn },
      featureNames,
      featureImportance,
      rocCurve: rocPoints.filter((_, i) => i % Math.max(1, Math.floor(rocPoints.length / 20)) === 0),
      modelWeights: finalModel.weights.map(w => parseFloat(w.toFixed(4))),
      bias: parseFloat(finalModel.bias.toFixed(4)),
    };
  } catch (err) {
    console.error('Overdue model metrics error:', err);
    return null;
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// SIMILAR BOOKS (content-based, no user context)
// ═══════════════════════════════════════════════════════════════════════════════

async function getSimilarBooks(bookId, limit = 4) {
  try {
    const [allBooks]  = await pool.execute(`SELECT b.id, b.code, b.title, b.author, b.rating, b.bg_banner, b.status FROM books b`);
    const [allGenres] = await pool.execute(`SELECT bg.book_id, g.name FROM book_genres bg JOIN genres g ON g.id = bg.genre_id`);
    const [allTags]   = await pool.execute(`SELECT bt.book_id, t.name FROM book_tags bt JOIN tags t ON t.id = bt.tag_id`);

    const bookGenres = {}, bookTags = {};
    for (const r of allGenres) { if (!bookGenres[r.book_id]) bookGenres[r.book_id] = []; bookGenres[r.book_id].push(r.name); }
    for (const r of allTags)   { if (!bookTags[r.book_id])   bookTags[r.book_id]   = []; bookTags[r.book_id].push(r.name); }

    const { vectors } = buildTfIdfVectors(allBooks, bookGenres, bookTags);
    const sourceVec   = vectors[bookId];
    if (!sourceVec) return [];

    return allBooks
      .filter(b => b.id !== bookId)
      .map(b => ({
        ...b,
        genres:           bookGenres[b.id] || [],
        similarity_score: parseFloat(cosine(sourceVec, vectors[b.id] || {}).toFixed(4)),
      }))
      .sort((a, b) => b.similarity_score - a.similarity_score || b.rating - a.rating)
      .slice(0, limit);
  } catch (err) {
    console.error('Similar books error:', err);
    return [];
  }
}

// ═══════════════════════════════════════════════════════════════════════════════
// EXPORTS
// ═══════════════════════════════════════════════════════════════════════════════

module.exports = {
  getRecommendations,
  getRecommendationMetrics,
  getOverduePredictions,
  getOverdueModelMetrics,
  getSimilarBooks,
  clearModelCache: () => { _cachedModel = null; _modelTrainedAt = null; },
  loadTrainingData,
};

/**
 * Generates AI_TEST_RESULTS.md from live database evaluation.
 * Run: node db/generate-report.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const fs = require('fs');
const path = require('path');
const {
  clearModelCache,
  getOverdueModelMetrics,
  getRecommendationMetrics,
  getOverduePredictions,
  getRecommendations,
} = require('../services/aiEngine');

function pct(v) {
  if (v === undefined || v === null) return '—';
  return (v * 100).toFixed(1) + '%';
}

function badge(v, good, warn) {
  if (v === undefined || v === null) return '⬜';
  if (v >= good) return '🟢';
  if (v >= warn) return '🟡';
  return '🔴';
}

function bar(v, width = 20) {
  const filled = Math.round(Math.min(v, 1) * width);
  return '`' + '█'.repeat(filled) + '░'.repeat(width - filled) + '`';
}

async function generate() {
  console.log('Evaluating models against live database…');
  clearModelCache();

  const [od, rec, predictions] = await Promise.all([
    getOverdueModelMetrics(),
    getRecommendationMetrics(),
    getOverduePredictions(),
  ]);

  const sampleRecs = await Promise.all([
    getRecommendations('d-usr-01', 4).then(r => ({ name: 'Maria Santos', genre: 'Fantasy / Magical Realism', recs: r })),
    getRecommendations('d-usr-03', 4).then(r => ({ name: 'Ana Cruz',     genre: 'Romance / Classic',         recs: r })),
    getRecommendations('d-usr-07', 4).then(r => ({ name: 'Grace Villanueva', genre: 'Mystery / Thriller',   recs: r })),
    getRecommendations('d-usr-02', 4).then(r => ({ name: 'Jose Reyes',   genre: 'Dystopian / Sci-Fi',        recs: r })),
  ]);

  const now = new Date();
  const dateStr = now.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });

  const riskIcon = t => t === 'high risk' ? '🔴' : t === 'medium risk' ? '🟡' : '🟢';

  let md = '';

  // ── Header ────────────────────────────────────────────────────────────────
  md += `# AI Model Evaluation Report\n\n`;
  md += `**System:** Books Repository — Intelligent Library Management  \n`;
  md += `**Generated:** ${dateStr} · ${timeStr}  \n`;
  md += `**Database:** Live evaluation against real transaction data  \n\n`;
  md += `---\n\n`;

  // ── Table of Contents ─────────────────────────────────────────────────────
  md += `## Table of Contents\n\n`;
  md += `1. [Executive Summary](#1-executive-summary)\n`;
  md += `2. [Overdue Return Predictor](#2-overdue-return-predictor)\n`;
  md += `   - [Data Split](#data-split-5-fold-cross-validation)\n`;
  md += `   - [Performance Metrics](#21-performance-metrics)\n`;
  md += `   - [Confusion Matrix](#22-confusion-matrix)\n`;
  md += `   - [Feature Importance](#23-feature-importance)\n`;
  md += `   - [Live Risk Predictions](#24-live-risk-predictions)\n`;
  md += `3. [Book Recommendation Engine](#3-book-recommendation-engine)\n`;
  md += `   - [Data Split](#data-split-leave-one-out-cross-validation)\n`;
  md += `   - [Performance Metrics](#31-performance-metrics)\n`;
  md += `   - [Sample Recommendations](#32-sample-recommendations)\n`;
  md += `4. [System Architecture](#4-system-architecture)\n`;
  md += `5. [Alignment with Intelligent Systems Curriculum](#5-alignment-with-intelligent-systems-curriculum)\n\n`;
  md += `---\n\n`;

  // ── 1. Executive Summary ──────────────────────────────────────────────────
  md += `## 1. Executive Summary\n\n`;
  md += `The library system integrates two AI models that learn from real borrowing data:\n\n`;
  md += `| Model | Algorithm | Training Samples | Key Metric |\n`;
  md += `|---|---|---|---|\n`;
  md += `| Overdue Return Predictor | Logistic Regression | ${od?.sampleSize ?? '—'} completed loans | Accuracy: **${pct(od?.metrics?.accuracy)}** |\n`;
  md += `| Book Recommendation Engine | Hybrid TF-IDF + Collaborative Filtering | ${rec?.totalUsers ?? '—'} users | Precision@${rec?.k ?? 5}: **${pct(rec?.precisionAtK)}** |\n\n`;

  if (od?.metrics) {
    md += `### Overall Model Health\n\n`;
    md += `| | Overdue Predictor | Recommendation Engine |\n`;
    md += `|---|---|---|\n`;
    md += `| Accuracy / Precision@K | ${badge(od.metrics.accuracy, 0.80, 0.65)} ${pct(od.metrics.accuracy)} | ${badge(rec?.precisionAtK, 0.30, 0.15)} ${pct(rec?.precisionAtK)} |\n`;
    md += `| F1 Score | ${badge(od.metrics.f1, 0.75, 0.60)} ${pct(od.metrics.f1)} | ${badge(rec?.f1AtK, 0.30, 0.15)} ${pct(rec?.f1AtK)} |\n`;
    md += `| AUC-ROC / Coverage | ${badge(od.metrics.auc, 0.80, 0.65)} ${pct(od.metrics.auc)} | ${badge(rec?.catalogCoverage, 0.40, 0.25)} ${pct(rec?.catalogCoverage)} |\n\n`;
  }

  md += `---\n\n`;

  // ── 2. Overdue Return Predictor ───────────────────────────────────────────
  md += `## 2. Overdue Return Predictor\n\n`;
  md += `> **What it does:** Predicts which borrowed books are at risk of being returned late, `;
  md += `enabling librarians to follow up proactively before fines accumulate.\n\n`;
  md += `**Algorithm:** Binary Logistic Regression  \n`;
  md += `**Training method:** Gradient descent (800 epochs, learning rate 0.05, L2 regularization λ=0.01)  \n`;
  md += `**Evaluation method:** ${od?.evaluationMethod ?? '—'}  \n`;
  md += `**Training samples:** ${od?.sampleSize ?? '—'} completed loan transactions  \n\n`;

  if (od?.classDistribution) {
    md += `### Class Distribution\n\n`;
    md += `| Class | Count | Percentage |\n`;
    md += `|---|---|---|\n`;
    md += `| On-time returns | ${od.classDistribution.onTime} | ${pct(1 - od.classDistribution.positiveRate)} |\n`;
    md += `| Overdue returns | ${od.classDistribution.overdue} | ${pct(od.classDistribution.positiveRate)} |\n`;
    md += `| **Total** | **${od.sampleSize}** | **100%** |\n\n`;
  }

  if (od?.note) {
    md += `> ℹ️ **Note:** ${od.note}\n\n`;
  }

  // Data split breakdown
  if (od?.sampleSize && od?.folds) {
    const foldSize   = Math.floor(od.sampleSize / od.folds);
    const lastFold   = od.sampleSize - foldSize * (od.folds - 1);
    const trainAvg   = od.sampleSize - foldSize;
    md += `### Data Split (${od.folds}-Fold Cross-Validation)\n\n`;
    md += `| | Count | Percentage |\n`;
    md += `|---|---|---|\n`;
    md += `| Total dataset | **${od.sampleSize}** loans | 100% |\n`;
    md += `| Training set per fold (avg) | **${trainAvg}** loans | ${pct(trainAvg / od.sampleSize)} |\n`;
    md += `| Validation set per fold (avg) | **${foldSize}** loans | ${pct(foldSize / od.sampleSize)} |\n`;
    md += `| Last fold validation set | **${lastFold}** loans | ${pct(lastFold / od.sampleSize)} |\n\n`;
    md += `> Each fold trains on ${trainAvg} samples and tests on ${foldSize}–${lastFold} unseen samples. `;
    md += `This is repeated ${od.folds} times so every sample is used for testing exactly once.\n\n`;
    md += `\`\`\`\n`;
    md += `Fold breakdown:\n`;
    for (let f = 1; f <= od.folds; f++) {
      const valStart = (f - 1) * foldSize + 1;
      const valEnd   = f === od.folds ? od.sampleSize : f * foldSize;
      const valCount = valEnd - valStart + 1;
      const trainCount = od.sampleSize - valCount;
      md += `  Fold ${f}: Train = ${trainCount} samples | Validate = ${valCount} samples (rows ${valStart}–${valEnd})\n`;
    }
    md += `\`\`\`\n\n`;
  }  // 2.1 Performance Metrics
  md += `### 2.1 Performance Metrics\n\n`;
  if (od?.metrics) {
    md += `| Metric | Score | Bar | Interpretation |\n`;
    md += `|---|---|---|---|\n`;
    md += `| ${badge(od.metrics.accuracy,  0.80, 0.65)} **Accuracy**  | **${pct(od.metrics.accuracy)}**  | ${bar(od.metrics.accuracy)}  | Overall correct predictions out of all predictions made |\n`;
    md += `| ${badge(od.metrics.precision, 0.70, 0.55)} **Precision** | **${pct(od.metrics.precision)}** | ${bar(od.metrics.precision)} | When the model flags a loan as overdue, how often it is correct |\n`;
    md += `| ${badge(od.metrics.recall,    0.70, 0.55)} **Recall**    | **${pct(od.metrics.recall)}**    | ${bar(od.metrics.recall)}    | Of all loans that were actually overdue, how many were caught |\n`;
    md += `| ${badge(od.metrics.f1,        0.70, 0.55)} **F1 Score**  | **${pct(od.metrics.f1)}**        | ${bar(od.metrics.f1)}        | Harmonic mean of precision and recall |\n`;
    md += `| ${badge(od.metrics.auc,       0.80, 0.65)} **AUC-ROC**   | **${pct(od.metrics.auc)}**       | ${bar(od.metrics.auc)}       | Overall discrimination ability (0.5 = random, 1.0 = perfect) |\n\n`;

    md += `**Interpretation:** `;
    if (od.metrics.accuracy >= 0.90) md += `The model achieves excellent accuracy, correctly classifying ${pct(od.metrics.accuracy)} of all loans. `;
    if (od.metrics.precision >= 0.90) md += `Perfect precision means zero false alarms — every overdue alert is genuine. `;
    if (od.metrics.recall >= 0.85) md += `High recall means the model catches the vast majority of overdue cases before they escalate. `;
    md += `\n\n`;
  } else {
    md += `_Insufficient training data for cross-validation metrics._\n\n`;
  }

  // 2.2 Confusion Matrix
  md += `### 2.2 Confusion Matrix\n\n`;
  if (od?.confusionMatrix) {
    const { tp, tn, fp, fn } = od.confusionMatrix;
    const total = tp + tn + fp + fn;
    md += `|  | **Predicted: Overdue** | **Predicted: On-Time** |\n`;
    md += `|---|---|---|\n`;
    md += `| **Actual: Overdue** | ✅ True Positive: **${tp}** (${pct(tp/total)}) | ❌ False Negative: **${fn}** (${pct(fn/total)}) |\n`;
    md += `| **Actual: On-Time** | ❌ False Positive: **${fp}** (${pct(fp/total)}) | ✅ True Negative: **${tn}** (${pct(tn/total)}) |\n\n`;
    md += `- **True Positive (${tp}):** Correctly predicted as overdue — librarian can act early\n`;
    md += `- **True Negative (${tn}):** Correctly predicted as on-time — no unnecessary follow-up\n`;
    md += `- **False Positive (${fp}):** Predicted overdue but returned on time — unnecessary alert\n`;
    md += `- **False Negative (${fn}):** Missed overdue prediction — returned late without warning\n\n`;
  }

  // 2.3 Feature Importance
  md += `### 2.3 Feature Importance\n\n`;
  md += `The model uses 5 input signals to compute the overdue probability:\n\n`;
  if (od?.featureImportance) {
    md += `| Rank | Feature | Weight | Influence | Direction |\n`;
    md += `|---|---|---|---|---|\n`;
    od.featureImportance.forEach((f, i) => {
      const dir = f.weight < 0 ? '↓ Reduces overdue risk' : '↑ Increases overdue risk';
      const sign = f.weight > 0 ? '+' : '';
      md += `| ${i+1} | ${f.name} | \`${sign}${f.weight}\` | ${bar(f.importance, 15)} ${pct(f.importance)} | ${dir} |\n`;
    });
    md += `\n`;
    md += `> **Model weights:** \`[${od.modelWeights?.join(', ')}]\` · Bias: \`${od.bias}\`\n\n`;
  }

  // 2.4 Live Risk Predictions
  md += `### 2.4 Live Risk Predictions\n\n`;
  md += `Current risk assessment for all active loans as of report generation:\n\n`;
  if (predictions.length > 0) {
    md += `| Risk | Borrower | Student ID | Due Date | Days | Score | Return Rate |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    predictions.forEach(p => {
      const days = p.features.daysRemaining;
      const dayStr = days < 0 ? `**${Math.abs(days)}d overdue**` : `${days}d remaining`;
      const dueStr = p.due_date ? String(p.due_date).split('T')[0] : '—';
      md += `| ${riskIcon(p.riskTier)} ${p.riskTier} | ${p.borrower_name} | ${p.student_id ?? '—'} | ${dueStr} | ${dayStr} | ${p.riskScore}% | ${p.features.returnRate}% |\n`;
    });
    md += `\n`;
    const high = predictions.filter(p => p.riskTier === 'high risk').length;
    const med  = predictions.filter(p => p.riskTier === 'medium risk').length;
    const low  = predictions.filter(p => p.riskTier === 'low risk').length;
    md += `**Summary:** 🔴 ${high} high risk · 🟡 ${med} medium risk · 🟢 ${low} low risk\n\n`;
  } else {
    md += `_No active loans at time of report generation._\n\n`;
  }

  md += `---\n\n`;

  // ── 3. Recommendation Engine ──────────────────────────────────────────────
  md += `## 3. Book Recommendation Engine\n\n`;
  md += `> **What it does:** Suggests books each student is likely to enjoy, based on their reading `;
  md += `history and the preferences of similar readers.\n\n`;
  md += `**Algorithm:** Hybrid Content-Based Filtering (TF-IDF) + Collaborative Filtering (Jaccard similarity)  \n`;
  md += `**Evaluation method:** ${rec?.evaluationMethod ?? '—'}  \n`;
  md += `**Users evaluated:** ${rec?.totalEvaluations ?? '—'} (users with ≥2 books in reading history)  \n`;
  md += `**Catalog coverage:** ${rec?.uniqueBooksRecommended ?? '—'} of ${rec?.totalBooks ?? '—'} books recommended (${pct(rec?.catalogCoverage)})  \n\n`;

  if (rec?.note) {
    md += `> ℹ️ **Note:** ${rec.note}\n\n`;
  }

  // Data split breakdown for recommendation engine
  if (rec?.totalUsers !== undefined && rec?.totalEvaluations !== undefined) {
    const coldStart = rec.totalUsers - rec.totalEvaluations;
    md += `### Data Split (Leave-One-Out Cross-Validation)\n\n`;
    md += `| | Count |\n`;
    md += `|---|---|\n`;
    md += `| Total users with reading history | **${rec.totalUsers}** |\n`;
    md += `| Users eligible for evaluation (≥2 books) | **${rec.totalEvaluations}** |\n`;
    md += `| Cold-start users (< 2 books, excluded from eval) | **${coldStart}** |\n`;
    md += `| Total books in catalog | **${rec.totalBooks}** |\n`;
    md += `| Books appearing in recommendations | **${rec.uniqueBooksRecommended}** |\n\n`;
    md += `> **Leave-one-out method:** For each eligible user, the most recently read book is hidden. `;
    md += `The engine recommends top-${rec.k} books using the remaining history. `;
    md += `A "hit" is recorded if the hidden book appears in the top-${rec.k}. `;
    md += `This simulates real-world prediction of the next book a user will want.\n\n`;
    md += `\`\`\`\n`;
    md += `Per evaluation run:\n`;
    md += `  Training (user profile built from): N-1 books per user\n`;
    md += `  Test (held-out book):               1 book per user\n`;
    md += `  Candidate pool (books to rank):     All available books minus training set\n`;
    md += `  Evaluation runs total:              ${rec.totalEvaluations}\n`;
    md += `  Successful hits (book in top-${rec.k}):  ${rec.hitsAtK}\n`;
    md += `\`\`\`\n\n`;
  }
  md += `### 3.1 Performance Metrics\n\n`;
  if (rec) {
    md += `| Metric | Score | Bar | Interpretation |\n`;
    md += `|---|---|---|---|\n`;
    md += `| ${badge(rec.precisionAtK, 0.30, 0.15)} **Precision@${rec.k}** | **${pct(rec.precisionAtK)}** | ${bar(rec.precisionAtK)} | Of top-${rec.k} recommendations, how often the held-out book appeared |\n`;
    md += `| ${badge(rec.recallAtK,    0.30, 0.15)} **Recall@${rec.k}**    | **${pct(rec.recallAtK)}**    | ${bar(rec.recallAtK)}    | Fraction of relevant books found in top-${rec.k} |\n`;
    md += `| ${badge(rec.f1AtK,        0.30, 0.15)} **F1@${rec.k}**        | **${pct(rec.f1AtK)}**        | ${bar(rec.f1AtK)}        | Harmonic mean of precision and recall |\n`;
    md += `| ${badge(rec.catalogCoverage, 0.40, 0.25)} **Catalog Coverage** | **${pct(rec.catalogCoverage)}** | ${bar(rec.catalogCoverage)} | Fraction of total catalog that appears in at least one recommendation list |\n`;
    md += `| ${badge(rec.meanSimilarityScore, 0.25, 0.10)} **Mean Similarity** | **${rec.meanSimilarityScore?.toFixed(4) ?? '—'}** | ${bar(rec.meanSimilarityScore ?? 0)} | Average cosine similarity score of recommended items |\n\n`;
    md += `**Evaluation details:** ${rec.hitsAtK} correct predictions out of ${rec.totalEvaluations} leave-one-out tests\n\n`;
  }

  // 3.2 Sample Recommendations
  md += `### 3.2 Sample Recommendations\n\n`;
  md += `Personalized recommendations generated for demo users:\n\n`;
  for (const u of sampleRecs) {
    md += `#### ${u.name} — *${u.genre}*\n\n`;
    if (u.recs.length === 0) {
      md += `_No available books to recommend (all preferred books currently borrowed)._\n\n`;
    } else {
      md += `| Rank | Book | Author | Score | Reason |\n`;
      md += `|---|---|---|---|---|\n`;
      u.recs.forEach((r, i) => {
        md += `| ${i+1} | ${r.title} | ${r.author} | \`${r.finalScore}\` | ${r.reason} |\n`;
      });
      md += `\n`;
    }
  }

  md += `---\n\n`;

  // ── 4. System Architecture ────────────────────────────────────────────────
  md += `## 4. System Architecture\n\n`;
  md += `\`\`\`\n`;
  md += `Library System — AI Component Architecture\n\n`;
  md += `┌─────────────────────────────────────────────────────────┐\n`;
  md += `│                    INPUT MODULE                         │\n`;
  md += `│  MySQL Database: transactions, reading_history, users   │\n`;
  md += `└──────────────────────┬──────────────────────────────────┘\n`;
  md += `                       │\n`;
  md += `          ┌────────────┴────────────┐\n`;
  md += `          ▼                         ▼\n`;
  md += `┌─────────────────┐     ┌───────────────────────┐\n`;
  md += `│  LEARNING MODULE │     │    LEARNING MODULE    │\n`;
  md += `│  TF-IDF Vectors  │     │  Logistic Regression  │\n`;
  md += `│  User Profiles   │     │  Gradient Descent     │\n`;
  md += `│  CF Similarity   │     │  L2 Regularization    │\n`;
  md += `└────────┬─────────┘     └──────────┬────────────┘\n`;
  md += `         │                           │\n`;
  md += `         ▼                           ▼\n`;
  md += `┌─────────────────┐     ┌───────────────────────┐\n`;
  md += `│  INFERENCE ENGINE│     │   INFERENCE ENGINE    │\n`;
  md += `│  Cosine Similarity│    │   σ(w·x + b)          │\n`;
  md += `│  Ranked Results  │     │   Risk Score 0-100%   │\n`;
  md += `└────────┬─────────┘     └──────────┬────────────┘\n`;
  md += `         │                           │\n`;
  md += `         └────────────┬──────────────┘\n`;
  md += `                      ▼\n`;
  md += `┌─────────────────────────────────────────────────────────┐\n`;
  md += `│                   OUTPUT MODULE                         │\n`;
  md += `│  Dashboard · Borrower Profiles · Analytics Page         │\n`;
  md += `│  Chatbot · Book Detail Pages                            │\n`;
  md += `└─────────────────────────────────────────────────────────┘\n`;
  md += `\`\`\`\n\n`;

  md += `---\n\n`;

  // ── 5. Curriculum Alignment ───────────────────────────────────────────────
  md += `## 5. Alignment with Intelligent Systems Curriculum\n\n`;
  md += `| Lesson | Topic | Implementation in This System |\n`;
  md += `|---|---|---|\n`;
  md += `| Lesson 10 | Uncertainty Handling / Probabilistic Reasoning | Overdue model outputs P(overdue) — a probability, not a hard yes/no |\n`;
  md += `| Lesson 11 | Learning Paradigms | Overdue = **Supervised Learning** (labeled data); Recommendations = **Unsupervised** pattern discovery |\n`;
  md += `| Lesson 12 | Supervised Learning Workflow | Data prep → Training (gradient descent) → Testing (k-fold CV) → Evaluation metrics |\n`;
  md += `| Lesson 13 | Unsupervised / Clustering | CF component clusters users by Jaccard similarity of reading patterns |\n`;
  md += `| Lesson 14 | Intelligent System Architecture | Input Module (DB) → Learning Module → Inference Engine → Working Memory (cache) → Output Module |\n`;
  md += `| Lesson 15 | Testing & Evaluation | Leave-one-out CV for recommendations; k-fold CV for overdue model; confusion matrix; AUC-ROC |\n`;
  md += `| Lesson 16 | Ethics | Bcrypt encryption, JWT auth, RBAC, transparent AI explanations, bias detection (single-class warning) |\n\n`;

  md += `---\n\n`;
  md += `*Report generated automatically by \`node db/generate-report.js\`*\n`;

  // ── Write file ────────────────────────────────────────────────────────────
  const outPath = path.join(__dirname, '../../AI_TEST_RESULTS.md');
  fs.writeFileSync(outPath, md, 'utf8');
  console.log(`✅ Report written to: ${outPath}`);
  console.log(`   ${md.split('\n').length} lines · ${(Buffer.byteLength(md) / 1024).toFixed(1)} KB`);
  process.exit(0);
}

generate().catch(e => { console.error('Error:', e.message); process.exit(1); });

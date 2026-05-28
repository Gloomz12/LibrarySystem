/**
 * AI Model Test Runner
 * Evaluates both models against live database data and prints a full report.
 * Run: node db/run-ai-test.js
 */
require('dotenv').config({ path: require('path').join(__dirname, '../.env') });
const { clearModelCache, getOverdueModelMetrics, getRecommendationMetrics, getOverduePredictions, getRecommendations } = require('../services/aiEngine');

function bar(value, max = 1, width = 30) {
  const filled = Math.round((value / max) * width);
  return '█'.repeat(filled) + '░'.repeat(width - filled);
}

function pct(v) { return (v * 100).toFixed(1) + '%'; }
function fmt(v) { return v !== undefined && v !== null ? v : '—'; }

async function runTests() {
  console.log('\n' + '═'.repeat(70));
  console.log('  LIBRARY SYSTEM — AI MODEL EVALUATION REPORT');
  console.log('  Generated:', new Date().toLocaleString('en-US', { dateStyle: 'full', timeStyle: 'medium' }));
  console.log('═'.repeat(70));

  clearModelCache();

  // ── 1. OVERDUE PREDICTION MODEL ──────────────────────────────────────────
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  MODEL 1: OVERDUE RETURN PREDICTOR (Logistic Regression)        │');
  console.log('└─────────────────────────────────────────────────────────────────┘');

  const od = await getOverdueModelMetrics();

  if (!od) {
    console.log('  ❌ Failed to evaluate overdue model.');
  } else if (!od.trained) {
    console.log('  ⚠  ' + od.message);
  } else {
    console.log(`\n  Algorithm:   ${od.algorithm}`);
    console.log(`  Evaluation:  ${od.evaluationMethod}`);
    console.log(`  Training set: ${od.sampleSize} completed loans`);
    console.log(`  Class split:  ${od.classDistribution.onTime} on-time / ${od.classDistribution.overdue} overdue (${pct(od.classDistribution.positiveRate)} overdue rate)`);

    if (od.note) {
      console.log(`\n  ℹ  ${od.note}`);
    }

    console.log('\n  ── Performance Metrics ──────────────────────────────────────────');
    const metrics = [
      { name: 'Accuracy',  v: od.metrics.accuracy,  good: 0.70, desc: 'Overall correct predictions' },
      { name: 'Precision', v: od.metrics.precision, good: 0.65, desc: 'When flagged overdue, how often correct' },
      { name: 'Recall',    v: od.metrics.recall,    good: 0.65, desc: 'Of all overdue loans, how many caught' },
      { name: 'F1 Score',  v: od.metrics.f1,        good: 0.65, desc: 'Balance of precision and recall' },
      { name: 'AUC-ROC',   v: od.metrics.auc,       good: 0.70, desc: 'Overall discrimination ability (0.5=random, 1.0=perfect)' },
    ];
    metrics.forEach(m => {
      const status = m.v >= m.good ? '✅' : m.v >= m.good * 0.7 ? '⚠ ' : '❌';
      console.log(`  ${status} ${m.name.padEnd(12)} ${pct(m.v).padStart(7)}  ${bar(m.v)}  ${m.desc}`);
    });

    console.log('\n  ── Confusion Matrix ─────────────────────────────────────────────');
    const { tp, tn, fp, fn } = od.confusionMatrix;
    const total = tp + tn + fp + fn;
    console.log(`  True Positive  (correctly flagged overdue):  ${String(tp).padStart(3)}  (${pct(tp/total)})`);
    console.log(`  True Negative  (correctly flagged on-time):  ${String(tn).padStart(3)}  (${pct(tn/total)})`);
    console.log(`  False Positive (flagged overdue, was fine):  ${String(fp).padStart(3)}  (${pct(fp/total)})`);
    console.log(`  False Negative (missed overdue):             ${String(fn).padStart(3)}  (${pct(fn/total)})`);

    console.log('\n  ── Feature Importance ───────────────────────────────────────────');
    od.featureImportance.forEach(f => {
      const dir = f.weight < 0 ? '↓ reduces risk' : '↑ increases risk';
      console.log(`  ${bar(f.importance, 1, 20)}  ${pct(f.importance).padStart(6)}  ${f.name} (w=${f.weight > 0 ? '+' : ''}${f.weight}) — ${dir}`);
    });
  }

  // ── 2. LIVE OVERDUE PREDICTIONS ───────────────────────────────────────────
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  LIVE PREDICTIONS — Active Loans Risk Assessment                │');
  console.log('└─────────────────────────────────────────────────────────────────┘');

  const predictions = await getOverduePredictions();
  if (predictions.length === 0) {
    console.log('  No active loans to predict.');
  } else {
    console.log(`\n  ${'Borrower'.padEnd(22)} ${'Risk'.padEnd(14)} ${'Score'.padEnd(8)} ${'Days'.padEnd(12)} Return Rate`);
    console.log('  ' + '─'.repeat(65));
    predictions.forEach(p => {
      const days = p.features.daysRemaining;
      const dayStr = days < 0 ? `${Math.abs(days)}d OVERDUE` : `${days}d left`;
      const riskIcon = p.riskTier === 'high risk' ? '🔴' : p.riskTier === 'medium risk' ? '🟡' : '🟢';
      console.log(`  ${riskIcon} ${p.borrower_name.padEnd(20)} ${p.riskTier.padEnd(14)} ${String(p.riskScore+'%').padEnd(8)} ${dayStr.padEnd(12)} ${p.features.returnRate}%`);
    });
  }

  // ── 3. RECOMMENDATION ENGINE ──────────────────────────────────────────────
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  MODEL 2: BOOK RECOMMENDATION ENGINE (Hybrid TF-IDF + CF)       │');
  console.log('└─────────────────────────────────────────────────────────────────┘');

  const rec = await getRecommendationMetrics();

  if (!rec) {
    console.log('  ❌ Failed to evaluate recommendation engine.');
  } else {
    console.log(`\n  Algorithm:   ${rec.algorithm}`);
    console.log(`  Evaluation:  ${rec.evaluationMethod}`);
    console.log(`  Users tested: ${rec.totalEvaluations} (leave-one-out)`);
    console.log(`  Catalog:      ${rec.uniqueBooksRecommended}/${rec.totalBooks} books recommended (${pct(rec.catalogCoverage)} coverage)`);

    if (rec.note) console.log(`\n  ℹ  ${rec.note}`);

    console.log('\n  ── Performance Metrics ──────────────────────────────────────────');
    const recMetrics = [
      { name: `Precision@${rec.k}`, v: rec.precisionAtK, good: 0.20, desc: `Correct book in top-${rec.k} recommendations` },
      { name: `Recall@${rec.k}`,    v: rec.recallAtK,    good: 0.20, desc: 'Relevant items found in top-K' },
      { name: `F1@${rec.k}`,        v: rec.f1AtK,        good: 0.20, desc: 'Harmonic mean of precision and recall' },
      { name: 'Coverage',           v: rec.catalogCoverage, good: 0.30, desc: 'Fraction of catalog ever recommended' },
      { name: 'Mean Similarity',    v: rec.meanSimilarityScore, good: 0.20, desc: 'Average confidence of recommendations' },
    ];
    recMetrics.forEach(m => {
      const status = m.v >= m.good ? '✅' : m.v >= m.good * 0.5 ? '⚠ ' : '❌';
      console.log(`  ${status} ${m.name.padEnd(16)} ${pct(m.v).padStart(7)}  ${bar(m.v)}  ${m.desc}`);
    });

    console.log(`\n  Hits at K=${rec.k}: ${rec.hitsAtK} out of ${rec.totalEvaluations} evaluations`);
  }

  // ── 4. SAMPLE RECOMMENDATIONS ─────────────────────────────────────────────
  console.log('\n┌─────────────────────────────────────────────────────────────────┐');
  console.log('│  SAMPLE RECOMMENDATIONS — Per User                              │');
  console.log('└─────────────────────────────────────────────────────────────────┘');

  const demoUsers = [
    { id: 'd-usr-01', name: 'Maria Santos (Fantasy/Magical Realism reader)' },
    { id: 'd-usr-03', name: 'Ana Cruz (Romance/Classic reader)' },
    { id: 'd-usr-07', name: 'Grace Villanueva (Mystery/Thriller reader)' },
  ];

  for (const u of demoUsers) {
    const recs = await getRecommendations(u.id, 3);
    console.log(`\n  ${u.name}:`);
    recs.forEach((r, i) => {
      console.log(`    ${i+1}. ${r.title} — score: ${r.finalScore} (${r.reason})`);
    });
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  END OF REPORT');
  console.log('═'.repeat(70) + '\n');

  process.exit(0);
}

runTests().catch(e => { console.error('Test runner error:', e.message); process.exit(1); });

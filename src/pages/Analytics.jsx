import React, { useState, useEffect } from 'react';
import {
  BarChart2, Brain, TrendingUp, Users, BookOpen,
  Repeat, AlertTriangle, Target,
  Activity, RefreshCw, ChevronDown, ChevronUp,
} from 'lucide-react';
import { api } from '../api/client';

// ── Small reusable components ─────────────────────────────────────────────────

function MetricCard({ label, value, sub, color = '#D4A373', icon: Icon }) {
  return (
    <div className="kpi-card">
      <div className="kpi-header">
        <span className="kpi-title">{label}</span>
        {Icon && <Icon size={16} color={color} />}
      </div>
      <div className="kpi-value" style={{ fontSize: '26px' }}>{value}</div>
      {sub && <div className="kpi-subtext">{sub}</div>}
    </div>
  );
}

function SectionHeader({ icon: Icon, title, subtitle }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
        <Icon size={18} color="#D4A373" />
        <h2 style={{ fontSize: '18px', fontWeight: '700', margin: 0 }}>{title}</h2>
      </div>
      {subtitle && <p style={{ fontSize: '13px', color: '#8A8884', marginTop: '4px' }}>{subtitle}</p>}
    </div>
  );
}

function BarRow({ label, value, max, color = '#1B263B', suffix = '' }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div style={{ marginBottom: '10px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '4px' }}>
        <span style={{ color: '#4A4947' }}>{label}</span>
        <strong style={{ color: '#1A1A1A' }}>{value}{suffix}</strong>
      </div>
      <div className="progress-bar-track">
        <div className="progress-bar-fill" style={{ width: `${pct}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}

function Pill({ label, value, good = true }) {
  const bg  = good ? '#F0FDF4' : '#FEF2F2';
  const col = good ? '#15803D' : '#DC2626';
  const bdr = good ? '#BBF7D0' : '#FECACA';
  return (
    <div style={{ display: 'inline-flex', flexDirection: 'column', alignItems: 'center', padding: '10px 16px', background: bg, border: `1px solid ${bdr}`, borderRadius: '10px', minWidth: '90px' }}>
      <span style={{ fontSize: '20px', fontWeight: '700', color: col }}>{value}</span>
      <span style={{ fontSize: '11px', color: col, marginTop: '2px', textAlign: 'center' }}>{label}</span>
    </div>
  );
}

// ── Confusion Matrix component ────────────────────────────────────────────────
function ConfusionMatrix({ tp, tn, fp, fn }) {
  const total = tp + tn + fp + fn;
  const cell = (val, bg, label) => (
    <div style={{ background: bg, borderRadius: '8px', padding: '12px', textAlign: 'center', flex: 1 }}>
      <div style={{ fontSize: '22px', fontWeight: '700', color: '#1A1A1A' }}>{val}</div>
      <div style={{ fontSize: '10px', color: '#716F6A', marginTop: '2px' }}>{label}</div>
      <div style={{ fontSize: '11px', color: '#A09E9A' }}>{total > 0 ? ((val / total) * 100).toFixed(1) : 0}%</div>
    </div>
  );
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '8px' }}>
        {cell(tp, '#F0FDF4', 'True Positive')}
        {cell(fp, '#FEF2F2', 'False Positive')}
        {cell(fn, '#FFF7ED', 'False Negative')}
        {cell(tn, '#F0F9FF', 'True Negative')}
      </div>
      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', marginTop: '8px' }}>
        <span style={{ fontSize: '11px', color: '#15803D', background: '#F0FDF4', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BBF7D0' }}>TP: Correctly predicted overdue</span>
        <span style={{ fontSize: '11px', color: '#DC2626', background: '#FEF2F2', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FECACA' }}>FP: Predicted overdue, was on time</span>
        <span style={{ fontSize: '11px', color: '#D97706', background: '#FFF7ED', padding: '2px 8px', borderRadius: '6px', border: '1px solid #FED7AA' }}>FN: Missed overdue prediction</span>
        <span style={{ fontSize: '11px', color: '#0369A1', background: '#F0F9FF', padding: '2px 8px', borderRadius: '6px', border: '1px solid #BAE6FD' }}>TN: Correctly predicted on time</span>
      </div>
    </div>
  );
}

// ── ROC Curve (SVG) ───────────────────────────────────────────────────────────
function RocCurve({ points, auc }) {
  if (!points || points.length === 0) return null;
  const W = 260, H = 200, PAD = 30;
  const toX = fpr => PAD + fpr * (W - PAD * 2);
  const toY = tpr => H - PAD - tpr * (H - PAD * 2);

  const pathD = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${toX(p.fpr).toFixed(1)} ${toY(p.tpr).toFixed(1)}`
  ).join(' ');

  return (
    <div>
      <svg width={W} height={H} style={{ display: 'block', margin: '0 auto' }}>
        {/* Grid */}
        {[0, 0.25, 0.5, 0.75, 1].map(v => (
          <g key={v}>
            <line x1={toX(v)} y1={PAD} x2={toX(v)} y2={H - PAD} stroke="#F4F1EA" strokeWidth="1" />
            <line x1={PAD} y1={toY(v)} x2={W - PAD} y2={toY(v)} stroke="#F4F1EA" strokeWidth="1" />
            <text x={toX(v)} y={H - 10} textAnchor="middle" fontSize="9" fill="#A09E9A">{v}</text>
            <text x={14} y={toY(v) + 3} textAnchor="middle" fontSize="9" fill="#A09E9A">{v}</text>
          </g>
        ))}
        {/* Diagonal baseline */}
        <line x1={toX(0)} y1={toY(0)} x2={toX(1)} y2={toY(1)} stroke="#EAE6DF" strokeWidth="1.5" strokeDasharray="4,3" />
        {/* ROC curve */}
        <path d={pathD} fill="none" stroke="#1B263B" strokeWidth="2" strokeLinejoin="round" />
        {/* Fill under curve */}
        <path d={`${pathD} L ${toX(1).toFixed(1)} ${toY(0).toFixed(1)} L ${toX(0).toFixed(1)} ${toY(0).toFixed(1)} Z`}
          fill="#1B263B" fillOpacity="0.07" />
        {/* Axis labels */}
        <text x={W / 2} y={H - 1} textAnchor="middle" fontSize="10" fill="#716F6A">False Positive Rate</text>
        <text x={8} y={H / 2} textAnchor="middle" fontSize="10" fill="#716F6A" transform={`rotate(-90, 8, ${H / 2})`}>True Positive Rate</text>
      </svg>
      <p style={{ textAlign: 'center', fontSize: '12px', color: '#8A8884', marginTop: '4px' }}>
        AUC = <strong style={{ color: '#1A1A1A' }}>{auc}</strong>
        {' '}— {auc >= 0.9 ? 'Excellent' : auc >= 0.8 ? 'Good' : auc >= 0.7 ? 'Fair' : 'Needs more data'}
      </p>
    </div>
  );
}

// ── Main Analytics page ───────────────────────────────────────────────────────
export default function Analytics() {
  const [overview,   setOverview]   = useState(null);
  const [timeSeries, setTimeSeries] = useState([]);
  const [topBooks,   setTopBooks]   = useState([]);
  const [genres,     setGenres]     = useState([]);
  const [userAct,    setUserAct]    = useState([]);
  const [aiMetrics,  setAiMetrics]  = useState(null);
  const [loading,    setLoading]    = useState(true);
  const [aiLoading,  setAiLoading]  = useState(true);
  const [error,      setError]      = useState('');
  const [activeTab,  setActiveTab]  = useState('overview');
  const [expandRec,  setExpandRec]  = useState(false);
  const [expandOD,   setExpandOD]   = useState(false);

  // Load system analytics
  useEffect(() => {
    Promise.all([
      api.getAnalyticsOverview(),
      api.getBorrowsOverTime(),
      api.getTopBooks(),
      api.getGenreDistribution(),
      api.getUserActivity(),
    ]).then(([ov, ts, tb, gd, ua]) => {
      setOverview(ov);
      setTimeSeries(ts);
      setTopBooks(tb);
      setGenres(gd);
      setUserAct(ua);
    }).catch(err => {
      setError('Failed to load analytics: ' + err.message);
    }).finally(() => setLoading(false));
  }, []);

  // Load AI metrics separately (can be slow)
  useEffect(() => {
    api.getAiMetrics()
      .then(data => setAiMetrics(data))
      .catch(() => setAiMetrics(null))
      .finally(() => setAiLoading(false));
  }, []);

  const refreshAi = () => {
    setAiLoading(true);
    api.clearModelCache()
      .catch(() => {}) // ignore cache clear errors
      .finally(() => {
        api.getAiMetrics()
          .then(data => setAiMetrics(data))
          .catch(() => setAiMetrics(null))
          .finally(() => setAiLoading(false));
      });
  };

  const tabs = [
    { id: 'overview',  label: 'Overview',         icon: BarChart2 },
    { id: 'activity',  label: 'Activity',          icon: TrendingUp },
    { id: 'ai',        label: 'AI Performance',    icon: Brain },
  ];

  if (loading) {
    return (
      <main id="scroll-container" style={{ padding: '24px' }}>
        <div className="loading-state-block">Loading analytics…</div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="scroll-container" style={{ padding: '24px' }}>
        <div className="error-state-block">{error}</div>
      </main>
    );
  }

  return (
    <main id="scroll-container" style={{ padding: '24px' }}>
      <div className="max-width-limiter">

        {/* Page header */}
        <div className="view-heading-group" style={{ marginBottom: '24px' }}>
          <h1>Analytics</h1>
          <p>System performance, usage statistics, and AI model evaluation</p>
        </div>

        {/* Tab bar */}
        <div className="navigation-tablist-track" style={{ marginBottom: '24px' }}>
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} type="button"
              className={`btn-tab-trigger ${activeTab === id ? 'active-tab-state' : ''}`}
              onClick={() => setActiveTab(id)}
            >
              <Icon size={14} />
              <span>{label}</span>
            </button>
          ))}
        </div>

        {/* ── OVERVIEW TAB ── */}
        {activeTab === 'overview' && overview && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* KPI row */}
            <div className="analytics-grid">
              <MetricCard label="Total Books"       value={overview.books.total}
                sub={`${overview.books.available} available · ${overview.books.borrowed} borrowed`}
                icon={BookOpen} />
              <MetricCard label="Registered Students" value={overview.users.total}
                sub="Active accounts" icon={Users} />
              <MetricCard label="Total Transactions"  value={overview.transactions.total}
                sub={`${overview.transactions.activeBorrows} active · ${overview.transactions.completedReturns} returned`}
                icon={Repeat} />
              <MetricCard label="Overdue Loans"       value={overview.transactions.overdueCount}
                sub={`${overview.transactions.pending} pending requests`}
                icon={AlertTriangle} color="#EF4444" />
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '24px' }}>

              {/* Genre distribution */}
              <div className="content-panel-block">
                <div className="panel-header-block">
                  <SectionHeader icon={BarChart2} title="Genre Distribution"
                    subtitle="Books and borrows per genre" />
                </div>
                <div className="panel-body-content" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {genres.map(g => (
                    <BarRow key={g.name} label={g.name}
                      value={g.borrow_count} max={genres[0]?.borrow_count || 1}
                      suffix=" borrows" color="#1B263B" />
                  ))}
                </div>
              </div>

              {/* Top borrowed books */}
              <div className="content-panel-block">
                <div className="panel-header-block">
                  <SectionHeader icon={BookOpen} title="Most Borrowed Books"
                    subtitle="All-time borrow count" />
                </div>
                <div className="panel-body-content" style={{ maxHeight: '340px', overflowY: 'auto' }}>
                  {topBooks.length === 0
                    ? <p className="empty-state-placeholder-text">No borrow data yet</p>
                    : topBooks.map(b => (
                      <BarRow key={b.id} label={`${b.title} — ${b.author}`}
                        value={b.borrow_count} max={topBooks[0]?.borrow_count || 1}
                        suffix=" borrows" color="#D4A373" />
                    ))
                  }
                </div>
              </div>
            </div>

            {/* Avg loan duration */}
            <div className="content-panel-block">
              <div className="panel-header-block">
                <SectionHeader icon={Activity} title="System Summary" />
              </div>
              <div className="panel-body-content">
                <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
                  <Pill label="Avg Loan Days"    value={overview.avgLoanDurationDays} good={overview.avgLoanDurationDays <= 30} />
                  <Pill label="Active Borrows"   value={overview.transactions.activeBorrows} good />
                  <Pill label="Pending Requests" value={overview.transactions.pending} good={overview.transactions.pending === 0} />
                  <Pill label="Overdue"          value={overview.transactions.overdueCount} good={overview.transactions.overdueCount === 0} />
                </div>
              </div>
            </div>

          </div>
        )}

        {/* ── ACTIVITY TAB ── */}
        {activeTab === 'activity' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {/* Borrows over time */}
            <div className="content-panel-block">
              <div className="panel-header-block">
                <SectionHeader icon={TrendingUp} title="Borrows & Returns Over Time"
                  subtitle="Last 12 months" />
              </div>
              <div className="panel-body-content">
                {timeSeries.length === 0
                  ? <p className="empty-state-placeholder-text">No transaction history yet</p>
                  : <BorrowsChart data={timeSeries} />
                }
              </div>
            </div>

            {/* User activity table */}
            <div className="content-panel-block">
              <div className="panel-header-block">
                <SectionHeader icon={Users} title="Student Activity"
                  subtitle="Borrow counts and return rates per student" />
              </div>
              <div className="panel-body-content" style={{ padding: 0 }}>
                {userAct.length === 0
                  ? <p className="empty-state-placeholder-text" style={{ padding: '24px' }}>No student data yet</p>
                  : (
                    <div style={{ overflowX: 'auto' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
                        <thead>
                          <tr style={{ borderBottom: '1px solid #F4F1EA', background: '#FAFAF9' }}>
                            {['Student', 'ID', 'Books Read', 'Total Borrows', 'Active', 'Return Rate', 'Fines'].map(h => (
                              <th key={h} style={{ padding: '10px 16px', textAlign: 'left', fontWeight: '600', color: '#716F6A', fontSize: '11px', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {userAct.map(u => (
                            <tr key={u.id} style={{ borderBottom: '1px solid #F4F1EA' }}>
                              <td style={{ padding: '10px 16px', fontWeight: '500' }}>{u.name}</td>
                              <td style={{ padding: '10px 16px', color: '#8A8884' }}>{u.student_id || '—'}</td>
                              <td style={{ padding: '10px 16px' }}>{u.books_read}</td>
                              <td style={{ padding: '10px 16px' }}>{u.total_borrows}</td>
                              <td style={{ padding: '10px 16px' }}>{u.active_loans}</td>
                              <td style={{ padding: '10px 16px' }}>
                                <span style={{ color: parseFloat(u.return_rate) >= 80 ? '#15803D' : '#DC2626', fontWeight: '600' }}>
                                  {parseFloat(u.return_rate).toFixed(0)}%
                                </span>
                              </td>
                              <td style={{ padding: '10px 16px', color: parseFloat(u.fines) > 0 ? '#DC2626' : '#8A8884' }}>
                                ₱{parseFloat(u.fines).toFixed(2)}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )
                }
              </div>
            </div>

          </div>
        )}

        {/* ── AI PERFORMANCE TAB ── */}
        {activeTab === 'ai' && (
          <AiMetricsTab
            aiMetrics={aiMetrics}
            aiLoading={aiLoading}
            onRefresh={refreshAi}
            expandRec={expandRec} setExpandRec={setExpandRec}
            expandOD={expandOD}  setExpandOD={setExpandOD}
          />
        )}

      </div>
    </main>
  );
}

// ── Borrows over time bar chart (pure SVG, no library needed) ─────────────────
function BorrowsChart({ data }) {
  if (!data || data.length === 0) return null;
  const W = 600, H = 180, PAD = { top: 10, right: 10, bottom: 40, left: 36 };
  const innerW = W - PAD.left - PAD.right;
  const innerH = H - PAD.top - PAD.bottom;
  const maxVal = Math.max(...data.flatMap(d => [d.borrows, d.returns]), 1);
  const barW   = Math.floor(innerW / data.length) - 4;

  return (
    <div style={{ overflowX: 'auto' }}>
      <svg viewBox={`0 0 ${W} ${H}`} style={{ width: '100%', maxWidth: W, display: 'block' }}>
        {/* Y-axis gridlines */}
        {[0, 0.25, 0.5, 0.75, 1].map(t => {
          const y = PAD.top + innerH * (1 - t);
          return (
            <g key={t}>
              <line x1={PAD.left} y1={y} x2={W - PAD.right} y2={y} stroke="#F4F1EA" strokeWidth="1" />
              <text x={PAD.left - 4} y={y + 3} textAnchor="end" fontSize="9" fill="#A09E9A">
                {Math.round(maxVal * t)}
              </text>
            </g>
          );
        })}
        {/* Bars */}
        {data.map((d, i) => {
          const slotW  = innerW / data.length;
          const x      = PAD.left + i * slotW + slotW / 2;
          const bH     = (d.borrows / maxVal) * innerH;
          const rH     = (d.returns / maxVal) * innerH;
          return (
            <g key={d.month}>
              {/* Borrow bar */}
              <rect x={x - barW / 2} y={PAD.top + innerH - bH} width={barW / 2 - 1} height={bH}
                fill="#1B263B" rx="2" opacity="0.85" />
              {/* Return bar */}
              <rect x={x} y={PAD.top + innerH - rH} width={barW / 2 - 1} height={rH}
                fill="#D4A373" rx="2" opacity="0.85" />
              {/* Month label */}
              <text x={x} y={H - 6} textAnchor="middle" fontSize="9" fill="#A09E9A">
                {d.month.slice(5)}
              </text>
            </g>
          );
        })}
        {/* Legend */}
        <rect x={PAD.left} y={H - 18} width={10} height={8} fill="#1B263B" rx="2" />
        <text x={PAD.left + 14} y={H - 11} fontSize="9" fill="#716F6A">Borrows</text>
        <rect x={PAD.left + 70} y={H - 18} width={10} height={8} fill="#D4A373" rx="2" />
        <text x={PAD.left + 84} y={H - 11} fontSize="9" fill="#716F6A">Returns</text>
      </svg>
    </div>
  );
}

// ── Plain-language metric explainer tooltip ───────────────────────────────────
function MetricExplainer({ title, value, good, plain, technical, color }) {
  const isGood = good;
  const dot = isGood === undefined ? '#8A8884' : isGood ? '#15803D' : '#D97706';
  return (
    <div style={{ background: '#ffffff', border: '1px solid #EAE6DF', borderRadius: '10px', padding: '14px 16px', flex: '1', minWidth: '140px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '6px' }}>
        <span style={{ fontSize: '11px', fontWeight: '700', color: '#8A8884', textTransform: 'uppercase', letterSpacing: '0.04em' }}>{title}</span>
        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: dot, display: 'inline-block', flexShrink: 0 }} />
      </div>
      <div style={{ fontSize: '24px', fontWeight: '700', color: color || '#1A1A1A', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: '12px', color: '#4A4947', marginTop: '6px', lineHeight: '1.5' }}>{plain}</div>
      <div style={{ fontSize: '10px', color: '#A09E9A', marginTop: '4px', fontStyle: 'italic' }}>{technical}</div>
    </div>
  );
}

// ── Health badge ──────────────────────────────────────────────────────────────
function HealthBadge({ score }) {
  // score 0-100
  const level = score >= 70 ? 'Good' : score >= 40 ? 'Fair' : 'Needs data';
  const bg    = score >= 70 ? '#F0FDF4' : score >= 40 ? '#FFF7ED' : '#F9F7F3';
  const col   = score >= 70 ? '#15803D' : score >= 40 ? '#D97706' : '#8A8884';
  const bdr   = score >= 70 ? '#BBF7D0' : score >= 40 ? '#FED7AA' : '#EAE6DF';
  return (
    <span style={{ fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '12px', background: bg, color: col, border: `1px solid ${bdr}` }}>
      {level}
    </span>
  );
}

// ── AI Metrics Tab ────────────────────────────────────────────────────────────
function AiMetricsTab({ aiMetrics, aiLoading, onRefresh, expandRec, setExpandRec, expandOD, setExpandOD }) {
  if (aiLoading) {
    return (
      <div className="content-panel-block">
        <div className="panel-body-content flex-center-empty-state" style={{ minHeight: '200px' }}>
          <div style={{ textAlign: 'center' }}>
            <div className="loading-spinner" style={{ margin: '0 auto 12px' }} />
            <p style={{ color: '#8A8884', fontSize: '13px' }}>
              Evaluating AI models — this may take a moment…
            </p>
          </div>
        </div>
      </div>
    );
  }

  if (!aiMetrics) {
    return (
      <div className="content-panel-block">
        <div className="panel-body-content">
          <div className="error-state-block">Failed to load AI metrics.</div>
          <button className="btn-card-secondary" style={{ marginTop: '12px' }} onClick={onRefresh}>
            <RefreshCw size={14} /> Retry
          </button>
        </div>
      </div>
    );
  }

  const { recommendations: rec, overduePrediction: od } = aiMetrics;

  const recHealthScore = rec
    ? Math.round(((rec.precisionAtK||0)*40 + (rec.catalogCoverage||0)*30 + Math.min((rec.meanSimilarityScore||0)*2,1)*30) * 100)
    : 0;
  const odHealthScore = od?.metrics
    ? Math.round(((od.metrics.accuracy||0)*25 + (od.metrics.precision||0)*25 + (od.metrics.recall||0)*25 + (od.metrics.auc||0)*25) * 100)
    : 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

      {/* Page intro */}
      <div style={{ background: '#F9F7F3', border: '1px solid #EAE6DF', borderRadius: '12px', padding: '20px 24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div>
            <h3 style={{ fontSize: '15px', fontWeight: '700', margin: '0 0 6px', color: '#1A1A1A' }}>🤖 What is this page?</h3>
            <p style={{ fontSize: '13px', color: '#4A4947', lineHeight: '1.6', margin: 0, maxWidth: '640px' }}>
              Your library uses two AI models that learn from real borrowing data. This page shows how well each model is performing — in plain terms, not just numbers. The more transactions your library processes, the smarter these models become.
            </p>
          </div>
          <button className="btn-card-secondary" onClick={onRefresh} style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px', flexShrink: 0 }}>
            <RefreshCw size={14} /> Re-evaluate
          </button>
        </div>
      </div>

      {/* ── RECOMMENDATION ENGINE ── */}
      <div className="content-panel-block">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F4F1EA', cursor: 'pointer' }} onClick={() => setExpandRec(v => !v)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Brain size={20} color="#D4A373" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Book Recommendation Engine</h3>
                {rec && <HealthBadge score={recHealthScore} />}
              </div>
              <p style={{ fontSize: '13px', color: '#4A4947', marginTop: '6px', lineHeight: '1.5' }}>
                <strong>What it does:</strong> Suggests books each student is likely to enjoy, based on what they and similar readers have borrowed before.
              </p>
            </div>
            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
              {expandRec ? <ChevronUp size={18} color="#8A8884" /> : <ChevronDown size={18} color="#8A8884" />}
            </div>
          </div>
        </div>

        {rec && !rec.trained && rec.message ? (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: '#92400E' }}>⚠ {rec.message}</div>
          </div>
        ) : rec ? (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {rec.note && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#1D4ED8' }}>
                ℹ️ <strong>Note:</strong> {rec.note}
              </div>
            )}

            {/* Plain summary */}
            <div style={{ background: '#F9F7F3', borderRadius: '10px', padding: '16px 20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 8px' }}>📊 In plain terms</p>
              <p style={{ fontSize: '13px', color: '#4A4947', lineHeight: '1.6', margin: 0 }}>
                {rec.totalEvaluations === 0
                  ? "The engine is active and ready. Once students borrow more books, it will be tested by hiding one book from each reader's history and checking if the AI would have recommended it — a technique called leave-one-out testing."
                  : `Out of ${rec.totalEvaluations} test${rec.totalEvaluations > 1 ? 's' : ''}, the AI correctly predicted a book the reader would enjoy ${rec.hitsAtK} time${rec.hitsAtK !== 1 ? 's' : ''} when showing its top ${rec.k} suggestions. It currently covers ${(rec.catalogCoverage * 100).toFixed(0)}% of the catalog in its recommendations.`
                }
              </p>
            </div>

            {/* Metric explainers */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <MetricExplainer title={`Precision (top ${rec.k})`} value={(rec.precisionAtK * 100).toFixed(1) + '%'} good={rec.precisionAtK >= 0.3}
                plain="When the AI recommends books, how often is the suggestion actually relevant to that reader?"
                technical={`Precision@${rec.k}: hits / total evaluations`} />
              <MetricExplainer title="Catalog Coverage" value={(rec.catalogCoverage * 100).toFixed(1) + '%'} good={rec.catalogCoverage >= 0.3}
                plain="What percentage of the library's books does the AI ever recommend? Higher means more variety."
                technical="Unique books recommended / total books in catalog" />
              <MetricExplainer title="Match Confidence" value={rec.meanSimilarityScore?.toFixed(3) ?? '—'} good={rec.meanSimilarityScore >= 0.2}
                plain="How confident is the AI in its suggestions? Closer to 1.0 means very confident matches."
                technical="Mean cosine similarity between user profile and recommended books" />
            </div>

            {/* Expandable details */}
            {expandRec && (
              <div style={{ borderTop: '1px solid #F4F1EA', paddingTop: '16px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

                {/* Stats */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
                  {[
                    { label: 'Test runs',              value: rec.totalEvaluations, tip: 'Number of readers tested using leave-one-out' },
                    { label: `Correct at top ${rec.k}`, value: rec.hitsAtK,         tip: 'Times the held-out book appeared in top recommendations' },
                    { label: 'Books in rotation',      value: `${rec.uniqueBooksRecommended} / ${rec.totalBooks}`, tip: 'Unique books the AI has recommended vs total catalog' },
                  ].map(({ label, value, tip }) => (
                    <div key={label} style={{ background: '#FAFAF9', border: '1px solid #F4F1EA', borderRadius: '8px', padding: '12px' }}>
                      <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{value}</div>
                      <div style={{ fontSize: '11px', fontWeight: '600', color: '#4A4947', marginTop: '2px' }}>{label}</div>
                      <div style={{ fontSize: '10px', color: '#A09E9A', marginTop: '2px' }}>{tip}</div>
                    </div>
                  ))}
                </div>

                {/* How it works — plain steps */}
                <div style={{ background: '#FAFAF9', border: '1px solid #F4F1EA', borderRadius: '10px', padding: '16px 20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 12px' }}>🔍 How the AI decides what to recommend</p>
                  {[
                    { step: '1', title: 'Reads your taste',             desc: "The AI looks at every book you've borrowed and builds a \"taste profile\" — a fingerprint of the genres and themes you enjoy. Books you borrowed recently count more than older ones." },
                    { step: '2', title: 'Scores every available book',  desc: 'It then compares your taste profile against every available book in the catalog and gives each one a match score from 0 to 1.' },
                    { step: '3', title: 'Checks what similar readers liked', desc: "It also looks at other readers with similar tastes. If they loved a book you haven't read, that book gets a small bonus score." },
                    { step: '4', title: 'Returns the best matches',     desc: "The top-scoring books are shown as recommendations. If you're a new user with no history, it shows the highest-rated books in the library." },
                  ].map(({ step, title, desc }) => (
                    <div key={step} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start', marginBottom: '12px' }}>
                      <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: '#1B263B', color: '#fff', fontSize: '11px', fontWeight: '700', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '1px' }}>{step}</div>
                      <div>
                        <p style={{ fontSize: '12px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 2px' }}>{title}</p>
                        <p style={{ fontSize: '12px', color: '#716F6A', margin: 0, lineHeight: '1.5' }}>{desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Technical spec collapsible */}
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#8A8884', fontSize: '11px' }}>Technical details (for developers)</summary>
                  <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: '1.7', color: '#A09E9A', background: '#F9F7F3', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F4F1EA' }}>
                    Algorithm: Hybrid TF-IDF Content-Based Filtering + Collaborative Filtering (Jaccard similarity, top-5 neighbors, CF boost cap 0.30).<br />
                    Vectorization: IDF = log((N+1)/(df+1))+1 · Genre weight ×2 · Tag weight ×1.<br />
                    User profile: Recency-weighted average (newest=1.0, oldest=0.5).<br />
                    Evaluation: Leave-one-out cross-validation · K={rec.k} · F1@K = {(rec.f1AtK * 100).toFixed(1)}%
                  </div>
                </details>

              </div>
            )}
          </div>
        ) : null}
      </div>

      {/* ── OVERDUE PREDICTION MODEL ── */}
      <div className="content-panel-block">
        <div style={{ padding: '20px 24px', borderBottom: '1px solid #F4F1EA', cursor: 'pointer' }} onClick={() => setExpandOD(v => !v)}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                <Target size={20} color="#D4A373" />
                <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700' }}>Overdue Return Predictor</h3>
                {od?.trained && <HealthBadge score={odHealthScore} />}
              </div>
              <p style={{ fontSize: '13px', color: '#4A4947', marginTop: '6px', lineHeight: '1.5' }}>
                <strong>What it does:</strong> Predicts which borrowed books are at risk of being returned late, so librarians can follow up proactively.
              </p>
            </div>
            <div style={{ marginLeft: '16px', flexShrink: 0 }}>
              {expandOD ? <ChevronUp size={18} color="#8A8884" /> : <ChevronDown size={18} color="#8A8884" />}
            </div>
          </div>
        </div>

        {od && !od.trained ? (
          <div style={{ padding: '20px 24px' }}>
            <div style={{ background: '#FFF7ED', border: '1px solid #FED7AA', borderRadius: '8px', padding: '14px 16px', fontSize: '13px', color: '#92400E' }}>
              ⚠ {od.message || 'No borrow transactions found yet. The model will train automatically once students start borrowing books.'}
            </div>
          </div>
        ) : od ? (
          <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {od.note && (
              <div style={{ background: '#EFF6FF', border: '1px solid #BFDBFE', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#1D4ED8' }}>
                ℹ️ <strong>Note:</strong> {od.note}
              </div>
            )}

            {/* Plain summary */}
            <div style={{ background: '#F9F7F3', borderRadius: '10px', padding: '16px 20px' }}>
              <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 8px' }}>📊 In plain terms</p>
              <p style={{ fontSize: '13px', color: '#4A4947', lineHeight: '1.6', margin: 0 }}>
                {od.classDistribution?.overdue === 0
                  ? `The model has been trained on ${od.sampleSize} loan record${od.sampleSize !== 1 ? 's' : ''}. So far, all returns have been on time — great news! The model is ready and will start producing accuracy scores once it sees its first late return.`
                  : `The model was trained on ${od.sampleSize} completed loans (${od.classDistribution?.overdue} overdue, ${od.classDistribution?.onTime} on time). It correctly identifies overdue returns ${(od.metrics.recall * 100).toFixed(0)}% of the time.`
                }
              </p>
            </div>

            {/* Metric explainers */}
            <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
              <MetricExplainer title="Accuracy" value={(od.metrics.accuracy * 100).toFixed(1) + '%'} good={od.metrics.accuracy >= 0.7}
                plain="Out of all predictions made, how many were correct (both overdue and on-time)?"
                technical="(True Positives + True Negatives) / Total predictions" />
              <MetricExplainer title="Catch Rate" value={(od.metrics.recall * 100).toFixed(1) + '%'} good={od.metrics.recall >= 0.6}
                plain="Of all the books that were actually returned late, how many did the AI flag in advance?"
                technical="Recall = True Positives / (True Positives + False Negatives)" />
              <MetricExplainer title="Alert Precision" value={(od.metrics.precision * 100).toFixed(1) + '%'} good={od.metrics.precision >= 0.6}
                plain="When the AI raises an overdue alert, how often is it actually right? Avoids unnecessary follow-ups."
                technical="Precision = True Positives / (True Positives + False Positives)" />
              <MetricExplainer title="AUC-ROC" value={od.metrics.auc?.toFixed(3) ?? '—'} good={od.metrics.auc >= 0.7}
                plain="Overall quality score from 0.5 (random guessing) to 1.0 (perfect). Above 0.7 is considered good."
                technical="Area under the Receiver Operating Characteristic curve" />
            </div>

            {/* Training stats */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
              {[
                { label: 'Loans used for training', value: od.sampleSize,  tip: 'More data = smarter model' },
                { label: 'Test folds',               value: od.folds,       tip: 'How many times the model was tested on unseen data' },
                { label: 'Overdue rate in data',     value: od.classDistribution ? `${(od.classDistribution.positiveRate * 100).toFixed(0)}%` : 'N/A', tip: 'Percentage of training loans that were returned late' },
              ].map(({ label, value, tip }) => (
                <div key={label} style={{ background: '#FAFAF9', border: '1px solid #F4F1EA', borderRadius: '8px', padding: '12px' }}>
                  <div style={{ fontSize: '20px', fontWeight: '700', color: '#1A1A1A' }}>{value}</div>
                  <div style={{ fontSize: '11px', fontWeight: '600', color: '#4A4947', marginTop: '2px' }}>{label}</div>
                  <div style={{ fontSize: '10px', color: '#A09E9A', marginTop: '2px' }}>{tip}</div>
                </div>
              ))}
            </div>

            {expandOD && (
              <div style={{ borderTop: '1px solid #F4F1EA', paddingTop: '20px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* What signals the AI uses */}
                <div style={{ background: '#FAFAF9', border: '1px solid #F4F1EA', borderRadius: '10px', padding: '16px 20px' }}>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 6px' }}>🔍 What signals does the AI use?</p>
                  <p style={{ fontSize: '12px', color: '#716F6A', margin: '0 0 14px', lineHeight: '1.5' }}>
                    The model looks at 5 signals for each active loan. The bar shows how much each signal influences the prediction.
                  </p>
                  {od.featureImportance?.map(f => {
                    const fd = {
                      'Days Remaining (normalized)': { icon: '📅', plain: 'How many days until the book is due',                    impact: f.weight < 0 ? 'More days left → lower risk' : 'Fewer days left → higher risk' },
                      'User Return Rate':             { icon: '📈', plain: 'How reliably this student returns books on time',         impact: f.weight < 0 ? 'Better track record → lower risk' : 'Poor track record → higher risk' },
                      'Prior Overdue Count':          { icon: '⚠️', plain: 'How many times this student has been late before',       impact: 'More past late returns → higher risk' },
                      'Loan Duration':                { icon: '⏱️', plain: 'How long the borrowing period is',                       impact: 'Longer loan period → affects risk' },
                      'Active Loans Count':           { icon: '📚', plain: 'How many books this student currently has borrowed',     impact: 'More books at once → may affect return rate' },
                    }[f.name] || { icon: '•', plain: f.name, impact: '' };
                    return (
                      <div key={f.name} style={{ marginBottom: '14px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
                          <div>
                            <span style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A' }}>{fd.icon} {fd.plain}</span>
                            <p style={{ fontSize: '11px', color: '#8A8884', margin: '1px 0 0' }}>{fd.impact}</p>
                          </div>
                          <span style={{ fontSize: '12px', fontWeight: '700', color: '#1A1A1A', flexShrink: 0, marginLeft: '12px' }}>{(f.importance * 100).toFixed(0)}% influence</span>
                        </div>
                        <div className="progress-bar-track">
                          <div className="progress-bar-fill" style={{ width: `${f.importance * 100}%`, backgroundColor: f.weight < 0 ? '#10B981' : '#EF4444' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>

                {/* Confusion matrix */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 6px' }}>🎯 Prediction Results Breakdown</p>
                  <p style={{ fontSize: '12px', color: '#716F6A', margin: '0 0 12px', lineHeight: '1.5' }}>
                    This shows how the AI's predictions compared to what actually happened during testing.
                  </p>
                  <ConfusionMatrix {...od.confusionMatrix} />
                </div>

                {/* ROC curve */}
                <div>
                  <p style={{ fontSize: '13px', fontWeight: '600', color: '#1A1A1A', margin: '0 0 6px' }}>📉 Sensitivity vs. Specificity Curve</p>
                  <p style={{ fontSize: '12px', color: '#716F6A', margin: '0 0 12px', lineHeight: '1.5' }}>
                    This curve shows the trade-off between catching overdue books (sensitivity) and avoiding false alarms (specificity). The closer the curve hugs the top-left corner, the better the model.
                  </p>
                  <RocCurve points={od.rocCurve} auc={od.metrics.auc?.toFixed(3)} />
                </div>

                {/* Technical spec */}
                <details>
                  <summary style={{ cursor: 'pointer', fontWeight: '600', color: '#8A8884', fontSize: '11px' }}>Technical details (for developers)</summary>
                  <div style={{ marginTop: '8px', fontSize: '11px', lineHeight: '1.7', color: '#A09E9A', background: '#F9F7F3', padding: '10px 12px', borderRadius: '8px', border: '1px solid #F4F1EA' }}>
                    Algorithm: Binary Logistic Regression · P(overdue) = σ(w·x + b) · Threshold = 0.5<br />
                    Training: Gradient descent · lr=0.05 · 800 epochs · L2 regularization λ=0.01<br />
                    Evaluation: {od.folds}-fold cross-validation · {od.sampleSize} samples<br />
                    Model weights: [{od.modelWeights?.join(', ')}] · Bias: {od.bias}<br />
                    Retraining: Automatic every 10 minutes as new transactions complete.
                  </div>
                </details>

              </div>
            )}
          </div>
        ) : null}
      </div>

    </div>
  );
}

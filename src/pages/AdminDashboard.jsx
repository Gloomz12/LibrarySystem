import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Users, Repeat, TriangleAlert,
  TrendingUp, Clock, Sparkles,
} from 'lucide-react';
import { api } from '../api/client';

export default function AdminDashboard() {
  const [data,    setData]    = useState(null);
  const [recs,    setRecs]    = useState([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, recommendations] = await Promise.all([
          api.getAdminDashboard(),
          api.getRecommendations(3),
        ]);
        setData(dash);
        setRecs(recommendations);
      } catch (err) {
        setError('Failed to load dashboard.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <main id="scroll-container">
        <div className="max-width-limiter">
          <div className="loading-state-block">Loading dashboard…</div>
        </div>
      </main>
    );
  }

  if (error || !data) {
    return (
      <main id="scroll-container">
        <div className="max-width-limiter">
          <div className="error-state-block">{error || 'Failed to load data'}</div>
        </div>
      </main>
    );
  }

  const { stats, genreDistribution, overduePredictions } = data;

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">

        <div className="view-heading-group">
          <h1>Dashboard</h1>
          <p>Overview of your library system and intelligent insights</p>
        </div>

        {/* KPI Cards */}
        <div className="analytics-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total Books</span>
              <BookOpen size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">{stats.totalBooks}</div>
            <div className="kpi-subtext">
              <span className="kpi-highlight-green">{stats.availableBooks} available</span>
              {' '}| {stats.borrowedBooks} borrowed
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Active Borrowers</span>
              <Users size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">{stats.totalStudents}</div>
            <div className="kpi-subtext">{stats.pendingRequests} pending request(s)</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total Transactions</span>
              <Repeat size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">{stats.totalTransactions}</div>
            <div className="kpi-subtext">{stats.borrows} borrows, {stats.returns} returns</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Overdue Alerts</span>
              <TriangleAlert size={16} color="#EF4444" />
            </div>
            <div className="kpi-value text-alert">{stats.overdueAlerts}</div>
            <div className="kpi-subtext">High-risk predictions flagged</div>
          </div>
        </div>

        <div className="workspace-split-row">

          {/* Overdue Predictions */}
          <div className="content-panel-block">
            <div className="panel-header-block">
              <div className="panel-title-group">
                <TrendingUp size={16} color="#D4A373" />
                <h3>Overdue Predictions</h3>
              </div>
              <p className="panel-subtitle-text">AI risk analysis based on borrowing patterns</p>
            </div>
            <div className="panel-body-content">
              {overduePredictions.length === 0 ? (
                <p className="empty-state-placeholder-text" style={{ padding: '16px' }}>No active loans to analyze</p>
              ) : (
                overduePredictions.map((item) => (
                  <div key={item.transaction_id} className="prediction-row-item">
                    <div className="prediction-meta-side">
                      <div className="book-badge-icon" style={{ backgroundColor: item.bg_banner }}>
                        {item.code}
                      </div>
                      <div className="text-truncator">
                        <div className="row-title-header">
                          <span className="book-title-string">{item.title}</span>
                          <span className={`risk-pill-indicator ${
                            item.riskTier === 'high risk'   ? 'risk-high'   :
                            item.riskTier === 'medium risk' ? 'risk-medium' : 'risk-low'
                          }`}>
                            {item.riskTier}
                          </span>
                        </div>
                        <p className="row-assignment-string">
                          Borrowed by {item.borrower_name} · Due {item.due_date}
                          {item.isOverdue && <span style={{ color: '#EF4444', marginLeft: '6px' }}>OVERDUE</span>}
                        </p>
                      </div>
                    </div>
                    <div className="prediction-chart-side">
                      <div className="progress-bar-track">
                        <div className="progress-bar-fill" style={{ width: `${item.riskScore}%` }} />
                      </div>
                      <span className="percentage-text-label">{item.riskScore}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Genre Distribution */}
          <div className="content-panel-block">
            <div className="panel-header-block">
              <div className="panel-title-group">
                <Clock size={16} color="#D4A373" />
                <h3>Genre Distribution</h3>
              </div>
            </div>
            <div className="panel-body-content genre-list-scrollway">
              {genreDistribution.map((genre) => {
                const maxCount = genreDistribution[0]?.count || 1;
                return (
                  <div key={genre.name} className="genre-metrics-row">
                    <div className="genre-text-header">
                      <span>{genre.name}</span>
                      <strong>{genre.count}</strong>
                    </div>
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${(genre.count / maxCount) * 100}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

        {/* Smart Recommendations */}
        <div className="content-panel-block">
          <div className="panel-header-block">
            <div className="panel-title-group">
              <Sparkles size={16} color="#D4A373" />
              <h3>Smart Recommendations</h3>
            </div>
            <p className="panel-subtitle-text">AI-powered book suggestions based on reading history</p>
          </div>
          <div className="panel-body-content">
            {recs.length === 0 ? (
              <p className="empty-state-placeholder-text" style={{ padding: '16px' }}>No recommendations available</p>
            ) : (
              <div className="ml-pipelines-grid">
                <div className="pipeline-user-container">
                  <div className="recommendations-deck-row">
                    {recs.map((book) => (
                      <Link key={book.id} to={`/main/catalog/${book.id}`} className="recom-card-item" style={{ textDecoration: 'none' }}>
                        <div className="recom-cover-placeholder" style={{ backgroundColor: book.bg_banner }}>
                          {book.code}
                        </div>
                        <p className="recom-book-title">{book.title}</p>
                        <span className="status-tag-pill">{book.status}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

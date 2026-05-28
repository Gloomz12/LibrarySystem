import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  BookOpen, Bookmark, Clock, TriangleAlert,
  Library, ArrowRight, Bell, Sparkles, CalendarClock,
} from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';
import { formatSqlDate, getLiveClock } from '../utils/dateFormat';

export default function StudentDashboard() {
  const { user } = useAuth();
  const [dashData,  setDashData]  = useState(null);
  const [recs,      setRecs]      = useState([]);
  const [loading,   setLoading]   = useState(true);
  const [error,     setError]     = useState('');
  const [clock,     setClock]     = useState(getLiveClock());

  // Live clock
  useEffect(() => {
    const t = setInterval(() => setClock(getLiveClock()), 1000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => {
    const load = async () => {
      try {
        const [dash, recommendations] = await Promise.all([
          api.getStudentDashboard(),
          api.getRecommendations(4),
        ]);
        setDashData(dash);
        setRecs(recommendations);
      } catch (err) {
        setError('Failed to load dashboard data.');
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
        <div className="dashboard-view-container">
          <div className="loading-state-block">Loading dashboard…</div>
        </div>
      </main>
    );
  }

  if (error) {
    return (
      <main id="scroll-container">
        <div className="dashboard-view-container">
          <div className="error-state-block">{error}</div>
        </div>
      </main>
    );
  }

  const { stats, activeLoans, pendingRequests } = dashData;

  const statCards = [
    { id: 'borrowed', label: 'Borrowed',         value: stats.borrowed,        subtext: stats.borrowed > 0 ? 'Active loans' : 'No active loans', status: 'success', icon: BookOpen },
    { id: 'pending',  label: 'Pending Requests',  value: stats.pendingRequests, subtext: `${stats.pendingRequests} request(s)`,                   status: 'neutral', icon: Bookmark },
    { id: 'due',      label: 'Due Soon',           value: stats.dueSoon,         subtext: 'Within 3 days',                                         status: stats.dueSoon > 0 ? 'warning' : 'success', icon: Clock },
    { id: 'fines',    label: 'Fines',              value: `${stats.fines}`,     subtext: parseFloat(stats.fines) > 0 ? 'Outstanding' : 'No fines', status: parseFloat(stats.fines) > 0 ? 'warning' : 'success', icon: TriangleAlert },
  ];

  return (
    <main id="scroll-container">
      <div className="dashboard-view-container">

        <div className="view-heading-group" style={{ marginBottom: '24px' }}>
          <h1>Hello, {user?.name?.split(' ')[0] || 'Student'}</h1>
          <p>Here's what's happening with your library account</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px', fontSize: '12px', color: '#8A8884' }}>
            <CalendarClock size={13} />
            <span>{clock}</span>
          </div>
        </div>

        <div className="dashboard-stats-deck">
          {statCards.map((stat) => {
            const IconComponent = stat.icon;
            return (
              <div key={stat.id} className="stat-overview-card">
                <div className="stat-card-header-row">
                  <span className="stat-label-text">{stat.label}</span>
                  <IconComponent size={16} className={`stat-icon-type-${stat.status}`} />
                </div>
                <div className="stat-card-numeric-display">
                  <div className={`stat-metric-value value-style-${stat.status}`}>{stat.value}</div>
                  <div className="stat-metric-subtext">{stat.subtext}</div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="dashboard-split-workspace-grid" style={{ marginTop: '24px' }}>

          {/* Currently Borrowed */}
          <div className="content-panel-block workspace-col-span-2">
            <div className="panel-header-block">
              <div className="panel-header-title-flex">
                <Library size={18} className="panel-icon-brand" />
                <h3>Currently Borrowed</h3>
              </div>
              <Link to="/main/my-books" className="btn-link-action-forward">
                <span>View All</span>
                <ArrowRight size={14} />
              </Link>
            </div>

            <div className="panel-body-content">
              {activeLoans.length === 0 ? (
                <div className="flex-center-empty-state">
                  <p className="empty-state-placeholder-text">No books currently borrowed</p>
                </div>
              ) : (
                <div className="dashboard-borrowed-list-stack">
                  {activeLoans.map((loan) => {
                    const daysLeft = parseInt(loan.days_remaining);
                    const timeLeft = daysLeft < 0
                      ? `${Math.abs(daysLeft)} days overdue`
                      : daysLeft === 0
                      ? 'Due today'
                      : `${daysLeft} days left`;

                    return (
                      <Link key={loan.transaction_id} to={`/main/catalog/${loan.book_id}`} className="dashboard-loan-strip-item">
                        <div className="loan-item-left-segment">
                          <div className="loan-book-avatar" style={{ backgroundColor: loan.bg_banner }}>
                            {loan.code}
                          </div>
                          <div className="text-truncator">
                            <p className="loan-book-title-text">{loan.title}</p>
                            <p className="loan-book-author-text">{loan.author}</p>
                          </div>
                        </div>
                        <div className="loan-item-right-segment">
                          <span className={`badge-time-remaining-pill ${daysLeft <= 3 ? 'badge-urgent' : ''}`}>
                            {timeLeft}
                          </span>
                          <span className="loan-absolute-due-date">
                            Due {formatSqlDate(loan.due_date)}
                          </span>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Pending Requests */}
          <div className="content-panel-block">
            <div className="panel-header-block">
              <div className="panel-header-title-flex">
                <Bell size={18} className="panel-icon-brand" />
                <h3>Pending</h3>
              </div>
            </div>
            <div className="panel-body-content">
              {pendingRequests.length === 0 ? (
                <div className="flex-center-empty-state">
                  <p className="empty-state-placeholder-text">No pending requests</p>
                </div>
              ) : (
                <div className="dashboard-borrowed-list-stack">
                  {pendingRequests.map((req) => (
                    <Link key={req.transaction_id} to={`/main/catalog/${req.book_id}`} className="dashboard-loan-strip-item">
                      <div className="loan-item-left-segment">
                        <div className="loan-book-avatar" style={{ backgroundColor: req.bg_banner }}>
                          {req.code}
                        </div>
                        <div className="text-truncator">
                          <p className="loan-book-title-text">{req.title}</p>
                          <p className="loan-book-author-text">{req.author}</p>
                        </div>
                      </div>
                      <span className="badge-awaiting-confirmation">
                        {req.type === 'borrow_request' ? 'Borrow Pending' : 'Return Pending'}
                      </span>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>

        {/* AI Recommendations */}
        <div className="content-panel-block" style={{ marginTop: '24px' }}>
          <div className="panel-header-block" style={{ flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
            <div className="panel-header-title-flex">
              <Sparkles size={18} className="panel-icon-brand" />
              <h3>Recommended For You</h3>
            </div>
            <p className="panel-header-subtitle-desc">Based on your reading history</p>
          </div>

          <div className="panel-body-content" style={{ padding: '20px' }}>
            {recs.length === 0 ? (
              <p className="empty-state-placeholder-text">No recommendations yet — borrow some books to get started!</p>
            ) : (
              <div className="dashboard-recommendations-grid">
                {recs.map((rec) => (
                  <Link key={rec.id} to={`/main/catalog/${rec.id}`} className="recommendation-interactive-card">
                    <div className="recommendation-cover-thumbnail" style={{ backgroundColor: rec.bg_banner }}>
                      {rec.code}
                    </div>
                    <p className="recommendation-title-clamped">{rec.title}</p>
                    <p className="recommendation-author-text-sub">{rec.author}</p>
                    <span className="badge-availability-pill">{rec.status}</span>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

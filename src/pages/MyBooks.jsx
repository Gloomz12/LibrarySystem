import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Star, Calendar, ArrowRight, BookOpen, RotateCcw, X } from 'lucide-react';
import { api } from '../api/client';

export default function MyBooks() {
  const [loans,       setLoans]       = useState([]);
  const [pending,     setPending]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [actionError, setActionError] = useState('');

  const loadData = async () => {
    setLoading(true);
    setError('');
    try {
      const [loansData, txData] = await Promise.all([
        api.getUserLoans('me'),
        api.getTransactions({ type: 'return_request', status: 'pending' }),
      ]);
      setLoans(loansData);
      setPending(txData.transactions);
    } catch (err) {
      setError('Failed to load your books.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadData(); }, []);

  const handleRequestReturn = async (transactionId) => {
    setActionError('');
    try {
      await api.returnRequest(transactionId);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to submit return request.');
    }
  };

  const handleCancelReturn = async (txId) => {
    setActionError('');
    try {
      await api.cancelRequest(txId);
      await loadData();
    } catch (err) {
      setActionError(err.message || 'Failed to cancel request.');
    }
  };

  // Check if a loan has a pending return request
  const hasPendingReturn = (bookId) =>
    pending.some(p => p.book_id === bookId);

  if (loading) {
    return (
      <main id="scroll-container">
        <div className="mybooks-view-container">
          <div className="loading-state-block">Loading your books…</div>
        </div>
      </main>
    );
  }

  return (
    <main id="scroll-container">
      <div className="mybooks-view-container">

        <div className="view-heading-group" style={{ marginBottom: '24px' }}>
          <h1>My Books</h1>
          <p>Your borrowed books and reading activity</p>
        </div>

        {error && <div className="error-state-block" style={{ marginBottom: '16px' }}>{error}</div>}
        {actionError && <div className="error-state-block" style={{ marginBottom: '16px' }}>{actionError}</div>}

        {loans.length === 0 ? (
          <div className="content-panel-block">
            <div className="panel-body-content flex-center-empty-state" style={{ minHeight: '200px' }}>
              <p className="empty-state-placeholder-text">You have no borrowed books right now.</p>
            </div>
          </div>
        ) : (
          <div className="mybooks-cards-grid">
            {loans.map((loan) => {
              const pendingReturn = hasPendingReturn(loan.book_id);
              const daysLeft      = parseInt(loan.days_remaining);
              const isOverdue     = daysLeft < 0;

              return (
                <div key={loan.transaction_id} className="book-display-card">
                  <div className="book-cover-banner" style={{ backgroundColor: loan.bg_banner }}>
                    <div className="cover-typography-wrapper">
                      <h2 className="cover-title-serif">{loan.title}</h2>
                      <p className="cover-author-subtext">{loan.author}</p>
                    </div>
                  </div>

                  <div className="book-card-body-details">
                    <div className="card-status-rating-ribbon">
                      <span className={`badge-borrow-pill ${isOverdue ? 'badge-overdue' : ''}`}>
                        {isOverdue ? 'Overdue' : 'Borrowed'}
                      </span>
                      <div className="card-star-score-box">
                        <Star size={13} className="star-icon-filled" />
                        <span>{loan.rating}</span>
                      </div>
                    </div>

                    <div className="card-calendar-due-row" style={{ color: isOverdue ? '#EF4444' : undefined }}>
                      <Calendar size={14} />
                      <span>Due: {loan.due_date}</span>
                      {isOverdue && <span style={{ fontSize: '11px', fontWeight: 600 }}>({Math.abs(daysLeft)}d overdue)</span>}
                    </div>

                    <div className="card-action-buttons-flex">
                      <Link to={`/main/catalog/${loan.book_id}`} className="btn-card-secondary flex-1">
                        <span>Details</span>
                        <ArrowRight size={14} />
                      </Link>

                      {pendingReturn ? (
                        <button className="btn-card-disabled flex-1" disabled>
                          Return Pending
                        </button>
                      ) : (
                        <button
                          onClick={() => handleRequestReturn(loan.transaction_id)}
                          className="btn-card-primary flex-1"
                        >
                          <BookOpen size={14} />
                          <span>Request Return</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Pending Return Requests */}
        <div className="content-panel-block" style={{ marginTop: '32px' }}>
          <div className="panel-header-block" style={{ borderBottom: '1px solid #F4F1EA' }}>
            <div className="panel-header-title-flex">
              <RotateCcw size={18} className="rotate-icon-accent" />
              <h3 style={{ fontSize: '15px', fontWeight: '600' }}>
                Pending Return Requests ({pending.length})
              </h3>
            </div>
          </div>

          <div className="panel-body-content" style={{ padding: '16px 24px' }}>
            <div className="pending-requests-stack">
              {pending.length > 0 ? (
                pending.map((req) => (
                  <div key={req.id} className="pending-strip-row">
                    <div className="pending-left-payload">
                      <Link to={`/main/catalog/${req.book_id}`}>
                        <div className="pending-micro-thumb" style={{ backgroundColor: req.bg_banner }}>
                          {req.code}
                        </div>
                      </Link>
                      <div className="text-truncator">
                        <Link to={`/main/catalog/${req.book_id}`} className="pending-title-link">
                          {req.title}
                        </Link>
                        <p className="pending-timestamp-subtext">
                          Requested on {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    <div className="pending-right-meta-actions">
                      <span className="badge-awaiting-confirmation">Awaiting Confirmation</span>
                      <button
                        onClick={() => handleCancelReturn(req.id)}
                        className="btn-icon-cancel-request"
                        title="Cancel return request"
                      >
                        <X size={15} />
                      </button>
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '24px 0', color: '#A09E9A', fontSize: '13px' }}>
                  No pending return requests.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

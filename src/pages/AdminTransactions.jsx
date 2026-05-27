import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft, BookOpen, RotateCcw,
  Search, ClipboardList,
  User, Calendar, CircleCheckBig, CircleX,
} from 'lucide-react';
import { api } from '../api/client';

export default function AdminTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [pending,      setPending]      = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');
  const [actionMsg,    setActionMsg]    = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [dueDates,    setDueDates]    = useState({}); // txId → date string

  const loadData = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [txResult, pendingResult] = await Promise.all([
        api.getTransactions({ limit: 100 }),
        api.getPendingRequests(),
      ]);
      // Show only completed/approved transactions in history
      const history = txResult.transactions.filter(t =>
        (t.type === 'borrow' && t.status === 'approved') ||
        (t.type === 'return' && t.status === 'completed')
      );
      setTransactions(history);
      setPending(pendingResult);
    } catch (err) {
      setError('Failed to load transactions.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { loadData(); }, [loadData]);

  const handleApprove = async (txId) => {
    setActionMsg('');
    try {
      const dueDate = dueDates[txId] || undefined;
      await api.approveRequest(txId, dueDate);
      setActionMsg('Request approved successfully.');
      await loadData();
    } catch (err) {
      setActionMsg(err.message || 'Failed to approve request.');
    }
  };

  const handleDecline = async (txId) => {
    setActionMsg('');
    try {
      await api.declineRequest(txId);
      setActionMsg('Request declined.');
      await loadData();
    } catch (err) {
      setActionMsg(err.message || 'Failed to decline request.');
    }
  };

  const filtered = transactions.filter(tx =>
    !searchQuery ||
    tx.title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.borrower_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.borrower_student_id?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalCount   = filtered.length;
  const borrowsCount = filtered.filter(t => t.type === 'borrow').length;
  const returnsCount = filtered.filter(t => t.type === 'return').length;

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">

        <div className="view-heading-group">
          <h1>Transactions</h1>
          <p>Manage borrow and return requests</p>
        </div>

        {/* Stats */}
        <div className="analytics-grid">
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-blue"><ArrowRightLeft size={18} /></div>
            <div><p className="tx-metric-value">{totalCount}</p><p className="tx-metric-label">Total transactions</p></div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-green"><BookOpen size={18} /></div>
            <div><p className="tx-metric-value">{borrowsCount}</p><p className="tx-metric-label">Borrows</p></div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-orange"><RotateCcw size={18} /></div>
            <div><p className="tx-metric-value">{returnsCount}</p><p className="tx-metric-label">Returns</p></div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-sky"><ClipboardList size={18} /></div>
            <div><p className="tx-metric-value">{pending.length}</p><p className="tx-metric-label">Pending requests</p></div>
          </div>
        </div>

        {actionMsg && (
          <div className={`action-feedback-banner ${actionMsg.includes('Failed') || actionMsg.includes('failed') ? 'banner-error' : 'banner-success'}`} style={{ marginTop: '16px' }}>
            {actionMsg}
          </div>
        )}

        {/* Pending Requests */}
        {pending.length > 0 && (
          <div className="pending-requests-card" style={{ marginTop: '24px' }}>
            <div className="pending-requests-header">
              <ClipboardList size={18} />
              <h3>Pending Requests ({pending.length})</h3>
            </div>

            <div className="pending-requests-body">
              {pending.map((req) => {
                const defaultDue = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
                  .toISOString().split('T')[0];

                return (
                  <div key={req.transaction_id} className="pending-request-row">
                    <div className="tx-info-block">
                      <Link to={`/main/catalog/${req.book_id}`}>
                        <div className="cover-micro-thumb" style={{ backgroundColor: req.bg_banner }}>
                          {req.code}
                        </div>
                      </Link>
                      <div className="text-truncator">
                        <Link to={`/main/catalog/${req.book_id}`} className="tx-title-link">
                          {req.title}
                        </Link>
                        <div className="details-author-row">
                          <User size={12} />
                          <span>{req.borrower_name}</span>
                          <span className="meta-split-pipe">|</span>
                          <span>{req.borrower_student_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="pending-action-controls-wrapper">
                      <span className={`badge-request-type ${req.type === 'borrow_request' ? 'badge-request-borrow' : 'badge-request-return'}`}>
                        {req.type === 'borrow_request' ? 'Borrow Request' : 'Return Request'}
                      </span>

                      <div className="pending-action-controls-wrapper" style={{ flexDirection: 'row', gap: '8px' }}>
                        {req.type === 'borrow_request' && (
                          <div className="details-author-row" style={{ marginTop: 0 }}>
                            <Calendar size={14} style={{ color: '#8A8884' }} />
                            <input
                              type="date"
                              className="pending-date-input-field"
                              defaultValue={defaultDue}
                              onChange={e => setDueDates(prev => ({ ...prev, [req.transaction_id]: e.target.value }))}
                            />
                          </div>
                        )}

                        <div className="btn-pending-action-group">
                          <button
                            type="button"
                            className="btn-admin-accept"
                            onClick={() => handleApprove(req.transaction_id)}
                          >
                            <CircleCheckBig size={14} />
                            <span>{req.type === 'return_request' ? 'Confirm Return' : 'Accept'}</span>
                          </button>
                          {req.type === 'borrow_request' && (
                            <button
                              type="button"
                              className="btn-admin-decline"
                              onClick={() => handleDecline(req.transaction_id)}
                            >
                              <CircleX size={14} />
                              <span>Decline</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Search */}
        <div className="catalog-filter-bar">
          <div className="filter-flex-wrapper">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-embedded" />
              <input
                type="text"
                className="catalog-search-field"
                placeholder="Search by book, borrower, or ID…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>
          </div>
        </div>

        {error && <div className="error-state-block" style={{ marginBottom: '16px' }}>{error}</div>}

        {/* Transaction History */}
        <div className="content-panel-block">
          <div className="panel-header-block">
            <h3>Transaction History</h3>
          </div>
          <div className="panel-body-content">
            <div className="tx-ledger-list">
              {loading ? (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#A09E9A', fontSize: '14px' }}>Loading…</div>
              ) : filtered.length > 0 ? (
                filtered.map((tx) => (
                  <div key={tx.id} className="tx-row-item">
                    <div className="tx-info-block">
                      <Link to={`/main/catalog/${tx.book_id}`}>
                        <div className="cover-micro-thumb" style={{ backgroundColor: tx.bg_banner }}>
                          {tx.code}
                        </div>
                      </Link>
                      <div className="text-truncator">
                        <Link to={`/main/catalog/${tx.book_id}`} className="tx-title-link">
                          {tx.title}
                        </Link>
                        <div className="details-author-row">
                          <span>{tx.borrower_name}</span>
                          <span className="meta-split-pipe">|</span>
                          <span>{tx.borrower_student_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tx-meta-row-data">
                      <div className="tx-data-capsule" style={{ color: '#716F6A' }}>
                        <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-tag-badge ${tx.type === 'borrow' ? 'status-badge-borrowed' : 'status-badge-returned'}`}>
                        {tx.type === 'borrow' ? 'Borrowed' : 'Returned'}
                      </span>
                      {tx.due_date && (
                        <span className="row-assignment-string">Due: {tx.due_date}</span>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div style={{ textAlign: 'center', padding: '40px 0', color: '#A09E9A', fontSize: '14px' }}>
                  No transaction records match your search.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}

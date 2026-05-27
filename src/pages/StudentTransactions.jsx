import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRightLeft, BookOpen, RotateCcw, DollarSign,
  Search, ChevronDown, ArrowUpDown, User, Calendar,
} from 'lucide-react';
import { api } from '../api/client';

export default function StudentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading,      setLoading]      = useState(true);
  const [error,        setError]        = useState('');

  const [searchTerm,       setSearchTerm]       = useState('');
  const [typeFilter,       setTypeFilter]       = useState('all');
  const [sortBy,           setSortBy]           = useState('newest');
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        // Get all completed borrow/return transactions for this student
        const result = await api.getTransactions({ limit: 100 });
        // Filter to only show completed/approved transactions (not pending requests)
        const completed = result.transactions.filter(t =>
          (t.type === 'borrow' && t.status === 'approved') ||
          (t.type === 'return' && t.status === 'completed')
        );
        setTransactions(completed);
      } catch (err) {
        setError('Failed to load transactions.');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const stats = useMemo(() => {
    const totalCount   = transactions.length;
    const borrowsCount = transactions.filter(t => t.type === 'borrow').length;
    const returnsCount = transactions.filter(t => t.type === 'return').length;
    return { totalCount, borrowsCount, returnsCount };
  }, [transactions]);

  const filtered = useMemo(() => {
    let result = [...transactions];

    if (searchTerm.trim()) {
      const q = searchTerm.toLowerCase();
      result = result.filter(t =>
        t.title?.toLowerCase().includes(q) || t.id.toLowerCase().includes(q)
      );
    }

    if (typeFilter !== 'all') {
      result = result.filter(t => t.type === typeFilter);
    }

    result.sort((a, b) => {
      const da = new Date(a.created_at);
      const db = new Date(b.created_at);
      return sortBy === 'newest' ? db - da : da - db;
    });

    return result;
  }, [transactions, searchTerm, typeFilter, sortBy]);

  return (
    <main id="scroll-container">
      <div className="dashboard-view-container">

        <div className="view-heading-group" style={{ marginBottom: '24px' }}>
          <h1>Transactions</h1>
          <p>Your borrow and return history</p>
        </div>

        {/* Stats */}
        <div className="analytics-grid">
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-blue"><ArrowRightLeft size={18} /></div>
            <div>
              <div className="tx-metric-value">{stats.totalCount}</div>
              <div className="tx-metric-label">Total transactions</div>
            </div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-green"><BookOpen size={18} /></div>
            <div>
              <div className="tx-metric-value">{stats.borrowsCount}</div>
              <div className="tx-metric-label">Borrows</div>
            </div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-orange"><RotateCcw size={18} /></div>
            <div>
              <div className="tx-metric-value">{stats.returnsCount}</div>
              <div className="tx-metric-label">Returns</div>
            </div>
          </div>
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-sky"><DollarSign size={18} /></div>
            <div>
              <div className="tx-metric-value">{transactions.filter(t => t.type === 'borrow' && !t.returned_at).length}</div>
              <div className="tx-metric-label">Active loans</div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="catalog-filter-bar">
          <div className="filter-flex-wrapper">
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-embedded" />
              <input
                type="text"
                className="catalog-search-field"
                placeholder="Search by book title or ID…"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
              />
            </div>

            <div className="filter-selectors-group">
              <div style={{ position: 'relative' }}>
                <button type="button" className="dropdown-combobox-trigger" onClick={() => { setShowTypeDropdown(!showTypeDropdown); setShowSortDropdown(false); }}>
                  <div className="combobox-text-side">
                    <ArrowRightLeft size={14} />
                    <span className="capitalize-fallback">{typeFilter === 'all' ? 'All Types' : typeFilter}</span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />
                </button>
                {showTypeDropdown && (
                  <div className="custom-floating-select-menu">
                    <button type="button" onClick={() => { setTypeFilter('all');    setShowTypeDropdown(false); }}>All Types</button>
                    <button type="button" onClick={() => { setTypeFilter('borrow'); setShowTypeDropdown(false); }}>Borrowed</button>
                    <button type="button" onClick={() => { setTypeFilter('return'); setShowTypeDropdown(false); }}>Returned</button>
                  </div>
                )}
              </div>

              <div style={{ position: 'relative' }}>
                <button type="button" className="dropdown-combobox-trigger" onClick={() => { setShowSortDropdown(!showSortDropdown); setShowTypeDropdown(false); }}>
                  <div className="combobox-text-side">
                    <ArrowUpDown size={14} />
                    <span>{sortBy === 'newest' ? 'Date (Newest)' : 'Date (Oldest)'}</span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />
                </button>
                {showSortDropdown && (
                  <div className="custom-floating-select-menu">
                    <button type="button" onClick={() => { setSortBy('newest'); setShowSortDropdown(false); }}>Date (Newest)</button>
                    <button type="button" onClick={() => { setSortBy('oldest'); setShowSortDropdown(false); }}>Date (Oldest)</button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {error && <div className="error-state-block" style={{ marginBottom: '16px' }}>{error}</div>}

        <div className="content-panel-block">
          <div className="panel-header-block">
            <h3>Your Transaction History</h3>
          </div>
          <div className="panel-body-content">
            {loading ? (
              <div className="flex-center-empty-state" style={{ minHeight: '160px' }}>
                <p className="empty-state-placeholder-text">Loading…</p>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex-center-empty-state" style={{ minHeight: '160px' }}>
                <p className="empty-state-placeholder-text">No matching transactions found.</p>
              </div>
            ) : (
              <div className="tx-ledger-list">
                {filtered.map((tx) => (
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
                          <User size={12} style={{ marginRight: '2px' }} />
                          <span>{tx.borrower_name}</span>
                          <span className="meta-split-pipe">|</span>
                          <span>{tx.borrower_student_id}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tx-meta-row-data">
                      <div className="tx-data-capsule">
                        <Calendar size={12} />
                        <span>{new Date(tx.created_at).toLocaleDateString()}</span>
                      </div>
                      <span className={`status-tag-badge ${tx.type === 'borrow' ? 'status-badge-borrowed' : 'status-badge-returned'}`}>
                        {tx.type === 'borrow' ? 'Borrowed' : 'Returned'}
                      </span>
                      {tx.type === 'borrow' && tx.due_date && (
                        <span className="row-assignment-string">Due: {tx.due_date}</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}

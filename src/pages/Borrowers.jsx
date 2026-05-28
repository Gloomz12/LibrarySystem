import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, User, ChevronRight, Mail, BookOpen, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { formatSqlDate } from '../utils/dateFormat';

export default function Borrowers() {
  const [users,          setUsers]          = useState([]);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [activeTab,      setActiveTab]      = useState('active-loans');
  const [searchQuery,    setSearchQuery]    = useState('');

  const [activeUser,   setActiveUser]   = useState(null);
  const [activeLoans,  setActiveLoans]  = useState([]);
  const [history,      setHistory]      = useState([]);
  const [recs,         setRecs]         = useState([]);
  const [loadingUser,  setLoadingUser]  = useState(false);
  const [loadingList,  setLoadingList]  = useState(true);
  const [error,        setError]        = useState('');

  // Load user list
  useEffect(() => {
    api.getUsers()
      .then(data => {
        setUsers(data);
        if (data.length > 0) setSelectedUserId(data[0].id);
      })
      .catch(() => setError('Failed to load borrowers.'))
      .finally(() => setLoadingList(false));
  }, []);

  // Load selected user's data
  useEffect(() => {
    if (!selectedUserId) return;
    setLoadingUser(true);
    setActiveLoans([]);
    setHistory([]);
    setRecs([]);

    Promise.all([
      api.getUser(selectedUserId),
      api.getUserLoans(selectedUserId),
      api.getUserHistory(selectedUserId),
      api.getUserRecommendations(selectedUserId, 4),
    ])
      .then(([user, loans, hist, recommendations]) => {
        setActiveUser(user);
        setActiveLoans(loans);
        setHistory(hist);
        setRecs(recommendations);
      })
      .catch(() => setError('Failed to load user details.'))
      .finally(() => setLoadingUser(false));
  }, [selectedUserId]);

  const filteredUsers = users.filter(u =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    (u.student_id || '').toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">

        <div className="view-heading-group">
          <h1>Borrowers</h1>
          <p>Manage library members and their reading history</p>
        </div>

        {error && <div className="error-state-block" style={{ marginBottom: '16px' }}>{error}</div>}

        <div className="borrowers-workspace-layout">

          {/* Left: User list */}
          <div className="content-panel-block">
            <div className="search-field-padding-block">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-embedded" />
                <input
                  type="text"
                  className="catalog-search-field"
                  placeholder="Search borrowers…"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="borrower-selector-list">
              {loadingList ? (
                <p style={{ padding: '16px', color: '#A09E9A', fontSize: '13px' }}>Loading…</p>
              ) : filteredUsers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`btn-borrower-row-link ${selectedUserId === member.id ? 'selected-member-row' : ''}`}
                  onClick={() => { setSelectedUserId(member.id); setActiveTab('active-loans'); }}
                >
                  <div className="table-avatar" style={{ backgroundColor: 'rgba(27, 38, 59, 0.1)', color: 'var(--sidebar-bg)' }}>
                    <User size={16} />
                  </div>
                  <div className="text-truncator" style={{ flex: 1 }}>
                    <p className="borrower-name-string truncate">{member.name}</p>
                    <p className="borrower-email-string">{member.student_id}</p>
                  </div>
                  <ChevronRight size={16} className="search-icon-embedded" style={{ position: 'static', transform: 'none' }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right: User detail */}
          {activeUser && (
            <div className="right-profile-column" style={{ gap: '16px' }}>

              {/* Profile card */}
              <div className="content-panel-block profile-summary-header-card">
                <div className="header-flex-meta-tray">
                  <div className="table-profile-cell" style={{ gap: '16px' }}>
                    <div className="table-avatar" style={{ width: '56px', height: '56px', backgroundColor: 'rgba(27, 38, 59, 0.1)', color: 'var(--sidebar-bg)' }}>
                      <User size={28} />
                    </div>
                    <div className="header-badge-title-group">
                      <h2>{activeUser.name}</h2>
                      <div className="header-badge-subtitle-row">
                        <div className="details-author-row" style={{ marginTop: 0 }}>
                          <Mail size={14} /><span>{activeUser.email}</span>
                        </div>
                        <span className="meta-split-pipe">|</span>
                        <span>{activeUser.student_id}</span>
                        <span className="meta-split-pipe">|</span>
                        <span className={`risk-pill-indicator ${activeUser.riskTier === 'low risk' ? 'risk-low' : 'risk-high'}`}>
                          {activeUser.riskTier}
                        </span>
                      </div>
                      <div className="header-badge-subtitle-row" style={{ marginTop: '4px' }}>
                        <span style={{ fontSize: '12px', color: '#A09E9A' }}>
                          Return rate: {parseFloat(activeUser.return_rate).toFixed(0)}%
                        </span>
                        <span className="meta-split-pipe">|</span>
                        <span style={{ fontSize: '12px', color: '#A09E9A' }}>
                          {activeUser.history_count} books read
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="meta-numeric-fine-box">
                    <p>Fines</p>
                    <p>₱{parseFloat(activeUser.fines || 0).toFixed(2)}</p>
                  </div>
                </div>
              </div>

              {/* Tabs */}
              <div dir="ltr" className="w-full">
                <div className="navigation-tablist-track">
                  <button type="button" className={`btn-tab-trigger ${activeTab === 'active-loans' ? 'active-tab-state' : ''}`} onClick={() => setActiveTab('active-loans')}>
                    <BookOpen size={14} />
                    <span>Active Loans ({activeLoans.length})</span>
                  </button>
                  <button type="button" className={`btn-tab-trigger ${activeTab === 'reading-history' ? 'active-tab-state' : ''}`} onClick={() => setActiveTab('reading-history')}>
                    <BookOpen size={14} />
                    <span>Reading History ({history.length})</span>
                  </button>
                  <button type="button" className={`btn-tab-trigger ${activeTab === 'smart-recom' ? 'active-tab-state' : ''}`} onClick={() => setActiveTab('smart-recom')}>
                    <Sparkles size={14} />
                    <span>Smart Recommendations</span>
                  </button>
                </div>

                <div className="tab-content-panel-viewport">
                  {loadingUser ? (
                    <p style={{ padding: '16px', color: '#A09E9A', fontSize: '13px' }}>Loading…</p>
                  ) : (
                    <>
                      {/* Active Loans */}
                      {activeTab === 'active-loans' && (
                        <div className="loans-display-grid">
                          {activeLoans.length > 0 ? (
                            activeLoans.map((loan) => (
                              <Link key={loan.transaction_id} to={`/main/catalog/${loan.book_id}`} className="loan-card-micro-wrapper" style={{ textDecoration: 'none' }}>
                                <div className="micro-card-flex-aligner">
                                  <div className="cover-micro-thumb" style={{ backgroundColor: loan.bg_banner }}>{loan.code}</div>
                                  <div className="text-truncator" style={{ flex: 1 }}>
                                    <p className="details-book-title">{loan.title}</p>
                                    <p className="borrower-email-string">by {loan.author}</p>
                                  </div>
                                  <span className="risk-pill-indicator risk-low" style={{ fontSize: '9px' }}>
                                    Due {formatSqlDate(loan.due_date)}
                                  </span>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <p className="description-body-string" style={{ padding: '12px 4px' }}>No active loans.</p>
                          )}
                        </div>
                      )}

                      {/* Reading History */}
                      {activeTab === 'reading-history' && (
                        <div className="loans-display-grid">
                          {history.length > 0 ? (
                            history.map((book) => (
                              <Link key={book.book_id} to={`/main/catalog/${book.book_id}`} className="loan-card-micro-wrapper" style={{ textDecoration: 'none' }}>
                                <div className="micro-card-flex-aligner">
                                  <div className="cover-micro-thumb" style={{ backgroundColor: book.bg_banner }}>{book.code}</div>
                                  <div className="text-truncator">
                                    <p className="details-book-title">{book.title}</p>
                                    <p className="borrower-email-string">by {book.author}</p>
                                  </div>
                                </div>
                              </Link>
                            ))
                          ) : (
                            <p className="description-body-string" style={{ padding: '12px 4px' }}>No reading history.</p>
                          )}
                        </div>
                      )}

                      {/* Smart Recommendations */}
                      {activeTab === 'smart-recom' && (
                        <div className="content-panel-block" style={{ border: 'none', boxShadow: 'none', background: 'transparent' }}>
                          <div className="panel-header-block" style={{ padding: '0 0 16px 4px', borderBottom: 'none' }}>
                            <div className="panel-title-group">
                              <Sparkles size={16} color="#D4A373" />
                              <h4 style={{ fontSize: '14px', fontWeight: 'bold' }}>Personalized for {activeUser.name}</h4>
                            </div>
                            <p className="panel-subtitle-text">Based on genres and tags from their reading history</p>
                          </div>

                          <div className="catalog-inventory-grid" style={{ gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
                            {recs.length > 0 ? (
                              recs.map((book) => (
                                <Link key={book.id} to={`/main/catalog/${book.id}`} className="recom-card-item" style={{ textDecoration: 'none', backgroundColor: 'var(--color-card)' }}>
                                  <div className="recom-cover-placeholder" style={{ backgroundColor: book.bg_banner }}>{book.code}</div>
                                  <p className="recom-book-title">{book.title}</p>
                                  <p className="borrower-email-string" style={{ marginBottom: '6px' }}>{book.author}</p>
                                  <span className="status-tag-pill" style={{ marginTop: '0' }}>{book.status}</span>
                                </Link>
                              ))
                            ) : (
                              <p className="description-body-string" style={{ padding: '12px 4px', gridColumn: '1/-1' }}>No recommendations available.</p>
                            )}
                          </div>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

            </div>
          )}

        </div>
      </div>
    </main>
  );
}

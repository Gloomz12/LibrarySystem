import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Star, BookOpen, User, Calendar, Sparkles, Bookmark, CheckCircle2 } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function BookDetails() {
  const navigate = useNavigate();
  const { bookId } = useParams();
  const { user } = useAuth();

  const [book,        setBook]        = useState(null);
  const [similar,     setSimilar]     = useState([]);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [actionMsg,   setActionMsg]   = useState('');

  const loadBook = async () => {
    setLoading(true);
    setError('');
    try {
      const [bookData, similarData] = await Promise.all([
        api.getBook(bookId),
        api.getSimilarBooks(bookId, 4),
      ]);
      setBook(bookData);
      setSimilar(similarData);
    } catch (err) {
      setError('Book not found.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadBook(); }, [bookId]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleBorrowRequest = async () => {
    setIsSubmitting(true);
    setActionMsg('');
    try {
      await api.borrowRequest(book.id);
      setActionMsg('Borrow request submitted! Awaiting admin approval.');
      await loadBook(); // Refresh book state
    } catch (err) {
      setActionMsg(err.message || 'Failed to submit request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelRequest = async () => {
    if (!book.userPendingRequest) return;
    setIsSubmitting(true);
    try {
      await api.cancelRequest(book.userPendingRequest.id);
      setActionMsg('Request cancelled.');
      await loadBook();
    } catch (err) {
      setActionMsg(err.message || 'Failed to cancel request.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <main id="scroll-container" style={{ padding: '24px' }}>
        <div className="loading-state-block">Loading book details…</div>
      </main>
    );
  }

  if (error || !book) {
    return (
      <main id="scroll-container" style={{ padding: '24px' }}>
        <button className="btn-back-catalog" onClick={() => navigate('/main/catalog')}>
          <ArrowLeft size={16} /><span>Back to Catalog</span>
        </button>
        <div className="error-state-block" style={{ marginTop: '24px' }}>{error || 'Book not found'}</div>
      </main>
    );
  }

  const hasPendingRequest = !!book.userPendingRequest;
  const isStudent = user?.role === 'student';

  return (
    <main id="scroll-container" style={{ padding: '24px' }}>
      <div className="max-width-limiter">

        <button className="btn-back-catalog" onClick={() => navigate('/main/catalog')}>
          <ArrowLeft size={16} /><span>Back to Catalog</span>
        </button>

        {actionMsg && (
          <div className={`action-feedback-banner ${actionMsg.includes('Failed') || actionMsg.includes('failed') ? 'banner-error' : 'banner-success'}`} style={{ marginTop: '16px' }}>
            {actionMsg}
          </div>
        )}

        <div className="profile-workspace-grid" style={{ marginTop: '24px' }}>

          {/* Left column */}
          <div className="left-profile-column">
            <div className="book-profile-showcase-card">
              <div className="showcase-banner-graphic" style={{ backgroundColor: book.bg_banner }}>
                <div>
                  <p className="showcase-title-text">{book.title}</p>
                  <p className="showcase-author-text">{book.author}</p>
                </div>
              </div>

              <div className="showcase-action-tray">
                <div className="showcase-meta-header">
                  <span className="status-tag-badge" style={{
                    backgroundColor: book.status === 'available' ? '#10B981' : hasPendingRequest ? '#F59E0B' : '#6B7280',
                    color: '#ffffff', border: 'none',
                  }}>
                    {hasPendingRequest ? 'Pending Approval' : book.status}
                  </span>
                  <div className="metric-stars-container">
                    <Star size={16} fill="#FBBF24" color="#FBBF24" />
                    <span className="spec-value-text">{book.rating}</span>
                  </div>
                </div>

                {isStudent && book.status === 'available' && !hasPendingRequest && (
                  <button
                    className="btn-card-primary"
                    style={{ width: '100%', height: '40px', gap: '8px' }}
                    onClick={handleBorrowRequest}
                    disabled={isSubmitting}
                  >
                    <Bookmark size={16} />
                    <span>{isSubmitting ? 'Processing…' : 'Request to Borrow'}</span>
                  </button>
                )}

                {isStudent && hasPendingRequest && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <button className="btn-card-disabled" style={{ width: '100%', height: '40px', gap: '8px', backgroundColor: '#F4F1EA', color: '#716F6A', border: '1px solid #EAE6DF' }} disabled>
                      <CheckCircle2 size={16} color="#F59E0B" />
                      <span>Awaiting Confirmation</span>
                    </button>
                    <button
                      className="btn-card-secondary"
                      style={{ width: '100%', height: '36px', fontSize: '12px' }}
                      onClick={handleCancelRequest}
                      disabled={isSubmitting}
                    >
                      Cancel Request
                    </button>
                  </div>
                )}

                {book.status === 'borrowed' && !hasPendingRequest && (
                  <button className="btn-card-disabled" style={{ width: '100%', height: '40px', gap: '8px' }} disabled>
                    <BookOpen size={16} />
                    <span>Currently Borrowed</span>
                  </button>
                )}
              </div>
            </div>

            {/* Current borrower info (admin view) */}
            {book.status === 'borrowed' && book.currentBorrower && user?.role === 'admin' && (
              <div className="content-panel-block">
                <div className="panel-header-block" style={{ padding: '16px 20px 12px 20px' }}>
                  <span className="spec-label-text" style={{ fontWeight: 600 }}>Current Borrower</span>
                </div>
                <div className="panel-body-content" style={{ padding: '0 20px 20px 20px' }}>
                  <div className="table-profile-cell">
                    <div className="table-avatar" style={{ backgroundColor: 'rgba(27, 38, 59, 0.1)', color: 'var(--sidebar-bg)' }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p className="borrower-name-string">{book.currentBorrower}</p>
                      <p className="borrower-email-string">{book.borrowerStudentId}</p>
                    </div>
                  </div>
                  <div className="details-author-row" style={{ marginTop: '12px' }}>
                    <Calendar size={14} />
                    <span>Due: {book.dueDate}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column */}
          <div className="right-profile-column">
            <div>
              <h1 className="font-serif" style={{ fontSize: '32px', fontWeight: 'bold' }}>{book.title}</h1>
              <p className="row-assignment-string" style={{ fontSize: '18px', marginTop: '4px' }}>
                by <span style={{ color: 'var(--color-primary)', fontWeight: 500 }}>{book.author}</span>
              </p>
            </div>

            <div className="structural-divider-line" />

            <div className="book-specs-row">
              <div className="spec-block-item"><span className="spec-label-text">Published</span><span className="spec-value-text">{book.year}</span></div>
              <div className="spec-block-item"><span className="spec-label-text">Pages</span><span className="spec-value-text">{book.pages}</span></div>
              <div className="spec-block-item"><span className="spec-label-text">ISBN</span><span className="spec-value-text">{book.isbn}</span></div>
              <div className="spec-block-item">
                <span className="spec-label-text">Rating</span>
                <div className="metric-stars-container"><Star size={14} fill="#FBBF24" color="#FBBF24" /><span>{book.rating}</span></div>
              </div>
            </div>

            <div className="structural-divider-line" />

            <div>
              <p className="profile-inline-flex-heading">Genres</p>
              <div className="details-row-genres">
                {book.genres?.map((g, i) => <span key={i} className="risk-pill-indicator risk-low">{g}</span>)}
              </div>
            </div>

            <div>
              <p className="profile-inline-flex-heading">Description</p>
              <p className="description-body-string">{book.description}</p>
            </div>

            {book.tags?.length > 0 && (
              <div>
                <p className="profile-inline-flex-heading">Tags</p>
                <div className="details-row-genres">
                  {book.tags.map((t, i) => <span key={i} className="genre-pill">{t}</span>)}
                </div>
              </div>
            )}

            <div className="content-panel-block">
              <div className="panel-header-block" style={{ padding: '16px 20px 12px 20px' }}>
                <div className="panel-title-group">
                  <User size={16} color="#D4A373" />
                  <h3 style={{ fontSize: '16px' }}>About the Author</h3>
                </div>
              </div>
              <div className="panel-body-content" style={{ padding: '0 20px 20px 20px' }}>
                <p className="spec-value-text">{book.author}</p>
                {book.author_bio && <p className="description-body-string" style={{ marginTop: '4px' }}>{book.author_bio}</p>}
                {book.author_meta && <p className="borrower-email-string" style={{ marginTop: '4px' }}>{book.author_meta}</p>}
              </div>
            </div>
          </div>

        </div>

        {/* Similar Books */}
        {similar.length > 0 && (
          <div className="content-panel-block" style={{ marginTop: '32px' }}>
            <div className="panel-header-block">
              <div className="panel-title-group">
                <Sparkles size={18} color="#D4A373" />
                <h3>Similar Books</h3>
              </div>
              <p className="panel-subtitle-text">Recommendations based on shared genres and tags</p>
            </div>
            <div className="panel-body-content" style={{ padding: '20px' }}>
              <div className="dashboard-recommendations-grid">
                {similar.map((item) => (
                  <div
                    key={item.id}
                    className="recommendation-interactive-card"
                    style={{ cursor: 'pointer' }}
                    onClick={() => navigate(`/main/catalog/${item.id}`)}
                  >
                    <div className="recommendation-cover-thumbnail" style={{ backgroundColor: item.bg_banner }}>
                      {item.code}
                    </div>
                    <p className="recommendation-title-clamped">{item.title}</p>
                    <p className="recommendation-author-text-sub">{item.author}</p>
                    <span className="badge-availability-pill">{item.status}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

      </div>
    </main>
  );
}

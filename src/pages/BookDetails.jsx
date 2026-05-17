import React, { useState } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import { mockBooks } from "../data/mockBooks";
import { ArrowLeft, Star, BookOpen, User, Calendar, Sparkles, Bookmark, CheckCircle2 } from "lucide-react";

export default function BookDetails() {
  const navigate = useNavigate();
  const { bookId } = useParams();

  const baseBook = mockBooks.find(b => b.id === bookId) || mockBooks.find(b => b.id === "b19") || mockBooks[0];

  const [bookStatus, setBookStatus] = useState(baseBook.status); // "available" | "borrowed" | "pending_request"
  const [isSubmitting, setIsSubmitting] = useState(false);

  const similarBooks = mockBooks
    .filter(b => b.id !== baseBook.id && b.genres.some(g => baseBook.genres.includes(g)))
    .slice(0, 4);

  const handleBorrowAction = () => {
    setIsSubmitting(true);

    setTimeout(() => {
      setBookStatus("pending_request");
      setIsSubmitting(false);
    }, 800);
  };

  return (
    <main id="scroll-container" style={{ padding: "24px" }}>
      <div className="max-width-limiter">
        
        <button className="btn-back-catalog" onClick={() => navigate("/main/catalog")}>
          <ArrowLeft size={16} /><span>Back to Catalog</span>
        </button>

        <div className="profile-workspace-grid" style={{ marginTop: "24px" }}>
          
          <div className="left-profile-column">
            <div className="book-profile-showcase-card">
              <div className="showcase-banner-graphic" style={{ backgroundColor: baseBook.bgBanner || "#44403C" }}>
                <div>
                  <p className="showcase-title-text">{baseBook.title}</p>
                  <p className="showcase-author-text">{baseBook.author}</p>
                </div>
              </div>
              
              <div className="showcase-action-tray">
                <div className="showcase-meta-header">
                  <span className={`status-tag-badge ${
                    bookStatus === "borrowed" 
                      ? "status-badge-borrowed" 
                      : bookStatus === "pending_request"
                      ? "status-badge-returned"
                      : "status-badge-borrowed"
                  }`} style={{ 
                    backgroundColor: bookStatus === "available" ? "#10B981" : bookStatus === "pending_request" ? "#F59E0B" : "",
                    color: "#ffffff",
                    border: "none"
                  }}>
                    {bookStatus === "pending_request" ? "Pending Approval" : bookStatus}
                  </span>
                  
                  <div className="metric-stars-container">
                    <Star size={16} fill="#FBBF24" color="#FBBF24" />
                    <span className="spec-value-text">{baseBook.rating}</span>
                  </div>
                </div>

                {bookStatus === "available" && (
                  <button 
                    className="btn-card-primary" 
                    style={{ width: "100%", height: "40px", gap: "8px" }}
                    onClick={handleBorrowAction}
                    disabled={isSubmitting}
                  >
                    <Bookmark size={16} />
                    <span>{isSubmitting ? "Processing Request..." : "Request to Borrow"}</span>
                  </button>
                )}

                {bookStatus === "pending_request" && (
                  <button 
                    className="btn-card-disabled" 
                    style={{ width: "100%", height: "40px", gap: "8px", backgroundColor: "#F4F1EA", color: "#716F6A", border: "1px solid #EAE6DF" }} 
                    disabled
                  >
                    <CheckCircle2 size={16} color="#F59E0B" />
                    <span>Awaiting Confirmation</span>
                  </button>
                )}

                {bookStatus === "borrowed" && (
                  <button 
                    className="btn-card-disabled" 
                    style={{ width: "100%", height: "40px", gap: "8px" }} 
                    disabled
                  >
                    <BookOpen size={16} />
                    <span>Borrowed by {baseBook.currentBorrower || "Another Student"}</span>
                  </button>
                )}
              </div>
            </div>

            {bookStatus === "borrowed" && (
              <div className="content-panel-block">
                <div className="panel-header-block" style={{ padding: "16px 20px 12px 20px" }}>
                  <span className="spec-label-text" style={{ fontWeight: 600 }}>Current Borrower</span>
                </div>
                <div className="panel-body-content" style={{ padding: "0 20px 20px 20px" }}>
                  <div className="table-profile-cell">
                    <div className="table-avatar" style={{ backgroundColor: "rgba(27, 38, 59, 0.1)", color: "var(--sidebar-bg)" }}>
                      <User size={16} />
                    </div>
                    <div>
                      <p className="borrower-name-string">{baseBook.currentBorrower || "Alice Chen"}</p>
                      <p className="borrower-email-string">{baseBook.borrowerId || "ST2024001"}</p>
                    </div>
                  </div>
                  <div className="details-author-row" style={{ marginTop: "12px" }}>
                    <Calendar size={14} />
                    <span>Due: {baseBook.dueDate || "2026-05-25"}</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          <div className="right-profile-column">
            <div>
              <h1 className="font-serif" style={{ fontSize: "32px", fontWeight: "bold" }}>{baseBook.title}</h1>
              <p className="row-assignment-string" style={{ fontSize: "18px", marginTop: "4px" }}>
                by <span style={{ color: "var(--color-primary)", fontWeight: 500 }}>{baseBook.author}</span>
              </p>
            </div>
            
            <div className="structural-divider-line"></div>
            
            <div className="book-specs-row">
              <div className="spec-block-item"><span className="spec-label-text">Published</span><span className="spec-value-text">{baseBook.year}</span></div>
              <div className="spec-block-item"><span className="spec-label-text">Pages</span><span className="spec-value-text">{baseBook.pages}</span></div>
              <div className="spec-block-item"><span className="spec-label-text">ISBN</span><span className="spec-value-text">{baseBook.isbn}</span></div>
              <div className="spec-block-item"><span className="spec-label-text">Rating</span><div className="metric-stars-container"><Star size={14} fill="#FBBF24" color="#FBBF24" /><span>{baseBook.rating}</span></div></div>
            </div>
            
            <div className="structural-divider-line"></div>
            
            <div>
              <p className="profile-inline-flex-heading">Genres</p>
              <div className="details-row-genres">
                {baseBook.genres?.map((g, i) => <span key={i} className="risk-pill-indicator risk-low">{g}</span>)}
              </div>
            </div>
            
            <div>
              <p className="profile-inline-flex-heading">Description</p>
              <p className="description-body-string">{baseBook.description}</p>
            </div>
            
            <div>
              <p className="profile-inline-flex-heading">Tags</p>
              <div className="details-row-genres">
                {baseBook.tags?.map((t, i) => <span key={i} className="genre-pill">{t}</span>)}
              </div>
            </div>
            
            <div className="content-panel-block">
              <div className="panel-header-block" style={{ padding: "16px 20px 12px 20px" }}>
                <div className="panel-title-group">
                  <User size={16} color="#D4A373" />
                  <h3 style={{ fontSize: "16px" }}>About the Author</h3>
                </div>
              </div>
              <div className="panel-body-content" style={{ padding: "0 20px 20px 20px" }}>
                <p className="spec-value-text">{baseBook.author}</p>
                <p className="description-body-string" style={{ marginTop: "4px" }}>{baseBook.authorBio || "Distinguished novelist, essayist, and editor recognized for compelling structural narratives."}</p>
                <p className="borrower-email-string" style={{ marginTop: "4px" }}>{baseBook.authorMeta || "2 books in catalog"}</p>
              </div>
            </div>
          </div>

        </div>

        {/* Similar Recommendations Grid Panel Footer */}
        <div className="content-panel-block" style={{ marginTop: "32px" }}>
          <div className="panel-header-block">
            <div className="panel-title-group">
              <Sparkles size={18} color="#D4A373" />
              <h3>Similar Books</h3>
            </div>
            <p className="panel-subtitle-text">Inference-based recommendations from shared genres, tags, and author</p>
          </div>
          <div className="panel-body-content" style={{ padding: "20px" }}>
            <div className="dashboard-recommendations-grid">
              {similarBooks.map((item) => (
                <div key={item.id} className="recommendation-interactive-card" style={{ cursor: "pointer" }} onClick={() => navigate(`/main/catalog/${item.id}`)}>
                  <div className="recommendation-cover-thumbnail" style={{ backgroundColor: item.bgBanner || "#312E81" }}>{item.code}</div>
                  <p className="recommendation-title-clamped">{item.title}</p>
                  <p className="recommendation-author-text-sub">{item.author}</p>
                  <span className="badge-availability-pill">{item.status}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
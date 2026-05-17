import React, { useState } from "react";
import { Link } from "react-router-dom";
import { mockUsers } from "../data/mockUsers";
import { mockBooks } from "../data/mockBooks";
import { Search, User, ChevronRight, Mail, BookOpen, Sparkles, Star } from "lucide-react";

export default function Borrowers() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBorrowerId, setSelectedBorrowerId] = useState(mockUsers[0]?.id || "");
  const [activeTab, setActiveTab] = useState("active-loans");

  // 1. Filtered sidebar lists can compute early
  const filteredUsers = mockUsers.filter((u) =>
    u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    u.id.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // 2. DEFINE THIS FIRST: Find the profile target object
  const activeUser = mockUsers.find((u) => u.id === selectedBorrowerId) || mockUsers[0];

  // 3. RUN THESE NEXT: All subsequent filters now have safe access to 'activeUser'
  const userActiveLoans = mockBooks.filter(
    (book) => book.status === "borrowed" && book.borrowerId === activeUser?.id
  );

  // Simulating sample historical book registries
  const userReadingHistory = mockBooks.filter((b) => b.id !== "b11");

  // Simulating supervised algorithm matching models from system context rules
  const aiRecommendations = mockBooks.filter(
    (b) => b.status === "available" && !b.genres.includes("Romance")
  ).slice(0, 4);

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">

        {/* Module Title */}
        <div className="view-heading-group">
          <h1>Borrowers</h1>
          <p>Manage library members and their reading history</p>
        </div>

        {/* Master Detail Split Panel */}
        <div className="borrowers-workspace-layout">

          {/* Left Master Control Navigation Column */}
          <div className="content-panel-block">
            <div className="search-field-padding-block">
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-embedded" />
                <input
                  type="text"
                  className="catalog-search-field"
                  placeholder="Search borrowers..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="borrower-selector-list">
              {filteredUsers.map((member) => (
                <button
                  key={member.id}
                  type="button"
                  className={`btn-borrower-row-link ${selectedBorrowerId === member.id ? "selected-member-row" : ""}`}
                  onClick={() => {
                    setSelectedBorrowerId(member.id);
                    setActiveTab("active-loans"); 
                  }}
                >
                  <div className="table-avatar" style={{ backgroundColor: "rgba(27, 38, 59, 0.1)", color: "var(--sidebar-bg)" }}>
                    <User size={16} />
                  </div>
                  <div className="text-truncator" style={{ flex: 1 }}>
                    <p className="borrower-name-string truncate">{member.name}</p>
                    <p className="borrower-email-string">{member.id}</p>
                  </div>
                  <ChevronRight size={16} className="search-icon-embedded" style={{ position: "static", transform: "none" }} />
                </button>
              ))}
            </div>
          </div>

          {/* Right Detailed Workspace Panel Profile Views */}
          {activeUser && (
            <div className="right-profile-column" style={{ gap: "16px" }}>

              {/* Detailed Personal Identification Card Widget */}
              <div className="content-panel-block profile-summary-header-card">
                <div className="header-flex-meta-tray">
                  <div className="table-profile-cell" style={{ gap: "16px" }}>
                    <div className="table-avatar" style={{ width: "56px", height: "56px", backgroundColor: "rgba(27, 38, 59, 0.1)", color: "var(--sidebar-bg)" }}>
                      <User size={28} />
                    </div>
                    <div className="header-badge-title-group">
                      <h2>{activeUser.name}</h2>
                      <div className="header-badge-subtitle-row">
                        <div className="details-author-row" style={{ marginTop: 0 }}><Mail size={14} /><span>{activeUser.email}</span></div>
                        <span className="meta-split-pipe">|</span>
                        <span>{activeUser.id}</span>
                        <span className="meta-split-pipe">|</span>
                        <span>Joined 2024-01-15</span>
                      </div>
                    </div>
                  </div>
                  <div className="meta-numeric-fine-box">
                    <p>Fines</p>
                    <p>$0.00</p>
                  </div>
                </div>
              </div>

              {/* Dynamic Tab Selector Headers */}
              <div dir="ltr" className="w-full">
                <div className="navigation-tablist-track">
                  <button
                    type="button"
                    className={`btn-tab-trigger ${activeTab === "active-loans" ? "active-tab-state" : ""}`}
                    onClick={() => setActiveTab("active-loans")}
                  >
                    <BookOpen size={14} />
                    <span>Active Loans ({userActiveLoans.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-tab-trigger ${activeTab === "reading-history" ? "active-tab-state" : ""}`}
                    onClick={() => setActiveTab("reading-history")}
                  >
                    <BookOpen size={14} />
                    <span>Reading History ({userReadingHistory.length})</span>
                  </button>
                  <button
                    type="button"
                    className={`btn-tab-trigger ${activeTab === "smart-recom" ? "active-tab-state" : ""}`}
                    onClick={() => setActiveTab("smart-recom")}
                  >
                    <Sparkles size={14} />
                    <span>Smart Recommendations</span>
                  </button>
                </div>

                {/* Subpanel Tab Viewports */}
                <div className="tab-content-panel-viewport">

                  {/* Tab Variant 1: Active Loan Items */}
                  {activeTab === "active-loans" && (
                    <div className="loans-display-grid">
                      {userActiveLoans.length > 0 ? (
                        userActiveLoans.map((book) => (
                          <Link key={book.id} to={`/main/catalog/${book.id}`} className="loan-card-micro-wrapper" style={{ textDecoration: 'none' }}>
                            <div className="micro-card-flex-aligner">
                              <div className="cover-micro-thumb" style={{ backgroundColor: book.bgBanner }}>{book.code}</div>
                              <div className="text-truncator" style={{ flex: 1 }}>
                                <p className="details-book-title">{book.title}</p>
                                <p className="borrower-email-string">by {book.author}</p>
                              </div>
                              <span className="risk-pill-indicator risk-low" style={{ fontSize: "9px" }}>Due {book.dueDate}</span>
                            </div>
                          </Link>
                        ))
                      ) : (
                        <p className="description-body-string" style={{ padding: "12px 4px" }}>No items currently drawn on loan.</p>
                      )}
                    </div>
                  )}

                  {/* Tab Variant 2: Relational Reading Logs History */}
                  {activeTab === "reading-history" && (
                    <div className="loans-display-grid">
                      {userReadingHistory.map((book) => (
                        <Link key={book.id} to={`/main/catalog/${book.id}`} className="loan-card-micro-wrapper" style={{ textDecoration: 'none' }}>
                          <div className="micro-card-flex-aligner">
                            <div className="cover-micro-thumb" style={{ backgroundColor: book.bgBanner }}>{book.code}</div>
                            <div className="text-truncator">
                              <p className="details-book-title">{book.title}</p>
                              <p className="borrower-email-string">by {book.author}</p>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}

                  {/* Tab Variant 3: Recommendations */}
                  {activeTab === "smart-recom" && (
                    <div className="content-panel-block" style={{ border: "none", boxShadow: "none", background: "transparent" }}>
                      <div className="panel-header-block" style={{ padding: "0 0 16px 4px", borderBottom: "none" }}>
                        <div className="panel-title-group">
                          <Sparkles size={16} color="#D4A373" />
                          <h4 style={{ fontSize: "14px", fontWeight: "bold" }}>Personalized for {activeUser.name}</h4>
                        </div>
                        <p className="panel-subtitle-text">Based on genres and tags from their reading history</p>
                      </div>

                      <div className="catalog-inventory-grid" style={{ gridTemplateColumns: "repeat(4, 1fr)", gap: "12px" }}>
                        {aiRecommendations.map((book) => (
                          <div key={book.id} className="recom-card-item" style={{ backgroundColor: "var(--color-card)" }}>
                            <div className="recom-cover-placeholder" style={{ backgroundColor: book.bgBanner }}>{book.code}</div>
                            <p className="recom-book-title">{book.title}</p>
                            <p className="borrower-email-string" style={{ marginBottom: "6px" }}>{book.author}</p>
                            <span className="status-tag-pill" style={{ marginTop: "0" }}>{book.status}</span>
                          </div>
                        ))}
                      </div>
                    </div>
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
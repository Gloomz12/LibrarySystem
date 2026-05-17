import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { 
  ArrowRightLeft, 
  BookOpen, 
  RotateCcw, 
  DollarSign, 
  Search, 
  ChevronDown, 
  ArrowUpDown, 
  User, 
  Calendar 
} from "lucide-react";

export default function StudentTransactions() {
  const [searchTerm, setSearchTerm] = useState("");
  const [typeFilter, setTypeFilter] = useState("all"); // options: "all" | "borrowed" | "returned"
  const [sortBy, setSortBy] = useState("newest"); // options: "newest" | "oldest"
  
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showSortDropdown, setShowSortDropdown] = useState(false);

  const [transactionsData] = useState([
    {
      id: "t1",
      bookId: "b9",
      title: "Love in the Time of Cholera",
      author: "Gabriel García Márquez",
      code: "LO",
      color: "#44403C", 
      borrowerName: "Alice Chen",
      borrowerId: "ST2024001",
      value: 15.99,
      date: "2026-04-25",
      type: "borrowed",
      dueDate: "2026-05-25"
    },
    {
      id: "t2",
      bookId: "b1",
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      code: "HA",
      color: "#92400E", 
      borrowerName: "Alice Chen",
      borrowerId: "ST2024001",
      value: 14.99,
      date: "2026-04-20",
      type: "borrowed",
      dueDate: "2026-05-20"
    },
    {
      id: "t3",
      bookId: "b2",
      title: "Harry Potter and the Chamber of Secrets",
      author: "J.K. Rowling",
      code: "HA",
      color: "#065F46", 
      borrowerName: "Alice Chen",
      borrowerId: "ST2024001",
      value: 14.99,
      date: "2026-04-10",
      type: "returned",
      dueDate: null
    }
  ]);

  const stats = useMemo(() => {
    const totalCount = transactionsData.length;
    const borrowsCount = transactionsData.filter(t => t.type === "borrowed").length;
    const returnsCount = transactionsData.filter(t => t.type === "returned").length;
    const totalValueSum = transactionsData.reduce((acc, curr) => acc + curr.value, 0).toFixed(2);

    return { totalCount, borrowsCount, returnsCount, totalValueSum };
  }, [transactionsData]);

  const filteredAndSortedTransactions = useMemo(() => {
    let result = [...transactionsData];

    if (searchTerm.trim() !== "") {
      const query = searchTerm.toLowerCase();
      result = result.filter(t => 
        t.title.toLowerCase().includes(query) || 
        t.id.toLowerCase().includes(query)
      );
    }

    if (typeFilter !== "all") {
      result = result.filter(t => t.type === typeFilter);
    }

    result.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortBy === "newest" ? dateB - dateA : dateA - dateB;
    });

    return result;
  }, [transactionsData, searchTerm, typeFilter, sortBy]);

  return (
      <main id="scroll-container">
        <div className="dashboard-view-container">
          
          <div className="view-heading-group" style={{ marginBottom: "24px" }}>
            <h1>Transactions</h1>
            <p>Your borrow and return history</p>
          </div>

          <div className="analytics-grid">
            <div className="tx-metric-card-box">
              <div className="tx-icon-container tx-icon-blue">
                <ArrowRightLeft size={18} />
              </div>
              <div>
                <div className="tx-metric-value">{stats.totalCount}</div>
                <div className="tx-metric-label">Total transactions</div>
              </div>
            </div>

            <div className="tx-metric-card-box">
              <div className="tx-icon-container tx-icon-green">
                <BookOpen size={18} />
              </div>
              <div>
                <div className="tx-metric-value">{stats.borrowsCount}</div>
                <div className="tx-metric-label">Borrows</div>
              </div>
            </div>

            <div className="tx-metric-card-box">
              <div className="tx-icon-container tx-icon-orange">
                <RotateCcw size={18} />
              </div>
              <div>
                <div className="tx-metric-value">{stats.returnsCount}</div>
                <div className="tx-metric-label">Returns</div>
              </div>
            </div>

            <div className="tx-metric-card-box">
              <div className="tx-icon-container tx-icon-sky">
                <DollarSign size={18} />
              </div>
              <div>
                <div className="tx-metric-value">${stats.totalValueSum}</div>
                <div className="tx-metric-label">Total value</div>
              </div>
            </div>
          </div>

          <div className="catalog-filter-bar">
            <div className="filter-flex-wrapper">
              
              <div className="search-input-wrapper">
                <Search size={16} className="search-icon-embedded" />
                <input 
                  type="text" 
                  className="catalog-search-field"
                  placeholder="Search by book title or ID..." 
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <div className="filter-selectors-group">
                
                <div style={{ position: "relative" }}>
                  <button 
                    type="button" 
                    className="dropdown-combobox-trigger"
                    onClick={() => {
                      setShowTypeDropdown(!showTypeDropdown);
                      setShowSortDropdown(false);
                    }}
                  >
                    <div className="combobox-text-side">
                      <ArrowRightLeft size={14} />
                      <span className="capitalize-fallback">
                        {typeFilter === "all" ? "All Types" : typeFilter}
                      </span>
                    </div>
                    <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: "8px" }} />
                  </button>

                  {showTypeDropdown && (
                    <div className="custom-floating-select-menu" style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "#fff", border: "1px solid #EAE6DF", borderRadius: "8px", width: "140px", marginTop: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <button type="button" style={{ padding: "8px 12px", textAlign: "left", background: "none", border: "none", fontSize: "13px", cursor: "pointer" }} onClick={() => { setTypeFilter("all"); setShowTypeDropdown(false); }}>All Types</button>
                      <button type="button" style={{ padding: "8px 12px", textAlign: "left", background: "none", border: "none", fontSize: "13px", cursor: "pointer" }} onClick={() => { setTypeFilter("borrowed"); setShowTypeDropdown(false); }}>Borrowed</button>
                      <button type="button" style={{ padding: "8px 12px", textAlign: "left", background: "none", border: "none", fontSize: "13px", cursor: "pointer" }} onClick={() => { setTypeFilter("returned"); setShowTypeDropdown(false); }}>Returned</button>
                    </div>
                  )}
                </div>

                <div style={{ position: "relative" }}>
                  <button 
                    type="button" 
                    className="dropdown-combobox-trigger"
                    onClick={() => {
                      setShowSortDropdown(!showSortDropdown);
                      setShowTypeDropdown(false);
                    }}
                  >
                    <div className="combobox-text-side">
                      <ArrowUpDown size={14} />
                      <span>{sortBy === "newest" ? "Date (Newest)" : "Date (Oldest)"}</span>
                    </div>
                    <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: "8px" }} />
                  </button>

                  {showSortDropdown && (
                    <div className="custom-floating-select-menu" style={{ position: "absolute", top: "100%", right: 0, zIndex: 50, background: "#fff", border: "1px solid #EAE6DF", borderRadius: "8px", width: "140px", marginTop: "4px", boxShadow: "0 4px 12px rgba(0,0,0,0.05)", display: "flex", flexDirection: "column", overflow: "hidden" }}>
                      <button type="button" style={{ padding: "8px 12px", textAlign: "left", background: "none", border: "none", fontSize: "13px", cursor: "pointer" }} onClick={() => { setSortBy("newest"); setShowSortDropdown(false); }}>Date (Newest)</button>
                      <button type="button" style={{ padding: "8px 12px", textAlign: "left", background: "none", border: "none", fontSize: "13px", cursor: "pointer" }} onClick={() => { setSortBy("oldest"); setShowSortDropdown(false); }}>Date (Oldest)</button>
                    </div>
                  )}
                </div>

              </div>
            </div>
          </div>

          <div className="content-panel-block">
            <div className="panel-header-block">
              <h3>Your Transaction History</h3>
            </div>
            
            <div className="panel-body-content">
              {filteredAndSortedTransactions.length === 0 ? (
                <div className="flex-center-empty-state" style={{ minHeight: "160px" }}>
                  <p className="empty-state-placeholder-text">No matching transactions found.</p>
                </div>
              ) : (
                <div className="tx-ledger-list">
                  {filteredAndSortedTransactions.map((tx) => (
                    <div key={tx.id} className="tx-row-item">
                      
                      <div className="tx-info-block">
                        <Link to={`/book/${tx.bookId}`}>
                          <div className="cover-micro-thumb" style={{ backgroundColor: tx.color }}>
                            {tx.code}
                          </div>
                        </Link>
                        <div className="text-truncator">
                          <Link to={`/book/${tx.bookId}`} className="tx-title-link">
                            {tx.title}
                          </Link>
                          <div className="details-author-row">
                            <User size={12} style={{ marginRight: "2px" }} />
                            <span>{tx.borrowerName}</span>
                            <span className="meta-split-pipe">|</span>
                            <span>{tx.borrowerId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="tx-meta-row-data">
                        <div className="tx-data-capsule">
                          <DollarSign size={12} />
                          <span>{tx.value.toFixed(2)}</span>
                        </div>
                        <div className="tx-data-capsule">
                          <Calendar size={12} />
                          <span>{tx.date}</span>
                        </div>
                        
                        <span className={`status-tag-badge ${tx.type === "borrowed" ? "status-badge-borrowed" : "status-badge-returned"}`}>
                          {tx.type === "borrowed" ? "Borrowed" : "Returned"}
                        </span>

                        {tx.type === "borrowed" && tx.dueDate && (
                          <span className="row-assignment-string">
                            Due: {tx.dueDate}
                          </span>
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
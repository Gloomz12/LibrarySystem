import React, { useState } from "react";
import { Link } from "react-router-dom";
import { mockTransactions } from "../data/mockTransactions";
import { 
  ArrowRightLeft, 
  BookOpen, 
  RotateCcw, 
  DollarSign, 
  Search, 
  ChevronDown, 
  ArrowUpDown,
  ClipboardList,
  User,
  Calendar,
  CircleCheckBig,
  CircleX
} from "lucide-react";

export default function AdminTransactions() {
  const [searchQuery, setSearchQuery] = useState("");

  const filteredTransactions = mockTransactions.filter((tx) =>
    tx.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.borrowerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tx.borrowerId.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const totalTransactionsCount = filteredTransactions.length;
  const borrowsCount = filteredTransactions.filter(tx => tx.type.toLowerCase() === "borrowed").length;
  const returnsCount = filteredTransactions.filter(tx => tx.type.toLowerCase() === "returned").length;
  const totalValueSum = filteredTransactions.reduce((acc, curr) => acc + (curr.value || 0), 0);

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">
        
        {/* Module Title Section */}
        <div className="view-heading-group">
          <h1>Transactions</h1>
          <p>Your borrow and return history</p>
        </div>

        {/* Analytics Top Ribbon Blocks */}
        <div className="analytics-grid">
          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-blue">
              <ArrowRightLeft size={18} />
            </div>
            <div>
              <p className="tx-metric-value">{totalTransactionsCount}</p>
              <p className="tx-metric-label">Total transactions</p>
            </div>
          </div>

          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-green">
              <BookOpen size={18} />
            </div>
            <div>
              <p className="tx-metric-value">{borrowsCount}</p>
              <p className="tx-metric-label">Borrows</p>
            </div>
          </div>

          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-orange">
              <RotateCcw size={18} />
            </div>
            <div>
              <p className="tx-metric-value">{returnsCount}</p>
              <p className="tx-metric-label">Returns</p>
            </div>
          </div>

          <div className="tx-metric-card-box">
            <div className="tx-icon-container tx-icon-sky">
              <DollarSign size={18} />
            </div>
            <div>
              <p className="tx-metric-value">${totalValueSum.toFixed(2)}</p>
              <p className="tx-metric-label">Total value</p>
            </div>
          </div>
        </div>

{/* Pending Requests Container Panel Module */}
<div className="pending-requests-card" style={{ marginTop: '24px' }}>
  <div className="pending-requests-header">
    <ClipboardList size={18} />
    <h3>Pending Requests (2)</h3>
  </div>
  
  <div className="pending-requests-body">
    
    {/* Request Element 1: Borrow Allocation */}
    <div className="pending-request-row">
      <div className="tx-info-block">
        <Link to="/main/catalog/b16">
          <div className="cover-micro-thumb" style={{ backgroundColor: "#065F46" }}>
            CR
          </div>
        </Link>
        <div className="text-truncator">
          <Link to="/main/catalog/b16" className="tx-title-link">
            Crime and Punishment
          </Link>
          <div className="details-author-row">
            <User size={12} />
            <span>Alice Chen</span>
            <span className="meta-split-pipe">|</span>
            <span>ST2024001</span>
            <span className="meta-split-pipe">|</span>
            <DollarSign size={12} />
            <span>14.99</span>
          </div>
        </div>
      </div>

      <div className="pending-action-controls-wrapper">
        <span className="badge-request-type badge-request-borrow">
          Borrow Request
        </span>
        <div className="pending-action-controls-wrapper" style={{ flexDirection: 'row', gap: '8px' }}>
          <div className="details-author-row" style={{ marginTop: 0 }}>
            <Calendar size={14} style={{ color: '#8A8884' }} />
            <input type="date" className="pending-date-input-field" defaultValue="2026-06-17" />
          </div>
          <div className="btn-pending-action-group">
            <button type="button" className="btn-admin-accept">
              <CircleCheckBig size={14} />
              <span>Accept</span>
            </button>
            <button type="button" className="btn-admin-decline">
              <CircleX size={14} />
              <span>Decline</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    {/* Request Element 2: Return Check-in Verification */}
    <div className="pending-request-row">
      <div className="tx-info-block">
        <Link to="/main/catalog/b9">
          <div className="cover-micro-thumb" style={{ backgroundColor: "#44403C" }}>
            LO
          </div>
        </Link>
        <div className="text-truncator">
          <Link to="/main/catalog/b9" className="tx-title-link">
            Love in the Time of Cholera
          </Link>
          <div className="details-author-row">
            <User size={12} />
            <span>Alice Chen</span>
            <span className="meta-split-pipe">|</span>
            <span>ST2024001</span>
            <span className="meta-split-pipe">|</span>
            <DollarSign size={12} />
            <span>15.99</span>
          </div>
        </div>
      </div>

      <div className="pending-action-controls-wrapper">
        <span className="badge-request-type badge-request-return">
          Return Request
        </span>
        <button type="button" className="btn-admin-accept">
          <CircleCheckBig size={14} />
          <span>Confirm Return</span>
        </button>
      </div>
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
                placeholder="Search by book, borrower, or ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-selectors-group">
              <button type="button" className="dropdown-combobox-trigger" style={{ width: "125px" }}>
                <div className="combobox-text-side">
                  <ArrowRightLeft size={14} />
                  <span>All Types</span>
                </div>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>

              <button type="button" className="dropdown-combobox-trigger" style={{ width: "145px" }}>
                <div className="combobox-text-side">
                  <ArrowUpDown size={14} />
                  <span>Date (Newest)</span>
                </div>
                <ChevronDown size={14} style={{ opacity: 0.6 }} />
              </button>
            </div>
          </div>
        </div>

        <div className="content-panel-block">
          <div className="panel-header-block">
            <h3>Your Transaction History</h3>
          </div>
          
          <div className="panel-body-content">
            <div className="tx-ledger-list">
              {filteredTransactions.length > 0 ? (
                filteredTransactions.map((tx) => (
                  <div key={tx.id} className="tx-row-item">
                    
                    <div className="tx-info-block">
                      <Link to={`/main/catalog/${tx.bookId}`}>
                        <div className="cover-micro-thumb" style={{ backgroundColor: tx.color }}>
                          {tx.code}
                        </div>
                      </Link>
                      <div className="text-truncator">
                        <Link to={`/main/catalog/${tx.bookId}`} className="tx-title-link">
                          {tx.title}
                        </Link>
                        <div className="details-author-row">
                          <span>{tx.borrowerName}</span>
                          <span className="meta-split-pipe">|</span>
                          <span>{tx.borrowerId}</span>
                        </div>
                      </div>
                    </div>

                    <div className="tx-meta-row-data">
                      <div className="tx-data-capsule" style={{ color: "#716F6A" }}>
                        <span>$ {tx.value.toFixed(2)}</span>
                      </div>
                      <div className="tx-data-capsule" style={{ color: "#A09E9A" }}>
                        <span>{tx.date}</span>
                      </div>
                      
                      <span className={`status-tag-badge ${
                        tx.type.toLowerCase() === "borrowed" 
                          ? "status-badge-borrowed" 
                          : "status-badge-returned"
                      }`}>
                        {tx.type}
                      </span>
                      
                      {tx.dueDate && (
                        <span className="row-assignment-string">
                          Due: {tx.dueDate}
                        </span>
                      )}
                    </div>

                  </div>
                ))
              ) : (
                <div style={{ textAlign: "center", padding: "40px 0", color: "#A09E9A", fontSize: "14px" }}>
                  No historical library transaction records match your search criteria.
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
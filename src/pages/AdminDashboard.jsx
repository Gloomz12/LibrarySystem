import React from "react";
import { 
  BookOpen, 
  Users, 
  Repeat, 
  TriangleAlert, 
  TrendingUp,
  Clock,
  Sparkles
} from "lucide-react";

export default function AdminDashboard() {
  const overduePredictions = [
    { id: 'b1', title: "Foundation", code: "FO", borrower: "James Park", due: "2026-05-15", risk: "high risk", probability: 99, color: "#065F46" },
    { id: 'b2', title: "1984", code: "19", borrower: "Marcus Johnson", due: "2026-05-18", risk: "high risk", probability: 84, color: "#1E40AF" },
    { id: 'b3', title: "A Farewell to Arms", code: "A", borrower: "Emma Wilson", due: "2026-05-17", risk: "high risk", probability: 77, color: "#92400E" },
    { id: 'b4', title: "And Then There Were None", code: "AN", borrower: "Marcus Johnson", due: "2026-05-19", risk: "high risk", probability: 76, color: "#6B21A8" },
    { id: 'b5', title: "The Bluest Eye", code: "TH", borrower: "Alice Chen", due: "2026-05-20", risk: "medium risk", probability: 53, color: "#1C1917" },
    { id: 'b6', title: "Pride and Prejudice", code: "PR", borrower: "Sofia Rodriguez", due: "2026-05-22", risk: "low risk", probability: 37, color: "#047857" }
  ];

  const genreStats = [
    { name: "Classic", count: 6 },
    { name: "Romance", count: 5 },
    { name: "Literary Fiction", count: 5 },
    { name: "Fantasy", count: 4 },
    { name: "Young Adult", count: 3 },
    { name: "Science Fiction", count: 3 },
    { name: "Magical Realism", count: 3 },
    { name: "Political Fiction", count: 2 },
    { name: "Satire", count: 2 },
    { name: "Coming-of-age", count: 2 }
  ];

  const aliceRecommendations = [
    { id: "r1", title: "Harry Potter and the Prisoner of Azkaban", code: "HA", bg: "#4C0519" },
    { id: "r2", title: "Sense and Sensibility", code: "SE", bg: "#431407" },
    { id: "r3", title: "One Hundred Years of Solitude", code: "ON", bg: "#312E81" }
  ];

  return (
    <main id="scroll-container">
      <div className="max-width-limiter">
        
        <div className="view-heading-group">
          <h1>Dashboard</h1>
          <p>Overview of your library system and intelligent insights</p>
        </div>

        <div className="analytics-grid">
          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total Books</span>
              <BookOpen size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">21</div>
            <div className="kpi-subtext">
              <span className="kpi-highlight-green">15 available</span> | 6 borrowed
            </div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Active Borrowers</span>
              <Users size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">5</div>
            <div className="kpi-subtext">5 have active loans</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Total Transactions</span>
              <Repeat size={16} color="#D4A373" />
            </div>
            <div className="kpi-value">10</div>
            <div className="kpi-subtext">7 borrows, 3 returns</div>
          </div>

          <div className="kpi-card">
            <div className="kpi-header">
              <span className="kpi-title">Overdue Alerts</span>
              <TriangleAlert size={16} color="#EF4444" />
            </div>
            <div className="kpi-value text-alert">4</div>
            <div className="kpi-subtext">High-risk predictions flagged</div>
          </div>
        </div>

        <div className="workspace-split-row">
          <div className="content-panel-block">
            <div className="panel-header-block">
              <div className="panel-title-group">
                <TrendingUp size={16} color="#D4A373" />
                <h3>Overdue Predictions</h3>
              </div>
              <p className="panel-subtitle-text">Smart risk analysis based on borrowing patterns and history</p>
            </div>
            <div className="panel-body-content">
              {overduePredictions.map((book) => (
                <div key={book.id} className="prediction-row-item">
                  <div className="prediction-meta-side">
                    <div className="book-badge-icon" style={{ backgroundColor: book.color }}>
                      {book.code}
                    </div>
                    <div className="text-truncator">
                      <div className="row-title-header">
                        <span className="book-title-string">{book.title}</span>
                        <span className={`risk-pill-indicator ${book.risk === 'high risk' ? 'risk-high' : book.risk === 'medium risk' ? 'risk-medium' : 'risk-low'}`}>
                          {book.risk}
                        </span>
                      </div>
                      <p className="row-assignment-string">Borrowed by {book.borrower} · Due {book.due}</p>
                    </div>
                  </div>
                  <div className="prediction-chart-side">
                    <div className="progress-bar-track">
                      <div className="progress-bar-fill" style={{ width: `${book.probability}%` }}></div>
                    </div>
                    <span className="percentage-text-label">{book.probability}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="content-panel-block">
            <div className="panel-header-block">
              <div className="panel-title-group">
                <Clock size={16} color="#D4A373" />
                <h3>Genre Distribution</h3>
              </div>
            </div>
            <div className="panel-body-content genre-list-scrollway">
              {genreStats.map((genre) => (
                <div key={genre.name} className="genre-metrics-row">
                  <div className="genre-text-header">
                    <span>{genre.name}</span>
                    <strong>{genre.count}</strong>
                  </div>
                  <div className="progress-bar-track">
                    <div className="progress-bar-fill" style={{ width: `${(genre.count / 6) * 100}%` }}></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="content-panel-block">
          <div className="panel-header-block">
            <div className="panel-title-group">
              <Sparkles size={16} color="#D4A373" />
              <h3>Smart Recommendations</h3>
            </div>
            <p className="panel-subtitle-text">Personalized book suggestions based on reading history</p>
          </div>
          <div className="panel-body-content">
            <div className="ml-pipelines-grid">
              <div className="pipeline-user-container">
                <h4 className="pipeline-user-tag">For <span className="pipeline-user-name">Alice Chen</span></h4>
                <div className="recommendations-deck-row">
                  {aliceRecommendations.map((book) => (
                    <div key={book.id} className="recom-card-item">
                      <div className="recom-cover-placeholder" style={{ backgroundColor: book.bg }}>{book.code}</div>
                      <p className="recom-book-title">{book.title}</p>
                      <span className="status-tag-pill">Available</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

      </div>
    </main>
  );
}
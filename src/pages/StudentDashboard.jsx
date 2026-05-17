import React, { useState } from "react";
import { Link } from "react-router-dom";
import { 
  BookOpen, 
  Bookmark, 
  Clock, 
  TriangleAlert, 
  Library, 
  ArrowRight, 
  Bell, 
  Sparkles 
} from "lucide-react";

export default function StudentDashboard() {
  const [stats] = useState([
    { id: "borrowed", label: "Borrowed", value: "2", subtext: "All good", status: "success", icon: BookOpen },
    { id: "pending", label: "Pending Requests", value: "0", subtext: "0 borrow, 0 return", status: "neutral", icon: Bookmark },
    { id: "due", label: "Due Soon", value: "0", subtext: "Within 3 days", status: "warning", icon: Clock },
    { id: "fines", label: "Fines", value: "$0.00", subtext: "No fines", status: "success", icon: TriangleAlert },
  ]);

  const [borrowedBooks] = useState([
    {
      id: "b1",
      title: "Harry Potter and the Sorcerer's Stone",
      author: "J.K. Rowling",
      code: "HA",
      color: "#92400E",
      timeLeft: "4 days left",
      dueDate: "2026-05-20"
    },
    {
      id: "b9",
      title: "Love in the Time of Cholera",
      author: "Gabriel García Márquez",
      code: "LO",
      color: "#44403C", 
      timeLeft: "9 days left",
      dueDate: "2026-05-25"
    }
  ]);

  const [recommendations] = useState([
    { id: "b3", title: "Harry Potter and the Prisoner of Azkaban", author: "J.K. Rowling", code: "HA", color: "#9F1239" },
    { id: "b8", title: "One Hundred Years of Solitude", author: "Gabriel García Márquez", code: "ON", color: "#3730A3" },
    { id: "b11", title: "Kafka on the Shore", author: "Haruki Murakami", code: "KA", color: "#92400E" },
    { id: "b7", title: "Sense and Sensibility", author: "Jane Austen", code: "SE", color: "#C2410C" }
  ]);

  return (
      
      <main id="scroll-container">
        <div className="dashboard-view-container">
          
          <div className="view-heading-group" style={{ marginBottom: "24px" }}>
            <h1>Hello, Alice</h1>
            <p>Here's what's happening with your library account</p>
          </div>

          <div className="dashboard-stats-deck">
            {stats.map((stat) => {
              const IconComponent = stat.icon;
              return (
                <div key={stat.id} className="stat-overview-card">
                  <div className="stat-card-header-row">
                    <span className="stat-label-text">{stat.label}</span>
                    <IconComponent size={16} className={`stat-icon-type-${stat.status}`} />
                  </div>
                  <div className="stat-card-numeric-display">
                    <div className={`stat-metric-value value-style-${stat.status}`}>
                      {stat.value}
                    </div>
                    <div className="stat-metric-subtext">{stat.subtext}</div>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="dashboard-split-workspace-grid" style={{ marginTop: "24px" }}>
            
            <div className="content-panel-block workspace-col-span-2">
              <div className="panel-header-block">
                <div className="panel-header-title-flex">
                  <Library size={18} className="panel-icon-brand" />
                  <h3>Currently Borrowed</h3>
                </div>
                <Link to="/my-books" className="btn-link-action-forward">
                  <span>View All</span>
                  <ArrowRight size={14} />
                </Link>
              </div>
              
              <div className="panel-body-content">
                <div className="dashboard-borrowed-list-stack">
                  {borrowedBooks.map((book) => (
                    <Link key={book.id} to={`/book/${book.id}`} className="dashboard-loan-strip-item">
                      <div className="loan-item-left-segment">
                        <div className="loan-book-avatar" style={{ backgroundColor: book.color }}>
                          {book.code}
                        </div>
                        <div className="text-truncator">
                          <p className="loan-book-title-text">{book.title}</p>
                          <p className="loan-book-author-text">{book.author}</p>
                        </div>
                      </div>
                      
                      <div className="loan-item-right-segment">
                        <span className="badge-time-remaining-pill">
                          {book.timeLeft}
                        </span>
                        <span className="loan-absolute-due-date">
                          Due {book.dueDate}
                        </span>
                      </div>
                    </Link>
                  ))}
                </div>
              </div>
            </div>

            <div className="content-panel-block">
              <div className="panel-header-block">
                <div className="panel-header-title-flex">
                  <Bell size={18} className="panel-icon-brand" />
                  <h3>Pending</h3>
                </div>
              </div>
              <div className="panel-body-content flex-center-empty-state">
                <p className="empty-state-placeholder-text">No pending requests</p>
              </div>
            </div>

          </div>

          <div className="content-panel-block" style={{ marginTop: "24px" }}>
            <div className="panel-header-block" style={{ flexDirection: "column", alignItems: "flex-start", gap: "2px" }}>
              <div className="panel-header-title-flex">
                <Sparkles size={18} className="panel-icon-brand" />
                <h3>Recommended For You</h3>
              </div>
              <p className="panel-header-subtitle-desc">Based on your reading history</p>
            </div>
            
            <div className="panel-body-content" style={{ padding: "20px" }}>
              <div className="dashboard-recommendations-grid">
                {recommendations.map((rec) => (
                  <Link key={rec.id} to={`/book/${rec.id}`} className="recommendation-interactive-card group">
                    <div className="recommendation-cover-thumbnail" style={{ backgroundColor: rec.color }}>
                      {rec.code}
                    </div>
                    <p className="recommendation-title-clamped">{rec.title}</p>
                    <p className="recommendation-author-text-sub">{rec.author}</p>
                    <span className="badge-availability-pill">available</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>

        </div>
      </main>
  );
}
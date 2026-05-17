import React, { useState } from "react";
import { Link } from "react-router-dom";
import {
    Sparkles,
    Star,
    Calendar,
    ArrowRight,
    BookOpen,
    RotateCcw,
    X
} from "lucide-react";

export default function MyBooks() {
    const [books, setBooks] = useState([
        {
            id: "b7",
            title: "Sense and Sensibility",
            author: "Jane Austen",
            code: "SE",
            color: "#9A3412",
            rating: "4.3",
            dueDate: "2026-05-21",
            isPending: true,
            requestedDate: "2026-05-17"
        },
        {
            id: "b14",
            title: "Murder on the Orient Express",
            author: "Agatha Christie",
            code: "MU",
            color: "#075985",
            rating: "4.5",
            dueDate: "2026-05-20",
            isPending: false,
            requestedDate: null
        },
        {
            id: "b18",
            title: "Beloved",
            author: "Toni Morrison",
            code: "BE",
            color: "#3730A3",
            rating: "4.4",
            dueDate: "2026-05-21",
            isPending: false,
            requestedDate: null
        },
        {
            id: "b19",
            title: "The Bluest Eye",
            author: "Toni Morrison",
            code: "TH",
            color: "#44403C",
            rating: "4.3",
            dueDate: "2026-05-20",
            isPending: false,
            requestedDate: null
        }
    ]);

    const handleRequestReturn = (bookId) => {
        const today = new Date().toISOString().split('T')[0];
        setBooks(prevBooks =>
            prevBooks.map(book =>
                book.id === bookId
                    ? { ...book, isPending: true, requestedDate: today }
                    : book
            )
        );
    };

    const handleCancelRequest = (bookId) => {
        setBooks(prevBooks =>
            prevBooks.map(book =>
                book.id === bookId
                    ? { ...book, isPending: false, requestedDate: null }
                    : book
            )
        );
    };

    const pendingBooks = books.filter(book => book.isPending);

    return (
        <main id="scroll-container">
            <div className="mybooks-view-container">

                <div className="view-heading-group" style={{ marginBottom: "24px" }}>
                    <h1>My Books</h1>
                    <p>Your borrowed books and reading activity</p>
                </div>

                <div className="mybooks-cards-grid">
                    {books.map((book) => (
                        <div key={book.id} className="book-display-card">

                            {/* Visual Book Cover Top Half Segment Block */}
                            <div className="book-cover-banner" style={{ backgroundColor: book.color }}>
                                <div className="cover-typography-wrapper">
                                    <h2 className="cover-title-serif">{book.title}</h2>
                                    <p className="cover-author-subtext">{book.author}</p>
                                </div>
                            </div>

                            <div className="book-card-body-details">
                                <div className="card-status-rating-ribbon">
                                    <span className="badge-borrow-pill">Borrowed</span>
                                    <div className="card-star-score-box">
                                        <Star size={13} className="star-icon-filled" />
                                        <span>{book.rating}</span>
                                    </div>
                                </div>

                                <div className="card-calendar-due-row">
                                    <Calendar size={14} />
                                    <span>Due: {book.dueDate}</span>
                                </div>

                                <div className="card-action-buttons-flex">
                                    <Link to={`/main/catalog/${book.id}`} className="btn-card-secondary flex-1">
                                        <span>Details</span>
                                        <ArrowRight size={14} />
                                    </Link>

                                    {book.isPending ? (
                                        <button className="btn-card-disabled flex-1" disabled>
                                            Return Pending
                                        </button>
                                    ) : (
                                        <button
                                            onClick={() => handleRequestReturn(book.id)}
                                            className="btn-card-primary flex-1"
                                        >
                                            <BookOpen size={14} />
                                            <span>Request Return</span>
                                        </button>
                                    )}
                                </div>
                            </div>

                        </div>
                    ))}
                </div>

                <div className="content-panel-block" style={{ marginTop: "32px" }}>
                    <div className="panel-header-block" style={{ borderBottom: "1px solid #F4F1EA" }}>
                        <div className="panel-header-title-flex">
                            <RotateCcw size={18} className="rotate-icon-accent" />
                            <h3 style={{ fontSize: "15px", fontWeight: "600" }}>Pending Return Requests</h3>
                        </div>
                    </div>

                    <div className="panel-body-content" style={{ padding: "16px 24px" }}>
                        <div className="pending-requests-stack">
                            {pendingBooks.length > 0 ? (
                                pendingBooks.map((book) => (
                                    <div key={book.id} className="pending-strip-row">

                                        <div className="pending-left-payload">
                                            <Link to={`/main/catalog/${book.id}`}>
                                                <div className="pending-micro-thumb" style={{ backgroundColor: book.color }}>
                                                    {book.code}
                                                </div>
                                            </Link>
                                            <div className="text-truncator">
                                                <Link to={`/main/catalog/${book.id}`} className="pending-title-link">
                                                    {book.title}
                                                </Link>
                                                <p className="pending-timestamp-subtext">Requested on {book.requestedDate}</p>
                                            </div>
                                        </div>

                                        <div className="pending-right-meta-actions">
                                            <span className="badge-awaiting-confirmation">
                                                Awaiting Confirmation
                                            </span>
                                            <button
                                                onClick={() => handleCancelRequest(book.id)}
                                                className="btn-icon-cancel-request"
                                                title="Cancel return request"
                                            >
                                                <X size={15} />
                                            </button>
                                        </div>

                                    </div>
                                ))
                            ) : (
                                <div style={{ textAlign: "center", padding: "24px 0", color: "#A09E9A", fontSize: "13px" }}>
                                    No books are currently pending return check-in processing.
                                </div>
                            )}
                        </div>
                    </div>
                </div>

            </div>
        </main>
    );
}
import React, { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import { mockBooks } from "../data/mockBooks";
import { 
  Search, 
  SlidersHorizontal, 
  ChevronDown, 
  BookOpen, 
  User, 
  Star,
  ArrowUpDown
} from "lucide-react";

export default function Catalog() {
  const [searchQuery, setSearchQuery] = useState("");
  const [genreFilter, setGenreFilter] = useState("all");   
  const [statusFilter, setStatusFilter] = useState("all");  
  const [sortBy, setSortBy] = useState("title");           

  // Dropdown UI Focus Framework Toggles
  const [showGenreMenu, setShowGenreMenu] = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showSortMenu, setShowSortMenu] = useState(false);

  const dynamicGenres = useMemo(() => {
    const list = new Set();
    mockBooks.forEach(b => b.genres?.forEach(g => list.add(g)));
    return ["all", ...Array.from(list)];
  }, []);

  const processedBooks = useMemo(() => {
    let result = [...mockBooks];

    if (searchQuery.trim() !== "") {
      const q = searchQuery.toLowerCase();
      result = result.filter(b => 
        b.title.toLowerCase().includes(q) || 
        b.author.toLowerCase().includes(q) || 
        b.isbn?.includes(q)
      );
    }

    if (genreFilter !== "all") {
      result = result.filter(b => b.genres?.includes(genreFilter));
    }

    if (statusFilter !== "all") {
      result = result.filter(b => b.status?.toLowerCase() === statusFilter.toLowerCase());
    }

    result.sort((a, b) => {
      if (sortBy === "title") return a.title.localeCompare(b.title);
      if (sortBy === "author") return a.author.localeCompare(b.author);
      if (sortBy === "rating") return b.rating - a.rating;
      if (sortBy === "year") return b.year - a.year;     
      return 0;
    });

    return result;
  }, [searchQuery, genreFilter, statusFilter, sortBy]);

  const handleClearAll = () => {
    setSearchQuery("");
    setGenreFilter("all");
    setStatusFilter("all");
    setSortBy("title");
    setShowGenreMenu(false);
    setShowStatusMenu(false);
    setShowSortMenu(false);
  };

  return (
    <main id="scroll-container" style={{ padding: "24px" }}>
      <div className="max-width-limiter">
        
        <div className="view-heading-group" style={{ marginBottom: "24px" }}>
          <h1>Catalog</h1>
          <p>Browse, search, and discover books in the library</p>
        </div>

        <div className="catalog-filter-bar">
          <div className="filter-flex-wrapper">
            
            <div className="search-input-wrapper">
              <Search size={16} className="search-icon-embedded" />
              <input 
                type="text" 
                className="catalog-search-field" 
                placeholder="Search by title, author, or ISBN..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-selectors-group">
              
              <div style={{ position: "relative" }}>
                <button 
                  type="button" 
                  className="dropdown-combobox-trigger"
                  onClick={() => {
                    setShowGenreMenu(!showGenreMenu);
                    setShowStatusMenu(false);
                    setShowSortMenu(false);
                  }}
                >
                  <div className="combobox-text-side">
                    <SlidersHorizontal size={14} />
                    <span className="capitalize-fallback">
                      {genreFilter === "all" ? "All Genres" : genreFilter}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: "8px" }} />
                </button>

                {showGenreMenu && (
                  <div className="custom-floating-select-menu">
                    {dynamicGenres.map((g) => (
                      <button 
                        key={g} 
                        type="button" 
                        onClick={() => { setGenreFilter(g); setShowGenreMenu(false); }}
                        className={genreFilter === g ? "selected-option-highlight" : ""}
                      >
                        {g === "all" ? "All Genres" : g}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button 
                  type="button" 
                  className="dropdown-combobox-trigger"
                  onClick={() => {
                    setShowStatusMenu(!showStatusMenu);
                    setShowGenreMenu(false);
                    setShowSortMenu(false);
                  }}
                >
                  <div className="combobox-text-side">
                    <BookOpen size={14} />
                    <span className="capitalize-fallback">
                      {statusFilter === "all" ? "All Status" : statusFilter}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: "8px" }} />
                </button>

                {showStatusMenu && (
                  <div className="custom-floating-select-menu">
                    <button type="button" className={statusFilter === "all" ? "selected-option-highlight" : ""} onClick={() => { setStatusFilter("all"); setShowStatusMenu(false); }}>All Status</button>
                    <button type="button" className={statusFilter === "available" ? "selected-option-highlight" : ""} onClick={() => { setStatusFilter("available"); setShowStatusMenu(false); }}>Available</button>
                    <button type="button" className={statusFilter === "borrowed" ? "selected-option-highlight" : ""} onClick={() => { setStatusFilter("borrowed"); setShowStatusMenu(false); }}>Borrowed</button>
                  </div>
                )}
              </div>

              <div style={{ position: "relative" }}>
                <button 
                  type="button" 
                  className="dropdown-combobox-trigger"
                  onClick={() => {
                    setShowSortMenu(!showSortMenu);
                    setShowGenreMenu(false);
                    setShowStatusMenu(false);
                  }}
                >
                  <div className="combobox-text-side">
                    <ArrowUpDown size={14} />
                    <span className="capitalize-fallback">Sort: {sortBy}</span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: "8px" }} />
                </button>

                {showSortMenu && (
                  <div className="custom-floating-select-menu">
                    <button type="button" className={sortBy === "title" ? "selected-option-highlight" : ""} onClick={() => { setSortBy("title"); setShowSortMenu(false); }}>Title</button>
                    <button type="button" className={sortBy === "author" ? "selected-option-highlight" : ""} onClick={() => { setSortBy("author"); setShowSortMenu(false); }}>Author</button>
                    <button type="button" className={sortBy === "rating" ? "selected-option-highlight" : ""} onClick={() => { setSortBy("rating"); setShowSortMenu(false); }}>Rating</button>
                    <button type="button" className={sortBy === "year" ? "selected-option-highlight" : ""} onClick={() => { setSortBy("year"); setShowSortMenu(false); }}>Year Published</button>
                  </div>
                )}
              </div>

              <button type="button" className="btn-clear-filters-link" onClick={handleClearAll}>
                Clear
              </button>

            </div>
          </div>
        </div>

        <div className="catalog-results-counter" style={{ marginBottom: "16px" }}>
          <p>Showing <span className="catalog-counter-bold">{processedBooks.length}</span> of <span className="catalog-counter-bold">{mockBooks.length}</span> books</p>
        </div>

        <div className="catalog-inventory-grid">
          {processedBooks.length > 0 ? (
            processedBooks.map((book) => (
              <Link key={book.id} to={`/main/catalog/${book.id}`} className="book-inventory-card" style={{ textDecoration: 'none' }}>
                <div className="card-banner-graphic" style={{ backgroundColor: book.bgBanner }}>
                  <div>
                    <p className="banner-title-text">{book.title}</p>
                    <p className="banner-author-text">{book.author}</p>
                  </div>
                </div>
                <div className="card-details-body">
                  <div className="details-row-top">
                    <div className="details-metadata-stack">
                      <p className="details-book-title">{book.title}</p>
                      <div className="details-author-row"><User size={12} /><span>{book.author}</span></div>
                    </div>
                    <span className={`status-tag-badge ${book.status === "borrowed" ? "status-badge-borrowed" : "status-badge-returned"}`}>
                      {book.status}
                    </span>
                  </div>
                  <div className="details-row-metrics">
                    <div className="metric-stars-container"><Star size={12} fill="#FBBF24" color="#FBBF24" /><span>{book.rating}</span></div>
                    <span>{book.year}</span>
                    <span>{book.pages} pages</span>
                  </div>
                  <div className="details-row-genres">
                    {book.genres.map((genre, index) => <span key={index} className="genre-pill">{genre}</span>)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: "1 / -1", textAlign: "center", padding: "48px 0", color: "#A09E9A", fontSize: "14px" }}>
              No items matching selected catalog filter presets are currently available.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}
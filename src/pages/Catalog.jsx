import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import {
  Search, SlidersHorizontal, ChevronDown,
  BookOpen, User, Star, ArrowUpDown,
} from 'lucide-react';
import { api } from '../api/client';

export default function Catalog() {
  const [books,       setBooks]       = useState([]);
  const [genres,      setGenres]      = useState([]);
  const [total,       setTotal]       = useState(0);
  const [loading,     setLoading]     = useState(true);
  const [error,       setError]       = useState('');

  const [searchQuery,  setSearchQuery]  = useState('');
  const [genreFilter,  setGenreFilter]  = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy,       setSortBy]       = useState('title');

  const [showGenreMenu,  setShowGenreMenu]  = useState(false);
  const [showStatusMenu, setShowStatusMenu] = useState(false);
  const [showSortMenu,   setShowSortMenu]   = useState(false);

  // Debounced search
  const [debouncedSearch, setDebouncedSearch] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchQuery), 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const fetchBooks = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const params = {
        search: debouncedSearch || undefined,
        genre:  genreFilter !== 'all' ? genreFilter : undefined,
        status: statusFilter !== 'all' ? statusFilter : undefined,
        sort:   sortBy,
        limit:  100,
      };
      const result = await api.getBooks(params);
      setBooks(result.books);
      setTotal(result.pagination.total);
    } catch (err) {
      setError('Failed to load catalog.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [debouncedSearch, genreFilter, statusFilter, sortBy]);

  useEffect(() => { fetchBooks(); }, [fetchBooks]);

  // Load genres once
  useEffect(() => {
    api.getGenres()
      .then(data => setGenres(data))
      .catch(() => {});
  }, []);

  const handleClearAll = () => {
    setSearchQuery('');
    setGenreFilter('all');
    setStatusFilter('all');
    setSortBy('title');
    setShowGenreMenu(false);
    setShowStatusMenu(false);
    setShowSortMenu(false);
  };

  return (
    <main id="scroll-container" style={{ padding: '24px' }}>
      <div className="max-width-limiter">

        <div className="view-heading-group" style={{ marginBottom: '24px' }}>
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
                placeholder="Search by title, author, or ISBN…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
            </div>

            <div className="filter-selectors-group">

              {/* Genre filter */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="dropdown-combobox-trigger"
                  onClick={() => { setShowGenreMenu(!showGenreMenu); setShowStatusMenu(false); setShowSortMenu(false); }}
                >
                  <div className="combobox-text-side">
                    <SlidersHorizontal size={14} />
                    <span className="capitalize-fallback">
                      {genreFilter === 'all' ? 'All Genres' : genreFilter}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />
                </button>
                {showGenreMenu && (
                  <div className="custom-floating-select-menu">
                    <button type="button" className={genreFilter === 'all' ? 'selected-option-highlight' : ''} onClick={() => { setGenreFilter('all'); setShowGenreMenu(false); }}>All Genres</button>
                    {genres.map(g => (
                      <button key={g.name} type="button" className={genreFilter === g.name ? 'selected-option-highlight' : ''} onClick={() => { setGenreFilter(g.name); setShowGenreMenu(false); }}>
                        {g.name} <span style={{ opacity: 0.5, fontSize: '11px' }}>({g.count})</span>
                      </button>
                    ))}
                  </div>
                )}
              </div>

              {/* Status filter */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="dropdown-combobox-trigger"
                  onClick={() => { setShowStatusMenu(!showStatusMenu); setShowGenreMenu(false); setShowSortMenu(false); }}
                >
                  <div className="combobox-text-side">
                    <BookOpen size={14} />
                    <span className="capitalize-fallback">
                      {statusFilter === 'all' ? 'All Status' : statusFilter}
                    </span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />
                </button>
                {showStatusMenu && (
                  <div className="custom-floating-select-menu">
                    <button type="button" className={statusFilter === 'all'       ? 'selected-option-highlight' : ''} onClick={() => { setStatusFilter('all');       setShowStatusMenu(false); }}>All Status</button>
                    <button type="button" className={statusFilter === 'available' ? 'selected-option-highlight' : ''} onClick={() => { setStatusFilter('available'); setShowStatusMenu(false); }}>Available</button>
                    <button type="button" className={statusFilter === 'borrowed'  ? 'selected-option-highlight' : ''} onClick={() => { setStatusFilter('borrowed');  setShowStatusMenu(false); }}>Borrowed</button>
                  </div>
                )}
              </div>

              {/* Sort */}
              <div style={{ position: 'relative' }}>
                <button
                  type="button"
                  className="dropdown-combobox-trigger"
                  onClick={() => { setShowSortMenu(!showSortMenu); setShowGenreMenu(false); setShowStatusMenu(false); }}
                >
                  <div className="combobox-text-side">
                    <ArrowUpDown size={14} />
                    <span className="capitalize-fallback">Sort: {sortBy}</span>
                  </div>
                  <ChevronDown size={14} style={{ opacity: 0.5, marginLeft: '8px' }} />
                </button>
                {showSortMenu && (
                  <div className="custom-floating-select-menu">
                    {['title','author','rating','year'].map(s => (
                      <button key={s} type="button" className={sortBy === s ? 'selected-option-highlight' : ''} onClick={() => { setSortBy(s); setShowSortMenu(false); }}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button type="button" className="btn-clear-filters-link" onClick={handleClearAll}>
                Clear
              </button>
            </div>
          </div>
        </div>

        <div className="catalog-results-counter" style={{ marginBottom: '16px' }}>
          {loading ? (
            <p>Loading…</p>
          ) : (
            <p>Showing <span className="catalog-counter-bold">{books.length}</span> of <span className="catalog-counter-bold">{total}</span> books</p>
          )}
        </div>

        {error && <div className="error-state-block" style={{ marginBottom: '16px' }}>{error}</div>}

        <div className="catalog-inventory-grid">
          {loading ? (
            Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="book-inventory-card skeleton-card" />
            ))
          ) : books.length > 0 ? (
            books.map((book) => (
              <Link key={book.id} to={`/main/catalog/${book.id}`} className="book-inventory-card" style={{ textDecoration: 'none' }}>
                <div className="card-banner-graphic" style={{ backgroundColor: book.bg_banner }}>
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
                    <span className={`status-tag-badge ${book.status === 'borrowed' ? 'status-badge-borrowed' : 'status-badge-returned'}`}>
                      {book.status}
                    </span>
                  </div>
                  <div className="details-row-metrics">
                    <div className="metric-stars-container"><Star size={12} fill="#FBBF24" color="#FBBF24" /><span>{book.rating}</span></div>
                    <span>{book.year}</span>
                    <span>{book.pages} pages</span>
                  </div>
                  <div className="details-row-genres">
                    {book.genres?.map((genre, index) => <span key={index} className="genre-pill">{genre}</span>)}
                  </div>
                </div>
              </Link>
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '48px 0', color: '#A09E9A', fontSize: '14px' }}>
              No books match your current filters.
            </div>
          )}
        </div>

      </div>
    </main>
  );
}

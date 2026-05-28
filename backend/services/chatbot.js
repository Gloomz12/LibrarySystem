/**
 * Library Chatbot — Intent-based NLP engine
 *
 * No external API. Runs entirely in-process.
 *
 * Architecture:
 *   1. Tokenize + normalize the user message
 *   2. Score each intent using keyword matching + TF-IDF-like weighting
 *   3. Extract entities (book titles, author names, genres) from the message
 *   4. Dispatch to the matched intent handler which queries the DB
 *   5. Return a structured response with text + optional action cards
 *
 * Intents:
 *   greeting, farewell, help,
 *   my_loans, due_dates, overdue,
 *   search_book, book_info, availability,
 *   recommendations, similar_books,
 *   borrow_how, return_how, fines,
 *   catalog_stats, popular_books,
 *   my_history, my_fines,
 *   fallback
 */

'use strict';
const pool = require('../db/connection');
const { getRecommendations } = require('./aiEngine');

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT DEFINITIONS
// ═══════════════════════════════════════════════════════════════════════════════

const INTENTS = [
  {
    name: 'greeting',
    patterns: ['hello', 'hi', 'hey', 'good morning', 'good afternoon', 'good evening', 'howdy', 'sup', 'greetings'],
    weight: 1.0,
  },
  {
    name: 'farewell',
    patterns: ['bye', 'goodbye', 'see you', 'later', 'take care', 'thanks bye', 'thank you bye'],
    weight: 1.0,
  },
  {
    name: 'help',
    patterns: ['help', 'what can you do', 'commands', 'options', 'how do i', 'what do you know', 'capabilities', 'assist'],
    weight: 0.9,
  },
  {
    name: 'my_loans',
    patterns: ['my books', 'borrowed books', 'current loans', 'what am i borrowing', 'books i have', 'my borrowed', 'active loans', 'currently borrowed', 'what do i have'],
    weight: 1.2,
  },
  {
    name: 'due_dates',
    patterns: ['due date', 'when is due', 'return date', 'deadline', 'when do i return', 'due soon', 'expiring', 'due this week'],
    weight: 1.2,
  },
  {
    name: 'overdue',
    patterns: ['overdue', 'late', 'past due', 'missed deadline', 'overdue books', 'late return'],
    weight: 1.3,
  },
  {
    name: 'my_fines',
    patterns: ['my fines', 'how much do i owe', 'penalty', 'fine amount', 'outstanding balance', 'charges'],
    weight: 1.2,
  },
  {
    name: 'search_book',
    patterns: ['find book', 'search for', 'look for', 'do you have', 'is there a book', 'find me', 'search book', 'looking for'],
    weight: 1.1,
  },
  {
    name: 'availability',
    patterns: ['available', 'is it available', 'can i borrow', 'in stock', 'is the book available', 'available now', 'free to borrow'],
    weight: 1.1,
  },
  {
    name: 'recommendations',
    patterns: ['recommend', 'suggestion', 'what should i read', 'suggest a book', 'what to read', 'book recommendation', 'good books', 'what books', 'any recommendations'],
    weight: 1.2,
  },
  {
    name: 'popular_books',
    patterns: ['popular', 'most borrowed', 'trending', 'top books', 'best books', 'frequently borrowed', 'what is popular'],
    weight: 1.1,
  },
  {
    name: 'catalog_stats',
    patterns: ['how many books', 'total books', 'catalog size', 'library size', 'number of books', 'books in library', 'collection'],
    weight: 1.0,
  },
  {
    name: 'my_history',
    patterns: ['reading history', 'books i read', 'past books', 'previously borrowed', 'history', 'what have i read', 'my reading'],
    weight: 1.1,
  },
  {
    name: 'borrow_how',
    patterns: ['how to borrow', 'borrow a book', 'borrowing process', 'how do i borrow', 'request a book', 'checkout'],
    weight: 1.0,
  },
  {
    name: 'return_how',
    patterns: ['how to return', 'return a book', 'returning process', 'how do i return', 'return request'],
    weight: 1.0,
  },
  {
    name: 'book_info',
    patterns: ['tell me about', 'info about', 'details about', 'what is', 'describe', 'synopsis', 'summary of', 'about the book'],
    weight: 1.0,
  },
  {
    name: 'genres',
    patterns: ['genres', 'categories', 'types of books', 'what genres', 'fiction', 'non-fiction', 'fantasy', 'mystery', 'romance', 'science fiction'],
    weight: 0.9,
  },
];

// ═══════════════════════════════════════════════════════════════════════════════
// NLP UTILITIES
// ═══════════════════════════════════════════════════════════════════════════════

function tokenize(text) {
  return text.toLowerCase()
    .replace(/[^\w\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length > 1);
}

function scoreIntent(tokens, intent) {
  const text = tokens.join(' ');
  let score = 0;
  for (const pattern of intent.patterns) {
    if (text.includes(pattern)) {
      // Longer pattern matches score higher
      score += (pattern.split(' ').length * 2) * intent.weight;
    } else {
      // Partial token match
      const patternTokens = pattern.split(' ');
      const matches = patternTokens.filter(pt => tokens.includes(pt)).length;
      if (matches > 0) {
        score += (matches / patternTokens.length) * intent.weight;
      }
    }
  }
  return score;
}

function classifyIntent(message) {
  const tokens = tokenize(message);
  let best = { name: 'fallback', score: 0 };

  for (const intent of INTENTS) {
    const score = scoreIntent(tokens, intent);
    if (score > best.score) {
      best = { name: intent.name, score };
    }
  }

  // Minimum confidence threshold
  return best.score >= 0.5 ? best.name : 'fallback';
}

/**
 * Extract a potential book title or author name from the message.
 * Strategy: remove known stop words and intent keywords, return remainder.
 */
function extractSearchQuery(message) {
  const stopWords = new Set([
    'find', 'search', 'look', 'for', 'a', 'the', 'book', 'about', 'tell',
    'me', 'do', 'you', 'have', 'is', 'there', 'any', 'can', 'i', 'borrow',
    'available', 'info', 'details', 'describe', 'what', 'similar', 'to',
    'like', 'recommend', 'suggest', 'please', 'show', 'get', 'give',
  ]);
  const tokens = tokenize(message).filter(t => !stopWords.has(t));
  return tokens.join(' ').trim();
}

// ═══════════════════════════════════════════════════════════════════════════════
// INTENT HANDLERS
// ═══════════════════════════════════════════════════════════════════════════════

async function handleGreeting(user) {
  const hour = new Date().getHours();
  const timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
  return {
    text: `${timeGreeting}, ${user.name.split(' ')[0]}! 👋 I'm your library assistant. I can help you with your loans, book recommendations, catalog searches, and more. What can I do for you?`,
    suggestions: ['My borrowed books', 'Recommend me a book', 'Search for a book', 'Help'],
  };
}

async function handleFarewell(user) {
  return {
    text: `Goodbye, ${user.name.split(' ')[0]}! Happy reading! 📚`,
    suggestions: [],
  };
}

async function handleHelp() {
  return {
    text: `Here's what I can help you with:\n\n📚 **Your Account**\n• "My borrowed books" — see your active loans\n• "My due dates" — check when books are due\n• "My reading history" — books you've read\n• "My fines" — check outstanding fines\n\n🔍 **Catalog**\n• "Find [book title]" — search the catalog\n• "Is [book] available?" — check availability\n• "Popular books" — most borrowed titles\n• "How many books are in the library?"\n\n🤖 **AI Features**\n• "Recommend me a book" — personalized picks\n• "Books similar to [title]"\n\n📋 **How-To**\n• "How do I borrow a book?"\n• "How do I return a book?"`,
    suggestions: ['My borrowed books', 'Recommend me a book', 'Popular books', 'My fines'],
  };
}

async function handleMyLoans(userId) {
  const [loans] = await pool.execute(`
    SELECT t.id AS transaction_id, t.due_date, t.created_at,
           b.title, b.author, b.code, b.bg_banner,
           DATEDIFF(t.due_date, CURDATE()) AS days_remaining
    FROM transactions t
    JOIN books b ON b.id = t.book_id
    WHERE t.user_id = ? AND t.type = 'borrow'
      AND t.status = 'approved' AND t.returned_at IS NULL
    ORDER BY t.due_date ASC`, [userId]);

  if (loans.length === 0) {
    return {
      text: `You don't have any books borrowed right now. Would you like me to recommend something to read?`,
      suggestions: ['Recommend me a book', 'Search for a book', 'Popular books'],
    };
  }

  const overdue = loans.filter(l => parseInt(l.days_remaining) < 0);
  const dueSoon = loans.filter(l => parseInt(l.days_remaining) >= 0 && parseInt(l.days_remaining) <= 3);

  let text = `You currently have **${loans.length}** book${loans.length > 1 ? 's' : ''} borrowed:\n\n`;
  loans.forEach((l, i) => {
    const days = parseInt(l.days_remaining);
    const status = days < 0 ? `⚠️ ${Math.abs(days)}d overdue` : days === 0 ? '⚠️ Due today' : `${days}d left`;
    text += `${i + 1}. **${l.title}** by ${l.author}\n   Due: ${l.due_date} · ${status}\n\n`;
  });

  if (overdue.length > 0) text += `\n⚠️ You have ${overdue.length} overdue book${overdue.length > 1 ? 's' : ''}. Please return ${overdue.length > 1 ? 'them' : 'it'} as soon as possible.`;
  else if (dueSoon.length > 0) text += `\n📅 ${dueSoon.length} book${dueSoon.length > 1 ? 's are' : ' is'} due within 3 days.`;

  return {
    text,
    cards: loans.map(l => ({
      type: 'book',
      id: l.book_id,
      title: l.title,
      author: l.author,
      code: l.code,
      bgBanner: l.bg_banner,
      badge: parseInt(l.days_remaining) < 0 ? 'overdue' : parseInt(l.days_remaining) <= 3 ? 'due-soon' : 'active',
      meta: `Due ${l.due_date}`,
    })),
    suggestions: ['My due dates', 'Request a return', 'My fines'],
  };
}

async function handleDueDates(userId) {
  const [loans] = await pool.execute(`
    SELECT b.title, b.author, t.due_date,
           DATEDIFF(t.due_date, CURDATE()) AS days_remaining
    FROM transactions t JOIN books b ON b.id = t.book_id
    WHERE t.user_id = ? AND t.type = 'borrow'
      AND t.status = 'approved' AND t.returned_at IS NULL
    ORDER BY t.due_date ASC`, [userId]);

  if (loans.length === 0) {
    return { text: `You have no active loans, so no due dates to worry about! 🎉`, suggestions: ['Recommend me a book'] };
  }

  let text = `📅 **Your due dates:**\n\n`;
  loans.forEach(l => {
    const days = parseInt(l.days_remaining);
    const urgency = days < 0 ? '🔴' : days <= 3 ? '🟡' : '🟢';
    const label   = days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? 'Due TODAY' : `${days} days remaining`;
    text += `${urgency} **${l.title}**\n   Due: ${l.due_date} · ${label}\n\n`;
  });

  return { text, suggestions: ['My borrowed books', 'How do I return a book?'] };
}

async function handleOverdue(userId) {
  const [loans] = await pool.execute(`
    SELECT b.title, b.author, b.code, b.bg_banner, t.due_date,
           DATEDIFF(CURDATE(), t.due_date) AS days_late
    FROM transactions t JOIN books b ON b.id = t.book_id
    WHERE t.user_id = ? AND t.type = 'borrow'
      AND t.status = 'approved' AND t.returned_at IS NULL
      AND t.due_date < CURDATE()
    ORDER BY t.due_date ASC`, [userId]);

  if (loans.length === 0) {
    return { text: `Great news — you have no overdue books! ✅ Keep it up.`, suggestions: ['My borrowed books', 'My due dates'] };
  }

  let text = `⚠️ You have **${loans.length}** overdue book${loans.length > 1 ? 's' : ''}:\n\n`;
  loans.forEach(l => {
    text += `• **${l.title}** — ${l.days_late} day${l.days_late > 1 ? 's' : ''} late\n`;
  });
  text += `\nPlease request a return from the **My Books** page as soon as possible to avoid additional fines.`;

  return {
    text,
    cards: loans.map(l => ({ type: 'book', id: null, title: l.title, author: l.author, code: l.code, bgBanner: l.bg_banner, badge: 'overdue', meta: `${l.days_late}d late` })),
    suggestions: ['How do I return a book?', 'My fines'],
  };
}

async function handleMyFines(userId) {
  const [[user]] = await pool.execute(`SELECT fines FROM users WHERE id = ?`, [userId]);
  const fines = parseFloat(user?.fines || 0);

  if (fines === 0) {
    return { text: `You have no outstanding fines. 🎉 Your account is in good standing!`, suggestions: ['My borrowed books'] };
  }
  return {
    text: `You currently have an outstanding fine of **$${fines.toFixed(2)}**. Please contact the library desk to settle your balance.`,
    suggestions: ['My overdue books', 'How do I return a book?'],
  };
}

async function handleSearchBook(message) {
  const query = extractSearchQuery(message);
  if (!query || query.length < 2) {
    return { text: `What book are you looking for? Try: "Find Harry Potter" or "Search for Agatha Christie"`, suggestions: [] };
  }

  const like = `%${query}%`;
  const [books] = await pool.execute(`
    SELECT b.id, b.code, b.title, b.author, b.rating, b.status, b.bg_banner, b.year
    FROM books b
    WHERE b.title LIKE ? OR b.author LIKE ? OR b.isbn LIKE ?
    ORDER BY
      CASE WHEN b.title LIKE ? THEN 0 ELSE 1 END,
      b.rating DESC
    LIMIT 5`, [like, like, like, like]);

  if (books.length === 0) {
    return {
      text: `I couldn't find any books matching **"${query}"**. Try a different title or author name.`,
      suggestions: ['Popular books', 'Recommend me a book'],
    };
  }

  const available = books.filter(b => b.status === 'available').length;
  let text = `Found **${books.length}** result${books.length > 1 ? 's' : ''} for "${query}" (${available} available):\n\n`;
  books.forEach(b => {
    text += `• **${b.title}** by ${b.author} (${b.year}) — ${b.status === 'available' ? '✅ Available' : '❌ Borrowed'}\n`;
  });

  return {
    text,
    cards: books.map(b => ({ type: 'book', id: b.id, title: b.title, author: b.author, code: b.code, bgBanner: b.bg_banner, badge: b.status, meta: `⭐ ${b.rating}` })),
    suggestions: books.filter(b => b.status === 'available').length > 0 ? ['How do I borrow a book?'] : ['Recommend me a book'],
  };
}

async function handleAvailability(message) {
  const query = extractSearchQuery(message);
  if (!query || query.length < 2) {
    return { text: `Which book would you like to check? Try: "Is 1984 available?"`, suggestions: [] };
  }

  const [books] = await pool.execute(`
    SELECT b.id, b.title, b.author, b.status, b.code, b.bg_banner
    FROM books b WHERE b.title LIKE ? OR b.author LIKE ?
    ORDER BY CASE WHEN b.title LIKE ? THEN 0 ELSE 1 END LIMIT 3`,
    [`%${query}%`, `%${query}%`, `%${query}%`]);

  if (books.length === 0) {
    return { text: `I couldn't find a book matching **"${query}"** in our catalog.`, suggestions: ['Search for a book', 'Popular books'] };
  }

  const book = books[0];
  const isAvailable = book.status === 'available';
  const text = isAvailable
    ? `✅ **${book.title}** by ${book.author} is **available** to borrow! Head to the Catalog to request it.`
    : `❌ **${book.title}** by ${book.author} is currently **borrowed**. Check back later or browse similar books.`;

  return {
    text,
    cards: [{ type: 'book', id: book.id, title: book.title, author: book.author, code: book.code, bgBanner: book.bg_banner, badge: book.status, meta: isAvailable ? 'Available now' : 'Currently borrowed' }],
    suggestions: isAvailable ? ['How do I borrow a book?'] : ['Recommend me a book'],
  };
}

async function handleRecommendations(userId) {
  const recs = await getRecommendations(userId, 4);

  if (recs.length === 0) {
    return { text: `I don't have enough reading history to personalize recommendations yet. Borrow a few books and I'll learn your taste! In the meantime, here are our top-rated books.`, suggestions: ['Popular books', 'Search for a book'] };
  }

  const isPersonalized = recs[0]?.algorithm !== 'cold-start';
  const intro = isPersonalized
    ? `Based on your reading history, here are **${recs.length}** books I think you'll enjoy:`
    : `Here are our top-rated books to get you started:`;

  return {
    text: intro,
    cards: recs.map(b => ({ type: 'book', id: b.id, title: b.title, author: b.author, code: b.code, bgBanner: b.bg_banner, badge: b.status, meta: b.reason || `⭐ ${b.rating}` })),
    suggestions: ['Tell me more about a book', 'Search for a book'],
  };
}

async function handlePopularBooks() {
  const [books] = await pool.execute(`
    SELECT b.id, b.code, b.title, b.author, b.rating, b.status, b.bg_banner,
           COUNT(t.id) AS borrow_count
    FROM books b
    LEFT JOIN transactions t ON t.book_id = b.id AND t.type = 'borrow' AND t.status = 'approved'
    GROUP BY b.id
    ORDER BY borrow_count DESC, b.rating DESC
    LIMIT 5`);

  if (books.length === 0) {
    return { text: `No borrow history yet — be the first to borrow a book!`, suggestions: ['Search for a book'] };
  }

  let text = `📈 **Most popular books in the library:**\n\n`;
  books.forEach((b, i) => {
    text += `${i + 1}. **${b.title}** by ${b.author}\n   ${b.borrow_count} borrow${b.borrow_count !== 1 ? 's' : ''} · ⭐ ${b.rating} · ${b.status === 'available' ? '✅ Available' : '❌ Borrowed'}\n\n`;
  });

  return {
    text,
    cards: books.map(b => ({ type: 'book', id: b.id, title: b.title, author: b.author, code: b.code, bgBanner: b.bg_banner, badge: b.status, meta: `${b.borrow_count} borrows` })),
    suggestions: ['Recommend me a book', 'Search for a book'],
  };
}

async function handleCatalogStats() {
  const [[stats]] = await pool.execute(`
    SELECT COUNT(*) AS total,
           SUM(status='available') AS available,
           SUM(status='borrowed')  AS borrowed
    FROM books`);
  const [[genreCount]] = await pool.execute(`SELECT COUNT(DISTINCT name) AS total FROM genres`);

  return {
    text: `📚 **Library Catalog:**\n\n• **${stats.total}** total books\n• **${stats.available}** available to borrow\n• **${stats.borrowed}** currently borrowed\n• **${genreCount.total}** genres covered\n\nUse the Catalog page to browse and filter all books.`,
    suggestions: ['Popular books', 'Search for a book', 'Recommend me a book'],
  };
}

async function handleMyHistory(userId) {
  const [history] = await pool.execute(`
    SELECT b.title, b.author, b.code, b.bg_banner, rh.read_at
    FROM reading_history rh JOIN books b ON b.id = rh.book_id
    WHERE rh.user_id = ?
    ORDER BY rh.read_at DESC LIMIT 6`, [userId]);

  if (history.length === 0) {
    return { text: `You haven't borrowed any books yet. Let me recommend something to start your reading journey!`, suggestions: ['Recommend me a book', 'Popular books'] };
  }

  let text = `📖 **Your reading history** (${history.length} book${history.length > 1 ? 's' : ''}):\n\n`;
  history.forEach(b => {
    text += `• **${b.title}** by ${b.author}\n`;
  });

  return {
    text,
    cards: history.map(b => ({ type: 'book', id: null, title: b.title, author: b.author, code: b.code, bgBanner: b.bg_banner, badge: 'read', meta: new Date(b.read_at).toLocaleDateString() })),
    suggestions: ['Recommend me a book', 'My borrowed books'],
  };
}

function handleBorrowHow() {
  return {
    text: `📋 **How to borrow a book:**\n\n1. Go to the **Catalog** page\n2. Find the book you want\n3. Click on it to open the book details\n4. Click **"Request to Borrow"**\n5. Wait for admin approval (usually within 24 hours)\n6. Once approved, the book is yours until the due date!\n\nYou can track your requests in **My Books** or **Transactions**.`,
    suggestions: ['Search for a book', 'Recommend me a book', 'My borrowed books'],
  };
}

function handleReturnHow() {
  return {
    text: `🔄 **How to return a book:**\n\n1. Go to **My Books** in the sidebar\n2. Find the book you want to return\n3. Click **"Request Return"**\n4. Wait for the librarian to confirm the return\n5. Once confirmed, the book is marked as returned\n\nMake sure to return books before their due date to avoid fines!`,
    suggestions: ['My borrowed books', 'My due dates', 'My fines'],
  };
}

async function handleGenres() {
  const [genres] = await pool.execute(`
    SELECT g.name, COUNT(bg.book_id) AS count
    FROM genres g LEFT JOIN book_genres bg ON bg.genre_id = g.id
    GROUP BY g.id, g.name ORDER BY count DESC LIMIT 10`);

  let text = `📚 **Available genres in our catalog:**\n\n`;
  genres.forEach(g => { text += `• **${g.name}** — ${g.count} book${g.count !== 1 ? 's' : ''}\n`; });
  text += `\nUse the Catalog page to filter by genre.`;

  return { text, suggestions: ['Search for a book', 'Recommend me a book'] };
}

function handleFallback(message) {
  const isQuestion = message.includes('?');
  return {
    text: isQuestion
      ? `I'm not sure how to answer that. I'm specialized in library topics — try asking about your loans, book recommendations, or searching the catalog.`
      : `I didn't quite understand that. Here are some things I can help with:`,
    suggestions: ['My borrowed books', 'Recommend me a book', 'Search for a book', 'Help'],
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// MAIN DISPATCH
// ═══════════════════════════════════════════════════════════════════════════════

async function processMessage(message, user) {
  const intent = classifyIntent(message);

  try {
    switch (intent) {
      case 'greeting':       return await handleGreeting(user);
      case 'farewell':       return await handleFarewell(user);
      case 'help':           return handleHelp();
      case 'my_loans':       return await handleMyLoans(user.id);
      case 'due_dates':      return await handleDueDates(user.id);
      case 'overdue':        return await handleOverdue(user.id);
      case 'my_fines':       return await handleMyFines(user.id);
      case 'search_book':    return await handleSearchBook(message);
      case 'availability':   return await handleAvailability(message);
      case 'recommendations':return await handleRecommendations(user.id);
      case 'popular_books':  return await handlePopularBooks();
      case 'catalog_stats':  return await handleCatalogStats();
      case 'my_history':     return await handleMyHistory(user.id);
      case 'borrow_how':     return handleBorrowHow();
      case 'return_how':     return handleReturnHow();
      case 'genres':         return await handleGenres();
      case 'book_info':      return await handleSearchBook(message); // reuse search
      default:               return handleFallback(message);
    }
  } catch (err) {
    console.error('Chatbot handler error:', err);
    return { text: `Sorry, I ran into an issue fetching that information. Please try again.`, suggestions: ['Help'] };
  }
}

module.exports = { processMessage };

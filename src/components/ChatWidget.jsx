import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User, Sparkles } from 'lucide-react';
import { api } from '../api/client';
import { useAuth } from '../context/AuthContext';

// ── Message renderer — supports **bold** markdown ────────────────────────────
function MessageText({ text }) {
  if (!text) return null;
  // Split on **bold** markers and render
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return (
    <span>
      {parts.map((part, i) => {
        if (part.startsWith('**') && part.endsWith('**')) {
          return <strong key={i}>{part.slice(2, -2)}</strong>;
        }
        // Preserve newlines
        return part.split('\n').map((line, j, arr) => (
          <React.Fragment key={`${i}-${j}`}>
            {line}
            {j < arr.length - 1 && <br />}
          </React.Fragment>
        ));
      })}
    </span>
  );
}

// ── Book card inside chat ─────────────────────────────────────────────────────
function BookCard({ card }) {
  const badgeStyle = {
    available:  { bg: '#F0FDF4', color: '#15803D', border: '#BBF7D0', label: 'Available' },
    borrowed:   { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Borrowed' },
    overdue:    { bg: '#FEF2F2', color: '#DC2626', border: '#FECACA', label: 'Overdue' },
    'due-soon': { bg: '#FFF7ED', color: '#D97706', border: '#FED7AA', label: 'Due Soon' },
    active:     { bg: '#EFF6FF', color: '#1D4ED8', border: '#BFDBFE', label: 'Active' },
    read:       { bg: '#F5F3FF', color: '#7C3AED', border: '#DDD6FE', label: 'Read' },
  };
  const bs = badgeStyle[card.badge] || badgeStyle.available;

  const inner = (
    <div className="chat-book-card">
      <div className="chat-book-cover" style={{ backgroundColor: card.bgBanner || '#44403C' }}>
        {card.code || card.title?.substring(0, 2).toUpperCase()}
      </div>
      <div className="chat-book-info">
        <p className="chat-book-title">{card.title}</p>
        <p className="chat-book-author">{card.author}</p>
        {card.meta && <p className="chat-book-meta">{card.meta}</p>}
      </div>
      <span className="chat-book-badge" style={{ background: bs.bg, color: bs.color, border: `1px solid ${bs.border}` }}>
        {bs.label}
      </span>
    </div>
  );

  return card.id
    ? <Link to={`/main/catalog/${card.id}`} style={{ textDecoration: 'none' }}>{inner}</Link>
    : inner;
}

// ── Typing indicator ──────────────────────────────────────────────────────────
function TypingIndicator() {
  return (
    <div className="chat-message chat-message-bot">
      <div className="chat-avatar chat-avatar-bot"><Bot size={14} /></div>
      <div className="chat-bubble chat-bubble-bot chat-typing">
        <span /><span /><span />
      </div>
    </div>
  );
}

// ── Main ChatWidget ───────────────────────────────────────────────────────────
export default function ChatWidget() {
  const { user } = useAuth();
  const [open,     setOpen]     = useState(false);
  const [messages, setMessages] = useState([]);
  const [input,    setInput]    = useState('');
  const [loading,  setLoading]  = useState(false);
  const [unread,   setUnread]   = useState(0);
  const bottomRef  = useRef(null);
  const inputRef   = useRef(null);

  // Welcome message on first open
  useEffect(() => {
    if (open && messages.length === 0) {
      const firstName = user?.name?.split(' ')[0] || 'there';
      setMessages([{
        id: 'welcome',
        role: 'bot',
        text: `Hi ${firstName}! 👋 I'm your library assistant. I can help you with your loans, book recommendations, catalog searches, and more.\n\nWhat can I help you with today?`,
        suggestions: ['My borrowed books', 'Recommend me a book', 'Popular books', 'Help'],
        timestamp: new Date().toISOString(),
      }]);
    }
    if (open) {
      setUnread(0);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim();
    if (!trimmed || loading) return;

    const userMsg = {
      id:        Date.now().toString(),
      role:      'user',
      text:      trimmed,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.chat(trimmed);
      const botMsg = {
        id:          (Date.now() + 1).toString(),
        role:        'bot',
        text:        response.text,
        cards:       response.cards || [],
        suggestions: response.suggestions || [],
        timestamp:   response.timestamp,
      };
      setMessages(prev => [...prev, botMsg]);
      if (!open) setUnread(n => n + 1);
    } catch (err) {
      setMessages(prev => [...prev, {
        id:        (Date.now() + 1).toString(),
        role:      'bot',
        text:      'Sorry, I had trouble connecting. Please try again.',
        suggestions: ['Help'],
        timestamp: new Date().toISOString(),
      }]);
    } finally {
      setLoading(false);
    }
  }, [loading, open]);

  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage(input);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage(input);
    }
  };

  return (
    <>
      {/* Floating toggle button */}
      <button
        className="chat-fab"
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Close chat' : 'Open library assistant'}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
        {!open && unread > 0 && (
          <span className="chat-fab-badge">{unread}</span>
        )}
      </button>

      {/* Chat panel */}
      {open && (
        <div className="chat-panel" role="dialog" aria-label="Library Assistant">

          {/* Header */}
          <div className="chat-header">
            <div className="chat-header-info">
              <div className="chat-header-avatar">
                <Sparkles size={16} />
              </div>
              <div>
                <p className="chat-header-title">Library Assistant</p>
                <p className="chat-header-sub">Powered by AI · Always here to help</p>
              </div>
            </div>
            <button className="chat-close-btn" onClick={() => setOpen(false)} aria-label="Close">
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="chat-messages">
            {messages.map(msg => (
              <div key={msg.id} className={`chat-message chat-message-${msg.role}`}>

                {msg.role === 'bot' && (
                  <div className="chat-avatar chat-avatar-bot"><Bot size={14} /></div>
                )}

                <div className={`chat-bubble-wrapper`}>
                  <div className={`chat-bubble chat-bubble-${msg.role}`}>
                    <MessageText text={msg.text} />
                  </div>

                  {/* Book cards */}
                  {msg.cards?.length > 0 && (
                    <div className="chat-cards">
                      {msg.cards.map((card, i) => (
                        <BookCard key={i} card={card} />
                      ))}
                    </div>
                  )}

                  {/* Suggestion chips */}
                  {msg.suggestions?.length > 0 && (
                    <div className="chat-suggestions">
                      {msg.suggestions.map((s, i) => (
                        <button key={i} className="chat-suggestion-chip"
                          onClick={() => sendMessage(s)} disabled={loading}>
                          {s}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="chat-avatar chat-avatar-user">
                    {user?.name?.charAt(0).toUpperCase() || <User size={14} />}
                  </div>
                )}
              </div>
            ))}

            {loading && <TypingIndicator />}
            <div ref={bottomRef} />
          </div>

          {/* Input */}
          <form className="chat-input-form" onSubmit={handleSubmit}>
            <input
              ref={inputRef}
              type="text"
              className="chat-input-field"
              placeholder="Ask me anything about the library…"
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading}
              maxLength={500}
              autoComplete="off"
            />
            <button
              type="submit"
              className="chat-send-btn"
              disabled={loading || !input.trim()}
              aria-label="Send message"
            >
              <Send size={16} />
            </button>
          </form>

        </div>
      )}
    </>
  );
}

-- Library System Database Schema
-- Run this file to initialize the database

CREATE DATABASE IF NOT EXISTS library_system
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE library_system;

-- ─────────────────────────────────────────────
-- USERS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS users (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  student_id    VARCHAR(20)  UNIQUE,                  -- e.g. ST2024001 (null for admins)
  name          VARCHAR(100) NOT NULL,
  email         VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,                -- bcrypt hash
  role          ENUM('admin','student') NOT NULL DEFAULT 'student',
  return_rate   DECIMAL(5,2) NOT NULL DEFAULT 100.00, -- 0-100 %
  fines         DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  is_active     BOOLEAN NOT NULL DEFAULT TRUE,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Refresh tokens (stored hashed)
CREATE TABLE IF NOT EXISTS refresh_tokens (
  id         VARCHAR(36)  NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36)  NOT NULL,
  token_hash VARCHAR(255) NOT NULL,
  expires_at DATETIME     NOT NULL,
  created_at DATETIME     NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  INDEX idx_user_id (user_id),
  INDEX idx_expires (expires_at)
);

-- ─────────────────────────────────────────────
-- BOOKS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS books (
  id           VARCHAR(36)  NOT NULL PRIMARY KEY,
  code         VARCHAR(10)  NOT NULL,                 -- 2-char display abbreviation
  title        VARCHAR(255) NOT NULL,
  author       VARCHAR(150) NOT NULL,
  isbn         VARCHAR(20)  UNIQUE,
  year         SMALLINT,
  pages        SMALLINT,
  rating       DECIMAL(3,1) NOT NULL DEFAULT 0.0,
  description  TEXT,
  author_bio   TEXT,
  author_meta  VARCHAR(255),
  bg_banner    VARCHAR(10)  NOT NULL DEFAULT '#44403C', -- hex color
  status       ENUM('available','borrowed') NOT NULL DEFAULT 'available',
  created_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at   DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FULLTEXT INDEX ft_books (title, author, description)
);

-- Genres (many-to-many)
CREATE TABLE IF NOT EXISTS genres (
  id   INT          NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80)  NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS book_genres (
  book_id  VARCHAR(36) NOT NULL,
  genre_id INT         NOT NULL,
  PRIMARY KEY (book_id, genre_id),
  FOREIGN KEY (book_id)  REFERENCES books(id)  ON DELETE CASCADE,
  FOREIGN KEY (genre_id) REFERENCES genres(id) ON DELETE CASCADE
);

-- Tags (many-to-many)
CREATE TABLE IF NOT EXISTS tags (
  id   INT         NOT NULL AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(80) NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS book_tags (
  book_id VARCHAR(36) NOT NULL,
  tag_id  INT         NOT NULL,
  PRIMARY KEY (book_id, tag_id),
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  FOREIGN KEY (tag_id)  REFERENCES tags(id)  ON DELETE CASCADE
);

-- ─────────────────────────────────────────────
-- TRANSACTIONS / LOANS
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS transactions (
  id            VARCHAR(36)  NOT NULL PRIMARY KEY,
  book_id       VARCHAR(36)  NOT NULL,
  user_id       VARCHAR(36)  NOT NULL,
  type          ENUM('borrow_request','borrow','return_request','return','overdue') NOT NULL,
  status        ENUM('pending','approved','declined','completed','cancelled') NOT NULL DEFAULT 'pending',
  due_date      DATE,
  returned_at   DATETIME,
  fine_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  notes         TEXT,
  created_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at    DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE RESTRICT,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE RESTRICT,
  INDEX idx_user_id   (user_id),
  INDEX idx_book_id   (book_id),
  INDEX idx_type      (type),
  INDEX idx_status    (status),
  INDEX idx_due_date  (due_date)
);

-- ─────────────────────────────────────────────
-- READING HISTORY (for AI recommendations)
-- ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS reading_history (
  id         VARCHAR(36) NOT NULL PRIMARY KEY,
  user_id    VARCHAR(36) NOT NULL,
  book_id    VARCHAR(36) NOT NULL,
  read_at    DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
  FOREIGN KEY (book_id) REFERENCES books(id) ON DELETE CASCADE,
  UNIQUE KEY uq_user_book (user_id, book_id),
  INDEX idx_user_id (user_id)
);

-- ─────────────────────────────────────────────
-- VIEWS (convenience)
-- ─────────────────────────────────────────────

-- Active loans view
CREATE OR REPLACE VIEW active_loans AS
SELECT
  t.id          AS transaction_id,
  t.book_id,
  t.user_id,
  t.due_date,
  t.created_at  AS borrowed_at,
  b.title,
  b.author,
  b.code,
  b.bg_banner,
  u.name        AS borrower_name,
  u.student_id  AS borrower_student_id,
  u.email       AS borrower_email,
  DATEDIFF(t.due_date, CURDATE()) AS days_remaining
FROM transactions t
JOIN books b ON b.id = t.book_id
JOIN users u ON u.id = t.user_id
WHERE t.type = 'borrow'
  AND t.status = 'approved'
  AND t.returned_at IS NULL;

-- Pending requests view
CREATE OR REPLACE VIEW pending_requests AS
SELECT
  t.id          AS transaction_id,
  t.book_id,
  t.user_id,
  t.type,
  t.due_date,
  t.created_at,
  b.title,
  b.author,
  b.code,
  b.bg_banner,
  u.name        AS borrower_name,
  u.student_id  AS borrower_student_id,
  u.email       AS borrower_email
FROM transactions t
JOIN books b ON b.id = t.book_id
JOIN users u ON u.id = t.user_id
WHERE t.status = 'pending'
  AND t.type IN ('borrow_request','return_request');

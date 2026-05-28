-- Migration 001: Add book ratings table and fine configuration
USE library_system;

-- Student book ratings (separate from the static seed rating)
CREATE TABLE IF NOT EXISTS book_ratings (
  id         VARCHAR(36)   NOT NULL PRIMARY KEY,
  book_id    VARCHAR(36)   NOT NULL,
  user_id    VARCHAR(36)   NOT NULL,
  rating     TINYINT       NOT NULL CHECK (rating BETWEEN 1 AND 5),
  created_at DATETIME      NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_book (user_id, book_id),
  FOREIGN KEY (book_id) REFERENCES books(id)  ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
  INDEX idx_book_id (book_id)
);

-- Fine configuration (admin-editable)
CREATE TABLE IF NOT EXISTS fine_config (
  id              INT         NOT NULL PRIMARY KEY DEFAULT 1,
  rate_per_day    DECIMAL(6,2) NOT NULL DEFAULT 5.00,  -- PHP per day overdue
  grace_period    TINYINT     NOT NULL DEFAULT 0,       -- days before fines start
  max_fine        DECIMAL(8,2) NOT NULL DEFAULT 500.00, -- cap per transaction
  currency_symbol VARCHAR(5)  NOT NULL DEFAULT '₱',
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  -- Enforce single-row config
  CONSTRAINT chk_single_row CHECK (id = 1)
);

-- Insert default fine config (₱5/day, no grace period, max ₱500)
INSERT IGNORE INTO fine_config (id, rate_per_day, grace_period, max_fine, currency_symbol)
VALUES (1, 5.00, 0, 500.00, '₱');

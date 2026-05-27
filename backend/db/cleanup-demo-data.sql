-- ============================================================
-- cleanup-demo-data.sql
-- Run this ONCE against your existing database to remove all
-- sample users, transactions, and reading history.
-- Books, genres, and tags are preserved.
-- ============================================================

USE library_system;

-- 1. Remove reading history tied to demo users
DELETE FROM reading_history
WHERE user_id IN ('usr-001','usr-002','usr-003','usr-004','usr-005');

-- 2. Remove all sample transactions
DELETE FROM transactions
WHERE id IN ('tx-001','tx-002','tx-003','tx-004','tx-005','tx-006','tx-007','tx-008');

-- 3. Reset any books that were marked borrowed by demo transactions
UPDATE books SET status = 'available'
WHERE id IN ('b4','b12') AND status = 'borrowed';

-- 4. Remove demo student accounts
DELETE FROM users
WHERE id IN ('usr-001','usr-002','usr-003','usr-004','usr-005');

-- 5. Verify result
SELECT 'Users remaining:' AS info, COUNT(*) AS count FROM users;
SELECT 'Transactions remaining:' AS info, COUNT(*) AS count FROM transactions;
SELECT 'Books (all should be available):' AS info, status, COUNT(*) AS count FROM books GROUP BY status;

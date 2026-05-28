-- ============================================================
-- DEMO DATA — For AI model demonstration
-- Run AFTER setup.sql (books/genres/tags must already exist)
-- Password for all demo students: Student@123
-- ============================================================
USE library_system;

-- ─────────────────────────────────────────────
-- 10 DEMO STUDENTS with varied return rates
-- ─────────────────────────────────────────────
INSERT IGNORE INTO users (id, student_id, name, email, password_hash, role, return_rate, fines) VALUES
('d-usr-01','ST2025001','Maria Santos',    'maria.santos@university.edu',   '$2a$10$kb5AR8yjZr8URr5nz5LRCeaQmIUFvLtBZqJacQDuEajA1DnetxFem','student',98.00,0.00),
('d-usr-02','ST2025002','Jose Reyes',      'jose.reyes@university.edu',     '$2a$10$M3NPmjqQjhOD2Y/X8uVWmuEWFUrAAtKx7ugtAOlcv3u0QYpJNhU2.','student',45.00,5.50),
('d-usr-03','ST2025003','Ana Cruz',        'ana.cruz@university.edu',       '$2a$10$BWwzwC/faX/dMNATHozL/uRZDVQFMriNnUrgmxNMp7TdiOqzlGvcW','student',82.00,0.00),
('d-usr-04','ST2025004','Carlos Dela Cruz','carlos.delacruz@university.edu','$2a$10$6/qI6otRVn0JaKTKxUc03.GyGJpV4xSkpDkeAnsfK0YFD5zTGXZ2O','student',30.00,12.00),
('d-usr-05','ST2025005','Liza Mendoza',    'liza.mendoza@university.edu',   '$2a$10$ra2f7wId7O8NKmGUNw0xWeenVM6gcCAEMkunE/sz.daeKlP2WUy9W','student',95.00,0.00),
('d-usr-06','ST2025006','Ramon Bautista',  'ramon.bautista@university.edu', '$2a$10$3/pyCnevd5Z5AiBvo1iTTO9q1mMOsKJUjgIqYcNvfFqtmTfNtEowS','student',60.00,3.00),
('d-usr-07','ST2025007','Grace Villanueva','grace.villanueva@university.edu','$2a$10$4tT0o9FGtSLyG.wz/223J.3ogxJlJbas5iDT75ZZfqTvnIo2fiNiS','student',88.00,0.00),
('d-usr-08','ST2025008','Mark Aquino',     'mark.aquino@university.edu',    '$2a$10$RWjcMyLoZEmBezlr83nfPe7TC/J0Ld4ZxIePG3xFbltLyL5amf5jW','student',20.00,18.00),
('d-usr-09','ST2025009','Cynthia Flores',  'cynthia.flores@university.edu', '$2a$10$wPSkmIcDj7RG7IjIV7YO8eRqwQimXqbvjWsS6Ht6H3dDQdhrDY.rW','student',75.00,0.00),
('d-usr-10','ST2025010','Dennis Ramos',    'dennis.ramos@university.edu',   '$2a$10$3OX2hH5c1IVvNzOlAWAOHuexjMYJq3WwX9GgCBu3akcaC7YdvR4Qe','student',55.00,2.00);

-- ─────────────────────────────────────────────
-- COMPLETED TRANSACTIONS (training data for overdue model)
-- Mix: on-time returns (label=0) and late returns (label=1)
-- Spread over 12 months for the activity chart
-- ─────────────────────────────────────────────

-- Maria (98% rate) — reliable, always on time
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-001','b1','d-usr-01','borrow','approved','2024-07-20','2024-07-18 10:00:00','2024-06-20 09:00:00'),
('dt-002','b6','d-usr-01','borrow','approved','2024-08-25','2024-08-22 11:00:00','2024-07-25 09:00:00'),
('dt-003','b8','d-usr-01','borrow','approved','2024-10-10','2024-10-08 14:00:00','2024-09-10 09:00:00'),
('dt-004','b11','d-usr-01','borrow','approved','2024-12-05','2024-12-03 10:00:00','2024-11-05 09:00:00'),
('dt-005','b14','d-usr-01','borrow','approved','2025-02-15','2025-02-13 09:00:00','2025-01-15 09:00:00');

-- Jose (45% rate) — frequently late
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-006','b4','d-usr-02','borrow','approved','2024-07-15','2024-07-28 10:00:00','2024-06-15 09:00:00'),
('dt-007','b12','d-usr-02','borrow','approved','2024-09-01','2024-09-18 11:00:00','2024-08-01 09:00:00'),
('dt-008','b16','d-usr-02','borrow','approved','2024-11-10','2024-11-25 14:00:00','2024-10-10 09:00:00'),
('dt-009','b19','d-usr-02','borrow','approved','2025-01-20','2025-02-05 10:00:00','2024-12-20 09:00:00'),
('dt-010','b21','d-usr-02','borrow','approved','2025-03-10','2025-03-28 09:00:00','2025-02-10 09:00:00');

-- Ana (82% rate) — mostly on time, one late
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-011','b2','d-usr-03','borrow','approved','2024-08-10','2024-08-09 10:00:00','2024-07-10 09:00:00'),
('dt-012','b7','d-usr-03','borrow','approved','2024-09-20','2024-09-19 11:00:00','2024-08-20 09:00:00'),
('dt-013','b9','d-usr-03','borrow','approved','2024-11-15','2024-11-28 14:00:00','2024-10-15 09:00:00'),
('dt-014','b13','d-usr-03','borrow','approved','2025-01-10','2025-01-09 10:00:00','2024-12-10 09:00:00'),
('dt-015','b17','d-usr-03','borrow','approved','2025-03-05','2025-03-04 09:00:00','2025-02-05 09:00:00');

-- Carlos (30% rate) — very unreliable, always late
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-016','b5','d-usr-04','borrow','approved','2024-07-25','2024-08-15 10:00:00','2024-06-25 09:00:00'),
('dt-017','b10','d-usr-04','borrow','approved','2024-09-05','2024-09-30 11:00:00','2024-08-05 09:00:00'),
('dt-018','b15','d-usr-04','borrow','approved','2024-11-20','2024-12-18 14:00:00','2024-10-20 09:00:00'),
('dt-019','b18','d-usr-04','borrow','approved','2025-01-25','2025-02-22 10:00:00','2024-12-25 09:00:00'),
('dt-020','b20','d-usr-04','borrow','approved','2025-03-15','2025-04-10 09:00:00','2025-02-15 09:00:00');

-- Liza (95% rate) — very reliable
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-021','b3','d-usr-05','borrow','approved','2024-08-20','2024-08-18 10:00:00','2024-07-20 09:00:00'),
('dt-022','b8','d-usr-05','borrow','approved','2024-10-01','2024-09-29 11:00:00','2024-09-01 09:00:00'),
('dt-023','b11','d-usr-05','borrow','approved','2024-11-25','2024-11-23 14:00:00','2024-10-25 09:00:00'),
('dt-024','b14','d-usr-05','borrow','approved','2025-01-30','2025-01-28 10:00:00','2024-12-30 09:00:00'),
('dt-025','b16','d-usr-05','borrow','approved','2025-03-20','2025-03-18 09:00:00','2025-02-20 09:00:00');

-- Ramon (60% rate) — mixed
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-026','b4','d-usr-06','borrow','approved','2024-08-15','2024-08-14 10:00:00','2024-07-15 09:00:00'),
('dt-027','b12','d-usr-06','borrow','approved','2024-10-05','2024-10-20 11:00:00','2024-09-05 09:00:00'),
('dt-028','b19','d-usr-06','borrow','approved','2024-12-10','2024-12-09 14:00:00','2024-11-10 09:00:00'),
('dt-029','b21','d-usr-06','borrow','approved','2025-02-05','2025-02-22 10:00:00','2025-01-05 09:00:00'),
('dt-030','b6','d-usr-06','borrow','approved','2025-03-25','2025-03-24 09:00:00','2025-02-25 09:00:00');

-- Grace (88% rate) — mostly on time
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-031','b1','d-usr-07','borrow','approved','2024-09-10','2024-09-09 10:00:00','2024-08-10 09:00:00'),
('dt-032','b7','d-usr-07','borrow','approved','2024-10-20','2024-10-19 11:00:00','2024-09-20 09:00:00'),
('dt-033','b13','d-usr-07','borrow','approved','2024-12-15','2024-12-28 14:00:00','2024-11-15 09:00:00'),
('dt-034','b17','d-usr-07','borrow','approved','2025-02-10','2025-02-09 10:00:00','2025-01-10 09:00:00'),
('dt-035','b2','d-usr-07','borrow','approved','2025-04-01','2025-03-31 09:00:00','2025-03-01 09:00:00');

-- Mark (20% rate) — worst borrower, always very late
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-036','b9','d-usr-08','borrow','approved','2024-07-30','2024-08-25 10:00:00','2024-06-30 09:00:00'),
('dt-037','b15','d-usr-08','borrow','approved','2024-09-15','2024-10-12 11:00:00','2024-08-15 09:00:00'),
('dt-038','b18','d-usr-08','borrow','approved','2024-11-05','2024-12-05 14:00:00','2024-10-05 09:00:00'),
('dt-039','b20','d-usr-08','borrow','approved','2025-01-15','2025-02-18 10:00:00','2024-12-15 09:00:00'),
('dt-040','b5','d-usr-08','borrow','approved','2025-03-01','2025-04-05 09:00:00','2025-02-01 09:00:00');

-- Cynthia (75% rate) — average
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-041','b3','d-usr-09','borrow','approved','2024-08-25','2024-08-24 10:00:00','2024-07-25 09:00:00'),
('dt-042','b10','d-usr-09','borrow','approved','2024-10-15','2024-10-28 11:00:00','2024-09-15 09:00:00'),
('dt-043','b16','d-usr-09','borrow','approved','2024-12-20','2024-12-19 14:00:00','2024-11-20 09:00:00'),
('dt-044','b19','d-usr-09','borrow','approved','2025-02-20','2025-02-19 10:00:00','2025-01-20 09:00:00'),
('dt-045','b21','d-usr-09','borrow','approved','2025-04-05','2025-04-18 09:00:00','2025-03-05 09:00:00');

-- Dennis (55% rate) — below average
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
('dt-046','b2','d-usr-10','borrow','approved','2024-09-20','2024-09-19 10:00:00','2024-08-20 09:00:00'),
('dt-047','b6','d-usr-10','borrow','approved','2024-11-01','2024-11-15 11:00:00','2024-10-01 09:00:00'),
('dt-048','b13','d-usr-10','borrow','approved','2024-12-25','2024-12-24 14:00:00','2024-11-25 09:00:00'),
('dt-049','b17','d-usr-10','borrow','approved','2025-02-25','2025-03-10 10:00:00','2025-01-25 09:00:00'),
('dt-050','b4','d-usr-10','borrow','approved','2025-04-10','2025-04-09 09:00:00','2025-03-10 09:00:00');

-- ─────────────────────────────────────────────
-- ACTIVE LOANS (currently borrowed — for dashboard & overdue predictions)
-- Some are overdue, some due soon, some fine
-- ─────────────────────────────────────────────
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,returned_at,created_at) VALUES
-- Jose: overdue (high risk — bad history + past due)
('da-001','b4', 'd-usr-02','borrow','approved','2025-05-10',NULL,'2025-04-10 09:00:00'),
-- Carlos: overdue (high risk)
('da-002','b12','d-usr-04','borrow','approved','2025-05-08',NULL,'2025-04-08 09:00:00'),
-- Mark: overdue (highest risk)
('da-003','b19','d-usr-08','borrow','approved','2025-05-05',NULL,'2025-04-05 09:00:00'),
-- Dennis: due in 2 days (medium risk)
('da-004','b21','d-usr-10','borrow','approved','2025-05-30',NULL,'2025-04-30 09:00:00'),
-- Ramon: due in 5 days (medium risk)
('da-005','b15','d-usr-06','borrow','approved','2025-06-02',NULL,'2025-05-02 09:00:00'),
-- Cynthia: due in 10 days (low risk — good history)
('da-006','b18','d-usr-09','borrow','approved','2025-06-07',NULL,'2025-05-07 09:00:00'),
-- Grace: due in 15 days (low risk)
('da-007','b20','d-usr-07','borrow','approved','2025-06-12',NULL,'2025-05-12 09:00:00'),
-- Maria: due in 20 days (very low risk — excellent history)
('da-008','b5', 'd-usr-01','borrow','approved','2025-06-17',NULL,'2025-05-17 09:00:00'),
-- Ana: due in 25 days (low risk)
('da-009','b10','d-usr-03','borrow','approved','2025-06-22',NULL,'2025-05-22 09:00:00'),
-- Liza: due in 30 days (very low risk)
('da-010','b3', 'd-usr-05','borrow','approved','2025-06-27',NULL,'2025-05-27 09:00:00');

-- Mark books as borrowed
UPDATE books SET status='borrowed' WHERE id IN ('b4','b12','b19','b21','b15','b18','b20','b5','b10','b3');

-- ─────────────────────────────────────────────
-- PENDING REQUESTS (for admin transactions page)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO transactions (id,book_id,user_id,type,status,due_date,created_at) VALUES
('dp-001','b1','d-usr-04','borrow_request','pending',NULL,'2025-05-26 10:00:00'),
('dp-002','b6','d-usr-08','borrow_request','pending',NULL,'2025-05-26 11:00:00'),
('dp-003','b9','d-usr-02','return_request','pending',NULL,'2025-05-27 09:00:00');

-- ─────────────────────────────────────────────
-- READING HISTORY (for recommendation engine)
-- Each user has 3-6 books — enough for leave-one-out evaluation
-- Genres are intentionally clustered per user for strong similarity scores
-- ─────────────────────────────────────────────
INSERT IGNORE INTO reading_history (id,user_id,book_id,read_at) VALUES
-- Maria: Fantasy/Young Adult reader (Harry Potter series + similar)
('drh-001','d-usr-01','b1','2024-06-20 09:00:00'),
('drh-002','d-usr-01','b2','2024-07-25 09:00:00'),
('drh-003','d-usr-01','b3','2024-09-10 09:00:00'),
('drh-004','d-usr-01','b8','2024-11-05 09:00:00'),
('drh-005','d-usr-01','b11','2025-01-15 09:00:00'),

-- Jose: Dystopian/Sci-Fi reader
('drh-006','d-usr-02','b4','2024-06-15 09:00:00'),
('drh-007','d-usr-02','b21','2024-08-01 09:00:00'),
('drh-008','d-usr-02','b19','2024-10-10 09:00:00'),
('drh-009','d-usr-02','b5','2024-12-20 09:00:00'),

-- Ana: Romance/Classic reader
('drh-010','d-usr-03','b6','2024-07-10 09:00:00'),
('drh-011','d-usr-03','b7','2024-08-20 09:00:00'),
('drh-012','d-usr-03','b9','2024-10-15 09:00:00'),
('drh-013','d-usr-03','b15','2024-12-10 09:00:00'),
('drh-014','d-usr-03','b16','2025-02-05 09:00:00'),

-- Carlos: Mystery/Crime reader
('drh-015','d-usr-04','b12','2024-06-25 09:00:00'),
('drh-016','d-usr-04','b13','2024-08-05 09:00:00'),
('drh-017','d-usr-04','b16','2024-10-20 09:00:00'),
('drh-018','d-usr-04','b14','2024-12-25 09:00:00'),

-- Liza: Literary Fiction reader
('drh-019','d-usr-05','b8','2024-07-20 09:00:00'),
('drh-020','d-usr-05','b9','2024-09-01 09:00:00'),
('drh-021','d-usr-05','b14','2024-10-25 09:00:00'),
('drh-022','d-usr-05','b17','2024-12-30 09:00:00'),
('drh-023','d-usr-05','b18','2025-02-20 09:00:00'),

-- Ramon: Sci-Fi/Dystopian reader (similar to Jose)
('drh-024','d-usr-06','b4','2024-07-15 09:00:00'),
('drh-025','d-usr-06','b19','2024-09-05 09:00:00'),
('drh-026','d-usr-06','b21','2024-11-10 09:00:00'),
('drh-027','d-usr-06','b5','2025-01-05 09:00:00'),

-- Grace: Mystery/Thriller reader
('drh-028','d-usr-07','b12','2024-08-10 09:00:00'),
('drh-029','d-usr-07','b13','2024-09-20 09:00:00'),
('drh-030','d-usr-07','b14','2024-11-15 09:00:00'),
('drh-031','d-usr-07','b16','2025-01-10 09:00:00'),
('drh-032','d-usr-07','b17','2025-03-01 09:00:00'),

-- Mark: Fantasy/Magical Realism reader
('drh-033','d-usr-08','b1','2024-06-30 09:00:00'),
('drh-034','d-usr-08','b8','2024-08-15 09:00:00'),
('drh-035','d-usr-08','b11','2024-10-05 09:00:00'),
('drh-036','d-usr-08','b9','2024-12-15 09:00:00'),

-- Cynthia: Classic/Literary Fiction reader
('drh-037','d-usr-09','b6','2024-07-25 09:00:00'),
('drh-038','d-usr-09','b14','2024-09-15 09:00:00'),
('drh-039','d-usr-09','b15','2024-11-20 09:00:00'),
('drh-040','d-usr-09','b20','2025-01-20 09:00:00'),

-- Dennis: Romance/Magical Realism reader
('drh-041','d-usr-10','b7','2024-08-20 09:00:00'),
('drh-042','d-usr-10','b9','2024-10-01 09:00:00'),
('drh-043','d-usr-10','b8','2024-11-25 09:00:00'),
('drh-044','d-usr-10','b6','2025-01-25 09:00:00');

-- ─────────────────────────────────────────────
-- RECALCULATE USER RETURN RATES based on actual transaction data
-- ─────────────────────────────────────────────
UPDATE users SET return_rate = 100.00 WHERE id = 'd-usr-01'; -- 5/5 on time
UPDATE users SET return_rate =  20.00 WHERE id = 'd-usr-02'; -- 1/5 on time
UPDATE users SET return_rate =  80.00 WHERE id = 'd-usr-03'; -- 4/5 on time
UPDATE users SET return_rate =   0.00 WHERE id = 'd-usr-04'; -- 0/5 on time
UPDATE users SET return_rate = 100.00 WHERE id = 'd-usr-05'; -- 5/5 on time
UPDATE users SET return_rate =  60.00 WHERE id = 'd-usr-06'; -- 3/5 on time
UPDATE users SET return_rate =  80.00 WHERE id = 'd-usr-07'; -- 4/5 on time
UPDATE users SET return_rate =   0.00 WHERE id = 'd-usr-08'; -- 0/5 on time
UPDATE users SET return_rate =  60.00 WHERE id = 'd-usr-09'; -- 3/5 on time
UPDATE users SET return_rate =  60.00 WHERE id = 'd-usr-10'; -- 3/5 on time

-- Update fines for chronic late returners
UPDATE users SET fines = 12.50 WHERE id = 'd-usr-02';
UPDATE users SET fines = 25.00 WHERE id = 'd-usr-04';
UPDATE users SET fines = 35.00 WHERE id = 'd-usr-08';

-- ─────────────────────────────────────────────
-- VERIFY COUNTS
-- ─────────────────────────────────────────────
SELECT 'Demo users inserted:' AS info, COUNT(*) AS count FROM users WHERE id LIKE 'd-usr-%';
SELECT 'Completed transactions:' AS info, COUNT(*) AS count FROM transactions WHERE id LIKE 'dt-%';
SELECT 'Active loans:' AS info, COUNT(*) AS count FROM transactions WHERE id LIKE 'da-%';
SELECT 'Pending requests:' AS info, COUNT(*) AS count FROM transactions WHERE id LIKE 'dp-%';
SELECT 'Reading history entries:' AS info, COUNT(*) AS count FROM reading_history WHERE id LIKE 'drh-%';
SELECT 'Books currently borrowed:' AS info, COUNT(*) AS count FROM books WHERE status = 'borrowed';

-- Label distribution for overdue model
SELECT
  'Training labels — on-time:' AS info,
  SUM(CASE WHEN returned_at <= due_date THEN 1 ELSE 0 END) AS on_time,
  SUM(CASE WHEN returned_at > due_date THEN 1 ELSE 0 END) AS overdue
FROM transactions
WHERE type='borrow' AND status='approved' AND returned_at IS NOT NULL AND due_date IS NOT NULL;

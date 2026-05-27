-- ============================================================
-- Library System — Seed Data
-- Contains: admin account, books, genres, tags only.
-- No sample students, transactions, or reading history.
-- ============================================================

USE library_system;

-- ─────────────────────────────────────────────
-- ADMIN ACCOUNT
-- Default password: Admin@123
-- CHANGE THIS PASSWORD after first login.
-- ─────────────────────────────────────────────
INSERT IGNORE INTO users (id, student_id, name, email, password_hash, role, return_rate) VALUES
('adm-001', NULL, 'System Administrator', 'admin@library.edu',
 '$2a$12$ATGCB1cGpGWiNssmL/FHy.KxZaY/Wg.rloDNUD/GmF9xCifk871de',
 'admin', 100.00);

-- ─────────────────────────────────────────────
-- GENRES
-- ─────────────────────────────────────────────
INSERT IGNORE INTO genres (name) VALUES
('Fantasy'),('Young Adult'),('Dystopian'),('Science Fiction'),
('Romance'),('Classic'),('Magical Realism'),('Mystery'),
('Thriller'),('Crime'),('Literary Fiction'),('Historical Fiction'),
('Political Fiction'),('Satire'),('Coming-of-age'),('Horror'),
('Adventure'),('Biography');

-- ─────────────────────────────────────────────
-- TAGS
-- ─────────────────────────────────────────────
INSERT IGNORE INTO tags (name) VALUES
('magic'),('wizards'),('adventure'),('school'),('mystery'),('secrets'),
('snakes'),('surveillance'),('totalitarianism'),('politics'),('thoughtcrime'),
('society'),('sisters'),('marriage'),('england'),('family'),('history'),
('colombia'),('solitude'),('love'),('aging'),('devotion'),('patience'),
('cats'),('prophecy'),('journey'),('surreal'),('thriller'),('isolation'),
('guilt'),('train'),('detective'),('poirot'),('revenge'),('war'),
('friendship'),('coming-of-age'),('identity'),('race'),('grief');

-- ─────────────────────────────────────────────
-- BOOKS (all available — no pre-borrowed state)
-- ─────────────────────────────────────────────
INSERT IGNORE INTO books (id, code, title, author, isbn, year, pages, rating, description, author_bio, author_meta, bg_banner, status) VALUES
('b1',  'HA', 'Harry Potter and the Sorcerer''s Stone',   'J.K. Rowling',           '978-0590353403', 1997, 223, 4.7,
 'An orphaned boy enrolls in a school of wizardry, where he learns the truth about himself, his family, and the terrible evil that haunts the magical world.',
 'J.K. Rowling is a British author, best known for writing the Harry Potter fantasy series, which has won multiple awards and sold more than 500 million copies.',
 'British · Born 1965 · 3 books in catalog', '#92400E', 'available'),

('b2',  'HA', 'Harry Potter and the Chamber of Secrets',  'J.K. Rowling',           '978-0439064873', 1998, 251, 4.5,
 'Harry Potter faces new terrors at Hogwarts school of wizardry when a mysterious chamber is opened and students start turning to stone.',
 'J.K. Rowling is a British author, best known for writing the Harry Potter fantasy series.',
 'British · Born 1965 · 3 books in catalog', '#065F46', 'available'),

('b3',  'HA', 'Harry Potter and the Prisoner of Azkaban', 'J.K. Rowling',           '978-0439136365', 1999, 435, 4.8,
 'Harry Potter, along with his best friends Ron and Hermione, investigates the escape of Sirius Black, an alleged supporter of the Dark Lord.',
 'J.K. Rowling is a British author, best known for writing the Harry Potter fantasy series.',
 'British · Born 1965 · 3 books in catalog', '#4C0519', 'available'),

('b4',  '19', '1984',                                     'George Orwell',           '978-0451524935', 1949, 328, 4.6,
 'In a terrifyingly totalitarian future world, a minor bureaucrat rebels against a completely omnipotent government that manipulates history and thought.',
 'Eric Arthur Blair, known by his pen name George Orwell, was an English novelist, essayist, journalist, and critic.',
 'English · Born 1903 · 2 books in catalog', '#0284C7', 'available'),

('b5',  'AF', 'Animal Farm',                              'George Orwell',           '978-0451526342', 1945, 112, 4.4,
 'A group of farm animals rebel against their human farmer, hoping to create a society where the animals can be equal, free, and happy.',
 'George Orwell was an English novelist, essayist, journalist, and critic.',
 'English · Born 1903 · 2 books in catalog', '#1E3A5F', 'available'),

('b6',  'PR', 'Pride and Prejudice',                      'Jane Austen',             '978-0141439518', 1813, 432, 4.7,
 'The story follows Elizabeth Bennet as she deals with issues of manners, upbringing, morality, education, and marriage in the society of the landed gentry of early 19th-century England.',
 'Jane Austen was an English novelist known primarily for her six major novels.',
 'English · Born 1775 · 2 books in catalog', '#047857', 'available'),

('b7',  'SE', 'Sense and Sensibility',                    'Jane Austen',             '978-0141439662', 1811, 409, 4.3,
 'The life, romance, and financial hardships of the Dashwood sisters as they navigate the rigid social expectations of 19th-century England.',
 'Jane Austen was an English novelist known primarily for her six major novels.',
 'English · Born 1775 · 2 books in catalog', '#9A3412', 'available'),

('b8',  'ON', 'One Hundred Years of Solitude',            'Gabriel García Márquez',  '978-0060883287', 1967, 417, 4.8,
 'The rise and fall, birth and death of the mythical town of Macondo through seven generations of the Buendía family.',
 'Gabriel García Márquez was a Colombian novelist awarded the 1982 Nobel Prize in Literature.',
 'Colombian · Born 1927 · 2 books in catalog', '#312E81', 'available'),

('b9',  'LO', 'Love in the Time of Cholera',              'Gabriel García Márquez',  '978-0307389732', 1985, 348, 4.4,
 'A passionate, decades-long love story that endures social changes, marriages, and the physical decline of aging in a coastal South American town.',
 'Gabriel García Márquez was a Colombian novelist awarded the 1982 Nobel Prize in Literature.',
 'Colombian · Born 1927 · 2 books in catalog', '#44403C', 'available'),

('b10', 'NO', 'Norwegian Wood',                           'Haruki Murakami',         '978-0375704024', 1987, 296, 4.2,
 'A nostalgic story of loss and sexuality following Toru Watanabe as he looks back on his days as a college student living in Tokyo.',
 'Haruki Murakami is a Japanese writer whose books have been translated into 50 languages.',
 'Japanese · Born 1949 · 2 books in catalog', '#7C3AED', 'available'),

('b11', 'KA', 'Kafka on the Shore',                       'Haruki Murakami',         '978-1400079278', 2002, 505, 4.3,
 'An elegant, surreal narrative following a teenage runaway escaping an oedipal curse, and an old man who can speak with neighborhood cats.',
 'Haruki Murakami is a Japanese writer whose books have been translated into 50 languages.',
 'Japanese · Born 1949 · 2 books in catalog', '#1C1917', 'available'),

('b12', 'AN', 'And Then There Were None',                 'Agatha Christie',         '978-0062073488', 1939, 264, 4.6,
 'Ten strangers are invited to an isolated island where they are trapped and murdered one by one matching a sinister nursery rhyme.',
 'Dame Agatha Christie was an English writer known for her 66 detective novels and 14 short story collections.',
 'English · Born 1890 · 2 books in catalog', '#6B21A8', 'available'),

('b13', 'MO', 'Murder on the Orient Express',             'Agatha Christie',         '978-0062073501', 1934, 256, 4.5,
 'Just after midnight, a snowdrift stops the Orient Express. By morning, an American tycoon lies dead in his compartment, stabbed a dozen times.',
 'Dame Agatha Christie was an English writer known for her 66 detective novels.',
 'English · Born 1890 · 2 books in catalog', '#0F172A', 'available'),

('b14', 'TO', 'To Kill a Mockingbird',                    'Harper Lee',              '978-0061935466', 1960, 281, 4.8,
 'The unforgettable novel of a childhood in a sleepy Southern town and the crisis of conscience that rocked it.',
 'Harper Lee was an American novelist widely known for To Kill a Mockingbird, published in 1960.',
 'American · Born 1926 · 1 book in catalog', '#78350F', 'available'),

('b15', 'GR', 'The Great Gatsby',                         'F. Scott Fitzgerald',     '978-0743273565', 1925, 180, 4.1,
 'The story of the fabulously wealthy Jay Gatsby and his love for the beautiful Daisy Buchanan.',
 'F. Scott Fitzgerald was an American novelist, essayist, and short story writer.',
 'American · Born 1896 · 1 book in catalog', '#B45309', 'available'),

('b16', 'CR', 'Crime and Punishment',                     'Fyodor Dostoevsky',       '978-0143107637', 1866, 671, 4.5,
 'A young, impoverished former student in Saint Petersburg formulates a plan to kill an unscrupulous pawnbroker for her money.',
 'Fyodor Dostoevsky was a Russian novelist, short story writer, essayist and journalist.',
 'Russian · Born 1821 · 1 book in catalog', '#065F46', 'available'),

('b17', 'BE', 'Beloved',                                  'Toni Morrison',           '978-1400033416', 1987, 321, 4.4,
 'Sethe, an escaped slave living in post-Civil War Ohio, is haunted by the violent ghost of her deceased daughter.',
 'Toni Morrison was an American novelist, essayist, book editor, and college professor.',
 'American · Born 1931 · 2 books in catalog', '#3730A3', 'available'),

('b18', 'BL', 'The Bluest Eye',                           'Toni Morrison',           '978-0307278449', 1970, 206, 4.3,
 'The story of Pecola Breedlove, a young Black girl growing up in Lorain, Ohio, after the Great Depression.',
 'Toni Morrison was an American novelist, essayist, book editor, and college professor.',
 'American · Born 1931 · 2 books in catalog', '#44403C', 'available'),

('b19', 'FO', 'Foundation',                               'Isaac Asimov',            '978-0553293357', 1951, 255, 4.5,
 'The first novel in Asimov''s classic science-fiction masterpiece, chronicling the fall and rise of a Galactic Empire.',
 'Isaac Asimov was an American writer and professor of biochemistry at Boston University.',
 'American · Born 1920 · 1 book in catalog', '#065F46', 'available'),

('b20', 'FA', 'A Farewell to Arms',                       'Ernest Hemingway',        '978-0684801469', 1929, 332, 4.2,
 'The story of an American ambulance driver on the Italian front during World War I and his love for a British nurse.',
 'Ernest Hemingway was an American novelist, short-story writer, and journalist.',
 'American · Born 1899 · 1 book in catalog', '#92400E', 'available'),

('b21', 'BR', 'Brave New World',                          'Aldous Huxley',           '978-0060850524', 1932, 311, 4.3,
 'A dystopian novel set in a futuristic World State whose citizens are environmentally engineered into an intelligence-based social hierarchy.',
 'Aldous Leonard Huxley was an English writer and philosopher.',
 'English · Born 1894 · 1 book in catalog', '#1E40AF', 'available');

-- ─────────────────────────────────────────────
-- BOOK GENRES
-- ─────────────────────────────────────────────
INSERT IGNORE INTO book_genres (book_id, genre_id) VALUES
('b1',  (SELECT id FROM genres WHERE name='Fantasy')),
('b1',  (SELECT id FROM genres WHERE name='Young Adult')),
('b2',  (SELECT id FROM genres WHERE name='Fantasy')),
('b2',  (SELECT id FROM genres WHERE name='Young Adult')),
('b3',  (SELECT id FROM genres WHERE name='Fantasy')),
('b3',  (SELECT id FROM genres WHERE name='Young Adult')),
('b4',  (SELECT id FROM genres WHERE name='Dystopian')),
('b4',  (SELECT id FROM genres WHERE name='Science Fiction')),
('b4',  (SELECT id FROM genres WHERE name='Political Fiction')),
('b5',  (SELECT id FROM genres WHERE name='Political Fiction')),
('b5',  (SELECT id FROM genres WHERE name='Satire')),
('b5',  (SELECT id FROM genres WHERE name='Classic')),
('b6',  (SELECT id FROM genres WHERE name='Romance')),
('b6',  (SELECT id FROM genres WHERE name='Classic')),
('b7',  (SELECT id FROM genres WHERE name='Romance')),
('b7',  (SELECT id FROM genres WHERE name='Classic')),
('b8',  (SELECT id FROM genres WHERE name='Magical Realism')),
('b8',  (SELECT id FROM genres WHERE name='Fantasy')),
('b8',  (SELECT id FROM genres WHERE name='Literary Fiction')),
('b9',  (SELECT id FROM genres WHERE name='Romance')),
('b9',  (SELECT id FROM genres WHERE name='Magical Realism')),
('b9',  (SELECT id FROM genres WHERE name='Literary Fiction')),
('b10', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b10', (SELECT id FROM genres WHERE name='Coming-of-age')),
('b11', (SELECT id FROM genres WHERE name='Magical Realism')),
('b11', (SELECT id FROM genres WHERE name='Fantasy')),
('b11', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b12', (SELECT id FROM genres WHERE name='Mystery')),
('b12', (SELECT id FROM genres WHERE name='Thriller')),
('b12', (SELECT id FROM genres WHERE name='Crime')),
('b13', (SELECT id FROM genres WHERE name='Mystery')),
('b13', (SELECT id FROM genres WHERE name='Thriller')),
('b13', (SELECT id FROM genres WHERE name='Crime')),
('b14', (SELECT id FROM genres WHERE name='Classic')),
('b14', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b14', (SELECT id FROM genres WHERE name='Coming-of-age')),
('b15', (SELECT id FROM genres WHERE name='Classic')),
('b15', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b16', (SELECT id FROM genres WHERE name='Classic')),
('b16', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b16', (SELECT id FROM genres WHERE name='Crime')),
('b17', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b17', (SELECT id FROM genres WHERE name='Historical Fiction')),
('b18', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b18', (SELECT id FROM genres WHERE name='Coming-of-age')),
('b19', (SELECT id FROM genres WHERE name='Science Fiction')),
('b19', (SELECT id FROM genres WHERE name='Adventure')),
('b20', (SELECT id FROM genres WHERE name='Classic')),
('b20', (SELECT id FROM genres WHERE name='Historical Fiction')),
('b20', (SELECT id FROM genres WHERE name='Literary Fiction')),
('b21', (SELECT id FROM genres WHERE name='Dystopian')),
('b21', (SELECT id FROM genres WHERE name='Science Fiction'));

-- ─────────────────────────────────────────────
-- BOOK TAGS
-- ─────────────────────────────────────────────
INSERT IGNORE INTO book_tags (book_id, tag_id) VALUES
('b1',  (SELECT id FROM tags WHERE name='magic')),
('b1',  (SELECT id FROM tags WHERE name='wizards')),
('b1',  (SELECT id FROM tags WHERE name='adventure')),
('b1',  (SELECT id FROM tags WHERE name='school')),
('b2',  (SELECT id FROM tags WHERE name='magic')),
('b2',  (SELECT id FROM tags WHERE name='mystery')),
('b2',  (SELECT id FROM tags WHERE name='secrets')),
('b2',  (SELECT id FROM tags WHERE name='snakes')),
('b3',  (SELECT id FROM tags WHERE name='magic')),
('b3',  (SELECT id FROM tags WHERE name='mystery')),
('b3',  (SELECT id FROM tags WHERE name='adventure')),
('b4',  (SELECT id FROM tags WHERE name='surveillance')),
('b4',  (SELECT id FROM tags WHERE name='totalitarianism')),
('b4',  (SELECT id FROM tags WHERE name='politics')),
('b4',  (SELECT id FROM tags WHERE name='thoughtcrime')),
('b5',  (SELECT id FROM tags WHERE name='politics')),
('b6',  (SELECT id FROM tags WHERE name='society')),
('b6',  (SELECT id FROM tags WHERE name='marriage')),
('b6',  (SELECT id FROM tags WHERE name='england')),
('b7',  (SELECT id FROM tags WHERE name='society')),
('b7',  (SELECT id FROM tags WHERE name='sisters')),
('b7',  (SELECT id FROM tags WHERE name='marriage')),
('b7',  (SELECT id FROM tags WHERE name='england')),
('b8',  (SELECT id FROM tags WHERE name='family')),
('b8',  (SELECT id FROM tags WHERE name='history')),
('b8',  (SELECT id FROM tags WHERE name='colombia')),
('b8',  (SELECT id FROM tags WHERE name='solitude')),
('b9',  (SELECT id FROM tags WHERE name='love')),
('b9',  (SELECT id FROM tags WHERE name='aging')),
('b9',  (SELECT id FROM tags WHERE name='devotion')),
('b9',  (SELECT id FROM tags WHERE name='patience')),
('b10', (SELECT id FROM tags WHERE name='love')),
('b10', (SELECT id FROM tags WHERE name='coming-of-age')),
('b11', (SELECT id FROM tags WHERE name='cats')),
('b11', (SELECT id FROM tags WHERE name='prophecy')),
('b11', (SELECT id FROM tags WHERE name='journey')),
('b11', (SELECT id FROM tags WHERE name='surreal')),
('b12', (SELECT id FROM tags WHERE name='mystery')),
('b12', (SELECT id FROM tags WHERE name='thriller')),
('b12', (SELECT id FROM tags WHERE name='isolation')),
('b12', (SELECT id FROM tags WHERE name='guilt')),
('b13', (SELECT id FROM tags WHERE name='train')),
('b13', (SELECT id FROM tags WHERE name='detective')),
('b13', (SELECT id FROM tags WHERE name='poirot')),
('b13', (SELECT id FROM tags WHERE name='revenge')),
('b14', (SELECT id FROM tags WHERE name='coming-of-age')),
('b14', (SELECT id FROM tags WHERE name='identity')),
('b14', (SELECT id FROM tags WHERE name='race')),
('b15', (SELECT id FROM tags WHERE name='society')),
('b16', (SELECT id FROM tags WHERE name='guilt')),
('b16', (SELECT id FROM tags WHERE name='detective')),
('b17', (SELECT id FROM tags WHERE name='grief')),
('b17', (SELECT id FROM tags WHERE name='identity')),
('b18', (SELECT id FROM tags WHERE name='identity')),
('b18', (SELECT id FROM tags WHERE name='race')),
('b19', (SELECT id FROM tags WHERE name='adventure')),
('b20', (SELECT id FROM tags WHERE name='war')),
('b20', (SELECT id FROM tags WHERE name='love')),
('b21', (SELECT id FROM tags WHERE name='surveillance')),
('b21', (SELECT id FROM tags WHERE name='totalitarianism'));

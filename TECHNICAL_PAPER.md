# Technical Paper: Intelligent Library Management System

**Project Title:** LibrarySystem  
**Version:** 1.0.0  
**Date:** May 28, 2026  
**Technology Stack:** React 18, Node.js/Express 4, MySQL 8+, JWT Authentication

---

## Executive Summary

The LibrarySystem is a full-stack, intelligent library management platform designed for academic institutions. It provides comprehensive book catalog management, student borrowing workflows, and AI-powered personalized recommendations. The system implements role-based access control (RBAC) with distinct user roles (Admin, Student), JWT-based authentication with automatic token refresh, and sophisticated machine learning algorithms for book recommendations and overdue prediction.

**Key Innovation:** Proprietary content-based recommendation engine using TF-IDF vectorization with collaborative filtering signals and logistic regression for overdue risk prediction—all computed in-process without external APIs.

---

## 1. Architecture Overview

### 1.1 High-Level System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                        React Frontend (Port 3000)                     │
│  ┌────────────┬──────────────┬──────────────┬──────────────────────┐ │
│  │  Auth      │  Dashboard   │  Catalog     │  Transaction mgmt    │ │
│  │  Pages     │  (Admin/Stu) │  & Details   │  & User Profiles     │ │
│  └────────────┴──────────────┴──────────────┴──────────────────────┘ │
│                              │                                       │
│            ┌──────────────────┼──────────────────┐                   │
│            │ AuthContext      │ API Client       │                   │
│            │ (Token Management)│ (Auto Refresh)   │                   │
│            └──────────────────┼──────────────────┘                   │
└─────────────────────────┬──────────────────────────────────────────┘
                          │ HTTP/REST (CORS proxy)
                          │
┌─────────────────────────▼──────────────────────────────────────────┐
│                   Express.js API Server (Port 5000)                  │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                    10 Route Modules                           │  │
│  │ Auth  Books  Transactions  Users  Recommendations  Dashboard │  │
│  │ Analytics  Chat  Fines  Ratings                              │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                              │                                       │
│        ┌─────────────────────┼─────────────────────┐                │
│        │                     │                     │                │
│  ┌─────▼────────┐   ┌──────▼────────┐   ┌────────▼──────┐         │
│  │  Auth        │   │  Middleware   │   │  Services     │         │
│  │  - JWT Sign  │   │  - Auth Guard │   │  - AI Engine  │         │
│  │  - Bcrypt    │   │  - Validator  │   │  - Fine Calc  │         │
│  │  - Refresh   │   │  - CORS/Rate  │   │  - Chat Bot   │         │
│  └──────────────┘   │  - Error Mgmt │   │               │         │
│                     └───────────────┘   └───────────────┘         │
└─────────────────────────┬──────────────────────────────────────────┘
                          │ mysql2 Driver
                          │
┌─────────────────────────▼──────────────────────────────────────────┐
│                    MySQL 8+ Database                                 │
│  ┌──────────────┬──────────────┬──────────────┬──────────────────┐ │
│  │ Users/Auth   │ Book Catalog │ Loans/      │ Reading History  │ │
│  │ (JWT Tokens) │ (Genre/Tags) │ Transactions│ (For AI)          │ │
│  │ Fines        │              │             │                  │ │
│  └──────────────┴──────────────┴──────────────┴──────────────────┘ │
│                        + Views for Analytics                         │
└─────────────────────────────────────────────────────────────────────┘
```

### 1.2 Key Architectural Decisions

| Decision | Rationale |
|----------|-----------|
| **Client-side JWT storage** | Tokens stored in `sessionStorage` (cleared on browser close) for XSS mitigation |
| **Dual-token system** | Short-lived access tokens (15 min) + long-lived refresh tokens (7 days) for security + UX |
| **In-process ML models** | No external API calls; self-contained recommendation engine reduces latency & infrastructure costs |
| **Prepared statements** | Prevents SQL injection; `mysql2` pool for connection pooling |
| **Content-based + CF hybrid** | Reduces cold-start problem; blends user-item interactions with content similarity |
| **Role-based middleware** | Centralized authorization enforced at route level; prevents privilege escalation |

---

## 2. Technology Stack

### 2.1 Frontend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **React** | 18.3.1 | UI framework with hooks-based components |
| **React Router** | 7.15.1 | Client-side routing; protected route wrappers |
| **Lucide React** | 1.16.0 | Icon library (Sparkles, Menu, filters, etc.) |
| **CSS/Styling** | Native CSS | App-wide styles + inline; responsive design |
| **Testing** | Jest + React Testing Library | Unit & integration tests |

**Build Tool:** Create React App v5.0.1 (Webpack-based)  
**Package Manager:** npm  

### 2.2 Backend

| Technology | Version | Purpose |
|-----------|---------|---------|
| **Node.js** | 18+ | Runtime environment |
| **Express** | 4.18.2 | Web framework; HTTP routing |
| **JWT** | 9.0.2 | Token generation & verification |
| **bcryptjs** | 2.4.3 | Password hashing (12 rounds) |
| **mysql2** | 3.9.2 | MySQL driver; connection pooling |
| **express-validator** | 7.0.1 | Input validation & sanitization |
| **express-rate-limit** | 7.2.0 | DDoS protection; auth endpoint brute-force defense |
| **helmet** | 7.1.0 | Security headers (CSP, X-Frame-Options, etc.) |
| **cors** | 2.8.5 | Cross-origin resource sharing |
| **dotenv** | 16.4.5 | Environment variable management |
| **uuid** | 9.0.1 | UUID generation for record IDs |
| **nodemon** | 3.1.0 | Dev server auto-reload |

### 2.3 Database

| Technology | Version | Purpose |
|-----------|---------|---------|
| **MySQL** | 8.0+ | Relational DBMS |
| **Charset** | UTF-8 MB4 | Full Unicode support |

### 2.4 Development & Deployment

- **Version Control:** Git
- **Package Management:** npm (Node), Composer (optional for backend scripting)
- **Environment Management:** `.env` files for dev/prod configs
- **Build Process:** `npm run build` (React) → `build/` directory with optimized static assets

---

## 3. Database Design

### 3.1 Schema Overview

```sql
library_system/
├── users                  -- User accounts with roles & metrics
├── refresh_tokens         -- Hashed JWT refresh tokens
├── books                  -- Book metadata & availability
├── genres                 -- Book genre categories
├── book_genres            -- Many-to-many: books → genres
├── tags                   -- Subject tags for books
├── book_tags              -- Many-to-many: books → tags
├── transactions           -- Loan lifecycle (borrow, return, overdue)
├── reading_history        -- User-book interactions for recommendations
└── [Views]
    ├── active_loans       -- Currently borrowed books with due dates
    └── [additional views for analytics]
```

### 3.2 Core Tables

#### **users**
```sql
CREATE TABLE users (
  id            VARCHAR(36)   PRIMARY KEY,      -- UUID
  student_id    VARCHAR(20)   UNIQUE,           -- Optional; e.g., ST2024001
  name          VARCHAR(100)  NOT NULL,
  email         VARCHAR(150)  UNIQUE NOT NULL,
  password_hash VARCHAR(255)  NOT NULL,         -- bcrypt hash
  role          ENUM('admin','student'),        -- RBAC enforcement
  return_rate   DECIMAL(5,2)  DEFAULT 100.00,   -- 0-100%: used in overdue prediction
  fines         DECIMAL(10,2) DEFAULT 0.00,     -- Accumulated overdue fines
  is_active     BOOLEAN       DEFAULT TRUE,
  created_at    DATETIME      DEFAULT NOW(),
  updated_at    DATETIME      DEFAULT NOW() ON UPDATE NOW()
);
```

**Indexes:**
- Primary: `id`
- Unique: `email`, `student_id`
- Purpose: Quick user lookups; email-based login; student ID verification

#### **books**
```sql
CREATE TABLE books (
  id           VARCHAR(36)   PRIMARY KEY,
  code         VARCHAR(10)   NOT NULL,           -- 2-char abbreviation for UI
  title        VARCHAR(255)  NOT NULL,
  author       VARCHAR(150)  NOT NULL,
  isbn         VARCHAR(20)   UNIQUE,
  year         SMALLINT,
  pages        SMALLINT,
  rating       DECIMAL(3,1)  DEFAULT 0.0,       -- Avg user rating (0-5)
  description  TEXT,
  author_bio   TEXT,
  bg_banner    VARCHAR(10)   DEFAULT '#44403C', -- Hex color for book card
  status       ENUM('available','borrowed'),
  created_at   DATETIME      DEFAULT NOW(),
  updated_at   DATETIME      DEFAULT NOW() ON UPDATE NOW(),
  FULLTEXT INDEX ft_books (title, author, description)
);
```

**Indexes:**
- Fulltext: `(title, author, description)` → Fast book search
- Primary: `id`
- Unique: `isbn`

#### **transactions**
```sql
CREATE TABLE transactions (
  id           VARCHAR(36)  PRIMARY KEY,
  book_id      VARCHAR(36)  NOT NULL,
  user_id      VARCHAR(36)  NOT NULL,
  type         ENUM('borrow_request', 'borrow', 'return_request', 'return', 'overdue'),
  status       ENUM('pending', 'approved', 'declined', 'completed', 'cancelled'),
  due_date     DATE,
  returned_at  DATETIME,
  fine_amount  DECIMAL(10,2) DEFAULT 0.00,
  notes        TEXT,
  created_at   DATETIME DEFAULT NOW(),
  updated_at   DATETIME DEFAULT NOW() ON UPDATE NOW(),
  FOREIGN KEY (book_id) REFERENCES books(id),
  FOREIGN KEY (user_id) REFERENCES users(id),
  INDEX idx_user_id (user_id),
  INDEX idx_book_id (book_id),
  INDEX idx_type (type),
  INDEX idx_status (status),
  INDEX idx_due_date (due_date)
);
```

**Workflow States:**
```
borrow_request (pending) → approved → borrow (approved) → return_request (pending) 
  → approved → return (completed) ✓
```

#### **reading_history**
```sql
CREATE TABLE reading_history (
  id      VARCHAR(36) PRIMARY KEY,
  user_id VARCHAR(36) NOT NULL,
  book_id VARCHAR(36) NOT NULL,
  read_at DATETIME    DEFAULT NOW(),
  FOREIGN KEY (user_id) REFERENCES users(id),
  FOREIGN KEY (book_id) REFERENCES books(id),
  UNIQUE KEY uq_user_book (user_id, book_id),  -- One record per user-book pair
  INDEX idx_user_id (user_id)
);
```

**Purpose:** Tracks which books each user has read/borrowed. Input to the recommendation engine.

### 3.3 Data Integrity & Relationships

| Constraint | Table | Purpose |
|-----------|-------|---------|
| `ON DELETE CASCADE` | `book_genres`, `book_tags`, `refresh_tokens`, `reading_history` | Orphan cleanup |
| `ON DELETE RESTRICT` | `transactions` → `books`, `users` | Prevent accidental deletion of books/users with history |
| `UNIQUE` | `users(email)`, `books(isbn)`, `refresh_tokens`, `reading_history(user_id, book_id)` | Data uniqueness enforcement |
| `FULLTEXT INDEX` | `books(title, author, description)` | Fast natural language search |

---

## 4. Authentication & Security

### 4.1 Authentication Flow

```
User                    Frontend                Backend (MySQL)
  │                       │                         │
  ├─[email, pwd]─────────>│                         │
  │                       ├─POST /api/auth/login──>│
  │                       │ [hash(pwd) = pwd_hash?]│
  │                       │<──{accessToken,        │
  │                       │    refreshToken}───────┤
  │                       │                        [Store hash]
  │                       │                        [ret tokens]
  │ [tokens in            │                        │
  │  sessionStorage]      │                        │
  │<──{user obj}──────────┤                        │
  │                       │                        │
  [Make request]          │                        │
  ├─[Bearer <access>]───>│                        │
  │                       ├─GET /api/books/......>│
  │                       │ [JWT verify]           │
  │                       │ [Check role in payload]│
  │                       │<──{books}──────────────┤
  │<──{books}─────────────┤                        │
  │                       │                        │
  [15 min later]          │                        │
  ├─[Expired token]──────>│                        │
  │                       ├──GET /api/...────────>│
  │                       │<──401 Unauthorized─────┤
  │                       │                        │
  │                       ├─POST /api/auth/refresh┤
  │                       │ [refreshToken in body] │
  │                       │ [Verify hash vs DB]    │
  │                       │<──{new accessToken}────┤
  │                       │                        │
  │                       ├─GET /api/... [retry]─>│
  │                       │ [new token OK]         │
  │                       │<──{data}───────────────┤
  │<──{data}──────────────┤                        │
```

### 4.2 Token Management

**Access Token:**
- **Payload:** `{ id, role, name }`
- **Expiry:** 15 minutes (hardcoded or via `JWT_ACCESS_EXPIRES` env)
- **Secret:** `JWT_ACCESS_SECRET` (minimum 32 chars)
- **Algorithm:** HS256

**Refresh Token:**
- **Payload:** `{ id }`
- **Expiry:** 7 days (hardcoded or via `JWT_REFRESH_EXPIRES` env)
- **Secret:** `JWT_REFRESH_SECRET` (independent; minimum 32 chars)
- **Stored:** Hashed in `refresh_tokens` table with bcrypt (rounds=10)
- **Verification:** On `/api/auth/refresh`, hash provided token and compare with DB

**Key Security Properties:**
- Short access token window limits exposure if token is leaked
- Refresh token hashed & stored server-side; attacker gaining token still can't use it without DB access
- Refresh token expiry enforced server-side
- Tokens stored in `sessionStorage` (not `localStorage`), cleared on browser close
- No token rotation on refresh (optional enhancement for future)

### 4.3 Password Security

**Hashing:**
- Algorithm: bcryptjs (adaptive cost function)
- Rounds: 12
- Salting: Automatic; each hash unique
- Time: ~100–200ms per hash (intentional slowdown for brute-force resistance)

**Password Requirements (enforced at registration):**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 digit
- Real-time validation with express-validator on backend

**Example:**
```
raw: "MyPassword123"
hash: "$2a$12$R9h7cIPz0gi.URNNGU3Keu..."
verify: bcryptjs.compare("MyPassword123", hash) → true/false
```

### 4.4 Authorization & RBAC

**Roles:**
- **admin** — Full system access; approves/declines requests; views analytics; manages users
- **student** — Browse catalog; request borrow/return; view own loans & history; view recommendations

**Enforcement:**
```js
// Middleware chain example
router.post('/api/transactions/:id/approve',
  authenticate,           // 1. Verify JWT token
  authorize('admin'),     // 2. Check role == 'admin'
  validate,               // 3. Validate input
  async (req, res) => {   // 4. Execute admin action
    // Approve transaction
  }
);
```

**Levels:**
1. **Route-level:** Which endpoints accessible per role
2. **Operation-level:** API-level checks (e.g., student can't see other student's transactions)
3. **Data-level:** Row-level filtering in SQL queries

### 4.5 Additional Security Measures

| Measure | Implementation | Benefit |
|---------|---|---|
| **Helmet.js** | `app.use(helmet())` | HTTP security headers (CSP, X-Frame-Options, etc.) |
| **CORS** | Strict origin whitelist: `FRONTEND_URL` | Prevents cross-origin API abuse |
| **Rate Limiting** | Auth endpoints: 20 req/15min; global: 200 req/15min | Brute-force + DDoS mitigation |
| **Input Validation** | express-validator + sanitization | XSS + injection prevention |
| **HTTPS (prod)** | Should be configured at reverse proxy | Encryption in transit |
| **Environment variables** | `.env` files; never committed to repo | Secrets isolation from code |

---

## 5. AI & Machine Learning Components

### 5.1 Recommendation Engine

#### Algorithm: Content-Based Filtering with TF-IDF + Collaborative Filtering Signal

**5.1.1 TF-IDF Vectorization**

**Terminology:**
- **Document (D):** A book
- **Corpus (C):** All books in system
- **Terms:** `genre:Romance`, `genre:Sci-Fi`, `tag:Classics`, etc.
- **TF(term, doc):** Frequency of term in doc (corpus-wide)
- **IDF(term):** $ \log\left(\frac{N+1}{df+1}\right) + 1 $ where $N$ = corpus size, $df$ = docs containing term
- **TF-IDF(term, doc):** $ \text{TF} \times \text{IDF} $

**Construction:**
```
1. Load all books + genres/tags
2. For each book, extract terms:
   - genre:Romance    (weight 2x)
   - genre:Historical (weight 2x)
   - tag:Classics     (weight 1x)
   - tag:Fiction      (weight 1x)
3. Compute IDF for each term across corpus
4. Build TF-IDF vector per book:
   v_book = {
     "genre:romance": 2.0 * idf_romance,
     "genre:historical": 2.0 * idf_historical,
     "tag:classics": 1.0 * idf_classics,
     ...
   }
```

**Example:**
```
Book: "Pride and Prejudice" (Romance, Classics, Historical)
TF-IDF: {
  "genre:romance": 2.0 * 1.8 = 3.6,
  "genre:historical": 2.0 * 1.5 = 3.0,
  "tag:classics": 1.0 * 2.2 = 2.2,
  "tag:fiction": 1.0 * 1.4 = 1.4
}
```

**5.1.2 User Profile Generation**

For each user, compute a weighted average of their read book vectors:

```
user_profile = weighted_avg(book_vectors[books_read])

Weights = recency-based:
- Most recent read: weight 1.0
- Oldest read: weight 0.5
- Linear interpolation: w_i = 0.5 + 0.5 * (i / |history|-1)
```

**Rationale:** Recent reads more important than old ones.

**Example:**
```
User history: [BookA (old), BookB, BookC (recent)]
weights: [0.5, 0.75, 1.0]
profile = (0.5*vecA + 0.75*vecB + 1.0*vecC) / (0.5+0.75+1.0)
```

**5.1.3 Similarity Scoring**

For each unread book, compute **cosine similarity** to user profile:

score = (u . b) / (|u| * |b|)

where u = user profile vector, b = book vector

**Range:** [0, 1], where 1 = perfect match

**5.1.4 Collaborative Filtering Signal**

Boost recommendations if other users with similar taste borrowed a book:

```
CF_boost = 0.15 (hardcoded constant)

For each candidate book:
  1. Find users who borrowed it (set S_b)
  2. Find users similar to current user (set S_u)
  3. If overlap_count = |S_b ∩ S_u| > 0:
       score += CF_boost * (overlap_count / max_overlap)
```

**Effect:** Surfacing books that similar users liked, even if content match is lower.

**5.1.5 Cold-Start Fallback**

If user has no reading history:
```
Return top-rated books (by average rating, DESC)
Limit: return top K books
```

**5.1.6 Metrics**

- **Precision@K:** Fraction of top-K recommendations that user actually borrows
- **Recall@K:** Fraction of borrowable books that appear in top-K
- **Catalog Coverage:** % of all books that appear in recommendations across all users (targets > 80%)
- **Mean Similarity:** Average cosine similarity score of recommendations (targets > 0.5)

### 5.2 Overdue Prediction Model

#### Algorithm: Logistic Regression (In-Process Training)

**Problem:** Predict which borrowers are at risk of returning a book late.

**Features (normalized to [0,1]):**
```
x0 = days_remaining / max_loan_days        [0-1] Lower = higher risk
x1 = user_return_rate / 100                [0-1] Lower = higher risk
x2 = user_overdue_count_normalized         [0-1] Higher = higher risk
x3 = current_loan_days / max_loan_days    [0-1] Longer loans = higher risk
x4 = user_books_borrowed_count_normalized [0-1] More books = higher risk
```

**Model:**
$$ P(\text{overdue}) = \sigma(\beta_0 + \beta_1 x_1 + \beta_2 x_2 + \cdots + \beta_4 x_4) $$

where $\sigma(z) = \frac{1}{1 + e^{-z}}$ (sigmoid function)

**Training:**
1. Fetch all completed transactions (returned books) from DB
2. For each transaction, compute features + label (overdue: yes/no)
3. Run gradient descent (epochs=100, learning_rate=0.01)
4. Output trained coefficients $\beta_0 \cdots \beta_4$

**Inference:**
For each active loan, compute $P(\text{overdue})$, map to risk tier:
- `low risk`:    $P < 0.3$
- `medium risk`: $0.3 \le P < 0.7$
- `high risk`:   $P \ge 0.7$

**Metrics (on validation set):**
- Accuracy, Precision, Recall, F1-score, AUC-ROC, Confusion Matrix

**Example:**
```
Loan: Student borrows book X
days_remaining = 3
user_return_rate = 95%
user_overdue_count = 0
loan_days = 14
user_books_borrowed = 2

Features (normalized):
x = [0.15, 0.95, 0.0, 0.7, 0.1]

Inference:
z = -2.5 + 0.8*0.15 - 3.0*0.95 + ... = -2.2
P = σ(-2.2) ≈ 0.09 → "low risk"
```

**On Admin Dashboard:**
- Top 10 high-risk loans highlighted
- Enables proactive follow-up (email reminders, etc.)

### 5.3 Other AI Services

**Chatbot Service:** (Basic)
- Responds to natural language queries about book availability, borrowing rules
- Implemented as simple keyword matching + templated responses
- Uses `/api/chat` endpoint

**Similar Books:**
- Given a book, find top-K similar books using cosine similarity
- Endpoint: `GET /api/recommendations/similar/:bookId?limit=4`

---

## 6. Backend API Specification

### 6.1 Route Modules

| Module | Purpose | Key Endpoints |
|--------|---------|---|
| `routes/auth.js` | User authentication | `POST /register`, `POST /login`, `POST /refresh`, `GET /me`, `POST /logout` |
| `routes/books.js` | Book CRUD + search | `GET /books`, `POST /books` (admin), `GET /books/:id`, `PUT /books/:id`, `DELETE /books/:id` |
| `routes/transactions.js` | Loan lifecycle | `GET /transactions`, `POST /borrow-request`, `POST /approve/:id`, `POST /decline/:id` |
| `routes/users.js` | User management | `GET /users`, `POST /users` (admin), `GET /users/:id`, `PUT /users/:id` |
| `routes/recommendations.js` | AI recommendations | `GET /recommendations`, `GET /recommendations/overdue-predictions`, `GET /recommendations/similar/:bookId` |
| `routes/dashboard.js` | Analytics dashboards | `GET /dashboard/admin`, `GET /dashboard/student` |
| `routes/analytics.js` | Detailed analytics | KPI reports, usage trends |
| `routes/chat.js` | Chatbot | `POST /chat` |
| `routes/fines.js` | Fine management | `GET /fines`, `POST /fines/:id/pay` |
| `routes/ratings.js` | Book ratings | `POST /ratings`, `GET /books/:bookId/ratings` |

### 6.2 Core Endpoints

#### Authentication

**POST /api/auth/register**
```json
Request:
{
  "name": "John Doe",
  "email": "john@university.edu",
  "password": "SecurePass123",
  "studentId": "ST2024001"
}

Response (201):
{
  "user": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "name": "John Doe",
    "email": "john@university.edu",
    "role": "student",
    "studentId": "ST2024001"
  },
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

**POST /api/auth/login**
```json
Request:
{
  "email": "john@university.edu",
  "password": "SecurePass123"
}

Response (200):
{
  "user": { ... },
  "accessToken": "...",
  "refreshToken": "..."
}
```

**POST /api/auth/refresh**
```json
Request:
{
  "refreshToken": "eyJhbGc..."
}

Response (200):
{
  "accessToken": "eyJhbGc...",
  "refreshToken": "eyJhbGc..." (optional)
}
```

**GET /api/auth/me** (requires auth)
```json
Response (200):
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "name": "John Doe",
  "email": "john@university.edu",
  "role": "student",
  "fines": 0.00,
  "returnRate": 100.00
}
```

#### Books

**GET /api/books** (search + filter)
```json
Query parameters:
?search=Harry&genre=Fantasy&status=available&sort=rating&page=1&limit=20

Response (200):
{
  "books": [
    {
      "id": "book-id-1",
      "code": "HP",
      "title": "Harry Potter",
      "author": "J.K. Rowling",
      "isbn": "978-0747532699",
      "year": 1997,
      "pages": 309,
      "rating": 4.8,
      "status": "available",
      "genres": ["Fantasy", "Adventure"],
      "tags": ["Magic", "Classics"],
      "bgBanner": "#8B4513"
    }
  ],
  "pagination": {
    "total": 150,
    "page": 1,
    "limit": 20,
    "pages": 8
  }
}
```

**GET /api/books/:id**
```json
Response (200):
{
  "id": "book-id-1",
  "code": "HP",
  "title": "Harry Potter and the Philosopher's Stone",
  "author": "J.K. Rowling",
  "isbn": "978-0747532699",
  "year": 1997,
  "pages": 309,
  "rating": 4.8,
  "description": "The first novel in...",
  "authorBio": "Joanne Kathleen Rowling...",
  "status": "available",
  "genres": ["Fantasy"],
  "tags": ["Magic", "Adventure", "Classics"],
  "bgBanner": "#8B4513",
  "similarBooks": [
    { "id": "...", "title": "Percy Jackson...", "similarity": 0.78 }
  ]
}
```

#### Transactions (Borrow/Return Workflow)

**POST /api/transactions/borrow-request** (student)
```json
Request:
{
  "bookId": "book-id-1"
}

Response (201):
{
  "id": "tx-id-1",
  "type": "borrow_request",
  "status": "pending",
  "bookId": "book-id-1",
  "userId": "user-id-1",
  "createdAt": "2026-05-28T10:30:00Z"
}
```

**GET /api/transactions/pending** (admin)
```json
Response (200):
{
  "transactions": [
    {
      "id": "tx-id-1",
      "type": "borrow_request",
      "status": "pending",
      "bookTitle": "Harry Potter",
      "borrowerName": "John Doe",
      "borrowerStudentId": "ST2024001",
      "createdAt": "2026-05-28T10:30:00Z"
    }
  ],
  "pagination": { ... }
}
```

**POST /api/transactions/:id/approve** (admin)
```json
Request:
{
  "dueDate": "2026-06-30"
}

Response (200):
{
  "id": "tx-id-1",
  "type": "borrow",
  "status": "approved",
  "dueDate": "2026-06-30",
  "message": "Borrow request approved"
}
```

#### Recommendations

**GET /api/recommendations** (authenticated)
```json
Query parameters:
?limit=6

Response (200):
{
  "recommendations": [
    {
      "id": "book-id-2",
      "title": "The Casual Vacancy",
      "author": "J.K. Rowling",
      "reason": "Content-based match based on your reading history",
      "score": 0.82
    }
  ],
  "coldStart": false
}
```

**GET /api/recommendations/overdue-predictions** (admin)
```json
Response (200):
{
  "predictions": [
    {
      "transactionId": "tx-id-5",
      "borrowerName": "Jane Smith",
      "bookTitle": "1984",
      "daysRemaining": 2,
      "riskScore": 0.78,
      "riskTier": "high risk",
      "features": {
        "daysRemaining": 2,
        "userReturnRate": 75.0,
        "userOverdueCount": 2,
        "currentLoanDays": 28,
        "userBooksBorrowedCount": 3
      }
    }
  ]
}
```

#### Dashboard

**GET /api/dashboard/admin** (admin)
```json
Response (200):
{
  "stats": {
    "totalBooks": 500,
    "availableBooks": 320,
    "borrowedBooks": 180,
    "totalStudents": 2500,
    "totalTransactions": 8900,
    "borrows": 4200,
    "returns": 4100,
    "pendingRequests": 45,
    "overdueAlerts": 8
  },
  "genreDistribution": [
    { "name": "Fantasy", "count": 120 },
    { "name": "Science Fiction", "count": 95 },
    { "name": "Romance", "count": 85 }
  ],
  "overduePredictions": [
    { "borrowerName": "...", "riskTier": "high risk", ... }
  ]
}
```

**GET /api/dashboard/student** (student)
```json
Response (200):
{
  "activeLoans": [
    {
      "bookTitle": "Harry Potter",
      "dueDate": "2026-06-15",
      "daysRemaining": 18,
      "status": "active"
    }
  ],
  "pendingRequests": 2,
  "dueSoonCount": 1,
  "recommendations": [ ... ]
}
```

### 6.3 Error Handling

**Standard error format:**
```json
{
  "error": "Description of the error",
  "details": { /* optional additional context */ }
}
```

**Common status codes:**
| Code | Meaning | Example |
|------|---------|---------|
| 200 | OK | Successful GET, successful update |
| 201 | Created | Resource created (POST) |
| 400 | Bad Request | Missing required field, validation failed |
| 401 | Unauthorized | Missing/invalid token, token expired |
| 403 | Forbidden | Valid token but insufficient permissions (student trying to access admin endpoint) |
| 404 | Not Found | Resource doesn't exist (book not found) |
| 409 | Conflict | Duplicate email on registration, duplicate ISBN |
| 422 | Unprocessable Entity | Semantic error (e.g., approving already-approved transaction) |
| 429 | Too Many Requests | Rate limit exceeded |
| 500 | Internal Server Error | Unexpected server error |

---

## 7. Frontend Architecture

### 7.1 Component Hierarchy

```
<App>
  ├─ <AuthProvider>              [Auth context - global state]
  │   │
  │   ├─ <ProtectedRoute>        [Route-level RBAC]
  │   │   ├─ <AppLayout>         [Main authenticated app shell]
  │   │   │   ├─ <Sidebar>       [Navigation + profile]
  │   │   │   ├─ <main-content>
  │   │   │   │   ├─ <AdminDashboard>
  │   │   │   │   ├─ <StudentDashboard>
  │   │   │   │   ├─ <Catalog>
  │   │   │   │   ├─ <BookDetails>
  │   │   │   │   ├─ <MyBooks>
  │   │   │   │   ├─ <Borrowers> (admin)
  │   │   │   │   ├─ <AdminTransactions> (admin)
  │   │   │   │   ├─ <StudentTransactions>
  │   │   │   │   └─ <Analytics> (admin)
  │   │   │   └─ <ChatWidget>    [AI chatbot floating]
  │   │   │
  │   │   └─ <Login>             [Public route]
  │   │   └─ <Register>          [Public route]
```

### 7.2 Key Components

#### **AuthContext.jsx**
```jsx
Responsibilities:
- Manage user auth state (user, loading)
- Handle login, register, logout, token refresh
- Provide useAuth() hook for child components
- Auto-restore session from sessionStorage on mount

State:
{
  user: { id, name, email, role, fines, returnRate } | null,
  loading: boolean
}

Methods:
- login(email, password) → user
- register(name, email, password, studentId) → user
- logout() → void
- refreshUser() → void
```

#### **API Client (client.js)**
```js
Responsibilities:
- Centralized fetch wrapper with auto JWT management
- Automatic token refresh on 401
- Token storage in sessionStorage

Exports:
- tokenStorage { getAccess, getRefresh, setTokens, clearTokens }
- api { login, register, logout, me, getBooks, searchBooks, ... }
- apiFetch(path, options) → response
```

**Auto-refresh flow:**
```
1. Request made with accessToken
2. Server returns 401 (token expired)
3. Client detects 401 + refreshToken exists
4. Client calls POST /api/auth/refresh
5. Get new accessToken
6. Retry original request
7. Return response to caller
```

**Queueing:** If multiple requests fail with 401 simultaneously, only one refresh is triggered; others wait for the new token.

#### **Sidebar.jsx**
```jsx
Props:
- role: 'admin' | 'student'

Renders:
- Navigation links (dashboard, catalog, my books, transactions)
- Admin-only links (borrowers, analytics)
- User profile badge + logout button
```

#### **Dashboard Pages**
- **AdminDashboard:** KPI cards (books, students, transactions), genre chart, overdue risk table
- **StudentDashboard:** Active loans, pending requests, due-soon alerts, personalized recommendations
- **Catalog:** Search + filter interface, book grid, pagination
- **BookDetails:** Full book info, similar books, borrow request button, ratings/reviews
- **Transactions:** Transaction history (admin: all; student: own)
- **Analytics:** (Admin) Advanced analytics, charts, trends

### 7.3 Styling

**Approach:** CSS-in-JS with inline styles + global CSS file  
**Responsive:** Mobile-first media queries

**Key CSS classes:**
```css
.app-layout-root-container      /* Main grid layout */
.main-content-window-frame      /* Scrollable content area */
.view-app-header                /* Header bar */
.header-profile-badge           /* User badge */
.card                           /* Content cards */
.book-grid                      /* Book display grid */
.btn, .btn-primary, .btn-danger /* Button styles */
.badge, .badge-success          /* Status badges */
```

---

## 8. Deployment & DevOps

### 8.1 Environment Configuration

**Backend (.env)**
```bash
# Server
NODE_ENV=production
PORT=5000
FRONTEND_URL=https://library.example.com

# Database
DB_HOST=mysql.example.com
DB_PORT=3306
DB_USER=library_user
DB_PASSWORD=<secure_password>
DB_NAME=library_system

# JWT
JWT_ACCESS_SECRET=<64+ char random string>
JWT_REFRESH_SECRET=<64+ char random string>
JWT_ACCESS_EXPIRES=15m
JWT_REFRESH_EXPIRES=7d

# Optional
RATE_LIMIT_WINDOW=15m
RATE_LIMIT_MAX_GLOBAL=200
RATE_LIMIT_MAX_AUTH=20
```

### 8.2 Build & Deployment

**Frontend Build:**
```bash
cd frontend
npm install
npm run build
# Output: build/ directory (static files optimized with Webpack)
```

**Backend Setup:**
```bash
cd backend
npm install
node db/setup.js          # Initialize schema
node db/load-demo.js      # (Optional) Load sample data
npm run start             # Production mode
# OR
npm run dev               # Development (nodemon auto-reload)
```

**Database Initialization:**
```bash
mysql -u root -p < backend/db/schema.sql
```

**Production Architecture:**
```
┌──────────────────────────────────────────┐
│  Reverse Proxy (nginx/Apache)            │
│  - HTTPS termination                     │
│  - Static file caching                   │
│  - Compression (gzip)                    │
└──────────┬───────────────────────────────┘
           │
    ┌──────┴──────┐
    │             │
┌───▼────┐   ┌───▼─────┐
│React   │   │Express  │
│Build/  │   │API      │
│Static  │   │(Node)   │
│(CDN)   │   └───┬─────┘
└────────┘       │
                 │
            ┌────▼──────┐
            │MySQL 8    │
            │(persistent│
            │data)      │
            └───────────┘
```

### 8.3 Database Backups

**Backup strategy:**
```bash
# Daily backup
mysqldump -u library_user -p library_system > backup_$(date +%Y%m%d).sql

# Restore
mysql -u library_user -p library_system < backup_20260528.sql
```

### 8.4 Monitoring & Logging

**Health check endpoint:**
```
GET /api/health
Response: { "status": "ok", "timestamp": "..." }
```

**Error logging:**
- Server: Console logs (stdout) + optional file logging
- Frontend: Error boundary component captures React errors

---

## 9. Performance Optimization

### 9.1 Database Optimizations

| Optimization | Benefit |
|---|---|
| **Indexes on foreign keys** | Fast joins (books, users lookup) |
| **Indexes on `type`, `status`, `due_date`** | Rapid transaction filtering |
| **FULLTEXT INDEX on books** | Natural language search via MATCH() |
| **Connection pooling** | Reuse TCP connections; reduce overhead |
| **Prepared statements** | Query plan caching; reduced parse overhead |

### 9.2 Backend Optimizations

| Optimization | Benefit |
|---|---|
| **Pagination (default limit 50)** | Reduce memory & transfer size |
| **JWT in payload (not DB lookup)** | No auth DB hit per request |
| **Rate limiting** | Prevent resource exhaustion |
| **Gzip compression** | ~70% reduction in response size |
| **Caching headers** | Browser/CDN caching for static assets |

### 9.3 Frontend Optimizations

| Optimization | Benefit |
|---|---|
| **Code splitting** | Load only needed JavaScript |
| **Lazy loading images** | Defer off-screen image downloads |
| **CSS minification** | Reduce stylesheet size |
| **sessionStorage (not localStorage)** | Automatic token clearing; reduced persistence |
| **React.memo + useCallback** | Prevent unnecessary re-renders |

### 9.4 Load Testing Estimates

**Current capacity (single instance):**
- Estimated concurrent users: 500–1000
- Estimated requests/sec: 100–200
- Response time (p95): < 500ms for typical queries

**Scaling strategies (if needed):**
1. **Horizontal scaling:** Load balancer + multiple Express instances
2. **Database replication:** Master-slave setup for read scaling
3. **Caching layer:** Redis for session storage + query results

---

## 10. Testing Strategy

### 10.1 Unit Tests

**Frontend (Jest + React Testing Library):**
- Component rendering
- User interactions (button clicks, form submissions)
- useAuth hook logic
- API client token refresh

**Backend:**
- Auth middleware (JWT verify, RBAC)
- Input validation
- Database queries (mocked)
- Recommendation engine math (TF-IDF, cosine similarity)

### 10.2 Integration Tests

- Auth flow (register → login → refresh)
- Book CRUD workflow
- Transaction lifecycle (request → approve → borrow → return)
- Recommendation generation

### 10.3 E2E Tests (optional)

- Selenium/Playwright: Full user workflows
- Login → search books → borrow request → admin approval → return

### 10.4 Test Coverage

**Target:**
- Frontend: > 80% coverage
- Backend: > 75% coverage
- Critical paths (auth, transactions): 100%

---

## 11. Future Enhancements

### 11.1 Short-term

1. **Advanced Search:** Elasticsearch integration for full-text search
2. **Email Notifications:** Borrow approvals, overdue reminders, due-soon alerts
3. **Book Reviews:** User ratings + text reviews
4. **Fine Payment:** Online payment gateway integration
5. **Audit Logs:** Track all admin actions (GDPR compliance)

### 11.2 Mid-term

1. **Mobile App:** React Native version
2. **Advanced Analytics:** Cohort analysis, user retention, genre trends
3. **Recommendation A/B Testing:** Track recommendation click-through rates
4. **QR Code Check-In:** Quick borrow/return via QR codes at desk
5. **Waitlist:** Students queue for popular borrowed books

### 11.3 Long-term

1. **Multi-campus:** Support multiple library branches
2. **Inter-library Loans:** Request books from partner libraries
3. **ML Ops:** Model retraining pipeline, drift detection
4. **Integration:** LDAP/Active Directory for institutional SSO
5. **Graph Database:** Knowledge graph for book relationships

---

## 12. Known Limitations & Considerations

### 12.1 Scalability

- **Single database instance:** Suitable for ~10K users; requires sharding/replication beyond
- **In-memory model training:** Recommendation engine trains on every request (< 5s); could be moved to batch jobs
- **No caching layer:** Redis would improve latency for frequently accessed data

### 12.2 Security

- **No HTTPS in dev:** Production must enforce HTTPS
- **No rate limiting on read endpoints:** Could add per-IP rate limiting for search
- **Token revocation:** No mechanism to revoke tokens before expiry (logout flushes client but server accepts valid tokens)

### 12.3 Functional

- **Cold-start recommendations:** New users get top-rated books only (acceptable for MVP)
- **No item-based CF:** Only collaborative filtering signal; missing item-similarity-based CF
- **Overdue model:** Logistic regression may be too simple for complex user behavior (could upgrade to RF/XGBoost)

---

## 13. Conclusion

The LibrarySystem is a **production-ready, full-stack intelligent library management platform** that seamlessly integrates:

- **Robust authentication** with JWT dual-token system and role-based access control
- **Sophisticated AI models** (content-based + collaborative filtering, overdue prediction) running entirely server-side
- **Scalable backend** with Express.js, MySQL, and rate limiting
- **Responsive React frontend** with automatic token refresh and protected routing
- **Comprehensive API** supporting 10+ feature-rich modules

**Key Strengths:**
1. No external API dependencies for AI (self-contained, cost-effective)
2. Clean separation of concerns (frontend/backend/DB)
3. Security-first design (bcrypt, JWT, CORS, Helmet, rate limiting)
4. Extensible architecture for future enhancements
5. Rich feature set (recommendations, overdue prediction, admin analytics)

**Recommended Next Steps:**
1. Deploy to production environment (AWS/Azure/GCP)
2. Set up CI/CD pipeline (GitHub Actions, Jenkins)
3. Implement email notifications for user engagement
4. Monitor performance metrics & user feedback
5. Plan mobile app expansion

---

## Appendix: Quick Reference

### File Locations

| File | Purpose |
|------|---------|
| [backend/server.js](backend/server.js) | Express app entry point |
| [backend/db/schema.sql](backend/db/schema.sql) | Database schema |
| [backend/services/aiEngine.js](backend/services/aiEngine.js) | Recommendation & prediction ML |
| [backend/middleware/auth.js](backend/middleware/auth.js) | JWT & RBAC |
| [src/context/AuthContext.jsx](src/context/AuthContext.jsx) | Frontend auth state |
| [src/api/client.js](src/api/client.js) | Centralized API client |
| [README.md](README.md) | Project documentation |

### Key Commands

```bash
# Backend
cd backend
npm install
node db/setup.js                 # Initialize DB
npm run dev                      # Dev server (nodemon)
npm run start                    # Production

# Frontend
cd ..
npm install
npm start                        # Dev server (CRA)
npm run build                    # Production build
npm test                         # Run tests
```

### Database Schema Quick View

```
users
  ├─ id (PK), email (UQ), password_hash
  ├─ role, return_rate, fines, is_active

books
  ├─ id (PK), isbn (UQ), title, author, rating, status
  ├─ genres (M:M via book_genres)
  └─ tags (M:M via book_tags)

transactions
  ├─ id (PK), book_id (FK), user_id (FK)
  ├─ type (borrow_request|borrow|return_request|return|overdue)
  ├─ status (pending|approved|declined|completed|cancelled)
  ├─ due_date, returned_at, fine_amount

reading_history
  ├─ id (PK), user_id (FK), book_id (FK)
  └─ read_at (for AI recommendations)
```

---

**Document Version:** 1.0  
**Last Updated:** May 28, 2026  
**Author:** Technical Review  
**Status:** Complete

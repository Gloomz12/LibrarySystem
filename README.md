# Library System

A full-stack intelligent library management system with AI-powered book recommendations, RBAC (admin/student roles), and a MySQL backend.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 18, React Router v7, Lucide React |
| Backend | Node.js, Express 4 |
| Database | MySQL 8+ |
| Auth | JWT (access + refresh tokens), bcrypt |
| AI | Content-based filtering (cosine similarity, no external API) |

---

## Features

- **Authentication** — JWT access tokens (15 min) + refresh tokens (7 days), stored in sessionStorage. Passwords hashed with bcrypt (12 rounds).
- **RBAC** — Two roles: `admin` and `student`. Route-level and API-level enforcement.
- **Book Catalog** — Search by title/author/ISBN, filter by genre/status, sort by title/author/rating/year.
- **Borrow Workflow** — Student requests → Admin approves/declines with due date → Student requests return → Admin confirms.
- **AI Recommendations** — Content-based filtering using TF-IDF-weighted cosine similarity on genres + tags. Cold-start fallback to top-rated books.
- **Overdue Predictions** — Risk scoring based on user return rate history + days until due date.
- **Admin Dashboard** — Live KPIs, overdue risk predictions, genre distribution, smart recommendations.
- **Student Dashboard** — Active loans, pending requests, due-soon alerts, personalized recommendations.

---

## Project Structure

```
LibrarySystem/
├── src/                    # React frontend
│   ├── api/client.js       # Centralized API client with auto token refresh
│   ├── context/AuthContext.jsx
│   ├── pages/
│   │   ├── Login.jsx
│   │   ├── AdminDashboard.jsx
│   │   ├── StudentDashboard.jsx
│   │   ├── Catalog.jsx
│   │   ├── BookDetails.jsx
│   │   ├── MyBooks.jsx
│   │   ├── Borrowers.jsx
│   │   ├── AdminTransactions.jsx
│   │   └── StudentTransactions.jsx
│   └── components/Sidebar.jsx
│
└── backend/
    ├── server.js
    ├── db/
    │   ├── connection.js
    │   ├── schema.sql       # All tables + views
    │   ├── seed.sql         # 21 books, 6 users, sample transactions
    │   └── setup.js         # One-command DB setup script
    ├── middleware/
    │   ├── auth.js          # JWT verify + RBAC authorize()
    │   └── validate.js      # express-validator error handler
    ├── routes/
    │   ├── auth.js          # login, refresh, logout, /me
    │   ├── books.js         # CRUD + genre/tag management
    │   ├── transactions.js  # Borrow/return request lifecycle
    │   ├── users.js         # User management + loan/history endpoints
    │   ├── recommendations.js
    │   └── dashboard.js
    └── services/
        └── recommendations.js  # AI engine (cosine similarity + overdue scoring)
```

---

## Setup

### Prerequisites
- Node.js 18+
- MySQL 8+

### 1. Configure the backend

```bash
cd backend
cp .env.example .env
```

Edit `backend/.env` and set your MySQL credentials:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=library_system

JWT_ACCESS_SECRET=change_this_to_a_long_random_string
JWT_REFRESH_SECRET=change_this_to_another_long_random_string
```

### 2. Set up the database

```bash
cd backend
npm run setup-db
```

This creates the `library_system` database, all tables, and seeds 21 books + 6 users.

### 3. Start the backend

```bash
cd backend
npm run dev       # development (nodemon)
# or
npm start         # production
```

Backend runs on `http://localhost:5000`.

### 4. Start the frontend

```bash
# from project root
npm start
```

Frontend runs on `http://localhost:3000`.

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Admin | admin@library.edu | Admin@123 |
| Student | alice.chen@university.edu | Student@123 |
| Student | marcus.j@university.edu | Student@123 |
| Student | jpark99@university.edu | Student@123 |

---

## API Reference

All endpoints require `Authorization: Bearer <accessToken>` except `/api/auth/login`.

### Auth
| Method | Path | Access |
|---|---|---|
| POST | `/api/auth/login` | Public |
| POST | `/api/auth/refresh` | Public |
| POST | `/api/auth/logout` | Authenticated |
| GET  | `/api/auth/me` | Authenticated |

### Books
| Method | Path | Access |
|---|---|---|
| GET    | `/api/books` | All |
| GET    | `/api/books/genres` | All |
| GET    | `/api/books/:id` | All |
| POST   | `/api/books` | Admin |
| PUT    | `/api/books/:id` | Admin |
| DELETE | `/api/books/:id` | Admin |

### Transactions
| Method | Path | Access |
|---|---|---|
| GET  | `/api/transactions` | All (students see own only) |
| GET  | `/api/transactions/pending` | Admin |
| POST | `/api/transactions/borrow-request` | Student |
| POST | `/api/transactions/return-request` | Student |
| POST | `/api/transactions/:id/cancel` | Student |
| POST | `/api/transactions/:id/approve` | Admin |
| POST | `/api/transactions/:id/decline` | Admin |

### Users
| Method | Path | Access |
|---|---|---|
| GET  | `/api/users` | Admin |
| GET  | `/api/users/:id` | Admin / Own |
| GET  | `/api/users/:id/active-loans` | Admin / Own |
| GET  | `/api/users/:id/reading-history` | Admin / Own |
| POST | `/api/users` | Admin |
| PUT  | `/api/users/:id` | Admin / Own |

### Recommendations & AI
| Method | Path | Access |
|---|---|---|
| GET | `/api/recommendations` | Authenticated |
| GET | `/api/recommendations/user/:userId` | Admin |
| GET | `/api/recommendations/similar/:bookId` | Authenticated |
| GET | `/api/recommendations/overdue-predictions` | Admin |

### Dashboard
| Method | Path | Access |
|---|---|---|
| GET | `/api/dashboard/admin` | Admin |
| GET | `/api/dashboard/student` | Student |

---

## Security Notes

- Passwords are hashed with **bcrypt** (12 rounds)
- JWT secrets should be long random strings in production — use `openssl rand -hex 32`
- Refresh tokens are stored **hashed** in the database and rotated on every use
- Rate limiting: 200 req/15min globally, 20 req/15min on auth endpoints
- `helmet` sets secure HTTP headers
- Input validation on all write endpoints via `express-validator`
- SQL injection prevented via parameterized queries throughout

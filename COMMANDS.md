# Commands Reference

Quick reference for every command you need to run this project.

---

## Prerequisites

Before anything else, make sure these are installed and running:

- **Node.js** v18+
- **XAMPP** — start **MySQL** from the XAMPP Control Panel
- Two terminal windows open (one for backend, one for frontend)

---

## First-Time Setup

Run these **once** when setting up the project for the first time.

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Edit `backend/.env` and set your MySQL password:

```
DB_HOST=127.0.0.1
DB_PASSWORD=          ← leave blank if XAMPP default (no password)
```

### 3. Create database and seed books

```bash
cd backend
npm run setup-db
```

This creates the `library_system` database, all tables, and inserts the 21 books + admin account.

### 4. Run the database migration (ratings + fine config)

```bash
cd backend
node db/migrations/001_add_ratings_and_fine_config.sql
```

Or run it directly in phpMyAdmin (`http://localhost/phpmyadmin`).

### 5. Load demo data (students, transactions, reading history)

```bash
cd backend
npm run load-demo
```

### 6. Fix active loan due dates and recalculate fines

```bash
cd backend
node db/fix-fines.js
```

### 7. Install frontend dependencies

```bash
cd ..          ← back to project root
npm install
```

---

## Every Day — Starting the Project

Open **two terminals**.

### Terminal 1 — Backend

```bash
cd backend
npm run dev
```

Runs on `http://localhost:5000`

### Terminal 2 — Frontend

```bash
npm start
```

Runs on `http://localhost:3000` — opens in browser automatically.

---

## Demo & Presentation Commands

### Generate the AI test results report

```bash
cd backend
npm run ai-report
```

Writes `AI_TEST_RESULTS.md` to the project root with live metrics.

### Run the AI test in the terminal (console output)

```bash
cd backend
npm run ai-test
```

### Reload demo data (if you need a fresh start)

```bash
cd backend
npm run load-demo
node db/fix-fines.js
```

### Force the AI model to retrain immediately

```bash
cd backend
node -e "require('dotenv').config(); const {clearModelCache}=require('./services/aiEngine'); clearModelCache(); console.log('Cache cleared');"
```

Or just click **"Re-evaluate models"** on the Analytics → AI Performance page.

---

## Login Credentials

| Role | Email | Password |
|---|---|---|
| Admin | `admin@library.edu` | `Admin@123` |
| Student (reliable) | `maria.santos@university.edu` | `Student@123` |
| Student (overdue) | `jose.reyes@university.edu` | `Student@123` |
| Student (worst) | `mark.aquino@university.edu` | `Student@123` |

---

## Useful URLs (while running)

| Page | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend health check | http://localhost:5000/api/health |
| phpMyAdmin | http://localhost/phpmyadmin |
| Debug training data | http://localhost:5000/api/analytics/debug-training |

> The debug-training URL requires you to be logged in as admin. Use the access token from the login response, or just check it from the Analytics page.

---

## Troubleshooting

### "ECONNREFUSED" on backend start
MySQL is not running. Open XAMPP Control Panel and click **Start** next to MySQL.

### "Failed to fetch" on login
The backend is not running. Start it with `npm run dev` in the `backend` folder.

### "Access denied for user root"
Your MySQL password doesn't match `.env`. Check `backend/.env` → `DB_PASSWORD`.

### AI model shows "Needs data" or 0% metrics
Run `npm run load-demo` then `node db/fix-fines.js`, then click **Re-evaluate** on the Analytics page.

### Port 5000 already in use
Another instance of the backend is running. Close it or change `PORT` in `backend/.env`.

---

## All npm Scripts (backend)

| Command | What it does |
|---|---|
| `npm run dev` | Start backend with auto-reload (nodemon) |
| `npm start` | Start backend without auto-reload |
| `npm run setup-db` | Create database, tables, seed books |
| `npm run load-demo` | Insert demo students, transactions, reading history |
| `npm run ai-test` | Run AI evaluation and print to terminal |
| `npm run ai-report` | Generate `AI_TEST_RESULTS.md` |

## All npm Scripts (frontend — run from project root)

| Command | What it does |
|---|---|
| `npm start` | Start React dev server |
| `npm run build` | Build for production |

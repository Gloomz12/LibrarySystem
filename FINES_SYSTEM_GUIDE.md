# How Fines Work in LibrarySystem

**Technical Deep Dive: Fine Calculation, Application & Management**  
**Date:** May 28, 2026  
**Version:** 1.0.0

---

## Executive Summary

The fine system in LibrarySystem is an automated, configurable penalty system for overdue books. Fines are:

- **Calculated on return** — When a student returns a late book, the system automatically computes the fine based on days overdue
- **Configurable** — Admins can set rate per day, grace period, and maximum fine cap
- **Per-transaction tracked** — Each loan records its own fine amount
- **Accumulated per user** — All fines are summed in the `users.fines` field
- **Waivable by admin** — Admins can forgive fines for valid reasons
- **Predictable** — AI model predicts which loans are high-risk for overdue (proactive intervention)

---

## 1. Fine Configuration

### 1.1 Default Configuration

The system ships with default fine settings:

```sql
-- Table: fine_config (only 1 row, enforced by PRIMARY KEY)
id              INT         PRIMARY KEY = 1
rate_per_day    DECIMAL     = 5.00      -- PHP 5 per day overdue
grace_period    TINYINT     = 0         -- 0 days grace (fines start immediately)
max_fine        DECIMAL     = 500.00    -- Maximum fine per book
currency_symbol VARCHAR     = '₱'       -- Philippine Peso symbol
updated_at      DATETIME              -- Last modified timestamp
```

**Example interpretation:**
- Student returns book 3 days late → Fine = 3 days × ₱5/day = ₱15 (within ₱500 cap)
- Student returns book 100 days late → Fine = 100 × ₱5 = ₱500 (capped at max)
- With grace_period=0: Fines start immediately on due date

### 1.2 Admin Configuration

**Endpoint:** `PUT /api/fines/config`

**Admin can adjust:**

```json
{
  "ratePerDay": 10.00,        -- Increase fine per day
  "gracePeriod": 3,           -- Add 3-day grace period
  "maxFine": 1000.00,         -- Increase cap
  "currencySymbol": "$"       -- Change currency
}
```

**Validation:**
- `ratePerDay`: Must be ≥ 0
- `gracePeriod`: Must be 0-30 days
- `maxFine`: Must be ≥ 0
- `currencySymbol`: Max 5 characters

**Updates apply to:**
- All future overdue books (not retroactive)
- Display in UI (currency symbol in fine display)
- New fine calculations immediately

### 1.3 Viewing Configuration

**Endpoint:** `GET /api/fines/config`

**Who can access:** Any authenticated user (student or admin)

**Response:**
```json
{
  "id": 1,
  "rate_per_day": 5.00,
  "grace_period": 0,
  "max_fine": 500.00,
  "currency_symbol": "₱",
  "updated_at": "2026-05-28T10:00:00Z"
}
```

---

## 2. Fine Calculation

### 2.1 Calculation Algorithm

**When:** On return confirmation (admin approves return request)

**Formula:**

```
daysOverdue = DATEDIFF(returnDate, dueDate)
              = (returnDate - dueDate) in days, rounded down

effectiveDaysOverdue = MAX(0, daysOverdue - gracePeriod)
                     = Days late minus grace period

fine = MIN(
  effectiveDaysOverdue × ratePerDay,    -- Days × rate
  maxFine                                 -- Capped at maximum
)
```

**Code:**
```javascript
async function calculateFine(dueDate, returnedAt = null) {
  const config = await getFineConfig();
  const due    = new Date(dueDate);
  const ret    = returnedAt ? new Date(returnedAt) : new Date();

  // Normalize to midnight (count whole days)
  due.setHours(0, 0, 0, 0);
  ret.setHours(0, 0, 0, 0);

  // Calculate days late
  const daysLate = Math.floor((ret - due) / (1000 * 60 * 60 * 24));
  
  // Apply grace period
  const effectiveDays = Math.max(0, daysLate - config.grace_period);
  
  // Calculate and cap fine
  const fine = Math.min(
    effectiveDays * parseFloat(config.rate_per_day),
    parseFloat(config.max_fine)
  );
  
  return parseFloat(fine.toFixed(2));  // Round to 2 decimals
}
```

### 2.2 Calculation Examples

**Example 1: Standard Late Return**
```
Configuration: ₱5/day, 0 grace, ₱500 max
Due date: May 20, 2026
Returned: May 25, 2026 (5 days late)

Calculation:
daysLate = 5
effectiveDays = MAX(0, 5 - 0) = 5
fine = MIN(5 × 5, 500) = MIN(25, 500) = ₱25.00
```

**Example 2: Return Within Grace Period**
```
Configuration: ₱5/day, 3 days grace, ₱500 max
Due date: May 20, 2026
Returned: May 22, 2026 (2 days late)

Calculation:
daysLate = 2
effectiveDays = MAX(0, 2 - 3) = 0  ← No fine (within grace)
fine = ₱0.00
```

**Example 3: Extreme Late Return (Capped)**
```
Configuration: ₱5/day, 0 grace, ₱500 max
Due date: May 20, 2026
Returned: Sep 25, 2026 (128 days late)

Calculation:
daysLate = 128
effectiveDays = MAX(0, 128 - 0) = 128
uncappedFine = 128 × 5 = ₱640
fine = MIN(640, 500) = ₱500.00  ← Capped at max
```

**Example 4: Return Early (No Fine)**
```
Configuration: ₱5/day, 0 grace, ₱500 max
Due date: May 30, 2026
Returned: May 25, 2026 (5 days early)

Calculation:
daysLate = -5
effectiveDays = MAX(0, -5 - 0) = 0  ← No fine
fine = ₱0.00
```

### 2.3 Preview Endpoint (Admin)

**Purpose:** Admin can preview what fine will be for a given date pair

**Endpoint:** `GET /api/fines/preview?dueDate=2026-05-20&returnDate=2026-05-25`

**Response:**
```json
{
  "dueDate": "2026-05-20",
  "returnDate": "2026-05-25",
  "fine": 25.00,
  "currency": "₱"
}
```

**Use case:** Before confirming a late return, admin can see what the fine will be

---

## 3. Fine Application Process

### 3.1 When Fines Are Applied

**Trigger:** Admin approves a return request for an overdue book

**Workflow:**

```
Student requests return
         │
         ├─ POST /api/transactions/:id/approve
         │
         ├─ Backend checks:
         │  ├─ Is transaction a return_request?
         │  ├─ Is book status 'borrowed'?
         │  └─ Valid admin role?
         │
         ├─ Calculate fine:
         │  └─ applyFineOnReturn(transactionId, userId, dueDate, returnedAt)
         │
         ├─ If fine > 0:
         │  ├─ Update transactions.fine_amount = fine
         │  ├─ Update users.fines = users.fines + fine
         │  └─ Transaction updated to status = 'completed'
         │
         ├─ Response: {
         │    status: "completed",
         │    fineAmount: 25.00,
         │    message: "Return approved, fine applied"
         │  }
         │
         └─ Book status: 'borrowed' → 'available'
```

### 3.2 Database Transactions

**Why:** Atomicity — either all updates succeed or none (prevent partial updates)

```javascript
async function applyFineOnReturn(conn, transactionId, userId, dueDate, returnedAt) {
  // Calculate fine amount
  const fine = await calculateFine(dueDate, returnedAt);

  if (fine > 0) {
    // Step 1: Record fine on the specific transaction
    await conn.execute(
      'UPDATE transactions SET fine_amount = ? WHERE id = ?',
      [fine, transactionId]
    );
    
    // Step 2: Add to user's accumulated fines
    await conn.execute(
      'UPDATE users SET fines = fines + ? WHERE id = ?',
      [fine, userId]
    );
  }

  return fine;
}
```

**Important:** Uses a database connection (conn) passed in to ensure transaction atomicity. Both updates happen together or both fail.

### 3.3 Data Model Impact

**Updates to three locations:**

1. **transactions table** (per-transaction fine)
   ```sql
   UPDATE transactions SET fine_amount = 25.00 WHERE id = 'tx-123'
   ```

2. **users table** (accumulated fines)
   ```sql
   UPDATE users SET fines = fines + 25.00 WHERE id = 'user-456'
   ```

**Result:**

```
User's Profile:
- Total Fines: ₱85.00  ← Displayed on dashboard + profile
  (Accumulated from multiple books: ₱25 + ₱30 + ₱30)

Transaction History:
- Book 1: Returned on time → fine_amount = ₱0.00
- Book 2: Returned 5 days late → fine_amount = ₱25.00
- Book 3: Returned 6 days late → fine_amount = ₱30.00
- Book 4: Returned 6 days late → fine_amount = ₱30.00
```

---

## 4. Fine Management by Admins

### 4.1 View All Fines

**Endpoint:** Included in student lookup

**URL:** `/main/admin/fines`

**Shows:**
```
Student Name        | Amount Due | Status  | Due Date  | Actions
─────────────────────┼────────────┼─────────┼───────────┼──────────
John Doe           | ₱85.00     | Unpaid  | Jun 01    | [Pay] [Waive]
Jane Smith         | ₱25.00     | Paid    | May 30    | 
Bob Johnson        | ₱0.00      | No fine | —         | 
```

### 4.2 Waive Fines

**Purpose:** Forgive fines (e.g., system error, goodwill, hardship)

**Endpoint:** `POST /api/fines/waive/:userId`

**Admin action:**
```
1. Find student in fines list
2. Click [Waive] button
3. Confirm action
4. Reason: (required) e.g., "Student had medical emergency"
5. Submit
```

**Backend:**
```sql
UPDATE users SET fines = 0.00 WHERE id = 'user-456'
```

**Effect:**
- All outstanding fines cleared immediately
- User's fines balance goes to ₱0.00
- Logged in audit trail (admin name, timestamp, reason)

**Note:** Does NOT delete individual transaction fine records (historical accuracy), just clears user's total.

### 4.3 Recalculate Active Fines

**Purpose:** Update fine amounts for currently overdue books (based on new config)

**Endpoint:** `POST /api/fines/recalculate`

**Scenario:**
```
Admin changes fine rate: ₱5/day → ₱8/day

Loan X is currently 10 days overdue:
- Old fine: 10 × 5 = ₱50
- New fine: 10 × 8 = ₱80

Admin clicks [Recalculate Fines]
- Finds all active loans (type='borrow', status='approved', returned_at=NULL) 
  where due_date < TODAY
- Recalculates each
- Updates transaction.fine_amount and users.fines accordingly
```

**Backend:**
```javascript
async function recalculateActiveFines() {
  // Get all currently overdue active loans
  const loans = await pool.execute(`
    SELECT t.id, t.user_id, t.due_date
    FROM transactions t
    WHERE t.type = 'borrow' 
      AND t.status = 'approved'
      AND t.returned_at IS NULL
      AND t.due_date < CURDATE()
  `);

  // Recalculate each
  for (const loan of loans) {
    const fine = await calculateFine(loan.due_date, null);
    await pool.execute(
      'UPDATE transactions SET fine_amount = ? WHERE id = ?',
      [fine, loan.id]
    );
  }

  return loans.length;  // Report how many updated
}
```

**Response:**
```json
{
  "message": "Recalculated fines for 45 overdue loan(s)"
}
```

---

## 5. Fine Display & Collection

### 5.1 Student Dashboard

**Shows:**
```
Current Fines: ₱85.00
├─ Book 1 (overdue 5 days): ₱25.00
├─ Book 2 (overdue 6 days): ₱30.00
└─ Book 3 (overdue 8 days): ₱30.00

Status:
├─ Book 1: Requested return (pending admin approval)
├─ Book 2: Returned (completed, fine applied)
└─ Book 3: Returned (completed, fine applied)

[View Details] [Pay Now] (if payment gateway integrated)
```

### 5.2 Student Profile

**Shows:**
```
Name: John Doe
Student ID: ST2024001
Account Balance: ₱85.00 in fines outstanding
Last Updated: Today, 10:30 AM
```

### 5.3 Admin Dashboard

**Student Overview Card:**
```
Active Loans: 2
Outstanding Fines: ₱85.00  ← Highlighted if > 0
Return Rate: 88%
Status: ✓ Active
```

### 5.4 Fine Collection (Optional)

**Feature:** Online payment (if payment gateway integrated)

**Endpoint:** `POST /api/fines/pay`

**Flow:**
```
1. Student goes to /main/fines
2. Sees outstanding balance: ₱85.00
3. Clicks [Pay Now]
4. Redirected to payment gateway (Stripe, GCash, etc.)
5. Student enters payment method
6. Payment processed
7. Fines = 0.00
8. Receipt emailed to student
```

**Fallback (if gateway not integrated):**
- Students pay at library desk (cash, check, card)
- Admin manually records payment
- Admin updates fines in database

---

## 6. AI-Powered Overdue Prediction

### 6.1 Connection to Fine System

**Purpose:** Predict which loans will be late BEFORE they're due (proactive intervention)

**Benefit:** Prevent fines by sending reminder emails

**Features Used:**
- `users.return_rate` — Historical on-time rate (0-100%)
- `users` (overdue_count) — Count of past overdue loans
- Transaction `days_until_due` — Time remaining
- Loan duration — How long book borrowed for

### 6.2 Risk Prediction Process

**Weekly, admin views:**

```
GET /api/recommendations/overdue-predictions
```

**Shows:**
```
Rank │ Student      │ Book           │ Due Date │ Days Left │ Risk  │ Tier
─────┼──────────────┼────────────────┼──────────┼───────────┼───────┼──────────
1    │ Jane Smith   │ 1984           │ May 30   │ 2         │ 0.92  │ HIGH
2    │ Bob Johnson  │ Brave New Wo…  │ Jun 02   │ 5         │ 0.78  │ HIGH
3    │ Alice Brown  │ Station Elev…  │ Jun 05   │ 8         │ 0.65  │ MEDIUM
4    │ David Lee    │ Beloved        │ Jun 10   │ 13        │ 0.42  │ LOW
```

**Admin actions:**
```
For HIGH RISK loans:
├─ Send email reminder: "Your book is due in 2 days"
├─ Mention fine: "Late returns incur ₱5/day fine"
├─ Call student (if very high risk)
└─ Reserve alternative copy (if available)

For MEDIUM RISK:
└─ Send automated email reminder

For LOW RISK:
└─ No action (monitor)
```

### 6.3 Preventing Fines

**Example intervention:**

```
Jane Smith – 1984 (Due May 30, 2 days remaining)
Risk Score: 0.92 (HIGH)

Because:
- Her return rate is only 75% (vs 92% average)
- She's had 2 past overdue loans
- She currently has 3 books out
- Loan duration was 30 days (full period)

Admin sends email:
"Hi Jane,
Your copy of '1984' is due in 2 days (May 30).
If returned late, fines of ₱5 per day will apply.
Please return it on time to avoid charges!
—Library Team"

Result: Jane returns on time, no ₱10+ fine incurred
```

---

## 7. Database Schema

### 7.1 Fine Configuration Table

```sql
CREATE TABLE fine_config (
  id              INT         NOT NULL PRIMARY KEY DEFAULT 1,
  rate_per_day    DECIMAL(6,2) NOT NULL DEFAULT 5.00,
  grace_period    TINYINT     NOT NULL DEFAULT 0,
  max_fine        DECIMAL(8,2) NOT NULL DEFAULT 500.00,
  currency_symbol VARCHAR(5)  NOT NULL DEFAULT '₱',
  updated_at      DATETIME    NOT NULL DEFAULT CURRENT_TIMESTAMP 
                             ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_single_row CHECK (id = 1)
);
```

**Key points:**
- Only 1 row (id=1 enforced by PRIMARY KEY + CHECK constraint)
- Updated globally affects all fine calculations
- DECIMAL(6,2) allows up to ₱9,999.99 per day rate
- DECIMAL(8,2) allows up to ₱999,999.99 max fine

### 7.2 Users Table (Fine Fields)

```sql
CREATE TABLE users (
  ...
  return_rate   DECIMAL(5,2) NOT NULL DEFAULT 100.00,  -- 0-100%
  fines         DECIMAL(10,2) NOT NULL DEFAULT 0.00,   -- Total outstanding
  ...
);
```

**Key points:**
- `return_rate`: Used in overdue prediction model
- `fines`: Accumulated total (sum of all transaction.fine_amount)
- DECIMAL(10,2) allows up to ₱99,999,999.99 total fines

### 7.3 Transactions Table (Fine Field)

```sql
CREATE TABLE transactions (
  ...
  fine_amount   DECIMAL(10,2) NOT NULL DEFAULT 0.00,
  ...
);
```

**Key points:**
- Per-transaction fine record
- Updated when return is confirmed
- Historical audit trail (never deleted)

---

## 8. Examples & Scenarios

### 8.1 Scenario 1: Standard Late Return (5 Days)

```
Setup:
- Configuration: ₱5/day, 0 grace, ₱500 max
- Student: John Doe
- Book: "Harry Potter"
- Loan ID: tx-123

Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
May 20: Due date set
May 25: Student returns book (5 days late)

Admin approves return:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. applyFineOnReturn(tx-123, john_id, '2026-05-20', '2026-05-25')
2. Calculate: MAX(0, 5 - 0) × 5 = ₱25.00
3. Update: transactions.fine_amount = 25.00
4. Update: users.fines = 25.00 (was 0)
5. Email: "Fine of ₱25 applied to your account"

Result:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- John's profile now shows: Outstanding Fines ₱25.00
- Transaction history records: "1984 — Fine: ₱25.00"
- Book available for next student
```

### 8.2 Scenario 2: Grace Period Protection (2 Days Early Within Grace)

```
Setup:
- Configuration: ₱5/day, 3 days grace, ₱500 max
- Student: Jane Smith
- Book: "The Hobbit"
- Loan ID: tx-124

Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
May 20: Due date set
May 22: Student returns book (2 days late)

Admin approves return:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. applyFineOnReturn(tx-124, jane_id, '2026-05-20', '2026-05-22')
2. Calculate: MAX(0, 2 - 3) = 0 days effective
3. Fine = 0 × 5 = ₱0.00
4. No updates to users.fines

Result:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Jane's profile: Outstanding Fines ₱0.00
- Email: "Thank you for returning on time (within grace period)!"
- Book available for next student
```

### 8.3 Scenario 3: Extreme Late, Capped at Maximum

```
Setup:
- Configuration: ₱8/day, 0 grace, ₱500 max
- Student: Bob Johnson
- Book: "Dune"
- Loan ID: tx-125
- Overdue for 120 days (4 months!)

Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
May 01: Due date
Sep 01: Student finally returns (120 days late)

Admin approves return:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
1. applyFineOnReturn(tx-125, bob_id, '2026-05-01', '2026-09-01')
2. Calculate: MAX(0, 120 - 0) = 120 days
3. uncappedFine = 120 × 8 = ₱960
4. fine = MIN(960, 500) = ₱500.00 (capped!)
5. Update: transactions.fine_amount = 500.00
6. Update: users.fines = users.fines + 500.00

Result:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Bob's profile: Outstanding Fines ₱500.00+ (capped)
- Email: "Maximum fine of ₱500 applied. Please contact library."
- Potential follow-up: Admin may waive based on circumstances
```

### 8.4 Scenario 4: Configuration Change Impact

```
Setup:
- Original: ₱5/day, 0 grace, ₱500 max
- Active loans currently 20 days overdue (not yet returned)

Timeline:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Admin changes configuration:
  - New rate: ₱8/day (was 5)
  - New grace: 2 days (was 0)
  - New max: ₱1000 (was 500)

Before recalculation:
- 20 active overdue loans × 20 days × ₱5 = Each had ₱100 fine

Admin clicks: POST /api/fines/recalculate

After recalculation:
- 20 active overdue loans × (20-2) days × ₱8 = Each now ₱144 fine
- transactions updated
- users.fines updated accordingly

Result:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
- Response: "Recalculated fines for 20 overdue loan(s)"
- Students see increased fines (one-time jump)
- Future loans use new rates
```

---

## 9. API Endpoints Summary

### Fines Management Endpoints

| Endpoint | Method | Role | Purpose |
|----------|--------|------|---------|
| `/api/fines/config` | GET | Any | View current fine settings |
| `/api/fines/config` | PUT | Admin | Update fine rate, grace period, max |
| `/api/fines/preview` | GET | Admin | Preview fine for date range |
| `/api/fines/recalculate` | POST | Admin | Recalculate fines for all overdue active |
| `/api/fines/waive/:userId` | POST | Admin | Clear all fines for user |

### Related Endpoints

| Endpoint | Purpose |
|----------|---------|
| `GET /api/dashboard/student` | View own fines balance |
| `GET /api/dashboard/admin` | View all students' fines |
| `POST /api/transactions/:id/approve` | (Return) Applies fine if late |
| `GET /api/recommendations/overdue-predictions` | High-risk loans (prevent fines) |

---

## 10. Best Practices

### For Admins

1. **Set reasonable rates** — Balance revenue with student fairness
   - ₱5/day: Moderate (₱50 for 10 days)
   - ₱10/day: Strict (₱100 for 10 days)
   - ₱0.50/day: Lenient (₱5 for 10 days)

2. **Use grace periods** — Avoid penalizing minor delays
   - Typical: 2-3 days grace
   - Reason: Time for physical return logistics

3. **Set reasonable caps** — Prevent excessive penalties
   - ₱500: Standard (encourages return)
   - ₱1000+: For larger libraries with high demand

4. **Monitor overdue predictions** — Proactive > reactive
   - Send reminders before due date (prevent fines)
   - Better UX than collecting fines after-the-fact

5. **Waive compassionately** — Consider student circumstances
   - Medical emergency
   - System error
   - Hardship cases
   - Log reason for audit trail

### For Students

1. **Check due dates** — Mark calendar, set phone reminders
2. **Request extensions early** — Ask admin before due date
3. **Return ASAP** — Grace period gives buffer, but don't rely on it
4. **Monitor fines balance** — Check profile regularly
5. **Pay or dispute** — Contact library if believe fine is incorrect

---

## 11. Frequently Asked Questions

### Q: How are fines calculated?
A: `fine = MIN((daysLate - gracePeriod) × ratePerDay, maxFine)`

### Q: When are fines applied?
A: When admin approves a return request for a late book.

### Q: Can I contest a fine?
A: Yes, email library@university.edu with reason. Admin can waive.

### Q: What if I never return a book?
A: It remains marked "borrowed". If never returned, fine continues accruing (actively overdue). Admin may charge replacement cost or pursue debt collection.

### Q: Do fines affect my borrowing?
A: Some libraries prevent borrowing if fines > threshold. LibrarySystem currently does not, but could be added as feature.

### Q: Can fines be forgiven?
A: Yes, admin can click [Waive] button. Logged in audit trail with reason.

### Q: What if I return early?
A: No fine. Early returns always show ₱0.00.

### Q: How often are fines recalculated?
A: On-demand when admin clicks [Recalculate]. Could be automated (weekly) in future.

### Q: What currency are fines in?
A: Philippine Peso (₱) by default. Configurable by admin.

---

## 12. Technical Implementation Details

### Service: backend/services/fines.js

**Exports:**
```javascript
{
  getFineConfig,           // Get current settings
  calculateFine,           // Compute fine for dates
  applyFineOnReturn,       // Apply fine on return + update DB
  recalculateActiveFines   // Batch recalculate all overdue
}
```

### Routes: backend/routes/fines.js

**Handlers:**
- `GET /fines/config` → getFineConfig()
- `PUT /fines/config` → Update fine_config table
- `GET /fines/preview` → calculateFine() with preview
- `POST /fines/recalculate` → recalculateActiveFines()
- `POST /fines/waive/:userId` → Clear user's fines

### Database Tables

1. **fine_config** — Single-row configuration table
2. **users.fines** — Running total per student
3. **transactions.fine_amount** — Per-loan fine record

---

## Conclusion

The fine system in LibrarySystem is:

✅ **Automated** — No manual calculations  
✅ **Configurable** — Admins adjust rates anytime  
✅ **Transparent** — Students see all charges  
✅ **Fair** — Grace periods and caps prevent abuse  
✅ **Predictive** — AI flags high-risk loans before due  
✅ **Flexible** — Admins can waive fines for valid reasons

The system balances library revenue (incentivizes on-time returns) with student fairness (grace periods, caps, waivers).

---

**Document Version:** 1.0  
**Last Updated:** May 28, 2026  
**Status:** Complete Technical Reference

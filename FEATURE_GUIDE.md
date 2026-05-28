# LibrarySystem Feature Guide

**Quick Reference for System Features**  
**Date:** May 28, 2026  
**Version:** 1.0.0

---

## Table of Contents

1. [Public Features](#public-features)
2. [Student Features](#student-features)
3. [Admin Features](#admin-features)
4. [Feature Comparison](#feature-comparison)

---

## Public Features

### Authentication

#### Register New Account
- **Who:** Anyone (self-service)
- **What:** Create student account
- **Where:** `/register` page
- **How:**
  1. Enter full name, email, password
  2. Optional: Enter student ID (e.g., ST2024001)
  3. Click [Sign Up]
  4. Auto-login with new account
  5. Redirected to dashboard
- **Password Requirements:** Min 8 chars, 1 uppercase, 1 number
- **Time:** Instant

#### Login
- **Who:** Registered users
- **What:** Access personalized account
- **Where:** `/login` page
- **How:**
  1. Enter email + password
  2. Click [Login]
  3. Auto-redirected to role-specific dashboard
- **Security:** JWT tokens (access: 15 min, refresh: 7 days)
- **Session:** Stays logged in across page reloads (auto-refresh)
- **Timeout:** Auto-logout after 7 days of inactivity

#### Logout
- **Who:** Any logged-in user
- **What:** End session securely
- **Where:** User profile menu (top-right)
- **How:** Click profile icon → [Logout]
- **Effect:** Tokens cleared from browser
- **Security:** Server invalidates refresh token

---

## Student Features

### Dashboard

#### My Dashboard
- **URL:** `/main/dashboard`
- **Displays:**
  - Active loans (books currently borrowed)
  - Pending requests (awaiting admin approval)
  - Due-soon alerts (books due in <3 days)
  - Personalized recommendations (AI-powered)
  - Quick stats (fines, return rate)

**Active Loans Card:**
```
Book: Harry Potter and the Philosopher's Stone
Status: Borrowed
Due Date: Jun 28, 2026
Days Remaining: 30 days
[Request Return]
```

**Pending Requests Card:**
```
2 pending requests
- 1984 (requested May 27)
- The Casual Vacancy (requested May 28)
Status: Awaiting admin approval
```

**Recommendations Card:**
```
Recommended For You (6 books)
- The Casual Vacancy (Score: 0.82)
- Brave New World (Score: 0.78)
- Station Eleven (Score: 0.75)
...
[See All Recommendations]
```

### Book Catalog

#### Search & Filter
- **URL:** `/main/catalog`
- **Search by:**
  - Title (e.g., "Harry")
  - Author (e.g., "Rowling")
  - ISBN (e.g., "978-0747532699")
- **Filter by:**
  - Genre (Fantasy, Science Fiction, Romance, etc.)
  - Status (Available, Borrowed)
- **Sort by:**
  - Relevance (default for search)
  - Rating (high to low)
  - Title (A-Z)
  - Author (A-Z)
  - Year published
- **Results:** Display as grid with cover image, title, author, rating

**Pagination:** 20 books per page (next/previous buttons)

#### Book Details
- **URL:** `/main/books/:bookId`
- **Information displayed:**
  - Book cover (colored background)
  - Title, Author
  - ISBN, Publication year, Pages
  - Full description & author biography
  - Genre tags (clickable to filter)
  - Subject tags (e.g., "Classics", "Magic")
  - Average rating (0-5 stars)
  - User reviews & ratings
  - Stock status (Available / Borrowed)

**Actions on book available:**
```
[Borrow This Book]
└─ Creates borrow request
└─ Goes to admin for approval
```

**Similar Books Section:**
```
You Might Also Like (4 books)
- The Casual Vacancy
- Brilliant Creatures
- The Casual Vacancy
...
[See All Similar Books]
```

### Borrow Management

#### Request to Borrow
- **How:**
  1. Go to Catalog
  2. Search/find book
  3. Click book → BookDetails page
  4. Click [Borrow This Book]
  5. Confirm action
  6. Status: "Request Submitted"
- **What happens:**
  - Creates borrow_request (pending)
  - Admin reviews & approves
  - Can take 1-3 days (admin review time)
  - Student notified when approved
- **Limit:** No explicit limit (depends on library policy)

#### Active Loans
- **URL:** `/main/my-books`
- **Shows all currently borrowed books:**
  - Title, Author, ISBN
  - Borrow date
  - Due date
  - Days remaining (color-coded)
    - Green: >7 days
    - Yellow: 3-7 days
    - Red: <3 days (due soon)
  - Fine amount (if overdue)
  - [Request Return] button

#### Request to Return
- **How:**
  1. Go to "My Books"
  2. Find book in active loans
  3. Click [Request Return]
  4. Admin confirms receipt
- **What happens:**
  - Creates return_request
  - Admin checks if late
  - If late: Fine calculated (per day)
  - Book marked "Available"
  - Removed from student's active loans

#### Transaction History
- **URL:** `/main/student-transactions`
- **Shows:**
  - All past transactions (borrow, return)
  - Loan duration
  - Return date
  - Fine amount (if late)
  - Status (Completed, Declined)
- **Filter by:**
  - Type (Borrow, Return)
  - Status (Completed, Cancelled)
  - Date range
- **Export:** (Optional) Download as CSV

### Recommendations

#### Personalized Recommendations
- **Algorithm:** Content-based filtering (TF-IDF) + Collaborative filtering
- **Based on:**
  - Books you've read (reading history)
  - Genres you prefer
  - Books similar users borrowed
- **Updates:** Real-time (every dashboard view)
- **Accuracy:** ~80-85% (AI continuously learns)

#### How Recommendations Work
```
System analyzes:
1. Your reading history
2. Genres & tags of books you read
3. Similar users' preferences
4. Latest popular books

Calculates match score (0-1):
- 1.0 = Perfect match
- 0.5 = Moderate match
- 0.0 = No match

Ranks top 6 & displays
```

#### Similar Books
- **URL:** `/main/books/:bookId`
- **Shows:** 4 most similar books to current book
- **Similarity based on:**
  - Genre overlap
  - Author style
  - Reader demographics
  - Collaborative patterns

### Ratings & Reviews (Optional)

#### Rate a Book
- **How:**
  1. Go to BookDetails page
  2. Scroll to "Ratings" section
  3. Click stars (1-5)
  4. Optional: Write review
  5. Click [Submit]
- **Vote:** Help other students (thumbs up/down on reviews)

#### View Ratings
- **Show:** All user ratings & reviews for book
- **Sort by:** Newest, Helpful, Highest-rated

### Profile Management

#### My Profile
- **URL:** `/main/profile` (optional)
- **Shows:**
  - Full name, email, student ID
  - Account created date
  - Return rate % (how often you return on-time)
  - Current fines balance
  - [Edit Profile] (name, email)
  - [Change Password]

#### Pay Fines (Optional)
- **URL:** `/main/fines`
- **Shows:**
  - List of outstanding fines
  - Fine amount per book
  - Due date
  - [Pay Now] button (if payment gateway integrated)
- **Methods:** Credit card, university account, cash (if admin interface)

---

## Admin Features

### Admin Dashboard

#### Dashboard Overview
- **URL:** `/main/admin/dashboard`
- **Real-time metrics:**

**Key Performance Indicators:**
```
Total Books: 500
  Available: 320 (64%)
  Borrowed: 180 (36%)

Active Users: 2,500
  Students: 2,480
  Admins: 20

Transactions (all-time):
  Total: 8,900
  Borrows: 4,200
  Returns: 4,100
  Overdue: 400

Pending Requests: 45
  Borrow: 30
  Return: 15
```

**Risk Alerts:**
```
Overdue Risk: 8 high-risk loans
  - Last 24h new alerts: 3
  - Auto-email reminders sent
```

**Genre Distribution Chart:**
```
Fantasy: 120 books (24%)
Sci-Fi: 95 books (19%)
Romance: 85 books (17%)
History: 72 books (14%)
Mystery: 78 books (16%)
...
```

**Recent Activity Timeline:**
```
May 28 15:45 - John Doe requested "1984"
May 28 15:30 - Admin approved 12 requests
May 28 15:00 - Jane Smith returned "Harry Potter"
May 28 14:45 - Book "The Hobbit" marked overdue (3 days late)
...
```

### Book Management

#### View All Books
- **URL:** `/main/admin/catalog`
- **Table columns:**
  - ISBN, Title, Author
  - Genre, Tags
  - Rating, Total reads
  - Status (Available/Borrowed)
  - Stock count
- **Filters:**
  - Genre, Status, Year
  - Books with low/no ratings
  - Recently added
- **Actions per book:**
  - [Edit] → Modify metadata
  - [Delete] → Remove from catalog
  - [View Details] → Full info

#### Add New Book
- **URL:** `/main/admin/books/new`
- **Form fields:**
  - ISBN, Title, Author
  - Year published, Pages
  - Description, Author biography
  - Genres (multi-select)
  - Tags (multi-select)
  - Background color (for UI)
  - Initial status (Available/Archived)
- **Validation:**
  - ISBN must be unique
  - Title required
  - Author required
- **Result:** Book added immediately (searchable)

#### Edit Book
- **URL:** `/main/admin/books/:id/edit`
- **Can modify:**
  - All metadata (description, author bio, etc.)
  - Genres & tags
  - Status (Available → Archived → Available)
  - Color
- **Cannot change:**
  - ISBN (unique identifier)
  - Historical read count

#### Bulk Import Books
- **Feature:** (Optional) Import CSV file
- **CSV format:**
  ```
  ISBN,Title,Author,Year,Pages,Description,Genres,Tags
  978-0747532699,Harry Potter,J.K. Rowling,1997,309,...,Fantasy|Adventure,Magic|Classics
  ...
  ```
- **Process:** Upload → Validate → Import → Success notification

### Request Management

#### View Pending Requests
- **URL:** `/main/admin/requests`
- **Shows all pending:**
  - Borrow requests (students want to borrow)
  - Return requests (students want to return)

**Borrow Request Table:**
```
│ Student Name    │ Book Title           │ Requested │ Actions        │
├─────────────────┼─────────────────────┼───────────┼────────────────┤
│ John Doe        │ 1984                 │ 2 hrs ago │ [Approve] [Decline]
│ Jane Smith      │ Harry Potter         │ 5 hrs ago │ [Approve] [Decline]
│ Alice Johnson   │ The Hobbit           │ 1 day ago │ [Approve] [Decline]
```

#### Approve Borrow Request
- **How:**
  1. Go to Pending Requests
  2. Click [Approve] on request
  3. Set due date (default: 30 days from now)
  4. Click [Confirm]
- **Effect:**
  - Status changes: pending → approved
  - New borrow transaction created
  - Book status: Available → Borrowed
  - Student notified
  - Book removed from available inventory

#### Decline Borrow Request
- **How:**
  1. Click [Decline]
  2. Optional: Add reason
  3. Click [Confirm]
- **Effect:**
  - Request status: pending → declined
  - Student receives notification
  - Book remains available
  - Student can request again

#### Approve Return Request
- **How:**
  1. Go to Pending Requests → Return tab
  2. Click [Approve] on return request
  3. System checks if late
  4. If late: Auto-calculates fine
  5. Click [Confirm]
- **Effect:**
  - Return transaction marked completed
  - Book status: Borrowed → Available
  - Fine added to student account (if late)
  - Student notified

### Transaction Management

#### View All Transactions
- **URL:** `/main/admin/transactions`
- **Filter by:**
  - Type (Borrow Request, Borrow, Return Request, Return, Overdue)
  - Status (Pending, Approved, Declined, Completed, Cancelled)
  - User
  - Date range
  - Book

**Transaction Details:**
```
Transaction ID: tx-123
Type: Borrow
Status: Completed
Book: Harry Potter
Student: John Doe (ST2024001)
Borrowed: May 20, 2026
Due Date: Jun 20, 2026
Returned: Jun 18, 2026 (2 days early!)
Fine: $0.00
```

#### Cancel Transaction
- **Scenarios:**
  - Student never completes request
  - Book lost
  - Administrative error
- **How:** Click [Cancel] → Confirm
- **Effect:** Transaction marked cancelled, reversions made if needed

### User Management

#### View All Students
- **URL:** `/main/admin/users`
- **Table columns:**
  - Student ID, Name, Email
  - Join date
  - Books borrowed (current)
  - Return rate (%)
  - Fines ($)
  - Status (Active/Inactive)
- **Filters:**
  - Return rate (high-risk: <60%)
  - Outstanding fines (>$10)
  - Inactive (no activity >6 months)
  - Joined date range

**Student Profile Card:**
```
Name: John Doe
Student ID: ST2024001
Email: john@university.edu
Books Currently Borrowed: 2
  - Harry Potter (Due Jun 28)
  - 1984 (Due Jun 20)
Return Rate: 95% (19/20 on-time)
Outstanding Fines: $0.00
Account Status: Active
Created: Jan 15, 2026
Last Activity: Today
```

#### Manage Student Account
- **Actions:**
  - [View Details] → Full profile + history
  - [Suspend Account] → Prevent further requests
  - [Delete Account] → Remove user (archive data)
  - [Reset Password] → Generate temp password
- **Audit trail:** All admin actions logged

#### Add New Admin
- **URL:** `/main/admin/users/add-admin`
- **Form:**
  - Name, Email, Temporary Password
  - Permissions (all admin features)
- **Effect:** New admin account created, can login immediately

### Analytics & Reports

#### Analytics Dashboard
- **URL:** `/main/admin/analytics`
- **Sections:**

**Genre Analytics:**
```
Top 5 Most Borrowed Genres:
1. Fantasy: 1,250 borrows (18%)
2. Sci-Fi: 980 borrows (14%)
3. Mystery: 860 borrows (12%)
4. History: 720 borrows (10%)
5. Romance: 680 borrows (10%)
```

**User Behavior:**
```
Average Return Rate: 92%
Most Active Students: [list]
High-Risk Students: [those with return_rate <70%]
Students with Overdue Books: 12
```

**Time Series:**
```
Books Borrowed/Week: [line chart]
User Growth: [line chart]
Genre Popularity Over Time: [stacked area]
```

#### Custom Reports
- **Export options:**
  - PDF: Print-friendly
  - CSV: Excel-compatible
  - JSON: API-compatible
- **Report types:**
  - Monthly usage report
  - Student performance (by return rate)
  - Genre popularity
  - Financial (fines collected)

### AI-Powered Recommendations

#### Overdue Risk Predictions
- **URL:** `/main/admin/predictions`
- **Shows:** All active loans ranked by overdue risk

**Risk Table:**
```
│ Rank │ Student      │ Book           │ Due Date  │ Risk  │ Risk Tier    │
├──────┼──────────────┼────────────────┼───────────┼───────┼──────────────┤
│ 1    │ Jane Smith   │ 1984           │ May 30    │ 0.92  │ HIGH RISK    │
│ 2    │ Bob Johnson  │ Brave New Word │ Jun 02    │ 0.78  │ HIGH RISK    │
│ 3    │ Alice Brown  │ Station Eleven │ Jun 05    │ 0.65  │ MEDIUM RISK  │
│ 4    │ David Lee    │ Beloved        │ Jun 10    │ 0.42  │ LOW RISK     │
│ 5    │ Emma Wilson  │ Dune           │ Jun 15    │ 0.28  │ LOW RISK     │
```

**Risk Factors:**
```
Jane Smith - 1984 (HIGH RISK 92%):
- Days remaining: 2
- User return rate: 75% (below average)
- Past overdue incidents: 2
- Current books borrowed: 3
- Loan duration: 30 days (long)

→ Suggested action: Send email reminder
```

#### Top Recommendations (System-Generated)
- **For each student:** What books should library recommend?
- **Use case:** Email campaigns, personalized promotions
- **Data shown:**
  - Student name
  - Top 3 recommendations
  - Confidence score (0-1)

### Fine Management

#### View All Fines
- **URL:** `/main/admin/fines`
- **Shows:**
  - Student name, amount due
  - Due date, book (if from overdue)
  - Status (Unpaid, Paid)
  - Payment date (if paid)
- **Total collected:** YTD fine revenue
- **Outstanding:** Total unpaid fines

**Fine Details:**
```
Student: John Doe
Book: 1984
Due Date: Jun 20, 2026
Returned: Jun 25, 2026 (5 days late)
Fine: $2.50 (5 days × $0.50/day)
Status: Paid (Jun 26)
```

#### Configure Fine Rates
- **URL:** `/main/admin/settings/fines`
- **Settings:**
  - Fine per day: $0.50 (default)
  - Max fine per book: $10.00
  - Grace period (days before fine applies): 0
- **Effect:** Applied to future overdue books only

#### Record Manual Payment
- **How:**
  1. Find student with outstanding fines
  2. Click [Record Payment]
  3. Enter amount, payment method
  4. Click [Confirm]
- **Methods:** Cash, Check, Credit Card (if integrated)
- **Receipt:** Auto-generated & timestamped

#### Forgive Fine (Optional)
- **How:** Click [Forgive] on fine
- **Requires:** Reason (e.g., "System error", "Goodwill")
- **Audit:** Logged with admin name & timestamp

### Settings & Configuration

#### Library Settings
- **URL:** `/main/admin/settings`
- **Configurable:**
  - Library name, location
  - Operating hours
  - Email templates (request approved, overdue reminder, etc.)
  - Fine per day amount
  - Loan period (days)
  - Max concurrent borrows per student

#### User Roles & Permissions (Optional)
- **Admin role:** Full access (current)
- **Librarian role:** Books + transactions only (future)
- **Assistant role:** Read-only access (future)

#### Audit Logs
- **View:** All admin actions
  - Who (admin name)
  - What (action taken)
  - When (timestamp)
  - Where (module)
- **Example logs:**
  ```
  Admin: Sarah Chen | Action: Approved borrow request tx-123 | Time: 2026-05-28 15:30:00
  Admin: Mike Davis | Action: Added book ISBN-978... | Time: 2026-05-28 15:25:00
  Admin: Sarah Chen | Action: Declined return request tx-125 | Time: 2026-05-28 15:20:00
  ```

---

## Feature Comparison

### Access Matrix

| Feature | Student | Admin |
|---------|---------|-------|
| **Authentication** | | |
| Register | ✅ | ❌ |
| Login | ✅ | ✅ |
| Logout | ✅ | ✅ |
| **Catalog** | | |
| Search books | ✅ | ✅ |
| Filter by genre | ✅ | ✅ |
| View details | ✅ | ✅ |
| Add book | ❌ | ✅ |
| Edit book | ❌ | ✅ |
| Delete book | ❌ | ✅ |
| **Borrowing** | | |
| Request borrow | ✅ | ❌ |
| View active loans | ✅ | ✅ |
| Request return | ✅ | ❌ |
| **Admin Approvals** | | |
| View pending requests | ❌ | ✅ |
| Approve request | ❌ | ✅ |
| Decline request | ❌ | ✅ |
| **Analytics** | | |
| View dashboard | ✅ | ✅ |
| View predictions | ❌ | ✅ |
| Generate reports | ❌ | ✅ |
| **Recommendations** | | |
| View recommendations | ✅ | ❌ |
| View similar books | ✅ | ✅ |
| **User Management** | | |
| View own profile | ✅ | ✅ |
| View all users | ❌ | ✅ |
| Manage users | ❌ | ✅ |
| **Settings** | | |
| Change password | ✅ | ✅ |
| Configure system | ❌ | ✅ |

### Feature Availability

| Feature | Status | Notes |
|---------|--------|-------|
| Book Search | ✅ Live | FULLTEXT index for fast search |
| Recommendations | ✅ Live | AI-powered, updates real-time |
| Overdue Predictions | ✅ Live | Logistic regression model |
| Student Dashboard | ✅ Live | Real-time loan status |
| Admin Dashboard | ✅ Live | KPI cards + predictions |
| Email Notifications | 🚧 In Dev | Automated approval/reminder emails |
| Payment Gateway | 🚧 In Dev | Online fine payment |
| Mobile App | 🚧 Planned | React Native (Q3 2026) |
| LDAP/SSO | 🚧 Planned | University authentication |
| Multi-campus | 🚧 Planned | Support multiple branches |

---

## Quick Start Guides

### For Students

**First Time:**
1. Go to `/register`
2. Create account with email & password
3. You're logged in! → Dashboard
4. Go to `/catalog` → Search for books
5. Click book → [Borrow This Book]
6. Wait for admin approval (1-3 days)
7. Notified when approved
8. Book appears in "My Books" on dashboard

**Return a Book:**
1. Go to `/main/my-books`
2. Find book in "Active Loans"
3. Click [Request Return]
4. Admin confirms → Book marked returned
5. If on-time: No fine
6. If late: Fine charged (depends on days late)

**Get Recommendations:**
1. Go to Dashboard
2. Scroll to "Recommended For You"
3. AI suggests 6 books based on your history
4. Click book → [Borrow]

### For Admins

**Approve Requests:**
1. Go to Dashboard
2. See "12 pending requests" card
3. Click [Pending Requests]
4. For each: Click [Approve] + Set due date + [Confirm]
5. Student gets notified

**Check Risk Predictions:**
1. Go to Dashboard
2. Scroll to "Overdue Risk"
3. See high-risk loans
4. Click to view student details
5. Consider sending reminder email

**Add a Book:**
1. Go to `/admin/books/new`
2. Fill form (ISBN, Title, Author, etc.)
3. Add genres (Fantasy, etc.)
4. Add tags (Classics, etc.)
5. Click [Save]
6. Book instantly searchable

---

## Keyboard Shortcuts (Optional)

| Shortcut | Action |
|----------|--------|
| `Ctrl+K` | Open search modal |
| `Ctrl+/` | Show shortcuts help |
| `Esc` | Close modal/menu |
| `/` | Jump to search (focus) |

---

## Accessibility Features

- ✅ Keyboard navigation (all buttons accessible via Tab)
- ✅ Screen reader support (ARIA labels)
- ✅ High contrast mode (optional)
- ✅ Responsive design (mobile, tablet, desktop)
- ✅ Text size adjustment (browser zoom)

---

## Support & Help

- **In-app help:** Hover over info icons (ℹ️) for tooltips
- **FAQ:** (Optional) `/help` page
- **Contact:** Support form in footer → Email to library@university.edu
- **Status page:** (Optional) Check system status at status.library.edu

---

**Document Version:** 1.0  
**Last Updated:** May 28, 2026  
**Status:** Quick Reference Guide

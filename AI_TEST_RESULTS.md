# AI Model Evaluation Report

**System:** Books Repository — Intelligent Library Management  
**Generated:** Thursday, May 28, 2026 · 9:23:00 AM  
**Database:** Live evaluation against real transaction data  

---

## Table of Contents

1. [Executive Summary](#1-executive-summary)
2. [Overdue Return Predictor](#2-overdue-return-predictor)
   - [Data Split](#data-split-5-fold-cross-validation)
   - [Performance Metrics](#21-performance-metrics)
   - [Confusion Matrix](#22-confusion-matrix)
   - [Feature Importance](#23-feature-importance)
   - [Live Risk Predictions](#24-live-risk-predictions)
3. [Book Recommendation Engine](#3-book-recommendation-engine)
   - [Data Split](#data-split-leave-one-out-cross-validation)
   - [Performance Metrics](#31-performance-metrics)
   - [Sample Recommendations](#32-sample-recommendations)
4. [System Architecture](#4-system-architecture)
5. [Alignment with Intelligent Systems Curriculum](#5-alignment-with-intelligent-systems-curriculum)

---

## 1. Executive Summary

The library system integrates two AI models that learn from real borrowing data:

| Model | Algorithm | Training Samples | Key Metric |
|---|---|---|---|
| Overdue Return Predictor | Logistic Regression | 50 completed loans | Accuracy: **96.0%** |
| Book Recommendation Engine | Hybrid TF-IDF + Collaborative Filtering | 11 users | Precision@5: **90.9%** |

### Overall Model Health

| | Overdue Predictor | Recommendation Engine |
|---|---|---|
| Accuracy / Precision@K | 🟢 96.0% | 🟢 90.9% |
| F1 Score | 🟢 95.5% | 🟢 90.9% |
| AUC-ROC / Coverage | 🟢 100.0% | 🟢 85.7% |

---

## 2. Overdue Return Predictor

> **What it does:** Predicts which borrowed books are at risk of being returned late, enabling librarians to follow up proactively before fines accumulate.

**Algorithm:** Binary Logistic Regression  
**Training method:** Gradient descent (800 epochs, learning rate 0.05, L2 regularization λ=0.01)  
**Evaluation method:** 5-Fold Cross-Validation  
**Training samples:** 50 completed loan transactions  

### Class Distribution

| Class | Count | Percentage |
|---|---|---|
| On-time returns | 27 | 54.0% |
| Overdue returns | 23 | 46.0% |
| **Total** | **50** | **100%** |

### Data Split (5-Fold Cross-Validation)

| | Count | Percentage |
|---|---|---|
| Total dataset | **50** loans | 100% |
| Training set per fold (avg) | **40** loans | 80.0% |
| Validation set per fold (avg) | **10** loans | 20.0% |
| Last fold validation set | **10** loans | 20.0% |

> Each fold trains on 40 samples and tests on 10–10 unseen samples. This is repeated 5 times so every sample is used for testing exactly once.

```
Fold breakdown:
  Fold 1: Train = 40 samples | Validate = 10 samples (rows 1–10)
  Fold 2: Train = 40 samples | Validate = 10 samples (rows 11–20)
  Fold 3: Train = 40 samples | Validate = 10 samples (rows 21–30)
  Fold 4: Train = 40 samples | Validate = 10 samples (rows 31–40)
  Fold 5: Train = 40 samples | Validate = 10 samples (rows 41–50)
```

### 2.1 Performance Metrics

| Metric | Score | Bar | Interpretation |
|---|---|---|---|
| 🟢 **Accuracy**  | **96.0%**  | `███████████████████░`  | Overall correct predictions out of all predictions made |
| 🟢 **Precision** | **100.0%** | `████████████████████` | When the model flags a loan as overdue, how often it is correct |
| 🟢 **Recall**    | **91.3%**    | `██████████████████░░`    | Of all loans that were actually overdue, how many were caught |
| 🟢 **F1 Score**  | **95.5%**        | `███████████████████░`        | Harmonic mean of precision and recall |
| 🟢 **AUC-ROC**   | **100.0%**       | `████████████████████`       | Overall discrimination ability (0.5 = random, 1.0 = perfect) |

**Interpretation:** The model achieves excellent accuracy, correctly classifying 96.0% of all loans. Perfect precision means zero false alarms — every overdue alert is genuine. High recall means the model catches the vast majority of overdue cases before they escalate. 

### 2.2 Confusion Matrix

|  | **Predicted: Overdue** | **Predicted: On-Time** |
|---|---|---|
| **Actual: Overdue** | ✅ True Positive: **21** (42.0%) | ❌ False Negative: **2** (4.0%) |
| **Actual: On-Time** | ❌ False Positive: **0** (0.0%) | ✅ True Negative: **27** (54.0%) |

- **True Positive (21):** Correctly predicted as overdue — librarian can act early
- **True Negative (27):** Correctly predicted as on-time — no unnecessary follow-up
- **False Positive (0):** Predicted overdue but returned on time — unnecessary alert
- **False Negative (2):** Missed overdue prediction — returned late without warning

### 2.3 Feature Importance

The model uses 5 input signals to compute the overdue probability:

| Rank | Feature | Weight | Influence | Direction |
|---|---|---|---|---|
| 1 | Days Remaining (normalized) | `-2.8755` | `███████████████` 100.0% | ↓ Reduces overdue risk |
| 2 | User Return Rate | `-1.2244` | `██████░░░░░░░░░` 42.6% | ↓ Reduces overdue risk |
| 3 | Prior Overdue Count | `+1.0368` | `█████░░░░░░░░░░` 36.1% | ↑ Increases overdue risk |
| 4 | Active Loans Count | `-0.2255` | `█░░░░░░░░░░░░░░` 7.8% | ↓ Reduces overdue risk |
| 5 | Loan Duration | `-0.1088` | `█░░░░░░░░░░░░░░` 3.8% | ↓ Reduces overdue risk |

> **Model weights:** `[-2.8755, -1.2244, 1.0368, -0.1088, -0.2255]` · Bias: `-0.2973`

### 2.4 Live Risk Predictions

Current risk assessment for all active loans as of report generation:

| Risk | Borrower | Student ID | Due Date | Days | Score | Return Rate |
|---|---|---|---|---|---|---|
| 🔴 high risk | Mark Aquino | ST2025008 | Mon Apr 27 2026 08:00:00 GM | **31d overdue** | 84% | 0% |
| 🔴 high risk | Carlos Dela Cruz | ST2025004 |  | **21d overdue** | 69% | 0% |
| 🔴 high risk | Jose Reyes | ST2025002 |  | **16d overdue** | 67% | 20% |
| 🟢 low risk | Dennis Ramos | ST2025010 | Fri May 29 2026 08:00:00 GM | 1d remaining | 20% | 60% |
| 🟢 low risk | Ramon Bautista | ST2025006 | Mon Jun 01 2026 08:00:00 GM | 4d remaining | 16% | 60% |
| 🟢 low risk | Cynthia Flores | ST2025009 | Sat Jun 06 2026 08:00:00 GM | 9d remaining | 10% | 60% |
| 🟢 low risk | Grace Villanueva | ST2025007 |  | 14d remaining | 5% | 80% |
| 🟢 low risk | Maria Santos | ST2025001 |  | 19d remaining | 3% | 100% |
| 🟢 low risk | Ana Cruz | ST2025003 | Sun Jun 21 2026 08:00:00 GM | 24d remaining | 2% | 80% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Liza Mendoza | ST2025005 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |
| 🟢 low risk | Lord Byron Dizon | 201610090 | Fri Jun 26 2026 08:00:00 GM | 29d remaining | 1% | 100% |

**Summary:** 🔴 3 high risk · 🟡 0 medium risk · 🟢 15 low risk

---

## 3. Book Recommendation Engine

> **What it does:** Suggests books each student is likely to enjoy, based on their reading history and the preferences of similar readers.

**Algorithm:** Hybrid Content-Based Filtering (TF-IDF) + Collaborative Filtering (Jaccard similarity)  
**Evaluation method:** Leave-One-Out Cross-Validation (K=5)  
**Users evaluated:** 11 (users with ≥2 books in reading history)  
**Catalog coverage:** 18 of 21 books recommended (85.7%)  

### Data Split (Leave-One-Out Cross-Validation)

| | Count |
|---|---|
| Total users with reading history | **11** |
| Users eligible for evaluation (≥2 books) | **11** |
| Cold-start users (< 2 books, excluded from eval) | **0** |
| Total books in catalog | **21** |
| Books appearing in recommendations | **18** |

> **Leave-one-out method:** For each eligible user, the most recently read book is hidden. The engine recommends top-5 books using the remaining history. A "hit" is recorded if the hidden book appears in the top-5. This simulates real-world prediction of the next book a user will want.

```
Per evaluation run:
  Training (user profile built from): N-1 books per user
  Test (held-out book):               1 book per user
  Candidate pool (books to rank):     All available books minus training set
  Evaluation runs total:              11
  Successful hits (book in top-5):  10
```

### 3.1 Performance Metrics

| Metric | Score | Bar | Interpretation |
|---|---|---|---|
| 🟢 **Precision@5** | **90.9%** | `██████████████████░░` | Of top-5 recommendations, how often the held-out book appeared |
| 🟢 **Recall@5**    | **90.9%**    | `██████████████████░░`    | Fraction of relevant books found in top-5 |
| 🟢 **F1@5**        | **90.9%**        | `██████████████████░░`        | Harmonic mean of precision and recall |
| 🟢 **Catalog Coverage** | **85.7%** | `█████████████████░░░` | Fraction of total catalog that appears in at least one recommendation list |
| 🟢 **Mean Similarity** | **0.3247** | `██████░░░░░░░░░░░░░░` | Average cosine similarity score of recommended items |

**Evaluation details:** 10 correct predictions out of 11 leave-one-out tests

### 3.2 Sample Recommendations

Personalized recommendations generated for demo users:

#### Maria Santos — *Fantasy / Magical Realism*

| Rank | Book | Author | Score | Reason |
|---|---|---|---|---|
| 1 | Love in the Time of Cholera | Gabriel García Márquez | `0.385` | Based on your reading history |
| 2 | Pride and Prejudice | Jane Austen | `0.0187` | You might enjoy this |
| 3 | Murder on the Orient Express | Agatha Christie | `0` | You might enjoy this |

#### Ana Cruz — *Romance / Classic*

| Rank | Book | Author | Score | Reason |
|---|---|---|---|---|
| 1 | One Hundred Years of Solitude | Gabriel García Márquez | `0.3244` | Based on your reading history |
| 2 | Kafka on the Shore | Haruki Murakami | `0.2494` | You might enjoy this |
| 3 | Murder on the Orient Express | Agatha Christie | `0.1652` | You might enjoy this |
| 4 | Harry Potter and the Sorcerer's Stone | J.K. Rowling | `0.0187` | You might enjoy this |

#### Grace Villanueva — *Mystery / Thriller*

| Rank | Book | Author | Score | Reason |
|---|---|---|---|---|
| 1 | Love in the Time of Cholera | Gabriel García Márquez | `0.1835` | Popular with similar readers |
| 2 | Pride and Prejudice | Jane Austen | `0.1776` | You might enjoy this |
| 3 | One Hundred Years of Solitude | Gabriel García Márquez | `0.1691` | You might enjoy this |
| 4 | Kafka on the Shore | Haruki Murakami | `0.1316` | You might enjoy this |

#### Jose Reyes — *Dystopian / Sci-Fi*

| Rank | Book | Author | Score | Reason |
|---|---|---|---|---|
| 1 | Pride and Prejudice | Jane Austen | `0.0971` | You might enjoy this |
| 2 | Harry Potter and the Sorcerer's Stone | J.K. Rowling | `0.0327` | You might enjoy this |
| 3 | Kafka on the Shore | Haruki Murakami | `0` | You might enjoy this |
| 4 | Murder on the Orient Express | Agatha Christie | `0` | You might enjoy this |

---

## 4. System Architecture

```
Library System — AI Component Architecture

┌─────────────────────────────────────────────────────────┐
│                    INPUT MODULE                         │
│  MySQL Database: transactions, reading_history, users   │
└──────────────────────┬──────────────────────────────────┘
                       │
          ┌────────────┴────────────┐
          ▼                         ▼
┌─────────────────┐     ┌───────────────────────┐
│  LEARNING MODULE │     │    LEARNING MODULE    │
│  TF-IDF Vectors  │     │  Logistic Regression  │
│  User Profiles   │     │  Gradient Descent     │
│  CF Similarity   │     │  L2 Regularization    │
└────────┬─────────┘     └──────────┬────────────┘
         │                           │
         ▼                           ▼
┌─────────────────┐     ┌───────────────────────┐
│  INFERENCE ENGINE│     │   INFERENCE ENGINE    │
│  Cosine Similarity│    │   σ(w·x + b)          │
│  Ranked Results  │     │   Risk Score 0-100%   │
└────────┬─────────┘     └──────────┬────────────┘
         │                           │
         └────────────┬──────────────┘
                      ▼
┌─────────────────────────────────────────────────────────┐
│                   OUTPUT MODULE                         │
│  Dashboard · Borrower Profiles · Analytics Page         │
│  Chatbot · Book Detail Pages                            │
└─────────────────────────────────────────────────────────┘
```

---

## 5. Alignment with Intelligent Systems Curriculum

| Lesson | Topic | Implementation in This System |
|---|---|---|
| Lesson 10 | Uncertainty Handling / Probabilistic Reasoning | Overdue model outputs P(overdue) — a probability, not a hard yes/no |
| Lesson 11 | Learning Paradigms | Overdue = **Supervised Learning** (labeled data); Recommendations = **Unsupervised** pattern discovery |
| Lesson 12 | Supervised Learning Workflow | Data prep → Training (gradient descent) → Testing (k-fold CV) → Evaluation metrics |
| Lesson 13 | Unsupervised / Clustering | CF component clusters users by Jaccard similarity of reading patterns |
| Lesson 14 | Intelligent System Architecture | Input Module (DB) → Learning Module → Inference Engine → Working Memory (cache) → Output Module |
| Lesson 15 | Testing & Evaluation | Leave-one-out CV for recommendations; k-fold CV for overdue model; confusion matrix; AUC-ROC |
| Lesson 16 | Ethics | Bcrypt encryption, JWT auth, RBAC, transparent AI explanations, bias detection (single-class warning) |

---

*Report generated automatically by `node db/generate-report.js`*

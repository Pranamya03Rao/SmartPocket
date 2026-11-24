# API Endpoints Reference

All endpoints are prefixed with `/api`. Cookie authentication uses `httpOnly` `refreshToken` and double-submit `csrf-token`.

## Authentication (`/api/auth`)

| Method | Path | Auth | CSRF | Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/auth/register` | No | No | `{ name, email, password, profile }` | `{ message, user }` (201) |
| `POST` | `/auth/verify-email` | No | No | `{ token }` | `{ message }` (200) |
| `POST` | `/auth/login` | No | No | `{ email, password, otp? }` | `{ accessToken, user }` or `{ requires2FA: true }` |
| `POST` | `/auth/refresh` | Cookie | No | Empty | `{ accessToken, user }` |
| `POST` | `/auth/logout` | No | No | Empty | `{ message }` |
| `POST` | `/auth/logout-all` | Bearer | Yes | Empty | `{ message }` |
| `POST` | `/auth/forgot-password` | No | No | `{ email }` | `{ message }` |
| `POST` | `/auth/reset-password` | No | No | `{ token, password }` | `{ message }` |
| `GET` | `/auth/me` | Bearer | No | None | `{ user }` |
| `PATCH`| `/auth/profile` | Bearer | Yes | `{ name?, course?, year?, monthlyAllowance?, twoFactorEnabled? }` | `{ message, user }` |
| `POST` | `/auth/change-password` | Bearer | Yes | `{ currentPassword, newPassword }` | `{ message }` |
| `GET` | `/auth/export-my-data` | Bearer | No | None | File download: JSON |
| `DELETE`| `/auth/account` | Bearer | Yes | None | `{ message }` |

---

## Transactions (`/api/transactions`)

| Method | Path | Auth | CSRF | Query / Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/transactions` | Bearer | No | Query: `page, limit, search, category, type, sortBy, sortOrder` | `{ transactions, pagination }` |
| `POST` | `/transactions` | Bearer | Yes | `{ date, merchant, amount, type, category, paymentMode?, notes?, recurring? }` | `{ message, transaction }` (201) |
| `GET` | `/transactions/export/csv` | Bearer | No | None | File download: CSV |
| `GET` | `/transactions/:id` | Bearer | No | None | `{ transaction }` |
| `PATCH`| `/transactions/:id` | Bearer | Yes | Partial transaction fields | `{ message, transaction }` |
| `DELETE`| `/transactions/:id` | Bearer | Yes | None | `{ message }` |

---

## AI Upload Pipeline (`/api/uploads`)

| Method | Path | Auth | CSRF | Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/uploads/analyze` | Bearer | No | `multipart/form-data` with `file` (max 10MB) | `{ message, source, transactions: [ { ...row, isDuplicate, selected } ] }` (DRAFT) |
| `POST` | `/uploads/confirm` | Bearer | Yes | `{ source, transactions: [ ...selectedRows ] }` | `{ message, insertedCount, skippedCount }` (201) |

---

## Budgets (`/api/budgets`)

| Method | Path | Auth | CSRF | Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `POST` | `/budgets` | Bearer | Yes | `{ period, month, year, totalLimit, categoryLimits: [...] }` | `{ message, budget }` |
| `GET` | `/budgets/current` | Bearer | No | None | `{ budget }` |
| `GET` | `/budgets/templates` | Bearer | No | None | `{ allowance, templates: { hostel, day-scholar, pg } }` |
| `GET` | `/budgets/50-30-20` | Bearer | No | None | `{ totalIncome, rule: { needs, wants, savings } }` |
| `GET` | `/budgets/vs-actual` | Bearer | No | Query: `month?, year?` | `{ totalBudget, totalSpent, remainingBudget, categories }` |

---

## Goals (`/api/goals`)

| Method | Path | Auth | CSRF | Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/goals` | Bearer | No | None | `{ goals }` |
| `POST` | `/goals` | Bearer | Yes | `{ name, target, saved?, deadline }` | `{ message, goal }` (201) |
| `GET` | `/goals/:id` | Bearer | No | None | `{ goal }` |
| `POST` | `/goals/:id/savings` | Bearer | Yes | `{ amount }` | `{ message, goal, newMilestones }` |
| `PATCH`| `/goals/:id` | Bearer | Yes | `{ name?, target?, saved?, deadline? }` | `{ message, goal }` |
| `DELETE`| `/goals/:id` | Bearer | Yes | None | `{ message }` |

---

## Analytics (`/api/analytics`)

| Method | Path | Auth | CSRF | Query / Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/analytics/summary` | Bearer | No | None | `{ income, expense, netSavings, savingsRate }` |
| `GET` | `/analytics/category-split` | Bearer | No | None | `{ totalExpense, categories: [...] }` |
| `GET` | `/analytics/monthly-trend` | Bearer | No | None | `{ trends: [ { month, income, expense } ] }` |
| `GET` | `/analytics/insights` | Bearer | No | None | `{ insights: [...] }` |
| `GET` | `/analytics/forecast` | Bearer | No | None | `{ forecastNextMonthExpense, confidence }` |
| `GET` | `/analytics/health-score` | Bearer | No | None | `{ score, tier }` |
| `GET` | `/analytics/simulate` | Bearer | No | Query: `reduceCategory, percentReduction, extraMonthlySavings` | `{ scenario, estimatedMonthlySaved, estimatedAnnualSavings }` |

---

## Notifications (`/api/notifications`)

| Method | Path | Auth | CSRF | Body | Response |
| :--- | :--- | :--- | :--- | :--- | :--- |
| `GET` | `/notifications` | Bearer | No | None | `{ notifications, unreadCount }` |
| `PATCH`| `/notifications/:id/read` | Bearer | Yes | None | `{ message, notification }` |
| `POST` | `/notifications/mark-all-read` | Bearer | Yes | None | `{ message }` |
| `DELETE`| `/notifications/:id` | Bearer | Yes | None | `{ message }` |

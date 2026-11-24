# Remaining Features Checklist (Handoff to Next Model)

The foundational security architecture, database models, auth flows, transaction engine, and Gemini AI receipt/statement upload pipeline are 100% complete and tested. 

Below is the implementation task list for the remaining modules. Follow patterns in `docs/CONVENTIONS.md`.

---

## 1. Dashboard UI (`client/src/pages/Dashboard.jsx`)
- [x] Connect `GET /api/analytics/summary` to render summary cards (Income, Expense, Net Savings, Savings Rate %).
- [x] Render interactive Recharts pie/donut chart using `GET /api/analytics/category-split`.
- [x] Render 6-month historical trend line/bar chart using `GET /api/analytics/monthly-trend`.
- [x] Display month-over-month automated financial insights from `GET /api/analytics/insights`.
- [x] Render 3-month moving average forecast widget from `GET /api/analytics/forecast`.
- [x] Build visual Financial Health Score gauge (0-100) from `GET /api/analytics/health-score`.
- [x] Add interactive sliders for the "What-If" simulator (`GET /api/analytics/simulate`).

---

## 2. Budgets UI (`client/src/pages/Budgets.jsx`)
- [x] Add budget creation form with template selector (Hostel, Day Scholar, PG) fetched from `GET /api/budgets/templates`.
- [x] Display 50/30/20 student budgeting visual card (`GET /api/budgets/50-30-20`).
- [x] Build Budget vs Actual spending comparison view (`GET /api/budgets/vs-actual`) with progress bars and over-budget alert badges.

---

## 3. Savings Goals UI (`client/src/pages/Goals.jsx`)
- [x] Build goal creation modal (target amount, name, target deadline).
- [x] Display goal cards with computed required weekly/monthly savings.
- [x] Show milestone badge achievements (25%, 50%, 75%, 100%).
- [x] Add "+ Add Savings" modal calling `POST /api/goals/:id/savings`.

---

## 4. Financial Literacy Module (`client/src/pages/Learn.jsx`)
- [x] Create `server/models/Lesson.js` and `Quiz.js` (see conventions).
- [x] Seed student banking modules:
  - Banking 101 & UPI Safety in India
  - Credit Cards vs Pay-Later trap
  - Power of Compounding & Early Investing
  - Mutual Funds & SIPs for College Students
- [x] Add quiz progress tracker and student completion certificates.

---

## 5. Group Expenses & Bill Splitting (`client/src/pages/Groups.jsx`)
- [x] Create `server/models/Group.js` and `GroupExpense.js`.
- [x] Implement equal and custom uneven split calculation.
- [x] Add "Who owes whom" debt simplification algorithm.
- [x] Build UPI QR code generator for settling group balances.

---

## 6. Admin Panel (`client/src/pages/Admin.jsx`)
- [x] Render admin metrics: total registered students, daily transactions, active AI scans.
- [x] User management table with role change (`student` <-> `admin`) and account lockout reset.
- [x] Server health and error log monitoring dashboard.

---

## 7. Mobile PWA & Localization
- [ ] Configure `vite-plugin-pwa` with service worker for offline viewing of recent transactions.
- [ ] Implement `i18next` for Hindi, English, and regional Indian language support.

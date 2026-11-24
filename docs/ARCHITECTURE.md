# System Architecture & Technical Decisions

## 1. Directory Structure

```
smart-budget/
├── client/                     # Vite + React + Tailwind frontend
│   ├── src/
│   │   ├── api/client.js       # Axios with CSRF & 401 silent refresh
│   │   ├── components/         # Layout, Navbar, Sidebar, ReceiptUpload, routing guards
│   │   ├── context/            # AuthContext, ThemeContext
│   │   ├── pages/              # Register, Login, Verify, Profile, Transactions, Placeholders
│   │   ├── App.jsx             # React Router hierarchy
│   │   └── main.jsx
│   ├── .env.example
│   ├── package.json
│   └── vite.config.js
├── server/                     # Node.js + Express backend
│   ├── config/                 # Zod validated env, MongoDB connection
│   ├── controllers/            # auth, transaction, budget, goal, analytics, notification, upload
│   ├── cron/                   # node-cron recurring & budget/goal alert scheduler
│   ├── middleware/             # authenticate, authorize, validate, csrf, rateLimiter, errorHandler
│   ├── models/                 # User, RefreshToken, Transaction, MerchantCategory, Budget, Goal, Notification
│   ├── routes/                 # Express routers mounted under /api
│   ├── services/               # geminiService (@google/genai), emailService (nodemailer)
│   ├── tests/                  # vitest suites: auth, idor, upload
│   ├── utils/                  # crypto (AES-256-GCM), fingerprint, AppError, constants
│   ├── app.js                  # Express app setup with Helmet, CORS, Sanitizers
│   ├── server.js               # Cluster/Server boot
│   ├── .env.example
│   └── package.json
├── docs/                       # ARCHITECTURE.md, CONVENTIONS.md, API.md, TODO.md
└── README.md
```

## 2. Core Data Models

- **User**: Name, email, bcrypt hash (cost 12), role (`student` | `admin`), email verification tokens, lockout fields (`failedLoginCount`, `lockUntil`), 2FA OTP state, student academic profile (course, year, monthly allowance, currency).
- **RefreshToken**: Hashed token, family ID (UUID), user ref, expiration, `replacedBy` ref for automatic reuse detection.
- **Transaction**: Scoped by user, date, merchant, amount, type (`income` | `expense`), category, payment mode, `notes` (AES-256-GCM encrypted), `source` (`manual` | `receipt` | `statement`), recurring scheduler, SHA-256 fingerprint index per user.
- **MerchantCategory**: Stores learned category overrides per user based on past confirmations.
- **Budget**: Scoped by user, period (`monthly` | `weekly` | `semester`), month/year, total limit, and category limits array.
- **Goal**: Target amount, saved amount, deadline, milestone badges (25%, 50%, 75%, 100%), and virtual savings targets.
- **Notification**: Alerts generated for due recurring transactions, 90% budget utilization, and milestone achievements.

## 3. Key Decisions & Assumptions

1. **Encryption Key Versioning**: Notes and files use format `v1:{iv_b64}:{authTag_b64}:{ciphertext_b64}` to enable future zero-downtime key rotation.
2. **Duplicate Fingerprinting**: SHA-256 hash of `userId|YYYY-MM-DD|amount|lowercase_merchant` prevents accidental double-counting while preserving legitimate identical spends on different dates.
3. **Draft-Only AI Ingestion**: Neither image receipts nor parsed statements persist automatically. The pipeline presents an interactive review table where duplicates are unchecked by default.
4. **Local CSV Parsing**: CSV bank statements are processed in memory using PapaParse without incurring Gemini LLM costs or token latency.
5. **Prompt Injection Defense**: Gemini prompt explicitly commands the model to treat all document contents as untrusted data and ignore any instructions embedded in receipts.

## 4. Security Measures Implemented

- **Helmet & CSP**: Strict Content Security Policy allowing only trusted script/style/font sources.
- **CORS**: Restricted strictly to `CLIENT_URL` with credentials allowed.
- **Double-Submit CSRF**: Token set in cookie and validated via `X-CSRF-Token` header on state-changing requests.
- **Brute-Force Lockout**: 5 failed consecutive attempts triggers an automatic 15-minute lock.
- **Refresh Token Rotation**: Each refresh invalidates the prior token; detecting a previously rotated token revokes the entire token family.
- **Tenant Isolation (IDOR)**: Every database lookup on resources strictly joins `user: req.user._id`.
- **Payload Guardrails**: JSON body capped at 100kb, Multer memory buffer capped at 10MB, NoSQL injection sanitized via `express-mongo-sanitize`, parameter pollution guarded by `hpp`.
- **Privacy Request Logging**: Access log tracks HTTP method, route, status code, and duration; request bodies, headers, auth tokens, and file buffers are never logged.

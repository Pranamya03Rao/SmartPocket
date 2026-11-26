# Smart Financial Literacy & Budget Planner for Students

MERN-stack application with Gemini AI receipt parsing, bank statement extraction, AES-256 encrypted confidential notes, and automated student budget management.

---

## Setup in 5 Steps

### 1. Prerequisites
Ensure **Node.js (v18+)** and **MongoDB** are installed and running locally.

### 2. Configure Environment Files
Copy the example environment files in both folders:
```bash
cp server/.env.example server/.env
cp client/.env.example client/.env
```
*(Optionally add your `GEMINI_API_KEY` in `server/.env` for live receipt scanning).*

### 3. Install Server Dependencies & Run Tests
```bash
cd server
npm install
npm test
```

### 4. Start Backend Server
```bash
npm run dev
# Running on http://localhost:5000
```

### 5. Install Client Dependencies & Start Web App
In a separate terminal:
```bash
cd client
npm install
npm run dev
# Running on http://localhost:5173
```

---

## Documentation
- [Architecture & Security Decisions](docs/ARCHITECTURE.md)
- [Coding Pattern & Goal Worked Example](docs/CONVENTIONS.md)
- [API Reference](docs/API.md)
- [Handoff Feature Checklist](docs/TODO.md)

---

## Web Push Notifications

### 1. Generating & Configuring VAPID Keys
Generate keys and automatically populate `server/.env` if not already set:
```bash
cd server
npm run generate:vapid
```
New environment variables in `server/.env`:
- `VAPID_PUBLIC_KEY`: Base64URL-encoded public key for browser PushManager subscription.
- `VAPID_PRIVATE_KEY`: Secret key used by the backend to sign Web Push payloads.
- `VAPID_SUBJECT`: Contact URI (e.g., `mailto:admin@smartpocket.org`).

### 2. Push API Endpoints
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/api/push/vapid-public-key` | Public | Returns `{ publicKey }` (never exposes private key). |
| `POST` | `/api/push/subscribe` | Auth | Validates & upserts browser subscription, linked to user (max 10/user). |
| `POST` | `/api/push/unsubscribe` | Auth | Removes subscription matching endpoint belonging to current user. |
| `POST` | `/api/push/test` | Auth | Sends test push to the logged-in user's active devices (rate-limited). |
| `POST` | `/api/push/send` | Admin | Broadcasts or targets push notifications to users. |

### 3. HTTPS, iOS & Hosting Notes
- **HTTPS Requirement:** Web Push requires a secure context (`https://`). `localhost` / `127.0.0.1` are supported for local development.
- **iOS Support:** iOS 16.4+ supports Web Push only when the web app is added to the Home Screen via Safari's Share menu ("Add to Home Screen").
- **Cache Header:** Ensure `sw.js` is served with `Cache-Control: no-cache, no-store, must-revalidate` (or `max-age=0`) on production hosting (e.g., Nginx, Vercel, Netlify) so service worker updates deploy instantly.

### 4. 5-Step Manual Test
1. **Turn on:** Log into the app, navigate to **Profile**, toggle "Notifications on this device" to ON, and click "Allow" on the browser prompt.
2. **Check DB:** In MongoDB `pushsubscriptions` collection, confirm a record exists with your `userId`, `endpoint`, and `keys`.
3. **Send test:** Click the **Send Test Notification** button in Profile and verify the system notification appears.
4. **Close app & trigger:** Close the app tab/browser window. Trigger a notification (e.g., deadline reminder cron, goal milestone, or admin broadcast) and observe the notification appearing even with the app closed.
5. **Click notification:** Click the incoming system push notification and verify it focuses the existing app window or opens directly to the relative target path.


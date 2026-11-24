# Smart Financial Literacy & Budget Planner 

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

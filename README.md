# AtomQuest Portal

AtomQuest Portal is a role-based goal-setting and performance tracking system built for the AtomQuest Hackathon. It supports employee goal creation, manager approval, quarterly check-ins, manager comments, admin oversight, reports, charts, and CSV export.

## Tech Stack

- Frontend: React, Vite, React Router, Axios, Recharts
- Backend: Node.js, Express, MongoDB, Mongoose
- Auth: JWT with role-based route protection

## Key Features

- Employee login, goal creation, editing, deletion, and submission
- Goal rules for minimum weightage and 100% total submission
- Manager review with approve and return-for-rework actions
- Quarterly employee check-ins for Q1, Q2, Q3, and Q4
- Manager comments on quarterly check-ins
- Admin dashboard with goal status stats, charts, reports, CSV export, user list, manager assignment, and goal unlock
- Demo seed data for a ready-to-present walkthrough

## Demo Accounts

Run the seed command first, then use:

| Role | Email | Password |
| --- | --- | --- |
| Admin | admin@atomquest.com | 123456 |
| Manager | manager@atomquest.com | 123456 |
| Employee | employee@atomquest.com | 123456 |
| Employee | priya@atomquest.com | 123456 |

## Setup

Create `backend/.env` with:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

Install dependencies if needed:

```powershell
cd "D:\for downloads\atomquest-portal\backend"
npm install

cd "D:\for downloads\atomquest-portal\frontend"
npm install
```

Seed demo data:

```powershell
cd "D:\for downloads\atomquest-portal\backend"
npm run seed
```

Run backend:

```powershell
cd "D:\for downloads\atomquest-portal\backend"
npm run dev
```

Run frontend in another terminal:

```powershell
cd "D:\for downloads\atomquest-portal\frontend"
npm run dev
```

Open:

```txt
http://localhost:5173
```

## Suggested Demo Flow

1. Login as admin and show charts, reports, users, and seeded goals.
2. Login as employee and show goal sheet plus quarterly check-ins.
3. Login as manager and show approval/rework plus manager comments.
4. Return to admin and show CSV export and goal unlock.

## Verification

Frontend build:

```powershell
cd "D:\for downloads\atomquest-portal\frontend"
npm run build
```

Backend syntax checks:

```powershell
cd "D:\for downloads\atomquest-portal\backend"
node --check server.js
node --check seed.js
node --check routes\goals.js
node --check routes\admin.js
```

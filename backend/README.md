# AtomQuest Backend

Express + MongoDB API for AtomQuest Portal.

## Environment

Create `.env`:

```env
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_secret_key
PORT=5000
```

## Scripts

```powershell
npm run dev
```

Starts the API with nodemon.

```powershell
npm start
```

Starts the API with Node.

```powershell
npm run seed
```

Creates demo users, goals, check-ins, and manager comments.

## Main API Areas

- `/api/auth` - register, login, current user
- `/api/goals` - employee goals, manager approvals, check-ins, admin unlock
- `/api/admin` - users, manager assignment, audit logs, reports

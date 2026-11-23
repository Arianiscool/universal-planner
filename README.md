# Universal Planner

A shared planner for a small group, with account login, shared schedule/tasks/exams/notes, per-user XP and rewards, profile settings, and an administrator dashboard. The app uses MongoDB for shared storage. Refreshing the page loads the latest shared data; live real-time updates are not required.

## Project structure

- `public/` — planner page, styles, and UI.
- `lib/` — browser API helper used by the frontend.
- `backend/` — Express API, authentication, MongoDB storage, admin routes, and XP/rewards routes.

## Requirements

- Node.js 20 or newer
- MongoDB Community Server running locally, or a MongoDB connection URI

## Setup on Windows

1. Make sure MongoDB Community Server is running. MongoDB Compass is only the database viewer; the server must also be running.
2. Open the `backend` folder in File Explorer.
3. Copy `.env.example` to `.env`.
4. Open `.env` and set `SESSION_SECRET` to a long random string (at least 32 characters). Set `ADMIN_EMAIL` to the email address that should receive the first administrator account.
5. Open Command Prompt in the `backend` folder and run:

   ```bash
   npm install
   npm start
   ```

6. Open `http://localhost:3000` in your browser.
7. Register using the email in `ADMIN_EMAIL` first. That account will become the administrator. Other registered accounts are regular members.

## MongoDB settings

The default local connection is:

```text
mongodb://127.0.0.1:27017
```

The database name defaults to `universal_planner`. The application creates its `app_state` collection automatically when it first saves data.

## Important deployment note

For other people to use the planner, deploy the Node backend to a trusted hosting provider and configure a secure MongoDB connection. Do not expose MongoDB port `27017` directly to the public internet. Use HTTPS in production and set `NODE_ENV=production`, `SESSION_SECRET`, `MONGODB_URI`, and `ADMIN_EMAIL` in the hosting provider's environment settings.

## Current behavior

- Everyone with an active account can edit the shared planner.
- Planner changes are saved to MongoDB after a short delay; refresh to load updates from other users.
- XP totals, XP claims, and custom rewards are stored separately for each account.
- Admins can view accounts and recent activity, change roles, suspend/reactivate accounts, and delete accounts.
- Account passwords are hashed with bcrypt. Authentication endpoints are rate-limited.

This starter uses one shared MongoDB state document and is intended for a small group and a single backend instance. For larger deployments, split planner data into separate collections and use a multi-instance-safe persistence strategy.

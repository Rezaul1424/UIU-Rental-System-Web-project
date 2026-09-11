# UIU Rental — Backend

Standalone Express + TypeScript API. Lives entirely inside `backend/`, independent
of the Vite/React frontend in `frontend/` (separate `package.json`, separate
`node_modules`, separate scripts).

This backend uses **Express 5** (per project spec) rather than Fastify.
`X-Powered-By` is explicitly disabled (`app.disable('x-powered-by')`) to avoid
advertising the framework in response headers.

## Requirements

- Node.js >= 20

## Setup

```bash
cd backend
npm install
cp .env.example .env
# edit .env if your ports/origins differ from the defaults
```

## Scripts

| Command | What it does |
|---|---|
| `npm run dev` | Starts the server in watch mode (auto-restarts on file changes) using `tsx`. Reads `src/server.ts` directly — no manual build step. |
| `npm run build` | Type-checks and compiles `src/` → `dist/` using `tsc`. |
| `npm start` | Runs the **compiled** server from `dist/server.js`. Run `npm run build` first. |
| `npm test` | Runs the automated test suite once (`vitest run`). |
| `npm run test:watch` | Runs tests in watch mode while developing. |

## Environment variables

Defined and validated in `src/config/env.ts`. The app refuses to start if any
are missing or malformed — see `.env.example` for the full list with comments:

| Variable | Required | Example | Notes |
|---|---|---|---|
| `NODE_ENV` | no (defaults to `development`) | `development` \| `test` \| `production` | |
| `PORT` | no (defaults to `4000`) | `4000` | Must be a positive integer |
| `CORS_ALLOWED_ORIGINS` | yes | `http://localhost:5173,http://localhost:8443` | Comma-separated. Only these browser origins can call the API. |
| `LOG_LEVEL` | no (defaults to `info`) | `info` | Reserved for future structured-logging use |

If you start the server with a bad or missing value, you'll see something like:

```
[config] Invalid or missing environment variables:
  - PORT: Expected number, received nan

Copy .env.example to .env and fill in real values, then restart.
```
...and the process exits with code 1 instead of starting in a broken state.

## Running locally

```bash
npm run dev
```

Then in another terminal:

```bash
curl http://localhost:4000/health
curl http://localhost:4000/api/v1/health
```

Both return:

```json
{ "status": "ok", "uptimeSeconds": 12, "timestamp": "2026-01-01T00:00:00.000Z" }
```

## API structure

All versioned routes are mounted under `/api/v1` (see `src/routes/index.ts`).
A bare `/health` also exists outside the version prefix for load balancers /
uptime monitors that don't need to know about API versioning.

Errors are always shaped the same way, regardless of where they're thrown:

```json
{ "error": { "code": "NOT_FOUND", "message": "Listing does not exist", "statusCode": 404 } }
```

Throw an `AppError` (or `NotFoundError` / `ValidationError`, both in
`src/errors/AppError.ts`) from any route handler to produce this consistently.

## Project layout

```
backend/
├── src/
│   ├── server.ts            # entrypoint — loads .env, starts listening, handles shutdown
│   ├── app.ts                 # builds the Express app (middleware + routes), no listening
│   ├── config/env.ts           # env var loading + validation (zod), fails fast
│   ├── plugins/
│   │   ├── cors.ts             # origin allowlist from CORS_ALLOWED_ORIGINS
│   │   └── error-handler.ts    # 4-arg Express error middleware → consistent JSON response
│   ├── routes/
│   │   ├── index.ts            # mounts all v1 routes under /api/v1
│   │   └── health.ts
│   ├── errors/AppError.ts
│   └── utils/asyncHandler.ts   # wraps async route handlers so thrown/rejected errors
│                                 reach the error handler. Express 5 (used here) already
│                                 auto-forwards async errors, so this is defensive/explicit
│                                 rather than strictly required — kept for clarity and in
│                                 case of a future downgrade to Express 4.
├── test/
│   └── health.test.ts          # vitest + supertest, no dev server needs to be running
├── .env.example
└── package.json
```

## Middleware order (Express-specific, matters a lot)

Unlike Fastify, Express runs middleware strictly top-to-bottom in the order
registered in `app.ts`:

1. `morgan` request logging — logs every request, even ones that later fail
2. CORS — reject disallowed origins before doing any real work
3. `express.json()` — body parsing, so route handlers can read `req.body`
4. Routes (`/health`, then `/api/v1/...`)
5. 404 handler — catches anything no route matched
6. Error handler — **must be registered last**; Express identifies it
   specifically by its 4-argument signature `(err, req, res, next)`

## Testing philosophy

`app.ts`'s `buildApp()` is synchronous and never calls `.listen()`. Tests
import it directly and use `supertest`'s `request(app)` to simulate HTTP
requests against it (`.get()`, `.post()`, etc.). Unlike Fastify's true
in-memory `.inject()`, supertest opens a brief ephemeral port per request
under the hood — still fast, and it never requires `npm run dev` to be
running separately.

## Adding a new route module

1. Create `src/routes/yourFeature.ts` exporting an Express `Router`.
2. Mount it inside `v1Router` in `src/routes/index.ts`.
3. Throw `AppError` subclasses for expected failure cases; wrap async
   handlers with `asyncHandler(...)` from `src/utils/asyncHandler.ts` for
   clarity (technically optional on Express 5, but keep the habit).
4. Add a test in `test/` that imports `buildApp()` and uses `supertest`.

# UIU Rental System - Backend API

Built with **Node.js**, **Express**, and **MySQL**.

---

## 1. Database Setup (MySQL)

The database uses MySQL 8+, tracked migrations, and deterministic development fixtures.

Run the repeatable setup from `backend/`:

```bash
npm run db:setup
```

This creates the database when needed, applies the baseline schema once, applies every
pending file in `database/migrations/`, and loads development-only fixtures from
`database/seed.sql`. Existing databases are baselined without dropping their data.

To run the steps separately:

```bash
npm run db:migrate
npm run db:seed
```

The migration runner records applied files in `_schema_migrations`. The SQL files are
idempotent, and seed statements use deterministic identifiers or guarded inserts.

For a manual first-time import, the baseline schema and its original fixtures are also
available through MySQL CLI or MySQL Workbench:

### Option A: Via Command Line
```bash
mysql -u root -p < database/schema.sql
```

### Option B: Via MySQL Workbench / DBeaver / phpMyAdmin
1. Open MySQL Workbench.
2. Open `backend/database/schema.sql`.
3. Execute the baseline script to create `uiu_rental_system` and its original tables + seed data.

---

## 2. Environment Configuration

Copy the example environment file:
```bash
cp .env.example .env
```
Edit `.env` with your local MySQL credentials:
```ini
PORT=5000
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=uiu_rental_system
DB_PORT=3306
JWT_SECRET=your_secret_key
```

The migration and seed commands use the same `DB_HOST`, `DB_PORT`, `DB_USER`,
`DB_PASSWORD`, and `DB_NAME` variables. Development fixtures use fake `.test`
accounts and the password `password123`; never reuse them in production.

---

## 3. Installation & Running

```bash
# Install dependencies
npm install

# Start in development mode (with auto-reload)
npm run dev
```

The server will be running at `http://localhost:5000`.
Test health endpoint: `GET http://localhost:5000/api/health`.

---

## 4. Team Division of Modules

- **Student & Landlord Modules**:
  - `src/routes/student.routes.js`: Browse, apply, pay rent, view receipts, submit maintenance, favorites.
  - `src/routes/landlord.routes.js`: My listings, add/edit listing, approve/reject applications, rent tracking, maintenance resolve.
  - `src/controllers/student.controller.js`
  - `src/controllers/landlord.controller.js`

- **Remaining Modules (Auth, Admin, Public)**:
  - `src/routes/auth.routes.js`: Register, login, forgot password, JWT generation.
  - `src/middlewares/auth.middleware.js`: Token verification & role checking (`verifyToken`, `requireRole`).
  - `src/routes/admin.routes.js`: Manage users, resolve complaints, monitor chats.
  - `src/routes/public.routes.js`: Public listings & search.
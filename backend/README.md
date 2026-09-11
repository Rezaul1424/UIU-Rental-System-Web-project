# UIU Rental — Backend

Standalone Fastify + TypeScript API. Lives entirely inside `backend/`, independent
of the Vite/React frontend in `frontend/` (separate `package.json`, separate
`node_modules`, separate scripts).

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
| `LOG_LEVEL` | no (defaults to `info`) | `info` | pino log level |

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
│   ├── app.ts                # builds the Fastify instance (routes + plugins), no listening
│   ├── config/env.ts          # env var loading + validation (zod), fails fast
│   ├── plugins/
│   │   ├── cors.ts            # origin allowlist from CORS_ALLOWED_ORIGINS
│   │   └── error-handler.ts   # central error → JSON response mapping
│   ├── routes/
│   │   ├── index.ts           # mounts all v1 routes under /api/v1
│   │   └── health.ts
│   └── errors/AppError.ts
├── test/
│   └── health.test.ts         # vitest + fastify.inject(), no real network socket
├── .env.example
└── package.json
```

## Testing philosophy

`app.ts` never calls `.listen()`. Tests import `buildApp()` and use
`app.inject({ method, url })`, which simulates a full HTTP request/response
cycle in-memory. No port is opened, so tests run fast and never collide with
a dev server that might already be running on the same machine.

## Adding a new route module

1. Create `src/routes/yourFeature.ts` exporting a Fastify plugin function.
2. Register it inside `registerV1Routes` in `src/routes/index.ts`.
3. Throw `AppError` subclasses for expected failure cases; let unexpected
   errors bubble up (the central handler turns them into a safe 500).
4. Add a test in `test/` that imports `buildApp()` and injects requests.
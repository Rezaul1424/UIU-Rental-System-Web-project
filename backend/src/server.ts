// This side-effect import MUST run before anything that reads process.env
// (like ./config/env.js, imported transitively via ./app.js), so .env
// values are populated first.
import 'dotenv/config';

import { buildApp } from './app.js';
import { env } from './config/env.js';

function start(): void {
  const app = buildApp();

  const server = app.listen(env.PORT, () => {
    console.log(`Backend listening on http://localhost:${env.PORT}`);
    console.log(`Health check: http://localhost:${env.PORT}/health`);
  });

  // Graceful shutdown: let in-flight requests finish instead of dying mid-response.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, () => {
      console.log(`Received ${signal}, shutting down gracefully...`);
      server.close(() => process.exit(0));
    });
  }
}

start();
// This side-effect import MUST run before anything that reads process.env
// (like ./config/env.js, imported transitively via ./app.js), so .env
// values are populated first.
import 'dotenv/config';

import { buildApp } from './app.js';
import { env } from './config/env.js';

async function start(): Promise<void> {
  const app = await buildApp();

  try {
    await app.listen({ port: env.PORT, host: '0.0.0.0' });
    app.log.info(`Backend listening on http://localhost:${env.PORT}`);
    app.log.info(`Health check: http://localhost:${env.PORT}/health`);
  } catch (err) {
    app.log.error(err);
    process.exit(1);
  }

  // Graceful shutdown: let in-flight requests finish instead of dying mid-response.
  for (const signal of ['SIGINT', 'SIGTERM'] as const) {
    process.on(signal, async () => {
      app.log.info(`Received ${signal}, shutting down gracefully...`);
      await app.close();
      process.exit(0);
    });
  }
}

start();
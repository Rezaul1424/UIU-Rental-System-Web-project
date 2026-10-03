import { z } from 'zod';

/**
 * Every environment variable the backend needs, with a rule for what
 * "valid" means. If something is missing or malformed, zod collects
 * ALL the problems at once instead of failing on the first one.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),

  // Port the HTTP server listens on.
  PORT: z.coerce.number().int().positive().default(4000),

  // Comma-separated list of origins allowed to call this API from a browser.
  // Example: "http://localhost:5173,http://localhost:8443"
  CORS_ALLOWED_ORIGINS: z
    .string()
    .min(1, 'CORS_ALLOWED_ORIGINS must not be empty')
    .default('http://localhost:5173,http://localhost:4173,http://localhost:8443'),

  LOG_LEVEL: z
    .enum(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent'])
    .default('info'),

  JWT_SECRET: z
    .string()
    .min(32, 'JWT_SECRET must contain at least 32 characters')
    .default('development-only-jwt-secret-change-this-value-1234'),
});

export type Env = z.infer<typeof envSchema> & {
  /** Derived, not read directly from process.env — see below. */
  corsAllowedOrigins: string[];
};

function loadEnv(): Env {
  const result = envSchema.safeParse(process.env);

  if (!result.success) {
    const issues = result.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    // Intentionally NOT using the app logger here: logging hasn't been
    // set up yet, and this must be readable even if pino fails to init.
    console.error(
      `\n[config] Invalid or missing environment variables:\n${issues}\n\n` +
        'Copy .env.example to .env and fill in real values, then restart.\n',
    );
    process.exit(1);
  }

  const parsed = result.data;

  return {
    ...parsed,
    corsAllowedOrigins: parsed.CORS_ALLOWED_ORIGINS.split(',').map((origin) =>
      origin.trim(),
    ),
  };
}

export const env = loadEnv();
import { describe, it, expect } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const app = buildApp();

describe('GET /health', () => {
  it('returns 200 with an ok status', async () => {
    const response = await request(app).get('/health');

    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
    expect(typeof response.body.uptimeSeconds).toBe('number');
    expect(typeof response.body.timestamp).toBe('string');
  });
});

describe('GET /api/v1/health', () => {
  it('is reachable under the versioned prefix too', async () => {
    const response = await request(app).get('/api/v1/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  });
});

describe('unknown route', () => {
  it('returns a consistent 404 JSON error shape', async () => {
    const response = await request(app).get('/nope');

    expect(response.status).toBe(404);
    expect(response.body).toEqual({
      error: {
        code: 'ROUTE_NOT_FOUND',
        message: 'Route GET /nope not found',
        statusCode: 404,
      },
    });
  });
});
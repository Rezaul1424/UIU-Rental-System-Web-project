import { describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const app = buildApp();

describe('Module 6 public listings API', () => {
  it('browses public listings without authentication and returns pagination metadata', async () => {
    const response = await request(app).get('/api/v1/listings');

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(2);
    expect(response.body.data).toContainEqual(expect.objectContaining({
      id: 'UIU-1001',
      currency: 'BDT',
      type: 'studio',
      landlordName: 'Rahman Faruk',
    }));
    expect(response.body.meta).toMatchObject({ page: 1, limit: 20, totalItems: 2, totalPages: 1 });
  });

  it('applies bounded price, type, facility, and pagination filters', async () => {
    const response = await request(app).get('/api/v1/listings').query({
      type: 'studio',
      maxPrice: 5000,
      facilities: 'wifi',
      limit: 1,
      page: 1,
      sortBy: 'price',
      sortDirection: 'asc',
    });

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0].id).toBe('UIU-1001');
    expect(response.body.meta.hasNextPage).toBe(false);
  });

  it('returns one public listing and hides unavailable listings', async () => {
    const detail = await request(app).get('/api/v1/listings/UIU-1001');
    const unavailable = await request(app).get('/api/v1/listings/UIU-1004');

    expect(detail.status).toBe(200);
    expect(detail.body.data.address.latitude).toBeTypeOf('number');
    expect(detail.body.data.images[0].isPrimary).toBe(true);
    expect(unavailable.status).toBe(404);
    expect(unavailable.body.error.code).toBe('LISTING_NOT_FOUND');
  });

  it('rejects invalid or unbounded search parameters', async () => {
    const response = await request(app).get('/api/v1/listings').query({
      limit: 101,
      maxDistance: 51,
    });

    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe('VALIDATION_ERROR');
  });
});

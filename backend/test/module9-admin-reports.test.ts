import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';

const app = buildApp();

async function createToken(role: 'admin' | 'student', email: string): Promise<string> {
  const result = await registerUser({ name: 'Reports Test User', email, password: 'TestPass123!', role });
  return createAuthToken(result.user);
}

describe('Module 9 administrator reports', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('requires an administrator role', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/reports');
    expect(unauthenticated.status).toBe(401);

    const token = await createToken('student', `reports-student-${Date.now()}@uiu.ac.bd`);
    const forbidden = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${token}`);
    expect(forbidden.status).toBe(403);
  });

  it('returns structured report aggregates to an administrator', async () => {
    const token = await createToken('admin', `reports-admin-${Date.now()}@uiu.ac.bd`);
    const response = await request(app)
      .get('/api/v1/admin/reports')
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.generatedAt).toBeTruthy();
    expect(response.body.data.userGrowth).toHaveLength(8);
    expect(response.body.data.rentCollection).toHaveLength(6);
    expect(response.body.data.listingActivity).toHaveLength(6);
    expect(response.body.data.listingStatuses).toEqual({ available: 1, occupied: 1, maintenance: 0 });
    expect(response.body.data.accountStatuses.landlords.active).toBe(1);
    expect(response.body.data.accountStatuses.students.pending).toBe(1);
    expect(response.body.data).not.toHaveProperty('passwordHash');
  });
});

import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';

const app = buildApp();

async function createToken(role: 'admin' | 'student', email: string): Promise<string> {
  const result = await registerUser({ name: 'Chat Monitor Test', email, password: 'TestPass123!', role });
  return createAuthToken(result.user);
}

describe('Module 11 administrator chat monitoring', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('requires an administrator role', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/conversations');
    expect(unauthenticated.status).toBe(401);

    const token = await createToken('student', `chat-student-${Date.now()}@uiu.ac.bd`);
    const forbidden = await request(app)
      .get('/api/v1/admin/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(forbidden.status).toBe(403);
  });

  it('lists read-only conversations and supports participant/property search', async () => {
    const token = await createToken('admin', `chat-admin-${Date.now()}@uiu.ac.bd`);
    const response = await request(app)
      .get('/api/v1/admin/conversations')
      .set('Authorization', `Bearer ${token}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({
      student: 'Tanvir Ahmed',
      landlord: 'Rahman Faruk',
      propertyId: 'UIU-1004',
    });
    expect(response.body.data[0].messages[0]).toMatchObject({
      from: 'student', senderName: 'Tanvir Ahmed', text: 'Development fixture message.',
    });

    const filtered = await request(app)
      .get('/api/v1/admin/conversations')
      .query({ q: 'does-not-match' })
      .set('Authorization', `Bearer ${token}`);
    expect(filtered.status).toBe(200);
    expect(filtered.body.data).toEqual([]);
  });
});

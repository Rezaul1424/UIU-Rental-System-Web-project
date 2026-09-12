import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';

const app = buildApp();

describe('Module 4 authorization and security rules', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('applies the shared security headers to all responses', async () => {
    const response = await request(app).get('/api/v1/health');

    expect(response.status).toBe(200);
    expect(response.headers['x-content-type-options']).toBe('nosniff');
    expect(response.headers['x-frame-options']).toBe('DENY');
  });

  it('rejects unauthenticated access to protected resources', async () => {
    const response = await request(app).get('/api/v1/security/profile/user_123');

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('UNAUTHENTICATED');
  });

  it('allows students to access their own profile and blocks other users', async () => {
    const studentA = await request(app).post('/api/v1/auth/register').send({
      name: 'Student A',
      email: 'student-a@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456789',
      role: 'student',
    });

    const studentB = await request(app).post('/api/v1/auth/register').send({
      name: 'Student B',
      email: 'student-b@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456790',
      role: 'student',
    });

    const loginA = await request(app).post('/api/v1/auth/login').send({
      email: 'student-a@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const ownProfile = await request(app)
      .get(`/api/v1/security/profile/${studentA.body.user.id}`)
      .set('Authorization', `Bearer ${loginA.body.token}`);

    expect(ownProfile.status).toBe(200);
    expect(ownProfile.body.user.id).toBe(studentA.body.user.id);

    const otherProfile = await request(app)
      .get(`/api/v1/security/profile/${studentB.body.user.id}`)
      .set('Authorization', `Bearer ${loginA.body.token}`);

    expect(otherProfile.status).toBe(403);
    expect(otherProfile.body.error.code).toBe('FORBIDDEN');
  });

  it('allows admins to access protected resources and denies non-admin users', async () => {
    const admin = await registerUser({
      name: 'Admin User',
      email: 'admin@uiu.ac.bd',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminToken = await createAuthToken(admin.user);

    const student = await request(app).post('/api/v1/auth/register').send({
      name: 'Student C',
      email: 'student-c@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456791',
      role: 'student',
    });

    const studentLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'student-c@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const adminAccess = await request(app)
      .get(`/api/v1/security/admin/inspect/${student.body.user.id}`)
      .set('Authorization', `Bearer ${adminToken}`);

    const studentForbidden = await request(app)
      .get(`/api/v1/security/admin/inspect/${student.body.user.id}`)
      .set('Authorization', `Bearer ${studentLogin.body.token}`);

    expect(adminAccess.status).toBe(200);
    expect(studentForbidden.status).toBe(403);
    expect(studentForbidden.body.error.code).toBe('FORBIDDEN');
  });

  it('rate limits repeated login attempts and resets the auth error contract', async () => {
    for (let index = 0; index < 6; index += 1) {
      await request(app).post('/api/v1/auth/login').send({
        email: 'missing@test.com',
        password: 'wrongpass',
      });
    }

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@test.com',
      password: 'wrongpass',
    });

    expect(response.status).toBe(429);
    expect(response.body.error.code).toBe('RATE_LIMIT_EXCEEDED');
  });
});

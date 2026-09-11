import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';

const app = buildApp();

describe('Session 2 student dashboard flows', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('returns the authenticated student profile', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Session Student',
      email: 'session.student@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123999999',
      role: 'student',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'session.student@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const response = await request(app)
      .get('/api/v1/student/profile')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.email).toBe('session.student@uiu.ac.bd');
    expect(response.body.data.role).toBe('student');
  });

  it('prevents duplicate favorites and returns the student favorites list', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Favorite User',
      email: 'favorite.user@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01124000001',
      role: 'student',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'favorite.user@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const first = await request(app)
      .post('/api/v1/student/favorites/UIU-1001')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/student/favorites/UIU-1001')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('DUPLICATE_FAVORITE');

    const list = await request(app)
      .get('/api/v1/student/favorites')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('stores student applications and rejects duplicates', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Application User',
      email: 'application.user@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01124000002',
      role: 'student',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'application.user@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const payload = {
      propertyId: 'UIU-1001',
      studentCardNo: '01124000002',
      contactPhone: '01700000000',
      moveInDate: '2026-10-01',
      employment: 'Student',
      message: 'Looking for a quiet room near campus.',
    };

    const first = await request(app)
      .post('/api/v1/student/applications')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send(payload);

    expect(first.status).toBe(201);

    const second = await request(app)
      .post('/api/v1/student/applications')
      .set('Authorization', `Bearer ${login.body.token}`)
      .send(payload);

    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('DUPLICATE_APPLICATION');

    const list = await request(app)
      .get('/api/v1/student/applications')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(list.status).toBe(200);
    expect(list.body.data.length).toBeGreaterThan(0);
  });

  it('returns empty student rent, receipts, lease, and maintenance collections for the logged-in student', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Rent User',
      email: 'rent.user@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01124000003',
      role: 'student',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'rent.user@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const rent = await request(app)
      .get('/api/v1/student/rent')
      .set('Authorization', `Bearer ${login.body.token}`);
    const receipts = await request(app)
      .get('/api/v1/student/receipts')
      .set('Authorization', `Bearer ${login.body.token}`);
    const leases = await request(app)
      .get('/api/v1/student/leases')
      .set('Authorization', `Bearer ${login.body.token}`);
    const maintenance = await request(app)
      .get('/api/v1/student/maintenance')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(rent.status).toBe(200);
    expect(receipts.status).toBe(200);
    expect(leases.status).toBe(200);
    expect(maintenance.status).toBe(200);
    expect(Array.isArray(rent.body.data)).toBe(true);
    expect(Array.isArray(receipts.body.data)).toBe(true);
    expect(Array.isArray(leases.body.data)).toBe(true);
    expect(Array.isArray(maintenance.body.data)).toBe(true);
  });
});

import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';

const app = buildApp();

describe('Module 3 authentication lifecycle', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('registers a student and returns a safe user payload', async () => {
    const response = await request(app)
      .post('/api/v1/auth/register')
      .send({
        name: 'Nadia Rahman',
        email: 'nadia@student.uiu.ac.bd',
        password: 'StrongPass123!',
        studentId: '01123456789',
        role: 'student',
      });

    expect(response.status).toBe(201);
    expect(response.body.user.email).toBe('nadia@student.uiu.ac.bd');
    expect(response.body.user.password).toBeUndefined();
    expect(response.body.user.role).toBe('student');
  });

  it('logs in with valid credentials and returns a token', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Nadia Rahman',
      email: 'nadia@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456789',
      role: 'student',
    });

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'nadia@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe('nadia@student.uiu.ac.bd');
    expect(response.body.token).toBeTypeOf('string');
  });

  it('returns the authenticated user from /me', async () => {
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'Current User',
      email: 'current@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456794',
      role: 'student',
    });

    const response = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.id).toBe(registration.body.user.id);
    expect(response.body.user.email).toBe('current@student.uiu.ac.bd');
    expect(response.body.user.passwordHash).toBeUndefined();
  });

  it('blocks public administrator registration', async () => {
    const response = await request(app).post('/api/v1/auth/register').send({
      name: 'Public Admin',
      email: 'public-admin@uiu.ac.bd',
      password: 'AdminPass123!',
      role: 'admin',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ADMIN_REGISTRATION_DISABLED');
  });

  it('places landlord accounts in pending status until approval', async () => {
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'Pending Landlord',
      email: 'pending-landlord@uiu.ac.bd',
      password: 'StrongPass123!',
      role: 'landlord',
    });

    expect(registration.status).toBe(201);
    expect(registration.body.user.status).toBe('pending');

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'pending-landlord@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    expect(login.status).toBe(403);
    expect(login.body.error.code).toBe('ACCOUNT_PENDING');
  });

  it('rejects invalid login credentials safely', async () => {
    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'missing@student.uiu.ac.bd',
      password: 'wrongpass',
    });

    expect(response.status).toBe(401);
    expect(response.body.error.code).toBe('INVALID_CREDENTIALS');
  });

  it('rejects suspended or deactivated accounts', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Suspended User',
      email: 'suspended@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456790',
      role: 'student',
    });

    const admin = await registerUser({
      name: 'Admin User',
      email: 'admin@uiu.ac.bd',
      password: 'AdminPass123!',
      role: 'admin',
    });
    const adminToken = await createAuthToken(admin.user);

    const adminLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'admin@uiu.ac.bd',
      password: 'AdminPass123!',
    });

    const suspension = await request(app)
      .post('/api/v1/auth/admin/suspend-user')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ email: 'suspended@student.uiu.ac.bd', reason: 'manual review' });

    expect(suspension.status).toBe(200);

    const response = await request(app).post('/api/v1/auth/login').send({
      email: 'suspended@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    expect(response.status).toBe(403);
    expect(response.body.error.code).toBe('ACCOUNT_SUSPENDED');
  });

  it('logs out an authenticated user safely', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Logout User',
      email: 'logout@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456793',
      role: 'student',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'logout@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const response = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(response.status).toBe(200);
    expect(response.body.message).toBe('Logged out successfully');

    const rejectedAfterLogout = await request(app)
      .post('/api/v1/auth/logout')
      .set('Authorization', `Bearer ${login.body.token}`);

    expect(rejectedAfterLogout.status).toBe(401);
  });

  it('allows a password reset flow with secure completion', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Reset User',
      email: 'reset@student.uiu.ac.bd',
      password: 'OldPass123!',
      studentId: '01123456791',
      role: 'student',
    });

    const resetRequest = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset@student.uiu.ac.bd' });

    expect(resetRequest.status).toBe(200);
    expect(resetRequest.body.message).toBe('If the account exists, a reset link has been sent.');

    const tokenResponse = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset@student.uiu.ac.bd' });

    const token = tokenResponse.body.token;

    const resetDone = await request(app)
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token, newPassword: 'NewPass123!' });

    expect(resetDone.status).toBe(200);

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'reset@student.uiu.ac.bd',
      password: 'NewPass123!',
    });

    expect(login.status).toBe(200);
  });

  it('invalidates existing sessions after a password reset', async () => {
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'Reset Session User',
      email: 'reset-session@student.uiu.ac.bd',
      password: 'OldPass123!',
      studentId: '01123456795',
      role: 'student',
    });

    const resetRequest = await request(app)
      .post('/api/v1/auth/password-reset/request')
      .send({ email: 'reset-session@student.uiu.ac.bd' });

    await request(app)
      .post('/api/v1/auth/password-reset/confirm')
      .send({ token: resetRequest.body.token, newPassword: 'NewPass123!' });

    const currentUser = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${registration.body.token}`);

    expect(currentUser.status).toBe(401);
  });

  it('deactivates an account after confirmation', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Deactivate User',
      email: 'deactivate@student.uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01123456792',
      role: 'student',
    });

    const loginBefore = await request(app).post('/api/v1/auth/login').send({
      email: 'deactivate@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const response = await request(app)
      .post('/api/v1/auth/deactivate')
      .set('Authorization', `Bearer ${loginBefore.body.token}`)
      .send({
        confirm: true,
        password: 'StrongPass123!',
      });

    expect(response.status).toBe(200);
    expect(response.body.user.status).toBe('deactivated');

    const currentUser = await request(app)
      .get('/api/v1/auth/me')
      .set('Authorization', `Bearer ${loginBefore.body.token}`);

    expect(currentUser.status).toBe(401);

    const loginAfter = await request(app).post('/api/v1/auth/login').send({
      email: 'deactivate@student.uiu.ac.bd',
      password: 'StrongPass123!',
    });

    expect(loginAfter.status).toBe(403);
  });
});

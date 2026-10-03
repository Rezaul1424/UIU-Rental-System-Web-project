import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';
import { clearAuditEvents, getAuditEvents } from '../src/security/audit.js';

const app = buildApp();

async function createAdminToken(email: string): Promise<string> {
  const admin = await registerUser({
    name: 'Module 7 Admin',
    email,
    password: 'AdminPass123!',
    role: 'admin',
  });
  return createAuthToken(admin.user);
}

describe('Module 7 administrator user operations', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    clearAuditEvents();
  });

  it('rejects unauthenticated and non-admin access', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/users');
    expect(unauthenticated.status).toBe(401);

    const student = await request(app).post('/api/v1/auth/register').send({
      name: 'Module 7 Student',
      email: `module7-student-${Date.now()}@student.uiu.ac.bd`,
      password: 'StrongPass123!',
      studentId: `M7-${Date.now()}`,
      role: 'student',
    });
    const forbidden = await request(app)
      .get('/api/v1/admin/users')
      .set('Authorization', `Bearer ${student.body.token}`);

    expect(forbidden.status).toBe(403);
    expect(forbidden.body.error.code).toBe('FORBIDDEN');
  });

  it('lists safe users with filters and pagination', async () => {
    const token = await createAdminToken(`module7-list-${Date.now()}@uiu.ac.bd`);
    const email = `module7-pending-${Date.now()}@uiu.ac.bd`;
    await request(app).post('/api/v1/auth/register').send({
      name: 'Module 7 Pending Landlord',
      email,
      password: 'StrongPass123!',
      role: 'landlord',
    });

    const response = await request(app)
      .get('/api/v1/admin/users')
      .query({ status: 'pending', limit: 1 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.meta.limit).toBe(1);
    expect(response.body.data.every((user: { status: string }) => user.status === 'pending')).toBe(true);
    expect(JSON.stringify(response.body)).not.toContain('passwordHash');
  });

  it('returns a safe user detail without credentials', async () => {
    const token = await createAdminToken(`module7-detail-admin-${Date.now()}@uiu.ac.bd`);
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'Module 7 Detail User',
      email: `module7-detail-${Date.now()}@student.uiu.ac.bd`,
      password: 'StrongPass123!',
      studentId: `M7-D-${Date.now()}`,
      role: 'student',
    });

    const response = await request(app)
      .get(`/api/v1/admin/users/${registration.body.user.id}`)
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.user.email).toBe(registration.body.user.email);
    expect(response.body.user.passwordHash).toBeUndefined();
    expect(response.body.user.password).toBeUndefined();
  });

  it('changes account status and records an audit event', async () => {
    const token = await createAdminToken(`module7-status-admin-${Date.now()}@uiu.ac.bd`);
    const registration = await request(app).post('/api/v1/auth/register').send({
      name: 'Module 7 Status User',
      email: `module7-status-${Date.now()}@student.uiu.ac.bd`,
      password: 'StrongPass123!',
      studentId: `M7-S-${Date.now()}`,
      role: 'student',
    });

    const response = await request(app)
      .patch(`/api/v1/admin/users/${registration.body.user.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'suspended', reason: 'Security review required' });

    expect(response.status).toBe(200);
    expect(response.body.user.status).toBe('suspended');
    expect(getAuditEvents()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'ACCOUNT_STATUS_CHANGED',
        resourceId: registration.body.user.id,
        previousState: { status: 'active' },
        newState: { status: 'suspended' },
      }),
    ]));
  });

  it('rejects invalid transitions and administrator self-moderation', async () => {
    const admin = await registerUser({
      name: 'Module 7 Self Admin',
      email: `module7-self-admin-${Date.now()}@uiu.ac.bd`,
      password: 'AdminPass123!',
      role: 'admin',
    });
    const token = await createAuthToken(admin.user);

    const selfChange = await request(app)
      .patch(`/api/v1/admin/users/${admin.user.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'suspended', reason: 'Should be rejected' });
    expect(selfChange.status).toBe(400);
    expect(selfChange.body.error.code).toBe('SELF_MODERATION_NOT_ALLOWED');

    const student = await request(app).post('/api/v1/auth/register').send({
      name: 'Module 7 Transition User',
      email: `module7-transition-${Date.now()}@student.uiu.ac.bd`,
      password: 'StrongPass123!',
      studentId: `M7-T-${Date.now()}`,
      role: 'student',
    });
    const first = await request(app)
      .patch(`/api/v1/admin/users/${student.body.user.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'deactivated', reason: 'Retention policy' });
    expect(first.status).toBe(200);

    const second = await request(app)
      .patch(`/api/v1/admin/users/${student.body.user.id}/status`)
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'active', reason: 'Attempted invalid restore' });
    expect(second.status).toBe(409);
    expect(second.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });
});

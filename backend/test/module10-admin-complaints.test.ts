import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';
import { resetAdminComplaintFixtures } from '../src/complaints/admin-repository.js';
import { resetAdminNotificationFixtures } from '../src/notifications/admin-repository.js';
import { clearAuditEvents, getAuditEvents } from '../src/security/audit.js';

const app = buildApp();

async function tokenFor(role: 'admin' | 'student', email: string): Promise<string> {
  const result = await registerUser({ name: `${role} user`, email, password: 'TestPass123!', role });
  return createAuthToken(result.user);
}

describe('Module 10 administrator complaints', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    resetAdminComplaintFixtures();
    resetAdminNotificationFixtures();
    clearAuditEvents();
  });

  it('forwards student and landlord complaints to the admin list and notification feed', async () => {
    const studentToken = await tokenFor('student', `complaints-submit-student-${Date.now()}@uiu.ac.bd`);
    const landlordToken = await createAuthToken({
      id: '2',
      name: 'Rahman Faruk',
      email: 'faruk@example.com',
      role: 'landlord',
      status: 'active',
    });
    const adminToken = await tokenFor('admin', `complaints-submit-admin-${Date.now()}@uiu.ac.bd`);

    const studentSubmission = await request(app)
      .post('/api/v1/student/complaints')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({
        against: 'Test Landlord',
        property: 'Test Student Property',
        category: 'Maintenance',
        subject: 'Student complaint',
        description: 'Maintenance issue needs review.',
      });
    expect(studentSubmission.status).toBe(201);

    const landlordSubmission = await request(app)
      .post('/api/v1/landlord/complaints')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({
        against: 'Test Student',
        property: 'Test Landlord Property',
        category: 'Payment',
        subject: 'Landlord complaint',
        description: 'Payment issue needs review.',
      });
    expect(landlordSubmission.status).toBe(201);

    const adminComplaints = await request(app)
      .get('/api/v1/admin/complaints')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminComplaints.status).toBe(200);
    expect(adminComplaints.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ id: studentSubmission.body.data.id, fromType: 'Student', category: 'Maintenance' }),
      expect.objectContaining({ id: landlordSubmission.body.data.id, fromType: 'Landlord', category: 'Payment' }),
    ]));

    const adminNotifications = await request(app)
      .get('/api/v1/admin/notifications')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(adminNotifications.status).toBe(200);
    expect(adminNotifications.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ type: 'complaint', message: expect.stringContaining(studentSubmission.body.data.id) }),
      expect.objectContaining({ type: 'complaint', message: expect.stringContaining(landlordSubmission.body.data.id) }),
    ]));
  });

  it('allows admins to search and filter persisted complaint records', async () => {
    const token = await tokenFor('admin', `complaints-list-${Date.now()}@uiu.ac.bd`);
    const response = await request(app)
      .get('/api/v1/admin/complaints')
      .query({ status: 'Submitted', q: 'Late Payment' })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data).toHaveLength(1);
    expect(response.body.data[0]).toMatchObject({ id: 'CMP-002', category: 'Late Payment', status: 'Submitted' });
  });

  it('rejects non-admin access and returns complaint thread details', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/complaints');
    expect(unauthenticated.status).toBe(401);
    const studentToken = await tokenFor('student', `complaints-student-${Date.now()}@uiu.ac.bd`);
    const forbidden = await request(app).get('/api/v1/admin/complaints').set('Authorization', `Bearer ${studentToken}`);
    expect(forbidden.status).toBe(403);

    const adminToken = await tokenFor('admin', `complaints-admin-${Date.now()}@uiu.ac.bd`);
    const detail = await request(app).get('/api/v1/admin/complaints/CMP-001').set('Authorization', `Bearer ${adminToken}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.messages).toHaveLength(1);
    expect(detail.body.data.messages[0]).toMatchObject({ from: 'Admin', isAdmin: true });
  });

  it('updates complaint status and sends audited replies', async () => {
    const token = await tokenFor('admin', `complaints-update-${Date.now()}@uiu.ac.bd`);
    const updated = await request(app)
      .patch('/api/v1/admin/complaints/CMP-002/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'Under Review' });
    expect(updated.status).toBe(200);
    expect(updated.body.data.status).toBe('Under Review');

    const reply = await request(app)
      .post('/api/v1/admin/complaints/CMP-002/replies')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: 'We are reviewing this payment complaint.' });
    expect(reply.status).toBe(201);
    expect(reply.body.data.status).toBe('Responded');
    expect(reply.body.data.messages.at(-1)).toMatchObject({
      from: 'Admin', isAdmin: true, text: 'We are reviewing this payment complaint.',
    });
    expect(getAuditEvents().map((event) => event.action)).toEqual(expect.arrayContaining([
      'COMPLAINT_STATUS_CHANGED', 'COMPLAINT_REPLY_ADDED',
    ]));
  });

  it('validates complaint IDs, status, and reply content', async () => {
    const token = await tokenFor('admin', `complaints-invalid-${Date.now()}@uiu.ac.bd`);
    const missing = await request(app).get('/api/v1/admin/complaints/unknown').set('Authorization', `Bearer ${token}`);
    expect(missing.status).toBe(404);

    const invalidStatus = await request(app)
      .patch('/api/v1/admin/complaints/CMP-001/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'invalid' });
    expect(invalidStatus.status).toBe(400);

    const emptyReply = await request(app)
      .post('/api/v1/admin/complaints/CMP-001/replies')
      .set('Authorization', `Bearer ${token}`)
      .send({ message: '  ' });
    expect(emptyReply.status).toBe(400);
  });
});

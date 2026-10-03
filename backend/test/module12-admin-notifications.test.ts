import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';
import { resetAdminNotificationFixtures } from '../src/notifications/admin-repository.js';

const app = buildApp();

async function createToken(role: 'admin' | 'student', email: string): Promise<string> {
  const result = await registerUser({ name: 'Notification Test User', email, password: 'TestPass123!', role });
  return createAuthToken(result.user);
}

describe('Module 12 administrator notifications', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    resetAdminNotificationFixtures();
  });

  it('requires admin access and reports new pending landlord registrations', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/notifications');
    expect(unauthenticated.status).toBe(401);

    const studentToken = await createToken('student', `notifications-student-${Date.now()}@uiu.ac.bd`);
    const forbidden = await request(app).get('/api/v1/admin/notifications').set('Authorization', `Bearer ${studentToken}`);
    expect(forbidden.status).toBe(403);

    const adminToken = await createToken('admin', `notifications-admin-${Date.now()}@uiu.ac.bd`);
    await registerUser({ name: 'New Pending Landlord', email: `notifications-landlord-${Date.now()}@example.test`, password: 'TestPass123!', role: 'landlord' });
    const response = await request(app).get('/api/v1/admin/notifications').set('Authorization', `Bearer ${adminToken}`);
    expect(response.status).toBe(200);
    expect(response.body.data).toEqual(expect.arrayContaining([
      expect.objectContaining({ title: 'New landlord registration pending approval', message: expect.stringContaining('New Pending Landlord'), isRead: false }),
    ]));
  });

  it('persists individual and all-read notification actions', async () => {
    const adminToken = await createToken('admin', `notifications-read-${Date.now()}@uiu.ac.bd`);
    await registerUser({ name: 'Unread Landlord', email: `notifications-unread-${Date.now()}@example.test`, password: 'TestPass123!', role: 'landlord' });
    const firstList = await request(app).get('/api/v1/admin/notifications').set('Authorization', `Bearer ${adminToken}`);
    const notificationId = firstList.body.data[0].id;

    const markedOne = await request(app)
      .patch('/api/v1/admin/notifications/read')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({ notificationId });
    expect(markedOne.status).toBe(204);

    const markedAll = await request(app)
      .patch('/api/v1/admin/notifications/read')
      .set('Authorization', `Bearer ${adminToken}`)
      .send({});
    expect(markedAll.status).toBe(204);
    const finalList = await request(app).get('/api/v1/admin/notifications').set('Authorization', `Bearer ${adminToken}`);
    expect(finalList.body.data.every((notification: { isRead: boolean }) => notification.isRead)).toBe(true);
  });
});

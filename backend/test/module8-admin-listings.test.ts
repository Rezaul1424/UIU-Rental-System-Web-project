import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser } from '../src/auth/auth.js';
import { clearAuditEvents, getAuditEvents } from '../src/security/audit.js';

const app = buildApp();

async function createAdminToken(email: string): Promise<string> {
  const admin = await registerUser({
    name: 'Module 8 Admin',
    email,
    password: 'AdminPass123!',
    role: 'admin',
  });
  return createAuthToken(admin.user);
}

describe('Module 8 administrator listing and category operations', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
    clearAuditEvents();
  });

  it('rejects non-admin access and lists listings for admins', async () => {
    const unauthenticated = await request(app).get('/api/v1/admin/listings');
    expect(unauthenticated.status).toBe(401);

    const token = await createAdminToken(`module8-list-${Date.now()}@uiu.ac.bd`);
    const response = await request(app)
      .get('/api/v1/admin/listings')
      .query({ moderationStatus: 'pending', limit: 1 })
      .set('Authorization', `Bearer ${token}`);

    expect(response.status).toBe(200);
    expect(response.body.data.length).toBeLessThanOrEqual(1);
    expect(response.body.data.every((listing: { moderationStatus: string }) => listing.moderationStatus === 'pending')).toBe(true);
    expect(response.body.meta.limit).toBe(1);
  });

  it('returns listing details and applies a moderation transition with an audit', async () => {
    const token = await createAdminToken(`module8-status-${Date.now()}@uiu.ac.bd`);
    const detail = await request(app)
      .get('/api/v1/admin/listings/UIU-1002')
      .set('Authorization', `Bearer ${token}`);
    expect(detail.status).toBe(200);
    expect(detail.body.data.moderationStatus).toBe('pending');
    expect(detail.body.data.availabilityStatus).toBe('available');

    const response = await request(app)
      .patch('/api/v1/admin/listings/UIU-1002/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved', reason: 'Listing review completed' });

    expect(response.status).toBe(200);
    expect(response.body.data.moderationStatus).toBe('approved');
    expect(getAuditEvents()).toEqual(expect.arrayContaining([
      expect.objectContaining({
        action: 'LISTING_MODERATION_CHANGED',
        resourceId: 'UIU-1002',
        previousState: { moderationStatus: 'pending' },
        newState: { moderationStatus: 'approved' },
      }),
    ]));
  });

  it('rejects invalid moderation transitions', async () => {
    const token = await createAdminToken(`module8-invalid-${Date.now()}@uiu.ac.bd`);
    const archive = await request(app)
      .patch('/api/v1/admin/listings/UIU-1001/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'archived', reason: 'Archiving test listing' });
    expect(archive.status).toBe(200);

    const restore = await request(app)
      .patch('/api/v1/admin/listings/UIU-1001/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ status: 'approved', reason: 'Invalid restore' });
    expect(restore.status).toBe(409);
    expect(restore.body.error.code).toBe('INVALID_STATUS_TRANSITION');
  });

  it('supports administrator category CRUD with audits', async () => {
    const token = await createAdminToken(`module8-category-${Date.now()}@uiu.ac.bd`);
    const name = `Module 8 Category ${Date.now()}`;

    const created = await request(app)
      .post('/api/v1/admin/categories')
      .set('Authorization', `Bearer ${token}`)
      .send({ name });
    expect(created.status).toBe(201);
    expect(created.body.data.name).toBe(name);

    const updated = await request(app)
      .patch(`/api/v1/admin/categories/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`)
      .send({ name: `${name} Updated` });
    expect(updated.status).toBe(200);
    expect(updated.body.data.name).toBe(`${name} Updated`);

    const deleted = await request(app)
      .delete(`/api/v1/admin/categories/${created.body.data.id}`)
      .set('Authorization', `Bearer ${token}`);
    expect(deleted.status).toBe(204);
    expect(getAuditEvents().filter((event) => event.resourceType === 'listing_category')).toHaveLength(3);
  });
});

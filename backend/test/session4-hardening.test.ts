import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { seedFixtureMaintenanceRequest } from '../src/landlord/repository.js';

const app = buildApp();

describe('Session 4 hardening', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('allows a student to remove a favorite using the public property code and rejects mismatched landlord maintenance requests', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Hardening Student',
      email: 'hardening.student@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01124000010',
      role: 'student',
    });

    const studentLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'hardening.student@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const favorite = await request(app)
      .post('/api/v1/student/favorites/UIU-1001')
      .set('Authorization', `Bearer ${studentLogin.body.token}`);

    expect(favorite.status).toBe(201);

    const remove = await request(app)
      .delete('/api/v1/student/favorites/UIU-1001')
      .set('Authorization', `Bearer ${studentLogin.body.token}`);

    expect(remove.status).toBe(204);

    await request(app).post('/api/v1/auth/register').send({
      name: 'Hardening Landlord',
      email: 'hardening.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: 'LAND-100',
      role: 'landlord',
    });

    const landlordLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'hardening.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const listing = await request(app)
      .post('/api/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordLogin.body.token}`)
      .send({
        title: 'Hardening test listing',
        description: 'A listing used for owner validation checks.',
        type: 'apartment',
        priceBDT: 5000,
        bedrooms: 2,
        roommateCapacity: 2,
        parkingAvailable: true,
        facilities: ['WiFi', 'Laundry'],
        address: {
          line1: 'Road 4',
          area: 'Bashundhara',
          city: 'Dhaka',
          district: 'Dhaka',
          latitude: 23.81,
          longitude: 90.42,
        },
        status: 'approved',
      });

    expect(listing.status).toBe(201);

    const maintenance = await request(app)
      .post('/api/v1/student/maintenance')
      .set('Authorization', `Bearer ${studentLogin.body.token}`)
      .send({
        propertyId: listing.body.data.id,
        landlordId: '999999',
        category: 'Plumbing',
        issue: 'Broken pipe',
        description: 'The bathroom pipe is leaking.',
        priority: 'High',
        attachments: [{ name: 'leak.jpg', type: 'image/jpeg', sizeBytes: 2000 }],
      });

    expect(maintenance.status).toBe(400);
  });

  it('lets a landlord update ownership-scoped listings and preserves correct listing ownership', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Owner Landlord',
      email: 'owner.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: 'LAND-200',
      role: 'landlord',
    });

    const landlordLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'owner.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const listing = await request(app)
      .post('/api/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordLogin.body.token}`)
      .send({
        title: 'Prime listing',
        description: 'A listing created for ownership checks.',
        type: 'studio',
        priceBDT: 4500,
        bedrooms: 1,
        roommateCapacity: 1,
        parkingAvailable: false,
        facilities: ['WiFi'],
        address: {
          line1: 'Road 9',
          area: 'Uttara',
          city: 'Dhaka',
          district: 'Dhaka',
          latitude: 23.9,
          longitude: 90.39,
        },
        status: 'pending',
      });

    const updated = await request(app)
      .patch(`/api/v1/landlord/listings/${listing.body.data.id}`)
      .set('Authorization', `Bearer ${landlordLogin.body.token}`)
      .send({
        title: 'Updated prime listing',
        priceBDT: 4700,
        status: 'approved',
      });

    expect(updated.status).toBe(200);
    expect(updated.body.data.title).toBe('Updated prime listing');
    expect(updated.body.data.priceBDT).toBe(4700);

    const list = await request(app)
      .get('/api/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordLogin.body.token}`);

    expect(list.status).toBe(200);
    expect(Array.isArray(list.body.data)).toBe(true);
    expect(list.body.data.some((item: { title: string }) => item.title === 'Updated prime listing')).toBe(true);
  });

  it('persists the exact maintenance progress stage across landlord reloads', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Stage Landlord',
      email: 'stage.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: 'LAND-STAGE',
      role: 'landlord',
    });

    const login = await request(app).post('/api/v1/auth/login').send({
      email: 'stage.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
    });
    const token = login.body.token as string;
    const landlordId = login.body.user.id as string;
    seedFixtureMaintenanceRequest(landlordId, 'stage-request-1');

    const updated = await request(app)
      .patch('/api/v1/landlord/maintenance/stage-request-1/status')
      .set('Authorization', `Bearer ${token}`)
      .send({ stage: 4 });

    expect(updated.status).toBe(200);
    expect(updated.body.data.stage).toBe(4);
    expect(updated.body.data.status).toBe('in-progress');

    const reloaded = await request(app)
      .get('/api/v1/landlord/maintenance')
      .set('Authorization', `Bearer ${token}`);

    expect(reloaded.status).toBe(200);
    expect(reloaded.body.data.find((item: { id: string }) => item.id === 'stage-request-1').stage).toBe(4);
  });

  it('allows a landlord to review an application and generate an active lease upon acceptance', async () => {
    await request(app).post('/api/v1/auth/register').send({
      name: 'Review Landlord',
      email: 'review.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: 'LAND-300',
      role: 'landlord',
    });

    const landlordLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'review.landlord@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const listing = await request(app)
      .post('/api/v1/landlord/listings')
      .set('Authorization', `Bearer ${landlordLogin.body.token}`)
      .send({
        title: 'Reviewable Apartment',
        description: 'Listing for lease workflow test.',
        type: 'apartment',
        priceBDT: 6500,
        bedrooms: 2,
        roommateCapacity: 2,
        parkingAvailable: true,
        facilities: ['WiFi'],
        address: {
          line1: 'Badda Link Road',
          area: 'Badda',
          city: 'Dhaka',
          district: 'Dhaka',
          latitude: 23.79,
          longitude: 90.42,
        },
        status: 'approved',
      });
    expect(listing.status).toBe(201);

    await request(app).post('/api/v1/auth/register').send({
      name: 'Applicant Student',
      email: 'applicant.student@uiu.ac.bd',
      password: 'StrongPass123!',
      studentId: '01124000099',
      role: 'student',
    });

    const studentLogin = await request(app).post('/api/v1/auth/login').send({
      email: 'applicant.student@uiu.ac.bd',
      password: 'StrongPass123!',
    });

    const application = await request(app)
      .post('/api/v1/student/applications')
      .set('Authorization', `Bearer ${studentLogin.body.token}`)
      .send({
        propertyId: listing.body.data.id,
        moveInDate: '2026-10-01',
        message: 'Looking forward to moving in!',
        studentCardNo: '01124000099',
        contactPhone: '01700000000',
        employment: 'Student',
      });
    expect(application.status).toBe(201);

    const review = await request(app)
      .patch(`/api/v1/landlord/applications/${application.body.data.id}/status`)
      .set('Authorization', `Bearer ${landlordLogin.body.token}`)
      .send({
        status: 'accepted',
      });
    expect(review.status).toBe(200);
    expect(review.body.data.status).toBe('accepted');

    const leases = await request(app)
      .get('/api/v1/landlord/leases')
      .set('Authorization', `Bearer ${landlordLogin.body.token}`);
    expect(leases.status).toBe(200);
    expect(Array.isArray(leases.body.data)).toBe(true);
    expect(leases.body.data.some((l: { propertyId: string; status: string }) => l.propertyId === listing.body.data.id && l.status === 'active')).toBe(true);
  });
});

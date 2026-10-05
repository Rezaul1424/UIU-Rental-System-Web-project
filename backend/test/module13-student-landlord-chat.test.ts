import { beforeEach, describe, expect, it } from 'vitest';
import request from 'supertest';
import { buildApp } from '../src/app.js';
import { createAuthToken, registerUser, type AuthUser } from '../src/auth/auth.js';

const app = buildApp();

describe('Module 13 student-landlord messaging', () => {
  beforeEach(() => {
    process.env.NODE_ENV = 'test';
  });

  it('persists a student message for the landlord and allows the landlord to reply', async () => {
    const student = await registerUser({
      name: 'Chat Student',
      email: `student-chat-${Date.now()}@uiu.ac.bd`,
      password: 'TestPass123!',
      role: 'student',
    });
    const studentToken = await createAuthToken(student.user);
    const landlordUser: AuthUser = {
      id: '2',
      name: 'Rahman Faruk',
      email: 'faruk@example.com',
      role: 'landlord',
      status: 'active',
    };
    const landlordToken = await createAuthToken(landlordUser);

    const sent = await request(app)
      .post('/api/v1/student/chat')
      .set('Authorization', `Bearer ${studentToken}`)
      .send({ propertyId: 'UIU-1001', message: 'Is parking available?' });
    expect(sent.status).toBe(201);
    expect(sent.body.data.messages).toMatchObject([{ from: 'student', text: 'Is parking available?' }]);

    const landlordInbox = await request(app)
      .get('/api/v1/landlord/chat')
      .set('Authorization', `Bearer ${landlordToken}`);
    expect(landlordInbox.status).toBe(200);
    expect(landlordInbox.body.data[0].messages[0]).toMatchObject({ from: 'student', text: 'Is parking available?' });

    const reply = await request(app)
      .post('/api/v1/landlord/chat')
      .set('Authorization', `Bearer ${landlordToken}`)
      .send({ studentId: student.user.id, propertyId: 'UIU-1001', message: 'Yes, parking is included.' });
    expect(reply.status).toBe(201);

    const studentInbox = await request(app)
      .get('/api/v1/student/chat')
      .set('Authorization', `Bearer ${studentToken}`);
    expect(studentInbox.status).toBe(200);
    expect(studentInbox.body.data[0].messages.map((message: { text: string }) => message.text)).toEqual([
      'Is parking available?',
      'Yes, parking is included.',
    ]);
  });

  it('requires authentication and rejects empty messages', async () => {
    const unauthenticated = await request(app).get('/api/v1/student/chat');
    expect(unauthenticated.status).toBe(401);

    const student = await registerUser({
      name: 'Chat Validation Student',
      email: `student-chat-validation-${Date.now()}@uiu.ac.bd`,
      password: 'TestPass123!',
      role: 'student',
    });
    const token = await createAuthToken(student.user);
    const invalid = await request(app)
      .post('/api/v1/student/chat')
      .set('Authorization', `Bearer ${token}`)
      .send({ propertyId: 'UIU-1001', message: '   ' });
    expect(invalid.status).toBe(400);
  });
});

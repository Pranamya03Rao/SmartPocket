import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import PushSubscription from '../models/PushSubscription.js';
import { env } from '../config/env.js';
import * as pushService from '../services/pushService.js';
import * as webpush from 'web-push';

vi.mock('web-push', () => ({
  setVapidDetails: vi.fn(),
  sendNotification: vi.fn(),
  generateVAPIDKeys: vi.fn(() => ({
    publicKey: 'mock-public-key',
    privateKey: 'mock-private-key',
  })),
}));

describe('Web Push Notification System Tests', () => {
  const userA = { _id: '507f1f77bcf86cd799439011', role: 'worker', email: 'userA@smartpocket.org' };
  const userB = { _id: '507f1f77bcf86cd799439022', role: 'worker', email: 'userB@smartpocket.org' };
  const adminUser = { _id: '507f1f77bcf86cd799439099', role: 'admin', email: 'admin@smartpocket.org' };

  const tokenA = jwt.sign({ sub: userA._id, role: userA.role, email: userA.email }, env.JWT_ACCESS_SECRET);
  const tokenB = jwt.sign({ sub: userB._id, role: userB.role, email: userB.email }, env.JWT_ACCESS_SECRET);
  const tokenAdmin = jwt.sign({ sub: adminUser._id, role: adminUser.role, email: adminUser.email }, env.JWT_ACCESS_SECRET);

  const csrfCookie = 'csrf-token=test-csrf-value';
  const csrfHeader = 'test-csrf-value';

  const validSubData = {
    endpoint: 'https://fcm.googleapis.com/fcm/send/sample-endpoint-123',
    keys: {
      p256dh: 'sample-p256dh-key-value',
      auth: 'sample-auth-key-value',
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(User, 'findById').mockImplementation(async (id) => {
      const idStr = String(id);
      if (idStr === String(userA._id)) return userA;
      if (idStr === String(userB._id)) return userB;
      if (idStr === String(adminUser._id)) return adminUser;
      return null;
    });
  });

  // Test 1: /subscribe and /unsubscribe need auth; a user cannot delete someone else's subscription
  it('1. /subscribe and /unsubscribe require auth, and a user cannot delete someone else\'s subscription', async () => {
    // Unauthenticated subscribe
    const unauthSub = await request(app)
      .post('/api/push/subscribe')
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send(validSubData);
    expect(unauthSub.status).toBe(401);

    // Unauthenticated unsubscribe
    const unauthUnsub = await request(app)
      .post('/api/push/unsubscribe')
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send({ endpoint: validSubData.endpoint });
    expect(unauthUnsub.status).toBe(401);

    // User B attempts to delete User A's subscription (mock subscription in DB belongs to userA)
    vi.spyOn(PushSubscription, 'findOneAndDelete').mockImplementation(async (filter) => {
      // In DB, the subscription belongs to userA
      if (filter.endpoint === validSubData.endpoint && String(filter.userId) === String(userA._id)) {
        return { _id: 'sub123', userId: userA._id };
      }
      return null; // Querying with userB's id matches nothing
    });

    const crossUserRes = await request(app)
      .post('/api/push/unsubscribe')
      .set('Authorization', `Bearer ${tokenB}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send({ endpoint: validSubData.endpoint });

    expect(crossUserRes.status).toBe(404);
    expect(crossUserRes.body.error).toMatch(/not found/i);
  });

  // Test 2: Malformed body is rejected; the same endpoint twice makes no duplicate
  it('2. Malformed body is rejected and subscribing with the same endpoint twice prevents duplicates', async () => {
    // Malformed body: missing keys and invalid endpoint
    const malformedRes = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send({ endpoint: 'not-a-valid-url' });

    expect(malformedRes.status).toBe(400);
    expect(malformedRes.body.error).toBe('Validation failed');

    // Subscribing twice with same endpoint: upserts by endpoint
    let savedRecords = [];
    vi.spyOn(PushSubscription, 'findOneAndUpdate').mockImplementation(async (filter, update) => {
      const existingIdx = savedRecords.findIndex((r) => r.endpoint === filter.endpoint);
      if (existingIdx >= 0) {
        savedRecords[existingIdx] = { ...savedRecords[existingIdx], ...update };
        return { _id: savedRecords[existingIdx]._id, ...savedRecords[existingIdx] };
      }
      const newRec = { _id: `sub_${savedRecords.length + 1}`, ...update };
      savedRecords.push(newRec);
      return newRec;
    });
    vi.spyOn(PushSubscription, 'keepMaxSubscriptions').mockResolvedValue();

    // First subscribe
    const res1 = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send(validSubData);
    expect(res1.status).toBe(201);

    // Second subscribe with same endpoint (e.g. browser re-subscribes or user re-logs)
    const res2 = await request(app)
      .post('/api/push/subscribe')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send(validSubData);
    expect(res2.status).toBe(201);

    // Database still has only 1 document for this endpoint
    expect(savedRecords.filter((r) => r.endpoint === validSubData.endpoint)).toHaveLength(1);
  });

  // Test 3: /vapid-public-key never returns the private key
  it('3. /vapid-public-key never returns the private key', async () => {
    const res = await request(app).get('/api/push/vapid-public-key');

    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('publicKey');
    expect(typeof res.body.publicKey).toBe('string');
    expect(res.body).not.toHaveProperty('privateKey');
    expect(res.body).not.toHaveProperty('VAPID_PRIVATE_KEY');
    expect(JSON.stringify(res.body)).not.toContain('private');
  });

  // Test 4: The service deletes a subscription on 410 and 404
  it('4. The service deletes a subscription on 410 and 404 error responses', async () => {
    const deleteSpy = vi.spyOn(PushSubscription, 'deleteOne').mockResolvedValue({ deletedCount: 1 });

    // Mock 410 Gone error
    const err410 = new Error('Subscription has expired or is invalid');
    err410.statusCode = 410;
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(err410);

    const sub410 = {
      _id: 'sub-410-id',
      endpoint: 'https://push.example.com/expired',
      keys: { p256dh: 'key1', auth: 'auth1' },
      failureCount: 0,
    };
    vi.spyOn(PushSubscription, 'find').mockResolvedValueOnce([sub410]);

    await pushService.sendPushToUser('507f1f77bcf86cd799439011', {
      title: 'Test',
      body: 'Test 410 cleanup',
    });

    expect(deleteSpy).toHaveBeenCalledWith({ _id: sub410._id });
    deleteSpy.mockClear();

    // Mock 404 Not Found error
    const err404 = new Error('Subscription not found on endpoint');
    err404.statusCode = 404;
    vi.mocked(webpush.sendNotification).mockRejectedValueOnce(err404);

    const sub404 = {
      _id: 'sub-404-id',
      endpoint: 'https://push.example.com/not-found',
      keys: { p256dh: 'key2', auth: 'auth2' },
      failureCount: 0,
    };
    vi.spyOn(PushSubscription, 'find').mockResolvedValueOnce([sub404]);

    await pushService.sendPushToUser('507f1f77bcf86cd799439011', {
      title: 'Test',
      body: 'Test 404 cleanup',
    });

    expect(deleteSpy).toHaveBeenCalledWith({ _id: sub404._id });
  });

  // Test 5: /send rejects non-admin users
  it('5. /send rejects non-admin users with 403 Forbidden', async () => {
    const resNonAdmin = await request(app)
      .post('/api/push/send')
      .set('Authorization', `Bearer ${tokenA}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send({
        broadcast: true,
        title: 'Emergency Notice',
        body: 'Only admins should be able to broadcast this',
      });

    expect(resNonAdmin.status).toBe(403);
    expect(resNonAdmin.body.error).toMatch(/insufficient permissions/i);

    // Admin user can access /send
    vi.spyOn(PushSubscription, 'find').mockResolvedValue([]);
    const resAdmin = await request(app)
      .post('/api/push/send')
      .set('Authorization', `Bearer ${tokenAdmin}`)
      .set('Cookie', [csrfCookie])
      .set('X-CSRF-Token', csrfHeader)
      .send({
        broadcast: true,
        title: 'Admin Broadcast',
        body: 'Notice from admin',
      });

    expect(resAdmin.status).toBe(200);
    expect(resAdmin.body.message).toContain('Broadcast push notification sent');
  });
});

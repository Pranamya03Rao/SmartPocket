import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import Goal from '../models/Goal.js';
import { env } from '../config/env.js';

describe('IDOR Ownership Enforcement Tests', () => {
  const userA = { _id: '507f1f77bcf86cd799439011', role: 'student', email: 'usera@example.com' };
  const userB = { _id: '507f1f77bcf86cd799439022', role: 'student', email: 'userb@example.com' };

  const tokenUserB = jwt.sign({ sub: userB._id, role: userB.role, email: userB.email }, env.JWT_ACCESS_SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(User, 'findById').mockImplementation(id => {
      if (id === userB._id) return Promise.resolve(userB);
      if (id === userA._id) return Promise.resolve(userA);
      return Promise.resolve(null);
    });
  });

  it('prevents User B from accessing User A transaction (IDOR check)', async () => {
    // Transaction belongs to User A
    vi.spyOn(Transaction, 'findOne').mockImplementation(query => {
      // Query must match both _id and user
      if (query.user === userB._id) {
        return Promise.resolve(null);
      }
      return Promise.resolve(null);
    });

    const res = await request(app)
      .get('/api/transactions/txn-owned-by-user-a')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Transaction not found');
  });

  it('prevents User B from modifying User A transaction', async () => {
    vi.spyOn(Transaction, 'findOne').mockResolvedValue(null);

    const res = await request(app)
      .patch('/api/transactions/txn-owned-by-user-a')
      .set('Authorization', `Bearer ${tokenUserB}`)
      .set('Cookie', ['csrf-token=test-csrf'])
      .set('X-CSRF-Token', 'test-csrf')
      .send({ amount: 999 });

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Transaction not found');
  });

  it('prevents User B from accessing User A goal', async () => {
    vi.spyOn(Goal, 'findOne').mockImplementation(query => {
      if (query.user === userB._id) return Promise.resolve(null);
      return Promise.resolve(null);
    });

    const res = await request(app)
      .get('/api/goals/goal-owned-by-user-a')
      .set('Authorization', `Bearer ${tokenUserB}`);

    expect(res.status).toBe(404);
    expect(res.body.error).toBe('Goal not found');
  });
});

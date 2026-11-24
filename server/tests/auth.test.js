import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import bcrypt from 'bcrypt';
import crypto from 'crypto';

describe('Auth System Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('rejects registration with invalid email or weak password', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Student',
        email: 'invalid-email',
        password: 'weak',
      });

    expect(res.status).toBe(400);
    expect(res.body.error).toBe('Validation failed');
  });

  it('registers a user successfully with strong password', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockResolvedValue({
      _id: '507f1f77bcf86cd799439011',
      name: 'Test Student',
      email: 'student@example.com',
      role: 'student',
      toJSON: () => ({ name: 'Test Student', email: 'student@example.com' }),
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Student',
        email: 'student@example.com',
        password: 'StrongPassword123',
      });

    expect(res.status).toBe(201);
    expect(res.body.message).toContain('Registration successful');
  });

  it('locks account after 5 failed login attempts', async () => {
    const mockUser = {
      _id: '507f1f77bcf86cd799439011',
      email: 'student@example.com',
      passwordHash: await bcrypt.hash('CorrectPassword123', 10),
      failedLoginCount: 4,
      isLocked: () => false,
      save: vi.fn().mockResolvedValue(true),
    };

    vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue(mockUser),
    });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'student@example.com',
        password: 'WrongPassword123',
      });

    expect(res.status).toBe(429);
    expect(res.body.error).toContain('Account locked');
    expect(mockUser.save).toHaveBeenCalled();
  });

  it('revokes entire token family when refresh token reuse is detected', async () => {
    const reusedTokenDoc = {
      _id: 'token123',
      family: 'family-abc-123',
      replacedBy: 'token456', // Already rotated!
      expiresAt: new Date(Date.now() + 100000),
      save: vi.fn(),
    };

    vi.spyOn(RefreshToken, 'findOne').mockResolvedValue(reusedTokenDoc);
    const deleteManySpy = vi.spyOn(RefreshToken, 'deleteMany').mockResolvedValue({ deletedCount: 2 });

    const res = await request(app)
      .post('/api/auth/refresh')
      .set('Cookie', ['refreshToken=stale-token-xyz']);

    expect(res.status).toBe(403);
    expect(res.body.error).toContain('Token reuse detected');
    expect(deleteManySpy).toHaveBeenCalledWith({ family: 'family-abc-123' });
  });
});

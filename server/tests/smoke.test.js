import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../app.js';
import User from '../models/User.js';
import RefreshToken from '../models/RefreshToken.js';
import Transaction from '../models/Transaction.js';
import MerchantCategory from '../models/MerchantCategory.js';
import * as geminiService from '../services/geminiService.js';
import { fileTypeFromBuffer } from 'file-type';
import bcrypt from 'bcrypt';

vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));

describe('Complete End-to-End User Flow Smoke Test', () => {
  let createdUser = null;
  let authToken = null;
  let csrfCookie = null;
  let rawVerifyToken = null;

  beforeEach(() => {
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/png', ext: 'png' });
  });

  it('Flow 1: User registers account and receives verification email', async () => {
    vi.spyOn(User, 'findOne').mockResolvedValue(null);
    vi.spyOn(User, 'create').mockImplementation(async data => {
      createdUser = {
        _id: '507f1f77bcf86cd799439011',
        name: data.name,
        email: data.email,
        passwordHash: data.passwordHash,
        emailVerifyToken: data.emailVerifyToken,
        emailVerifyExpires: data.emailVerifyExpires,
        emailVerified: false,
        role: 'student',
        profile: data.profile,
        save: vi.fn().mockResolvedValue(true),
        isLocked: () => false,
        toJSON: () => ({ name: data.name, email: data.email, role: 'student' }),
      };
      return createdUser;
    });

    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Arjun Verma',
        email: 'arjun@college.edu',
        password: 'CollegePassword123',
        profile: { course: 'B.Tech IT', year: 2, monthlyAllowance: 8000 },
      });

    expect(res.status).toBe(201);
    expect(res.body.devVerifyToken).toBeDefined();
    rawVerifyToken = res.body.devVerifyToken;
  });

  it('Flow 2: User verifies email address', async () => {
    vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue(createdUser),
    });

    const res = await request(app)
      .post('/api/auth/verify-email')
      .send({ token: rawVerifyToken });

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('successfully verified');
    createdUser.emailVerified = true;
  });

  it('Flow 3: User logs in and receives access token and CSRF cookie', async () => {
    createdUser.passwordHash = await bcrypt.hash('CollegePassword123', 10);
    vi.spyOn(User, 'findOne').mockReturnValue({
      select: vi.fn().mockResolvedValue(createdUser),
    });
    vi.spyOn(RefreshToken, 'create').mockResolvedValue({ _id: 'ref123' });

    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: 'arjun@college.edu',
        password: 'CollegePassword123',
      });

    expect(res.status).toBe(200);
    expect(res.body.accessToken).toBeDefined();
    authToken = res.body.accessToken;

    const cookies = res.headers['set-cookie'] || [];
    const csrfMatch = cookies.find(c => c.startsWith('csrf-token='));
    expect(csrfMatch).toBeDefined();
    csrfCookie = csrfMatch.split(';')[0].split('=')[1];
  });

  it('Flow 4: User creates manual transaction with encrypted notes', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue(createdUser);
    vi.spyOn(Transaction, 'findOne').mockResolvedValue(null);
    vi.spyOn(Transaction, 'create').mockImplementation(async data => ({
      _id: 'txn001',
      ...data,
      toObject: () => ({ _id: 'txn001', ...data }),
    }));

    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Cookie', [`csrf-token=${csrfCookie}`])
      .set('X-CSRF-Token', csrfCookie)
      .send({
        date: '2026-10-30',
        merchant: 'Hostel Mess',
        amount: 2500,
        type: 'expense',
        category: 'food',
        paymentMode: 'upi',
        notes: 'Monthly mess advance fee',
      });

    expect(res.status).toBe(201);
    expect(res.body.transaction.merchant).toBe('Hostel Mess');
    expect(res.body.transaction.notes).toBe('Monthly mess advance fee'); // Decrypted
  });

  it('Flow 5: User uploads bill to Gemini AI pipeline and reviews draft', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue(createdUser);
    vi.spyOn(geminiService, 'parseDocumentWithGemini').mockResolvedValue([
      {
        date: '2026-10-30',
        merchant: 'Campus Stationery',
        amount: 320,
        category: 'education',
        paymentMode: 'cash',
        notes: 'Lab manual + notebook',
      },
    ]);
    vi.spyOn(MerchantCategory, 'find').mockResolvedValue([]);
    vi.spyOn(Transaction, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .post('/api/uploads/analyze')
      .set('Authorization', `Bearer ${authToken}`)
      .attach('file', Buffer.from('fake-receipt-bytes'), 'stationery_bill.png');

    expect(res.status).toBe(200);
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].merchant).toBe('Campus Stationery');
    expect(res.body.transactions[0].selected).toBe(true);
    expect(res.body.transactions[0].isDuplicate).toBe(false);
  });

  it('Flow 6: User confirms draft into transaction database', async () => {
    vi.spyOn(User, 'findById').mockResolvedValue(createdUser);
    vi.spyOn(MerchantCategory, 'bulkWrite').mockResolvedValue({});
    vi.spyOn(Transaction, 'insertMany').mockResolvedValue([{ _id: 'imported_txn_1' }]);

    const res = await request(app)
      .post('/api/uploads/confirm')
      .set('Authorization', `Bearer ${authToken}`)
      .set('Cookie', [`csrf-token=${csrfCookie}`])
      .set('X-CSRF-Token', csrfCookie)
      .send({
        source: 'receipt',
        transactions: [
          {
            date: '2026-10-30',
            merchant: 'Campus Stationery',
            amount: 320,
            category: 'education',
            paymentMode: 'cash',
            notes: 'Lab manual + notebook',
            selected: true,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.insertedCount).toBe(1);
  });
});

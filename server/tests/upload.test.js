import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import jwt from 'jsonwebtoken';
import app from '../app.js';
import User from '../models/User.js';
import Transaction from '../models/Transaction.js';
import MerchantCategory from '../models/MerchantCategory.js';
import * as geminiService from '../services/geminiService.js';
import { fileTypeFromBuffer } from 'file-type';

vi.mock('file-type', () => ({
  fileTypeFromBuffer: vi.fn(),
}));
import { env } from '../config/env.js';

describe('AI Upload Pipeline Tests', () => {
  const user = { _id: '507f1f77bcf86cd799439011', role: 'student', email: 'uploader@example.com' };
  const token = jwt.sign({ sub: user._id, role: user.role, email: user.email }, env.JWT_ACCESS_SECRET);

  beforeEach(() => {
    vi.clearAllMocks();
    vi.spyOn(User, 'findById').mockResolvedValue(user);
  });

  it('analyzes image receipt with mocked Gemini and returns DRAFT without persisting', async () => {
    // Mock file-type detection to PNG
    vi.mocked(fileTypeFromBuffer).mockResolvedValue({ mime: 'image/png', ext: 'png' });

    // Mock Gemini extraction
    vi.spyOn(geminiService, 'parseDocumentWithGemini').mockResolvedValue([
      {
        date: '2026-10-30',
        merchant: 'College Canteen',
        amount: 150,
        category: 'food',
        paymentMode: 'upi',
        notes: 'Lunch thali',
      },
    ]);

    // Mock merchant override lookup
    vi.spyOn(MerchantCategory, 'find').mockResolvedValue([]);
    // Mock existing transaction lookup (no duplicate)
    vi.spyOn(Transaction, 'find').mockReturnValue({
      select: vi.fn().mockResolvedValue([]),
    });

    const res = await request(app)
      .post('/api/uploads/analyze')
      .set('Authorization', `Bearer ${token}`)
      .attach('file', Buffer.from('fake-image-bytes'), 'receipt.png');

    expect(res.status).toBe(200);
    expect(res.body.message).toContain('DRAFT ONLY');
    expect(res.body.transactions).toHaveLength(1);
    expect(res.body.transactions[0].merchant).toBe('College Canteen');
    expect(res.body.transactions[0].isDuplicate).toBe(false);
    expect(res.body.transactions[0].selected).toBe(true);
  });

  it('confirms draft transactions and batch inserts them', async () => {
    vi.spyOn(MerchantCategory, 'bulkWrite').mockResolvedValue({});
    vi.spyOn(Transaction, 'insertMany').mockResolvedValue([
      { _id: 'txn1' },
      { _id: 'txn2' },
    ]);

    const res = await request(app)
      .post('/api/uploads/confirm')
      .set('Authorization', `Bearer ${token}`)
      .set('Cookie', ['csrf-token=test-csrf'])
      .set('X-CSRF-Token', 'test-csrf')
      .send({
        source: 'receipt',
        transactions: [
          {
            date: '2026-10-30',
            merchant: 'Campus Books',
            amount: 450,
            category: 'education',
            paymentMode: 'card',
            notes: 'Algorithms book',
            selected: true,
          },
          {
            date: '2026-10-30',
            merchant: 'Chai Point',
            amount: 40,
            category: 'food',
            paymentMode: 'upi',
            selected: true,
          },
        ],
      });

    expect(res.status).toBe(201);
    expect(res.body.insertedCount).toBe(2);
    expect(res.body.skippedCount).toBe(0);
  });
});

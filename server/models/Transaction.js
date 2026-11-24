import mongoose from 'mongoose';
import { CATEGORIES, PAYMENT_MODES, TRANSACTION_TYPES, SOURCES, FREQUENCIES } from '../utils/constants.js';

const transactionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    merchant: { type: String, required: true, trim: true, maxlength: 200 },
    amount: { type: Number, required: true, min: 0 },
    type: { type: String, enum: TRANSACTION_TYPES, required: true },
    category: { type: String, enum: CATEGORIES, required: true },
    paymentMode: { type: String, enum: PAYMENT_MODES, default: 'other' },
    notes: { type: String, default: '' }, // Stored AES-256-GCM encrypted
    source: { type: String, enum: SOURCES, default: 'manual' },
    recurring: {
      frequency: { type: String, enum: FREQUENCIES },
      nextDate: { type: Date },
    },
    fingerprint: { type: String },
  },
  { timestamps: true }
);

// Composite unique sparse index for duplicate detection per user
transactionSchema.index({ user: 1, fingerprint: 1 }, { unique: true, sparse: true });
transactionSchema.index({ user: 1, date: -1 });
transactionSchema.index({ user: 1, category: 1 });

const Transaction = mongoose.model('Transaction', transactionSchema);
export default Transaction;

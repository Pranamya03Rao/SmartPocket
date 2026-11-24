import mongoose from 'mongoose';
import { CATEGORIES, BUDGET_PERIODS } from '../utils/constants.js';

const categoryLimitSchema = new mongoose.Schema(
  {
    category: { type: String, enum: CATEGORIES, required: true },
    limit: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const budgetSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    period: { type: String, enum: BUDGET_PERIODS, required: true },
    month: { type: Number, min: 1, max: 12 },
    year: { type: Number, min: 2020, max: 2100 },
    totalLimit: { type: Number, min: 0, default: 0 },
    categoryLimits: [categoryLimitSchema],
  },
  { timestamps: true }
);

budgetSchema.index({ user: 1, period: 1, month: 1, year: 1 }, { unique: true });

const Budget = mongoose.model('Budget', budgetSchema);
export default Budget;

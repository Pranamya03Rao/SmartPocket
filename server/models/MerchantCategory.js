import mongoose from 'mongoose';
import { CATEGORIES } from '../utils/constants.js';

const merchantCategorySchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    merchant: { type: String, required: true, lowercase: true, trim: true },
    category: { type: String, enum: CATEGORIES, required: true },
  },
  { timestamps: true }
);

merchantCategorySchema.index({ user: 1, merchant: 1 }, { unique: true });

const MerchantCategory = mongoose.model('MerchantCategory', merchantCategorySchema);
export default MerchantCategory;

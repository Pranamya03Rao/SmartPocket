import mongoose from 'mongoose';

const shareSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    value: { type: Number, required: true, min: 0 },
  },
  { _id: false }
);

const groupExpenseSchema = new mongoose.Schema(
  {
    group: { type: mongoose.Schema.Types.ObjectId, ref: 'Group', required: true, index: true },
    description: { type: String, required: true, trim: true, maxlength: 300 },
    amount: { type: Number, required: true, min: 0.01 },
    paidBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    splitType: { type: String, enum: ['equal', 'percent', 'custom'], default: 'equal' },
    shares: [shareSchema], // each member's share (amount for equal/custom, percent for percent)
    isSettlement: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const GroupExpense = mongoose.model('GroupExpense', groupExpenseSchema);
export default GroupExpense;

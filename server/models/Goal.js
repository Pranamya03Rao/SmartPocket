import mongoose from 'mongoose';

const milestoneSchema = new mongoose.Schema(
  {
    percent: { type: Number, required: true },
    achievedAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const goalSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true, maxlength: 200 },
    target: { type: Number, required: true, min: 1 },
    saved: { type: Number, default: 0, min: 0 },
    deadline: { type: Date, required: true },
    milestones: [milestoneSchema],
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

goalSchema.virtual('progress').get(function () {
  return Math.min(100, Math.round((this.saved / this.target) * 100));
});

goalSchema.virtual('requiredWeeklySaving').get(function () {
  const remaining = this.target - this.saved;
  if (remaining <= 0) return 0;
  const msLeft = Math.max(0, this.deadline - new Date());
  const weeksLeft = Math.max(1, Math.ceil(msLeft / (7 * 24 * 60 * 60 * 1000)));
  return Math.ceil(remaining / weeksLeft);
});

goalSchema.virtual('requiredMonthlySaving').get(function () {
  const remaining = this.target - this.saved;
  if (remaining <= 0) return 0;
  const msLeft = Math.max(0, this.deadline - new Date());
  const monthsLeft = Math.max(1, Math.ceil(msLeft / (30 * 24 * 60 * 60 * 1000)));
  return Math.ceil(remaining / monthsLeft);
});

const Goal = mongoose.model('Goal', goalSchema);
export default Goal;

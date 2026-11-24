import mongoose from 'mongoose';

const userProgressSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true, index: true },
    completedLessons: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Lesson' }],
    points: { type: Number, default: 0, min: 0 },
    streak: { type: Number, default: 0, min: 0 },
    lastActivityDate: { type: Date },
    badges: [
      {
        name: { type: String, required: true },
        earnedAt: { type: Date, default: Date.now },
        _id: false,
      },
    ],
    alias: { type: String, default: '' }, // random anonymous alias for leaderboard
    optInLeaderboard: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const UserProgress = mongoose.model('UserProgress', userProgressSchema);
export default UserProgress;

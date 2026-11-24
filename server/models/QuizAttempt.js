import mongoose from 'mongoose';

const quizAttemptSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    quiz: { type: mongoose.Schema.Types.ObjectId, ref: 'Quiz', required: true },
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true },
    answers: [{ type: Number }], // index chosen for each question
    score: { type: Number, required: true, min: 0 },
    total: { type: Number, required: true, min: 1 },
    passed: { type: Boolean, default: false },
  },
  { timestamps: true }
);

quizAttemptSchema.index({ user: 1, quiz: 1 });

const QuizAttempt = mongoose.model('QuizAttempt', quizAttemptSchema);
export default QuizAttempt;

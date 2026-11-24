import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true, maxlength: 500 },
    options: {
      type: [String],
      required: true,
      validate: [arr => arr.length >= 2 && arr.length <= 6, 'Must have 2-6 options'],
    },
    correctIndex: { type: Number, required: true, min: 0 },
    explanation: { type: String, default: '', maxlength: 1000 },
  },
  { _id: false }
);

const quizSchema = new mongoose.Schema(
  {
    lesson: { type: mongoose.Schema.Types.ObjectId, ref: 'Lesson', required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 200 },
    questions: {
      type: [questionSchema],
      required: true,
      validate: [arr => arr.length >= 1, 'Must have at least 1 question'],
    },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Quiz = mongoose.model('Quiz', quizSchema);
export default Quiz;

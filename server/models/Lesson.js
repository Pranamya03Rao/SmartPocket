import mongoose from 'mongoose';

const lessonSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true, maxlength: 200 },
    slug: { type: String, required: true, unique: true, trim: true, lowercase: true },
    content: { type: String, required: true, maxlength: 5000 },
    order: { type: Number, required: true, default: 0 },
    category: { type: String, default: 'general', trim: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

lessonSchema.index({ order: 1 });

const Lesson = mongoose.model('Lesson', lessonSchema);
export default Lesson;

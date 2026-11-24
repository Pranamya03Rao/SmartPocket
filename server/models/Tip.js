import mongoose from 'mongoose';

const tipSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, maxlength: 500 },
    category: { type: String, default: 'general', trim: true },
    published: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Tip = mongoose.model('Tip', tipSchema);
export default Tip;

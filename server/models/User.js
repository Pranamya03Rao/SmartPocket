import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 100 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Invalid email'],
    },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ['student', 'admin', 'worker'], default: 'worker' },
    emailVerified: { type: Boolean, default: false },
    emailVerifyToken: { type: String, select: false },
    emailVerifyExpires: { type: Date, select: false },
    passwordResetToken: { type: String, select: false },
    passwordResetExpires: { type: Date, select: false },
    failedLoginCount: { type: Number, default: 0 },
    lockUntil: { type: Date },
    twoFactor: {
      enabled: { type: Boolean, default: false },
      otpHash: { type: String, select: false },
      otpExpires: { type: Date, select: false },
    },
    profile: {
      occupation: { type: String, default: 'worker', maxlength: 100 },
      incomeType: { type: String, enum: ['daily', 'weekly', 'monthly'], default: 'daily' },
      dailyWage: { type: Number, default: 0, min: 0 },
      monthlyIncome: { type: Number, default: 0, min: 0 },
      course: { type: String, default: '', maxlength: 100 },
      year: { type: Number, min: 1, max: 6, default: 1 },
      monthlyAllowance: { type: Number, default: 0, min: 0 },
      currency: { type: String, default: 'INR', maxlength: 3 },
      language: { type: String, default: 'kn', maxlength: 5 },
    },
  },
  {
    timestamps: true,
    toJSON: {
      transform(_doc, ret) {
        delete ret.passwordHash;
        delete ret.emailVerifyToken;
        delete ret.emailVerifyExpires;
        delete ret.passwordResetToken;
        delete ret.passwordResetExpires;
        delete ret.__v;
        if (ret.twoFactor) {
          delete ret.twoFactor.otpHash;
          delete ret.twoFactor.otpExpires;
        }
        return ret;
      },
    },
  }
);

userSchema.methods.isLocked = function () {
  return !!(this.lockUntil && this.lockUntil > new Date());
};

const User = mongoose.model('User', userSchema);
export default User;

import mongoose from 'mongoose';

const pushSubscriptionSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    keys: {
      p256dh: {
        type: String,
        required: true,
        trim: true,
      },
      auth: {
        type: String,
        required: true,
        trim: true,
      },
    },
    expirationTime: {
      type: Number,
      default: null,
    },
    userAgent: {
      type: String,
      default: '',
    },
    failureCount: {
      type: Number,
      default: 0,
      min: 0,
    },
  },
  {
    timestamps: true,
  }
);

pushSubscriptionSchema.statics.keepMaxSubscriptions = async function (userId, max = 10) {
  const subscriptions = await this.find({ userId }).sort({ createdAt: -1 });
  if (subscriptions.length > max) {
    const toRemove = subscriptions.slice(max).map(s => s._id);
    await this.deleteMany({ _id: { $in: toRemove } });
  }
};

const PushSubscription = mongoose.model('PushSubscription', pushSubscriptionSchema);
export default PushSubscription;

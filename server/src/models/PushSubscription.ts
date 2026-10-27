import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IPushSubscriptionKeys {
  p256dh: string;
  auth: string;
}

export interface IPushSubscription extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  deviceIdentifier: string; // e.g., 'Windows Chrome', 'Android Pixel'
  endpoint: string;
  keys: IPushSubscriptionKeys;
  userAgent?: string;
  active: boolean;
  lastUsedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const PushSubscriptionSchema = new Schema<IPushSubscription>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    deviceIdentifier: {
      type: String,
      required: true,
      trim: true,
    },
    endpoint: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    keys: {
      p256dh: { type: String, required: true },
      auth: { type: String, required: true },
    },
    userAgent: {
      type: String,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    lastUsedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

PushSubscriptionSchema.index({ ownerId: 1, active: 1 });

export const PushSubscription = mongoose.model<IPushSubscription>(
  'PushSubscription',
  PushSubscriptionSchema
);

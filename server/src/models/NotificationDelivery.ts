import mongoose, { Document, Schema, Types } from 'mongoose';

export type NotificationChannel = 'push' | 'in_app';
export type NotificationDeliveryStatus = 'sent' | 'failed' | 'invalid_sub';

export interface INotificationDelivery extends Document {
  _id: Types.ObjectId;
  jobId: Types.ObjectId;
  occurrenceId: Types.ObjectId;
  ownerId: Types.ObjectId;
  subscriptionId?: Types.ObjectId;
  channel: NotificationChannel;
  status: NotificationDeliveryStatus;
  responseStatusCode?: number;
  errorMessage?: string;
  sentAt: Date;
  createdAt: Date;
}

const NotificationDeliverySchema = new Schema<INotificationDelivery>(
  {
    jobId: {
      type: Schema.Types.ObjectId,
      ref: 'ReminderJob',
      required: true,
      index: true,
    },
    occurrenceId: {
      type: Schema.Types.ObjectId,
      ref: 'DoseOccurrence',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    subscriptionId: {
      type: Schema.Types.ObjectId,
      ref: 'PushSubscription',
    },
    channel: {
      type: String,
      enum: ['push', 'in_app'],
      required: true,
      default: 'push',
    },
    status: {
      type: String,
      enum: ['sent', 'failed', 'invalid_sub'],
      required: true,
    },
    responseStatusCode: {
      type: Number,
    },
    errorMessage: {
      type: String,
    },
    sentAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

NotificationDeliverySchema.index({ ownerId: 1, sentAt: -1 });

export const NotificationDelivery = mongoose.model<INotificationDelivery>(
  'NotificationDelivery',
  NotificationDeliverySchema
);

import mongoose, { Document, Schema, Types } from 'mongoose';

export type ReminderJobStatus =
  | 'scheduled'
  | 'queued'
  | 'sending'
  | 'delivered'
  | 'failed'
  | 'cancelled';

export interface IReminderJob extends Document {
  _id: Types.ObjectId;
  occurrenceId: Types.ObjectId;
  ownerId: Types.ObjectId;
  dueAtUTC: Date;
  status: ReminderJobStatus;
  attempts: number;
  maxAttempts: number;
  leaseExpiresAt?: Date;
  claimedByWorkerId?: string;
  idempotencyKey: string;
  lastError?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ReminderJobSchema = new Schema<IReminderJob>(
  {
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
    dueAtUTC: {
      type: Date,
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['scheduled', 'queued', 'sending', 'delivered', 'failed', 'cancelled'],
      default: 'scheduled',
      index: true,
    },
    attempts: {
      type: Number,
      default: 0,
    },
    maxAttempts: {
      type: Number,
      default: 3,
    },
    leaseExpiresAt: {
      type: Date,
      index: true,
    },
    claimedByWorkerId: {
      type: String,
    },
    idempotencyKey: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    lastError: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

// Worker polling index: find jobs where status is scheduled/queued and dueAtUTC <= now
ReminderJobSchema.index({ status: 1, dueAtUTC: 1, leaseExpiresAt: 1 });

export const ReminderJob = mongoose.model<IReminderJob>('ReminderJob', ReminderJobSchema);

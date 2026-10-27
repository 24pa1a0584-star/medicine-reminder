import mongoose, { Document, Schema, Types } from 'mongoose';

export type DoseOccurrenceState =
  | 'upcoming'
  | 'due'
  | 'unconfirmed'
  | 'taken'
  | 'skipped'
  | 'snoozed';

export type TimeOfDaySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IDoseOccurrence extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  medicineId: Types.ObjectId;
  scheduleId: Types.ObjectId;
  scheduleVersion: number;
  scheduledAtUTC: Date;
  localScheduledDate: string; // 'YYYY-MM-DD'
  localScheduledTime: string; // 'HH:mm'
  timeOfDaySlot: TimeOfDaySlot;
  doseAmount: number;
  doseUnit: string;
  state: DoseOccurrenceState;
  snoozedUntilUTC?: Date;
  snoozeCount: number;
  actionId?: Types.ObjectId;
  superseded: boolean; // True if invalidated by subsequent schedule edit
  createdAt: Date;
  updatedAt: Date;
}

const DoseOccurrenceSchema = new Schema<IDoseOccurrence>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    scheduleId: {
      type: Schema.Types.ObjectId,
      ref: 'MedicineSchedule',
      required: true,
      index: true,
    },
    scheduleVersion: {
      type: Number,
      required: true,
      default: 1,
    },
    scheduledAtUTC: {
      type: Date,
      required: true,
      index: true,
    },
    localScheduledDate: {
      type: String,
      required: true,
      index: true,
    },
    localScheduledTime: {
      type: String,
      required: true,
    },
    timeOfDaySlot: {
      type: String,
      enum: ['morning', 'afternoon', 'evening', 'night'],
      required: true,
      index: true,
    },
    doseAmount: {
      type: Number,
      required: true,
      default: 1,
    },
    doseUnit: {
      type: String,
      required: true,
      default: 'tablet',
    },
    state: {
      type: String,
      enum: ['upcoming', 'due', 'unconfirmed', 'taken', 'skipped', 'snoozed'],
      default: 'upcoming',
      index: true,
    },
    snoozedUntilUTC: {
      type: Date,
    },
    snoozeCount: {
      type: Number,
      default: 0,
    },
    actionId: {
      type: Schema.Types.ObjectId,
      ref: 'DoseAction',
    },
    superseded: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Enforce unique occurrence per schedule & scheduled timestamp
DoseOccurrenceSchema.index(
  { scheduleId: 1, scheduledAtUTC: 1 },
  { unique: true }
);

// Compound queries for user daily dashboard & timeline
DoseOccurrenceSchema.index({ ownerId: 1, localScheduledDate: 1, state: 1 });
DoseOccurrenceSchema.index({ ownerId: 1, scheduledAtUTC: 1 });

export const DoseOccurrence = mongoose.model<IDoseOccurrence>(
  'DoseOccurrence',
  DoseOccurrenceSchema
);

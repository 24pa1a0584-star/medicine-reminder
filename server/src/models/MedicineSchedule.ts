import mongoose, { Document, Schema, Types } from 'mongoose';

export type RecurrenceType = 'daily' | 'specific_days' | 'interval' | 'as_needed';

export interface IReminderPreferences {
  advanceReminderMinutes: number; // e.g., 0 for exact time, 10 for 10 min early
  soundEnabled: boolean;
  allowSnooze: boolean;
  maxSnoozes: number; // Default 3
}

export interface IMedicineSchedule extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  ownerId: Types.ObjectId;
  recurrenceType: RecurrenceType;
  timesOfDay: string[]; // ['08:00', '14:00', '20:00'] (HH:mm 24-hour)
  daysOfWeek: number[]; // 0=Sun, 1=Mon, ..., 6=Sat (for 'specific_days')
  intervalDays?: number; // e.g. 2 for every 2 days (for 'interval')
  startDate: Date;
  endDate?: Date;
  timeZone: string; // e.g., 'Asia/Kolkata'
  version: number; // Monotonically increasing version
  active: boolean;
  reminderPreferences: IReminderPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineScheduleSchema = new Schema<IMedicineSchedule>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    recurrenceType: {
      type: String,
      enum: ['daily', 'specific_days', 'interval', 'as_needed'],
      required: true,
      default: 'daily',
    },
    timesOfDay: {
      type: [String],
      required: true,
      default: ['08:00'],
      validate: {
        validator: function (times: string[]) {
          return times.every((t) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(t));
        },
        message: 'All times of day must be in HH:mm 24-hour format',
      },
    },
    daysOfWeek: {
      type: [Number],
      default: [],
      validate: {
        validator: function (days: number[]) {
          return days.every((d) => d >= 0 && d <= 6);
        },
        message: 'Day of week must be between 0 (Sunday) and 6 (Saturday)',
      },
    },
    intervalDays: {
      type: Number,
      min: 1,
      max: 365,
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    timeZone: {
      type: String,
      required: true,
      default: 'Asia/Kolkata',
    },
    version: {
      type: Number,
      required: true,
      default: 1,
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    reminderPreferences: {
      advanceReminderMinutes: { type: Number, default: 0 },
      soundEnabled: { type: Boolean, default: true },
      allowSnooze: { type: Boolean, default: true },
      maxSnoozes: { type: Number, default: 3 },
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes
MedicineScheduleSchema.index({ ownerId: 1, active: 1 });
MedicineScheduleSchema.index({ medicineId: 1, version: 1 });

export const MedicineSchedule = mongoose.model<IMedicineSchedule>(
  'MedicineSchedule',
  MedicineScheduleSchema
);

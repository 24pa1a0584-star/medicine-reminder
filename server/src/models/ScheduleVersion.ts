import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IScheduleVersion extends Document {
  medicineId: Types.ObjectId;
  scheduleId: Types.ObjectId;
  ownerId: Types.ObjectId;
  version: number;
  snapshot: Record<string, unknown>;
  changeReason?: string;
  changedAt: Date;
}

const ScheduleVersionSchema = new Schema<IScheduleVersion>(
  {
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
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    version: {
      type: Number,
      required: true,
    },
    snapshot: {
      type: Schema.Types.Mixed,
      required: true,
    },
    changeReason: {
      type: String,
      maxlength: 300,
    },
    changedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

ScheduleVersionSchema.index({ scheduleId: 1, version: 1 }, { unique: true });

export const ScheduleVersion = mongoose.model<IScheduleVersion>(
  'ScheduleVersion',
  ScheduleVersionSchema
);

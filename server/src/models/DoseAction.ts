import mongoose, { Document, Schema, Types } from 'mongoose';

export type DoseActionType = 'taken' | 'skipped' | 'snoozed' | 'dismissed';

export interface IDoseActionAudit {
  correctedAt: Date;
  previousAction: DoseActionType;
  newAction: DoseActionType;
  reason?: string;
  sourceDevice?: string;
}

export interface IDoseAction extends Document {
  _id: Types.ObjectId;
  occurrenceId: Types.ObjectId;
  medicineId: Types.ObjectId;
  ownerId: Types.ObjectId;
  actionType: DoseActionType;
  recordedAtUTC: Date;
  reportedTakenAtUTC?: Date;
  sourceDevice?: string;
  notes?: string;
  previousState?: string;
  correctionAudit: IDoseActionAudit[];
  createdAt: Date;
  updatedAt: Date;
}

const DoseActionSchema = new Schema<IDoseAction>(
  {
    occurrenceId: {
      type: Schema.Types.ObjectId,
      ref: 'DoseOccurrence',
      required: true,
      index: true,
    },
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
    actionType: {
      type: String,
      enum: ['taken', 'skipped', 'snoozed', 'dismissed'],
      required: true,
    },
    recordedAtUTC: {
      type: Date,
      required: true,
      default: Date.now,
    },
    reportedTakenAtUTC: {
      type: Date,
    },
    sourceDevice: {
      type: String,
      default: 'web',
    },
    notes: {
      type: String,
      maxlength: 300,
    },
    previousState: {
      type: String,
    },
    correctionAudit: [
      {
        correctedAt: { type: Date, default: Date.now },
        previousAction: { type: String, required: true },
        newAction: { type: String, required: true },
        reason: { type: String },
        sourceDevice: { type: String },
      },
    ],
  },
  {
    timestamps: true,
  }
);

DoseActionSchema.index({ ownerId: 1, recordedAtUTC: -1 });

export const DoseAction = mongoose.model<IDoseAction>('DoseAction', DoseActionSchema);

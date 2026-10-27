import mongoose, { Document, Schema, Types } from 'mongoose';

export type FormulationType =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'drops'
  | 'inhaler'
  | 'injection'
  | 'topical'
  | 'other';

export type MedicineStatus = 'active' | 'paused' | 'archived';

export interface IMedicine extends Document {
  _id: Types.ObjectId;
  ownerId: Types.ObjectId;
  name: string;
  genericName?: string;
  brandName?: string;
  formulation: FormulationType;
  strength: string; // e.g., "500 mg", "10 ml"
  doseAmount: number; // e.g., 1, 2
  doseUnit: string; // e.g., "tablet", "spoon", "drops"
  route?: string; // e.g., "oral", "nasal", "topical"
  instructions?: string; // e.g., "Take after breakfast with water"
  color: string; // HEX color for visual identity (e.g., #10B981)
  icon: string; // Icon identifier (e.g., "pill", "bottle", "droplet")
  startDate: Date;
  endDate?: Date;
  prescriptionReference?: string;
  notes?: string;
  status: MedicineStatus;
  createdAt: Date;
  updatedAt: Date;
}

const MedicineSchema = new Schema<IMedicine>(
  {
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 1,
      maxlength: 120,
    },
    genericName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    brandName: {
      type: String,
      trim: true,
      maxlength: 120,
    },
    formulation: {
      type: String,
      enum: ['tablet', 'capsule', 'liquid', 'drops', 'inhaler', 'injection', 'topical', 'other'],
      default: 'tablet',
    },
    strength: {
      type: String,
      required: true,
      trim: true,
      maxlength: 60,
    },
    doseAmount: {
      type: Number,
      required: true,
      min: 0.1,
      default: 1,
    },
    doseUnit: {
      type: String,
      required: true,
      trim: true,
      default: 'tablet',
    },
    route: {
      type: String,
      trim: true,
      default: 'oral',
    },
    instructions: {
      type: String,
      trim: true,
      maxlength: 300,
    },
    color: {
      type: String,
      default: '#10B981', // Healing Emerald default
    },
    icon: {
      type: String,
      default: 'pill',
    },
    startDate: {
      type: Date,
      required: true,
      default: Date.now,
    },
    endDate: {
      type: Date,
    },
    prescriptionReference: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['active', 'paused', 'archived'],
      default: 'active',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for querying a user's active medicines
MedicineSchema.index({ ownerId: 1, status: 1 });

export const Medicine = mongoose.model<IMedicine>('Medicine', MedicineSchema);

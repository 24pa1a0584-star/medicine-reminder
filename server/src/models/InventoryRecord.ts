import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IInventoryRecord extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  ownerId: Types.ObjectId;
  currentQuantity: number;
  quantityUnit: string;
  unitsPerDose: number;
  lowStockThreshold: number;
  autoDeductOnDose: boolean;
  lastRefillDate?: Date;
  pharmacyNote?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InventoryRecordSchema = new Schema<IInventoryRecord>(
  {
    medicineId: {
      type: Schema.Types.ObjectId,
      ref: 'Medicine',
      required: true,
      unique: true,
      index: true,
    },
    ownerId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    currentQuantity: {
      type: Number,
      required: true,
      min: 0,
      default: 0,
    },
    quantityUnit: {
      type: String,
      required: true,
      default: 'tablets',
    },
    unitsPerDose: {
      type: Number,
      required: true,
      min: 0.1,
      default: 1,
    },
    lowStockThreshold: {
      type: Number,
      required: true,
      min: 0,
      default: 5,
    },
    autoDeductOnDose: {
      type: Boolean,
      default: true,
    },
    lastRefillDate: {
      type: Date,
    },
    pharmacyNote: {
      type: String,
      maxlength: 300,
    },
  },
  {
    timestamps: true,
  }
);

export const InventoryRecord = mongoose.model<IInventoryRecord>(
  'InventoryRecord',
  InventoryRecordSchema
);

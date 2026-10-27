import mongoose, { Document, Schema, Types } from 'mongoose';

export type RefillTransactionType = 'refill' | 'dose_deduction' | 'manual_adjustment';

export interface IRefillTransaction extends Document {
  _id: Types.ObjectId;
  medicineId: Types.ObjectId;
  ownerId: Types.ObjectId;
  transactionType: RefillTransactionType;
  quantityChange: number;
  remainingQuantity: number;
  note?: string;
  recordedAt: Date;
  createdAt: Date;
}

const RefillTransactionSchema = new Schema<IRefillTransaction>(
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
    transactionType: {
      type: String,
      enum: ['refill', 'dose_deduction', 'manual_adjustment'],
      required: true,
    },
    quantityChange: {
      type: Number,
      required: true,
    },
    remainingQuantity: {
      type: Number,
      required: true,
      min: 0,
    },
    note: {
      type: String,
      maxlength: 300,
    },
    recordedAt: {
      type: Date,
      default: Date.now,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

RefillTransactionSchema.index({ ownerId: 1, recordedAt: -1 });

export const RefillTransaction = mongoose.model<IRefillTransaction>(
  'RefillTransaction',
  RefillTransactionSchema
);

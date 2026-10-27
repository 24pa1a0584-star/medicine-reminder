import mongoose, { Document, Schema } from 'mongoose';

export interface IAdminBootstrapState extends Document {
  bootstrappedAt: Date;
  adminEmail: string;
}

const AdminBootstrapStateSchema = new Schema<IAdminBootstrapState>(
  {
    bootstrappedAt: {
      type: Date,
      default: Date.now,
    },
    adminEmail: {
      type: String,
      required: true,
      unique: true,
    },
  },
  {
    timestamps: true,
  }
);

export const AdminBootstrapState = mongoose.model<IAdminBootstrapState>(
  'AdminBootstrapState',
  AdminBootstrapStateSchema
);

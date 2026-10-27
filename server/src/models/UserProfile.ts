import mongoose, { Document, Schema, Types } from 'mongoose';

export interface IUserProfile extends Document {
  userId: Types.ObjectId;
  medicalDisclaimerAcknowledged: boolean;
  disclaimerAcknowledgedAt?: Date;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const UserProfileSchema = new Schema<IUserProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    medicalDisclaimerAcknowledged: {
      type: Boolean,
      default: false,
    },
    disclaimerAcknowledgedAt: {
      type: Date,
    },
    emergencyContactName: {
      type: String,
      trim: true,
      maxlength: 100,
    },
    emergencyContactPhone: {
      type: String,
      trim: true,
      maxlength: 20,
    },
    notes: {
      type: String,
      maxlength: 500,
    },
  },
  {
    timestamps: true,
  }
);

export const UserProfile = mongoose.model<IUserProfile>('UserProfile', UserProfileSchema);

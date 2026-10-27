import mongoose, { Document, Schema, Types } from 'mongoose';

export type InvitationStatus = 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked';

export interface ICaregiverPermissions {
  viewSchedule: boolean;
  viewActivity: boolean;
  receiveAlerts: boolean;
  manageSchedule: boolean;
}

export interface ICaregiverInvitation extends Document {
  _id: Types.ObjectId;
  primaryUserId: Types.ObjectId;
  caregiverEmail: string;
  token: string;
  status: InvitationStatus;
  permissions: ICaregiverPermissions;
  expiresAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const CaregiverInvitationSchema = new Schema<ICaregiverInvitation>(
  {
    primaryUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caregiverEmail: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    token: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending', 'accepted', 'rejected', 'expired', 'revoked'],
      default: 'pending',
      index: true,
    },
    permissions: {
      viewSchedule: { type: Boolean, default: true },
      viewActivity: { type: Boolean, default: true },
      receiveAlerts: { type: Boolean, default: false },
      manageSchedule: { type: Boolean, default: false },
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

export const CaregiverInvitation = mongoose.model<ICaregiverInvitation>(
  'CaregiverInvitation',
  CaregiverInvitationSchema
);

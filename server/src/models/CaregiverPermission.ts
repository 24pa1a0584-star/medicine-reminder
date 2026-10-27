import mongoose, { Document, Schema, Types } from 'mongoose';
import { ICaregiverPermissions } from './CaregiverInvitation';

export interface ICaregiverPermission extends Document {
  _id: Types.ObjectId;
  primaryUserId: Types.ObjectId;
  caregiverUserId: Types.ObjectId;
  permissions: ICaregiverPermissions;
  active: boolean;
  grantedAt: Date;
  updatedAt: Date;
}

const CaregiverPermissionSchema = new Schema<ICaregiverPermission>(
  {
    primaryUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    caregiverUserId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    permissions: {
      viewSchedule: { type: Boolean, default: true },
      viewActivity: { type: Boolean, default: true },
      receiveAlerts: { type: Boolean, default: false },
      manageSchedule: { type: Boolean, default: false },
    },
    active: {
      type: Boolean,
      default: true,
      index: true,
    },
    grantedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Unique pairing per primaryUser and caregiverUser
CaregiverPermissionSchema.index(
  { primaryUserId: 1, caregiverUserId: 1 },
  { unique: true }
);

export const CaregiverPermission = mongoose.model<ICaregiverPermission>(
  'CaregiverPermission',
  CaregiverPermissionSchema
);

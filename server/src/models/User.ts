import mongoose, { Document, Schema, Types } from 'mongoose';

export type UserRole = 'primary' | 'caregiver' | 'admin';
export type AccountStatus = 'active' | 'suspended';

export interface INotificationPreferences {
  browserPush: boolean;
  emailAlerts: boolean;
  lockScreenPrivacy: boolean; // Hide sensitive medicine name in lock-screen notifications
  soundEnabled: boolean;
}

export interface IUser extends Document {
  _id: Types.ObjectId;
  name: string;
  email: string;
  passwordHash: string;
  role: UserRole;
  accountStatus: AccountStatus;
  timeZone: string;
  notificationPreferences: INotificationPreferences;
  createdAt: Date;
  updatedAt: Date;
}

const UserSchema = new Schema<IUser>(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      minlength: 2,
      maxlength: 100,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ['primary', 'caregiver', 'admin'],
      default: 'primary',
      index: true,
    },
    accountStatus: {
      type: String,
      enum: ['active', 'suspended'],
      default: 'active',
    },
    timeZone: {
      type: String,
      default: 'Asia/Kolkata',
    },
    notificationPreferences: {
      browserPush: { type: Boolean, default: true },
      emailAlerts: { type: Boolean, default: false },
      lockScreenPrivacy: { type: Boolean, default: true },
      soundEnabled: { type: Boolean, default: true },
    },
  },
  {
    timestamps: true,
  }
);

export const User = mongoose.model<IUser>('User', UserSchema);

export type UserRole = 'primary' | 'caregiver' | 'admin';
export type FormulationType =
  | 'tablet'
  | 'capsule'
  | 'liquid'
  | 'drops'
  | 'inhaler'
  | 'injection'
  | 'topical'
  | 'other';

export type RecurrenceType = 'daily' | 'specific_days' | 'interval' | 'as_needed';
export type DoseOccurrenceState = 'upcoming' | 'due' | 'unconfirmed' | 'taken' | 'skipped' | 'snoozed';
export type TimeOfDaySlot = 'morning' | 'afternoon' | 'evening' | 'night';

export interface IUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  timeZone: string;
  notificationPreferences: {
    browserPush: boolean;
    emailAlerts: boolean;
    lockScreenPrivacy: boolean;
    soundEnabled: boolean;
  };
  profile?: {
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    medicalDisclaimerAcknowledged?: boolean;
    notes?: string;
  };
}

export interface IMedicine {
  _id: string;
  ownerId: string;
  name: string;
  genericName?: string;
  brandName?: string;
  formulation: FormulationType;
  strength: string;
  doseAmount: number;
  doseUnit: string;
  route?: string;
  instructions?: string;
  color: string;
  icon: string;
  startDate: string;
  endDate?: string;
  prescriptionReference?: string;
  notes?: string;
  status: 'active' | 'paused' | 'archived';
  schedule?: IMedicineSchedule;
  inventory?: IInventoryRecord;
  createdAt: string;
  updatedAt: string;
}

export interface IMedicineSchedule {
  _id: string;
  medicineId: string;
  ownerId: string;
  recurrenceType: RecurrenceType;
  timesOfDay: string[];
  daysOfWeek: number[];
  intervalDays?: number;
  startDate: string;
  endDate?: string;
  timeZone: string;
  version: number;
  active: boolean;
  reminderPreferences?: {
    advanceReminderMinutes: number;
    soundEnabled: boolean;
    allowSnooze: boolean;
    maxSnoozes: number;
  };
}

export interface IDoseOccurrence {
  _id: string;
  ownerId: string;
  medicineId: IMedicine | string;
  scheduleId: string;
  scheduleVersion: number;
  scheduledAtUTC: string;
  localScheduledDate: string;
  localScheduledTime: string;
  timeOfDaySlot: TimeOfDaySlot;
  doseAmount: number;
  doseUnit: string;
  state: DoseOccurrenceState;
  snoozedUntilUTC?: string;
  snoozeCount: number;
  actionId?: IDoseAction | string;
  superseded: boolean;
}

export interface IDoseAction {
  _id: string;
  occurrenceId: string;
  medicineId: string | IMedicine;
  ownerId: string;
  actionType: 'taken' | 'skipped' | 'snoozed' | 'dismissed';
  recordedAtUTC: string;
  reportedTakenAtUTC?: string;
  sourceDevice?: string;
  notes?: string;
  correctionAudit?: Array<{
    correctedAt: string;
    previousAction: string;
    newAction: string;
    reason: string;
  }>;
}

export interface IInventoryRecord {
  _id: string;
  medicineId: string | IMedicine;
  ownerId: string;
  currentQuantity: number;
  quantityUnit: string;
  unitsPerDose: number;
  lowStockThreshold: number;
  autoDeductOnDose: boolean;
  lastRefillDate?: string;
  pharmacyNote?: string;
}

export interface IRefillTransaction {
  _id: string;
  medicineId: string | IMedicine;
  ownerId: string;
  transactionType: 'refill' | 'dose_deduction' | 'manual_adjustment';
  quantityChange: number;
  remainingQuantity: number;
  note?: string;
  recordedAt: string;
}

export interface ICaregiverPermissions {
  viewSchedule: boolean;
  viewActivity: boolean;
  receiveAlerts: boolean;
  manageSchedule: boolean;
}

export interface ICaregiverInvitation {
  _id: string;
  primaryUserId: string;
  caregiverEmail: string;
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired' | 'revoked';
  permissions: ICaregiverPermissions;
  expiresAt: string;
  createdAt: string;
}

export interface ICaregiverPermission {
  _id: string;
  primaryUserId: IUser | string;
  caregiverUserId: IUser | string;
  permissions: ICaregiverPermissions;
  active: boolean;
  grantedAt: string;
}

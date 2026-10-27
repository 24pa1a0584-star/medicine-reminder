import { z } from 'zod';

export const registerSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100),
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  timeZone: z.string().default('Asia/Kolkata'),
});

export const loginSchema = z.object({
  email: z.string().email('Invalid email address').toLowerCase().trim(),
  password: z.string().min(1, 'Password is required'),
});

export const updateProfileSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  timeZone: z.string().optional(),
  notificationPreferences: z
    .object({
      browserPush: z.boolean().optional(),
      emailAlerts: z.boolean().optional(),
      lockScreenPrivacy: z.boolean().optional(),
      soundEnabled: z.boolean().optional(),
    })
    .optional(),
  emergencyContactName: z.string().max(100).optional(),
  emergencyContactPhone: z.string().max(20).optional(),
  notes: z.string().max(500).optional(),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z.string().min(8, 'New password must be at least 8 characters'),
});

export const scheduleConfigSchema = z.object({
  recurrenceType: z.enum(['daily', 'specific_days', 'interval', 'as_needed']).default('daily'),
  timesOfDay: z
    .array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, 'Time must be HH:mm 24-hour format'))
    .min(1, 'At least one time of day must be specified'),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional().default([]),
  intervalDays: z.number().min(1).max(365).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  reminderPreferences: z
    .object({
      advanceReminderMinutes: z.number().default(0),
      soundEnabled: z.boolean().default(true),
      allowSnooze: z.boolean().default(true),
      maxSnoozes: z.number().default(3),
    })
    .optional(),
});

export const createMedicineSchema = z.object({
  name: z.string().min(1, 'Medicine name is required').max(120),
  genericName: z.string().max(120).optional(),
  brandName: z.string().max(120).optional(),
  formulation: z
    .enum(['tablet', 'capsule', 'liquid', 'drops', 'inhaler', 'injection', 'topical', 'other'])
    .default('tablet'),
  strength: z.string().min(1, 'Strength is required (e.g., 500 mg)'),
  doseAmount: z.number().min(0.1, 'Dose amount must be at least 0.1').default(1),
  doseUnit: z.string().min(1).default('tablet'),
  route: z.string().default('oral'),
  instructions: z.string().max(300).optional(),
  color: z.string().default('#10B981'),
  icon: z.string().default('pill'),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  prescriptionReference: z.string().max(100).optional(),
  notes: z.string().max(500).optional(),
  // Integrated schedule & inventory
  schedule: scheduleConfigSchema.optional(),
  initialStock: z.number().min(0).optional().default(30),
  lowStockThreshold: z.number().min(0).optional().default(5),
  autoDeductOnDose: z.boolean().optional().default(true),
});

export const updateMedicineSchema = createMedicineSchema.partial();

export const updateScheduleSchema = z.object({
  recurrenceType: z.enum(['daily', 'specific_days', 'interval', 'as_needed']).optional(),
  timesOfDay: z
    .array(z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/))
    .min(1)
    .optional(),
  daysOfWeek: z.array(z.number().min(0).max(6)).optional(),
  intervalDays: z.number().min(1).max(365).optional(),
  startDate: z.string().or(z.date()).optional(),
  endDate: z.string().or(z.date()).optional().nullable(),
  changeReason: z.string().max(300).optional(),
});

export const doseActionSchema = z.object({
  reportedTakenAt: z.string().or(z.date()).optional(),
  sourceDevice: z.string().max(60).optional(),
  notes: z.string().max(300).optional(),
});

export const snoozeSchema = z.object({
  snoozeMinutes: z.number().min(1).max(180).default(15),
});

export const correctDoseActionSchema = z.object({
  newActionType: z.enum(['taken', 'skipped']),
  reason: z.string().min(3, 'Correction reason is required').max(300),
});

export const refillSchema = z.object({
  addedQuantity: z.number().min(1, 'Quantity must be at least 1'),
  note: z.string().max(300).optional(),
});

export const adjustStockSchema = z.object({
  newQuantity: z.number().min(0, 'Quantity cannot be negative'),
  reason: z.string().max(300).optional(),
});

export const caregiverInviteSchema = z.object({
  caregiverEmail: z.string().email('Valid caregiver email is required'),
  permissions: z.object({
    viewSchedule: z.boolean().default(true),
    viewActivity: z.boolean().default(true),
    receiveAlerts: z.boolean().default(false),
    manageSchedule: z.boolean().default(false),
  }),
});

export const pushSubscriptionSchema = z.object({
  endpoint: z.string().url(),
  keys: z.object({
    p256dh: z.string().min(1),
    auth: z.string().min(1),
  }),
  deviceIdentifier: z.string().default('Web Browser'),
});

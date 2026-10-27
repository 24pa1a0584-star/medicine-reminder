import bcrypt from 'bcryptjs';
import { connectDatabase, disconnectDatabase } from '../config/database';
import { User } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { Medicine } from '../models/Medicine';
import { MedicineSchedule } from '../models/MedicineSchedule';
import { InventoryRecord } from '../models/InventoryRecord';
import { ScheduleService } from '../scheduling/scheduleService';
import { DoseActionService } from '../services/doseActionService';
import { DoseOccurrence } from '../models/DoseOccurrence';

export async function seedDemoData() {
  console.log('[Seed] Connecting to database...');
  await connectDatabase();

  const demoEmail = 'priya@dosebloom.app';
  let demoUser = await User.findOne({ email: demoEmail });

  if (!demoUser) {
    const salt = await bcrypt.genSalt(12);
    const passwordHash = await bcrypt.hash('DemoPass123!', salt);

    demoUser = await User.create({
      name: 'Priya Sharma',
      email: demoEmail,
      passwordHash,
      role: 'primary',
      accountStatus: 'active',
      timeZone: 'Asia/Kolkata',
      notificationPreferences: {
        browserPush: true,
        emailAlerts: false,
        lockScreenPrivacy: false,
        soundEnabled: true,
      },
    });

    await UserProfile.create({
      userId: demoUser._id,
      medicalDisclaimerAcknowledged: true,
      disclaimerAcknowledgedAt: new Date(),
      emergencyContactName: 'Dr. Rajesh Sharma',
      emergencyContactPhone: '+91 98765 43210',
      notes: 'Managing morning and evening routine.',
    });

    console.log(`[Seed] Created demo user: ${demoEmail} (Password: DemoPass123!)`);

    // 1. Metformin 500 mg (Twice Daily - Morning & Evening)
    const med1 = await Medicine.create({
      ownerId: demoUser._id,
      name: 'Metformin Hydrochloride',
      genericName: 'Metformin',
      brandName: 'Glycomet',
      formulation: 'tablet',
      strength: '500 mg',
      doseAmount: 1,
      doseUnit: 'tablet',
      route: 'oral',
      instructions: 'Take immediately after breakfast and dinner with water',
      color: '#10B981', // Healing Emerald
      icon: 'pill',
      startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    const sched1 = await MedicineSchedule.create({
      medicineId: med1._id,
      ownerId: demoUser._id,
      recurrenceType: 'daily',
      timesOfDay: ['08:30', '20:30'],
      timeZone: 'Asia/Kolkata',
      version: 1,
      active: true,
    });

    await InventoryRecord.create({
      medicineId: med1._id,
      ownerId: demoUser._id,
      currentQuantity: 42,
      quantityUnit: 'tablets',
      unitsPerDose: 1,
      lowStockThreshold: 10,
      autoDeductOnDose: true,
    });

    await ScheduleService.generateOccurrencesForSchedule(sched1, med1, 14);

    // 2. Vitamin D3 60,000 IU (Weekly on Sundays)
    const med2 = await Medicine.create({
      ownerId: demoUser._id,
      name: 'Cholecalciferol (Vitamin D3)',
      genericName: 'Vitamin D3',
      brandName: 'Calcirol',
      formulation: 'capsule',
      strength: '60,000 IU',
      doseAmount: 1,
      doseUnit: 'capsule',
      route: 'oral',
      instructions: 'Take once weekly after breakfast with a glass of milk',
      color: '#6366F1', // Premium Indigo
      icon: 'capsule',
      startDate: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000),
      status: 'active',
    });

    const sched2 = await MedicineSchedule.create({
      medicineId: med2._id,
      ownerId: demoUser._id,
      recurrenceType: 'specific_days',
      timesOfDay: ['10:00'],
      daysOfWeek: [0], // Sunday
      timeZone: 'Asia/Kolkata',
      version: 1,
      active: true,
    });

    await InventoryRecord.create({
      medicineId: med2._id,
      ownerId: demoUser._id,
      currentQuantity: 4, // Low stock threshold trigger!
      quantityUnit: 'capsules',
      unitsPerDose: 1,
      lowStockThreshold: 5,
      autoDeductOnDose: true,
    });

    await ScheduleService.generateOccurrencesForSchedule(sched2, med2, 14);

    // 3. Multivitamin Syrup (Every morning)
    const med3 = await Medicine.create({
      ownerId: demoUser._id,
      name: 'Zincovit Multivitamin Syrup',
      formulation: 'liquid',
      strength: '10 ml',
      doseAmount: 10,
      doseUnit: 'ml',
      route: 'oral',
      instructions: 'Take 10 ml measuring cup once daily after lunch',
      color: '#F59E8B', // Warm Coral
      icon: 'bottle',
      startDate: new Date(),
      status: 'active',
    });

    const sched3 = await MedicineSchedule.create({
      medicineId: med3._id,
      ownerId: demoUser._id,
      recurrenceType: 'daily',
      timesOfDay: ['14:00'],
      timeZone: 'Asia/Kolkata',
      version: 1,
      active: true,
    });

    await InventoryRecord.create({
      medicineId: med3._id,
      ownerId: demoUser._id,
      currentQuantity: 180,
      quantityUnit: 'ml',
      unitsPerDose: 10,
      lowStockThreshold: 50,
      autoDeductOnDose: true,
    });

    await ScheduleService.generateOccurrencesForSchedule(sched3, med3, 14);

    // Mark today's morning dose as taken so the dashboard shows an immediate circular progress!
    const todayOcc = await DoseOccurrence.findOne({
      ownerId: demoUser._id,
      timeOfDaySlot: 'morning',
    });

    if (todayOcc) {
      await DoseActionService.markTaken(todayOcc._id, demoUser._id, {
        notes: 'Taken on time with oats breakfast',
      });
      console.log('[Seed] Marked demonstration morning dose as taken.');
    }

    console.log('[Seed] Sample medicines and schedules generated successfully.');
  } else {
    console.log('[Seed] Demo user already exists. Preserving records.');
  }

  await disconnectDatabase();
}

if (require.main === module) {
  seedDemoData()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[Seed] Error:', err);
      process.exit(1);
    });
}

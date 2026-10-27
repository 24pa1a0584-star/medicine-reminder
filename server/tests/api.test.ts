import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import request from 'supertest';
import { createApp } from '../src/app';
import { connectDatabase, disconnectDatabase } from '../src/config/database';
import { User } from '../src/models/User';
import { Medicine } from '../src/models/Medicine';
import { MedicineSchedule } from '../src/models/MedicineSchedule';
import { DoseOccurrence } from '../src/models/DoseOccurrence';
import { DoseAction } from '../src/models/DoseAction';
import { InventoryRecord } from '../src/models/InventoryRecord';
import { generateOccurrencesForWindow } from '../src/scheduling/recurrence';

const app = createApp();

describe('DOSEBLOOM Backend Automated Test Suite', () => {
  let primaryToken: string;
  let primaryUserId: string;
  let secondaryToken: string;
  let createdMedicineId: string;
  let createdScheduleId: string;

  before(async () => {
    await connectDatabase();
    // Clean up test collections for fresh run
    const testEmails = ['test_primary@dosebloom.app', 'test_secondary@dosebloom.app'];
    const users = await User.find({ email: { $in: testEmails } });
    const userIds = users.map((u) => u._id);

    await DoseOccurrence.deleteMany({ ownerId: { $in: userIds } });
    await DoseAction.deleteMany({ ownerId: { $in: userIds } });
    await MedicineSchedule.deleteMany({ ownerId: { $in: userIds } });
    await Medicine.deleteMany({ ownerId: { $in: userIds } });
    await InventoryRecord.deleteMany({ ownerId: { $in: userIds } });
    await User.deleteMany({ email: { $in: testEmails } });
  });

  after(async () => {
    await disconnectDatabase();
  });

  describe('1. System Health & Probes', () => {
    it('GET /api/health should return 200 with healthy status', async () => {
      const res = await request(app).get('/api/health');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'healthy');
      assert.strictEqual(res.body.app, 'DOSEBLOOM API');
    });

    it('GET /api/ready should report database connected', async () => {
      const res = await request(app).get('/api/ready');
      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.status, 'ready');
      assert.strictEqual(res.body.database, 'connected');
    });
  });

  describe('2. Authentication & Authorization Security', () => {
    it('should register a new primary user successfully', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Primary Test User',
        email: 'test_primary@dosebloom.app',
        password: 'Password123!',
        timeZone: 'Asia/Kolkata',
      });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.email, 'test_primary@dosebloom.app');
      primaryToken = res.body.token;
      primaryUserId = res.body.user.id;
    });

    it('should reject duplicate email registration with 409 Conflict', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Duplicate User',
        email: 'test_primary@dosebloom.app',
        password: 'Password123!',
      });

      assert.strictEqual(res.status, 409);
      assert.strictEqual(res.body.error.code, 'EMAIL_ALREADY_EXISTS');
    });

    it('should reject login with wrong password', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test_primary@dosebloom.app',
        password: 'WrongPassword!',
      });

      assert.strictEqual(res.status, 401);
      assert.strictEqual(res.body.error.code, 'INVALID_CREDENTIALS');
    });

    it('should login successfully with correct credentials', async () => {
      const res = await request(app).post('/api/auth/login').send({
        email: 'test_primary@dosebloom.app',
        password: 'Password123!',
      });

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.token);
      assert.strictEqual(res.body.user.name, 'Primary Test User');
    });

    it('should register a secondary user for cross-account boundary testing', async () => {
      const res = await request(app).post('/api/auth/register').send({
        name: 'Secondary Test User',
        email: 'test_secondary@dosebloom.app',
        password: 'Password123!',
      });

      assert.strictEqual(res.status, 201);
      secondaryToken = res.body.token;
    });

    it('should return profile on GET /api/auth/me when authenticated', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${primaryToken}`);

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.user.email, 'test_primary@dosebloom.app');
    });

    it('should reject unauthenticated requests to protected endpoints with 401', async () => {
      const res = await request(app).get('/api/medicines');
      assert.strictEqual(res.status, 401);
    });
  });

  describe('3. Recurrence Calculation Engine Unit Tests', () => {
    it('calculates daily occurrences correctly across multiple times', () => {
      const start = new Date('2026-11-01T00:00:00.000Z');
      const end = new Date('2026-11-03T23:59:59.000Z');

      const occs = generateOccurrencesForWindow({
        recurrenceType: 'daily',
        timesOfDay: ['08:00', '20:00'],
        startDate: start,
        timeZone: 'Asia/Kolkata',
        windowStart: start,
        windowEnd: end,
      });

      // 3 days * 2 times = 6 occurrences
      assert.strictEqual(occs.length, 6);
      assert.strictEqual(occs[0].localScheduledTime, '08:00');
      assert.strictEqual(occs[0].timeOfDaySlot, 'morning');
      assert.strictEqual(occs[1].localScheduledTime, '20:00');
      assert.strictEqual(occs[1].timeOfDaySlot, 'evening');
    });

    it('calculates specific days of week recurrence (e.g. Mon, Wed, Fri)', () => {
      const start = new Date('2026-11-01T00:00:00.000Z');
      const end = new Date('2026-11-07T23:59:59.000Z'); // 7 days (Sun through Sat)

      const occs = generateOccurrencesForWindow({
        recurrenceType: 'specific_days',
        timesOfDay: ['09:00'],
        daysOfWeek: [1, 3, 5], // Mon, Wed, Fri
        startDate: start,
        timeZone: 'Asia/Kolkata',
        windowStart: start,
        windowEnd: end,
      });

      assert.strictEqual(occs.length, 3);
      assert.ok(occs.every((o) => o.localScheduledTime === '09:00'));
    });

    it('calculates interval recurrence (every 2 days)', () => {
      const start = new Date('2026-11-01T00:00:00.000Z');
      const end = new Date('2026-11-07T23:59:59.000Z');

      const occs = generateOccurrencesForWindow({
        recurrenceType: 'interval',
        intervalDays: 2,
        timesOfDay: ['10:00'],
        startDate: start,
        timeZone: 'Asia/Kolkata',
        windowStart: start,
        windowEnd: end,
      });

      assert.strictEqual(occs.length, 4);
    });
  });

  describe('4. Medicine Management & Cross-User Security', () => {
    it('should create medicine with schedule and inventory', async () => {
      const res = await request(app)
        .post('/api/medicines')
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({
          name: 'Amoxicillin Trihydrate',
          genericName: 'Amoxicillin',
          formulation: 'capsule',
          strength: '500 mg',
          doseAmount: 1,
          doseUnit: 'capsule',
          route: 'oral',
          instructions: 'Take with food and plenty of water',
          color: '#10B981',
          icon: 'capsule',
          initialStock: 20,
          lowStockThreshold: 5,
          autoDeductOnDose: true,
          schedule: {
            recurrenceType: 'daily',
            timesOfDay: ['09:00', '21:00'],
          },
        });

      assert.strictEqual(res.status, 201);
      assert.ok(res.body.medicine._id);
      assert.ok(res.body.schedule._id);
      assert.strictEqual(res.body.inventory.currentQuantity, 20);

      createdMedicineId = res.body.medicine._id;
      createdScheduleId = res.body.schedule._id;
    });

    it('should list primary user medicines', async () => {
      const res = await request(app)
        .get('/api/medicines')
        .set('Authorization', `Bearer ${primaryToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.medicines.length >= 1);
      assert.strictEqual(res.body.medicines[0].name, 'Amoxicillin Trihydrate');
    });

    it('should prevent secondary user from accessing or editing primary user medicine', async () => {
      const res = await request(app)
        .get(`/api/medicines/${createdMedicineId}`)
        .set('Authorization', `Bearer ${secondaryToken}`);

      assert.strictEqual(res.status, 404);

      const updateRes = await request(app)
        .put(`/api/medicines/${createdMedicineId}`)
        .set('Authorization', `Bearer ${secondaryToken}`)
        .send({ name: 'Hacked Name' });

      assert.strictEqual(updateRes.status, 404);
    });
  });

  describe('5. Dose Actions & Inventory Tracking', () => {
    let testOccurrence: any;

    it('should find an occurrence and record Mark Taken with automatic inventory deduction', async () => {
      testOccurrence = await DoseOccurrence.findOne({
        medicineId: createdMedicineId,
        ownerId: primaryUserId,
      });

      assert.ok(testOccurrence);

      const res = await request(app)
        .post(`/api/doses/${testOccurrence._id}/take`)
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({
          notes: 'Taken after breakfast',
          sourceDevice: 'vitest-runner',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.occurrence.state, 'taken');
      assert.strictEqual(res.body.action.actionType, 'taken');

      // Verify inventory deducted by 1 (20 - 1 = 19)
      const inv = await InventoryRecord.findOne({ medicineId: createdMedicineId });
      assert.strictEqual(inv?.currentQuantity, 19);
    });

    it('repeated Mark Taken on same occurrence is idempotent', async () => {
      const res = await request(app)
        .post(`/api/doses/${testOccurrence._id}/take`)
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({ notes: 'Repeated call' });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.occurrence.state, 'taken');

      // Inventory should NOT have been deducted a second time
      const inv = await InventoryRecord.findOne({ medicineId: createdMedicineId });
      assert.strictEqual(inv?.currentQuantity, 19);
    });

    it('snoozing reminder updates snoozed timestamp without changing schedule', async () => {
      const upcomingOcc = await DoseOccurrence.findOne({
        medicineId: createdMedicineId,
        ownerId: primaryUserId,
        state: { $ne: 'taken' },
      });

      if (upcomingOcc) {
        const res = await request(app)
          .post(`/api/doses/${upcomingOcc._id}/snooze`)
          .set('Authorization', `Bearer ${primaryToken}`)
          .send({ snoozeMinutes: 15 });

        assert.strictEqual(res.status, 200);
        assert.strictEqual(res.body.occurrence.state, 'snoozed');
        assert.strictEqual(res.body.occurrence.snoozeCount, 1);

        const sched = await MedicineSchedule.findById(createdScheduleId);
        assert.deepStrictEqual(sched?.timesOfDay, ['09:00', '21:00']);
      }
    });

    it('should record refill transaction and increase inventory', async () => {
      const res = await request(app)
        .post(`/api/inventory/${createdMedicineId}/refill`)
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({
          addedQuantity: 30,
          note: 'Purchased from Apollo Pharmacy',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.inventory.currentQuantity, 49); // 19 + 30
      assert.strictEqual(res.body.transaction.transactionType, 'refill');
    });
  });

  describe('6. Schedule Edit & Preservation of Historical Records', () => {
    it('editing schedule creates snapshot, replaces future occurrences, and keeps history', async () => {
      const res = await request(app)
        .put(`/api/schedules/${createdScheduleId}`)
        .set('Authorization', `Bearer ${primaryToken}`)
        .send({
          timesOfDay: ['10:00'],
          changeReason: 'Doctor adjusted timing to once daily 10:00 AM',
        });

      assert.strictEqual(res.status, 200);
      assert.strictEqual(res.body.schedule.version, 2);
      assert.deepStrictEqual(res.body.schedule.timesOfDay, ['10:00']);

      const pastTaken = await DoseOccurrence.findOne({
        medicineId: createdMedicineId,
        state: 'taken',
      });
      assert.ok(pastTaken);
      assert.ok(pastTaken?.actionId);
    });
  });

  describe('7. Personal Data Export & Compliance', () => {
    it('GET /api/auth/export-data returns full portable JSON with medical disclaimer', async () => {
      const res = await request(app)
        .get('/api/auth/export-data')
        .set('Authorization', `Bearer ${primaryToken}`);

      assert.strictEqual(res.status, 200);
      assert.ok(res.body.disclaimer);
      assert.strictEqual(res.body.user.email, 'test_primary@dosebloom.app');
      assert.ok(Array.isArray(res.body.medicines));
      assert.ok(Array.isArray(res.body.doseActions));
      assert.ok(Array.isArray(res.body.inventory));
    });
  });
});

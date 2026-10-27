import { Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, IUser } from '../models/User';
import { UserProfile } from '../models/UserProfile';
import { Medicine } from '../models/Medicine';
import { MedicineSchedule } from '../models/MedicineSchedule';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { DoseAction } from '../models/DoseAction';
import { InventoryRecord } from '../models/InventoryRecord';
import { RefillTransaction } from '../models/RefillTransaction';
import { AuditLog } from '../models/AuditLog';
import { ENV } from '../config/env';
import { AuthenticatedRequest } from '../middleware/authMiddleware';

function createToken(userId: string): string {
  return jwt.sign({ userId }, ENV.JWT_SECRET, {
    expiresIn: '7d',
  });
}

export class AuthController {
  public static async register(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { name, email, password, timeZone } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        res.status(409).json({
          error: {
            code: 'EMAIL_ALREADY_EXISTS',
            message: 'An account with this email address already exists',
            status: 409,
          },
        });
        return;
      }

      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(password, salt);

      const user = await User.create({
        name,
        email: normalizedEmail,
        passwordHash,
        role: 'primary',
        accountStatus: 'active',
        timeZone: timeZone || 'Asia/Kolkata',
      });

      await UserProfile.create({
        userId: user._id,
        medicalDisclaimerAcknowledged: true,
        disclaimerAcknowledgedAt: new Date(),
      });

      await AuditLog.create({
        userId: user._id,
        action: 'AUTH_REGISTER',
        resource: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const token = createToken(user._id.toString());

      res.cookie('token', token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(201).json({
        message: 'Account successfully registered',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          timeZone: user.timeZone,
          notificationPreferences: user.notificationPreferences,
        },
      });
    } catch (err: unknown) {
      console.error('[AuthController.register] Error:', err);
      res.status(500).json({ error: { message: 'Registration failed', status: 500 } });
    }
  }

  public static async login(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const normalizedEmail = email.toLowerCase().trim();

      const user = await User.findOne({ email: normalizedEmail });
      if (!user || user.accountStatus !== 'active') {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            status: 401,
          },
        });
        return;
      }

      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'Invalid email or password',
            status: 401,
          },
        });
        return;
      }

      await AuditLog.create({
        userId: user._id,
        action: 'AUTH_LOGIN',
        resource: 'User',
        resourceId: user._id.toString(),
        ipAddress: req.ip,
        userAgent: req.get('User-Agent'),
      });

      const token = createToken(user._id.toString());

      res.cookie('token', token, {
        httpOnly: true,
        secure: ENV.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 7 * 24 * 60 * 60 * 1000,
      });

      res.status(200).json({
        message: 'Login successful',
        token,
        user: {
          id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          timeZone: user.timeZone,
          notificationPreferences: user.notificationPreferences,
        },
      });
    } catch (err: unknown) {
      console.error('[AuthController.login] Error:', err);
      res.status(500).json({ error: { message: 'Login failed', status: 500 } });
    }
  }

  public static async logout(req: AuthenticatedRequest, res: Response): Promise<void> {
    res.clearCookie('token');
    res.status(200).json({ message: 'Logged out successfully' });
  }

  public static async me(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
      return;
    }

    const profile = await UserProfile.findOne({ userId: req.user._id });

    res.status(200).json({
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        role: req.user.role,
        timeZone: req.user.timeZone,
        notificationPreferences: req.user.notificationPreferences,
        profile: profile
          ? {
              emergencyContactName: profile.emergencyContactName,
              emergencyContactPhone: profile.emergencyContactPhone,
              medicalDisclaimerAcknowledged: profile.medicalDisclaimerAcknowledged,
              notes: profile.notes,
            }
          : null,
      },
    });
  }

  public static async updateProfile(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
      return;
    }

    const { name, timeZone, notificationPreferences, emergencyContactName, emergencyContactPhone, notes } = req.body;

    if (name) req.user.name = name;
    if (timeZone) req.user.timeZone = timeZone;
    if (notificationPreferences) {
      req.user.notificationPreferences = {
        ...req.user.notificationPreferences,
        ...notificationPreferences,
      };
    }

    await req.user.save();

    if (emergencyContactName !== undefined || emergencyContactPhone !== undefined || notes !== undefined) {
      await UserProfile.findOneAndUpdate(
        { userId: req.user._id },
        {
          $set: {
            emergencyContactName,
            emergencyContactPhone,
            notes,
          },
        },
        { upsert: true }
      );
    }

    res.status(200).json({
      message: 'Profile updated successfully',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        timeZone: req.user.timeZone,
        notificationPreferences: req.user.notificationPreferences,
      },
    });
  }

  public static async changePassword(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
      return;
    }

    const { currentPassword, newPassword } = req.body;

    const isMatch = await bcrypt.compare(currentPassword, req.user.passwordHash);
    if (!isMatch) {
      res.status(400).json({
        error: { code: 'INVALID_PASSWORD', message: 'Current password is incorrect', status: 400 },
      });
      return;
    }

    const salt = await bcrypt.genSalt(12);
    req.user.passwordHash = await bcrypt.hash(newPassword, salt);
    await req.user.save();

    await AuditLog.create({
      userId: req.user._id,
      action: 'AUTH_PASSWORD_CHANGE',
      resource: 'User',
      resourceId: req.user._id.toString(),
      ipAddress: req.ip,
    });

    res.status(200).json({ message: 'Password changed successfully' });
  }

  /**
   * Complete personal data export in accordance with Indian DPDP Act / GDPR data portability
   */
  public static async exportData(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
      return;
    }

    const userId = req.user._id;

    const profile = await UserProfile.findOne({ userId });
    const medicines = await Medicine.find({ ownerId: userId });
    const schedules = await MedicineSchedule.find({ ownerId: userId });
    const doseActions = await DoseAction.find({ ownerId: userId }).sort({ recordedAtUTC: -1 });
    const inventory = await InventoryRecord.find({ ownerId: userId });
    const refills = await RefillTransaction.find({ ownerId: userId }).sort({ recordedAt: -1 });

    const exportPayload = {
      exportTimestamp: new Date().toISOString(),
      disclaimer: 'DOSEBLOOM personal self-reported medication and reminder log export. Not a certified clinical medical record.',
      user: {
        id: req.user._id,
        name: req.user.name,
        email: req.user.email,
        timeZone: req.user.timeZone,
        profile,
      },
      medicines,
      schedules,
      doseActions,
      inventory,
      refillTransactions: refills,
    };

    res.status(200).json(exportPayload);
  }

  /**
   * Complete account deletion (Right to Erasure)
   */
  public static async deleteAccount(req: AuthenticatedRequest, res: Response): Promise<void> {
    if (!req.user) {
      res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
      return;
    }

    const userId = req.user._id;

    await Medicine.deleteMany({ ownerId: userId });
    await MedicineSchedule.deleteMany({ ownerId: userId });
    await DoseOccurrence.deleteMany({ ownerId: userId });
    await DoseAction.deleteMany({ ownerId: userId });
    await InventoryRecord.deleteMany({ ownerId: userId });
    await RefillTransaction.deleteMany({ ownerId: userId });
    await UserProfile.deleteMany({ userId });
    await User.findByIdAndDelete(userId);

    res.clearCookie('token');
    res.status(200).json({ message: 'Account and associated records successfully erased.' });
  }
}

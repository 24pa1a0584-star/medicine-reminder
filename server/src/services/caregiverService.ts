import { Types } from 'mongoose';
import { CaregiverInvitation, ICaregiverInvitation, ICaregiverPermissions } from '../models/CaregiverInvitation';
import { CaregiverPermission, ICaregiverPermission } from '../models/CaregiverPermission';
import { User, IUser } from '../models/User';
import crypto from 'crypto';

export class CaregiverService {
  /**
   * Primary user creates a secure invitation for a caregiver
   */
  public static async createInvitation(
    primaryUserId: Types.ObjectId,
    caregiverEmail: string,
    permissions: ICaregiverPermissions
  ): Promise<ICaregiverInvitation> {
    const normalizedEmail = caregiverEmail.toLowerCase().trim();

    const primaryUser = await User.findById(primaryUserId);
    if (!primaryUser) {
      throw new Error('Primary user not found');
    }

    if (primaryUser.email === normalizedEmail) {
      throw new Error('Cannot invite yourself as a caregiver');
    }

    // Generate secure random token
    const token = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7-day validity

    const invitation = await CaregiverInvitation.create({
      primaryUserId,
      caregiverEmail: normalizedEmail,
      token,
      permissions,
      expiresAt,
      status: 'pending',
    });

    return invitation;
  }

  /**
   * Caregiver accepts an invitation using the secure token
   */
  public static async acceptInvitation(
    token: string,
    caregiverUserId: Types.ObjectId
  ): Promise<ICaregiverPermission> {
    const invitation = await CaregiverInvitation.findOne({
      token,
      status: 'pending',
      expiresAt: { $gt: new Date() },
    });

    if (!invitation) {
      throw new Error('Invalid or expired caregiver invitation token');
    }

    const caregiverUser = await User.findById(caregiverUserId);
    if (!caregiverUser) {
      throw new Error('Caregiver account not found');
    }

    if (caregiverUser.email.toLowerCase() !== invitation.caregiverEmail.toLowerCase()) {
      throw new Error('This invitation was sent to a different email address');
    }

    invitation.status = 'accepted';
    await invitation.save();

    // Create or update caregiver permission record
    const permission = await CaregiverPermission.findOneAndUpdate(
      {
        primaryUserId: invitation.primaryUserId,
        caregiverUserId,
      },
      {
        $set: {
          permissions: invitation.permissions,
          active: true,
          grantedAt: new Date(),
        },
      },
      { upsert: true, new: true }
    );

    return permission;
  }

  /**
   * Revokes caregiver access immediately
   */
  public static async revokeCaregiverAccess(
    primaryUserId: Types.ObjectId,
    caregiverUserId: Types.ObjectId
  ): Promise<void> {
    await CaregiverPermission.updateOne(
      { primaryUserId, caregiverUserId },
      { $set: { active: false } }
    );
  }

  /**
   * Retrieves list of active caregivers for a primary user
   */
  public static async getPrimaryUserCaregivers(primaryUserId: Types.ObjectId) {
    return CaregiverPermission.find({
      primaryUserId,
      active: true,
    }).populate('caregiverUserId', 'name email');
  }

  /**
   * Retrieves list of loved ones who shared their schedule with this caregiver
   */
  public static async getLovedOnesForCaregiver(caregiverUserId: Types.ObjectId) {
    return CaregiverPermission.find({
      caregiverUserId,
      active: true,
    }).populate('primaryUserId', 'name email timeZone');
  }
}

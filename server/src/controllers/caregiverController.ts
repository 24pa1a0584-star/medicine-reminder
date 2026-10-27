import { Response } from 'express';
import { CaregiverService } from '../services/caregiverService';
import { CaregiverInvitation } from '../models/CaregiverInvitation';
import { DoseOccurrence } from '../models/DoseOccurrence';
import { Medicine } from '../models/Medicine';
import { AuthenticatedRequest } from '../middleware/authMiddleware';
import { Types } from 'mongoose';

export class CaregiverController {
  public static async sendInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { caregiverEmail, permissions } = req.body;

      const invitation = await CaregiverService.createInvitation(
        req.user._id,
        caregiverEmail,
        permissions
      );

      res.status(201).json({
        message: 'Caregiver invitation generated',
        invitation: {
          id: invitation._id,
          caregiverEmail: invitation.caregiverEmail,
          token: invitation.token, // Returned for ease of demonstration/sharing link
          inviteLink: `/caregiver/accept?token=${invitation.token}`,
          permissions: invitation.permissions,
          expiresAt: invitation.expiresAt,
        },
      });
    } catch (err: unknown) {
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async listSentInvitations(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const invitations = await CaregiverInvitation.find({
        primaryUserId: req.user._id,
      }).sort({ createdAt: -1 });

      res.status(200).json({ invitations });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to list invitations', status: 500 } });
    }
  }

  public static async acceptInvitation(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const { token } = req.body;
      const permission = await CaregiverService.acceptInvitation(token, req.user._id);

      res.status(200).json({
        message: 'Caregiver invitation accepted successfully',
        permission,
      });
    } catch (err: unknown) {
      res.status(400).json({ error: { message: (err as Error).message, status: 400 } });
    }
  }

  public static async listCaregivers(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const caregivers = await CaregiverService.getPrimaryUserCaregivers(req.user._id);
      res.status(200).json({ caregivers });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to list caregivers', status: 500 } });
    }
  }

  public static async listLovedOnes(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const lovedOnes = await CaregiverService.getLovedOnesForCaregiver(req.user._id);
      res.status(200).json({ lovedOnes });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to list loved ones', status: 500 } });
    }
  }

  /**
   * Allows caregiver to view loved one's schedule if 'viewSchedule' is authorized
   */
  public static async getLovedOneSchedule(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const lovedOneId = req.params.lovedOneId as string;

      const occurrences = await DoseOccurrence.find({
        ownerId: new Types.ObjectId(lovedOneId),
        superseded: false,
      })
        .populate('medicineId', 'name formulation strength doseAmount doseUnit color icon')
        .populate('actionId', 'actionType recordedAtUTC notes')
        .sort({ scheduledAtUTC: -1 })
        .limit(50);

      res.status(200).json({ occurrences });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to retrieve schedule', status: 500 } });
    }
  }

  public static async revokeAccess(req: AuthenticatedRequest, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({ error: { message: 'Unauthorized', status: 401 } });
        return;
      }

      const caregiverUserId = req.params.caregiverUserId as string;
      await CaregiverService.revokeCaregiverAccess(
        req.user._id,
        new Types.ObjectId(caregiverUserId)
      );

      res.status(200).json({ message: 'Caregiver access revoked' });
    } catch (err: unknown) {
      res.status(500).json({ error: { message: 'Failed to revoke access', status: 500 } });
    }
  }
}

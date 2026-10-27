import { Response, NextFunction } from 'express';
import { AuthenticatedRequest } from './authMiddleware';
import { CaregiverPermission } from '../models/CaregiverPermission';
import { Types } from 'mongoose';

/**
 * Requires system administrator role
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({
      error: {
        code: 'FORBIDDEN',
        message: 'System Administrator privileges required',
        status: 403,
      },
    });
    return;
  }
  next();
}

/**
 * Verifies that the requester is either the target user themselves OR an authorized caregiver with appropriate permission
 */
export function requireSelfOrAuthorizedCaregiver(permissionKey: 'viewSchedule' | 'viewActivity' | 'manageSchedule') {
  return async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: { code: 'UNAUTHORIZED', message: 'Unauthorized', status: 401 } });
      return;
    }

    const targetUserIdStr = (req.params.userId || req.query.userId || req.body.userId) as string;

    // If no specific target userId is provided, target is self
    if (!targetUserIdStr || targetUserIdStr === req.user._id.toString()) {
      return next();
    }

    // Check caregiver permission
    try {
      const permission = await CaregiverPermission.findOne({
        primaryUserId: new Types.ObjectId(targetUserIdStr),
        caregiverUserId: req.user._id,
        active: true,
      });

      if (!permission || !permission.permissions[permissionKey]) {
        res.status(403).json({
          error: {
            code: 'FORBIDDEN',
            message: `Caregiver does not have '${permissionKey}' permission for this account`,
            status: 403,
          },
        });
        return;
      }

      next();
    } catch (err) {
      res.status(500).json({ error: { code: 'SERVER_ERROR', message: 'Error checking permissions', status: 500 } });
    }
  };
}

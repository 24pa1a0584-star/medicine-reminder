import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { ENV } from '../config/env';
import { User, IUser } from '../models/User';

export interface AuthenticatedRequest extends Request {
  user?: IUser;
}

export async function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    let token: string | undefined;

    // Check Authorization header
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      res.status(401).json({
        error: {
          code: 'UNAUTHORIZED',
          message: 'Authentication token required',
          status: 401,
        },
      });
      return;
    }

    const decoded = jwt.verify(token, ENV.JWT_SECRET) as { userId: string };
    const user = await User.findById(decoded.userId);

    if (!user || user.accountStatus !== 'active') {
      res.status(401).json({
        error: {
          code: 'ACCOUNT_INACTIVE',
          message: 'Account not found or suspended',
          status: 401,
        },
      });
      return;
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({
      error: {
        code: 'INVALID_TOKEN',
        message: 'Invalid or expired authentication session',
        status: 401,
      },
    });
  }
}

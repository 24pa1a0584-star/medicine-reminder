import { Router } from 'express';
import { AuthController } from '../controllers/authController';
import { authenticate } from '../middleware/authMiddleware';
import { validate } from '../middleware/validate';
import { authRateLimiter } from '../middleware/rateLimiter';
import {
  registerSchema,
  loginSchema,
  updateProfileSchema,
  changePasswordSchema,
} from '../validators/schemas';

const router = Router();

router.post('/register', authRateLimiter, validate(registerSchema), AuthController.register);
router.post('/login', authRateLimiter, validate(loginSchema), AuthController.login);
router.post('/logout', authenticate, AuthController.logout);
router.get('/me', authenticate, AuthController.me);
router.put('/profile', authenticate, validate(updateProfileSchema), AuthController.updateProfile);
router.put('/change-password', authenticate, validate(changePasswordSchema), AuthController.changePassword);
router.get('/export-data', authenticate, AuthController.exportData);
router.delete('/account', authenticate, AuthController.deleteAccount);

export default router;

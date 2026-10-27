import bcrypt from 'bcryptjs';
import { User } from '../models/User';
import { AdminBootstrapState } from '../models/AdminBootstrapState';
import { ENV } from '../config/env';

/**
 * Safe, idempotent one-time administrator bootstrapping.
 * Never deletes or wipes existing databases or records.
 */
export async function bootstrapAdmin(): Promise<void> {
  if (!ENV.INITIAL_SETUP_ENABLED) {
    return;
  }

  try {
    const existingAdminState = await AdminBootstrapState.findOne({
      adminEmail: ENV.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
    });

    if (existingAdminState) {
      return; // Already bootstrapped
    }

    const existingAdminUser = await User.findOne({
      email: ENV.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
    });

    if (!existingAdminUser) {
      const salt = await bcrypt.genSalt(12);
      const passwordHash = await bcrypt.hash(ENV.BOOTSTRAP_ADMIN_PASSWORD, salt);

      await User.create({
        name: ENV.BOOTSTRAP_ADMIN_NAME,
        email: ENV.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
        passwordHash,
        role: 'admin',
        accountStatus: 'active',
        timeZone: 'Asia/Kolkata',
      });

      await AdminBootstrapState.create({
        adminEmail: ENV.BOOTSTRAP_ADMIN_EMAIL.toLowerCase(),
        bootstrappedAt: new Date(),
      });

      console.log(`[Bootstrap] Safe Admin bootstrap completed for: ${ENV.BOOTSTRAP_ADMIN_EMAIL}`);
    }
  } catch (err) {
    console.error('[Bootstrap] Error during admin bootstrap:', err);
  }
}

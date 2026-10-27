import dotenv from 'dotenv';
import path from 'path';
import { z } from 'zod';

// Load .env from server directory or root
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
dotenv.config({ path: path.resolve(process.cwd(), '../.env') });

const envSchema = z.object({
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  PORT: z.string().transform(Number).default('5000'),
  APP_BASE_URL: z.string().default('http://localhost:5173'),
  MONGODB_URI: z.string().default('mongodb://localhost:27017/dosebloom'),
  JWT_SECRET: z.string().default('dosebloom_super_secure_jwt_secret_dev_key_2026_xyz!@#'),
  JWT_EXPIRES_IN: z.string().default('7d'),
  SESSION_SECRET: z.string().default('dosebloom_session_secret_cookie_vault_key_2026_dev'),
  VAPID_PUBLIC_KEY: z.string().default('BA31UzuPJ222UTks-hwHT6h5pVOdQqyWsdSKO0x1R6B0M5e3mMFpK6xuQvnsNkHi7YjSbtf45jKwppmX5oRiIXs'),
  VAPID_PRIVATE_KEY: z.string().default('xVE9ZCxmdYflqafQqLiuhy5YpuZpjhzKdbZMbJFjR_I'),
  VAPID_SUBJECT: z.string().default('mailto:support@dosebloom.app'),
  REMINDER_WORKER_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  WORKER_POLL_INTERVAL_MS: z.string().transform(Number).default('15000'),
  DEMO_MODE: z.string().transform((val) => val === 'true').default('true'),
  INITIAL_SETUP_ENABLED: z.string().transform((val) => val === 'true').default('true'),
  BOOTSTRAP_ADMIN_EMAIL: z.string().email().default('admin@dosebloom.app'),
  BOOTSTRAP_ADMIN_PASSWORD: z.string().default('AdminPass123!'),
  BOOTSTRAP_ADMIN_NAME: z.string().default('System Administrator'),
});

const parsed = envSchema.safeParse(process.env);

if (!parsed.success) {
  console.error('Invalid environment variables:', parsed.error.format());
  process.exit(1);
}

export const ENV = parsed.data;

import { createApp } from './app';
import { connectDatabase, disconnectDatabase } from './config/database';
import { bootstrapAdmin } from './bootstrap/adminBootstrap';
import { ReminderWorker } from './workers/reminderWorker';
import { ENV } from './config/env';

async function startServer() {
  console.log('====================================================');
  console.log('   DOSEBLOOM — Smart Medicine Reminder Application  ');
  console.log('====================================================');

  await connectDatabase();

  // Run non-destructive admin bootstrap
  await bootstrapAdmin();

  // Start in-process reminder worker if enabled (default true for local / demo)
  if (ENV.REMINDER_WORKER_ENABLED) {
    ReminderWorker.start(ENV.WORKER_POLL_INTERVAL_MS);
  } else {
    console.log('[Server] In-process worker disabled. Running dedicated external worker daemon.');
  }

  const app = createApp();
  const port = ENV.PORT;

  const server = app.listen(port, () => {
    console.log(`[Server] DOSEBLOOM API listening on port ${port} (${ENV.NODE_ENV})`);
    console.log(`[Server] Health check available at: http://localhost:${port}/api/health`);
  });

  const gracefulShutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    ReminderWorker.stop();
    server.close(async () => {
      await disconnectDatabase();
      console.log('[Server] Process terminated cleanly.');
      process.exit(0);
    });

    // Force exit if not closed within 10s
    setTimeout(() => {
      console.error('[Server] Forcing shutdown after timeout.');
      process.exit(1);
    }, 10000);
  };

  process.on('SIGINT', () => gracefulShutdown('SIGINT'));
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
}

startServer().catch((err) => {
  console.error('[Server] Fatal startup failure:', err);
  process.exit(1);
});

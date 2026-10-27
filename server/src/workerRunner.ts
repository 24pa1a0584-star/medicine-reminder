import { connectDatabase } from './config/database';
import { ReminderWorker } from './workers/reminderWorker';
import { ENV } from './config/env';

async function runWorker() {
  console.log('====================================================');
  console.log('   DOSEBLOOM STANDALONE REMINDER WORKER DAEMON     ');
  console.log('====================================================');

  await connectDatabase();

  ReminderWorker.start(ENV.WORKER_POLL_INTERVAL_MS);

  const shutdown = async (signal: string) => {
    console.log(`\nReceived ${signal}. Shutting down worker gracefully...`);
    ReminderWorker.stop();
    process.exit(0);
  };

  process.on('SIGINT', () => shutdown('SIGINT'));
  process.on('SIGTERM', () => shutdown('SIGTERM'));
}

runWorker().catch((err) => {
  console.error('[WorkerRunner] Fatal error starting worker daemon:', err);
  process.exit(1);
});

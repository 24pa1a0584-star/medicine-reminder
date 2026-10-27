import mongoose from 'mongoose';
import { ENV } from './env';

export async function connectDatabase(): Promise<typeof mongoose> {
  try {
    mongoose.set('strictQuery', true);
    
    // Connection options for resilience
    const conn = await mongoose.connect(ENV.MONGODB_URI, {
      serverSelectionTimeoutMS: 8000,
      socketTimeoutMS: 45000,
    });

    console.log(`[Database] MongoDB connected successfully to: ${conn.connection.name}`);
    
    mongoose.connection.on('error', (err) => {
      console.error('[Database] MongoDB connection error:', err);
    });

    mongoose.connection.on('disconnected', () => {
      console.warn('[Database] MongoDB disconnected. Attempting reconnection...');
    });

    return conn;
  } catch (error) {
    console.error('[Database] Fatal error connecting to MongoDB:', error);
    throw error;
  }
}

export async function disconnectDatabase(): Promise<void> {
  try {
    await mongoose.disconnect();
    console.log('[Database] MongoDB disconnected gracefully.');
  } catch (error) {
    console.error('[Database] Error disconnecting from MongoDB:', error);
  }
}

import mongoose from 'mongoose';
import { ENV } from './env';

export const connectDatabase = async (): Promise<void> => {
  try {
    const conn = await mongoose.connect(ENV.MONGODB_URI);
    console.log(`[Database] MongoDB connected successfully: ${conn.connection.host}`);
  } catch (error) {
    console.error('[Database] MongoDB connection error:', error);
    process.exit(1);
  }

  mongoose.connection.on('disconnected', () => {
    console.warn('[Database] MongoDB connection lost');
  });

  mongoose.connection.on('reconnected', () => {
    console.log('[Database] MongoDB reconnected');
  });
};

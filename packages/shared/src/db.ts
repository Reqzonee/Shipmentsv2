import dns from 'node:dns';
import mongoose from 'mongoose';

// Windows / ISP DNS often refuses SRV lookups needed by mongodb+srv://
dns.setServers(['8.8.8.8', '1.1.1.1']);

export async function connectDB(uri: string): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(uri);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database connection error: ${message}`);
    process.exit(1);
  }
}

export { mongoose };

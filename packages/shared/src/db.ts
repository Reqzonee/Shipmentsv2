import dns from 'node:dns';
import mongoose from 'mongoose';

// Windows / some Node versions refuse Atlas SRV lookups on ISP DNS
dns.setServers(['8.8.8.8', '1.1.1.1']);
dns.setDefaultResultOrder('ipv4first');

export async function connectDB(uri: string): Promise<typeof mongoose> {
  try {
    const conn = await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 20_000,
      family: 4,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    console.error(`Database connection error: ${message}`);
    console.error(
      'Tip: Atlas Network Access must allow your IP (or 0.0.0.0/0). Compass working ≠ Node DNS OK — we force 8.8.8.8 for SRV.'
    );
    process.exit(1);
  }
}

export { mongoose };

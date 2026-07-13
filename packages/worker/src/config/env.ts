import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.resolve(__dirname, '../../../../.env') });

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Missing required env var: ${name}`);
  return value;
}

export const env = {
  mongodbUri: required('MONGODB_URI'),
  redisHost: process.env.REDIS_HOST ?? '127.0.0.1',
  redisPort: Number(process.env.REDIS_PORT ?? 6379),
  batchSize: Number(process.env.BATCH_SIZE ?? 500),
  /** 1 = process jobs one-by-one (best for Loom queue demo) */
  workerConcurrency: Number(process.env.WORKER_CONCURRENCY ?? 1),
};

import { Queue } from 'bullmq';
import IORedis from 'ioredis';
import { QUEUE_NAME } from '@shipments/shared';
import { env } from '../config/env.js';

let connection: IORedis | null = null;
let bulkActionQueue: Queue | null = null;

export function getRedisConnection(): IORedis {
  if (!connection) {
    connection = new IORedis({
      host: env.redisHost,
      port: env.redisPort,
      maxRetriesPerRequest: null,
    });
  }
  return connection;
}

export function getBulkActionQueue(): Queue {
  if (!bulkActionQueue) {
    bulkActionQueue = new Queue(QUEUE_NAME, {
      connection: getRedisConnection(),
      defaultJobOptions: {
        attempts: 3,
        backoff: { type: 'exponential', delay: 2000 },
        removeOnComplete: 100,
        removeOnFail: 200,
      },
    });
  }
  return bulkActionQueue;
}

export type BulkActionJobData = {
  actionId: string;
  accountId: string;
};

import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import { connectDB, QUEUE_NAME } from '@shipments/shared';
import { env } from './config/env.js';
import { processBulkAction } from './orchestrator.js';
import { listHandlers } from './handlers/registry.js';

async function main() {
  await connectDB(env.mongodbUri);

  const connection = new IORedis({
    host: env.redisHost,
    port: env.redisPort,
    maxRetriesPerRequest: null,
  });

  const worker = new Worker(
    QUEUE_NAME,
    async (job) => {
      const { actionId } = job.data as { actionId: string };
      console.log(`Picked job ${job.id} for action ${actionId}`);
      await processBulkAction(actionId);
    },
    {
      connection,
      concurrency: Math.max(1, env.workerConcurrency),
    }
  );

  worker.on('completed', (job) => {
    console.log(`Job ${job.id} completed`);
  });

  worker.on('failed', (job, err) => {
    console.error(`Job ${job?.id} failed:`, err.message);
  });

  console.log(`Worker listening on queue "${QUEUE_NAME}"`);
  console.log(`Concurrency: ${Math.max(1, env.workerConcurrency)}`);
  console.log(`Registered handlers: ${listHandlers().join(', ')}`);
}

main().catch((err) => {
  console.error('Failed to start worker', err);
  process.exit(1);
});

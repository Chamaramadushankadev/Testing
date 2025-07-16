import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const connection = new IORedis('redis://127.0.0.1:6379');

export const emailQueue = new Queue('emailQueue', {
  connection,
});

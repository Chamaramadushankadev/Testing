import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import mongoose from 'mongoose';
import { sendWarmupEmail } from '../services/warmupService.js'; // update path
import { EmailAccount } from '../models/ColdEmailSystemIndex.js';

const connection = new IORedis('redis://127.0.0.1:6379');

await mongoose.connect('mongodb://localhost:27017/your-db'); // replace with your connection

new Worker('emailQueue', async job => {
  const { fromAccountId, toAccountId } = job.data;

  const fromAccount = await EmailAccount.findById(fromAccountId);
  const toAccount = await EmailAccount.findById(toAccountId);

  if (fromAccount && toAccount) {
    await sendWarmupEmail(fromAccount, toAccount);
  } else {
    throw new Error('Account not found');
  }
}, { connection });

import mongoose from 'mongoose';

// Warmup Email Schema
const warmupEmailSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  fromAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true
  },
  toAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  isReply: {
    type: Boolean,
    default: false
  },
  parentEmailId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'WarmupEmail'
  },
  threadId: String,
  messageId: String,
  sentAt: Date,
  openedAt: Date,
  repliedAt: Date,
  status: {
    type: String,
    enum: ['pending', 'sent', 'opened', 'replied', 'failed', 'spam'],
    default: 'pending'
  }
}, {
  timestamps: true
});

// Indexes
warmupEmailSchema.index({ userId: 1, fromAccountId: 1 });
warmupEmailSchema.index({ userId: 1, toAccountId: 1 });
warmupEmailSchema.index({ sentAt: 1 });

export default mongoose.models.WarmupEmail || mongoose.model('WarmupEmail', warmupEmailSchema);
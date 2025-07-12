import mongoose from 'mongoose';

// Inbox Sync Schema
const inboxSyncSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  emailAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true
  },
  lastSyncAt: {
    type: Date,
    default: Date.now
  },
  lastUid: Number,
  syncStatus: {
    type: String,
    enum: ['idle', 'syncing', 'error'],
    default: 'idle'
  },
  errorMessage: String,
  emailsProcessed: {
    type: Number,
    default: 0
  },
  repliesFound: {
    type: Number,
    default: 0
  },
  spamPlacements: {
    type: Number,
    default: 0
  },
  bouncesFound: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
inboxSyncSchema.index({ userId: 1, emailAccountId: 1 });
inboxSyncSchema.index({ lastSyncAt: 1 });

export default mongoose.models.InboxSync || mongoose.model('InboxSync', inboxSyncSchema);
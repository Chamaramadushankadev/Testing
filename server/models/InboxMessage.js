import mongoose from 'mongoose';

// Inbox Message Schema
const inboxMessageSchema = new mongoose.Schema({
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
  messageId: {
    type: String,
    required: true
  },
  threadId: {
    type: String
  },
  from: {
    name: String,
    email: {
      type: String,
      required: true
    }
  },
  to: [{
    name: String,
    email: String
  }],
  cc: [{
    name: String,
    email: String
  }],
  bcc: [{
    name: String,
    email: String
  }],
  subject: {
    type: String,
    required: true
  },
  content: {
    text: String,
    html: String
  },
  isRead: {
    type: Boolean,
    default: false
  },
  isStarred: {
    type: Boolean,
    default: false
  },
  isReply: {
    type: Boolean,
    default: false
  },
  isBounce: {
    type: Boolean,
    default: false
  },
  isAutoReply: {
    type: Boolean,
    default: false
  },
  isWarmup: {
    type: Boolean,
    default: false
  },
  labels: [{
    type: String,
    trim: true
  }],
  attachments: [{
    filename: String,
    contentType: String,
    size: Number,
    contentId: String
  }],
  receivedAt: {
    type: Date,
    required: true
  },
  campaignId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Campaign'
  },
  leadId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  },
  sentiment: {
    type: String,
    enum: ['positive', 'neutral', 'negative'],
    default: 'neutral'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  processed: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
inboxMessageSchema.index({ userId: 1, emailAccountId: 1 });
inboxMessageSchema.index({ userId: 1, receivedAt: -1 });
inboxMessageSchema.index({ userId: 1, isRead: 1 });
inboxMessageSchema.index({ messageId: 1 }, { unique: true });
inboxMessageSchema.index({ threadId: 1 });
inboxMessageSchema.index({ 'from.email': 1 });

export default mongoose.models.InboxMessage || mongoose.model('InboxMessage', inboxMessageSchema);
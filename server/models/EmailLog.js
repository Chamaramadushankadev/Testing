import mongoose from 'mongoose';

// Email Log Schema
const emailLogSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
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
  emailAccountId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount',
    required: true
  },
  type: {
    type: String,
    enum: ['campaign', 'warmup', 'reply'],
    required: true
  },
  stepNumber: Number,
  subject: String,
  content: String,
  status: {
    type: String,
    enum: ['queued', 'sent', 'delivered', 'opened', 'clicked', 'replied', 'bounced', 'failed'],
    default: 'queued'
  },
  sentAt: Date,
  deliveredAt: Date,
  openedAt: Date,
  clickedAt: Date,
  repliedAt: Date,
  bouncedAt: Date,
  trackingPixelId: String,
  messageId: String,
  errorMessage: String,
  metadata: {
    type: Map,
    of: mongoose.Schema.Types.Mixed
  }
}, {
  timestamps: true
});

// Indexes
emailLogSchema.index({ userId: 1, campaignId: 1 });
emailLogSchema.index({ userId: 1, emailAccountId: 1 });
emailLogSchema.index({ userId: 1, status: 1 });
emailLogSchema.index({ sentAt: 1 });
emailLogSchema.index({ trackingPixelId: 1 });

export default mongoose.models.EmailLog || mongoose.model('EmailLog', emailLogSchema);
import mongoose from 'mongoose';

const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  description: String,
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed'],
    default: 'draft'
  },
  emailAccountIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'EmailAccount'
  }],
  leadIds: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Lead'
  }],
  sequence: [{
    stepNumber: Number,
    subject: String,
    content: String,
    delayDays: Number,
    conditions: {
      ifOpened: Boolean,
      ifClicked: Boolean,
      ifReplied: Boolean
    },
    isActive: { type: Boolean, default: true }
  }],
  settings: {
    sendingSchedule: {
      timezone: String,
      workingDays: [Number],
      startTime: String,
      endTime: String
    },
    throttling: {
      emailsPerHour: Number,
      delayBetweenEmails: Number,
      randomizeDelay: Boolean
    },
    tracking: {
      openTracking: Boolean,
      clickTracking: Boolean,
      replyTracking: Boolean
    }
  },
  startedAt: Date,
  completedAt: Date,
  stats: {
    totalLeads: { type: Number, default: 0 },
    emailsSent: { type: Number, default: 0 },
    delivered: { type: Number, default: 0 },
    opened: { type: Number, default: 0 },
    clicked: { type: Number, default: 0 },
    replied: { type: Number, default: 0 },
    bounced: { type: Number, default: 0 },
    unsubscribed: { type: Number, default: 0 },
    interested: { type: Number, default: 0 }
  }
}, {
  timestamps: true
});

// Virtual fields for rates
campaignSchema.virtual('stats.openRate').get(function() {
  return this.stats.emailsSent > 0 ? (this.stats.opened / this.stats.emailsSent) * 100 : 0;
});

campaignSchema.virtual('stats.clickRate').get(function() {
  return this.stats.emailsSent > 0 ? (this.stats.clicked / this.stats.emailsSent) * 100 : 0;
});

campaignSchema.virtual('stats.replyRate').get(function() {
  return this.stats.emailsSent > 0 ? (this.stats.replied / this.stats.emailsSent) * 100 : 0;
});

campaignSchema.virtual('stats.bounceRate').get(function() {
  return this.stats.emailsSent > 0 ? (this.stats.bounced / this.stats.emailsSent) * 100 : 0;
});

// Ensure virtual fields are serialized
campaignSchema.set('toJSON', { virtuals: true });

// Indexes
campaignSchema.index({ userId: 1, status: 1 });

export default mongoose.models.ColdEmailCampaign || mongoose.model('ColdEmailCampaign', campaignSchema);
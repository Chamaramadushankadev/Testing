import mongoose from 'mongoose';

// Campaign Schema
const campaignSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['draft', 'active', 'paused', 'completed', 'stopped'],
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
    stepNumber: {
      type: Number,
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
    delayDays: {
      type: Number,
      default: 0,
      min: 0
    },
    conditions: {
      ifOpened: Boolean,
      ifClicked: Boolean,
      ifReplied: Boolean,
      ifNotOpened: Boolean
    },
    isActive: {
      type: Boolean,
      default: true
    }
  }],
  settings: {
    sendingSchedule: {
      timezone: {
        type: String,
        default: 'UTC'
      },
      workingDays: [{
        type: Number,
        min: 0,
        max: 6
      }],
      startTime: {
        type: String,
        default: '09:00'
      },
      endTime: {
        type: String,
        default: '17:00'
      }
    },
    throttling: {
      emailsPerHour: {
        type: Number,
        default: 10,
        min: 1,
        max: 50
      },
      delayBetweenEmails: {
        type: Number,
        default: 300, // seconds
        min: 60,
        max: 3600
      },
      randomizeDelay: {
        type: Boolean,
        default: true
      }
    },
    tracking: {
      openTracking: {
        type: Boolean,
        default: true
      },
      clickTracking: {
        type: Boolean,
        default: true
      },
      replyTracking: {
        type: Boolean,
        default: true
      }
    }
  },
  startedAt: Date,
  completedAt: Date,
  stats: {
    totalLeads: {
      type: Number,
      default: 0
    },
    emailsSent: {
      type: Number,
      default: 0
    },
    delivered: {
      type: Number,
      default: 0
    },
    opened: {
      type: Number,
      default: 0
    },
    clicked: {
      type: Number,
      default: 0
    },
    replied: {
      type: Number,
      default: 0
    },
    bounced: {
      type: Number,
      default: 0
    },
    unsubscribed: {
      type: Number,
      default: 0
    },
    interested: {
      type: Number,
      default: 0
    }
  }
}, {
  timestamps: true
});

// Indexes
campaignSchema.index({ userId: 1, status: 1 });
campaignSchema.index({ userId: 1, createdAt: -1 });

// Virtual fields for campaign stats
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

export default mongoose.models.Campaign || mongoose.model('Campaign', campaignSchema);
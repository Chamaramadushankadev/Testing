import mongoose from 'mongoose';

const emailAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  provider: {
    type: String,
    enum: ['namecheap', 'gmail', 'outlook', 'smtp'],
    required: true
  },
  smtpSettings: {
    host: String,
    port: Number,
    username: String,
    password: String,
    secure: Boolean
  },
  imapSettings: {
    host: {
      type: String,
      default: 'mail.privateemail.com'
    },
    port: {
      type: Number,
      default: 993
    },
    secure: {
      type: Boolean,
      default: true
    }
  },
  dailyLimit: {
    type: Number,
    default: 50
  },
  isActive: {
    type: Boolean,
    default: true
  },
  warmupStatus: {
    type: String,
    enum: ['not-started', 'in-progress', 'completed', 'paused'],
    default: 'not-started'
  },
  reputation: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  },
  emailsSentToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  warmupSettings: {
    enabled: { type: Boolean, default: true },
    dailyWarmupEmails: { type: Number, default: 5, min: 1, max: 20 },
    rampUpDays: { type: Number, default: 30 },
    maxDailyEmails: { type: Number, default: 40 },
    throttleRate: { type: Number, default: 5 },
    startDate: { type: Date },
    endDate: { type: Date },
    workingDays: {
      type: [String],
      default: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    },
    startTime: { type: String, default: '09:00' },
    endTime: { type: String, default: '17:00' },
    autoReply: { type: Boolean, default: true },
    autoArchive: { type: Boolean, default: true },
    replyDelay: { type: Number, default: 30 },
    maxThreadLength: { type: Number, default: 3 }
  }
}, {
  timestamps: true
});

// Indexes
emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.models.EmailAccount || mongoose.model('EmailAccount', emailAccountSchema);

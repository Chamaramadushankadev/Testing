import mongoose from 'mongoose';

// Email Account Schema
const emailAccountSchema = new mongoose.Schema({
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
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true
  },
  provider: {
    type: String,
    enum: ['namecheap', 'gmail', 'outlook', 'smtp'],
    default: 'namecheap'
  },
  smtpSettings: {
    host: {
      type: String,
      default: 'mail.privateemail.com'
    },
    port: {
      type: Number,
      default: 587
    },
    username: String,
    password: String, // Will be encrypted
    secure: {
      type: Boolean,
      default: true
    }
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
    default: 50,
    min: 1,
    max: 200
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
  lastSyncAt: Date,
  emailsSentToday: {
    type: Number,
    default: 0
  },
  lastResetDate: {
    type: Date,
    default: Date.now
  },
  warmupSettings: {
    enabled: {
      type: Boolean,
      default: true
    },
    dailyWarmupEmails: {
      type: Number,
      default: 5,
      min: 1,
      max: 20
    },
    rampUpDays: {
      type: Number,
      default: 30
    }
  }
}, {
  timestamps: true
});

// Indexes
emailAccountSchema.index({ userId: 1, isActive: 1 });
emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.models.EmailAccount || mongoose.model('EmailAccount', emailAccountSchema);
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
    enum: ['not-started', 'in-progress', 'completed'],
    default: 'not-started'
  },
  reputation: {
    type: Number,
    min: 0,
    max: 100,
    default: 100
  }
}, {
  timestamps: true
});

// Indexes
emailAccountSchema.index({ userId: 1, email: 1 }, { unique: true });

export default mongoose.models.EmailAccount || mongoose.model('EmailAccount', emailAccountSchema);
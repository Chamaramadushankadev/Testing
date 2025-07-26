import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const userSchema = new mongoose.Schema({
  firebaseUid: {
    type: String,
    unique: true,
    sparse: true // Allow null values but ensure uniqueness when present
  },
  name: {
    type: String,
    required: true,
    trim: true
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String,
    required: false, // Not required for Firebase users
    minlength: 6
  },
  jobTitle: {
    type: String,
    default: 'Content Creator'
  },
  timezone: {
    type: String,
    default: 'UTC-8'
  },
  bio: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  role: {
    type: String,
    enum: ['user', 'admin', 'moderator'],
    default: 'user'
  },
  plan: {
    type: String,
    enum: ['free', 'basic', 'pro', 'business'],
    default: 'free'
  },
  planExpiry: {
    type: Date
  },
  settings: {
    notifications: {
      email: { type: Boolean, default: true },
      push: { type: Boolean, default: true },
      taskReminders: { type: Boolean, default: true },
      goalUpdates: { type: Boolean, default: true },
      emailCampaigns: { type: Boolean, default: true },
      scriptGeneration: { type: Boolean, default: true },
      googleAlerts: { type: Boolean, default: true },
      weeklySummary: { type: Boolean, default: true }
    },
    appearance: {
      theme: { type: String, enum: ['light', 'dark', 'auto'], default: 'light' },
      compactMode: { type: Boolean, default: false },
      showAnimations: { type: Boolean, default: true }
    },
    email: {
      smtpHost: String,
      smtpPort: Number,
      smtpUsername: String,
      smtpPassword: String
    }
  },
  isActive: {
    type: Boolean,
    default: true
  }
}, {
  timestamps: true
});

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password') || !this.password) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  if (!this.password) return false; // Firebase users don't have passwords
  return bcrypt.compare(candidatePassword, this.password);
};

// Remove password from JSON output
userSchema.methods.toJSON = function() {
  const user = this.toObject();
  delete user.password;
  return user;
};

export default mongoose.model('User', userSchema);
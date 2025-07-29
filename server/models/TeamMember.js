import mongoose from 'mongoose';

const teamMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  invitedBy: {
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
    lowercase: true,
    trim: true
  },
  role: {
    type: String,
    enum: ['admin', 'editor', 'viewer'],
    default: 'viewer'
  },
  status: {
    type: String,
    enum: ['pending', 'active', 'inactive', 'declined'],
    default: 'pending'
  },
  permissions: {
    dashboard: { type: Boolean, default: true },
    goals: { type: Boolean, default: true },
    tasks: { type: Boolean, default: true },
    notes: { type: Boolean, default: true },
    proposals: { type: Boolean, default: false },
    reminders: { type: Boolean, default: true },
    pomodoro: { type: Boolean, default: true },
    scripts: { type: Boolean, default: false },
    email: { type: Boolean, default: false },
    'cold-email': { type: Boolean, default: false },
    finance: { type: Boolean, default: false },
    analytics: { type: Boolean, default: false },
    settings: { type: Boolean, default: false },
    help: { type: Boolean, default: true }
  },
  invitationToken: {
    type: String,
    unique: true,
    sparse: true
  },
  invitedAt: {
    type: Date,
    default: Date.now
  },
  joinedAt: {
    type: Date
  },
  lastActiveAt: {
    type: Date
  },
  avatar: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Indexes
teamMemberSchema.index({ userId: 1, email: 1 }, { unique: true });
teamMemberSchema.index({ invitationToken: 1 });
teamMemberSchema.index({ status: 1 });

export default mongoose.models.TeamMember || mongoose.model('TeamMember', teamMemberSchema);
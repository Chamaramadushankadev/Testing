import mongoose from 'mongoose';

// Lead Schema
const leadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
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
  company: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  customFields: {
    type: Map,
    of: String
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['new', 'contacted', 'opened', 'clicked', 'replied', 'interested', 'not-interested', 'bounced', 'unsubscribed'],
    default: 'new'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  source: {
    type: String,
    trim: true
  },
  categoryId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LeadCategory'
  },
  lastContactedAt: Date,
  notes: {
    type: String,
    trim: true
  },
  unsubscribedAt: Date,
  bounceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ userId: 1, email: 1 }, { unique: true });
leadSchema.index({ userId: 1, status: 1 });
leadSchema.index({ userId: 1, tags: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);
import mongoose from 'mongoose';

const leadSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  lastName: {
    type: String,
    required: true
  },
  email: {
    type: String,
    required: true
  },
  company: String,
  website: String,
  jobTitle: String,
  industry: String,
  customFields: {
    type: Map,
    of: String
  },
  tags: [String],
  status: {
    type: String,
    enum: ['new', 'contacted', 'opened', 'replied', 'interested', 'not-interested', 'bounced', 'unsubscribed'],
    default: 'new'
  },
  score: {
    type: Number,
    min: 0,
    max: 100,
    default: 50
  },
  source: String,
  lastContactedAt: Date,
  notes: String
}, {
  timestamps: true
});

// Indexes
leadSchema.index({ userId: 1, email: 1 }, { unique: true });
leadSchema.index({ userId: 1, status: 1 });

export default mongoose.models.Lead || mongoose.model('Lead', leadSchema);
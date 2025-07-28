import mongoose from 'mongoose';

const clientSchema = new mongoose.Schema({
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
  company: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  address: {
    type: String,
    trim: true
  },
  website: {
    type: String,
    trim: true
  },
  industry: {
    type: String,
    trim: true
  },
  jobTitle: {
    type: String,
    trim: true
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  avatar: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'inactive', 'prospect', 'archived'],
    default: 'active'
  },
  // Financial information
  currency: {
    type: String,
    default: 'USD'
  },
  paymentTerms: {
    type: Number,
    default: 30,
    min: 0
  },
  taxId: {
    type: String,
    trim: true
  },
  billingAddress: {
    type: String,
    trim: true
  },
  // Statistics (calculated fields)
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  totalTimeSpent: {
    type: Number,
    default: 0,
    min: 0
  },
  totalTasks: {
    type: Number,
    default: 0,
    min: 0
  },
  completedTasks: {
    type: Number,
    default: 0,
    min: 0
  },
  // Metadata
  isRecurring: {
    type: Boolean,
    default: false
  },
  lastContactedAt: {
    type: Date
  },
  nextFollowUpAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes for better performance
clientSchema.index({ userId: 1, email: 1 }, { unique: true });
clientSchema.index({ userId: 1, name: 1 });
clientSchema.index({ userId: 1, status: 1 });
clientSchema.index({ userId: 1, company: 1 });

// Virtual for full name display
clientSchema.virtual('displayName').get(function() {
  return this.company ? `${this.name} (${this.company})` : this.name;
});

// Ensure virtual fields are serialized
clientSchema.set('toJSON', { virtuals: true });

export default mongoose.models.Client || mongoose.model('Client', clientSchema);
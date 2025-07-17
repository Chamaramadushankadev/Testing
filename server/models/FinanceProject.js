import mongoose from 'mongoose';

const financeProjectSchema = new mongoose.Schema({
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
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceClient',
    required: true
  },
  description: {
    type: String,
    trim: true
  },
  status: {
    type: String,
    enum: ['active', 'completed', 'on-hold', 'cancelled'],
    default: 'active'
  },
  startDate: {
    type: Date,
    required: true
  },
  endDate: Date,
  budget: {
    type: Number,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalExpenses: {
    type: Number,
    default: 0,
    min: 0
  },
  profitMargin: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
financeProjectSchema.index({ userId: 1, clientId: 1 });
financeProjectSchema.index({ userId: 1, status: 1 });

// Calculate profit margin
financeProjectSchema.pre('save', function(next) {
  if (this.totalRevenue > 0) {
    this.profitMargin = ((this.totalRevenue - this.totalExpenses) / this.totalRevenue) * 100;
  } else {
    this.profitMargin = 0;
  }
  next();
});

export default mongoose.models.FinanceProject || mongoose.model('FinanceProject', financeProjectSchema);
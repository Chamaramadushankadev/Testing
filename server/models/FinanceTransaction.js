import mongoose from 'mongoose';

const financeTransactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['income', 'expense'],
    required: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  description: {
    type: String,
    required: true,
    trim: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  date: {
    type: Date,
    required: true
  },
  clientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceClient'
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceProject'
  },
  paymentMethod: {
    type: String,
    trim: true
  },
  receiptUrl: {
    type: String,
    trim: true
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: {
      type: String,
      enum: ['daily', 'weekly', 'monthly', 'yearly']
    },
    interval: {
      type: Number,
      min: 1
    },
    endDate: Date
  },
  tags: [{
    type: String,
    trim: true
  }],
  parentTransactionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'FinanceTransaction'
  }
}, {
  timestamps: true
});

// Indexes
financeTransactionSchema.index({ userId: 1, type: 1, date: -1 });
financeTransactionSchema.index({ userId: 1, clientId: 1 });
financeTransactionSchema.index({ userId: 1, projectId: 1 });
financeTransactionSchema.index({ userId: 1, category: 1 });

export default mongoose.models.FinanceTransaction || mongoose.model('FinanceTransaction', financeTransactionSchema);
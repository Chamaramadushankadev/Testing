import mongoose from 'mongoose';

const financeClientSchema = new mongoose.Schema({
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
  address: {
    type: String,
    trim: true
  },
  phone: {
    type: String,
    trim: true
  },
  currency: {
    type: String,
    required: true,
    default: 'USD'
  },
  taxId: {
    type: String,
    trim: true
  },
  paymentTerms: {
    type: Number,
    default: 30,
    min: 0
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  totalRevenue: {
    type: Number,
    default: 0,
    min: 0
  },
  totalProfit: {
    type: Number,
    default: 0
  },
  notes: {
    type: String,
    trim: true
  }
}, {
  timestamps: true
});

// Indexes
financeClientSchema.index({ userId: 1, email: 1 }, { unique: true });
financeClientSchema.index({ userId: 1, name: 1 });

export default mongoose.models.FinanceClient || mongoose.model('FinanceClient', financeClientSchema);
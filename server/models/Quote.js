import mongoose from 'mongoose';

const quoteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  text: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  }, 
  author: {
    type: String,
    required: true,
    trim: true,
    maxlength: 100
  },
  category: {
    type: String,
    enum: ['motivation', 'productivity', 'success', 'inspiration', 'leadership', 'creativity', 'general'],
    default: 'motivation'
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Indexes for better performance
quoteSchema.index({ userId: 1, isActive: 1 });
quoteSchema.index({ isDefault: 1, isActive: 1 });
quoteSchema.index({ category: 1, isActive: 1 });

export default mongoose.models.Quote || mongoose.model('Quote', quoteSchema);
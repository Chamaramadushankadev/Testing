import mongoose from 'mongoose';

// Email Template Schema
const emailTemplateSchema = new mongoose.Schema({
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
  category: {
    type: String,
    enum: ['cold-outreach', 'follow-up', 'partnership', 'sales', 'custom'],
    default: 'custom'
  },
  subject: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  variables: [{
    type: String,
    trim: true
  }],
  industry: {
    type: String,
    trim: true
  },
  useCase: {
    type: String,
    trim: true
  },
  isDefault: {
    type: Boolean,
    default: false
  },
  usageCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
emailTemplateSchema.index({ userId: 1, category: 1 });
emailTemplateSchema.index({ userId: 1, name: 1 });

export default mongoose.models.EmailTemplate || mongoose.model('EmailTemplate', emailTemplateSchema);
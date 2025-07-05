import mongoose from 'mongoose';

const proposalCategorySchema = new mongoose.Schema({
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
  description: {
    type: String,
    default: '',
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

const proposalSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    type: String,
    required: true
  },
  category: {
    type: String,
    required: true,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'pending', 'approved', 'rejected', 'completed'],
    default: 'draft'
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  clientName: {
    type: String,
    trim: true
  },
  projectValue: {
    type: Number,
    min: 0
  },
  deadline: {
    type: Date
  },
  attachments: [{
    name: String,
    type: { type: String, enum: ['file', 'link'] },
    url: String,
    size: Number
  }]
}, {
  timestamps: true
});

// Index for better search performance
proposalSchema.index({ userId: 1, title: 'text', content: 'text' });
proposalSchema.index({ userId: 1, category: 1 });
proposalSchema.index({ userId: 1, status: 1 });
proposalSchema.index({ userId: 1, tags: 1 });

proposalCategorySchema.index({ userId: 1, name: 1 });

export const ProposalCategory = mongoose.model('ProposalCategory', proposalCategorySchema);
export const Proposal = mongoose.model('Proposal', proposalSchema);
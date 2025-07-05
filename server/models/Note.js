import mongoose from 'mongoose';

const noteSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  goalId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
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
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [{
    name: String,
    type: { type: String, enum: ['file', 'link'] },
    url: String,
    size: Number
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  isFavorite: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better search performance
noteSchema.index({ userId: 1, title: 'text', content: 'text' });
noteSchema.index({ userId: 1, tags: 1 });
noteSchema.index({ goalId: 1 });

export default mongoose.model('Note', noteSchema);
import mongoose from 'mongoose';

const sharedTimeSheetSchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  shareId: {
    type: String,
    required: true,
    unique: true
  },
  filters: {
    startDate: Date,
    endDate: Date,
    projectIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Goal'
    }],
    taskIds: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Task'
    }]
  },
  isActive: {
    type: Boolean,
    default: true
  },
  accessCount: {
    type: Number,
    default: 0
  },
  lastAccessedAt: {
    type: Date
  },
  expiresAt: {
    type: Date
  }
}, {
  timestamps: true
});

// Indexes
sharedTimeSheetSchema.index({ shareId: 1 });
sharedTimeSheetSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.SharedTimeSheet || mongoose.model('SharedTimeSheet', sharedTimeSheetSchema);
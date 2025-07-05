import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
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
  message: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['task', 'goal', 'custom'],
    required: true
  },
  scheduledAt: {
    type: Date,
    required: true
  },
  isCompleted: {
    type: Boolean,
    default: false
  },
  completedAt: Date,
  entityId: {
    type: mongoose.Schema.Types.ObjectId,
    refPath: 'entityType'
  },
  entityType: {
    type: String,
    enum: ['Goal', 'Task']
  },
  isRecurring: {
    type: Boolean,
    default: false
  },
  recurringPattern: {
    frequency: { type: String, enum: ['daily', 'weekly', 'monthly'] },
    interval: Number,
    endDate: Date
  },
  notificationSent: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Index for better query performance
reminderSchema.index({ userId: 1, scheduledAt: 1 });
reminderSchema.index({ userId: 1, isCompleted: 1 });

export default mongoose.model('Reminder', reminderSchema);
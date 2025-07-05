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
    frequency: { 
      type: String, 
      enum: ['daily', 'weekly', 'monthly', 'yearly'],
      required: function() { return this.isRecurring; }
    },
    interval: { 
      type: Number, 
      default: 1,
      min: 1
    },
    endDate: Date,
    daysOfWeek: [{ type: Number, min: 0, max: 6 }], // 0 = Sunday, 6 = Saturday
    dayOfMonth: { type: Number, min: 1, max: 31 },
    maxOccurrences: Number
  },
  notificationSent: {
    type: Boolean,
    default: false
  },
  parentReminderId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Reminder'
  },
  occurrenceCount: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Index for better query performance
reminderSchema.index({ userId: 1, scheduledAt: 1 });
reminderSchema.index({ userId: 1, isCompleted: 1 });
reminderSchema.index({ userId: 1, type: 1 });
reminderSchema.index({ scheduledAt: 1, isCompleted: 1 });

// Virtual for next occurrence calculation
reminderSchema.virtual('nextOccurrence').get(function() {
  if (!this.isRecurring || this.isCompleted) return null;
  
  const now = new Date();
  const scheduled = new Date(this.scheduledAt);
  
  if (scheduled > now) return scheduled;
  
  const pattern = this.recurringPattern;
  let nextDate = new Date(scheduled);
  
  switch (pattern.frequency) {
    case 'daily':
      while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + pattern.interval);
      }
      break;
    case 'weekly':
      while (nextDate <= now) {
        nextDate.setDate(nextDate.getDate() + (7 * pattern.interval));
      }
      break;
    case 'monthly':
      while (nextDate <= now) {
        nextDate.setMonth(nextDate.getMonth() + pattern.interval);
      }
      break;
    case 'yearly':
      while (nextDate <= now) {
        nextDate.setFullYear(nextDate.getFullYear() + pattern.interval);
      }
      break;
  }
  
  // Check if we've exceeded the end date or max occurrences
  if (pattern.endDate && nextDate > pattern.endDate) return null;
  if (pattern.maxOccurrences && this.occurrenceCount >= pattern.maxOccurrences) return null;
  
  return nextDate;
});

// Method to create next occurrence
reminderSchema.methods.createNextOccurrence = async function() {
  if (!this.isRecurring || this.isCompleted) return null;
  
  const nextDate = this.nextOccurrence;
  if (!nextDate) return null;
  
  const nextReminder = new this.constructor({
    userId: this.userId,
    title: this.title,
    message: this.message,
    type: this.type,
    scheduledAt: nextDate,
    entityId: this.entityId,
    entityType: this.entityType,
    isRecurring: this.isRecurring,
    recurringPattern: this.recurringPattern,
    parentReminderId: this.parentReminderId || this._id,
    occurrenceCount: this.occurrenceCount + 1
  });
  
  return await nextReminder.save();
};

export default mongoose.model('Reminder', reminderSchema);
import mongoose from 'mongoose';

const timeEntrySchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  projectId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Goal'
  },
  taskId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Task'
  },
  projectName: {
    type: String,
    required: true
  },
  taskName: {
    type: String
  },
  description: {
    type: String,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date
  },
  duration: {
    type: Number, // in seconds
    default: 0
  },
  isRunning: {
    type: Boolean,
    default: false
  },
  notes: {
    type: String,
    trim: true
  },
  tags: [{
    type: String,
    trim: true
  }],
  date: {
    type: Date,
    required: true
  }
}, {
  timestamps: true
});

// Indexes for better query performance
timeEntrySchema.index({ userId: 1, date: -1 });
timeEntrySchema.index({ userId: 1, isRunning: 1 });
timeEntrySchema.index({ userId: 1, projectId: 1 });
timeEntrySchema.index({ userId: 1, taskId: 1 });

// Calculate duration before saving
timeEntrySchema.pre('save', function(next) {
  if (this.startTime && this.endTime && !this.isRunning) {
    this.duration = Math.floor((this.endTime - this.startTime) / 1000);
  }
  next();
});

export default mongoose.models.TimeEntry || mongoose.model('TimeEntry', timeEntrySchema);
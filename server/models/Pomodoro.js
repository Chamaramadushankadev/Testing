import mongoose from 'mongoose';

const pomodoroSessionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  focusTime: {
    type: Number,
    required: true,
    min: 1,
    max: 60
  },
  completed: {
    type: Boolean,
    default: true
  },
  startTime: {
    type: Date,
    default: Date.now
  },
  endTime: {
    type: Date
  },
  notes: {
    type: String
  }
}, {
  timestamps: true
});

// Index for better query performance
pomodoroSessionSchema.index({ userId: 1, date: 1 });
pomodoroSessionSchema.index({ userId: 1, completed: 1 });

export default mongoose.model('PomodoroSession', pomodoroSessionSchema);
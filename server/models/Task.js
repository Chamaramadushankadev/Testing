import mongoose from 'mongoose';

const attachmentSchema = new mongoose.Schema({
  name: String,
  type: { type: String, enum: ['file', 'link'] },
  url: String,
  size: Number
});

const taskSchema = new mongoose.Schema({
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
    required: true
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high'],
    default: 'medium'
  },
  status: {
    type: String,
    enum: ['pending', 'in-progress', 'completed'],
    default: 'pending'
  },
  dueDate: {
    type: Date,
    required: true
  },
  completedAt: Date,
  estimatedHours: Number,
  actualHours: Number,
  tags: [{
    type: String,
    trim: true
  }],
  attachments: [attachmentSchema],
  subtasks: [{
    title: String,
    isCompleted: { type: Boolean, default: false },
    completedAt: Date
  }]
}, {
  timestamps: true
});

// ✅ Add virtual `id`
taskSchema.virtual('id').get(function () {
  return this._id.toHexString();
});

// ✅ Ensure virtuals are included in JSON
taskSchema.set('toJSON', {
  virtuals: true,
  versionKey: false,
  transform: function (doc, ret) {
    delete ret._id;
  }
});

taskSchema.index({ userId: 1, status: 1 });
taskSchema.index({ userId: 1, dueDate: 1 });

export default mongoose.models.Task || mongoose.model('Task', taskSchema);

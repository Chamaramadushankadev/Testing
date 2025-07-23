import mongoose from 'mongoose';

const messageSchema = new mongoose.Schema({
  content: {
    type: String,
    required: true,
    trim: true
  },
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channel: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Channel',
    required: true
  },
  type: {
    type: String,
    enum: ['text', 'image', 'file', 'system'],
    default: 'text'
  },
  edited: {
    type: Boolean,
    default: false
  },
  editedAt: {
    type: Date
  },
  deleted: {
    type: Boolean,
    default: false
  },
  deletedAt: {
    type: Date
  },
  replyTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Message'
  },
  attachments: [{
    filename: String,
    url: String,
    size: Number,
    mimetype: String
  }]
}, {
  timestamps: true
});

// Index for better query performance
messageSchema.index({ channel: 1, createdAt: -1 });
messageSchema.index({ sender: 1 });
messageSchema.index({ deleted: 1 });

export default mongoose.models.Message || mongoose.model('Message', messageSchema);
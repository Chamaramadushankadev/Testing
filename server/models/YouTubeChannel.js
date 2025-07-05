import mongoose from 'mongoose';

const youTubeChannelSchema = new mongoose.Schema({
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
  channelId: {
    type: String,
    trim: true
  },
  description: {
    type: String,
    default: '',
    trim: true
  },
  url: {
    type: String,
    trim: true
  },
  subscriberCount: {
    type: Number,
    default: 0
  },
  isActive: {
    type: Boolean,
    default: true
  },
  color: {
    type: String,
    default: '#3B82F6' // Default blue color
  },
  tags: [{
    type: String,
    trim: true
  }]
}, {
  timestamps: true
});

// Index for better query performance
youTubeChannelSchema.index({ userId: 1, isActive: 1 });
youTubeChannelSchema.index({ userId: 1, name: 1 });

export default mongoose.model('YouTubeChannel', youTubeChannelSchema);
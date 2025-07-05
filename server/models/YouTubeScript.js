import mongoose from 'mongoose';

const youTubeScriptSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  channelId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'YouTubeChannel',
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
  tone: {
    type: String,
    enum: ['witty', 'emotional', 'informative', 'casual'],
    default: 'informative'
  },
  source: {
    type: String,
    default: 'Manual Entry'
  },
  keywords: [{
    type: String,
    trim: true
  }],
  wordCount: {
    type: Number,
    default: 0
  },
  estimatedDuration: {
    type: Number, // in seconds
    default: 0
  },
  isGenerated: {
    type: Boolean,
    default: false
  },
  generationPrompt: {
    type: String
  },
  status: {
    type: String,
    enum: ['draft', 'ready', 'used'],
    default: 'draft'
  },
  tags: [{
    type: String,
    trim: true
  }],
  notes: {
    type: String,
    default: ''
  }
}, {
  timestamps: true
});

// Calculate word count before saving
youTubeScriptSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Count words in content
    const words = this.content.trim().split(/\s+/).filter(word => word.length > 0);
    this.wordCount = words.length;
    
    // Estimate duration (average speaking rate: 150-160 words per minute)
    this.estimatedDuration = Math.ceil((this.wordCount / 155) * 60); // in seconds
  }
  next();
});

// Index for better query performance
youTubeScriptSchema.index({ userId: 1, channelId: 1 });
youTubeScriptSchema.index({ userId: 1, status: 1 });
youTubeScriptSchema.index({ userId: 1, tone: 1 });
youTubeScriptSchema.index({ channelId: 1, createdAt: -1 });

export default mongoose.model('YouTubeScript', youTubeScriptSchema);
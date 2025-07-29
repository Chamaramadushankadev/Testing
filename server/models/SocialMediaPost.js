import mongoose from 'mongoose';

const socialMediaPostSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  type: {
    type: String,
    enum: ['youtube', 'facebook', 'instagram', 'template'],
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'facebook', 'instagram', 'multi'],
    required: true
  },
  title: {
    type: String,
    required: true,
    trim: true
  },
  content: {
    script: String,
    caption: String,
    hashtags: [String],
    mentions: [String]
  },
  media: {
    thumbnailUrl: String,
    voiceoverUrl: String,
    images: [{
      url: String,
      s3Key: String,
      filename: String,
      size: Number,
      uploadedAt: { type: Date, default: Date.now }
    }],
    templateData: {
      canvasWidth: { type: Number, default: 1080 },
      canvasHeight: { type: Number, default: 1080 },
      backgroundColor: { type: String, default: '#ffffff' },
      elements: [{
        id: String,
        type: { type: String, enum: ['text', 'image', 'shape'] },
        content: String,
        position: {
          x: Number,
          y: Number
        },
        size: {
          width: Number,
          height: Number
        },
        styles: {
          fontSize: Number,
          fontFamily: String,
          fontWeight: String,
          color: String,
          backgroundColor: String,
          borderRadius: Number,
          opacity: Number,
          rotation: Number
        }
      }]
    }
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'SocialMediaCategory'
  },
  tags: [{
    type: String,
    trim: true
  }],
  status: {
    type: String,
    enum: ['draft', 'ready', 'scheduled', 'published'],
    default: 'draft'
  },
  scheduledAt: Date,
  publishedAt: Date,
  accounts: [{
    platform: String,
    accountId: String,
    accountName: String,
    isActive: Boolean
  }],
  analytics: {
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    shares: { type: Number, default: 0 },
    comments: { type: Number, default: 0 },
    engagement: { type: Number, default: 0 }
  },
  isTemplate: {
    type: Boolean,
    default: false
  },
  templateCategory: String,
  keywords: [{
    type: String,
    trim: true
  }],
  notes: String
}, {
  timestamps: true
});

// Indexes for better query performance
socialMediaPostSchema.index({ userId: 1, type: 1 });
socialMediaPostSchema.index({ userId: 1, platform: 1 });
socialMediaPostSchema.index({ userId: 1, status: 1 });
socialMediaPostSchema.index({ userId: 1, category: 1 });
socialMediaPostSchema.index({ userId: 1, isTemplate: 1 });

export default mongoose.models.SocialMediaPost || mongoose.model('SocialMediaPost', socialMediaPostSchema);
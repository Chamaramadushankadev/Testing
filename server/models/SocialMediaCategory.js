import mongoose from 'mongoose';

const socialMediaCategorySchema = new mongoose.Schema({
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
  description: {
    type: String,
    trim: true
  },
  color: {
    type: String,
    default: '#3B82F6'
  },
  icon: {
    type: String,
    default: 'folder'
  },
  platforms: [{
    type: String,
    enum: ['youtube', 'facebook', 'instagram']
  }],
  isDefault: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

// Indexes
socialMediaCategorySchema.index({ userId: 1, name: 1 });

export default mongoose.models.SocialMediaCategory || mongoose.model('SocialMediaCategory', socialMediaCategorySchema);
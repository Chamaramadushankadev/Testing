import mongoose from 'mongoose';

const socialMediaAccountSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  platform: {
    type: String,
    enum: ['youtube', 'facebook', 'instagram'],
    required: true
  },
  accountName: {
    type: String,
    required: true,
    trim: true
  },
  accountId: {
    type: String,
    required: true
  },
  accessToken: String,
  refreshToken: String,
  tokenExpiry: Date,
  isActive: {
    type: Boolean,
    default: true
  },
  accountData: {
    profilePicture: String,
    followerCount: Number,
    username: String,
    displayName: String
  },
  permissions: [{
    type: String
  }],
  lastSync: Date
}, {
  timestamps: true
});

// Indexes
socialMediaAccountSchema.index({ userId: 1, platform: 1 });
socialMediaAccountSchema.index({ userId: 1, isActive: 1 });

export default mongoose.models.SocialMediaAccount || mongoose.model('SocialMediaAccount', socialMediaAccountSchema);
import mongoose from 'mongoose';

const userStorageSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  totalUsed: {
    type: Number,
    default: 0
  },
  totalLimit: {
    type: Number,
    default: 104857600 // 100MB in bytes
  },
  files: [{
    s3Key: {
      type: String,
      required: true
    },
    s3Url: {
      type: String,
      required: true
    },
    originalName: {
      type: String,
      required: true
    },
    mimeType: {
      type: String,
      required: true
    },
    size: {
      type: Number,
      required: true
    },
    moodboardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Moodboard'
    },
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }]
}, {
  timestamps: true
});

// Indexes
userStorageSchema.index({ userId: 1 });
userStorageSchema.index({ 'files.s3Key': 1 });

export default mongoose.models.UserStorage || mongoose.model('UserStorage', userStorageSchema);
import mongoose from 'mongoose';

const moodboardItemSchema = new mongoose.Schema({
  id: {
    type: String,
    required: true
  },
  type: {
    type: String,
    enum: ['video', 'image', 'text'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  position: {
    x: {
      type: Number,
      required: true,
      default: 0
    },
    y: {
      type: Number,
      required: true,
      default: 0
    }
  },
  size: {
    width: {
      type: Number,
      required: true,
      default: 200
    },
    height: {
      type: Number,
      required: true,
      default: 200
    }
  },
  styles: {
    fontSize: {
      type: Number,
      default: 16
    },
    color: {
      type: String,
      default: '#000000'
    },
    fontFamily: {
      type: String,
      default: 'Arial'
    },
    fontWeight: {
      type: String,
      default: 'normal'
    },
    textAlign: {
      type: String,
      default: 'left'
    },
    backgroundColor: {
      type: String,
      default: 'transparent'
    },
    borderRadius: {
      type: Number,
      default: 0
    },
    opacity: {
      type: Number,
      default: 1
    }
  },
  zIndex: {
    type: Number,
    default: 1
  },
  metadata: {
    originalUrl: String,
    platform: String,
    fileSize: Number,
    mimeType: String,
    s3Key: String,
    s3Url: String
  }
}, {
  _id: false
});

const moodboardSchema = new mongoose.Schema({
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
    trim: true
  },
  items: [moodboardItemSchema],
  canvas: {
    width: {
      type: Number,
      default: 1920
    },
    height: {
      type: Number,
      default: 1080
    },
    backgroundColor: {
      type: String,
      default: '#ffffff'
    },
    zoom: {
      type: Number,
      default: 1
    },
    pan: {
      x: {
        type: Number,
        default: 0
      },
      y: {
        type: Number,
        default: 0
      }
    }
  },
  tags: [{
    type: String,
    trim: true
  }],
  isPublic: {
    type: Boolean,
    default: false
  },
  storageUsed: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

// Indexes
moodboardSchema.index({ userId: 1, createdAt: -1 });
moodboardSchema.index({ userId: 1, title: 'text', description: 'text' });
moodboardSchema.index({ tags: 1 });

export default mongoose.models.Moodboard || mongoose.model('Moodboard', moodboardSchema);
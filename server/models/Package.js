import mongoose from 'mongoose';

const packageSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    unique: true
  },
  displayName: {
    type: String,
    required: true
  },
  description: {
    type: String,
    required: true
  },
  price: {
    monthly: {
      type: Number,
      required: true
    },
    yearly: {
      type: Number,
      required: true
    }
  },
  features: [{
    type: String,
    required: true
  }],
  modules: [{
    type: String,
    required: true
  }],
  limits: {
    teamMembers: {
      type: Number,
      default: -1 // -1 means unlimited
    },
    storage: {
      type: Number,
      default: -1 // in GB, -1 means unlimited
    },
    apiCalls: {
      type: Number,
      default: -1 // per month, -1 means unlimited
    }
  },
  isActive: {
    type: Boolean,
    default: true
  },
  order: {
    type: Number,
    default: 0
  }
}, {
  timestamps: true
});

export default mongoose.models.Package || mongoose.model('Package', packageSchema);
import mongoose from 'mongoose';

const taxSettingsSchema = new mongoose.Schema({
  region: {
    type: String,
    required: true
  },
  taxType: {
    type: String,
    enum: ['self-employment', 'vat', 'gst', 'income'],
    required: true
  },
  rate: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  quarterlyDates: [Date],
  annualDeadline: Date,
  isActive: {
    type: Boolean,
    default: true
  }
});

const financeSettingsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    unique: true
  },
  defaultCurrency: {
    type: String,
    required: true,
    default: 'USD'
  },
  taxSettings: [taxSettingsSchema],
  invoiceBranding: {
    logo: String,
    primaryColor: {
      type: String,
      default: '#3B82F6'
    },
    companyName: {
      type: String,
      required: true
    },
    companyAddress: String,
    companyEmail: String,
    companyPhone: String,
    footer: String
  },
  paymentMethods: {
    stripe: {
      enabled: {
        type: Boolean,
        default: false
      },
      publicKey: String
    },
    paypal: {
      enabled: {
        type: Boolean,
        default: false
      },
      clientId: String
    },
    wise: {
      enabled: {
        type: Boolean,
        default: false
      },
      apiKey: String
    }
  },
  notifications: {
    invoiceReminders: {
      type: Boolean,
      default: true
    },
    taxDeadlines: {
      type: Boolean,
      default: true
    },
    budgetAlerts: {
      type: Boolean,
      default: true
    },
    paymentReceived: {
      type: Boolean,
      default: true
    }
  }
}, {
  timestamps: true
});

// Indexes
financeSettingsSchema.index({ userId: 1 });
export default mongoose.models.FinanceSettings || mongoose.model('FinanceSettings', financeSettingsSchema);
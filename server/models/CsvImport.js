import mongoose from 'mongoose';

// CSV Import Schema
const csvImportSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  filename: {
    type: String,
    required: true
  },
  status: {
    type: String,
    enum: ['processing', 'completed', 'failed'],
    default: 'processing'
  },
  totalRows: {
    type: Number,
    default: 0
  },
  processedRows: {
    type: Number,
    default: 0
  },
  successfulRows: {
    type: Number,
    default: 0
  },
  failedRows: {
    type: Number,
    default: 0
  },
  mapping: {
    type: Map,
    of: String
  },
  errors: [{
    row: Number,
    field: String,
    message: String
  }],
  duplicates: [{
    row: Number,
    email: String,
    existingLeadId: String
  }]
}, {
  timestamps: true
});

// Indexes
csvImportSchema.index({ userId: 1, createdAt: -1 });
csvImportSchema.index({ status: 1 });

export default mongoose.models.CsvImport || mongoose.model('CsvImport', csvImportSchema);
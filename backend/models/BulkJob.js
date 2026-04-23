const mongoose = require('mongoose');

const resultRowSchema = new mongoose.Schema({
  name: String,
  address: String,
  phone1: String,
  phone1Confidence: String,
  phone2: String,
  phone2Confidence: String,
  email1: String,
  email1Confidence: String,
  email2: String,
  email2Confidence: String,
  status: { type: String, default: 'found' },
}, { _id: false });

const bulkJobSchema = new mongoose.Schema({
  jobId: { type: String, required: true, unique: true, index: true },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending',
  },
  totalRecords: { type: Number, default: 0 },
  processedRecords: { type: Number, default: 0 },
  results: [resultRowSchema],
  error: String,
  createdAt: { type: Date, default: Date.now },
});

// 7-day TTL for bulk jobs
bulkJobSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 7 });

module.exports = mongoose.model('BulkJob', bulkJobSchema);

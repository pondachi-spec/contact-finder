const mongoose = require('mongoose');

const phoneSchema = new mongoose.Schema({
  number: String,
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  sources: [String],
  lastSeen: Date,
}, { _id: false });

const emailSchema = new mongoose.Schema({
  address: String,
  confidence: { type: String, enum: ['HIGH', 'MEDIUM', 'LOW'] },
  sources: [String],
  lastSeen: Date,
}, { _id: false });

const contactSchema = new mongoose.Schema({
  ownerName: { type: String, required: true, index: true },
  propertyAddress: { type: String, required: true, index: true },
  phones: [phoneSchema],
  emails: [emailSchema],
  isMock: { type: Boolean, default: false },
  source: { type: String, default: 'BatchData' },
  createdAt: { type: Date, default: Date.now },
});

// 90-day TTL index
contactSchema.index({ createdAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 * 90 });

// Compound index for cache lookup
contactSchema.index({ ownerName: 1, propertyAddress: 1 });

module.exports = mongoose.model('Contact', contactSchema);

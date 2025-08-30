const mongoose = require('mongoose');

const uploadedFileSchema = new mongoose.Schema({
  filename: {
    type: String,
    required: true
  },
  originalName: {
    type: String,
    required: true
  },
  mimetype: {
    type: String,
    required: true
  },
  size: {
    type: Number,
    required: true
  },
  path: {
    type: String,
    required: true
  },
  fileType: {
    type: String,
    enum: ['html', 'css', 'js', 'csv', 'word', 'excel', 'text', 'markdown', 'json', 'pdf', 'image', 'code', 'other'],
    required: true
  },
  content: {
    text: String,
    html: String,
    json: mongoose.Schema.Types.Mixed,
    metadata: mongoose.Schema.Types.Mixed
  },
  uploadedAt: {
    type: Date,
    default: Date.now
  },
  processed: {
    type: Boolean,
    default: false
  },
  processingStatus: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
  tags: [String],
  notes: String,
  userId: String
});

// Indexes for better query performance
uploadedFileSchema.index({ filename: 1 });
uploadedFileSchema.index({ fileType: 1 });
uploadedFileSchema.index({ uploadedAt: -1 });
uploadedFileSchema.index({ processed: 1 });

module.exports = mongoose.model('UploadedFile', uploadedFileSchema);
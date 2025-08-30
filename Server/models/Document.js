const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
  documentId: {
    type: String,
    required: true,
    unique: true
  },
  title: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true
  },
  contentType: {
    type: String,
    enum: ['html', 'json', 'csv', 'markdown', 'plain-text', 'pdf', 'word', 'excel', 'image', 'code'],
    required: true
  },
  source: {
    type: String,
    enum: ['scraped', 'uploaded'],
    required: true
  },
  sourceUrl: String,
  filePath: String,
  fileSize: Number,
  mimeType: String,
  metadata: {
    scrapedAt: Date,
    uploadedAt: Date,
    lastModified: Date,
    encoding: String,
    language: String,
    tags: [String],
    categories: [String]
  },
  processing: {
    isProcessed: {
      type: Boolean,
      default: false
    },
    processedAt: Date,
    extractedText: String,
    summary: String,
    entities: [String],
    keywords: [String]
  },
  screenshots: [{
    size: String,
    path: String,
    takenAt: Date
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

documentSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Text index for search functionality
documentSchema.index({
  title: 'text',
  content: 'text',
  'processing.extractedText': 'text',
  'processing.summary': 'text',
  'processing.keywords': 'text'
});

module.exports = mongoose.model('Document', documentSchema);
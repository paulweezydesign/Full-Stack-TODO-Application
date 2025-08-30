const mongoose = require('mongoose');

const scrapedPageSchema = new mongoose.Schema({
  url: {
    type: String,
    required: true,
    index: true
  },
  title: String,
  content: {
    html: String,
    text: String,
    markdown: String
  },
  metadata: {
    description: String,
    keywords: [String],
    author: String,
    language: String,
    lastModified: Date
  },
  screenshots: {
    mobile: String,
    tablet: String,
    desktop: String
  },
  scrapedAt: {
    type: Date,
    default: Date.now
  },
  status: {
    type: String,
    enum: ['pending', 'scraping', 'completed', 'failed'],
    default: 'pending'
  },
  error: String,
  processingTime: Number,
  fileSize: Number,
  tags: [String],
  notes: String
});

// Indexes for better query performance
scrapedPageSchema.index({ url: 1, scrapedAt: -1 });
scrapedPageSchema.index({ status: 1 });
scrapedPageSchema.index({ tags: 1 });

module.exports = mongoose.model('ScrapedPage', scrapedPageSchema);
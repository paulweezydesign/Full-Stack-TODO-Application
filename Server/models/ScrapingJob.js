const mongoose = require('mongoose');

const scrapingJobSchema = new mongoose.Schema({
  jobId: {
    type: String,
    required: true,
    unique: true
  },
  url: {
    type: String,
    required: true
  },
  jobType: {
    type: String,
    enum: ['single', 'multiple', 'site'],
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'running', 'completed', 'failed'],
    default: 'pending'
  },
  options: {
    takeScreenshots: {
      type: Boolean,
      default: false
    },
    screenshotSizes: [{
      type: String,
      enum: ['mobile', 'tablet', 'desktop']
    }],
    outputFormats: [{
      type: String,
      enum: ['html', 'json', 'csv', 'markdown', 'plain-text']
    }],
    customInstructions: String,
    maxPages: Number,
    followLinks: Boolean,
    delay: Number
  },
  results: {
    pagesScraped: Number,
    screenshotsTaken: Number,
    filesGenerated: [String],
    errors: [String]
  },
  metadata: {
    startedAt: Date,
    completedAt: Date,
    totalTime: Number,
    userAgent: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

scrapingJobSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ScrapingJob', scrapingJobSchema);
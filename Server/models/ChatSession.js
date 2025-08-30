const mongoose = require('mongoose');

const messageSchema = new mongoose.Schema({
  role: {
    type: String,
    enum: ['user', 'assistant', 'system'],
    required: true
  },
  content: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now
  },
  metadata: {
    model: String,
    tokens: Number,
    responseTime: Number
  }
});

const chatSessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  title: String,
  messages: [messageSchema],
  settings: {
    baseUrl: String,
    apiKey: String,
    model: String,
    temperature: {
      type: Number,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 2000
    }
  },
  mcpServers: [{
    name: String,
    url: String,
    description: String,
    tools: [{
      name: String,
      description: String,
      parameters: mongoose.Schema.Types.Mixed
    }]
  }],
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  },
  userId: String,
  isActive: {
    type: Boolean,
    default: true
  }
});

// Indexes for better query performance
chatSessionSchema.index({ sessionId: 1 });
chatSessionSchema.index({ userId: 1 });
chatSessionSchema.index({ createdAt: -1 });
chatSessionSchema.index({ isActive: 1 });

// Update the updatedAt field on save
chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
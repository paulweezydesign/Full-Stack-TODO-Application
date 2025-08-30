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
  title: {
    type: String,
    default: 'New Chat'
  },
  messages: [messageSchema],
  settings: {
    baseUrl: String,
    apiKey: String,
    model: {
      type: String,
      default: 'gpt-4'
    },
    temperature: {
      type: Number,
      default: 0.7
    },
    maxTokens: {
      type: Number,
      default: 4000
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
  context: {
    documents: [{
      documentId: String,
      relevance: Number
    }],
    systemPrompt: String,
    userPreferences: mongoose.Schema.Types.Mixed
  },
  stats: {
    totalMessages: {
      type: Number,
      default: 0
    },
    totalTokens: {
      type: Number,
      default: 0
    },
    averageResponseTime: Number
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

chatSessionSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  this.stats.totalMessages = this.messages.length;
  next();
});

module.exports = mongoose.model('ChatSession', chatSessionSchema);
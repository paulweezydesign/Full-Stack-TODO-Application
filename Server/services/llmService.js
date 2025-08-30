const OpenAI = require('openai');
const { ChatOpenAI } = require('@langchain/openai');
const { HumanMessage, SystemMessage, AIMessage } = require('@langchain/core/messages');
const { getDBStats } = require('../config/database');
const ScrapedPage = require('../models/ScrapedPage');
const UploadedFile = require('../models/UploadedFile');

class LLMService {
  constructor() {
    this.openai = null;
    this.chatModel = null;
    this.currentConfig = null;
  }

  async initialize(config) {
    try {
      this.currentConfig = config;
      
      if (config.baseUrl && config.apiKey) {
        // Custom OpenAI-compatible endpoint
        this.openai = new OpenAI({
          baseURL: config.baseUrl,
          apiKey: config.apiKey,
          dangerouslyAllowBrowser: false
        });
        
        this.chatModel = new ChatOpenAI({
          openAIApiKey: config.apiKey,
          configuration: {
            baseURL: config.baseUrl
          },
          modelName: config.model || 'gpt-4',
          temperature: config.temperature || 0.7,
          maxTokens: config.maxTokens || 2000
        });
      } else if (process.env.OPENAI_API_KEY) {
        // Default OpenAI
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY
        });
        
        this.chatModel = new ChatOpenAI({
          openAIApiKey: process.env.OPENAI_API_KEY,
          modelName: process.env.OPENAI_MODEL || 'gpt-4',
          temperature: 0.7,
          maxTokens: 2000
        });
      } else {
        throw new Error('No valid API configuration provided');
      }
      
      return true;
    } catch (error) {
      console.error('Error initializing LLM service:', error);
      throw error;
    }
  }

  async chat(messages, sessionId, options = {}) {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      const startTime = Date.now();
      
      // Prepare messages for the model
      const formattedMessages = this.formatMessages(messages);
      
      // Add system context if available
      if (options.includeContext) {
        const context = await this.getRelevantContext(messages[messages.length - 1].content);
        if (context) {
          formattedMessages.unshift(new SystemMessage(
            `You have access to the following relevant information from the knowledge base:\n\n${context}\n\nUse this information to provide accurate and helpful responses.`
          ));
        }
      }

      // Generate response
      const response = await this.chatModel.call(formattedMessages);
      
      const responseTime = Date.now() - startTime;
      
      return {
        content: response.content,
        metadata: {
          model: this.currentConfig?.model || process.env.OPENAI_MODEL || 'gpt-4',
          responseTime,
          timestamp: new Date(),
          sessionId
        }
      };

    } catch (error) {
      console.error('Error in chat:', error);
      throw error;
    }
  }

  formatMessages(messages) {
    return messages.map(msg => {
      switch (msg.role) {
        case 'user':
          return new HumanMessage(msg.content);
        case 'assistant':
          return new AIMessage(msg.content);
        case 'system':
          return new SystemMessage(msg.content);
        default:
          return new HumanMessage(msg.content);
      }
    });
  }

  async getRelevantContext(query, limit = 5) {
    try {
      // Search in scraped pages
      const scrapedResults = await ScrapedPage.find({
        $or: [
          { 'content.text': { $regex: query, $options: 'i' } },
          { 'content.markdown': { $regex: query, $options: 'i' } },
          { title: { $regex: query, $options: 'i' } },
          { tags: { $in: query.split(' ').map(word => new RegExp(word, 'i')) } }
        ]
      })
      .limit(limit)
      .select('title content.text content.markdown url tags')
      .lean();

      // Search in uploaded files
      const fileResults = await UploadedFile.find({
        $or: [
          { 'content.text': { $regex: query, $options: 'i' } },
          { 'content.markdown': { $regex: query, $options: 'i' } },
          { originalName: { $regex: query, $options: 'i' } },
          { tags: { $in: query.split(' ').map(word => new RegExp(word, 'i')) } }
        ]
      })
      .limit(limit)
      .select('originalName content.text content.markdown fileType tags')
      .lean();

      // Combine and format results
      const context = [];
      
      if (scrapedResults.length > 0) {
        context.push('=== SCRAPED PAGES ===');
        scrapedResults.forEach(page => {
          context.push(`Title: ${page.title}`);
          context.push(`URL: ${page.url}`);
          context.push(`Content: ${(page.content.text || page.content.markdown || '').substring(0, 200)}...`);
          context.push('');
        });
      }

      if (fileResults.length > 0) {
        context.push('=== UPLOADED FILES ===');
        fileResults.forEach(file => {
          context.push(`File: ${file.originalName} (${file.fileType})`);
          context.push(`Content: ${(file.content.text || file.content.markdown || '').substring(0, 200)}...`);
          context.push('');
        });
      }

      return context.join('\n');
    } catch (error) {
      console.error('Error getting relevant context:', error);
      return null;
    }
  }

  async processCustomInstructions(instructions, pageContent) {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      const systemPrompt = `You are a web scraping assistant. Analyze the following page content and follow these custom instructions: ${instructions}

      Page Content:
      ${JSON.stringify(pageContent, null, 2)}

      Provide a structured response that follows the instructions. If the instructions are unclear, ask for clarification.`;

      const messages = [
        new SystemMessage(systemPrompt)
      ];

      const response = await this.chatModel.call(messages);
      return response.content;

    } catch (error) {
      console.error('Error processing custom instructions:', error);
      throw error;
    }
  }

  async generateSummary(content, type = 'general') {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      let systemPrompt = '';
      switch (type) {
        case 'webpage':
          systemPrompt = 'You are a web content analyzer. Provide a concise summary of the following webpage content, highlighting key information, main topics, and important details.';
          break;
        case 'document':
          systemPrompt = 'You are a document analyzer. Provide a comprehensive summary of the following document, including main points, key findings, and important details.';
          break;
        case 'code':
          systemPrompt = 'You are a code analyzer. Provide a technical summary of the following code, explaining its purpose, functionality, and key components.';
          break;
        default:
          systemPrompt = 'You are a content analyzer. Provide a clear and concise summary of the following content.';
      }

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Please summarize the following content:\n\n${content}`)
      ];

      const response = await this.chatModel.call(messages);
      return response.content;

    } catch (error) {
      console.error('Error generating summary:', error);
      throw error;
    }
  }

  async extractStructuredData(content, schema) {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      const systemPrompt = `You are a data extraction specialist. Extract structured data from the following content according to this schema: ${JSON.stringify(schema, null, 2)}

      Return the data in valid JSON format that matches the schema exactly.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Extract data from this content:\n\n${content}`)
      ];

      const response = await this.chatModel.call(messages);
      
      try {
        // Try to parse the response as JSON
        const extractedData = JSON.parse(response.content);
        return extractedData;
      } catch (parseError) {
        // If parsing fails, return the raw response
        return {
          rawResponse: response.content,
          parseError: parseError.message
        };
      }

    } catch (error) {
      console.error('Error extracting structured data:', error);
      throw error;
    }
  }

  async analyzeSentiment(content) {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      const systemPrompt = 'You are a sentiment analysis expert. Analyze the sentiment of the following content and provide a detailed analysis including sentiment score, confidence level, and key emotional indicators.';

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Analyze the sentiment of this content:\n\n${content}`)
      ];

      const response = await this.chatModel.call(messages);
      return response.content;

    } catch (error) {
      console.error('Error analyzing sentiment:', error);
      throw error;
    }
  }

  async translateContent(content, targetLanguage, sourceLanguage = 'auto') {
    try {
      if (!this.chatModel) {
        throw new Error('LLM service not initialized');
      }

      const systemPrompt = `You are a professional translator. Translate the following content to ${targetLanguage}. 
      If the source language is not specified, detect it automatically. 
      Maintain the original meaning, tone, and formatting. 
      Provide both the translation and a brief note about any cultural or linguistic considerations.`;

      const messages = [
        new SystemMessage(systemPrompt),
        new HumanMessage(`Translate this content to ${targetLanguage}:\n\n${content}`)
      ];

      const response = await this.chatModel.call(messages);
      return response.content;

    } catch (error) {
      console.error('Error translating content:', error);
      throw error;
    }
  }

  async getModelCapabilities() {
    try {
      if (!this.openai) {
        throw new Error('OpenAI client not initialized');
      }

      const models = await this.openai.models.list();
      return models.data.map(model => ({
        id: model.id,
        object: model.object,
        created: model.created,
        owned_by: model.owned_by
      }));

    } catch (error) {
      console.error('Error getting model capabilities:', error);
      return [];
    }
  }

  async validateConfiguration(config) {
    try {
      // Test the configuration by making a simple request
      const testConfig = { ...config };
      await this.initialize(testConfig);
      
      const testResponse = await this.chat([
        { role: 'user', content: 'Hello, this is a test message.' }
      ], 'test-session');
      
      return {
        valid: true,
        message: 'Configuration is valid',
        testResponse: testResponse.content
      };

    } catch (error) {
      return {
        valid: false,
        message: error.message,
        error: error.toString()
      };
    }
  }

  getCurrentConfig() {
    return this.currentConfig;
  }

  isInitialized() {
    return this.chatModel !== null;
  }
}

module.exports = new LLMService();
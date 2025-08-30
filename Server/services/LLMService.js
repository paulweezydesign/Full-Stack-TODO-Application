const OpenAI = require('openai');
const { logger } = require('../config/database');

class LLMService {
  constructor() {
    this.openai = null;
    this.initialize();
  }

  initialize() {
    try {
      if (process.env.OPENAI_API_KEY) {
        this.openai = new OpenAI({
          apiKey: process.env.OPENAI_API_KEY,
          baseURL: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
        });
        logger.info('OpenAI service initialized successfully');
      } else {
        logger.warn('OpenAI API key not found, LLM features will be limited');
      }
    } catch (error) {
      logger.error('Error initializing OpenAI service:', error);
    }
  }

  async processCustomInstructions(content, instructions, context = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }

      const systemPrompt = `You are an AI assistant specialized in web scraping and data processing. 
      Your task is to process the given content according to the user's custom instructions.
      
      Available content types: HTML, JSON, CSV, Markdown, Plain Text
      Content context: ${JSON.stringify(context)}
      
      Instructions: ${instructions}
      
      Please provide a detailed response explaining how you would process this content and any specific actions you would take.`;

      const userPrompt = `Content to process:
      Type: ${content.type || 'unknown'}
      Size: ${content.size || 'unknown'}
      
      Content preview: ${this.truncateContent(content.content || content, 1000)}
      
      Please follow the custom instructions: ${instructions}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 2000
      });

      const result = {
        processed: true,
        instructions,
        response: response.choices[0].message.content,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        timestamp: new Date(),
        tokens: response.usage?.total_tokens || 0
      };

      logger.info('Custom instructions processed successfully', result);
      return result;

    } catch (error) {
      logger.error('Error processing custom instructions:', error);
      
      // Fallback response when LLM is not available
      return {
        processed: false,
        instructions,
        response: `LLM processing not available. Instructions received: ${instructions}`,
        error: error.message,
        timestamp: new Date(),
        fallback: true
      };
    }
  }

  async analyzeContent(content, contentType) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }

      const systemPrompt = `You are an AI content analyst. Analyze the provided content and extract key information, insights, and metadata.`;

      let userPrompt = `Please analyze this ${contentType} content and provide:
      1. A brief summary (2-3 sentences)
      2. Key topics or themes
      3. Important entities (people, places, organizations)
      4. Sentiment analysis
      5. Content quality assessment
      
      Content: ${this.truncateContent(content, 2000)}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.2,
        max_tokens: 1000
      });

      return {
        analyzed: true,
        contentType,
        analysis: response.choices[0].message.content,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        timestamp: new Date(),
        tokens: response.usage?.total_tokens || 0
      };

    } catch (error) {
      logger.error('Error analyzing content:', error);
      return {
        analyzed: false,
        contentType,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async generateSummary(content, maxLength = 200) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }

      const systemPrompt = `You are an AI summarizer. Create a concise, informative summary of the provided content.`;

      const userPrompt = `Please create a summary of the following content in ${maxLength} characters or less:
      
      ${this.truncateContent(content, 3000)}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 500
      });

      return {
        summarized: true,
        summary: response.choices[0].message.content,
        originalLength: content.length,
        summaryLength: response.choices[0].message.content.length,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error generating summary:', error);
      return {
        summarized: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async extractKeywords(content, maxKeywords = 10) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }

      const systemPrompt = `You are an AI keyword extractor. Extract the most relevant keywords from the provided content.`;

      const userPrompt = `Please extract ${maxKeywords} most relevant keywords from this content. Return them as a comma-separated list:
      
      ${this.truncateContent(content, 2000)}`;

      const response = await this.openai.chat.completions.create({
        model: process.env.OPENAI_MODEL || 'gpt-4',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.1,
        max_tokens: 200
      });

      const keywords = response.choices[0].message.content
        .split(',')
        .map(k => k.trim())
        .filter(k => k.length > 0);

      return {
        extracted: true,
        keywords,
        count: keywords.length,
        model: process.env.OPENAI_MODEL || 'gpt-4',
        timestamp: new Date()
      };

    } catch (error) {
      logger.error('Error extracting keywords:', error);
      return {
        extracted: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  async chatCompletion(messages, options = {}) {
    try {
      if (!this.openai) {
        throw new Error('OpenAI service not available');
      }

      const response = await this.openai.chat.completions.create({
        model: options.model || process.env.OPENAI_MODEL || 'gpt-4',
        messages,
        temperature: options.temperature || 0.7,
        max_tokens: options.maxTokens || 4000,
        ...options
      });

      return {
        success: true,
        response: response.choices[0].message.content,
        model: options.model || process.env.OPENAI_MODEL || 'gpt-4',
        timestamp: new Date(),
        usage: response.usage
      };

    } catch (error) {
      logger.error('Error in chat completion:', error);
      return {
        success: false,
        error: error.message,
        timestamp: new Date()
      };
    }
  }

  truncateContent(content, maxLength) {
    if (typeof content === 'string') {
      return content.length > maxLength 
        ? content.substring(0, maxLength) + '...'
        : content;
    }
    
    if (typeof content === 'object') {
      const stringContent = JSON.stringify(content);
      return stringContent.length > maxLength
        ? stringContent.substring(0, maxLength) + '...'
        : stringContent;
    }
    
    return String(content);
  }

  isAvailable() {
    return this.openai !== null;
  }

  getModelInfo() {
    return {
      available: this.isAvailable(),
      model: process.env.OPENAI_MODEL || 'gpt-4',
      baseUrl: process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1'
    };
  }
}

module.exports = LLMService;
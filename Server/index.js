require('dotenv').config();
const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('winston');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');

// Import services and models
const { connectDB, checkDBHealth, getDBStats, logger } = require('./config/database');
const WebScraperService = require('./services/WebScraperService');
const FileProcessingService = require('./services/FileProcessingService');
const LLMService = require('./services/LLMService');
const ScrapingJob = require('./models/ScrapingJob');
const Document = require('./models/Document');
const ChatSession = require('./models/ChatSession');

const app = express();
const PORT = process.env.PORT || 5000;

// Initialize services
const webScraperService = new WebScraperService();
const fileProcessingService = new FileProcessingService();
const llmService = new LLMService();

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '100mb' }));
app.use(express.urlencoded({ extended: true, limit: '100mb' }));

// Create upload directories
const createUploadDirs = async () => {
  const dirs = [
    './uploads',
    './uploads/scraped',
    './uploads/screenshots',
    './uploads/documents',
    './uploads/thumbnails'
  ];
  
  for (const dir of dirs) {
    try {
      await fs.mkdir(dir, { recursive: true });
    } catch (error) {
      logger.error(`Error creating directory ${dir}:`, error);
    }
  }
};

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 100 * 1024 * 1024 // 100MB default
  },
  fileFilter: (req, file, cb) => {
    if (fileProcessingService.isSupportedFormat(file.originalname)) {
      cb(null, true);
    } else {
      cb(new Error('Unsupported file format'), false);
    }
  }
});

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbHealth = await checkDBHealth();
    const llmHealth = llmService.getModelInfo();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      database: dbHealth,
      llm: llmHealth,
      services: {
        webScraper: true,
        fileProcessing: true
      }
    });
  } catch (error) {
    logger.error('Health check failed:', error);
    res.status(500).json({
      status: 'unhealthy',
      error: error.message,
      timestamp: new Date()
    });
  }
});

// Database statistics endpoint
app.get('/api/stats', async (req, res) => {
  try {
    const dbStats = await getDBStats();
    const documentCount = await Document.countDocuments();
    const jobCount = await ScrapingJob.countDocuments();
    const chatCount = await ChatSession.countDocuments();
    
    res.json({
      database: dbStats,
      documents: {
        total: documentCount,
        byType: await Document.aggregate([
          { $group: { _id: '$contentType', count: { $sum: 1 } } }
        ])
      },
      jobs: {
        total: jobCount,
        byStatus: await ScrapingJob.aggregate([
          { $group: { _id: '$status', count: { $sum: 1 } } }
        ])
      },
      chats: {
        total: chatCount
      },
      timestamp: new Date()
    });
  } catch (error) {
    logger.error('Error getting statistics:', error);
    res.status(500).json({ error: error.message });
  }
});

// Web Scraping Routes
app.post('/api/scrape', async (req, res) => {
  try {
    const {
      url,
      jobType = 'single',
      takeScreenshots = false,
      screenshotSizes = ['desktop'],
      outputFormats = ['html', 'json'],
      customInstructions,
      maxPages = 100,
      followLinks = false,
      delay = 1000
    } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Create scraping job
    const jobId = uuidv4();
    const job = new ScrapingJob({
      jobId,
      url,
      jobType,
      options: {
        takeScreenshots,
        screenshotSizes,
        outputFormats,
        customInstructions,
        maxPages,
        followLinks,
        delay
      },
      status: 'running',
      metadata: {
        startedAt: new Date()
      }
    });

    await job.save();

    // Process custom instructions if provided
    let processedInstructions = null;
    if (customInstructions) {
      processedInstructions = await llmService.processCustomInstructions(
        { type: 'scraping_job', url },
        customInstructions
      );
    }

    // Start scraping in background
    setImmediate(async () => {
      try {
        let results;
        
        switch (jobType) {
          case 'single':
            results = await webScraperService.scrapeSinglePage(url, {
              takeScreenshots,
              screenshotSizes,
              outputFormats
            });
            break;
            
          case 'multiple':
            if (!Array.isArray(url)) {
              throw new Error('Multiple URLs must be provided as an array');
            }
            results = await webScraperService.scrapeMultiplePages(url, {
              takeScreenshots,
              screenshotSizes,
              outputFormats,
              maxPages,
              delay
            });
            break;
            
          case 'site':
            results = await webScraperService.scrapeSite(url, {
              takeScreenshots,
              screenshotSizes,
              outputFormats,
              maxPages,
              followLinks,
              delay
            });
            break;
            
          default:
            throw new Error(`Invalid job type: ${jobType}`);
        }

        // Save results to files
        const savedFiles = await webScraperService.saveResults(results, jobId, outputFormats);

        // Update job status
        job.status = 'completed';
        job.results = {
          pagesScraped: Array.isArray(results) ? results.length : 1,
          screenshotsTaken: results.screenshots?.length || 0,
          filesGenerated: savedFiles,
          errors: []
        };
        job.metadata.completedAt = new Date();
        job.metadata.totalTime = Date.now() - job.metadata.startedAt.getTime();
        await job.save();

        // Save documents to knowledge base
        if (Array.isArray(results)) {
          for (const result of results) {
            if (result.content && !result.error) {
              const document = new Document({
                documentId: uuidv4(),
                title: result.metadata?.title || result.url,
                content: JSON.stringify(result),
                contentType: 'html',
                source: 'scraped',
                sourceUrl: result.url,
                metadata: {
                  scrapedAt: result.metadata?.scrapedAt || new Date(),
                  tags: ['scraped', jobType]
                },
                screenshots: result.screenshots || []
              });
              await document.save();
            }
          }
        }

        logger.info(`Scraping job ${jobId} completed successfully`);
      } catch (error) {
        logger.error(`Error in scraping job ${jobId}:`, error);
        
        job.status = 'failed';
        job.results.errors = [error.message];
        job.metadata.completedAt = new Date();
        await job.save();
      }
    });

    res.json({
      success: true,
      jobId,
      message: 'Scraping job started',
      processedInstructions
    });

  } catch (error) {
    logger.error('Error starting scraping job:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraping job status
app.get('/api/scrape/:jobId', async (req, res) => {
  try {
    const { jobId } = req.params;
    const job = await ScrapingJob.findOne({ jobId });
    
    if (!job) {
      return res.status(404).json({ error: 'Job not found' });
    }
    
    res.json(job);
  } catch (error) {
    logger.error('Error getting job status:', error);
    res.status(500).json({ error: error.message });
  }
});

// List all scraping jobs
app.get('/api/scrape', async (req, res) => {
  try {
    const { page = 1, limit = 10, status } = req.query;
    const query = status ? { status } : {};
    
    const jobs = await ScrapingJob.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ScrapingJob.countDocuments(query);
    
    res.json({
      jobs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error listing jobs:', error);
    res.status(500).json({ error: error.message });
  }
});

// File Upload Routes
app.post('/api/upload', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadPath = process.env.UPLOAD_PATH || './uploads/documents';
    const results = [];

    for (const file of req.files) {
      try {
        const processedFile = await fileProcessingService.processFile(file, uploadPath);
        
        // Save to knowledge base
        const document = new Document({
          documentId: uuidv4(),
          title: file.originalname,
          content: JSON.stringify(processedFile.processedData),
          contentType: processedFile.processedData.type,
          source: 'uploaded',
          filePath: processedFile.filePath,
          fileSize: processedFile.fileSize,
          mimeType: processedFile.mimeType,
          metadata: {
            uploadedAt: processedFile.uploadedAt,
            tags: ['uploaded', processedFile.extension]
          }
        });

        await document.save();
        results.push({
          success: true,
          document: document,
          file: processedFile
        });

      } catch (error) {
        logger.error(`Error processing file ${file.originalname}:`, error);
        results.push({
          success: false,
          filename: file.originalname,
          error: error.message
        });
      }
    }

    res.json({
      success: true,
      results,
      total: req.files.length
    });

  } catch (error) {
    logger.error('Error uploading files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Document Routes
app.get('/api/documents', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, source, search } = req.query;
    const query = {};
    
    if (type) query.contentType = type;
    if (source) query.source = source;
    if (search) {
      query.$text = { $search: search };
    }
    
    const documents = await Document.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await Document.countDocuments(query);
    
    res.json({
      documents,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error getting documents:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/documents/:documentId', async (req, res) => {
  try {
    const { documentId } = req.params;
    const document = await Document.findOne({ documentId });
    
    if (!document) {
      return res.status(404).json({ error: 'Document not found' });
    }
    
    res.json(document);
  } catch (error) {
    logger.error('Error getting document:', error);
    res.status(500).json({ error: error.message });
  }
});

// Chat Routes
app.post('/api/chat/sessions', async (req, res) => {
  try {
    const { title, settings, mcpServers } = req.body;
    
    const session = new ChatSession({
      sessionId: uuidv4(),
      title: title || 'New Chat',
      settings: settings || {},
      mcpServers: mcpServers || []
    });
    
    await session.save();
    res.json(session);
  } catch (error) {
    logger.error('Error creating chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/chat/:sessionId/messages', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { message, model, temperature, maxTokens } = req.body;
    
    const session = await ChatSession.findOne({ sessionId });
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    // Add user message
    session.messages.push({
      role: 'user',
      content: message,
      timestamp: new Date()
    });
    
    // Get LLM response
    const llmResponse = await llmService.chatCompletion(
      session.messages.map(m => ({ role: m.role, content: m.content })),
      {
        model: model || session.settings.model,
        temperature: temperature || session.settings.temperature,
        maxTokens: maxTokens || session.settings.maxTokens
      }
    );
    
    if (llmResponse.success) {
      // Add assistant message
      session.messages.push({
        role: 'assistant',
        content: llmResponse.response,
        timestamp: new Date(),
        metadata: {
          model: model || session.settings.model,
          tokens: llmResponse.usage?.total_tokens || 0
        }
      });
    }
    
    await session.save();
    
    res.json({
      session,
      llmResponse
    });
    
  } catch (error) {
    logger.error('Error in chat:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await ChatSession.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error) {
    logger.error('Error getting chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

app.get('/api/chat', async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    
    const sessions = await ChatSession.find()
      .sort({ updatedAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit));
    
    const total = await ChatSession.countDocuments();
    
    res.json({
      sessions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    });
  } catch (error) {
    logger.error('Error listing chat sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search endpoint
app.get('/api/search', async (req, res) => {
  try {
    const { q, type, limit = 20 } = req.query;
    
    if (!q) {
      return res.status(400).json({ error: 'Search query is required' });
    }
    
    const query = { $text: { $search: q } };
    if (type) query.contentType = type;
    
    const documents = await Document.find(query, { score: { $meta: 'textScore' } })
      .sort({ score: { $meta: 'textScore' } })
      .limit(parseInt(limit));
    
    res.json({
      query: q,
      results: documents,
      total: documents.length
    });
    
  } catch (error) {
    logger.error('Error searching:', error);
    res.status(500).json({ error: error.message });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  logger.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message
  });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Start server
const startServer = async () => {
  try {
    // Create upload directories
    await createUploadDirs();
    
    // Connect to database
    await connectDB();
    
    // Start server
    app.listen(PORT, () => {
      logger.info(`Server running on port ${PORT}`);
      logger.info(`Environment: ${process.env.NODE_ENV || 'development'}`);
    });
    
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  logger.info('SIGTERM received, shutting down gracefully');
  await webScraperService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  logger.info('SIGINT received, shutting down gracefully');
  await webScraperService.close();
  process.exit(0);
});

startServer();


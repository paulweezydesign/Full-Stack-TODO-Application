const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
require('dotenv').config();

const { connectDB, getDBStatus, getDBStats } = require('./config/database');
const scraperService = require('./services/scraperService');
const fileProcessingService = require('./services/fileProcessingService');
const llmService = require('./services/llmService');

// Import models
const ScrapedPage = require('./models/ScrapedPage');
const UploadedFile = require('./models/UploadedFile');
const ChatSession = require('./models/ChatSession');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(helmet());
app.use(compression());
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Create uploads directory if it doesn't exist
const uploadsDir = path.join(__dirname, 'uploads');
const screenshotsDir = path.join(uploadsDir, 'screenshots');

async function ensureDirectories() {
  try {
    await fs.mkdir(uploadsDir, { recursive: true });
    await fs.mkdir(screenshotsDir, { recursive: true });
  } catch (error) {
    console.error('Error creating directories:', error);
  }
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept all file types for now, processing will determine compatibility
    cb(null, true);
  }
});

// Connect to MongoDB
connectDB();

// Ensure directories exist
ensureDirectories();

// Health check endpoint
app.get('/health', async (req, res) => {
  try {
    const dbStatus = getDBStatus();
    const dbStats = await getDBStats();
    
    res.json({
      status: 'healthy',
      timestamp: new Date(),
      database: {
        status: dbStatus,
        stats: dbStats
      },
      services: {
        scraper: 'running',
        fileProcessor: 'running',
        llm: llmService.isInitialized() ? 'initialized' : 'not_initialized'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'unhealthy',
      error: error.message
    });
  }
});

// ==================== WEB SCRAPING ROUTES ====================

// Scrape a single page
app.post('/api/scrape/page', async (req, res) => {
  try {
    const { url, takeScreenshots, outputFormats, customInstructions, userAgent } = req.body;
    
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const options = {
      takeScreenshots: takeScreenshots || false,
      outputFormats: outputFormats || ['html', 'text', 'markdown'],
      customInstructions: customInstructions || '',
      userAgent: userAgent || 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    };

    const result = await scraperService.scrapePage(url, options);
    
    // Save to database
    if (result.status === 'completed') {
      const scrapedPage = new ScrapedPage(result);
      await scrapedPage.save();
    }

    res.json(result);
  } catch (error) {
    console.error('Error scraping page:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scrape multiple pages
app.post('/api/scrape/multiple', async (req, res) => {
  try {
    const { urls, takeScreenshots, outputFormats, customInstructions, maxConcurrent } = req.body;
    
    if (!urls || !Array.isArray(urls) || urls.length === 0) {
      return res.status(400).json({ error: 'URLs array is required' });
    }

    const options = {
      takeScreenshots: takeScreenshots || false,
      outputFormats: outputFormats || ['html', 'text', 'markdown'],
      customInstructions: customInstructions || '',
      maxConcurrent: maxConcurrent || 3
    };

    const results = await scraperService.scrapeMultiplePages(urls, options);
    
    // Save successful results to database
    for (const result of results) {
      if (result.status === 'completed') {
        const scrapedPage = new ScrapedPage(result);
        await scrapedPage.save();
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error scraping multiple pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Scrape entire site
app.post('/api/scrape/site', async (req, res) => {
  try {
    const { baseUrl, maxDepth, maxPages, sameDomain, takeScreenshots, outputFormats, customInstructions } = req.body;
    
    if (!baseUrl) {
      return res.status(400).json({ error: 'Base URL is required' });
    }

    const options = {
      maxDepth: maxDepth || 3,
      maxPages: maxPages || 100,
      sameDomain: sameDomain !== false,
      takeScreenshots: takeScreenshots || false,
      outputFormats: outputFormats || ['html', 'text', 'markdown'],
      customInstructions: customInstructions || ''
    };

    const results = await scraperService.scrapeSite(baseUrl, options);
    
    // Save successful results to database
    for (const result of results) {
      if (result.status === 'completed') {
        const scrapedPage = new ScrapedPage(result);
        await scrapedPage.save();
      }
    }

    res.json(results);
  } catch (error) {
    console.error('Error scraping site:', error);
    res.status(500).json({ error: error.message });
  }
});

// Export scraped data
app.post('/api/scrape/export', async (req, res) => {
  try {
    const { data, format, filename } = req.body;
    
    if (!data || !format) {
      return res.status(400).json({ error: 'Data and format are required' });
    }

    const exportResult = await scraperService.exportData(data, format, filename);
    
    res.setHeader('Content-Type', exportResult.mimetype);
    res.setHeader('Content-Disposition', `attachment; filename="${exportResult.filename}"`);
    res.send(exportResult.content);
  } catch (error) {
    console.error('Error exporting data:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== FILE UPLOAD ROUTES ====================

// Upload and process files
app.post('/api/upload', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const { tags, notes } = req.body;
    
    // Process the uploaded file
    const processedFile = await fileProcessingService.processFile(
      req.file.path,
      req.file.originalname,
      req.file.mimetype
    );

    // Save to database
    const uploadedFile = new UploadedFile({
      filename: req.file.filename,
      originalName: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      path: req.file.path,
      fileType: processedFile.fileType,
      content: processedFile.processedContent,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
      notes: notes || '',
      processed: true,
      processingStatus: 'completed'
    });

    await uploadedFile.save();

    res.json({
      message: 'File uploaded and processed successfully',
      file: uploadedFile
    });

  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all uploaded files
app.get('/api/files', async (req, res) => {
  try {
    const { page = 1, limit = 20, fileType, search } = req.query;
    
    let query = {};
    
    if (fileType && fileType !== 'all') {
      query.fileType = fileType;
    }
    
    if (search) {
      query.$or = [
        { originalName: { $regex: search, $options: 'i' } },
        { 'content.text': { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const files = await UploadedFile.find(query)
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content.html -content.json');

    const total = await UploadedFile.countDocuments(query);

    res.json({
      files,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting files:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get file content
app.get('/api/files/:id/content', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    res.json({
      content: file.content,
      metadata: {
        filename: file.originalName,
        fileType: file.fileType,
        size: file.size,
        uploadedAt: file.uploadedAt
      }
    });
  } catch (error) {
    console.error('Error getting file content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete file
app.delete('/api/files/:id', async (req, res) => {
  try {
    const file = await UploadedFile.findById(req.params.id);
    
    if (!file) {
      return res.status(404).json({ error: 'File not found' });
    }

    // Delete physical file
    try {
      await fs.unlink(file.path);
    } catch (unlinkError) {
      console.warn('Could not delete physical file:', unlinkError.message);
    }

    // Delete from database
    await UploadedFile.findByIdAndDelete(req.params.id);

    res.json({ message: 'File deleted successfully' });
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== KNOWLEDGE BASE ROUTES ====================

// Get knowledge base stats
app.get('/api/knowledge/stats', async (req, res) => {
  try {
    const [scrapedPages, uploadedFiles, dbStats] = await Promise.all([
      ScrapedPage.countDocuments(),
      UploadedFile.countDocuments(),
      getDBStats()
    ]);

    const fileTypeStats = await UploadedFile.aggregate([
      {
        $group: {
          _id: '$fileType',
          count: { $sum: 1 },
          totalSize: { $sum: '$size' }
        }
      }
    ]);

    const recentActivity = await Promise.all([
      ScrapedPage.find().sort({ scrapedAt: -1 }).limit(5).select('title url scrapedAt'),
      UploadedFile.find().sort({ uploadedAt: -1 }).limit(5).select('originalName fileType uploadedAt')
    ]);

    res.json({
      totalPages: scrapedPages,
      totalFiles: uploadedFiles,
      fileTypeBreakdown: fileTypeStats,
      database: dbStats,
      recentActivity: {
        scrapedPages: recentActivity[0],
        uploadedFiles: recentActivity[1]
      }
    });
  } catch (error) {
    console.error('Error getting knowledge base stats:', error);
    res.status(500).json({ error: error.message });
  }
});

// Search knowledge base
app.post('/api/knowledge/search', async (req, res) => {
  try {
    const { query, type = 'all', limit = 20, page = 1 } = req.body;
    
    if (!query) {
      return res.status(400).json({ error: 'Search query is required' });
    }

    const skip = (page - 1) * limit;
    let results = [];

    if (type === 'all' || type === 'pages') {
      const pageResults = await ScrapedPage.find({
        $or: [
          { title: { $regex: query, $options: 'i' } },
          { 'content.text': { $regex: query, $options: 'i' } },
          { 'content.markdown': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      })
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('title url content.text content.markdown tags scrapedAt');

      results.push(...pageResults.map(page => ({
        ...page.toObject(),
        type: 'page',
        source: 'scraped'
      })));
    }

    if (type === 'all' || type === 'files') {
      const fileResults = await UploadedFile.find({
        $or: [
          { originalName: { $regex: query, $options: 'i' } },
          { 'content.text': { $regex: query, $options: 'i' } },
          { 'content.markdown': { $regex: query, $options: 'i' } },
          { tags: { $in: [new RegExp(query, 'i')] } }
        ]
      })
      .sort({ uploadedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('originalName fileType content.text content.markdown tags uploadedAt');

      results.push(...fileResults.map(file => ({
        ...file.toObject(),
        type: 'file',
        source: 'uploaded'
      })));
    }

    // Sort combined results by relevance (simplified)
    results.sort((a, b) => {
      const aScore = this.calculateRelevanceScore(a, query);
      const bScore = this.calculateRelevanceScore(b, query);
      return bScore - aScore;
    });

    res.json({
      results: results.slice(0, limit),
      total: results.length,
      query,
      type
    });
  } catch (error) {
    console.error('Error searching knowledge base:', error);
    res.status(500).json({ error: error.message });
  }
});

// Helper function to calculate relevance score
function calculateRelevanceScore(item, query) {
  let score = 0;
  const queryLower = query.toLowerCase();
  
  // Title/name matches get highest score
  if (item.title && item.title.toLowerCase().includes(queryLower)) score += 10;
  if (item.originalName && item.originalName.toLowerCase().includes(queryLower)) score += 10;
  
  // Content matches
  if (item['content.text'] && item['content.text'].toLowerCase().includes(queryLower)) score += 5;
  if (item['content.markdown'] && item['content.markdown'].toLowerCase().includes(queryLower)) score += 5;
  
  // Tag matches
  if (item.tags && item.tags.some(tag => tag.toLowerCase().includes(queryLower))) score += 3;
  
  // Recency bonus
  const date = item.scrapedAt || item.uploadedAt;
  if (date) {
    const daysAgo = (Date.now() - new Date(date).getTime()) / (1000 * 60 * 60 * 24);
    if (daysAgo < 7) score += 2;
    else if (daysAgo < 30) score += 1;
  }
  
  return score;
}

// ==================== CHAT ROUTES ====================

// Initialize LLM service
app.post('/api/chat/init', async (req, res) => {
  try {
    const { baseUrl, apiKey, model, temperature, maxTokens } = req.body;
    
    const config = {
      baseUrl,
      apiKey,
      model: model || 'gpt-4',
      temperature: temperature || 0.7,
      maxTokens: maxTokens || 2000
    };

    await llmService.initialize(config);
    
    res.json({
      message: 'LLM service initialized successfully',
      config: llmService.getCurrentConfig()
    });
  } catch (error) {
    console.error('Error initializing LLM service:', error);
    res.status(500).json({ error: error.message });
  }
});

// Create new chat session
app.post('/api/chat/sessions', async (req, res) => {
  try {
    const { title, settings, mcpServers } = req.body;
    
    const sessionId = `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    
    const chatSession = new ChatSession({
      sessionId,
      title: title || 'New Chat',
      settings: settings || {},
      mcpServers: mcpServers || [],
      messages: []
    });

    await chatSession.save();
    
    res.json(chatSession);
  } catch (error) {
    console.error('Error creating chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat sessions
app.get('/api/chat/sessions', async (req, res) => {
  try {
    const sessions = await ChatSession.find({ isActive: true })
      .sort({ updatedAt: -1 })
      .select('sessionId title createdAt updatedAt messages');
    
    res.json(sessions);
  } catch (error) {
    console.error('Error getting chat sessions:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get chat session
app.get('/api/chat/sessions/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({ 
      sessionId: req.params.sessionId,
      isActive: true 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }
    
    res.json(session);
  } catch (error) {
    console.error('Error getting chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// Send message in chat session
app.post('/api/chat/sessions/:sessionId/messages', async (req, res) => {
  try {
    const { content, includeContext = true } = req.body;
    
    if (!content) {
      return res.status(400).json({ error: 'Message content is required' });
    }

    const session = await ChatSession.findOne({ 
      sessionId: req.params.sessionId,
      isActive: true 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    // Add user message
    session.messages.push({
      role: 'user',
      content,
      timestamp: new Date()
    });

    // Get AI response
    const aiResponse = await llmService.chat(
      session.messages,
      req.params.sessionId,
      { includeContext }
    );

    // Add AI response
    session.messages.push({
      role: 'assistant',
      content: aiResponse.content,
      timestamp: new Date(),
      metadata: aiResponse.metadata
    });

    session.updatedAt = new Date();
    await session.save();
    
    res.json({
      message: aiResponse.content,
      metadata: aiResponse.metadata,
      session: session
    });
  } catch (error) {
    console.error('Error sending message:', error);
    res.status(500).json({ error: error.message });
  }
});

// Update chat session settings
app.put('/api/chat/sessions/:sessionId/settings', async (req, res) => {
  try {
    const { settings, mcpServers } = req.body;
    
    const session = await ChatSession.findOne({ 
      sessionId: req.params.sessionId,
      isActive: true 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    if (settings) {
      session.settings = { ...session.settings, ...settings };
    }
    
    if (mcpServers) {
      session.mcpServers = mcpServers;
    }

    session.updatedAt = new Date();
    await session.save();
    
    res.json(session);
  } catch (error) {
    console.error('Error updating chat session settings:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete chat session
app.delete('/api/chat/sessions/:sessionId', async (req, res) => {
  try {
    const session = await ChatSession.findOne({ 
      sessionId: req.params.sessionId,
      isActive: true 
    });
    
    if (!session) {
      return res.status(404).json({ error: 'Chat session not found' });
    }

    session.isActive = false;
    await session.save();
    
    res.json({ message: 'Chat session deleted successfully' });
  } catch (error) {
    console.error('Error deleting chat session:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== SCRAPED PAGES ROUTES ====================

// Get all scraped pages
app.get('/api/pages', async (req, res) => {
  try {
    const { page = 1, limit = 20, status, search } = req.query;
    
    let query = {};
    
    if (status && status !== 'all') {
      query.status = status;
    }
    
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { url: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } }
      ];
    }

    const skip = (page - 1) * limit;
    
    const pages = await ScrapedPage.find(query)
      .sort({ scrapedAt: -1 })
      .skip(skip)
      .limit(parseInt(limit))
      .select('-content.html -content.markdown');

    const total = await ScrapedPage.countDocuments(query);

    res.json({
      pages,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit)
      }
    });
  } catch (error) {
    console.error('Error getting pages:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get scraped page content
app.get('/api/pages/:id/content', async (req, res) => {
  try {
    const page = await ScrapedPage.findById(req.params.id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    res.json({
      content: page.content,
      metadata: {
        title: page.title,
        url: page.url,
        scrapedAt: page.scrapedAt,
        status: page.status
      }
    });
  } catch (error) {
    console.error('Error getting page content:', error);
    res.status(500).json({ error: error.message });
  }
});

// Delete scraped page
app.delete('/api/pages/:id', async (req, res) => {
  try {
    const page = await ScrapedPage.findById(req.params.id);
    
    if (!page) {
      return res.status(404).json({ error: 'Page not found' });
    }

    // Delete screenshots if they exist
    if (page.screenshots) {
      for (const [device, screenshotPath] of Object.entries(page.screenshots)) {
        if (screenshotPath) {
          try {
            await fs.unlink(screenshotPath);
          } catch (unlinkError) {
            console.warn(`Could not delete screenshot ${screenshotPath}:`, unlinkError.message);
          }
        }
      }
    }

    await ScrapedPage.findByIdAndDelete(req.params.id);
    
    res.json({ message: 'Page deleted successfully' });
  } catch (error) {
    console.error('Error deleting page:', error);
    res.status(500).json({ error: error.message });
  }
});

// ==================== UTILITY ROUTES ====================

// Get supported file types
app.get('/api/supported-types', (req, res) => {
  res.json({
    fileTypes: Object.keys(fileProcessingService.supportedTypes),
    extensions: [
      '.doc', '.docx', '.xls', '.xlsx', '.pdf', '.csv', '.json',
      '.html', '.htm', '.css', '.js', '.md', '.txt',
      '.py', '.rs', '.sql', '.c', '.cpp', '.cc', '.java', '.php', '.rb', '.go',
      '.jpg', '.jpeg', '.png', '.webp', '.gif'
    ]
  });
});

// Get export formats
app.get('/api/export-formats', (req, res) => {
  res.json({
    formats: ['json', 'csv', 'markdown', 'html', 'text']
  });
});

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await scraperService.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('SIGINT received, shutting down gracefully');
  await scraperService.close();
  process.exit(0);
});

// Start server
app.listen(PORT, () => {
  console.log(`Web Scraper Server running on port ${PORT}`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});


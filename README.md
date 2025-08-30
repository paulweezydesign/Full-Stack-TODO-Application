# WebScraper Pro - Comprehensive Web Scraping & Knowledge Management Platform

A powerful, feature-rich web scraping application with AI-powered content processing, knowledge base management, and intelligent chat capabilities.

## 🚀 Features

### Web Scraping
- **Single Page Scraping**: Scrape individual web pages with full control
- **Multiple Page Scraping**: Process multiple URLs in batch
- **Site-wide Scraping**: Automatically discover and scrape entire websites
- **Screenshot Capture**: Take screenshots at mobile, tablet, and desktop resolutions
- **Multiple Output Formats**: Export to HTML, JSON, CSV, Markdown, or Plain Text
- **Custom Instructions**: AI-powered processing with natural language instructions
- **Rate Limiting**: Configurable delays between requests
- **Progress Tracking**: Real-time job monitoring and status updates

### File Processing & Knowledge Base
- **Multi-format Support**: Handle HTML, CSS, JS, CSV, Word, Excel, PDF, images, and code files
- **Intelligent Processing**: Automatic content extraction and analysis
- **Search & Filter**: Full-text search with type and source filtering
- **Document Management**: Organize and categorize all your content
- **Metadata Extraction**: Automatic extraction of titles, descriptions, and keywords

### AI Chat Interface
- **Dynamic Configuration**: Set custom base URLs, API keys, and models
- **MCP Server Integration**: Add and manage Model Context Protocol servers
- **Knowledge Base Chat**: Interact with your scraped content using AI
- **Session Management**: Multiple chat sessions with persistent history
- **Customizable Parameters**: Adjust temperature, max tokens, and other LLM settings

### Advanced Features
- **MongoDB Integration**: Robust data persistence and scalability
- **Real-time Updates**: Live job monitoring and progress tracking
- **Responsive Design**: Modern, mobile-friendly interface
- **Comprehensive Logging**: Detailed logging and error tracking
- **Health Monitoring**: Database and service health checks
- **API Endpoints**: RESTful API for external integrations

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Puppeteer** for web scraping
- **OpenAI API** integration
- **Multer** for file uploads
- **Winston** for logging
- **Helmet** for security

### Frontend
- **React 18** with modern hooks
- **React Router** for navigation
- **Tailwind CSS** for styling
- **Lucide React** for icons
- **Axios** for API communication
- **React Hot Toast** for notifications
- **React Dropzone** for file uploads

## 📋 Prerequisites

- Node.js 18+ 
- MongoDB 5+
- OpenAI API key (optional, for AI features)
- Modern web browser

## 🚀 Installation

### 1. Clone the Repository
```bash
git clone <repository-url>
cd web-scraper-pro
```

### 2. Install Dependencies

#### Backend
```bash
cd Server
npm install
```

#### Frontend
```bash
cd Client
npm install
```

### 3. Environment Configuration

Create a `.env` file in the Server directory:

```env
# Server Configuration
PORT=5000
NODE_ENV=development

# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/web_scraper_db

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# File Upload Configuration
MAX_FILE_SIZE=100MB
UPLOAD_PATH=./uploads

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# Screenshot Configuration
SCREENSHOT_QUALITY=80
SCREENSHOT_FORMAT=png

# Logging
LOG_LEVEL=info
LOG_FILE=./logs/app.log
```

### 4. Start MongoDB
```bash
# Start MongoDB service
sudo systemctl start mongod

# Or run MongoDB locally
mongod
```

### 5. Run the Application

#### Development Mode
```bash
# Terminal 1 - Backend
cd Server
npm run dev

# Terminal 2 - Frontend
cd Client
npm run dev
```

#### Production Mode
```bash
# Backend
cd Server
npm start

# Frontend
cd Client
npm run build
npm run preview
```

## 🌐 Usage

### 1. Dashboard
- View system statistics and health
- Quick access to all features
- Monitor recent activity

### 2. Web Scraper
- Choose scraping type (single, multiple, site)
- Configure output formats and options
- Set screenshot preferences
- Add custom AI instructions
- Monitor job progress

### 3. Knowledge Base
- Upload files in various formats
- Search and filter documents
- View content metadata
- Manage document organization

### 4. Chat Interface
- Create new chat sessions
- Configure LLM settings
- Add MCP servers
- Interact with knowledge base
- Manage conversation history

### 5. Job Monitoring
- View all scraping jobs
- Monitor real-time progress
- Access job details and results
- Download generated files
- Retry failed jobs

## 🔧 API Endpoints

### Scraping
- `POST /api/scrape` - Start a new scraping job
- `GET /api/scrape` - List all jobs
- `GET /api/scrape/:jobId` - Get job details

### Documents
- `POST /api/upload` - Upload files
- `GET /api/documents` - List documents
- `GET /api/documents/:id` - Get document details
- `GET /api/search` - Search documents

### Chat
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat` - List sessions
- `GET /api/chat/:id` - Get session details
- `POST /api/chat/:id/messages` - Send message

### System
- `GET /health` - Health check
- `GET /api/stats` - System statistics

## 📁 Project Structure

```
web-scraper-pro/
├── Server/
│   ├── config/
│   │   └── database.js
│   ├── models/
│   │   ├── ScrapingJob.js
│   │   ├── Document.js
│   │   └── ChatSession.js
│   ├── services/
│   │   ├── WebScraperService.js
│   │   ├── FileProcessingService.js
│   │   └── LLMService.js
│   ├── index.js
│   ├── package.json
│   └── .env
├── Client/
│   ├── src/
│   │   ├── components/
│   │   │   └── Navbar.jsx
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx
│   │   │   ├── Scraper.jsx
│   │   │   ├── KnowledgeBase.jsx
│   │   │   ├── Chat.jsx
│   │   │   └── Jobs.jsx
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   ├── App.css
│   │   └── index.css
│   ├── package.json
│   └── index.html
└── README.md
```

## 🔒 Security Features

- **Helmet.js** for security headers
- **CORS** configuration
- **Rate limiting** to prevent abuse
- **Input validation** and sanitization
- **Secure file upload** handling
- **Environment variable** protection

## 📊 Performance Features

- **Compression** middleware
- **Database indexing** for fast queries
- **Asynchronous processing** for scraping jobs
- **File streaming** for large uploads
- **Memory management** for Puppeteer instances

## 🧪 Testing

```bash
# Backend tests
cd Server
npm test

# Frontend tests
cd Client
npm test
```

## 🚀 Deployment

### Docker (Recommended)
```bash
# Build and run with Docker Compose
docker-compose up -d
```

### Manual Deployment
1. Set `NODE_ENV=production`
2. Configure production MongoDB
3. Set up reverse proxy (nginx)
4. Configure SSL certificates
5. Set up process manager (PM2)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🆘 Support

- **Issues**: Report bugs and feature requests on GitHub
- **Documentation**: Check the wiki for detailed guides
- **Community**: Join our Discord server for discussions

## 🔮 Roadmap

- [ ] Advanced scheduling and automation
- [ ] Multi-user support with roles
- [ ] Advanced analytics and reporting
- [ ] Integration with cloud storage
- [ ] Mobile application
- [ ] Plugin system for custom scrapers
- [ ] Advanced AI content analysis
- [ ] Real-time collaboration features

## 🙏 Acknowledgments

- Puppeteer team for the excellent web automation library
- OpenAI for providing the AI capabilities
- MongoDB team for the robust database solution
- React and Tailwind teams for the amazing frontend tools

---

**Made with ❤️ by the WebScraper Pro Team**
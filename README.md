# Web Scraper Pro - Comprehensive Web Scraping & Knowledge Management System

A professional-grade web scraping application with AI-powered knowledge management, advanced file processing, and intelligent chat interface.

## 🚀 Features

### Web Scraping
- **Single Page Scraping**: Scrape individual web pages with custom options
- **Multiple Pages Scraping**: Batch scrape multiple URLs with concurrent processing
- **Site-wide Scraping**: Crawl entire websites with configurable depth and limits
- **Screenshot Capture**: Take screenshots at mobile, tablet, and desktop resolutions
- **Custom Instructions**: Use natural language to specify extraction requirements
- **Multiple Output Formats**: Export data in HTML, JSON, CSV, Markdown, or plain text

### File Management
- **Multi-Format Support**: Handle HTML, CSS, JS, CSV, Word, Excel, PDF, images, and code files
- **Drag & Drop Upload**: Easy file upload with progress tracking
- **Intelligent Processing**: Automatic content extraction and metadata generation
- **Tagging System**: Organize files with custom tags and notes
- **Search & Filter**: Advanced search across file content and metadata

### Knowledge Base
- **Centralized Storage**: MongoDB-based storage for all scraped content and files
- **Advanced Search**: Full-text search across all stored content
- **Analytics Dashboard**: Comprehensive statistics and insights
- **Content Organization**: Automatic categorization and metadata extraction
- **Export Capabilities**: Download content in various formats

### AI Chat Interface
- **LLM Integration**: Support for OpenAI and custom API endpoints
- **Knowledge Context**: Chat with context from your stored content
- **MCP Server Support**: Dynamic tool and server management
- **Session Management**: Persistent chat sessions with history
- **Customizable Models**: Configurable temperature, tokens, and model selection

## 🛠️ Technology Stack

### Backend
- **Node.js** with Express.js
- **MongoDB** with Mongoose ODM
- **Puppeteer** for web scraping and screenshots
- **Cheerio** for HTML parsing
- **Sharp** for image processing
- **Multer** for file uploads
- **LangChain** for AI integration

### Frontend
- **React 18** with modern hooks
- **Tailwind CSS** for styling
- **React Query** for state management
- **React Router** for navigation
- **Lucide React** for icons
- **Recharts** for data visualization

## 📋 Prerequisites

- Node.js 18+ and npm
- MongoDB 6.0+
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
MONGODB_URI=mongodb://localhost:27017/web-scraper
MONGODB_DB=web-scraper

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here
OPENAI_MODEL=gpt-4

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100

# File Upload
MAX_FILE_SIZE=50MB
UPLOAD_PATH=./uploads

# Screenshot Configuration
SCREENSHOT_QUALITY=80
SCREENSHOT_TIMEOUT=30000

# Security
JWT_SECRET=your_jwt_secret_here
SESSION_SECRET=your_session_secret_here
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

**Backend:**
```bash
cd Server
npm run dev
```

**Frontend:**
```bash
cd Client
npm run dev
```

#### Production Mode

**Backend:**
```bash
cd Server
npm start
```

**Frontend:**
```bash
cd Client
npm run build
npm run preview
```

## 🌐 Usage

### Web Scraping

1. Navigate to the **Web Scraper** page
2. Choose scraping mode:
   - **Single Page**: Scrape individual URLs
   - **Multiple Pages**: Batch scrape multiple URLs
   - **Entire Site**: Crawl complete websites
3. Configure options:
   - Output formats (HTML, JSON, CSV, Markdown, Text)
   - Screenshot capture (mobile, tablet, desktop)
   - Custom instructions for extraction
4. Start scraping and monitor progress
5. Export results in your preferred format

### File Management

1. Go to the **Files** page
2. Drag & drop files or click to select
3. Add tags and notes for organization
4. Monitor upload progress
5. Search and filter uploaded files
6. View, download, or delete files as needed

### Knowledge Base

1. Access the **Knowledge Base** page
2. View comprehensive statistics and analytics
3. Search across all stored content
4. Browse scraped pages and uploaded files
5. Export data and generate reports

### AI Chat

1. Navigate to the **Chat** page
2. Configure LLM settings:
   - API endpoint and key
   - Model selection
   - Temperature and token limits
3. Add MCP servers for extended functionality
4. Create chat sessions and start conversing
5. Chat with context from your knowledge base

## 🔧 Configuration

### LLM Settings
- **Base URL**: Custom API endpoint (e.g., OpenAI, local models)
- **API Key**: Authentication key for the service
- **Model**: AI model to use (e.g., gpt-4, gpt-3.5-turbo)
- **Temperature**: Creativity level (0.0 - 2.0)
- **Max Tokens**: Maximum response length

### MCP Servers
- **Name**: Descriptive server identifier
- **URL**: Server endpoint address
- **Description**: Server purpose and capabilities
- **Tools**: Available functions and parameters

### Scraping Options
- **Max Depth**: Maximum crawl depth for site scraping
- **Max Pages**: Maximum number of pages to scrape
- **Same Domain**: Restrict crawling to same domain
- **Concurrent Requests**: Number of simultaneous requests
- **User Agent**: Custom browser identification

## 📊 API Endpoints

### Scraping
- `POST /api/scrape/page` - Scrape single page
- `POST /api/scrape/multiple` - Scrape multiple pages
- `POST /api/scrape/site` - Scrape entire site
- `POST /api/scrape/export` - Export scraped data

### Files
- `POST /api/upload` - Upload and process files
- `GET /api/files` - Get uploaded files
- `GET /api/files/:id/content` - Get file content
- `DELETE /api/files/:id` - Delete file

### Knowledge Base
- `GET /api/knowledge/stats` - Get knowledge base statistics
- `POST /api/knowledge/search` - Search knowledge base

### Chat
- `POST /api/chat/init` - Initialize LLM service
- `POST /api/chat/sessions` - Create chat session
- `GET /api/chat/sessions` - Get chat sessions
- `POST /api/chat/sessions/:id/messages` - Send message

## 🚨 Security Considerations

- Store API keys securely in environment variables
- Implement rate limiting for production use
- Use HTTPS in production environments
- Regularly update dependencies
- Monitor and log access patterns
- Implement user authentication for multi-user setups

## 🐛 Troubleshooting

### Common Issues

**MongoDB Connection Failed**
- Ensure MongoDB is running
- Check connection string in .env file
- Verify network access and firewall settings

**Scraping Fails**
- Check target website accessibility
- Verify URL format and validity
- Review custom instructions syntax
- Check browser automation settings

**File Upload Issues**
- Verify file size limits
- Check supported file types
- Ensure upload directory permissions
- Review file processing logs

**LLM Integration Problems**
- Validate API key and endpoint
- Check rate limits and quotas
- Verify model availability
- Review network connectivity

### Debug Mode

Enable debug logging by setting:
```env
NODE_ENV=development
DEBUG=*
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## 📄 License

This project is licensed under the ISC License.

## 🆘 Support

For support and questions:
- Create an issue in the repository
- Check the documentation
- Review the troubleshooting section

## 🔮 Roadmap

- [ ] User authentication and authorization
- [ ] Advanced scheduling and automation
- [ ] Integration with cloud storage providers
- [ ] Enhanced AI capabilities and models
- [ ] Mobile application
- [ ] API rate limiting and monitoring
- [ ] Advanced analytics and reporting
- [ ] Multi-language support
- [ ] Plugin system for extensibility

---

**Built with ❤️ using modern web technologies**
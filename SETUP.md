# 🚀 Quick Setup Guide - Web Scraper Pro

## Prerequisites
- Node.js 18+ and npm
- MongoDB 6.0+
- Modern web browser

## 🏃‍♂️ Quick Start

### 1. Install Dependencies
```bash
# Server dependencies
cd Server
npm install

# Client dependencies
cd ../Client
npm install
```

### 2. Configure Environment
Create `.env` file in `Server/` directory:
```env
PORT=5000
MONGODB_URI=mongodb://localhost:27017/web-scraper
OPENAI_API_KEY=your_api_key_here
```

### 3. Start MongoDB
```bash
sudo systemctl start mongod
# or
mongod
```

### 4. Start the Application

#### Option A: Use the startup script
```bash
./start.sh
```

#### Option B: Manual start
```bash
# Terminal 1 - Start server
cd Server
npm run dev

# Terminal 2 - Start client
cd Client
npm run dev
```

### 5. Access the Application
- **Frontend**: http://localhost:5173
- **Backend**: http://localhost:5000
- **Health Check**: http://localhost:5000/health

## 🧪 Test the Setup
```bash
node demo.js
```

## 📚 What's Included

### Backend Features
- ✅ Web scraping (single page, multiple pages, entire sites)
- ✅ Screenshot capture (mobile, tablet, desktop)
- ✅ File processing (100+ formats supported)
- ✅ MongoDB integration
- ✅ AI/LLM integration
- ✅ RESTful API endpoints

### Frontend Features
- ✅ Modern React 18 application
- ✅ Responsive design with Tailwind CSS
- ✅ Web scraping interface
- ✅ File management system
- ✅ Knowledge base dashboard
- ✅ AI chat interface

## 🔧 Configuration

### LLM Settings
- Navigate to Chat page
- Click "Configure"
- Enter your API endpoint and key
- Select model and parameters

### File Upload
- Drag & drop files to upload
- Supports documents, images, code files
- Automatic content extraction
- Tagging and organization

### Web Scraping
- Single page scraping
- Batch processing
- Site-wide crawling
- Custom instructions
- Multiple export formats

## 🚨 Troubleshooting

### Common Issues
1. **MongoDB not running**: Start with `sudo systemctl start mongod`
2. **Port conflicts**: Change PORT in .env file
3. **Dependencies**: Run `npm install` in both directories
4. **API errors**: Check your OpenAI API key

### Debug Mode
```bash
cd Server
DEBUG=* npm run dev
```

## 📖 Next Steps
1. Explore the web scraping interface
2. Upload some files to test processing
3. Configure your LLM API
4. Start building your knowledge base

## 🆘 Need Help?
- Check the main README.md for detailed documentation
- Review the API endpoints in the server code
- Test individual components with the demo script

---

**Happy Scraping! 🕷️✨**
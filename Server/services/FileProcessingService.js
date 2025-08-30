const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const TurndownService = require('turndown');
const { v4: uuidv4 } = require('uuid');
const { logger } = require('../config/database');

class FileProcessingService {
  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    this.supportedFormats = {
      documents: ['.doc', '.docx', '.pdf', '.txt', '.md', '.rtf'],
      spreadsheets: ['.xls', '.xlsx', '.csv'],
      images: ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.bmp', '.tiff'],
      code: ['.js', '.ts', '.jsx', '.tsx', '.py', '.rs', '.sql', '.c', '.cpp', '.h', '.hpp', '.java', '.php', '.rb', '.go', '.swift', '.kt', '.scala'],
      web: ['.html', '.htm', '.css', '.scss', '.sass', '.less'],
      data: ['.json', '.xml', '.yaml', '.yml']
    };
  }

  async processFile(file, uploadPath) {
    try {
      const fileExtension = path.extname(file.originalname).toLowerCase();
      const fileName = `${uuidv4()}_${file.originalname}`;
      const filePath = path.join(uploadPath, fileName);
      
      // Save the file
      await fs.writeFile(filePath, file.buffer);
      
      // Process based on file type
      const processedData = await this.extractContent(filePath, fileExtension, file.mimetype);
      
      return {
        originalName: file.originalname,
        fileName,
        filePath,
        fileSize: file.size,
        mimeType: file.mimetype,
        extension: fileExtension,
        processedData,
        uploadedAt: new Date()
      };
      
    } catch (error) {
      logger.error('Error processing file:', error);
      throw error;
    }
  }

  async extractContent(filePath, extension, mimeType) {
    try {
      const buffer = await fs.readFile(filePath);
      
      // Handle different file types
      if (this.supportedFormats.documents.includes(extension)) {
        return await this.processDocument(buffer, extension);
      } else if (this.supportedFormats.spreadsheets.includes(extension)) {
        return await this.processSpreadsheet(buffer, extension);
      } else if (this.supportedFormats.images.includes(extension)) {
        return await this.processImage(buffer, extension);
      } else if (this.supportedFormats.code.includes(extension)) {
        return await this.processCode(buffer, extension);
      } else if (this.supportedFormats.web.includes(extension)) {
        return await this.processWebFile(buffer, extension);
      } else if (this.supportedFormats.data.includes(extension)) {
        return await this.processDataFile(buffer, extension);
      } else {
        // Default to plain text
        return await this.processPlainText(buffer);
      }
      
    } catch (error) {
      logger.error(`Error extracting content from ${extension} file:`, error);
      throw error;
    }
  }

  async processDocument(buffer, extension) {
    try {
      let text = '';
      
      if (extension === '.pdf') {
        const data = await pdf(buffer);
        text = data.text;
      } else if (extension === '.docx') {
        const result = await mammoth.extractRawText({ buffer });
        text = result.value;
      } else if (extension === '.doc') {
        // For .doc files, we'd need a different library like antiword
        text = 'DOC file processing not implemented yet';
      } else if (extension === '.txt' || extension === '.md' || extension === '.rtf') {
        text = buffer.toString('utf8');
      }
      
      return {
        type: 'document',
        text,
        wordCount: text.split(/\s+/).length,
        characterCount: text.length
      };
      
    } catch (error) {
      logger.error('Error processing document:', error);
      throw error;
    }
  }

  async processSpreadsheet(buffer, extension) {
    try {
      if (extension === '.csv') {
        const text = buffer.toString('utf8');
        const rows = text.split('\n').map(row => row.split(','));
        
        return {
          type: 'spreadsheet',
          format: 'csv',
          rows: rows.length,
          columns: rows[0]?.length || 0,
          headers: rows[0] || [],
          data: rows.slice(1)
        };
      } else {
        const workbook = xlsx.read(buffer, { type: 'buffer' });
        const sheetNames = workbook.SheetNames;
        const sheets = {};
        
        for (const sheetName of sheetNames) {
          const worksheet = workbook.Sheets[sheetName];
          const jsonData = xlsx.utils.sheet_to_json(worksheet, { header: 1 });
          
          sheets[sheetName] = {
            rows: jsonData.length,
            columns: jsonData[0]?.length || 0,
            headers: jsonData[0] || [],
            data: jsonData.slice(1)
          };
        }
        
        return {
          type: 'spreadsheet',
          format: extension,
          sheetNames,
          sheets
        };
      }
      
    } catch (error) {
      logger.error('Error processing spreadsheet:', error);
      throw error;
    }
  }

  async processImage(buffer, extension) {
    try {
      const image = sharp(buffer);
      const metadata = await image.metadata();
      
      // Generate thumbnail
      const thumbnailPath = path.join(
        path.dirname(path.dirname(buffer)),
        'thumbnails',
        `${uuidv4()}_thumb.jpg`
      );
      
      await image
        .resize(200, 200, { fit: 'inside' })
        .jpeg({ quality: 80 })
        .toFile(thumbnailPath);
      
      return {
        type: 'image',
        format: metadata.format,
        width: metadata.width,
        height: metadata.height,
        channels: metadata.channels,
        depth: metadata.depth,
        density: metadata.density,
        thumbnailPath
      };
      
    } catch (error) {
      logger.error('Error processing image:', error);
      throw error;
    }
  }

  async processCode(buffer, extension) {
    try {
      const code = buffer.toString('utf8');
      const lines = code.split('\n');
      
      return {
        type: 'code',
        language: this.getLanguageFromExtension(extension),
        lines: lines.length,
        characters: code.length,
        code,
        hasComments: this.hasComments(code, extension),
        complexity: this.calculateComplexity(code, extension)
      };
      
    } catch (error) {
      logger.error('Error processing code:', error);
      throw error;
    }
  }

  async processWebFile(buffer, extension) {
    try {
      const content = buffer.toString('utf8');
      
      if (extension === '.html' || extension === '.htm') {
        return {
          type: 'web',
          format: 'html',
          content,
          hasScripts: content.includes('<script'),
          hasStyles: content.includes('<style') || content.includes('link'),
          title: this.extractTitle(content)
        };
      } else if (extension === '.css' || extension === '.scss' || extension === '.sass' || extension === '.less') {
        return {
          type: 'web',
          format: 'stylesheet',
          content,
          rules: this.countCSSRules(content),
          selectors: this.extractCSSSelectors(content)
        };
      }
      
    } catch (error) {
      logger.error('Error processing web file:', error);
      throw error;
    }
  }

  async processDataFile(buffer, extension) {
    try {
      const content = buffer.toString('utf8');
      
      if (extension === '.json') {
        const data = JSON.parse(content);
        return {
          type: 'data',
          format: 'json',
          data,
          size: JSON.stringify(data).length,
          keys: this.extractKeys(data)
        };
      } else if (extension === '.xml') {
        return {
          type: 'data',
          format: 'xml',
          content,
          size: content.length
        };
      } else if (extension === '.yaml' || extension === '.yml') {
        return {
          type: 'data',
          format: 'yaml',
          content,
          size: content.length
        };
      }
      
    } catch (error) {
      logger.error('Error processing data file:', error);
      throw error;
    }
  }

  async processPlainText(buffer) {
    try {
      const text = buffer.toString('utf8');
      
      return {
        type: 'text',
        format: 'plain',
        text,
        lines: text.split('\n').length,
        words: text.split(/\s+/).length,
        characters: text.length
      };
      
    } catch (error) {
      logger.error('Error processing plain text:', error);
      throw error;
    }
  }

  getLanguageFromExtension(extension) {
    const languageMap = {
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.jsx': 'React JSX',
      '.tsx': 'React TSX',
      '.py': 'Python',
      '.rs': 'Rust',
      '.sql': 'SQL',
      '.c': 'C',
      '.cpp': 'C++',
      '.h': 'C Header',
      '.hpp': 'C++ Header',
      '.java': 'Java',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.swift': 'Swift',
      '.kt': 'Kotlin',
      '.scala': 'Scala'
    };
    
    return languageMap[extension] || 'Unknown';
  }

  hasComments(code, extension) {
    const commentPatterns = {
      '.js': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      '.ts': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      '.py': /#.*$|'''[\s\S]*?'''|"""[\s\S]*?"""/gm,
      '.rs': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      '.c': /\/\/.*$|\/\*[\s\S]*?\*\//gm,
      '.cpp': /\/\/.*$|\/\*[\s\S]*?\*\//gm
    };
    
    const pattern = commentPatterns[extension];
    return pattern ? pattern.test(code) : false;
  }

  calculateComplexity(code, extension) {
    // Simple complexity calculation
    const lines = code.split('\n');
    const complexity = {
      lines: lines.length,
      functions: (code.match(/function\s+\w+|def\s+\w+|fn\s+\w+/g) || []).length,
      loops: (code.match(/for|while|do/g) || []).length,
      conditionals: (code.match(/if|else|switch|case/g) || []).length
    };
    
    complexity.score = complexity.functions + complexity.loops + complexity.conditionals;
    return complexity;
  }

  countCSSRules(content) {
    const rules = content.match(/[^}]+}/g) || [];
    return rules.length;
  }

  extractCSSSelectors(content) {
    const selectors = content.match(/[^{]+{/g) || [];
    return selectors.map(s => s.replace('{', '').trim()).filter(s => s);
  }

  extractTitle(html) {
    const titleMatch = html.match(/<title[^>]*>([^<]+)<\/title>/i);
    return titleMatch ? titleMatch[1].trim() : '';
  }

  extractKeys(obj, prefix = '') {
    const keys = [];
    
    for (const key in obj) {
      const fullKey = prefix ? `${prefix}.${key}` : key;
      keys.push(fullKey);
      
      if (typeof obj[key] === 'object' && obj[key] !== null && !Array.isArray(obj[key])) {
        keys.push(...this.extractKeys(obj[key], fullKey));
      }
    }
    
    return keys;
  }

  isSupportedFormat(filename) {
    const extension = path.extname(filename).toLowerCase();
    return Object.values(this.supportedFormats).flat().includes(extension);
  }

  getSupportedFormats() {
    return this.supportedFormats;
  }
}

module.exports = FileProcessingService;
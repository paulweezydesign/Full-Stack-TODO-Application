const fs = require('fs').promises;
const path = require('path');
const mammoth = require('mammoth');
const xlsx = require('xlsx');
const pdf = require('pdf-parse');
const sharp = require('sharp');
const csv = require('csv-parser');
const { createReadStream } = require('fs');
const TurndownService = require('turndown');

class FileProcessingService {
  constructor() {
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    this.supportedTypes = {
      // Documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'word',
      'application/msword': 'word',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'excel',
      'application/vnd.ms-excel': 'excel',
      'application/pdf': 'pdf',
      
      // Text files
      'text/plain': 'text',
      'text/markdown': 'markdown',
      'text/html': 'html',
      'text/css': 'css',
      'text/javascript': 'js',
      'application/javascript': 'js',
      
      // Data files
      'text/csv': 'csv',
      'application/json': 'json',
      
      // Images
      'image/jpeg': 'image',
      'image/jpg': 'image',
      'image/png': 'image',
      'image/webp': 'image',
      'image/gif': 'image',
      
      // Code files
      'application/x-python': 'code',
      'text/x-python': 'code',
      'text/x-rust': 'code',
      'text/x-sql': 'code',
      'text/x-c': 'code',
      'text/x-c++': 'code',
      'text/x-java': 'code',
      'text/x-php': 'code',
      'text/x-ruby': 'code',
      'text/x-go': 'code'
    };
  }

  async processFile(filePath, originalName, mimetype) {
    try {
      const fileType = this.getFileType(mimetype, originalName);
      const fileStats = await fs.stat(filePath);
      
      let processedContent = {
        text: null,
        html: null,
        json: null,
        metadata: {}
      };

      switch (fileType) {
        case 'word':
          processedContent = await this.processWordDocument(filePath);
          break;
          
        case 'excel':
          processedContent = await this.processExcelFile(filePath);
          break;
          
        case 'pdf':
          processedContent = await this.processPDFFile(filePath);
          break;
          
        case 'csv':
          processedContent = await this.processCSVFile(filePath);
          break;
          
        case 'json':
          processedContent = await this.processJSONFile(filePath);
          break;
          
        case 'html':
          processedContent = await this.processHTMLFile(filePath);
          break;
          
        case 'markdown':
          processedContent = await this.processMarkdownFile(filePath);
          break;
          
        case 'image':
          processedContent = await this.processImageFile(filePath);
          break;
          
        case 'code':
          processedContent = await this.processCodeFile(filePath);
          break;
          
        case 'text':
        default:
          processedContent = await this.processTextFile(filePath);
          break;
      }

      return {
        fileType,
        size: fileStats.size,
        processedContent,
        originalName,
        mimetype
      };

    } catch (error) {
      console.error(`Error processing file ${filePath}:`, error);
      throw new Error(`Failed to process file: ${error.message}`);
    }
  }

  getFileType(mimetype, filename) {
    // First try to get type from mimetype
    if (this.supportedTypes[mimetype]) {
      return this.supportedTypes[mimetype];
    }

    // Fallback to file extension
    const extension = path.extname(filename).toLowerCase();
    const extensionMap = {
      '.doc': 'word',
      '.docx': 'word',
      '.xls': 'excel',
      '.xlsx': 'excel',
      '.pdf': 'pdf',
      '.csv': 'csv',
      '.json': 'json',
      '.html': 'html',
      '.htm': 'html',
      '.css': 'css',
      '.js': 'js',
      '.md': 'markdown',
      '.txt': 'text',
      '.py': 'code',
      '.rs': 'code',
      '.sql': 'code',
      '.c': 'code',
      '.cpp': 'code',
      '.cc': 'code',
      '.java': 'code',
      '.php': 'code',
      '.rb': 'code',
      '.go': 'code',
      '.jpg': 'image',
      '.jpeg': 'image',
      '.png': 'image',
      '.webp': 'image',
      '.gif': 'image'
    };

    return extensionMap[extension] || 'text';
  }

  async processWordDocument(filePath) {
    try {
      const result = await mammoth.extractRawText({ path: filePath });
      const html = await mammoth.convertToHtml({ path: filePath });
      
      return {
        text: result.value,
        html: html.value,
        metadata: {
          messages: result.messages,
          documentType: 'Word Document'
        }
      };
    } catch (error) {
      throw new Error(`Failed to process Word document: ${error.message}`);
    }
  }

  async processExcelFile(filePath) {
    try {
      const workbook = xlsx.readFile(filePath);
      const sheets = {};
      const allData = [];

      for (const sheetName of workbook.SheetNames) {
        const sheet = workbook.Sheets[sheetName];
        const jsonData = xlsx.utils.sheet_to_json(sheet, { header: 1 });
        
        sheets[sheetName] = jsonData;
        allData.push(...jsonData);
      }

      return {
        json: {
          sheets,
          allData,
          sheetNames: workbook.SheetNames
        },
        text: this.excelToText(allData),
        metadata: {
          documentType: 'Excel Spreadsheet',
          sheetCount: workbook.SheetNames.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to process Excel file: ${error.message}`);
    }
  }

  excelToText(data) {
    return data.map(row => row.join('\t')).join('\n');
  }

  async processPDFFile(filePath) {
    try {
      const dataBuffer = await fs.readFile(filePath);
      const data = await pdf(dataBuffer);
      
      return {
        text: data.text,
        metadata: {
          documentType: 'PDF Document',
          pageCount: data.numpages,
          info: data.info
        }
      };
    } catch (error) {
      throw new Error(`Failed to process PDF file: ${error.message}`);
    }
  }

  async processCSVFile(filePath) {
    try {
      return new Promise((resolve, reject) => {
        const results = [];
        const stream = createReadStream(filePath);
        
        stream
          .pipe(csv())
          .on('data', (data) => results.push(data))
          .on('end', () => {
            resolve({
              json: results,
              text: this.csvToText(results),
              metadata: {
                documentType: 'CSV File',
                rowCount: results.length,
                columns: results.length > 0 ? Object.keys(results[0]) : []
              }
            });
          })
          .on('error', reject);
      });
    } catch (error) {
      throw new Error(`Failed to process CSV file: ${error.message}`);
    }
  }

  csvToText(data) {
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const rows = data.map(row => headers.map(header => row[header] || '').join('\t'));
    
    return [headers.join('\t'), ...rows].join('\n');
  }

  async processJSONFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const jsonData = JSON.parse(content);
      
      return {
        json: jsonData,
        text: JSON.stringify(jsonData, null, 2),
        metadata: {
          documentType: 'JSON File',
          isValid: true
        }
      };
    } catch (error) {
      throw new Error(`Failed to process JSON file: ${error.message}`);
    }
  }

  async processHTMLFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const markdown = this.turndownService.turndown(content);
      
      return {
        html: content,
        text: this.htmlToText(content),
        markdown: markdown,
        metadata: {
          documentType: 'HTML File'
        }
      };
    } catch (error) {
      throw new Error(`Failed to process HTML file: ${error.message}`);
    }
  }

  htmlToText(html) {
    // Simple HTML to text conversion
    return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  async processMarkdownFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      return {
        markdown: content,
        text: content,
        metadata: {
          documentType: 'Markdown File'
        }
      };
    } catch (error) {
      throw new Error(`Failed to process Markdown file: ${error.message}`);
    }
  }

  async processImageFile(filePath) {
    try {
      const image = sharp(filePath);
      const metadata = await image.metadata();
      
      // Generate thumbnail
      const thumbnailPath = filePath.replace(/\.[^/.]+$/, '_thumb.jpg');
      await image.resize(200, 200, { fit: 'inside' }).jpeg({ quality: 80 }).toFile(thumbnailPath);
      
      return {
        metadata: {
          documentType: 'Image File',
          format: metadata.format,
          width: metadata.width,
          height: metadata.height,
          channels: metadata.channels,
          hasAlpha: metadata.hasAlpha,
          thumbnailPath
        }
      };
    } catch (error) {
      throw new Error(`Failed to process image file: ${error.message}`);
    }
  }

  async processCodeFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      const extension = path.extname(filePath);
      
      return {
        text: content,
        metadata: {
          documentType: 'Code File',
          language: this.getLanguageFromExtension(extension),
          lineCount: content.split('\n').length,
          characterCount: content.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to process code file: ${error.message}`);
    }
  }

  getLanguageFromExtension(extension) {
    const languageMap = {
      '.py': 'Python',
      '.rs': 'Rust',
      '.sql': 'SQL',
      '.c': 'C',
      '.cpp': 'C++',
      '.cc': 'C++',
      '.java': 'Java',
      '.php': 'PHP',
      '.rb': 'Ruby',
      '.go': 'Go',
      '.js': 'JavaScript',
      '.ts': 'TypeScript',
      '.html': 'HTML',
      '.css': 'CSS',
      '.md': 'Markdown'
    };
    
    return languageMap[extension] || 'Unknown';
  }

  async processTextFile(filePath) {
    try {
      const content = await fs.readFile(filePath, 'utf8');
      
      return {
        text: content,
        metadata: {
          documentType: 'Text File',
          lineCount: content.split('\n').length,
          characterCount: content.length
        }
      };
    } catch (error) {
      throw new Error(`Failed to process text file: ${error.message}`);
    }
  }

  async extractTextFromFile(filePath, fileType) {
    try {
      const processed = await this.processFile(filePath, path.basename(filePath), this.getMimeType(fileType));
      return processed.processedContent.text || processed.processedContent.markdown || '';
    } catch (error) {
      console.error(`Error extracting text from file: ${error.message}`);
      return '';
    }
  }

  getMimeType(fileType) {
    const mimeTypeMap = {
      'word': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'excel': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'pdf': 'application/pdf',
      'csv': 'text/csv',
      'json': 'application/json',
      'html': 'text/html',
      'markdown': 'text/markdown',
      'css': 'text/css',
      'js': 'text/javascript',
      'image': 'image/jpeg',
      'code': 'text/plain',
      'text': 'text/plain'
    };
    
    return mimeTypeMap[fileType] || 'text/plain';
  }

  async cleanupFile(filePath) {
    try {
      await fs.unlink(filePath);
    } catch (error) {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
}

module.exports = new FileProcessingService();
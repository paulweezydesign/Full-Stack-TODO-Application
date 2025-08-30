const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const TurndownService = require('turndown');
const fs = require('fs').promises;
const path = require('path');
const sharp = require('sharp');

class ScraperService {
  constructor() {
    this.browser = null;
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
    });
    
    // Configure turndown service
    this.turndownService.addRule('preserveLinks', {
      filter: 'a',
      replacement: function(content, node) {
        const href = node.getAttribute('href');
        return `[${content}](${href})`;
      }
    });
  }

  async initialize() {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: 'new',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
  }

  async close() {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  async scrapePage(url, options = {}) {
    const {
      takeScreenshots = false,
      outputFormats = ['html', 'text', 'markdown'],
      customInstructions = '',
      userAgent = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
    } = options;

    const startTime = Date.now();
    
    try {
      await this.initialize();
      
      const page = await this.browser.newPage();
      await page.setUserAgent(userAgent);
      await page.setViewport({ width: 1920, height: 1080 });
      
      // Set timeout
      await page.setDefaultNavigationTimeout(30000);
      
      // Navigate to the page
      await page.goto(url, { waitUntil: 'networkidle2' });
      
      // Wait for content to load
      await page.waitForTimeout(2000);
      
      // Get page content
      const content = await page.evaluate(() => {
        return {
          title: document.title,
          html: document.documentElement.outerHTML,
          text: document.body.innerText,
          description: document.querySelector('meta[name="description"]')?.content || '',
          keywords: document.querySelector('meta[name="keywords"]')?.content || '',
          author: document.querySelector('meta[name="author"]')?.content || '',
          language: document.documentElement.lang || 'en'
        };
      });

      // Process content based on custom instructions
      if (customInstructions) {
        content = await this.processCustomInstructions(content, customInstructions, page);
      }

      // Convert HTML to markdown
      const markdown = this.turndownService.turndown(content.html);

      // Take screenshots if requested
      let screenshots = {};
      if (takeScreenshots) {
        screenshots = await this.takeScreenshots(page, url);
      }

      const processingTime = Date.now() - startTime;

      // Prepare output data
      const outputData = {
        url,
        title: content.title,
        content: {},
        metadata: {
          description: content.description,
          keywords: content.keywords ? content.keywords.split(',').map(k => k.trim()) : [],
          author: content.author,
          language: content.language,
          lastModified: new Date(),
          processingTime
        },
        screenshots,
        scrapedAt: new Date(),
        status: 'completed'
      };

      // Add requested output formats
      if (outputFormats.includes('html')) {
        outputData.content.html = content.html;
      }
      if (outputFormats.includes('text')) {
        outputData.content.text = content.text;
      }
      if (outputFormats.includes('markdown')) {
        outputData.content.markdown = markdown;
      }

      await page.close();
      return outputData;

    } catch (error) {
      console.error(`Error scraping ${url}:`, error);
      return {
        url,
        status: 'failed',
        error: error.message,
        scrapedAt: new Date()
      };
    }
  }

  async scrapeMultiplePages(urls, options = {}) {
    const results = [];
    const { maxConcurrent = 3 } = options;
    
    // Process URLs in batches to avoid overwhelming the target servers
    for (let i = 0; i < urls.length; i += maxConcurrent) {
      const batch = urls.slice(i, i + maxConcurrent);
      const batchPromises = batch.map(url => this.scrapePage(url, options));
      
      const batchResults = await Promise.allSettled(batchPromises);
      results.push(...batchResults.map(result => 
        result.status === 'fulfilled' ? result.value : result.reason
      ));
      
      // Add delay between batches
      if (i + maxConcurrent < urls.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return results;
  }

  async scrapeSite(baseUrl, options = {}) {
    const {
      maxDepth = 3,
      maxPages = 100,
      sameDomain = true,
      ...scrapingOptions
    } = options;

    const visited = new Set();
    const toVisit = [{ url: baseUrl, depth: 0 }];
    const results = [];
    
    while (toVisit.length > 0 && results.length < maxPages) {
      const { url, depth } = toVisit.shift();
      
      if (visited.has(url) || depth > maxDepth) continue;
      visited.add(url);
      
      try {
        const result = await this.scrapePage(url, scrapingOptions);
        results.push(result);
        
        // If we haven't reached max depth, find links to follow
        if (depth < maxDepth && result.status === 'completed') {
          const links = await this.extractLinks(result.content.html, baseUrl, sameDomain);
          for (const link of links) {
            if (!visited.has(link)) {
              toVisit.push({ url: link, depth: depth + 1 });
            }
          }
        }
        
        // Add delay between requests
        await new Promise(resolve => setTimeout(resolve, 500));
        
      } catch (error) {
        console.error(`Error scraping ${url}:`, error);
        results.push({
          url,
          status: 'failed',
          error: error.message,
          scrapedAt: new Date()
        });
      }
    }
    
    return results;
  }

  async extractLinks(html, baseUrl, sameDomain = true) {
    const $ = cheerio.load(html);
    const links = new Set();
    
    $('a[href]').each((i, element) => {
      const href = $(element).attr('href');
      if (href) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          if (!sameDomain || new URL(absoluteUrl).hostname === new URL(baseUrl).hostname) {
            links.add(absoluteUrl);
          }
        } catch (error) {
          // Invalid URL, skip
        }
      }
    });
    
    return Array.from(links);
  }

  async takeScreenshots(page, url) {
    const screenshots = {};
    const viewports = {
      mobile: { width: 375, height: 667 },
      tablet: { width: 768, height: 1024 },
      desktop: { width: 1920, height: 1080 }
    };

    for (const [device, viewport] of Object.entries(viewports)) {
      try {
        await page.setViewport(viewport);
        await page.waitForTimeout(1000); // Wait for layout to adjust
        
        const screenshot = await page.screenshot({
          type: 'jpeg',
          quality: 80,
          fullPage: true
        });
        
        // Generate filename
        const timestamp = Date.now();
        const filename = `${device}_${timestamp}.jpg`;
        const filepath = path.join(process.env.UPLOAD_PATH || './uploads', 'screenshots', filename);
        
        // Ensure directory exists
        await fs.mkdir(path.dirname(filepath), { recursive: true });
        
        // Save screenshot
        await fs.writeFile(filepath, screenshot);
        
        screenshots[device] = filepath;
        
      } catch (error) {
        console.error(`Error taking ${device} screenshot:`, error);
        screenshots[device] = null;
      }
    }
    
    return screenshots;
  }

  async processCustomInstructions(content, instructions, page) {
    // This is where the LLM would process custom instructions
    // For now, we'll implement basic pattern matching
    try {
      // Example: Extract specific elements based on instructions
      if (instructions.includes('extract table')) {
        const tables = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('table')).map(table => ({
            headers: Array.from(table.querySelectorAll('th')).map(th => th.textContent.trim()),
            rows: Array.from(table.querySelectorAll('tr')).slice(1).map(row =>
              Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim())
            )
          }));
        });
        content.tables = tables;
      }
      
      if (instructions.includes('extract forms')) {
        const forms = await page.evaluate(() => {
          return Array.from(document.querySelectorAll('form')).map(form => ({
            action: form.action,
            method: form.method,
            inputs: Array.from(form.querySelectorAll('input, select, textarea')).map(input => ({
              type: input.type || input.tagName.toLowerCase(),
              name: input.name,
              placeholder: input.placeholder,
              required: input.required
            }))
          }));
        });
        content.forms = forms;
      }
      
    } catch (error) {
      console.error('Error processing custom instructions:', error);
    }
    
    return content;
  }

  async exportData(data, format, filename) {
    const timestamp = Date.now();
    const baseFilename = filename || `scraped_data_${timestamp}`;
    
    switch (format.toLowerCase()) {
      case 'json':
        return {
          filename: `${baseFilename}.json`,
          content: JSON.stringify(data, null, 2),
          mimetype: 'application/json'
        };
        
      case 'csv':
        // Convert data to CSV format
        const csvContent = this.convertToCSV(data);
        return {
          filename: `${baseFilename}.csv`,
          content: csvContent,
          mimetype: 'text/csv'
        };
        
      case 'markdown':
        const markdownContent = this.convertToMarkdown(data);
        return {
          filename: `${baseFilename}.md`,
          content: markdownContent,
          mimetype: 'text/markdown'
        };
        
      case 'html':
        const htmlContent = this.convertToHTML(data);
        return {
          filename: `${baseFilename}.html`,
          content: htmlContent,
          mimetype: 'text/html'
        };
        
      case 'text':
        const textContent = this.convertToText(data);
        return {
          filename: `${baseFilename}.txt`,
          content: textContent,
          mimetype: 'text/plain'
        };
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }

  convertToCSV(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    if (data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csvRows = [headers.join(',')];
    
    for (const row of data) {
      const values = headers.map(header => {
        const value = row[header];
        if (typeof value === 'string' && value.includes(',')) {
          return `"${value}"`;
        }
        return value || '';
      });
      csvRows.push(values.join(','));
    }
    
    return csvRows.join('\n');
  }

  convertToMarkdown(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    let markdown = '# Scraped Data\n\n';
    
    for (const [index, item] of data.entries()) {
      markdown += `## Item ${index + 1}\n\n`;
      
      for (const [key, value] of Object.entries(item)) {
        if (key === 'content' && typeof value === 'object') {
          markdown += `### ${key}\n\n`;
          for (const [contentKey, contentValue] of Object.entries(value)) {
            markdown += `**${contentKey}:**\n\`\`\`\n${contentValue}\n\`\`\`\n\n`;
          }
        } else if (typeof value === 'string') {
          markdown += `**${key}:** ${value}\n\n`;
        } else {
          markdown += `**${key}:** \`${JSON.stringify(value)}\`\n\n`;
        }
      }
      markdown += '---\n\n';
    }
    
    return markdown;
  }

  convertToHTML(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    let html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <title>Scraped Data</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; }
          .item { border: 1px solid #ddd; margin: 10px 0; padding: 15px; border-radius: 5px; }
          .key { font-weight: bold; color: #333; }
          .value { margin-left: 10px; }
          pre { background: #f5f5f5; padding: 10px; border-radius: 3px; overflow-x: auto; }
        </style>
      </head>
      <body>
        <h1>Scraped Data</h1>
    `;
    
    for (const [index, item] of data.entries()) {
      html += `<div class="item"><h2>Item ${index + 1}</h2>`;
      
      for (const [key, value] of Object.entries(item)) {
        if (key === 'content' && typeof value === 'object') {
          html += `<h3>${key}</h3>`;
          for (const [contentKey, contentValue] of Object.entries(value)) {
            html += `<div><span class="key">${contentKey}:</span><pre class="value">${contentValue}</pre></div>`;
          }
        } else if (typeof value === 'string') {
          html += `<div><span class="key">${key}:</span><span class="value">${value}</span></div>`;
        } else {
          html += `<div><span class="key">${key}:</span><span class="value">${JSON.stringify(value)}</span></div>`;
        }
      }
      
      html += '</div>';
    }
    
    html += '</body></html>';
    return html;
  }

  convertToText(data) {
    if (!Array.isArray(data)) {
      data = [data];
    }
    
    let text = 'SCRAPED DATA\n\n';
    
    for (const [index, item] of data.entries()) {
      text += `ITEM ${index + 1}\n`;
      text += '='.repeat(20) + '\n\n';
      
      for (const [key, value] of Object.entries(item)) {
        if (key === 'content' && typeof value === 'object') {
          text += `${key.toUpperCase()}:\n`;
          for (const [contentKey, contentValue] of Object.entries(value)) {
            text += `  ${contentKey}:\n    ${contentValue}\n\n`;
          }
        } else {
          text += `${key}: ${value}\n\n`;
        }
      }
      text += '\n';
    }
    
    return text;
  }
}

module.exports = new ScraperService();
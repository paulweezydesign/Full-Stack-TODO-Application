const puppeteer = require('puppeteer');
const cheerio = require('cheerio');
const axios = require('axios');
const fs = require('fs').promises;
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const TurndownService = require('turndown');
const { logger } = require('../config/database');

class WebScraperService {
  constructor() {
    this.browser = null;
    this.turndownService = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced'
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

  async scrapeSinglePage(url, options = {}) {
    try {
      await this.initialize();
      const page = await this.browser.newPage();
      
      // Set viewport for screenshots
      const viewports = {
        mobile: { width: 375, height: 667 },
        tablet: { width: 768, height: 1024 },
        desktop: { width: 1920, height: 1080 }
      };

      const results = {
        url,
        content: {},
        screenshots: [],
        metadata: {
          scrapedAt: new Date(),
          userAgent: await page.evaluate(() => navigator.userAgent),
          title: '',
          description: '',
          keywords: []
        }
      };

      // Navigate to the page
      await page.goto(url, { 
        waitUntil: 'networkidle2',
        timeout: 30000 
      });

      // Get page metadata
      results.metadata.title = await page.title();
      results.metadata.description = await page.$eval('meta[name="description"]', el => el?.content) || '';
      
      // Get content in requested formats
      if (options.outputFormats.includes('html')) {
        results.content.html = await page.content();
      }

      if (options.outputFormats.includes('plain-text')) {
        results.content.plainText = await page.evaluate(() => {
          return document.body.innerText;
        });
      }

      if (options.outputFormats.includes('markdown')) {
        const html = await page.content();
        results.content.markdown = this.turndownService.turndown(html);
      }

      if (options.outputFormats.includes('json')) {
        results.content.json = await page.evaluate(() => {
          const data = {};
          data.title = document.title;
          data.description = document.querySelector('meta[name="description"]')?.content || '';
          data.headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6')).map(h => ({
            level: h.tagName.toLowerCase(),
            text: h.textContent.trim()
          }));
          data.links = Array.from(document.querySelectorAll('a')).map(a => ({
            text: a.textContent.trim(),
            href: a.href
          }));
          data.images = Array.from(document.querySelectorAll('img')).map(img => ({
            src: img.src,
            alt: img.alt,
            title: img.title
          }));
          return data;
        });
      }

      // Take screenshots if requested
      if (options.takeScreenshots && options.screenshotSizes) {
        for (const size of options.screenshotSizes) {
          if (viewports[size]) {
            await page.setViewport(viewports[size]);
            await page.waitForTimeout(1000); // Wait for layout to settle
            
            const screenshotPath = path.join(
              process.env.UPLOAD_PATH || './uploads',
              'screenshots',
              `${uuidv4()}_${size}.png`
            );
            
            await page.screenshot({
              path: screenshotPath,
              fullPage: true,
              quality: parseInt(process.env.SCREENSHOT_QUALITY) || 80
            });
            
            results.screenshots.push({
              size,
              path: screenshotPath,
              viewport: viewports[size]
            });
          }
        }
      }

      await page.close();
      return results;

    } catch (error) {
      logger.error(`Error scraping single page ${url}:`, error);
      throw error;
    }
  }

  async scrapeMultiplePages(urls, options = {}) {
    const results = [];
    const maxPages = options.maxPages || urls.length;
    
    for (let i = 0; i < Math.min(urls.length, maxPages); i++) {
      try {
        const result = await this.scrapeSinglePage(urls[i], options);
        results.push(result);
        
        // Add delay between requests if specified
        if (options.delay && i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
      } catch (error) {
        logger.error(`Error scraping page ${urls[i]}:`, error);
        results.push({
          url: urls[i],
          error: error.message,
          scrapedAt: new Date()
        });
      }
    }
    
    return results;
  }

  async scrapeSite(baseUrl, options = {}) {
    const visited = new Set();
    const toVisit = [baseUrl];
    const results = [];
    const maxPages = options.maxPages || 100;
    
    while (toVisit.length > 0 && results.length < maxPages) {
      const url = toVisit.shift();
      
      if (visited.has(url)) continue;
      visited.add(url);
      
      try {
        const result = await this.scrapeSinglePage(url, options);
        results.push(result);
        
        // Extract links for site-wide scraping
        if (options.followLinks && result.content.html) {
          const $ = cheerio.load(result.content.html);
          const links = $('a[href]').map((i, el) => {
            const href = $(el).attr('href');
            if (href && href.startsWith('/')) {
              return new URL(href, baseUrl).href;
            }
            return href;
          }).get();
          
          // Add new links to visit queue
          for (const link of links) {
            if (link && link.startsWith(baseUrl) && !visited.has(link)) {
              toVisit.push(link);
            }
          }
        }
        
        // Add delay between requests
        if (options.delay) {
          await new Promise(resolve => setTimeout(resolve, options.delay));
        }
        
      } catch (error) {
        logger.error(`Error scraping site page ${url}:`, error);
        results.push({
          url,
          error: error.message,
          scrapedAt: new Date()
        });
      }
    }
    
    return results;
  }

  async processCustomInstructions(content, instructions) {
    try {
      // This would integrate with an LLM service to process custom instructions
      // For now, return a placeholder implementation
      logger.info('Processing custom instructions:', instructions);
      
      return {
        processed: true,
        instructions,
        timestamp: new Date(),
        note: 'Custom instruction processing requires LLM integration'
      };
    } catch (error) {
      logger.error('Error processing custom instructions:', error);
      throw error;
    }
  }

  async saveResults(results, jobId, outputFormats) {
    const savedFiles = [];
    const outputDir = path.join(process.env.UPLOAD_PATH || './uploads', 'scraped', jobId);
    
    try {
      await fs.mkdir(outputDir, { recursive: true });
      
      for (const format of outputFormats) {
        if (format === 'html') {
          const htmlPath = path.join(outputDir, 'content.html');
          await fs.writeFile(htmlPath, results.content.html || '');
          savedFiles.push(htmlPath);
        }
        
        if (format === 'json') {
          const jsonPath = path.join(outputDir, 'content.json');
          await fs.writeFile(jsonPath, JSON.stringify(results.content.json || results, null, 2));
          savedFiles.push(jsonPath);
        }
        
        if (format === 'csv') {
          const csvPath = path.join(outputDir, 'content.csv');
          // Convert data to CSV format
          const csvContent = this.convertToCSV(results.content.json || results);
          await fs.writeFile(csvPath, csvContent);
          savedFiles.push(csvPath);
        }
        
        if (format === 'markdown') {
          const mdPath = path.join(outputDir, 'content.md');
          await fs.writeFile(mdPath, results.content.markdown || '');
          savedFiles.push(mdPath);
        }
        
        if (format === 'plain-text') {
          const txtPath = path.join(outputDir, 'content.txt');
          await fs.writeFile(txtPath, results.content.plainText || '');
          savedFiles.push(txtPath);
        }
      }
      
      return savedFiles;
    } catch (error) {
      logger.error('Error saving results:', error);
      throw error;
    }
  }

  convertToCSV(data) {
    if (Array.isArray(data)) {
      if (data.length === 0) return '';
      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(',')];
      
      for (const row of data) {
        const values = headers.map(header => {
          const value = row[header];
          return typeof value === 'string' ? `"${value.replace(/"/g, '""')}"` : value;
        });
        csvRows.push(values.join(','));
      }
      
      return csvRows.join('\n');
    }
    
    return '';
  }
}

module.exports = WebScraperService;
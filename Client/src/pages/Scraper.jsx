import React, { useState } from 'react';
import { Globe, Camera, Download, Settings, Play, AlertCircle } from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Scraper = () => {
  const [formData, setFormData] = useState({
    url: '',
    jobType: 'single',
    takeScreenshots: false,
    screenshotSizes: ['desktop'],
    outputFormats: ['html', 'json'],
    customInstructions: '',
    maxPages: 100,
    followLinks: false,
    delay: 1000
  });

  const [loading, setLoading] = useState(false);
  const [jobId, setJobId] = useState(null);

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleArrayChange = (name, value, checked) => {
    setFormData(prev => ({
      ...prev,
      [name]: checked
        ? [...prev[name], value]
        : prev[name].filter(item => item !== value)
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.url) {
      toast.error('Please enter a URL');
      return;
    }

    if (formData.jobType === 'multiple' && !Array.isArray(formData.url)) {
      // Convert single URL to array for multiple scraping
      formData.url = [formData.url];
    }

    setLoading(true);
    
    try {
      const response = await axios.post('http://localhost:5000/api/scrape', formData);
      
      if (response.data.success) {
        setJobId(response.data.jobId);
        toast.success('Scraping job started successfully!');
        
        // Reset form
        setFormData({
          url: '',
          jobType: 'single',
          takeScreenshots: false,
          screenshotSizes: ['desktop'],
          outputFormats: ['html', 'json'],
          customInstructions: '',
          maxPages: 100,
          followLinks: false,
          delay: 1000
        });
      }
    } catch (error) {
      console.error('Error starting scraping job:', error);
      toast.error(error.response?.data?.error || 'Failed to start scraping job');
    } finally {
      setLoading(false);
    }
  };

  const outputFormatOptions = [
    { value: 'html', label: 'HTML', description: 'Raw HTML content' },
    { value: 'json', label: 'JSON', description: 'Structured data' },
    { value: 'csv', label: 'CSV', description: 'Comma-separated values' },
    { value: 'markdown', label: 'Markdown', description: 'Formatted text' },
    { value: 'plain-text', label: 'Plain Text', description: 'Clean text only' }
  ];

  const screenshotSizeOptions = [
    { value: 'mobile', label: 'Mobile', description: '375x667' },
    { value: 'tablet', label: 'Tablet', description: '768x1024' },
    { value: 'desktop', label: 'Desktop', description: '1920x1080' }
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Web Scraper</h1>
        <p className="text-gray-600">Scrape web content with advanced options and AI-powered processing</p>
      </div>

      {/* Job Status */}
      {jobId && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <Play className="h-5 w-5 text-blue-600 animate-pulse" />
            <div>
              <h3 className="font-medium text-blue-900">Scraping Job Started</h3>
              <p className="text-sm text-blue-700">Job ID: {jobId}</p>
              <p className="text-sm text-blue-600">Check the Jobs page to monitor progress</p>
            </div>
          </div>
        </div>
      )}

      {/* Scraping Form */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Job Type Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Scraping Type
            </label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[
                { value: 'single', label: 'Single Page', description: 'Scrape one URL' },
                { value: 'multiple', label: 'Multiple Pages', description: 'Scrape several URLs' },
                { value: 'site', label: 'Entire Site', description: 'Scrape whole website' }
              ].map((type) => (
                <label key={type.value} className="relative flex cursor-pointer rounded-lg border border-gray-200 bg-white p-4 shadow-sm focus:outline-none">
                  <input
                    type="radio"
                    name="jobType"
                    value={type.value}
                    checked={formData.jobType === type.value}
                    onChange={handleInputChange}
                    className="sr-only"
                  />
                  <div className="flex flex-1">
                    <div className="flex flex-col">
                      <span className="block text-sm font-medium text-gray-900">{type.label}</span>
                      <span className="mt-1 flex items-center text-sm text-gray-500">{type.description}</span>
                    </div>
                  </div>
                  <div className={`ml-3 flex h-5 w-5 items-center justify-center rounded-full border ${
                    formData.jobType === type.value ? 'border-blue-600 bg-blue-600' : 'border-gray-300'
                  }`}>
                    {formData.jobType === type.value && (
                      <div className="h-2.5 w-2.5 rounded-full bg-white"></div>
                    )}
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* URL Input */}
          <div>
            <label htmlFor="url" className="block text-sm font-medium text-gray-700 mb-2">
              {formData.jobType === 'multiple' ? 'URLs (one per line)' : 'URL'}
            </label>
            <textarea
              id="url"
              name="url"
              rows={formData.jobType === 'multiple' ? 4 : 1}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder={formData.jobType === 'multiple' ? 'https://example.com/page1\nhttps://example.com/page2' : 'https://example.com'}
              value={formData.url}
              onChange={handleInputChange}
              required
            />
          </div>

          {/* Output Formats */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Output Formats
            </label>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {outputFormatOptions.map((format) => (
                <label key={format.value} className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      checked={formData.outputFormats.includes(format.value)}
                      onChange={(e) => handleArrayChange('outputFormats', format.value, e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label className="font-medium text-gray-700">{format.label}</label>
                    <p className="text-gray-500">{format.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          {/* Screenshots */}
          <div>
            <div className="flex items-center space-x-3 mb-3">
              <input
                type="checkbox"
                id="takeScreenshots"
                name="takeScreenshots"
                checked={formData.takeScreenshots}
                onChange={handleInputChange}
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label htmlFor="takeScreenshots" className="text-sm font-medium text-gray-700">
                Take Screenshots
              </label>
            </div>
            
            {formData.takeScreenshots && (
              <div className="ml-7">
                <label className="block text-sm font-medium text-gray-700 mb-2">Screenshot Sizes</label>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {screenshotSizeOptions.map((size) => (
                    <label key={size.value} className="relative flex items-start">
                      <div className="flex items-center h-5">
                        <input
                          type="checkbox"
                          checked={formData.screenshotSizes.includes(size.value)}
                          onChange={(e) => handleArrayChange('screenshotSizes', size.value, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </div>
                      <div className="ml-3 text-sm">
                        <label className="font-medium text-gray-700">{size.label}</label>
                        <p className="text-gray-500">{size.description}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Advanced Options */}
          <div className="border-t border-gray-200 pt-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Advanced Options</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Max Pages */}
              <div>
                <label htmlFor="maxPages" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Pages
                </label>
                <input
                  type="number"
                  id="maxPages"
                  name="maxPages"
                  min="1"
                  max="1000"
                  value={formData.maxPages}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              {/* Delay */}
              <div>
                <label htmlFor="delay" className="block text-sm font-medium text-gray-700 mb-2">
                  Delay Between Requests (ms)
                </label>
                <input
                  type="number"
                  id="delay"
                  name="delay"
                  min="0"
                  max="10000"
                  step="100"
                  value={formData.delay}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Follow Links */}
            {formData.jobType === 'site' && (
              <div className="mt-4">
                <label className="relative flex items-start">
                  <div className="flex items-center h-5">
                    <input
                      type="checkbox"
                      id="followLinks"
                      name="followLinks"
                      checked={formData.followLinks}
                      onChange={handleInputChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </div>
                  <div className="ml-3 text-sm">
                    <label htmlFor="followLinks" className="font-medium text-gray-700">Follow Internal Links</label>
                    <p className="text-gray-500">Automatically discover and scrape linked pages within the same domain</p>
                  </div>
                </label>
              </div>
            )}
          </div>

          {/* Custom Instructions */}
          <div>
            <label htmlFor="customInstructions" className="block text-sm font-medium text-gray-700 mb-2">
              Custom Instructions (Optional)
            </label>
            <textarea
              id="customInstructions"
              name="customInstructions"
              rows={3}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              placeholder="Enter any special instructions for processing the scraped content..."
              value={formData.customInstructions}
              onChange={handleInputChange}
            />
            <p className="mt-1 text-sm text-gray-500">
              Use AI-powered instructions to customize how your content is processed and analyzed.
            </p>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Starting Job...
                </>
              ) : (
                <>
                  <Play className="h-4 w-4 mr-2" />
                  Start Scraping
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      {/* Info Section */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
          <div className="text-sm text-blue-800">
            <h3 className="font-medium">How it works</h3>
            <ul className="mt-2 space-y-1">
              <li>• Enter a URL or multiple URLs to scrape</li>
              <li>• Choose output formats (HTML, JSON, CSV, Markdown, Plain Text)</li>
              <li>• Optionally take screenshots at different device sizes</li>
              <li>• Add custom AI instructions for advanced processing</li>
              <li>• Monitor progress in the Jobs section</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Scraper;
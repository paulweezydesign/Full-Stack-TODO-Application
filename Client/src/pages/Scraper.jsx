import React, { useState } from 'react';
import { 
  Globe, 
  Download, 
  Image, 
  Settings, 
  Play,
  FileText,
  ExternalLink,
  CheckCircle,
  XCircle,
  Clock
} from 'lucide-react';
import { useQuery, useMutation } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const Scraper = () => {
  const [activeTab, setActiveTab] = useState('single');
  const [scrapingResults, setScrapingResults] = useState([]);
  const [isScraping, setIsScraping] = useState(false);

  // Single page scraping state
  const [singlePageForm, setSinglePageForm] = useState({
    url: '',
    takeScreenshots: false,
    outputFormats: ['html', 'text', 'markdown'],
    customInstructions: '',
    userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
  });

  // Multiple pages scraping state
  const [multiplePagesForm, setMultiplePagesForm] = useState({
    urls: '',
    takeScreenshots: false,
    outputFormats: ['html', 'text', 'markdown'],
    customInstructions: '',
    maxConcurrent: 3
  });

  // Site scraping state
  const [siteForm, setSiteForm] = useState({
    baseUrl: '',
    maxDepth: 3,
    maxPages: 100,
    sameDomain: true,
    takeScreenshots: false,
    outputFormats: ['html', 'text', 'markdown'],
    customInstructions: ''
  });

  // Get supported export formats
  const { data: exportFormats } = useQuery('exportFormats', async () => {
    const response = await axios.get('/api/export-formats');
    return response.data;
  });

  // Single page scraping mutation
  const singlePageMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/scrape/page', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setScrapingResults([data]);
        toast.success('Page scraped successfully!');
      },
      onError: (error) => {
        toast.error(`Error scraping page: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Multiple pages scraping mutation
  const multiplePagesMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/scrape/multiple', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setScrapingResults(data);
        toast.success(`${data.length} pages scraped successfully!`);
      },
      onError: (error) => {
        toast.error(`Error scraping pages: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Site scraping mutation
  const siteMutation = useMutation(
    async (data) => {
      const response = await axios.post('/api/scrape/site', data);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setScrapingResults(data);
        toast.success(`Site scraped successfully! Found ${data.length} pages.`);
      },
      onError: (error) => {
        toast.error(`Error scraping site: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  const handleSinglePageSubmit = (e) => {
    e.preventDefault();
    if (!singlePageForm.url) {
      toast.error('Please enter a URL');
      return;
    }
    singlePageMutation.mutate(singlePageForm);
  };

  const handleMultiplePagesSubmit = (e) => {
    e.preventDefault();
    if (!multiplePagesForm.urls) {
      toast.error('Please enter URLs');
      return;
    }
    const urls = multiplePagesForm.urls.split('\n').filter(url => url.trim());
    if (urls.length === 0) {
      toast.error('Please enter at least one valid URL');
      return;
    }
    multiplePagesMutation.mutate({ ...multiplePagesForm, urls });
  };

  const handleSiteSubmit = (e) => {
    e.preventDefault();
    if (!siteForm.baseUrl) {
      toast.error('Please enter a base URL');
      return;
    }
    siteMutation.mutate(siteForm);
  };

  const handleExport = async (format) => {
    try {
      const response = await axios.post('/api/scrape/export', {
        data: scrapingResults,
        format,
        filename: `scraped_data_${Date.now()}`
      }, {
        responseType: 'blob'
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `scraped_data_${Date.now()}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      toast.success(`Data exported as ${format.toUpperCase()}`);
    } catch (error) {
      toast.error(`Error exporting data: ${error.message}`);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      case 'scraping':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      default:
        return <Clock className="h-5 w-5 text-gray-500" />;
    }
  };

  const tabs = [
    { id: 'single', name: 'Single Page', icon: Globe },
    { id: 'multiple', name: 'Multiple Pages', icon: FileText },
    { id: 'site', name: 'Entire Site', icon: ExternalLink }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Web Scraper</h1>
        <p className="text-lg text-gray-600 mt-2">
          Scrape web content with advanced options and custom instructions
        </p>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="space-y-6">
        {/* Single Page Scraping */}
        {activeTab === 'single' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Single Page Scraping</h2>
            <form onSubmit={handleSinglePageSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL to Scrape
                </label>
                <input
                  type="url"
                  value={singlePageForm.url}
                  onChange={(e) => setSinglePageForm({ ...singlePageForm, url: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Output Formats
                  </label>
                  <div className="space-y-2">
                    {['html', 'text', 'markdown', 'json', 'csv'].map((format) => (
                      <label key={format} className="flex items-center">
                        <input
                          type="checkbox"
                          checked={singlePageForm.outputFormats.includes(format)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setSinglePageForm({
                                ...singlePageForm,
                                outputFormats: [...singlePageForm.outputFormats, format]
                              });
                            } else {
                              setSinglePageForm({
                                ...singlePageForm,
                                outputFormats: singlePageForm.outputFormats.filter(f => f !== format)
                              });
                            }
                          }}
                          className="mr-2"
                        />
                        {format.toUpperCase()}
                      </label>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={singlePageForm.takeScreenshots}
                        onChange={(e) => setSinglePageForm({ ...singlePageForm, takeScreenshots: e.target.checked })}
                        className="mr-2"
                      />
                      Take Screenshots (Mobile, Tablet, Desktop)
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={singlePageForm.customInstructions}
                  onChange={(e) => setSinglePageForm({ ...singlePageForm, customInstructions: e.target.value })}
                  placeholder="e.g., Extract all table data, focus on product prices, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={singlePageMutation.isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {singlePageMutation.isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Scraping
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Multiple Pages Scraping */}
        {activeTab === 'multiple' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Multiple Pages Scraping</h2>
            <form onSubmit={handleMultiplePagesSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URLs (one per line)
                </label>
                <textarea
                  value={multiplePagesForm.urls}
                  onChange={(e) => setMultiplePagesForm({ ...multiplePagesForm, urls: e.target.value })}
                  placeholder="https://example.com/page1\nhttps://example.com/page2\nhttps://example.com/page3"
                  rows={5}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Concurrent Requests
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={multiplePagesForm.maxConcurrent}
                    onChange={(e) => setMultiplePagesForm({ ...multiplePagesForm, maxConcurrent: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={multiplePagesForm.takeScreenshots}
                        onChange={(e) => setMultiplePagesForm({ ...multiplePagesForm, takeScreenshots: e.target.checked })}
                        className="mr-2"
                      />
                      Take Screenshots
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={multiplePagesForm.customInstructions}
                  onChange={(e) => setMultiplePagesForm({ ...multiplePagesForm, customInstructions: e.target.value })}
                  placeholder="e.g., Extract all table data, focus on product prices, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={multiplePagesMutation.isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {multiplePagesMutation.isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Scraping
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Site Scraping */}
        {activeTab === 'site' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Entire Site Scraping</h2>
            <form onSubmit={handleSiteSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Base URL
                </label>
                <input
                  type="url"
                  value={siteForm.baseUrl}
                  onChange={(e) => setSiteForm({ ...siteForm, baseUrl: e.target.value })}
                  placeholder="https://example.com"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  required
                />
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Depth
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="10"
                    value={siteForm.maxDepth}
                    onChange={(e) => setSiteForm({ ...siteForm, maxDepth: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Max Pages
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="1000"
                    value={siteForm.maxPages}
                    onChange={(e) => setSiteForm({ ...siteForm, maxPages: parseInt(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Options
                  </label>
                  <div className="space-y-2">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={siteForm.sameDomain}
                        onChange={(e) => setSiteForm({ ...siteForm, sameDomain: e.target.checked })}
                        className="mr-2"
                      />
                      Same Domain Only
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={siteForm.takeScreenshots}
                        onChange={(e) => setSiteForm({ ...siteForm, takeScreenshots: e.target.checked })}
                        className="mr-2"
                      />
                      Take Screenshots
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Custom Instructions (Optional)
                </label>
                <textarea
                  value={siteForm.customInstructions}
                  onChange={(e) => setSiteForm({ ...siteForm, customInstructions: e.target.value })}
                  placeholder="e.g., Extract all table data, focus on product prices, etc."
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={siteMutation.isLoading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {siteMutation.isLoading ? (
                  <>
                    <Clock className="mr-2 h-4 w-4 animate-spin" />
                    Scraping...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Start Scraping
                  </>
                )}
              </button>
            </form>
          </div>
        )}
      </div>

      {/* Results Section */}
      {scrapingResults.length > 0 && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Scraping Results</h2>
            <div className="flex space-x-2">
              {exportFormats?.formats.map((format) => (
                <button
                  key={format}
                  onClick={() => handleExport(format)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm flex items-center"
                >
                  <Download className="h-4 w-4 mr-1" />
                  {format.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            {scrapingResults.map((result, index) => (
              <div key={index} className="border border-gray-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(result.status)}
                    <span className="font-medium text-gray-900">
                      {result.title || result.url}
                    </span>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    result.status === 'completed' ? 'bg-green-100 text-green-800' :
                    result.status === 'failed' ? 'bg-red-100 text-red-800' :
                    'bg-yellow-100 text-yellow-800'
                  }`}>
                    {result.status}
                  </span>
                </div>

                {result.url && (
                  <p className="text-sm text-gray-600 mb-2">
                    <a href={result.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                      {result.url}
                    </a>
                  </p>
                )}

                {result.status === 'completed' && (
                  <div className="grid md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Processing Time:</span> {result.metadata?.processingTime || 'N/A'}ms
                    </div>
                    <div>
                      <span className="font-medium">Screenshots:</span> {result.screenshots ? 'Yes' : 'No'}
                    </div>
                  </div>
                )}

                {result.error && (
                  <p className="text-sm text-red-600 mt-2">
                    Error: {result.error}
                  </p>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Scraper;
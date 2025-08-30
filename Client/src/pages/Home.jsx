import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Database, 
  MessageCircle, 
  FolderOpen, 
  Download,
  Search,
  Zap,
  Shield,
  BarChart3,
  FileText,
  Image,
  Code
} from 'lucide-react';

const Home = () => {
  const features = [
    {
      icon: Globe,
      title: 'Web Scraping',
      description: 'Scrape single pages, multiple pages, or entire websites with advanced options and custom instructions.',
      link: '/scraper',
      color: 'bg-blue-500'
    },
    {
      icon: Database,
      title: 'Knowledge Base',
      description: 'Store, search, and manage all your scraped content and uploaded files in one centralized location.',
      link: '/knowledge',
      color: 'bg-green-500'
    },
    {
      icon: MessageCircle,
      title: 'AI Chat Interface',
      description: 'Interact with your knowledge base using AI-powered chat with customizable models and MCP servers.',
      link: '/chat',
      color: 'bg-purple-500'
    },
    {
      icon: FolderOpen,
      title: 'File Management',
      description: 'Upload and process various file types including documents, images, code files, and more.',
      link: '/files',
      color: 'bg-orange-500'
    }
  ];

  const capabilities = [
    {
      icon: Download,
      title: 'Multiple Export Formats',
      description: 'Export data in HTML, JSON, CSV, Markdown, or plain text formats'
    },
    {
      icon: Image,
      title: 'Screenshot Capture',
      description: 'Take screenshots at mobile, tablet, and desktop resolutions'
    },
    {
      icon: Search,
      title: 'Advanced Search',
      description: 'Powerful search capabilities across all your stored content'
    },
    {
      icon: Zap,
      title: 'Custom Instructions',
      description: 'Use natural language to specify exactly what you want to extract'
    },
    {
      icon: Shield,
      title: 'Secure Storage',
      description: 'All data is securely stored in MongoDB with local backup options'
    },
    {
      icon: BarChart3,
      title: 'Analytics & Insights',
      description: 'Get detailed statistics and insights about your knowledge base'
    },
    {
      icon: FileText,
      title: 'Multi-Format Support',
      description: 'Support for HTML, CSS, JS, CSV, Word, Excel, PDF, and more'
    },
    {
      icon: Code,
      title: 'Code Processing',
      description: 'Process and analyze code files in various programming languages'
    }
  ];

  return (
    <div className="space-y-16">
      {/* Hero Section */}
      <div className="text-center space-y-8">
        <div className="space-y-4">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900">
            Professional
            <span className="text-blue-600"> Web Scraping</span>
            <br />
            Made Simple
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            A comprehensive web scraping solution with AI-powered knowledge management, 
            advanced file processing, and intelligent chat interface.
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/scraper"
            className="inline-flex items-center px-8 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 transition-colors duration-200"
          >
            <Globe className="mr-2 h-5 w-5" />
            Start Scraping
          </Link>
          <Link
            to="/knowledge"
            className="inline-flex items-center px-8 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 transition-colors duration-200"
          >
            <Database className="mr-2 h-5 w-5" />
            Explore Knowledge Base
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Core Features</h2>
          <p className="text-lg text-gray-600 mt-2">
            Everything you need for professional web scraping and content management
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Link
                key={index}
                to={feature.link}
                className="group block p-8 bg-white rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`inline-flex p-3 rounded-lg ${feature.color} text-white mb-4`}>
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2 group-hover:text-blue-600 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-gray-600 leading-relaxed">
                  {feature.description}
                </p>
                <div className="mt-4 text-blue-600 font-medium group-hover:text-blue-700 transition-colors">
                  Learn more →
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Capabilities Section */}
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-3xl font-bold text-gray-900">Advanced Capabilities</h2>
          <p className="text-lg text-gray-600 mt-2">
            Powerful tools and features for professional use
          </p>
        </div>
        
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {capabilities.map((capability, index) => {
            const Icon = capability.icon;
            return (
              <div
                key={index}
                className="text-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200"
              >
                <div className="inline-flex p-3 rounded-lg bg-gray-100 text-gray-700 mb-4">
                  <Icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {capability.title}
                </h3>
                <p className="text-sm text-gray-600 leading-relaxed">
                  {capability.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">
          Ready to Get Started?
        </h2>
        <p className="text-xl mb-8 opacity-90">
          Begin scraping websites, building your knowledge base, and leveraging AI-powered insights today.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            to="/scraper"
            className="inline-flex items-center px-8 py-3 border-2 border-white text-base font-medium rounded-md text-white hover:bg-white hover:text-blue-600 transition-all duration-200"
          >
            <Globe className="mr-2 h-5 w-5" />
            Start Scraping
          </Link>
          <Link
            to="/chat"
            className="inline-flex items-center px-8 py-3 bg-white text-base font-medium rounded-md text-blue-600 hover:bg-gray-100 transition-colors duration-200"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            Try AI Chat
          </Link>
        </div>
      </div>

      {/* Stats Section */}
      <div className="grid md:grid-cols-3 gap-8">
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-3xl font-bold text-blue-600 mb-2">100+</div>
          <div className="text-gray-600">File Formats Supported</div>
        </div>
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-3xl font-bold text-green-600 mb-2">5</div>
          <div className="text-gray-600">Export Formats</div>
        </div>
        <div className="text-center p-8 bg-white rounded-xl shadow-lg">
          <div className="text-3xl font-bold text-purple-600 mb-2">AI-Powered</div>
          <div className="text-gray-600">Intelligent Processing</div>
        </div>
      </div>
    </div>
  );
};

export default Home;
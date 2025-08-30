import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Globe, 
  Database, 
  MessageCircle, 
  Clock, 
  TrendingUp,
  FileText,
  Image,
  Code,
  BarChart3
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/stats');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const quickActions = [
    {
      title: 'Start Scraping',
      description: 'Begin a new web scraping job',
      icon: Globe,
      path: '/scraper',
      color: 'bg-blue-500 hover:bg-blue-600'
    },
    {
      title: 'Upload Files',
      description: 'Add documents to knowledge base',
      icon: Database,
      path: '/knowledge',
      color: 'bg-green-500 hover:bg-green-600'
    },
    {
      title: 'Start Chat',
      description: 'Interact with AI assistant',
      icon: MessageCircle,
      path: '/chat',
      color: 'bg-purple-500 hover:bg-purple-600'
    },
    {
      title: 'View Jobs',
      description: 'Monitor scraping progress',
      icon: Clock,
      path: '/jobs',
      color: 'bg-orange-500 hover:bg-orange-600'
    }
  ];

  const statCards = [
    {
      title: 'Total Documents',
      value: stats?.documents?.total || 0,
      icon: FileText,
      color: 'text-blue-600',
      bgColor: 'bg-blue-100'
    },
    {
      title: 'Scraping Jobs',
      value: stats?.jobs?.total || 0,
      icon: Globe,
      color: 'text-green-600',
      bgColor: 'bg-green-100'
    },
    {
      title: 'Chat Sessions',
      value: stats?.chats?.total || 0,
      icon: MessageCircle,
      color: 'text-purple-600',
      bgColor: 'bg-purple-100'
    },
    {
      title: 'Database Size',
      value: stats?.database?.dataSize ? `${(stats.database.dataSize / 1024 / 1024).toFixed(2)} MB` : '0 MB',
      icon: Database,
      color: 'text-orange-600',
      bgColor: 'bg-orange-100'
    }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to WebScraper Pro</h1>
        <p className="text-gray-600">Your comprehensive web scraping and knowledge management solution</p>
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {quickActions.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                to={action.path}
                className={`${action.color} text-white p-6 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 transform hover:-translate-y-1`}
              >
                <div className="flex items-center space-x-3">
                  <Icon className="h-8 w-8" />
                  <div>
                    <h3 className="font-semibold text-lg">{action.title}</h3>
                    <p className="text-blue-100 text-sm">{action.description}</p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Statistics */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Overview Statistics</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map((stat) => {
            const Icon = stat.icon;
            return (
              <div key={stat.title} className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{stat.title}</p>
                    <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
                  </div>
                  <div className={`${stat.bgColor} p-3 rounded-full`}>
                    <Icon className={`h-6 w-6 ${stat.color}`} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Activity */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Activity</h2>
        <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
          <div className="space-y-4">
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              <span>System is running and ready for scraping jobs</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              <span>Database connection established</span>
            </div>
            <div className="flex items-center space-x-3 text-sm text-gray-600">
              <div className="w-2 h-2 bg-purple-500 rounded-full"></div>
              <span>AI services initialized</span>
            </div>
          </div>
        </div>
      </div>

      {/* Features Overview */}
      <div>
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Globe className="h-6 w-6 text-blue-600" />
              <h3 className="font-semibold text-gray-900">Web Scraping</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Scrape single pages, multiple URLs, or entire websites with customizable options and screenshots.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <Database className="h-6 w-6 text-green-600" />
              <h3 className="font-semibold text-gray-900">Knowledge Base</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Store and manage scraped content, uploaded files, and build a comprehensive knowledge repository.
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-md border border-gray-200">
            <div className="flex items-center space-x-3 mb-3">
              <MessageCircle className="h-6 w-6 text-purple-600" />
              <h3 className="font-semibold text-gray-900">AI Chat</h3>
            </div>
            <p className="text-gray-600 text-sm">
              Interact with your knowledge base using AI-powered chat with customizable models and MCP servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
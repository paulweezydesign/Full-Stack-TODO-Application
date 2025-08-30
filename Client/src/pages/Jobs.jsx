import React, { useState, useEffect } from 'react';
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  Play, 
  AlertCircle,
  Download,
  Eye,
  Trash2,
  RefreshCw,
  Filter,
  Search
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Jobs = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selectedJob, setSelectedJob] = useState(null);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    fetchJobs();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchJobs, 5000);
    return () => clearInterval(interval);
  }, [currentPage, filterStatus, searchQuery]);

  const fetchJobs = async () => {
    try {
      const params = new URLSearchParams({
        page: currentPage,
        limit: 20,
        ...(filterStatus && { status: filterStatus }),
        ...(searchQuery && { search: searchQuery })
      });

      const response = await axios.get(`http://localhost:5000/api/scrape?${params}`);
      setJobs(response.data.jobs);
      setTotalPages(response.data.pagination.pages);
    } catch (error) {
      console.error('Error fetching jobs:', error);
      toast.error('Failed to load jobs');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'running':
        return <Play className="h-5 w-5 text-blue-500 animate-pulse" />;
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'running':
        return 'bg-blue-100 text-blue-800';
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  const formatDuration = (milliseconds) => {
    if (!milliseconds) return 'N/A';
    const seconds = Math.floor(milliseconds / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    setCurrentPage(1);
    fetchJobs();
  };

  const handleFilterChange = () => {
    setCurrentPage(1);
    fetchJobs();
  };

  const viewJobDetails = (job) => {
    setSelectedJob(job);
    setShowDetails(true);
  };

  const deleteJob = async (jobId) => {
    try {
      await axios.delete(`http://localhost:5000/api/scrape/${jobId}`);
      toast.success('Job deleted successfully');
      fetchJobs();
    } catch (error) {
      console.error('Error deleting job:', error);
      toast.error('Failed to delete job');
    }
  };

  const retryJob = async (job) => {
    try {
      // Reset job status and restart
      const updatedJob = { ...job, status: 'pending' };
      await axios.put(`http://localhost:5000/api/scrape/${job.jobId}`, updatedJob);
      toast.success('Job restarted');
      fetchJobs();
    } catch (error) {
      console.error('Error restarting job:', error);
      toast.error('Failed to restart job');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Scraping Jobs</h1>
        <p className="text-gray-600">Monitor and manage your web scraping jobs</p>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6">
        <div className="flex flex-col md:flex-row gap-4">
          {/* Search */}
          <div className="flex-1">
            <form onSubmit={handleSearch} className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search jobs by URL or job ID..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </form>
          </div>

          {/* Filters */}
          <div className="flex gap-4">
            <select
              value={filterStatus}
              onChange={(e) => {
                setFilterStatus(e.target.value);
                handleFilterChange();
              }}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Statuses</option>
              <option value="pending">Pending</option>
              <option value="running">Running</option>
              <option value="completed">Completed</option>
              <option value="failed">Failed</option>
            </select>

            <button
              onClick={fetchJobs}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="bg-white rounded-lg shadow-md border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Recent Jobs</h2>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-32">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : jobs.length === 0 ? (
          <div className="text-center py-12">
            <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No jobs found</p>
            <p className="text-sm text-gray-500">Start a scraping job to see it here</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {jobs.map((job) => (
              <div key={job.jobId} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(job.status)}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center space-x-2">
                        <h3 className="text-sm font-medium text-gray-900 truncate">
                          {job.url}
                        </h3>
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(job.status)}`}>
                          {job.status}
                        </span>
                      </div>
                      <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                        <span>Type: {job.jobType}</span>
                        <span>•</span>
                        <span>Created: {formatDate(job.createdAt)}</span>
                        {job.metadata?.startedAt && (
                          <>
                            <span>•</span>
                            <span>Started: {formatDate(job.metadata.startedAt)}</span>
                          </>
                        )}
                        {job.metadata?.totalTime && (
                          <>
                            <span>•</span>
                            <span>Duration: {formatDuration(job.metadata.totalTime)}</span>
                          </>
                        )}
                      </div>
                      {job.results && (
                        <div className="flex items-center space-x-4 text-sm text-gray-500 mt-1">
                          <span>Pages: {job.results.pagesScraped || 0}</span>
                          <span>•</span>
                          <span>Screenshots: {job.results.screenshotsTaken || 0}</span>
                          <span>•</span>
                          <span>Files: {job.results.filesGenerated?.length || 0}</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => viewJobDetails(job)}
                      className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-md"
                      title="View Details"
                    >
                      <Eye className="h-4 w-4" />
                    </button>
                    
                    {job.status === 'failed' && (
                      <button
                        onClick={() => retryJob(job)}
                        className="p-2 text-blue-400 hover:text-blue-600 hover:bg-blue-50 rounded-md"
                        title="Retry Job"
                      >
                        <RefreshCw className="h-4 w-4" />
                      </button>
                    )}
                    
                    {job.status === 'completed' && job.results?.filesGenerated?.length > 0 && (
                      <button
                        onClick={() => {/* Handle download */}}
                        className="p-2 text-green-400 hover:text-green-600 hover:bg-green-50 rounded-md"
                        title="Download Results"
                      >
                        <Download className="h-4 w-4" />
                      </button>
                    )}
                    
                    <button
                      onClick={() => deleteJob(job.jobId)}
                      className="p-2 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-md"
                      title="Delete Job"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="px-6 py-4 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="text-sm text-gray-700">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                  disabled={currentPage === 1}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Previous
                </button>
                <button
                  onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                  disabled={currentPage === totalPages}
                  className="px-3 py-1 border border-gray-300 rounded-md text-sm disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50"
                >
                  Next
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Job Details Modal */}
      {showDetails && selectedJob && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-96 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Job Details</h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job ID</label>
                  <p className="text-sm text-gray-900 font-mono">{selectedJob.jobId}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Status</label>
                  <div className="flex items-center space-x-2">
                    {getStatusIcon(selectedJob.status)}
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(selectedJob.status)}`}>
                      {selectedJob.status}
                    </span>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">URL</label>
                  <p className="text-sm text-gray-900 break-all">{selectedJob.url}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Job Type</label>
                  <p className="text-sm text-gray-900 capitalize">{selectedJob.jobType}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Created</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.createdAt)}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Updated</label>
                  <p className="text-sm text-gray-900">{formatDate(selectedJob.updatedAt)}</p>
                </div>
              </div>

              {/* Options */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Options</label>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium">Screenshots:</span> {selectedJob.options.takeScreenshots ? 'Yes' : 'No'}
                    </div>
                    <div>
                      <span className="font-medium">Output Formats:</span> {selectedJob.options.outputFormats?.join(', ')}
                    </div>
                    <div>
                      <span className="font-medium">Max Pages:</span> {selectedJob.options.maxPages}
                    </div>
                    <div>
                      <span className="font-medium">Delay:</span> {selectedJob.options.delay}ms
                    </div>
                    {selectedJob.options.customInstructions && (
                      <div className="col-span-2">
                        <span className="font-medium">Custom Instructions:</span>
                        <p className="text-gray-600 mt-1">{selectedJob.options.customInstructions}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Results */}
              {selectedJob.results && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Results</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="font-medium">Pages Scraped:</span> {selectedJob.results.pagesScraped || 0}
                      </div>
                      <div>
                        <span className="font-medium">Screenshots Taken:</span> {selectedJob.results.screenshotsTaken || 0}
                      </div>
                      <div>
                        <span className="font-medium">Files Generated:</span> {selectedJob.results.filesGenerated?.length || 0}
                      </div>
                      <div>
                        <span className="font-medium">Errors:</span> {selectedJob.results.errors?.length || 0}
                      </div>
                    </div>
                    
                    {selectedJob.results.filesGenerated?.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium">Generated Files:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedJob.results.filesGenerated.map((file, index) => (
                            <li key={index} className="text-sm text-gray-600 font-mono">
                              {file}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                    
                    {selectedJob.results.errors?.length > 0 && (
                      <div className="mt-3">
                        <span className="font-medium text-red-600">Errors:</span>
                        <ul className="mt-1 space-y-1">
                          {selectedJob.results.errors.map((error, index) => (
                            <li key={index} className="text-sm text-red-600">
                              {error}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedJob.metadata && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Metadata</label>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      {selectedJob.metadata.startedAt && (
                        <div>
                          <span className="font-medium">Started:</span> {formatDate(selectedJob.metadata.startedAt)}
                        </div>
                      )}
                      {selectedJob.metadata.completedAt && (
                        <div>
                          <span className="font-medium">Completed:</span> {formatDate(selectedJob.metadata.completedAt)}
                        </div>
                      )}
                      {selectedJob.metadata.totalTime && (
                        <div>
                          <span className="font-medium">Total Time:</span> {formatDuration(selectedJob.metadata.totalTime)}
                        </div>
                      )}
                      {selectedJob.metadata.userAgent && (
                        <div className="col-span-2">
                          <span className="font-medium">User Agent:</span>
                          <p className="text-gray-600 mt-1 font-mono text-xs break-all">{selectedJob.metadata.userAgent}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Jobs;
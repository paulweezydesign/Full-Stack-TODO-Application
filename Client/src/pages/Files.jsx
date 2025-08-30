import React, { useState } from 'react';
import { 
  Upload, 
  FileText, 
  Image, 
  Code, 
  Download, 
  Trash2, 
  Eye, 
  Search,
  Filter,
  Plus,
  FolderOpen,
  Info
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import { useDropzone } from 'react-dropzone';
import axios from 'axios';
import toast from 'react-hot-toast';

const Files = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFileType, setSelectedFileType] = useState('all');
  const [uploadingFiles, setUploadingFiles] = useState([]);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({
    tags: '',
    notes: ''
  });
  const queryClient = useQueryClient();

  // Get uploaded files
  const { data: filesData, isLoading: filesLoading } = useQuery(['files', selectedFileType, searchQuery], async () => {
    const response = await axios.get('/api/files', {
      params: { 
        fileType: selectedFileType !== 'all' ? selectedFileType : undefined,
        search: searchQuery || undefined,
        limit: 100
      }
    });
    return response.data;
  });

  // Get supported file types
  const { data: supportedTypes } = useQuery('supportedTypes', async () => {
    const response = await axios.get('/api/supported-types');
    return response.data;
  });

  // Upload file mutation
  const uploadMutation = useMutation(
    async (fileData) => {
      const formData = new FormData();
      formData.append('file', fileData.file);
      formData.append('tags', fileData.tags);
      formData.append('notes', fileData.notes);
      
      const response = await axios.post('/api/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        onUploadProgress: (progressEvent) => {
          const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          setUploadingFiles(prev => 
            prev.map(f => 
              f.id === fileData.id 
                ? { ...f, progress: percentCompleted }
                : f
            )
          );
        }
      });
      return response.data;
    },
    {
      onSuccess: (data, variables) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== variables.id));
        queryClient.invalidateQueries('files');
        toast.success(`File ${data.file.originalName} uploaded successfully!`);
      },
      onError: (error, variables) => {
        setUploadingFiles(prev => prev.filter(f => f.id !== variables.id));
        toast.error(`Failed to upload ${variables.file.name}: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Delete file mutation
  const deleteFileMutation = useMutation(
    async (fileId) => {
      await axios.delete(`/api/files/${fileId}`);
    },
    {
      onSuccess: () => {
        queryClient.invalidateQueries('files');
        toast.success('File deleted successfully');
      },
      onError: (error) => {
        toast.error(`Failed to delete file: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  const onDrop = (acceptedFiles) => {
    const newFiles = acceptedFiles.map(file => ({
      id: Date.now() + Math.random(),
      file,
      progress: 0,
      status: 'pending'
    }));
    
    setUploadingFiles(prev => [...prev, ...newFiles]);
    
    // Start uploading each file
    newFiles.forEach(fileData => {
      uploadMutation.mutate({
        ...fileData,
        tags: uploadForm.tags,
        notes: uploadForm.notes
      });
    });
  };

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      // Documents
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document': ['.docx'],
      'application/msword': ['.doc'],
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx'],
      'application/vnd.ms-excel': ['.xls'],
      'application/pdf': ['.pdf'],
      
      // Text files
      'text/plain': ['.txt'],
      'text/markdown': ['.md'],
      'text/html': ['.html', '.htm'],
      'text/css': ['.css'],
      'text/javascript': ['.js'],
      'application/javascript': ['.js'],
      
      // Data files
      'text/csv': ['.csv'],
      'application/json': ['.json'],
      
      // Images
      'image/jpeg': ['.jpg', '.jpeg'],
      'image/png': ['.png'],
      'image/webp': ['.webp'],
      'image/gif': ['.gif'],
      
      // Code files
      'text/x-python': ['.py'],
      'text/x-rust': ['.rs'],
      'text/x-sql': ['.sql'],
      'text/x-c': ['.c'],
      'text/x-c++': ['.cpp', '.cc'],
      'text/x-java': ['.java'],
      'text/x-php': ['.php'],
      'text/x-ruby': ['.rb'],
      'text/x-go': ['.go']
    },
    maxSize: 50 * 1024 * 1024, // 50MB
    multiple: true
  });

  const handleDeleteFile = (fileId) => {
    if (window.confirm('Are you sure you want to delete this file?')) {
      deleteFileMutation.mutate(fileId);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString();
  };

  const getFileTypeIcon = (fileType) => {
    switch (fileType) {
      case 'html':
      case 'css':
      case 'js':
        return <FileText className="h-5 w-5 text-blue-500" />;
      case 'image':
        return <Image className="h-5 w-5 text-green-500" />;
      case 'pdf':
        return <FileText className="h-5 w-5 text-red-500" />;
      case 'word':
      case 'excel':
        return <FileText className="h-5 w-5 text-purple-500" />;
      case 'code':
        return <Code className="h-5 w-5 text-orange-500" />;
      default:
        return <FileText className="h-5 w-5 text-gray-500" />;
    }
  };

  const getFileTypeColor = (fileType) => {
    switch (fileType) {
      case 'html':
      case 'css':
      case 'js':
        return 'bg-blue-100 text-blue-800';
      case 'image':
        return 'bg-green-100 text-green-800';
      case 'pdf':
        return 'bg-red-100 text-red-800';
      case 'word':
      case 'excel':
        return 'bg-purple-100 text-purple-800';
      case 'code':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">File Management</h1>
        <p className="text-lg text-gray-600 mt-2">
          Upload, process, and manage various file types
        </p>
      </div>

      {/* Upload Section */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-900">Upload Files</h2>
          <button
            onClick={() => setShowUploadModal(!showUploadModal)}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
          >
            <Plus className="h-4 w-4 mr-2" />
            Upload Options
          </button>
        </div>

        {/* Upload Modal */}
        {showUploadModal && (
          <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
            <div className="grid md:grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={uploadForm.tags}
                  onChange={(e) => setUploadForm({ ...uploadForm, tags: e.target.value })}
                  placeholder="web, document, code"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
                <input
                  type="text"
                  value={uploadForm.notes}
                  onChange={(e) => setUploadForm({ ...uploadForm, notes: e.target.value })}
                  placeholder="Optional notes about the file"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
          </div>
        )}

        {/* Dropzone */}
        <div
          {...getRootProps()}
          className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
            isDragActive
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400 hover:bg-gray-50'
          }`}
        >
          <input {...getInputProps()} />
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          {isDragActive ? (
            <p className="text-lg text-blue-600">Drop the files here...</p>
          ) : (
            <div>
              <p className="text-lg text-gray-600 mb-2">
                Drag & drop files here, or click to select files
              </p>
              <p className="text-sm text-gray-500">
                Supports various file types including documents, images, code files, and more
              </p>
            </div>
          )}
        </div>

        {/* Upload Progress */}
        {uploadingFiles.length > 0 && (
          <div className="mt-4 space-y-2">
            <h3 className="font-medium text-gray-900">Uploading Files</h3>
            {uploadingFiles.map((file) => (
              <div key={file.id} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                <FileText className="h-5 w-5 text-gray-500" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">{file.file.name}</p>
                  <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${file.progress}%` }}
                    ></div>
                  </div>
                </div>
                <span className="text-sm text-gray-500">{file.progress}%</span>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Search and Filter */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search files by name, content, or tags..."
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <Filter className="h-4 w-4 text-gray-400" />
            <select
              value={selectedFileType}
              onChange={(e) => setSelectedFileType(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="all">All Types</option>
              <option value="html">HTML</option>
              <option value="css">CSS</option>
              <option value="js">JavaScript</option>
              <option value="pdf">PDF</option>
              <option value="word">Word</option>
              <option value="excel">Excel</option>
              <option value="image">Image</option>
              <option value="code">Code</option>
              <option value="text">Text</option>
              <option value="markdown">Markdown</option>
              <option value="csv">CSV</option>
              <option value="json">JSON</option>
            </select>
          </div>
        </div>
      </div>

      {/* Files List */}
      <div className="bg-white rounded-lg shadow-md">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-900">Uploaded Files</h2>
            <div className="text-sm text-gray-500">
              {filesLoading ? 'Loading...' : `${filesData?.files?.length || 0} files`}
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          {filesLoading ? (
            <div className="p-6 text-center text-gray-500">Loading files...</div>
          ) : filesData?.files?.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
              <FolderOpen className="h-16 w-16 mx-auto mb-4 text-gray-300" />
              <h3 className="text-lg font-medium mb-2">No files found</h3>
              <p>Upload some files to get started</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    File
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Size
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Uploaded
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Tags
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filesData?.files?.map((file) => (
                  <tr key={file._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        {getFileTypeIcon(file.fileType)}
                        <div className="ml-3">
                          <div className="text-sm font-medium text-gray-900">{file.originalName}</div>
                          <div className="text-sm text-gray-500">{file.filename}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getFileTypeColor(file.fileType)}`}>
                        {file.fileType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatFileSize(file.size)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(file.uploadedAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                        file.processingStatus === 'completed' ? 'bg-green-100 text-green-800' :
                        file.processingStatus === 'failed' ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'
                      }`}>
                        {file.processingStatus}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex flex-wrap gap-1">
                        {file.tags?.slice(0, 3).map((tag, index) => (
                          <span key={index} className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {tag}
                          </span>
                        ))}
                        {file.tags?.length > 3 && (
                          <span className="text-xs text-gray-500">+{file.tags.length - 3}</span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <div className="flex space-x-2">
                        <button className="text-blue-600 hover:text-blue-900" title="View">
                          <Eye className="h-4 w-4" />
                        </button>
                        <button className="text-green-600 hover:text-green-900" title="Download">
                          <Download className="h-4 w-4" />
                        </button>
                        <button 
                          onClick={() => handleDeleteFile(file._id)}
                          className="text-red-600 hover:text-red-900"
                          title="Delete"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Supported File Types Info */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Supported File Types</h2>
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {supportedTypes?.fileTypes?.map((type) => (
            <div key={type} className="flex items-center space-x-2 p-2 bg-gray-50 rounded-lg">
              <Info className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-700">{type}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Files;
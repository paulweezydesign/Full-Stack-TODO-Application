import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Settings, 
  Send, 
  Plus, 
  Trash2, 
  Save,
  Loader,
  Bot,
  User,
  Server,
  Key,
  Globe,
  Zap
} from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import axios from 'axios';
import toast from 'react-hot-toast';

const Chat = () => {
  const [activeSession, setActiveSession] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isConfiguring, setIsConfiguring] = useState(false);
  const [llmConfig, setLlmConfig] = useState({
    baseUrl: '',
    apiKey: '',
    model: 'gpt-4',
    temperature: 0.7,
    maxTokens: 2000
  });
  const [mcpServers, setMcpServers] = useState([]);
  const [newMcpServer, setNewMcpServer] = useState({
    name: '',
    url: '',
    description: ''
  });
  const messagesEndRef = useRef(null);
  const queryClient = useQueryClient();

  // Get chat sessions
  const { data: sessionsData, isLoading: sessionsLoading } = useQuery('chatSessions', async () => {
    const response = await axios.get('/api/chat/sessions');
    return response.data;
  });

  // Initialize LLM service
  const initLlmMutation = useMutation(
    async (config) => {
      const response = await axios.post('/api/chat/init', config);
      return response.data;
    },
    {
      onSuccess: (data) => {
        toast.success('LLM service initialized successfully!');
        setIsConfiguring(false);
      },
      onError: (error) => {
        toast.error(`Failed to initialize LLM: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Create new chat session
  const createSessionMutation = useMutation(
    async (sessionData) => {
      const response = await axios.post('/api/chat/sessions', sessionData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setSessions([data, ...sessions]);
        setActiveSession(data);
        toast.success('New chat session created!');
      },
      onError: (error) => {
        toast.error(`Failed to create session: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Send message
  const sendMessageMutation = useMutation(
    async (messageData) => {
      const response = await axios.post(`/api/chat/sessions/${activeSession.sessionId}/messages`, messageData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setMessages(prev => [...prev, data]);
        setInputMessage('');
        toast.success('Message sent successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to send message: ${error.response?.data?.error || error.message}`);
      }
    }
  });

  // Update session settings
  const updateSettingsMutation = useMutation(
    async (settingsData) => {
      const response = await axios.put(`/api/chat/sessions/${activeSession.sessionId}/settings`, settingsData);
      return response.data;
    },
    {
      onSuccess: (data) => {
        setActiveSession(data);
        toast.success('Settings updated successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to update settings: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  // Delete session
  const deleteSessionMutation = useMutation(
    async (sessionId) => {
      await axios.delete(`/api/chat/sessions/${sessionId}`);
    },
    {
      onSuccess: () => {
        setSessions(prev => prev.filter(s => s.sessionId !== activeSession.sessionId));
        if (activeSession && activeSession.sessionId === activeSession.sessionId) {
          setActiveSession(null);
          setMessages([]);
        }
        toast.success('Session deleted successfully!');
      },
      onError: (error) => {
        toast.error(`Failed to delete session: ${error.response?.data?.error || error.message}`);
      }
    }
  );

  useEffect(() => {
    if (sessionsData) {
      setSessions(sessionsData);
      if (sessionsData.length > 0 && !activeSession) {
        setActiveSession(sessionsData[0]);
      }
    }
  }, [sessionsData]);

  useEffect(() => {
    if (activeSession) {
      setMessages(activeSession.messages || []);
    }
  }, [activeSession]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleCreateSession = () => {
    const title = prompt('Enter session title:') || 'New Chat';
    createSessionMutation.mutate({
      title,
      settings: llmConfig,
      mcpServers
    });
  };

  const handleSendMessage = (e) => {
    e.preventDefault();
    if (!inputMessage.trim() || !activeSession) return;

    const userMessage = {
      role: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessageMutation.mutate({
      content: inputMessage,
      includeContext: true
    });
  };

  const handleInitLlm = () => {
    if (!llmConfig.baseUrl || !llmConfig.apiKey) {
      toast.error('Please provide both base URL and API key');
      return;
    }
    initLlmMutation.mutate(llmConfig);
  };

  const handleAddMcpServer = () => {
    if (!newMcpServer.name || !newMcpServer.url) {
      toast.error('Please provide both name and URL');
      return;
    }
    setMcpServers(prev => [...prev, { ...newMcpServer, id: Date.now() }]);
    setNewMcpServer({ name: '', url: '', description: '' });
    toast.success('MCP server added!');
  };

  const handleRemoveMcpServer = (id) => {
    setMcpServers(prev => prev.filter(server => server.id !== id));
    toast.success('MCP server removed!');
  };

  const handleSaveSettings = () => {
    if (!activeSession) return;
    
    updateSettingsMutation.mutate({
      settings: llmConfig,
      mcpServers
    });
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleTimeString();
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-900">AI Chat Interface</h1>
          <div className="flex space-x-2">
            <button
              onClick={() => setIsConfiguring(!isConfiguring)}
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors flex items-center"
            >
              <Settings className="h-4 w-4 mr-2" />
              Configure
            </button>
            <button
              onClick={handleCreateSession}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center"
            >
              <Plus className="h-4 w-4 mr-2" />
              New Chat
            </button>
          </div>
        </div>
      </div>

      <div className="flex-1 flex">
        {/* Sidebar */}
        <div className="w-80 bg-gray-50 border-r border-gray-200 p-4">
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
            
            {sessionsLoading ? (
              <div className="text-center text-gray-500">Loading sessions...</div>
            ) : (
              <div className="space-y-2">
                {sessions.map((session) => (
                  <div
                    key={session.sessionId}
                    onClick={() => setActiveSession(session)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors ${
                      activeSession?.sessionId === session.sessionId
                        ? 'bg-blue-100 text-blue-900'
                        : 'bg-white hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-medium truncate">{session.title}</h3>
                        <p className="text-sm text-gray-500 truncate">
                          {session.messages?.length || 0} messages
                        </p>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveMcpServer(session.sessionId);
                        }}
                        className="text-red-500 hover:text-red-700 ml-2"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Configuration Panel */}
          {isConfiguring && (
            <div className="bg-white border-b border-gray-200 p-4">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">LLM Configuration</h3>
              
              <div className="grid md:grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                  <input
                    type="url"
                    value={llmConfig.baseUrl}
                    onChange={(e) => setLlmConfig({ ...llmConfig, baseUrl: e.target.value })}
                    placeholder="https://api.openai.com/v1"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                  <input
                    type="password"
                    value={llmConfig.apiKey}
                    onChange={(e) => setLlmConfig({ ...llmConfig, apiKey: e.target.value })}
                    placeholder="sk-..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                  <input
                    type="text"
                    value={llmConfig.model}
                    onChange={(e) => setLlmConfig({ ...llmConfig, model: e.target.value })}
                    placeholder="gpt-4"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                  <input
                    type="number"
                    min="0"
                    max="2"
                    step="0.1"
                    value={llmConfig.temperature}
                    onChange={(e) => setLlmConfig({ ...llmConfig, temperature: parseFloat(e.target.value) })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex space-x-2">
                <button
                  onClick={handleInitLlm}
                  disabled={initLlmMutation.isLoading}
                  className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 flex items-center"
                >
                  {initLlmMutation.isLoading ? (
                    <Loader className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Initialize LLM
                </button>
                
                <button
                  onClick={handleSaveSettings}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                >
                  <Save className="h-4 w-4 mr-2" />
                  Save Settings
                </button>
              </div>

              {/* MCP Servers */}
              <div className="mt-6">
                <h4 className="text-md font-semibold text-gray-900 mb-3">MCP Servers</h4>
                
                <div className="grid md:grid-cols-3 gap-4 mb-4">
                  <input
                    type="text"
                    value={newMcpServer.name}
                    onChange={(e) => setNewMcpServer({ ...newMcpServer, name: e.target.value })}
                    placeholder="Server Name"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <input
                    type="url"
                    value={newMcpServer.url}
                    onChange={(e) => setNewMcpServer({ ...newMcpServer, url: e.target.value })}
                    placeholder="Server URL"
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  
                  <button
                    onClick={handleAddMcpServer}
                    className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 flex items-center justify-center"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Server
                  </button>
                </div>

                <div className="space-y-2">
                  {mcpServers.map((server) => (
                    <div key={server.id} className="flex items-center justify-between p-3 bg-gray-100 rounded-lg">
                      <div>
                        <div className="font-medium">{server.name}</div>
                        <div className="text-sm text-gray-600">{server.url}</div>
                      </div>
                      <button
                        onClick={() => handleRemoveMcpServer(server.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Chat Messages */}
          <div className="flex-1 flex flex-col">
            {activeSession ? (
              <>
                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map((message, index) => (
                    <div
                      key={index}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          message.role === 'user'
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-900'
                        }`}
                      >
                        <div className="flex items-center mb-2">
                          {message.role === 'user' ? (
                            <User className="h-4 w-4 mr-2" />
                          ) : (
                            <Bot className="h-4 w-4 mr-2" />
                          )}
                          <span className="text-sm font-medium">
                            {message.role === 'user' ? 'You' : 'AI Assistant'}
                          </span>
                          <span className="text-xs opacity-75 ml-auto">
                            {formatTimestamp(message.timestamp)}
                          </span>
                        </div>
                        <div className="whitespace-pre-wrap">{message.content}</div>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <div className="border-t border-gray-200 p-4">
                  <form onSubmit={handleSendMessage} className="flex space-x-2">
                    <input
                      type="text"
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      placeholder="Type your message..."
                      className="flex-1 px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      disabled={sendMessageMutation.isLoading}
                    />
                    <button
                      type="submit"
                      disabled={sendMessageMutation.isLoading || !inputMessage.trim()}
                      className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                    >
                      {sendMessageMutation.isLoading ? (
                        <Loader className="h-4 w-4 animate-spin" />
                      ) : (
                        <Send className="h-4 w-4" />
                      )}
                    </button>
                  </form>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <MessageCircle className="h-16 w-16 mx-auto mb-4 text-gray-300" />
                  <h3 className="text-lg font-medium mb-2">No Active Chat</h3>
                  <p className="mb-4">Select a chat session or create a new one to start chatting</p>
                  <button
                    onClick={handleCreateSession}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                  >
                    Create New Chat
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Chat;
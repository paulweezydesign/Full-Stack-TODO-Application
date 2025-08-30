import React, { useState, useEffect, useRef } from 'react';
import { 
  MessageCircle, 
  Send, 
  Settings, 
  Plus, 
  Trash2, 
  Bot,
  User,
  Server,
  Key,
  Globe
} from 'lucide-react';
import axios from 'axios';
import toast from 'react-hot-toast';

const Chat = () => {
  const [sessions, setSessions] = useState([]);
  const [currentSession, setCurrentSession] = useState(null);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showMCPModal, setShowMCPModal] = useState(false);
  const [mcpServers, setMcpServers] = useState([]);
  const [newMCP, setNewMCP] = useState({ name: '', url: '', description: '' });
  
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    fetchSessions();
    if (currentSession) {
      scrollToBottom();
    }
  }, [currentSession]);

  const fetchSessions = async () => {
    try {
      const response = await axios.get('http://localhost:5000/api/chat');
      setSessions(response.data.sessions);
      
      if (response.data.sessions.length > 0 && !currentSession) {
        setCurrentSession(response.data.sessions[0]);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      toast.error('Failed to load chat sessions');
    }
  };

  const createNewSession = async () => {
    try {
      const response = await axios.post('http://localhost:5000/api/chat/sessions', {
        title: 'New Chat',
        settings: {
          baseUrl: 'https://api.openai.com/v1',
          apiKey: '',
          model: 'gpt-4',
          temperature: 0.7,
          maxTokens: 4000
        },
        mcpServers: []
      });
      
      const newSession = response.data;
      setSessions(prev => [newSession, ...prev]);
      setCurrentSession(newSession);
      toast.success('New chat session created');
    } catch (error) {
      console.error('Error creating session:', error);
      toast.error('Failed to create new session');
    }
  };

  const sendMessage = async (e) => {
    e.preventDefault();
    
    if (!message.trim() || !currentSession) return;

    const userMessage = message;
    setMessage('');
    setLoading(true);

    try {
      const response = await axios.post(`http://localhost:5000/api/chat/${currentSession.sessionId}/messages`, {
        message: userMessage,
        model: currentSession.settings.model,
        temperature: currentSession.settings.temperature,
        maxTokens: currentSession.settings.maxTokens
      });

      if (response.data.session) {
        setCurrentSession(response.data.session);
        setSessions(prev => 
          prev.map(s => 
            s.sessionId === currentSession.sessionId ? response.data.session : s
          )
        );
      }
    } catch (error) {
      console.error('Error sending message:', error);
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  const updateSessionSettings = async (settings) => {
    if (!currentSession) return;

    try {
      const updatedSession = { ...currentSession, settings };
      setCurrentSession(updatedSession);
      setSessions(prev => 
        prev.map(s => 
          s.sessionId === currentSession.sessionId ? updatedSession : s
        )
      );
      
      // Update on server
      await axios.put(`http://localhost:5000/api/chat/${currentSession.sessionId}`, {
        settings
      });
      
      toast.success('Settings updated');
    } catch (error) {
      console.error('Error updating settings:', error);
      toast.error('Failed to update settings');
    }
  };

  const addMCPServer = async () => {
    if (!newMCP.name || !newMCP.url) {
      toast.error('Name and URL are required');
      return;
    }

    const mcpServer = {
      name: newMCP.name,
      url: newMCP.url,
      description: newMCP.description,
      tools: []
    };

    try {
      const updatedSession = {
        ...currentSession,
        mcpServers: [...(currentSession.mcpServers || []), mcpServer]
      };
      
      setCurrentSession(updatedSession);
      setSessions(prev => 
        prev.map(s => 
          s.sessionId === currentSession.sessionId ? updatedSession : s
        )
      );
      
      // Update on server
      await axios.put(`http://localhost:5000/api/chat/${currentSession.sessionId}`, {
        mcpServers: updatedSession.mcpServers
      });
      
      setNewMCP({ name: '', url: '', description: '' });
      setShowMCPModal(false);
      toast.success('MCP server added');
    } catch (error) {
      console.error('Error adding MCP server:', error);
      toast.error('Failed to add MCP server');
    }
  };

  const removeMCPServer = async (index) => {
    try {
      const updatedMCPs = currentSession.mcpServers.filter((_, i) => i !== index);
      const updatedSession = { ...currentSession, mcpServers: updatedMCPs };
      
      setCurrentSession(updatedSession);
      setSessions(prev => 
        prev.map(s => 
          s.sessionId === currentSession.sessionId ? updatedSession : s
        )
      );
      
      // Update on server
      await axios.put(`http://localhost:5000/api/chat/${currentSession.sessionId}`, {
        mcpServers: updatedMCPs
      });
      
      toast.success('MCP server removed');
    } catch (error) {
      console.error('Error removing MCP server:', error);
      toast.error('Failed to remove MCP server');
    }
  };

  const deleteSession = async (sessionId) => {
    try {
      await axios.delete(`http://localhost:5000/api/chat/${sessionId}`);
      setSessions(prev => prev.filter(s => s.sessionId !== sessionId));
      
      if (currentSession?.sessionId === sessionId) {
        setCurrentSession(sessions[0] || null);
      }
      
      toast.success('Session deleted');
    } catch (error) {
      console.error('Error deleting session:', error);
      toast.error('Failed to delete session');
    }
  };

  return (
    <div className="max-w-7xl mx-auto h-screen flex">
      {/* Sidebar */}
      <div className="w-80 bg-white border-r border-gray-200 flex flex-col">
        {/* Header */}
        <div className="p-4 border-b border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Chat Sessions</h2>
            <button
              onClick={createNewSession}
              className="p-2 text-blue-600 hover:bg-blue-50 rounded-md"
              title="New Chat"
            >
              <Plus className="h-5 w-5" />
            </button>
          </div>
          
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="w-full flex items-center justify-center space-x-2 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
          >
            <Settings className="h-4 w-4" />
            <span>Settings</span>
          </button>
        </div>

        {/* Sessions List */}
        <div className="flex-1 overflow-y-auto">
          {sessions.map((session) => (
            <div
              key={session.sessionId}
              className={`p-4 border-b border-gray-100 cursor-pointer hover:bg-gray-50 ${
                currentSession?.sessionId === session.sessionId ? 'bg-blue-50 border-blue-200' : ''
              }`}
              onClick={() => setCurrentSession(session)}
            >
              <div className="flex items-center justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-medium text-gray-900 truncate">
                    {session.title}
                  </h3>
                  <p className="text-xs text-gray-500 mt-1">
                    {session.messages?.length || 0} messages
                  </p>
                </div>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteSession(session.sessionId);
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col bg-gray-50">
        {currentSession ? (
          <>
            {/* Chat Header */}
            <div className="bg-white border-b border-gray-200 p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{currentSession.title}</h1>
                  <p className="text-sm text-gray-500">
                    Model: {currentSession.settings.model} • 
                    {currentSession.messages?.length || 0} messages
                  </p>
                </div>
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => setShowMCPModal(true)}
                    className="px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-md border border-blue-200"
                  >
                    <Server className="h-4 w-4 inline mr-1" />
                    MCP Servers
                  </button>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {currentSession.messages?.map((msg, index) => (
                <div
                  key={index}
                  className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                      msg.role === 'user'
                        ? 'bg-blue-600 text-white'
                        : 'bg-white text-gray-900 border border-gray-200'
                    }`}
                  >
                    <div className="flex items-start space-x-2">
                      {msg.role === 'user' ? (
                        <User className="h-4 w-4 mt-1 flex-shrink-0" />
                      ) : (
                        <Bot className="h-4 w-4 mt-1 flex-shrink-0" />
                      )}
                      <div className="flex-1">
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.metadata && (
                          <p className="text-xs opacity-75 mt-1">
                            {msg.metadata.model} • {msg.metadata.tokens} tokens
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
              
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-white text-gray-900 border border-gray-200 px-4 py-2 rounded-lg">
                    <div className="flex items-center space-x-2">
                      <Bot className="h-4 w-4" />
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white border-t border-gray-200 p-4">
              <form onSubmit={sendMessage} className="flex space-x-4">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  disabled={loading}
                />
                <button
                  type="submit"
                  disabled={loading || !message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Send className="h-4 w-4" />
                </button>
              </form>
            </div>
          </>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No chat session selected</h3>
              <p className="text-gray-500">Create a new chat session to get started</p>
            </div>
          </div>
        )}
      </div>

      {/* Settings Modal */}
      {showSettings && currentSession && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Chat Settings</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Base URL</label>
                <input
                  type="text"
                  value={currentSession.settings.baseUrl || ''}
                  onChange={(e) => updateSessionSettings({
                    ...currentSession.settings,
                    baseUrl: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://api.openai.com/v1"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key</label>
                <input
                  type="password"
                  value={currentSession.settings.apiKey || ''}
                  onChange={(e) => updateSessionSettings({
                    ...currentSession.settings,
                    apiKey: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="sk-..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Model</label>
                <select
                  value={currentSession.settings.model || 'gpt-4'}
                  onChange={(e) => updateSessionSettings({
                    ...currentSession.settings,
                    model: e.target.value
                  })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="gpt-4">GPT-4</option>
                  <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
                  <option value="gpt-4-turbo">GPT-4 Turbo</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Temperature</label>
                <input
                  type="range"
                  min="0"
                  max="2"
                  step="0.1"
                  value={currentSession.settings.temperature || 0.7}
                  onChange={(e) => updateSessionSettings({
                    ...currentSession.settings,
                    temperature: parseFloat(e.target.value)
                  })}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>0 (Focused)</span>
                  <span>{currentSession.settings.temperature || 0.7}</span>
                  <span>2 (Creative)</span>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowSettings(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MCP Server Modal */}
      {showMCPModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-96 max-h-96 overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">MCP Servers</h3>
            
            {/* Add New MCP Server */}
            <div className="space-y-3 mb-6 p-4 bg-gray-50 rounded-lg">
              <input
                type="text"
                placeholder="Server Name"
                value={newMCP.name}
                onChange={(e) => setNewMCP({ ...newMCP, name: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <input
                type="text"
                placeholder="Server URL"
                value={newMCP.url}
                onChange={(e) => setNewMCP({ ...newMCP, url: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <textarea
                placeholder="Description (optional)"
                value={newMCP.description}
                onChange={(e) => setNewMCP({ ...newMCP, description: e.target.value })}
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={addMCPServer}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                Add MCP Server
              </button>
            </div>
            
            {/* Existing MCP Servers */}
            <div className="space-y-3">
              {currentSession?.mcpServers?.map((mcp, index) => (
                <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{mcp.name}</h4>
                    <p className="text-sm text-gray-500">{mcp.url}</p>
                    {mcp.description && (
                      <p className="text-xs text-gray-400 mt-1">{mcp.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => removeMCPServer(index)}
                    className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            
            <div className="flex justify-end mt-6">
              <button
                onClick={() => setShowMCPModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-md"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Chat;
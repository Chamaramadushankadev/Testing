import React, { useState, useEffect } from 'react';
import { Video, Wand2, Copy, Download, Sparkles, Clock, Tag, Plus, Edit3, Trash2, Search, Filter, MoreVertical, FileText, Timer } from 'lucide-react';
import { YouTubeScript, YouTubeChannel } from '../../types';
import { youtubeScriptsAPI, youtubeChannelsAPI } from '../../services/api';

export const YouTubeScripts: React.FC = () => {
  const [scripts, setScripts] = useState<YouTubeScript[]>([]);
  const [channels, setChannels] = useState<YouTubeChannel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showGenerator, setShowGenerator] = useState(false);
  const [showAddScript, setShowAddScript] = useState(false);
  const [showAddChannel, setShowAddChannel] = useState(false);
  const [editingScript, setEditingScript] = useState<YouTubeScript | null>(null);
  const [editingChannel, setEditingChannel] = useState<YouTubeChannel | null>(null);
  const [generating, setGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'witty' | 'emotional' | 'informative' | 'casual'>('informative');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTone, setFilterTone] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');

  useEffect(() => {
    loadData();
  }, []);

  useEffect(() => {
    loadScripts();
  }, [activeChannelId]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [channelsResponse] = await Promise.all([
        youtubeChannelsAPI.getAll()
      ]);
      setChannels(channelsResponse.data || []);
      
      // Set first channel as active if available
      if (channelsResponse.data && channelsResponse.data.length > 0) {
        setActiveChannelId(channelsResponse.data[0].id);
      }
    } catch (error) {
      console.error('Error loading data:', error);
      setChannels([]);
    } finally {
      setLoading(false);
    }
  };

  const loadScripts = async () => {
    try {
      const params: any = {};
      if (activeChannelId !== 'all') params.channelId = activeChannelId;
      if (filterTone !== 'all') params.tone = filterTone;
      if (filterStatus !== 'all') params.status = filterStatus;
      if (searchTerm) params.search = searchTerm;

      const response = await youtubeScriptsAPI.getAll(params);
      setScripts(response.data || []);
    } catch (error) {
      console.error('Error loading scripts:', error);
      setScripts([]);
    }
  };

  const toneOptions = [
    { value: 'witty', label: 'Witty & Fun', description: 'Playful and engaging' },
    { value: 'emotional', label: 'Emotional', description: 'Heart-touching and inspiring' },
    { value: 'informative', label: 'Informative', description: 'Educational and clear' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' }
  ];

  const handleGenerateScript = async () => {
    if (!activeChannelId || activeChannelId === 'all') {
      alert('Please select a channel first');
      return;
    }

    setGenerating(true);
    
    try {
      const response = await youtubeScriptsAPI.generate({
        channelId: activeChannelId,
        topic,
        tone: selectedTone,
        keywords
      });
      
      setScripts([response.data, ...scripts]);
      setGenerating(false);
      setShowGenerator(false);
      setTopic('');
      setKeywords('');
    } catch (error) {
      console.error('Error generating script:', error);
      setGenerating(false);
    }
  };

  const handleAddOrUpdateScript = async (formData: FormData) => {
    try {
      const scriptData = {
        channelId: formData.get('channelId') as string,
        title: formData.get('title') as string,
        content: formData.get('content') as string,
        tone: formData.get('tone') as string,
        source: formData.get('source') as string || 'Manual Entry',
        keywords: (formData.get('keywords') as string).split(',').map(k => k.trim()).filter(k => k),
        status: formData.get('status') as string || 'draft',
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t),
        notes: formData.get('notes') as string || ''
      };

      if (editingScript) {
        const response = await youtubeScriptsAPI.update(editingScript.id, scriptData);
        setScripts(scripts.map(s => s.id === editingScript.id ? response.data : s));
      } else {
        const response = await youtubeScriptsAPI.create(scriptData);
        setScripts([response.data, ...scripts]);
      }

      setEditingScript(null);
      setShowAddScript(false);
    } catch (error) {
      console.error('Error saving script:', error);
    }
  };

  const handleAddOrUpdateChannel = async (formData: FormData) => {
    try {
      const channelData = {
        name: formData.get('name') as string,
        channelId: formData.get('channelId') as string || '',
        description: formData.get('description') as string || '',
        url: formData.get('url') as string || '',
        subscriberCount: parseInt(formData.get('subscriberCount') as string) || 0,
        color: formData.get('color') as string || '#3B82F6',
        tags: (formData.get('tags') as string).split(',').map(t => t.trim()).filter(t => t)
      };

      if (editingChannel) {
        const response = await youtubeChannelsAPI.update(editingChannel.id, channelData);
        setChannels(channels.map(c => c.id === editingChannel.id ? response.data : c));
      } else {
        const response = await youtubeChannelsAPI.create(channelData);
        setChannels([...channels, response.data]);
        setActiveChannelId(response.data.id);
      }

      setEditingChannel(null);
      setShowAddChannel(false);
    } catch (error) {
      console.error('Error saving channel:', error);
    }
  };

  const handleDeleteScript = async (scriptId: string) => {
    if (!window.confirm('Are you sure you want to delete this script?')) return;
    
    try {
      await youtubeScriptsAPI.delete(scriptId);
      setScripts(scripts.filter(s => s.id !== scriptId));
    } catch (error) {
      console.error('Error deleting script:', error);
    }
  };

  const handleDeleteChannel = async (channelId: string) => {
    if (!window.confirm('Are you sure you want to delete this channel? All scripts will also be deleted.')) return;
    
    try {
      await youtubeChannelsAPI.delete(channelId);
      setChannels(channels.filter(c => c.id !== channelId));
      if (activeChannelId === channelId) {
        setActiveChannelId(channels.length > 1 ? channels.find(c => c.id !== channelId)?.id || 'all' : 'all');
      }
    } catch (error) {
      console.error('Error deleting channel:', error);
    }
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
  };

  const getToneColor = (tone: string) => {
    switch (tone) {
      case 'witty': return 'bg-purple-100 text-purple-800';
      case 'emotional': return 'bg-pink-100 text-pink-800';
      case 'informative': return 'bg-blue-100 text-blue-800';
      case 'casual': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800';
      case 'ready': return 'bg-green-100 text-green-800';
      case 'used': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getActiveChannel = () => {
    return channels.find(c => c.id === activeChannelId);
  };

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading YouTube scripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Video className="w-6 h-6 mr-2 text-red-600" />
            YouTube Script Generator
          </h2>
          <p className="text-gray-600 mt-1">AI-powered script generation for your content</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => {
              setEditingScript(null);
              setShowAddScript(true);
            }}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Add Script</span>
          </button>
          
          <button
            onClick={() => setShowGenerator(true)}
            className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-2 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2 shadow-lg"
          >
            <Wand2 className="w-4 h-4" />
            <span>Generate Script</span>
          </button>
        </div>
      </div>

      {/* Channel Tabs */}
      <div className="border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-1 overflow-x-auto">
            <button
              onClick={() => setActiveChannelId('all')}
              className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap ${
                activeChannelId === 'all'
                  ? 'bg-gray-900 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              All Channels
            </button>
            {channels.map((channel) => (
              <button
                key={channel.id}
                onClick={() => setActiveChannelId(channel.id)}
                className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors whitespace-nowrap flex items-center space-x-2 ${
                  activeChannelId === channel.id
                    ? 'text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{
                  backgroundColor: activeChannelId === channel.id ? channel.color : undefined
                }}
              >
                <span>{channel.name}</span>
                <span className="text-xs opacity-75">({scripts.filter(s => s.channelId === channel.id).length})</span>
              </button>
            ))}
          </div>
          
          <button
            onClick={() => {
              setEditingChannel(null);
              setShowAddChannel(true);
            }}
            className="bg-gray-600 text-white px-3 py-2 rounded-lg hover:bg-gray-700 transition-colors flex items-center space-x-2 text-sm"
          >
            <Plus className="w-4 h-4" />
            <span>Add Channel</span>
          </button>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row sm:items-center space-y-4 sm:space-y-0 sm:space-x-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search scripts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterTone}
              onChange={(e) => setFilterTone(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Tones</option>
              {toneOptions.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
              ))}
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="used">Used</option>
            </select>
          </div>
          
          <button
            onClick={loadScripts}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scripts.length > 0 ? (
          scripts.map((script) => (
            <div key={script.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center space-x-2 mb-2">
                    <h3 className="text-lg font-semibold text-gray-900">{script.title}</h3>
                    {script.isGenerated && <Sparkles className="w-4 h-4 text-purple-600" />}
                  </div>
                  <div className="flex items-center space-x-2 mb-3">
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(script.tone)}`}>
                      {script.tone}
                    </div>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(script.status)}`}>
                      {script.status}
                    </div>
                    <div className="flex items-center text-xs text-gray-500">
                      <Clock className="w-3 h-3 mr-1" />
                      {new Date(script.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-1">
                  <button
                    onClick={() => {
                      setEditingScript(script);
                      setShowAddScript(true);
                    }}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                  >
                    <Edit3 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteScript(script.id)}
                    className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
              
              <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
                <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                  {script.content}
                </pre>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-4 text-sm text-gray-600">
                  <div className="flex items-center space-x-1">
                    <FileText className="w-4 h-4" />
                    <span>{script.wordCount} words</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Timer className="w-4 h-4" />
                    <span>{formatDuration(script.estimatedDuration)}</span>
                  </div>
                </div>
                
                <div className="flex items-center space-x-2">
                  {script.keywords.slice(0, 2).map((keyword, index) => (
                    <div key={index} className="flex items-center text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                      <Tag className="w-3 h-3 mr-1" />
                      {keyword}
                    </div>
                  ))}
                  {script.keywords.length > 2 && (
                    <span className="text-xs text-gray-500">+{script.keywords.length - 2} more</span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-xs text-gray-500">
                  Source: {script.source}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button
                    onClick={() => copyToClipboard(script.content)}
                    className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors"
                    title="Copy to clipboard"
                  >
                    <Copy className="w-4 h-4" />
                  </button>
                  <button
                    className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded transition-colors"
                    title="Download script"
                  >
                    <Download className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Video className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Scripts Found</h3>
            <p className="text-gray-600 mb-6">
              {channels.length === 0 
                ? 'Create your first YouTube channel to get started with script generation.'
                : 'Create your first script or generate one with AI to get started.'
              }
            </p>
            {channels.length === 0 ? (
              <button
                onClick={() => setShowAddChannel(true)}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2 mx-auto"
              >
                <Plus className="w-5 h-5" />
                <span>Add Your First Channel</span>
              </button>
            ) : (
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setShowAddScript(true)}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
                >
                  <Plus className="w-5 h-5" />
                  <span>Add Script</span>
                </button>
                <button
                  onClick={() => setShowGenerator(true)}
                  className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2"
                >
                  <Wand2 className="w-5 h-5" />
                  <span>Generate with AI</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Script Generator Modal */}
      {showGenerator && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
                Generate YouTube Script
              </h3>
              <button
                onClick={() => setShowGenerator(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                ✕
              </button>
            </div>
            
            <form onSubmit={(e) => { e.preventDefault(); handleGenerateScript(); }} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                <select
                  value={activeChannelId === 'all' ? '' : activeChannelId}
                  onChange={(e) => setActiveChannelId(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  required
                >
                  <option value="">Select a channel</option>
                  {channels.map(channel => (
                    <option key={channel.id} value={channel.id}>{channel.name}</option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Topic or Source</label>
                <input
                  type="text"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="e.g., AI Tools for Content Creation, Latest Tech Trends..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                <input
                  type="text"
                  value={keywords}
                  onChange={(e) => setKeywords(e.target.value)}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="AI, productivity, tools, automation..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-3">Script Tone</label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {toneOptions.map((option) => (
                    <label key={option.value} className="cursor-pointer">
                      <input
                        type="radio"
                        name="tone"
                        value={option.value}
                        checked={selectedTone === option.value}
                        onChange={(e) => setSelectedTone(e.target.value as any)}
                        className="sr-only"
                      />
                      <div className={`p-4 border-2 rounded-lg transition-all ${
                        selectedTone === option.value
                          ? 'border-purple-500 bg-purple-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}>
                        <div className="font-medium text-gray-900">{option.label}</div>
                        <div className="text-sm text-gray-600 mt-1">{option.description}</div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowGenerator(false)}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                  disabled={generating}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generating || !topic || !activeChannelId || activeChannelId === 'all'}
                  className="flex-1 px-6 py-3 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                >
                  {generating ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <Wand2 className="w-4 h-4" />
                      <span>Generate Script</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Script Modal */}
      {showAddScript && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingScript ? 'Edit Script' : 'Add New Script'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateScript(formData);
              }}
              className="space-y-6"
            >
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel</label>
                  <select
                    name="channelId"
                    defaultValue={editingScript?.channelId || activeChannelId === 'all' ? '' : activeChannelId}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Select a channel</option>
                    {channels.map(channel => (
                      <option key={channel.id} value={channel.id}>{channel.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                  <input
                    type="text"
                    name="title"
                    defaultValue={editingScript?.title || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter script title..."
                    required
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Content</label>
                <textarea
                  name="content"
                  rows={12}
                  defaultValue={editingScript?.content || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent font-mono"
                  placeholder="Write your script content here..."
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tone</label>
                  <select
                    name="tone"
                    defaultValue={editingScript?.tone || 'informative'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    {toneOptions.map(option => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
                  <select
                    name="status"
                    defaultValue={editingScript?.status || 'draft'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="draft">Draft</option>
                    <option value="ready">Ready</option>
                    <option value="used">Used</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Source</label>
                  <input
                    type="text"
                    name="source"
                    defaultValue={editingScript?.source || 'Manual Entry'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="e.g., Manual Entry, Google Alerts..."
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Keywords (comma-separated)</label>
                  <input
                    type="text"
                    name="keywords"
                    defaultValue={editingScript?.keywords.join(', ') || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="AI, productivity, tools..."
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                  <input
                    type="text"
                    name="tags"
                    defaultValue={editingScript?.tags.join(', ') || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="tutorial, review, tips..."
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  name="notes"
                  rows={3}
                  defaultValue={editingScript?.notes || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Additional notes about this script..."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddScript(false);
                    setEditingScript(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingScript ? 'Update Script' : 'Create Script'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add/Edit Channel Modal */}
      {showAddChannel && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              {editingChannel ? 'Edit Channel' : 'Add New Channel'}
            </h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddOrUpdateChannel(formData);
              }}
              className="space-y-6"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Channel Name</label>
                <input
                  type="text"
                  name="name"
                  defaultValue={editingChannel?.name || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="e.g., My Tech Channel"
                  required
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">YouTube Channel ID (optional)</label>
                  <input
                    type="text"
                    name="channelId"
                    defaultValue={editingChannel?.channelId || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="UCxxxxxxxxxxxxxxxxxxxxxxx"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Subscriber Count</label>
                  <input
                    type="number"
                    name="subscriberCount"
                    defaultValue={editingChannel?.subscriberCount || 0}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    min="0"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description</label>
                <textarea
                  name="description"
                  rows={3}
                  defaultValue={editingChannel?.description || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Describe your channel..."
                />
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Channel URL (optional)</label>
                  <input
                    type="url"
                    name="url"
                    defaultValue={editingChannel?.url || ''}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="https://youtube.com/@yourchannel"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Color Theme</label>
                  <input
                    type="color"
                    name="color"
                    defaultValue={editingChannel?.color || '#3B82F6'}
                    className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent h-12"
                  />
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  defaultValue={editingChannel?.tags.join(', ') || ''}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="tech, tutorials, reviews..."
                />
              </div>

              <div className="flex space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => {
                    setShowAddChannel(false);
                    setEditingChannel(null);
                  }}
                  className="flex-1 px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingChannel ? 'Update Channel' : 'Create Channel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
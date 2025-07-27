import React, { useState, useEffect } from 'react';
import { Plus, Search, Filter, Grid, List, Edit3, Trash2, Copy, Play, Image, Type, Video, Palette, ZoomIn, ZoomOut, Move, Upload, Download, Save, Eye } from 'lucide-react';
import { MoodboardCanvas } from './MoodboardCanvas';
import { useSubscription } from '../../context/SubscriptionContext';
import { moodboardAPI } from '../../services/api';

interface Moodboard {
  id: string;
  title: string;
  description: string;
  items: any[];
  canvas: {
    width: number;
    height: number;
    backgroundColor: string;
    zoom: number;
    pan: { x: number; y: number };
  };
  tags: string[];
  storageUsed: number;
  createdAt: string;
  updatedAt: string;
}

export const MoodboardManager: React.FC = () => {
  const [moodboards, setMoodboards] = useState<Moodboard[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedMoodboard, setSelectedMoodboard] = useState<Moodboard | null>(null);
  const [showCanvas, setShowCanvas] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterTag, setFilterTag] = useState('all');
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [storageInfo, setStorageInfo] = useState<any>(null);
  const { hasAccess, getUpgradeMessage } = useSubscription();

  useEffect(() => {
    if (hasAccess('social-templates')) {
      loadMoodboards();
      loadStorageInfo();
    }
  }, []);

  const loadMoodboards = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (searchTerm) params.search = searchTerm;
      if (filterTag !== 'all') params.tags = filterTag;

      const response = await moodboardAPI.getAll(params);
      setMoodboards(response.data || []);
    } catch (error) {
      console.error('Error loading moodboards:', error);
      setMoodboards([]);
    } finally {
      setLoading(false);
    }
  };

  const loadStorageInfo = async () => {
    try {
      const response = await moodboardAPI.getStorageInfo();
      setStorageInfo(response.data);
    } catch (error) {
      console.error('Error loading storage info:', error);
    }
  };

  const handleCreateMoodboard = async (formData: FormData) => {
    try {
      const moodboardData = {
        title: formData.get('title') as string,
        description: formData.get('description') as string || '',
        tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(t => t),
        canvas: {
          width: 1920,
          height: 1080,
          backgroundColor: '#ffffff',
          zoom: 1,
          pan: { x: 0, y: 0 }
        },
        items: []
      };

      const response = await moodboardAPI.create(moodboardData);
      setMoodboards([response.data, ...moodboards]);
      setShowCreateModal(false);
      setSelectedMoodboard(response.data);
      setShowCanvas(true);
    } catch (error) {
      console.error('Error creating moodboard:', error);
    }
  };

  const handleDeleteMoodboard = async (moodboardId: string) => {
    if (!window.confirm('Are you sure you want to delete this moodboard? All associated files will be permanently deleted.')) return;
    
    try {
      await moodboardAPI.delete(moodboardId);
      setMoodboards(moodboards.filter(m => m.id !== moodboardId));
      await loadStorageInfo(); // Refresh storage info
    } catch (error) {
      console.error('Error deleting moodboard:', error);
    }
  };

  const handleDuplicateMoodboard = async (moodboard: Moodboard) => {
    try {
      const duplicateData = {
        ...moodboard,
        title: `${moodboard.title} (Copy)`,
        id: undefined
      };
      
      const response = await moodboardAPI.create(duplicateData);
      setMoodboards([response.data, ...moodboards]);
    } catch (error) {
      console.error('Error duplicating moodboard:', error);
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const allTags = Array.from(new Set(moodboards.flatMap(m => m.tags)));

  if (!hasAccess('social-templates')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Palette className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Moodboard</h3>
          <p className="text-gray-600 mb-6">{getUpgradeMessage('social-templates')}</p>
          <a
            href="/upgrade"
            className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition-colors inline-flex items-center space-x-2"
          >
            <span>Upgrade Now</span>
          </a>
        </div>
      </div>
    );
  }

  if (showCanvas && selectedMoodboard) {
    return (
      <MoodboardCanvas
        moodboard={selectedMoodboard}
        onClose={() => {
          setShowCanvas(false);
          setSelectedMoodboard(null);
          loadMoodboards();
          loadStorageInfo();
        }}
        onSave={(updatedMoodboard) => {
          setMoodboards(moodboards.map(m => m.id === updatedMoodboard.id ? updatedMoodboard : m));
        }}
      />
    );
  }

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading moodboards...</p>
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
            <Palette className="w-6 h-6 mr-2 text-purple-600" />
            Moodboard
          </h2>
          <p className="text-gray-600 mt-1">Create visual inspiration boards with videos, images, and text</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>New Moodboard</span>
        </button>
      </div>

      {/* Storage Info */}
      {storageInfo && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-medium text-gray-900">Storage Usage</h3>
            <span className="text-sm text-gray-600">
              {formatFileSize(storageInfo.totalUsed)} / {formatFileSize(storageInfo.totalLimit)}
            </span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className={`h-2 rounded-full transition-all duration-300 ${
                storageInfo.usagePercentage > 90 ? 'bg-red-500' :
                storageInfo.usagePercentage > 70 ? 'bg-yellow-500' :
                'bg-green-500'
              }`}
              style={{ width: `${Math.min(storageInfo.usagePercentage, 100)}%` }}
            />
          </div>
          <div className="flex items-center justify-between mt-2 text-xs text-gray-500">
            <span>{storageInfo.fileCount} files</span>
            <span>{storageInfo.usagePercentage.toFixed(1)}% used</span>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex flex-col space-y-4 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search moodboards..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full sm:w-64 pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={filterTag}
              onChange={(e) => setFilterTag(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
            >
              <option value="all">All Tags</option>
              {allTags.map(tag => (
                <option key={tag} value={tag}>{tag}</option>
              ))}
            </select>
          </div>
          
          <button
            onClick={loadMoodboards}
            className="bg-gray-100 text-gray-700 px-3 py-2 rounded-lg hover:bg-gray-200 transition-colors text-sm"
          >
            Apply Filters
          </button>
        </div>
        
        <div className="flex items-center bg-gray-100 rounded-lg p-1">
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'grid' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <Grid className="w-4 h-4" />
          </button>
          <button
            onClick={() => setViewMode('list')}
            className={`px-3 py-1 rounded text-sm font-medium transition-colors ${
              viewMode === 'list' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-600'
            }`}
          >
            <List className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Moodboards Grid/List */}
      <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6' : 'space-y-4'}>
        {moodboards.length > 0 ? (
          moodboards.map((moodboard) => (
            <div key={moodboard.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
              {/* Thumbnail */}
              <div 
                className="h-48 bg-gradient-to-br from-purple-100 to-blue-100 relative cursor-pointer"
                onClick={() => {
                  setSelectedMoodboard(moodboard);
                  setShowCanvas(true);
                }}
                style={{ backgroundColor: moodboard.canvas.backgroundColor }}
              >
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <Palette className="w-8 h-8 text-purple-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-600">{moodboard.items.length} items</p>
                  </div>
                </div>
                
                {/* Quick preview of items */}
                <div className="absolute top-2 left-2 flex space-x-1">
                  {moodboard.items.slice(0, 3).map((item, index) => (
                    <div key={index} className="w-6 h-6 bg-white rounded shadow-sm flex items-center justify-center">
                      {item.type === 'video' && <Video className="w-3 h-3 text-red-500" />}
                      {item.type === 'image' && <Image className="w-3 h-3 text-green-500" />}
                      {item.type === 'text' && <Type className="w-3 h-3 text-blue-500" />}
                    </div>
                  ))}
                  {moodboard.items.length > 3 && (
                    <div className="w-6 h-6 bg-gray-200 rounded shadow-sm flex items-center justify-center">
                      <span className="text-xs text-gray-600">+{moodboard.items.length - 3}</span>
                    </div>
                  )}
                </div>
              </div>
              
              {/* Content */}
              <div className="p-4">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-medium text-gray-900 truncate">{moodboard.title}</h3>
                  <div className="flex items-center space-x-1 ml-2">
                    <button
                      onClick={() => {
                        setSelectedMoodboard(moodboard);
                        setShowCanvas(true);
                      }}
                      className="p-1 text-gray-400 hover:text-purple-600 transition-colors"
                      title="Edit"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDuplicateMoodboard(moodboard)}
                      className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                      title="Duplicate"
                    >
                      <Copy className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteMoodboard(moodboard.id)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Delete"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
                
                {moodboard.description && (
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{moodboard.description}</p>
                )}
                
                <div className="flex items-center justify-between">
                  <div className="flex flex-wrap gap-1">
                    {moodboard.tags.slice(0, 2).map((tag, index) => (
                      <span key={index} className="px-2 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
                        {tag}
                      </span>
                    ))}
                    {moodboard.tags.length > 2 && (
                      <span className="text-xs text-gray-500">+{moodboard.tags.length - 2}</span>
                    )}
                  </div>
                  <div className="text-xs text-gray-500">
                    {new Date(moodboard.updatedAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full text-center py-12">
            <Palette className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No Moodboards Yet</h3>
            <p className="text-gray-600 mb-6">Create your first moodboard to start organizing visual inspiration</p>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-purple-600 text-white px-6 py-3 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2 mx-auto"
            >
              <Plus className="w-5 h-5" />
              <span>Create Your First Moodboard</span>
            </button>
          </div>
        )}
      </div>

      {/* Create Moodboard Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Moodboard</h3>
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleCreateMoodboard(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Title</label>
                <input
                  type="text"
                  name="title"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Enter moodboard title..."
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Description (Optional)</label>
                <textarea
                  name="description"
                  rows={3}
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="Describe your moodboard..."
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="w-full border border-gray-300 rounded-lg px-4 py-3 focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  placeholder="inspiration, design, colors..."
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors"
                >
                  Create Moodboard
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
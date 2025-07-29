import React, { useState, useEffect } from 'react';
import { Plus, Video, Image, FileText, Calendar, Share2, Download, Wand2, Settings, Instagram, Facebook, Youtube, Palette, Upload, Trash2, Edit3 } from 'lucide-react';
import { TemplateEditor } from './TemplateEditor';
import { useSubscription } from '../../context/SubscriptionContext';

interface SocialMediaPost {
  id: string;
  type: 'youtube' | 'facebook' | 'instagram' | 'template';
  platform: 'youtube' | 'facebook' | 'instagram' | 'multi';
  title: string;
  content: {
    script?: string;
    caption?: string;
    hashtags?: string[];
    mentions?: string[];
  };
  media: {
    thumbnailUrl?: string;
    voiceoverUrl?: string;
    images?: any[];
    templateData?: any;
  };
  category?: string;
  tags: string[];
  status: 'draft' | 'ready' | 'scheduled' | 'published';
  scheduledAt?: string;
  isTemplate: boolean;
  createdAt: string;
}

export const SocialMediaManager: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'posts' | 'templates' | 'accounts' | 'analytics'>('posts');
  const [posts, setPosts] = useState<SocialMediaPost[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showTemplateEditor, setShowTemplateEditor] = useState(false);
  const [selectedPost, setSelectedPost] = useState<SocialMediaPost | null>(null);
  const [filterPlatform, setFilterPlatform] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const { hasAccess, getUpgradeMessage } = useSubscription();

  useEffect(() => {
    if (hasAccess('social-templates')) {
      loadData();
    }
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      // Mock data for now - replace with actual API calls
      setPosts([
        {
          id: '1',
          type: 'youtube',
          platform: 'youtube',
          title: 'AI Tools for Content Creation',
          content: {
            script: 'Welcome to today\'s video about AI tools...',
          },
          media: {
            thumbnailUrl: 'https://images.pexels.com/photos/3184291/pexels-photo-3184291.jpeg',
            voiceoverUrl: ''
          },
          tags: ['ai', 'tools', 'content'],
          status: 'draft',
          isTemplate: false,
          createdAt: new Date().toISOString()
        }
      ]);
      setCategories([
        { id: '1', name: 'YouTube Content', color: '#FF0000', platforms: ['youtube'] },
        { id: '2', name: 'Social Posts', color: '#1877F2', platforms: ['facebook', 'instagram'] }
      ]);
      setAccounts([
        { id: '1', platform: 'youtube', accountName: 'My Channel', isActive: true },
        { id: '2', platform: 'facebook', accountName: 'My Page', isActive: true }
      ]);
    } catch (error) {
      console.error('Error loading data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getPlatformIcon = (platform: string) => {
    switch (platform) {
      case 'youtube': return Youtube;
      case 'facebook': return Facebook;
      case 'instagram': return Instagram;
      default: return Share2;
    }
  };

  const getPlatformColor = (platform: string) => {
    switch (platform) {
      case 'youtube': return 'text-red-600';
      case 'facebook': return 'text-blue-600';
      case 'instagram': return 'text-pink-600';
      default: return 'text-gray-600';
    }
  };

  if (!hasAccess('social-templates')) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Share2 className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Social Media Manager</h3>
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

  if (loading) {
    return (
      <div className="p-6 flex items-center justify-center min-h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-2 border-blue-600 border-t-transparent mx-auto mb-4"></div>
          <p className="text-gray-600">Loading social media content...</p>
        </div>
      </div>
    );
  }

  if (showTemplateEditor) {
    return (
      <TemplateEditor
        template={selectedPost}
        onClose={() => {
          setShowTemplateEditor(false);
          setSelectedPost(null);
        }}
        onSave={(template) => {
          // Handle template save
          setShowTemplateEditor(false);
          setSelectedPost(null);
        }}
      />
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 flex items-center">
            <Share2 className="w-6 h-6 mr-2 text-blue-600" />
            Social Media Manager
          </h2>
          <p className="text-gray-600 mt-1">Create, manage, and schedule content across platforms</p>
        </div>
        
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setShowCreateModal(true)}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="w-4 h-4" />
            <span>Create Content</span>
          </button>
          
          <button
            onClick={() => setShowTemplateEditor(true)}
            className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
          >
            <Palette className="w-4 h-4" />
            <span>Design Template</span>
          </button>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'posts', label: 'Content', icon: FileText },
            { id: 'templates', label: 'Templates', icon: Palette },
            { id: 'accounts', label: 'Accounts', icon: Settings },
            { id: 'analytics', label: 'Analytics', icon: Share2 }
          ].map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-2 px-1 border-b-2 font-medium text-sm flex items-center space-x-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <Icon className="w-4 h-4" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content Tab */}
      {activeTab === 'posts' && (
        <div className="space-y-6">
          {/* Filters */}
          <div className="flex items-center space-x-4">
            <select
              value={filterPlatform}
              onChange={(e) => setFilterPlatform(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Platforms</option>
              <option value="youtube">YouTube</option>
              <option value="facebook">Facebook</option>
              <option value="instagram">Instagram</option>
            </select>
            
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="draft">Draft</option>
              <option value="ready">Ready</option>
              <option value="scheduled">Scheduled</option>
              <option value="published">Published</option>
            </select>
          </div>

          {/* Posts Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {posts.map((post) => {
              const PlatformIcon = getPlatformIcon(post.platform);
              
              return (
                <div key={post.id} className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow">
                  {/* Thumbnail */}
                  <div className="h-48 bg-gradient-to-br from-blue-100 to-purple-100 relative">
                    {post.media.thumbnailUrl ? (
                      <img
                        src={post.media.thumbnailUrl}
                        alt={post.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <PlatformIcon className={`w-12 h-12 ${getPlatformColor(post.platform)}`} />
                      </div>
                    )}
                    
                    <div className="absolute top-2 left-2">
                      <div className={`px-2 py-1 rounded-full text-xs font-medium bg-white ${getPlatformColor(post.platform)}`}>
                        {post.platform.toUpperCase()}
                      </div>
                    </div>
                    
                    <div className="absolute top-2 right-2 flex space-x-1">
                      <button className="p-1.5 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-colors">
                        <Edit3 className="w-3 h-3 text-gray-600" />
                      </button>
                      <button className="p-1.5 bg-white bg-opacity-90 rounded-lg hover:bg-opacity-100 transition-colors">
                        <Trash2 className="w-3 h-3 text-gray-600" />
                      </button>
                    </div>
                  </div>
                  
                  {/* Content */}
                  <div className="p-4">
                    <h3 className="font-medium text-gray-900 mb-2">{post.title}</h3>
                    
                    {post.content.script && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content.script}</p>
                    )}
                    
                    {post.content.caption && (
                      <p className="text-sm text-gray-600 mb-3 line-clamp-2">{post.content.caption}</p>
                    )}
                    
                    <div className="flex items-center justify-between">
                      <div className="flex flex-wrap gap-1">
                        {post.tags.slice(0, 2).map((tag, index) => (
                          <span key={index} className="px-2 py-1 bg-gray-100 text-gray-600 rounded-full text-xs">
                            #{tag}
                          </span>
                        ))}
                        {post.tags.length > 2 && (
                          <span className="text-xs text-gray-500">+{post.tags.length - 2}</span>
                        )}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <button className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                          <Calendar className="w-4 h-4" />
                        </button>
                        <button className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                          <Download className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Templates Tab */}
      {activeTab === 'templates' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Design Templates</h3>
            <button
              onClick={() => setShowTemplateEditor(true)}
              className="bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>Create Template</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {/* Template previews would go here */}
            <div className="text-center py-12 col-span-full">
              <Palette className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No templates created yet</p>
              <button
                onClick={() => setShowTemplateEditor(true)}
                className="mt-4 bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
              >
                Create Your First Template
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Accounts Tab */}
      {activeTab === 'accounts' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-gray-900">Connected Accounts</h3>
            <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2">
              <Plus className="w-4 h-4" />
              <span>Connect Account</span>
            </button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {accounts.map((account) => {
              const PlatformIcon = getPlatformIcon(account.platform);
              
              return (
                <div key={account.id} className="bg-white rounded-lg border border-gray-200 p-6">
                  <div className="flex items-center space-x-3 mb-4">
                    <PlatformIcon className={`w-8 h-8 ${getPlatformColor(account.platform)}`} />
                    <div>
                      <h4 className="font-medium text-gray-900">{account.accountName}</h4>
                      <p className="text-sm text-gray-600 capitalize">{account.platform}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between">
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                      account.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {account.isActive ? 'Connected' : 'Disconnected'}
                    </span>
                    
                    <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                      Manage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Content Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">Create New Content</h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-red-500 hover:bg-red-50 transition-colors text-center">
                <Youtube className="w-8 h-8 text-red-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">YouTube</span>
                <p className="text-xs text-gray-600 mt-1">Scripts & Videos</p>
              </button>
              
              <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-blue-500 hover:bg-blue-50 transition-colors text-center">
                <Facebook className="w-8 h-8 text-blue-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Facebook</span>
                <p className="text-xs text-gray-600 mt-1">Posts & Stories</p>
              </button>
              
              <button className="p-6 border-2 border-gray-200 rounded-lg hover:border-pink-500 hover:bg-pink-50 transition-colors text-center">
                <Instagram className="w-8 h-8 text-pink-600 mx-auto mb-2" />
                <span className="font-medium text-gray-900">Instagram</span>
                <p className="text-xs text-gray-600 mt-1">Posts & Stories</p>
              </button>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
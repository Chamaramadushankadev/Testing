import React, { useState } from 'react';
import { Plus, Rss, ExternalLink, TrendingUp, Calendar, Search, Filter } from 'lucide-react';
import { GoogleAlert, Article } from '../../types';
import { mockGoogleAlerts, mockArticles } from '../../data/mockData';

export const GoogleAlerts: React.FC = () => {
  const [alerts, setAlerts] = useState<GoogleAlert[]>(mockGoogleAlerts);
  const [articles, setArticles] = useState<Article[]>(mockArticles);
  const [showAddAlert, setShowAddAlert] = useState(false);
  const [selectedKeyword, setSelectedKeyword] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredArticles = articles.filter(article => {
    const matchesKeyword = selectedKeyword === 'all' || article.keyword === selectedKeyword;
    const matchesSearch = article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         article.description.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesKeyword && matchesSearch;
  });

  const keywords = ['all', ...Array.from(new Set(articles.map(article => article.keyword)))];

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-4 sm:space-y-0">
        <div className="flex items-center space-x-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search articles..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent w-64"
            />
          </div>
          
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-gray-500" />
            <select
              value={selectedKeyword}
              onChange={(e) => setSelectedKeyword(e.target.value)}
              className="border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              {keywords.map(keyword => (
                <option key={keyword} value={keyword}>
                  {keyword === 'all' ? 'All Keywords' : keyword}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <button
          onClick={() => setShowAddAlert(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>Add Alert</span>
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Active Alerts */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Rss className="w-5 h-5 mr-2 text-blue-600" />
              Active Alerts
            </h3>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div key={alert.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-gray-900">{alert.keyword}</h4>
                    <div className={`w-2 h-2 rounded-full ${alert.isActive ? 'bg-green-500' : 'bg-gray-300'}`} />
                  </div>
                  <p className="text-sm text-gray-600 mb-2">{alert.category}</p>
                  <div className="flex items-center text-xs text-gray-500">
                    <Calendar className="w-3 h-3 mr-1" />
                    Last fetch: {new Date(alert.lastFetch).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Articles Feed */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <TrendingUp className="w-5 h-5 mr-2 text-green-600" />
              Latest Articles
            </h3>
            <div className="space-y-4">
              {filteredArticles.map((article) => (
                <div key={article.id} className="p-4 border border-gray-200 rounded-lg hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-medium text-gray-900 flex-1 mr-4">{article.title}</h4>
                    <a
                      href={article.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:text-blue-800 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>
                  <p className="text-sm text-gray-600 mb-3 line-clamp-2">{article.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>{article.source}</span>
                      <span>•</span>
                      <span>{new Date(article.publishedAt).toLocaleDateString()}</span>
                    </div>
                    <div className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      {article.keyword}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Add Alert Modal */}
      {showAddAlert && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Google Alert</h3>
            <form className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Keyword</label>
                <input
                  type="text"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter keyword to monitor..."
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent">
                  <option value="Technology">Technology</option>
                  <option value="Marketing">Marketing</option>
                  <option value="Business">Business</option>
                  <option value="Education">Education</option>
                  <option value="Entertainment">Entertainment</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">RSS Feed URL</label>
                <input
                  type="url"
                  className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://www.google.com/alerts/feeds/..."
                />
              </div>
              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAlert(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Alert
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
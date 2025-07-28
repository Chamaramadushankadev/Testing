import React, { useState, useEffect } from 'react';
import { Plus, Quote, ChevronLeft, ChevronRight, Heart, Edit3, Trash2, X } from 'lucide-react';
import { quotesAPI } from '../../services/api';

interface Quote {
  id: string;
  text: string;
  author: string;
  category: string;
  isDefault: boolean;
  tags: string[];
}
 
export const MotivationalQuotes: React.FC = () => {
  const [quotes, setQuotes] = useState<Quote[]>([]);
  const [currentQuoteIndex, setCurrentQuoteIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showManageModal, setShowManageModal] = useState(false);
  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);

  useEffect(() => {
    loadQuotes();
  }, []);

  // Rotate quotes every minute
  useEffect(() => {
    if (quotes.length > 1) {
      const interval = setInterval(() => {
        setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
      }, 60000); // 60 seconds

      return () => clearInterval(interval);
    }
  }, [quotes.length]);

  const loadQuotes = async () => {
    try {
      setLoading(true);
      const response = await quotesAPI.getAll();
      setQuotes(response.data || []);
    } catch (error) {
      console.error('Error loading quotes:', error);
      // Fallback quote if API fails
      setQuotes([{
        id: 'fallback',
        text: "The way to get started is to quit talking and begin doing.",
        author: "Walt Disney",
        category: 'motivation',
        isDefault: true,
        tags: []
      }]);
    } finally {
      setLoading(false);
    }
  };

  const handleAddQuote = async (formData: FormData) => {
    try {
      const quoteData = {
        text: formData.get('text') as string,
        author: formData.get('author') as string,
        category: formData.get('category') as string || 'motivation',
        tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(t => t)
      };

      const response = await quotesAPI.create(quoteData);
      setQuotes([response.data, ...quotes]);
      setShowAddModal(false);
    } catch (error) {
      console.error('Error adding quote:', error);
    }
  };

  const handleUpdateQuote = async (formData: FormData) => {
    if (!editingQuote) return;

    try {
      const quoteData = {
        text: formData.get('text') as string,
        author: formData.get('author') as string,
        category: formData.get('category') as string || 'motivation',
        tags: (formData.get('tags') as string || '').split(',').map(t => t.trim()).filter(t => t)
      };

      const response = await quotesAPI.update(editingQuote.id, quoteData);
      setQuotes(quotes.map(q => q.id === editingQuote.id ? response.data : q));
      setEditingQuote(null);
    } catch (error) {
      console.error('Error updating quote:', error);
    }
  };

  const handleDeleteQuote = async (quoteId: string) => {
    if (!window.confirm('Are you sure you want to delete this quote?')) return;

    try {
      await quotesAPI.delete(quoteId);
      setQuotes(quotes.filter(q => q.id !== quoteId));
      
      // Adjust current index if needed
      if (currentQuoteIndex >= quotes.length - 1) {
        setCurrentQuoteIndex(0);
      }
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const nextQuote = () => {
    setCurrentQuoteIndex((prev) => (prev + 1) % quotes.length);
  };

  const prevQuote = () => {
    setCurrentQuoteIndex((prev) => (prev - 1 + quotes.length) % quotes.length);
  };

  const currentQuote = quotes[currentQuoteIndex];

  if (loading) {
    return (
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white">
        <div className="animate-pulse">
          <div className="h-4 bg-white bg-opacity-30 rounded w-3/4 mb-2"></div>
          <div className="h-3 bg-white bg-opacity-20 rounded w-1/2"></div>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl p-6 text-white relative overflow-hidden">
        {/* Background Pattern */}
        <div className="absolute inset-0 opacity-10">
          <Quote className="w-32 h-32 absolute -top-8 -right-8 transform rotate-12" />
        </div>

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Quote className="w-5 h-5" />
              <span className="text-sm font-medium opacity-90">Daily Inspiration</span>
            </div>
            
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowManageModal(true)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Manage Quotes"
              >
                <Edit3 className="w-4 h-4" />
              </button>
              <button
                onClick={() => setShowAddModal(true)}
                className="p-1.5 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
                title="Add Quote"
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          </div>

          {currentQuote && (
            <div className="space-y-3">
              <blockquote className="text-lg font-medium leading-relaxed">
                "{currentQuote.text}"
              </blockquote>
              <cite className="text-sm opacity-90 not-italic">
                — {currentQuote.author}
              </cite>
            </div>
          )}

          {/* Navigation */}
          {quotes.length > 1 && (
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={prevQuote}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              
              <div className="flex items-center space-x-2">
                {quotes.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentQuoteIndex(index)}
                    className={`w-2 h-2 rounded-full transition-all ${
                      index === currentQuoteIndex 
                        ? 'bg-white' 
                        : 'bg-white bg-opacity-40 hover:bg-opacity-60'
                    }`}
                  />
                ))}
              </div>
              
              <button
                onClick={nextQuote}
                className="p-2 hover:bg-white hover:bg-opacity-20 rounded-lg transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Add Quote Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-md">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Add Motivational Quote</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <form 
              onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                handleAddQuote(formData);
              }}
              className="space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quote Text</label>
                <textarea
                  name="text"
                  rows={3}
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Enter your motivational quote..."
                  required
                  maxLength={500}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Author</label>
                <input
                  type="text"
                  name="author"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="Quote author"
                  required
                  maxLength={100}
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Category</label>
                <select
                  name="category"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="motivation">Motivation</option>
                  <option value="productivity">Productivity</option>
                  <option value="success">Success</option>
                  <option value="inspiration">Inspiration</option>
                  <option value="leadership">Leadership</option>
                  <option value="creativity">Creativity</option>
                  <option value="general">General</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Tags (comma-separated)</label>
                <input
                  type="text"
                  name="tags"
                  className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="motivation, success, goals"
                />
              </div>

              <div className="flex space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Add Quote
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Manage Quotes Modal */}
      {showManageModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white">Manage Quotes</h3>
              <button
                onClick={() => {
                  setShowManageModal(false);
                  setEditingQuote(null);
                }}
                className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {editingQuote ? (
              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleUpdateQuote(formData);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Quote Text</label>
                  <textarea
                    name="text"
                    rows={3}
                    defaultValue={editingQuote.text}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={500}
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Author</label>
                  <input
                    type="text"
                    name="author"
                    defaultValue={editingQuote.author}
                    className="w-full border border-gray-300 dark:border-gray-600 rounded-lg px-4 py-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                    maxLength={100}
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={() => setEditingQuote(null)}
                    className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Update Quote
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-3">
                {quotes.filter(q => !q.isDefault).map((quote) => (
                  <div key={quote.id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <blockquote className="text-gray-900 dark:text-white font-medium mb-1">
                          "{quote.text}"
                        </blockquote>
                        <cite className="text-sm text-gray-600 dark:text-gray-400 not-italic">
                          — {quote.author}
                        </cite>
                        <div className="flex items-center space-x-2 mt-2">
                          <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-400 rounded-full text-xs">
                            {quote.category}
                          </span>
                          {quote.tags.map((tag, index) => (
                            <span key={index} className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full text-xs">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2 ml-4">
                        <button
                          onClick={() => setEditingQuote(quote)}
                          className="p-2 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuote(quote.id)}
                          className="p-2 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {quotes.filter(q => !q.isDefault).length === 0 && (
                  <div className="text-center py-8">
                    <Quote className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500 dark:text-gray-400">No custom quotes yet</p>
                    <button
                      onClick={() => {
                        setShowManageModal(false);
                        setShowAddModal(true);
                      }}
                      className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                    >
                      Add Your First Quote
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};
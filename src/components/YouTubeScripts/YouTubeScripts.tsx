import React, { useState } from 'react';
import { Video, Wand2, Copy, Download, Sparkles, Clock, Tag } from 'lucide-react';
import { YouTubeScript } from '../../types';
import { mockScripts } from '../../data/mockData';

export const YouTubeScripts: React.FC = () => {
  const [scripts, setScripts] = useState<YouTubeScript[]>(mockScripts);
  const [showGenerator, setShowGenerator] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [selectedTone, setSelectedTone] = useState<'witty' | 'emotional' | 'informative' | 'casual'>('informative');
  const [topic, setTopic] = useState('');
  const [keywords, setKeywords] = useState('');

  const toneOptions = [
    { value: 'witty', label: 'Witty & Fun', description: 'Playful and engaging' },
    { value: 'emotional', label: 'Emotional', description: 'Heart-touching and inspiring' },
    { value: 'informative', label: 'Informative', description: 'Educational and clear' },
    { value: 'casual', label: 'Casual', description: 'Relaxed and conversational' }
  ];

  const handleGenerateScript = async () => {
    setGenerating(true);
    
    // Simulate AI generation
    setTimeout(() => {
      const newScript: YouTubeScript = {
        id: Date.now().toString(),
        title: `${topic} - AI Generated Script`,
        content: generateMockScript(topic, selectedTone),
        tone: selectedTone,
        source: `Generated from: ${topic}`,
        createdAt: new Date(),
        keywords: keywords.split(',').map(k => k.trim()).filter(k => k)
      };
      
      setScripts([newScript, ...scripts]);
      setGenerating(false);
      setShowGenerator(false);
      setTopic('');
      setKeywords('');
    }, 2000);
  };

  const generateMockScript = (topic: string, tone: string) => {
    const hooks = {
      witty: `🎯 **Hook**: "What if I told you that ${topic} could change everything... in just 60 seconds?"`,
      emotional: `💫 **Hook**: "This ${topic} story gave me chills... and it might change your life too."`,
      informative: `📚 **Hook**: "Here's everything you need to know about ${topic} in under a minute."`,
      casual: `👋 **Hook**: "Hey everyone! Let's talk about why ${topic} is actually pretty amazing..."`
    };

    return `${hooks[tone as keyof typeof hooks]}

**Value**: 
- Key point 1: ${topic} fundamentals
- Key point 2: Practical applications  
- Key point 3: Real-world examples
- Key point 4: Pro tips and tricks

**CTA**: "Which tip surprised you most? Drop a comment below and don't forget to subscribe for more content like this!"

---
*Generated with AI • ${tone} tone • ${new Date().toLocaleDateString()}*`;
  };

  const copyToClipboard = (content: string) => {
    navigator.clipboard.writeText(content);
    // Show toast notification here
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
        
        <button
          onClick={() => setShowGenerator(true)}
          className="bg-gradient-to-r from-purple-600 to-blue-600 text-white px-6 py-3 rounded-lg hover:from-purple-700 hover:to-blue-700 transition-all flex items-center space-x-2 shadow-lg"
        >
          <Wand2 className="w-5 h-5" />
          <span>Generate Script</span>
        </button>
      </div>

      {/* Scripts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {scripts.map((script) => (
          <div key={script.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{script.title}</h3>
                <div className="flex items-center space-x-2 mb-3">
                  <div className={`px-2 py-1 rounded-full text-xs font-medium ${getToneColor(script.tone)}`}>
                    {script.tone}
                  </div>
                  <div className="flex items-center text-xs text-gray-500">
                    <Clock className="w-3 h-3 mr-1" />
                    {new Date(script.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            </div>
            
            <div className="bg-gray-50 rounded-lg p-4 mb-4 max-h-64 overflow-y-auto">
              <pre className="text-sm text-gray-700 whitespace-pre-wrap font-mono">
                {script.content}
              </pre>
            </div>
            
            <div className="flex items-center justify-between">
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
        ))}
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
                  disabled={generating || !topic}
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
    </div>
  );
};